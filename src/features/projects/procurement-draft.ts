import { z } from 'zod'
import type { WorkingPipeline } from '../../app/workspace-context.ts'
import { acknowledgementSchema, pipelineSchema, projectSchema } from '../../data/schemas.ts'
import type { Project, ProjectForm } from '../../data/schemas.ts'
import { workspaceStorageKeys } from '../../data/workspace-storage.ts'

// Drafts accept incomplete input. Normal form validation still runs at Preview.
const number = z.number().nullable()
const formSchema = z.object({
  name: z.string(), anchorDate: z.string(), anchorId: number,
  phases: z.array(z.object({
    id: z.number().int().positive(), name: z.string(), kind: z.enum(['phase', 'milestone']),
    weeks: number, amount: number, relation: z.enum(['after', 'overlap', 'gap']),
    libraryPhaseId: z.string(), color: z.string(), durationInherited: z.boolean(),
  })),
})
const draftSchema = z.object({
  version: z.literal(1), id: z.uuid(), workspaceId: z.uuid(), updatedAt: z.iso.datetime(),
  projectId: z.uuid(), original: projectSchema.optional(), nextId: z.number().int().positive(),
  context: z.object({ saved: pipelineSchema.nullable(), plans: z.array(projectSchema), acknowledgements: z.array(acknowledgementSchema) }),
  values: formSchema, reviewed: z.array(z.tuple([z.number(), z.number().nullable()])),
  movement: z.object({ before: formSchema, first: z.number(), last: z.number(), weeks: z.number() }).nullable(),
})

export type ProcurementDraft = {
  version: 1; id: string; workspaceId: string; updatedAt: string; projectId: string; original?: Project
  nextId: number; context: WorkingPipeline; values: ProjectForm
  reviewed: [number, number | null][]
  movement: { before: ProjectForm; first: number; last: number; weeks: number } | null
}
const key = (workspaceId: string) => workspaceStorageKeys(workspaceId).procurementDraft
const inputValues = (value: z.infer<typeof formSchema>): ProjectForm => ({ ...value, anchorId: value.anchorId ?? NaN, phases: value.phases.map(item => ({ ...item, weeks: item.weeks ?? NaN, amount: item.amount ?? NaN })) })

export function readProcurementDraft(workspaceId: string): ProcurementDraft | null {
  const raw = localStorage.getItem(key(workspaceId))
  if (!raw) return null
  const draft = draftSchema.parse(JSON.parse(raw))
  if (draft.workspaceId !== workspaceId || draft.context.saved && draft.context.saved.workspaceId !== workspaceId) throw new Error('The draft belongs to another workspace.')
  return { ...draft, values: inputValues(draft.values), movement: draft.movement && { ...draft.movement, before: inputValues(draft.movement.before) } }
}

export function writeProcurementDraft(draft: ProcurementDraft) {
  localStorage.setItem(key(draft.workspaceId), JSON.stringify(draft))
}

export function clearProcurementDraft(workspaceId: string, id: string) {
  const raw = localStorage.getItem(key(workspaceId))
  if (raw && JSON.parse(raw).id === id) localStorage.removeItem(key(workspaceId))
}
