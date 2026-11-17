import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import { emptyLibrary, librarySchema, phaseDefinitionSchema, pipelineSchema, readWorkspace, ruleInputSchema, workspaceNameSchema, templateInputSchema, templateSchema } from './schemas.ts'
import type { Acknowledgement, Library, Project, SavedPipeline, Workspace, ProcurementTemplate } from './schemas.ts'
import { workspaceStorageKeys } from './workspace-storage.ts'

export const DATABASE_NAME = 'ltpp-app-local'

interface LocalDatabase extends DBSchema {
  workspaces: { key: string; value: Workspace }
  libraries: { key: string; value: Library }
  pipelines: { key: string; value: SavedPipeline; indexes: { 'by-workspace': string } }
  templates: { key: string; value: ProcurementTemplate; indexes: { 'by-workspace': string } }
}

export class LocalDataError extends Error {}

let connection: Promise<IDBPDatabase<LocalDatabase>> | undefined

function database() {
  connection ??= openDB<LocalDatabase>(DATABASE_NAME, 3, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) db.createObjectStore('workspaces', { keyPath: 'id' })
      if (oldVersion < 2) {
        db.createObjectStore('libraries', { keyPath: 'workspaceId' })
        db.createObjectStore('pipelines', { keyPath: 'id' }).createIndex('by-workspace', 'workspaceId')
      }
      if (oldVersion < 3) db.createObjectStore('templates', { keyPath: 'id' }).createIndex('by-workspace', 'workspaceId')
    },
    blocking() {
      void connection?.then(db => db.close())
      connection = undefined
    },
    terminated() {
      connection = undefined
    },
  }).catch(() => {
    connection = undefined
    throw new LocalDataError('Browser storage could not be opened. Check that this browser allows site storage, then try again. Your saved data has been left unchanged.')
  })
  return connection
}

function checked<T>(schema: { parse: (value: unknown) => T }, value: unknown, label: string): T {
  try { return schema.parse(value) }
  catch { throw new LocalDataError(`${label} could not be read. It may be damaged or from another app version. Your saved data has been left unchanged.`) }
}

function checkedLibrary(value: unknown, workspaceId: string): Library {
  const library = value === undefined ? emptyLibrary(workspaceId) : checked(librarySchema, value, 'Saved Library data')
  if (library.workspaceId !== workspaceId) throw new LocalDataError('The Library does not belong to this workspace.')
  return library
}

async function updateLibrary(workspaceId: string, update: (library: Library) => Library, expectedRevision?: number, removingPhase?: string) {
  const db = await database()
  const tx = db.transaction(['workspaces', 'libraries', 'pipelines', 'templates'], 'readwrite')
  try {
    checkedWorkspace(await tx.objectStore('workspaces').get(workspaceId))
    const previous = checkedLibrary(await tx.objectStore('libraries').get(workspaceId), workspaceId)
    if (expectedRevision !== undefined && previous.revision !== expectedRevision) throw new LocalDataError('The Library changed in another tab. Reopen the latest details before saving. Your inputs are still here.')
    if (removingPhase) {
      const pipelines = await tx.objectStore('pipelines').index('by-workspace').getAll(workspaceId)
      const templates = await tx.objectStore('templates').index('by-workspace').getAll(workspaceId)
      if (pipelines.some(record => record.plans.some(plan => plan.phases.some(phase => phase.libraryPhaseId === removingPhase))) || templates.some(record => record.phases.some(phase => phase.libraryPhaseId === removingPhase))) throw new LocalDataError('This phase is used by a saved pipeline plan or template. Remove those references before deleting it.')
    }
    const next = librarySchema.parse({ ...update(previous), revision: previous.revision + 1 })
    await tx.objectStore('libraries').put(next)
    await tx.done
    return next
  } catch (error) {
    try { tx.abort() } catch { /* Already completed or aborted. */ }
    await tx.done.catch(() => {})
    if (error instanceof LocalDataError) throw error
    throw new LocalDataError('The Library could not be saved. Your existing Library is unchanged. Check browser storage and try again.')
  }
}

export interface PipelineSave {
  id: string; workspaceId: string; expectedRevision: number; expectedLibraryRevision: number
  name: string; note?: string; plans: Project[]; acknowledgements: Acknowledgement[]
}

function checkedWorkspace(value: unknown) {
  try {
    return readWorkspace(value)
  } catch {
    throw new LocalDataError('Saved workspace data could not be read. It may be damaged or from another app version. Your saved data has been left unchanged.')
  }
}

function orderedWorkspaces(records: Workspace[]) {
  const chronological = records.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
  const positions = new Map(chronological.map((record, index) => [record.id, index]))
  return chronological.toSorted((a, b) => (a.displayOrder ?? positions.get(a.id)!) - (b.displayOrder ?? positions.get(b.id)!))
}

export const localData = {
  async listTemplates(workspaceId: string): Promise<ProcurementTemplate[]> {
    try {
      const db = await database(); checkedWorkspace(await db.get('workspaces', workspaceId))
      return (await db.getAllFromIndex('templates', 'by-workspace', workspaceId)).map(value => checked(templateSchema, value, 'Saved template')).sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) { if (error instanceof LocalDataError) throw error; throw new LocalDataError('Templates could not be loaded. Your saved data is unchanged. Try again.') }
  },

  async saveTemplate(workspaceId: string, id: string, expectedRevision: number, expectedLibraryRevision: number, input: unknown): Promise<ProcurementTemplate> {
    const values = templateInputSchema.parse(input)
    const tx = (await database()).transaction(['workspaces', 'libraries', 'templates'], 'readwrite')
    try {
      checkedWorkspace(await tx.objectStore('workspaces').get(workspaceId))
      const library = checkedLibrary(await tx.objectStore('libraries').get(workspaceId), workspaceId)
      if (library.revision !== expectedLibraryRevision) throw new LocalDataError('The Library changed. Reopen the template to review current defaults. Your inputs are still here.')
      const previous = await tx.objectStore('templates').get(id)
      if (previous ? previous.workspaceId !== workspaceId || previous.revision !== expectedRevision : expectedRevision !== 0) throw new LocalDataError('This template changed in another tab. Reopen the latest template before saving.')
      const others = await tx.objectStore('templates').index('by-workspace').getAll(workspaceId)
      if (others.some(value => value.id !== id && value.name.toLowerCase() === values.name.toLowerCase())) throw new LocalDataError('A template with this name already exists.')
      if (values.phases.some(phase => phase.kind === 'phase' && !library.phases.some(item => item.id === phase.libraryPhaseId))) throw new LocalDataError('Choose phases from this workspace Library.')
      const record = templateSchema.parse({ ...values, id, workspaceId, revision: expectedRevision + 1, schemaVersion: 1 })
      await tx.objectStore('templates').put(record); await tx.done; return record
    } catch (error) { try { tx.abort() } catch { /* Already aborted. */ } await tx.done.catch(() => {}); if (error instanceof LocalDataError) throw error; throw new LocalDataError('The template could not be saved. Your inputs and saved data are unchanged. Try again.') }
  },

  async deleteTemplate(workspaceId: string, id: string, revision: number) {
    const tx = (await database()).transaction(['workspaces', 'templates'], 'readwrite')
    try {
      checkedWorkspace(await tx.objectStore('workspaces').get(workspaceId))
      const value = await tx.objectStore('templates').get(id)
      if (!value || value.workspaceId !== workspaceId || value.revision !== revision) throw new LocalDataError('The template changed. Reopen the latest details before deleting.')
      await tx.objectStore('templates').delete(id); await tx.done
    } catch (error) { try { tx.abort() } catch { /* Already aborted. */ } await tx.done.catch(() => {}); if (error instanceof LocalDataError) throw error; throw new LocalDataError('The template could not be deleted. Try again.') }
  },

  async editPhase(workspaceId: string, id: string, revision: number, input: unknown) {
    const { checks, ...values } = phaseDefinitionSchema.parse(input)
    return updateLibrary(workspaceId, library => {
      if (!library.phases.some(phase => phase.id === id)) throw new LocalDataError('This phase is no longer in the Library.')
      if (library.phases.some(phase => phase.id !== id && phase.name.toLowerCase() === values.name.toLowerCase())) throw new LocalDataError('A phase with this name already exists in this Library.')
      if (new Set(checks.map(check => check.target === 'self' ? id : check.target)).size !== checks.length) throw new LocalDataError('Define only one clash rule for each phase pair.')
      const rules = checks.map(check => {
        const target = check.target === 'self' ? id : check.target
        if (!library.phases.some(phase => phase.id === target)) throw new LocalDataError('Choose phases from this workspace Library.')
        return { id: library.rules.find(rule => [rule.a, rule.b].sort().join(':') === [id, target].sort().join(':'))?.id ?? crypto.randomUUID(), a: id, b: target, severity: check.severity, reason: check.reason }
      })
      return { ...library, phases: library.phases.map(phase => phase.id === id ? { ...values, id } : phase), rules: [...library.rules.filter(rule => rule.a !== id && rule.b !== id), ...rules] }
    }, revision)
  },

  async deletePhase(workspaceId: string, id: string, revision: number) {
    return updateLibrary(workspaceId, library => ({ ...library, phases: library.phases.filter(phase => phase.id !== id), rules: library.rules.filter(rule => rule.a !== id && rule.b !== id) }), revision, id)
  },
  async listWorkspaces(): Promise<Workspace[]> {
    try {
      const records = await (await database()).getAll('workspaces')
      return orderedWorkspaces(records.map(checkedWorkspace))
    } catch (error) {
      if (error instanceof LocalDataError) throw error
      throw new LocalDataError('Workspaces could not be loaded from this browser. Try again. Your saved data has been left unchanged.')
    }
  },

  async reorderWorkspace(id: string, target: number, expectedOrder: string[]): Promise<Workspace[]> {
    const tx = (await database()).transaction('workspaces', 'readwrite')
    try {
      const records = orderedWorkspaces((await tx.store.getAll()).map(checkedWorkspace))
      if (JSON.stringify(records.map(record => record.id)) !== JSON.stringify(expectedOrder)) throw new LocalDataError('The workspace list changed in another tab. Refresh workspaces before changing the order.')
      const index = records.findIndex(record => record.id === id)
      if (!Number.isInteger(target) || index < 0 || target < 0 || target >= records.length) throw new LocalDataError('Choose a valid position for this workspace.')
      const [record] = records.splice(index, 1)
      records.splice(target, 0, record)
      const ordered = records.map((record, displayOrder) => ({ ...record, displayOrder }))
      await Promise.all(ordered.map(record => tx.store.put(record)))
      await tx.done
      return ordered
    } catch (error) {
      try { tx.abort() } catch { /* Already completed or aborted. */ }
      await tx.done.catch(() => {})
      if (error instanceof LocalDataError) throw error
      throw new LocalDataError('The workspace order could not be saved. The previous order is unchanged. Try again.')
    }
  },

  async deleteWorkspace(id: string, expectedName: string): Promise<void> {
    const tx = (await database()).transaction(['workspaces', 'libraries', 'pipelines', 'templates'], 'readwrite')
    const localEntries: [string, string][] = []
    try {
      const workspace = await tx.objectStore('workspaces').get(id)
      if (!workspace || checkedWorkspace(workspace).name !== expectedName) throw new LocalDataError('This workspace changed or was already deleted. Refresh workspaces before trying again.')
      const [plans, templates] = await Promise.all([
        tx.objectStore('pipelines').index('by-workspace').getAllKeys(id),
        tx.objectStore('templates').index('by-workspace').getAllKeys(id),
      ])
      // Capture local-only state before removal so an aborted database write
      // can restore it. No other workspace keys are read or cleared.
      for (const key of Object.values(workspaceStorageKeys(id))) {
        const value = localStorage.getItem(key)
        if (value !== null) localEntries.push([key, value])
      }
      for (const [key] of localEntries) localStorage.removeItem(key)
      await Promise.all([
        ...plans.map(key => tx.objectStore('pipelines').delete(key)),
        ...templates.map(key => tx.objectStore('templates').delete(key)),
        tx.objectStore('libraries').delete(id), tx.objectStore('workspaces').delete(id),
      ])
      await tx.done
    } catch (error) {
      try { tx.abort() } catch { /* Already completed or aborted. */ }
      await tx.done.catch(() => {})
      let localRestored = true
      for (const [key, value] of localEntries) {
        try { if (localStorage.getItem(key) !== value) localStorage.setItem(key, value) } catch { localRestored = false }
      }
      if (!localRestored) throw new LocalDataError('The workspace could not be deleted. Its saved plans, Library and templates are unchanged, but some local draft or preference data could not be restored.')
      if (error instanceof LocalDataError) throw error
      throw new LocalDataError('The workspace could not be deleted. Its saved contents and local draft are unchanged. Check browser storage and try again.')
    }
  },

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    try {
      const db = await database(), record = await db.get('workspaces', id)
      if (record === undefined) return undefined
      const workspace = checkedWorkspace(record)
      if (workspace.currentBaselineId) return workspace
      // Carry forward the former selected setup candidate (or the sole saved
      // plan). Recheck inside one transaction so another tab's live choice wins.
      const tx = db.transaction(['workspaces', 'pipelines'], 'readwrite')
      try {
        const current = checkedWorkspace(await tx.objectStore('workspaces').get(id))
        const records = (await tx.objectStore('pipelines').index('by-workspace').getAll(id)).map(value => checked(pipelineSchema, value, 'Saved pipeline plan data'))
        const candidate = records.find(value => value.id === current.setupPipelineId) ?? (records.length === 1 ? records[0] : undefined)
        const result = !current.currentBaselineId && candidate ? { ...current, currentBaselineId: candidate.id } : current
        if (result !== current) await tx.objectStore('workspaces').put(result)
        await tx.done
        return result
      } catch (error) {
        try { tx.abort() } catch { /* Already completed or aborted. */ }
        await tx.done.catch(() => {})
        throw error
      }
    } catch (error) {
      if (error instanceof LocalDataError) throw error
      throw new LocalDataError('This workspace could not be loaded. Try again. Your saved data has been left unchanged.')
    }
  },

  async createWorkspace(name: string): Promise<Workspace> {
    const workspace: Workspace = {
      schemaVersion: 1,
      id: crypto.randomUUID(),
      name: workspaceNameSchema.parse(name),
      createdAt: new Date().toISOString(),
      createdBy: 'local-user',
    }
    const tx = (await database()).transaction('workspaces', 'readwrite')
    try {
      const existing = orderedWorkspaces((await tx.store.getAll()).map(checkedWorkspace))
      workspace.displayOrder = Math.max(-1, ...existing.map((record, index) => record.displayOrder ?? index)) + 1
      await tx.store.add(workspace)
      await tx.done
      return workspace
    } catch {
      try { tx.abort() } catch { /* Already completed or aborted. */ }
      await tx.done.catch(() => {})
      throw new LocalDataError('The workspace could not be saved. Your browser may have run out of storage or blocked saving. Your existing workspaces are unchanged. Try again.')
    }
  },

  async getLibrary(workspaceId: string): Promise<Library> {
    try {
      const db = await database()
      checkedWorkspace(await db.get('workspaces', workspaceId))
      return checkedLibrary(await db.get('libraries', workspaceId), workspaceId)
    } catch (error) {
      if (error instanceof LocalDataError) throw error
      throw new LocalDataError('The Library could not be loaded. Your saved data is unchanged. Try again.')
    }
  },

  async createPhase(workspaceId: string, input: unknown) {
    const { checks, ...definition } = phaseDefinitionSchema.parse(input)
    const phase = { ...definition, id: crypto.randomUUID() }
    return updateLibrary(workspaceId, library => {
      if (library.phases.some(item => item.name.toLowerCase() === phase.name.toLowerCase())) throw new LocalDataError('A phase with this name already exists in this Library.')
      if (checks.some(check => check.target !== 'self' && !library.phases.some(item => item.id === check.target))) throw new LocalDataError('Choose phases from this workspace Library.')
      if (new Set(checks.map(check => check.target)).size !== checks.length) throw new LocalDataError('Define only one clash rule for each phase pair.')
      const rules = checks.map(check => ({ id: crypto.randomUUID(), a: phase.id, b: check.target === 'self' ? phase.id : check.target, severity: check.severity, reason: check.reason }))
      return { ...library, phases: [...library.phases, phase], rules: [...library.rules, ...rules] }
    })
  },

  async createRule(workspaceId: string, input: unknown) {
    const rule = { ...ruleInputSchema.parse(input), id: crypto.randomUUID() }
    return updateLibrary(workspaceId, library => {
      if (!library.phases.some(phase => phase.id === rule.a) || !library.phases.some(phase => phase.id === rule.b)) throw new LocalDataError('Choose phases from this workspace Library.')
      const pair = [rule.a, rule.b].sort().join(':')
      if (library.rules.some(item => [item.a, item.b].sort().join(':') === pair)) throw new LocalDataError('A clash rule already exists for these two phases.')
      return { ...library, rules: [...library.rules, rule] }
    })
  },

  async listPipelines(workspaceId: string): Promise<SavedPipeline[]> {
    try {
      const records = await (await database()).getAllFromIndex('pipelines', 'by-workspace', workspaceId)
      return records.map(record => checked(pipelineSchema, record, 'Saved pipeline plan data')).sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    } catch (error) {
      if (error instanceof LocalDataError) throw error
      throw new LocalDataError('Saved pipeline plans could not be loaded. Your saved data is unchanged. Try again.')
    }
  },

  async getPipeline(workspaceId: string, id: string): Promise<SavedPipeline | undefined> {
    try {
      const value = await (await database()).get('pipelines', id)
      if (!value) return undefined
      const record = checked(pipelineSchema, value, 'Saved pipeline plan data')
      return record.workspaceId === workspaceId ? record : undefined
    } catch (error) {
      if (error instanceof LocalDataError) throw error
      throw new LocalDataError('The saved pipeline plan could not be loaded. Your saved data is unchanged. Try again.')
    }
  },

  async makeLive(workspaceId: string, id: string, expectedRevision: number, expectedLiveId: string | null): Promise<Workspace> {
    const tx = (await database()).transaction(['workspaces', 'pipelines'], 'readwrite')
    try {
      const workspace = checkedWorkspace(await tx.objectStore('workspaces').get(workspaceId))
      if ((workspace.currentBaselineId ?? null) !== expectedLiveId) throw new LocalDataError('The live plan changed in another tab. Close this confirmation and reopen it before trying again.')
      const record = checked(pipelineSchema, await tx.objectStore('pipelines').get(id), 'Saved pipeline plan data')
      if (record.workspaceId !== workspaceId || record.revision !== expectedRevision) throw new LocalDataError('The selected pipeline plan changed. Close this confirmation and reopen the latest saved plan.')
      const result = { ...workspace, currentBaselineId: id }
      await tx.objectStore('workspaces').put(result)
      await tx.done
      return result
    } catch (error) {
      try { tx.abort() } catch { /* Already completed or aborted. */ }
      await tx.done.catch(() => {})
      if (error instanceof LocalDataError) throw error
      throw new LocalDataError('The live plan could not be changed. Your saved plans are unchanged. Check browser storage and try again.')
    }
  },

  async savePipeline(input: PipelineSave): Promise<SavedPipeline> {
    const parsed = pipelineSchema.safeParse({
      schemaVersion: 1, id: input.id, workspaceId: input.workspaceId, revision: input.expectedRevision + 1,
      name: input.name, note: input.note, plans: input.plans, acknowledgements: input.acknowledgements,
      savedAt: new Date().toISOString(), savedBy: 'Local user',
    })
    if (!parsed.success) throw new LocalDataError(parsed.error.issues[0]?.message ?? 'Review the pipeline plan details before saving.')
    const candidate = parsed.data
    const tx = (await database()).transaction(['workspaces', 'libraries', 'pipelines'], 'readwrite')
    try {
      const workspace = checkedWorkspace(await tx.objectStore('workspaces').get(input.workspaceId))
      const library = checkedLibrary(await tx.objectStore('libraries').get(input.workspaceId), input.workspaceId)
      if (library.revision !== input.expectedLibraryRevision) throw new LocalDataError('The Library changed. Refresh the clash checks and review them before saving. Your working changes are still here.')
      const previous = await tx.objectStore('pipelines').get(input.id)
      if (previous && (previous.workspaceId !== input.workspaceId || checked(pipelineSchema, previous, 'Saved pipeline plan data').revision !== input.expectedRevision) || !previous && input.expectedRevision !== 0) throw new LocalDataError('This saved pipeline plan changed in another tab. Your working changes are still here. Use Save as to keep a separate copy, or cancel and reopen the latest saved contents.')
      const others = await tx.objectStore('pipelines').index('by-workspace').getAll(input.workspaceId)
      if (others.some(record => record.id !== input.id && record.name.toLowerCase() === candidate.name.toLowerCase())) throw new LocalDataError('A pipeline plan with this name already exists. Choose a different name.')
      if (candidate.plans.some(plan => plan.phases.some(phase => phase.kind === 'phase' && !library.phases.some(item => item.id === phase.libraryPhaseId)))) throw new LocalDataError('A phase is no longer in this workspace Library. Review the procurement before saving.')
      const stored = previous?.confirmation ? { ...candidate, confirmation: previous.confirmation } : candidate
      await tx.objectStore('pipelines').put(stored)
      if (!workspace.currentBaselineId) {
        const firstLive = others.find(record => record.id === workspace.setupPipelineId)?.id ?? candidate.id
        await tx.objectStore('workspaces').put({ ...workspace, currentBaselineId: firstLive })
      }
      await tx.done
      return stored
    } catch (error) {
      try { tx.abort() } catch { /* Already completed or aborted. */ }
      await tx.done.catch(() => {})
      if (error instanceof LocalDataError) throw error
      throw new LocalDataError('The pipeline plan could not be saved. Your saved record and working changes are unchanged. Check browser storage and try again.')
    }
  },
}
