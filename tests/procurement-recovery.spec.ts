import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addMilestone, browsePhase, confirmProcurement, moveRow } from './editor-actions.ts'

async function setup(page: Page, saved = false) {
  await page.goto('/workspaces')
  return page.evaluate(async saved => {
    const dataPath = '/src/data/local-data.ts', schedulePath = '/src/domain/project.ts'
    const { localData } = await import(dataPath), { scheduleProject } = await import(schedulePath)
    const workspace = await localData.createWorkspace('Recovery team')
    let library
    for (const name of ['Evaluation', 'Moderation', 'Dialogue']) library = await localData.createPhase(workspace.id, { name, weeks: 4, color: '#315ed4', checks: [] })
    localStorage.setItem(`ltpp-app:welcome-dismissed:${workspace.id}`, '1')
    if (!saved) return { workspaceId: workspace.id, pipelineId: '', projectId: '' }
    const phase = library!.phases[0]
    const project = scheduleProject({ id: crypto.randomUUID(), name: 'Existing procurement', anchor: Date.UTC(2032, 4, 12), planningAnchor: 0, anchorId: 2, anchorName: 'Go-live', nextPhaseId: 3, approvedBaseline: null, phases: [{ ...phase, id: 1, libraryPhaseId: phase.id, kind: 'phase', durationInherited: true, offset: 0, s: 0, e: 0 }, { id: 2, name: 'Go-live', kind: 'milestone', weeks: 0, libraryPhaseId: '', color: '#315ed4', durationInherited: false, offset: 0, s: 0, e: 0 }] })
    const record = await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: workspace.id, expectedRevision: 0, expectedLibraryRevision: library!.revision, name: 'Saved pipeline plan', note: 'Initial schedule', plans: [project], acknowledgements: [] })
    return { workspaceId: workspace.id, pipelineId: record.id, projectId: project.id }
  }, saved)
}
const key = (id: string) => `ltpp-app:procurement-draft:${id}`
async function draft(page: Page, id: string) { return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), key(id)) }
async function reload(page: Page) { page.once('dialog', dialog => void dialog.accept()); await page.reload() }
async function resume(page: Page) {
  await page.getByRole('dialog', { name: 'Resume unfinished procurement?', exact: true }).getByRole('button', { name: 'Resume draft', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Resume unfinished procurement?', exact: true })).toHaveCount(0)
}
async function start(page: Page, id: string) {
  await page.goto(`/workspaces/${id}/pipeline?edit=1&add=1`)
  await page.getByLabel('Procurement name', { exact: true }).fill('Draft procurement')
  await browsePhase(page, 'Evaluation')
}

test('unfinished Add survives repeated refreshes, including incomplete numeric input, with a prompt every time', async ({ page }) => {
  const { workspaceId } = await setup(page)
  await start(page, workspaceId)
  await page.getByLabel('Item 1 duration in weeks', { exact: true }).fill('')
  await reload(page)
  await expect(page.getByRole('dialog', { name: 'Resume unfinished procurement?' })).toBeVisible()
  await resume(page)
  await expect(page.getByLabel('Procurement name', { exact: true })).toHaveValue('Draft procurement')
  await expect(page.getByLabel('Item 1 duration in weeks', { exact: true })).toHaveValue('')
  await page.getByLabel('Item 1 duration in weeks', { exact: true }).fill('5')
  await reload(page); await resume(page)
  await expect(page.getByLabel('Item 1 duration in weeks', { exact: true })).toHaveValue('5')
  expect(await page.evaluate(async id => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.listPipelines(id) }, workspaceId)).toEqual([])
})

test('closing and returning to the workspace restores the correct Add context and requires another choice after refresh', async ({ page, context }) => {
  const { workspaceId } = await setup(page)
  await start(page, workspaceId)
  await page.close({ runBeforeUnload: false })
  const next = await context.newPage()
  await next.goto(`/workspaces/${workspaceId}/pipeline`)
  await resume(next)
  await expect(next.getByLabel('Procurement name', { exact: true })).toHaveValue('Draft procurement')
  await expect(next).toHaveURL(/\?edit=1&add=1$/)
  await reload(next)
  await expect(next.getByRole('dialog', { name: 'Resume unfinished procurement?' })).toBeVisible()
})

test('pending overlap review and next item identities survive recovery', async ({ page }) => {
  const { workspaceId } = await setup(page)
  await start(page, workspaceId)
  await browsePhase(page, 'Moderation'); await browsePhase(page, 'Dialogue')
  await page.getByRole('combobox', { name: 'Item 3 relationship', exact: true }).selectOption('overlap')
  await page.getByRole('spinbutton', { name: 'Overlap weeks', exact: true }).fill('2')
  await moveRow(page, 2, 1)
  const before = await page.locator('.relationship-note p').allTextContents()
  await reload(page); await resume(page)
  await expect(page.locator('.relationship-note p')).toHaveText(before)
  await page.getByRole('button', { name: 'Keep overlap with Evaluation', exact: true }).click()
  await browsePhase(page, 'Evaluation')
  expect((await draft(page, workspaceId)).values.phases.map((item: { id: number }) => item.id)).toEqual([1, 3, 2, 4])
})

test('applying a recovered Add clears its draft without saving the named pipeline plan or recovering later applied work', async ({ page }) => {
  const { workspaceId } = await setup(page)
  await start(page, workspaceId)
  await addMilestone(page, 'Go-live')
  await page.getByLabel('Anchor date', { exact: true }).fill('2032-05-12')
  await reload(page); await resume(page)
  await expect(page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
  await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
  await confirmProcurement(page)
  expect(await draft(page, workspaceId)).toBeNull()
  await reload(page)
  await expect(page.getByRole('dialog', { name: 'Resume unfinished procurement?' })).toHaveCount(0)
  expect(await draft(page, workspaceId)).toBeNull()
})

test('saved Edit resumes anchor and duration edits without restoring an obsolete lock', async ({ page, context }) => {
  const data = await setup(page, true), base = `/workspaces/${data.workspaceId}/pipeline/${data.pipelineId}?edit=1`
  await page.goto(base)
  await page.getByRole('button', { name: 'Existing procurement', exact: true }).click()
  await page.getByRole('button', { name: 'Edit details', exact: true }).click()
  const details = page.getByRole('dialog', { name: 'Edit procurement details', exact: true })
  await details.getByLabel('Procurement name', { exact: true }).fill('Changed procurement')
  await details.getByLabel('Anchor date', { exact: true }).fill('2032-06-18')
  await details.getByRole('button', { name: 'Use these details', exact: true }).click()
  await page.getByLabel('Item 1 duration in weeks', { exact: true }).fill('6')
  await page.close({ runBeforeUnload: false })
  const next = await context.newPage()
  await next.goto(`/workspaces/${data.workspaceId}/pipeline`)
  await next.evaluate(id => { const key = `ltpp-app:procurement-draft:${id}`; const old = JSON.parse(localStorage.getItem(key)!); localStorage.setItem(key, JSON.stringify({ ...old, locked: true })) }, data.workspaceId)
  await next.reload()
  await resume(next)
  await expect(next.getByRole('heading', { name: 'Edit procurement', exact: true })).toBeVisible()
  await expect(next.locator('.procurement-summary')).toContainText('Changed procurement')
  await expect(next.locator('.procurement-summary')).toContainText('18 Jun 2032')
  await expect(next.locator('.procurement-summary')).not.toContainText(/Locked|Unlocked/)
  await expect(next.getByLabel('Item 1 duration in weeks', { exact: true })).toHaveValue('6')
  const record = await next.evaluate(async data => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.getPipeline(data.workspaceId, data.pipelineId) }, data)
  expect(record!.revision).toBe(1); expect(record!.plans[0].name).toBe('Existing procurement'); expect(record!.plans[0].phases[0].weeks).toBe(4)
  await next.getByRole('button', { name: 'Cancel', exact: true }).click()
  await next.getByRole('button', { name: 'Discard procurement changes', exact: true }).click()
  expect(await draft(next, data.workspaceId)).toBeNull()
})

test('discard at recovery and navigation clears drafts while keeping Library phases', async ({ page }) => {
  const { workspaceId } = await setup(page)
  await start(page, workspaceId)
  await reload(page)
  await page.getByRole('button', { name: 'Discard draft', exact: true }).click()
  expect(await draft(page, workspaceId)).toBeNull()
  await expect(page.getByLabel('Procurement name', { exact: true })).toHaveValue('')
  await page.getByLabel('Procurement name', { exact: true }).fill('Another draft')
  await page.locator('.app-nav a').filter({ hasText: /^Library$/ }).evaluate(element => (element as HTMLAnchorElement).click())
  await page.getByRole('dialog', { name: 'Unsaved changes', exact: true }).getByRole('button', { name: 'Discard changes', exact: true }).click()
  expect(await draft(page, workspaceId)).toBeNull()
  await expect(page.getByRole('heading', { name: 'Templates and phase library', exact: true })).toBeVisible()
})

test('drafts are workspace scoped and corrupt data does not break the page', async ({ page, context }) => {
  const first = await setup(page)
  await start(page, first.workspaceId)
  await page.close({ runBeforeUnload: false })
  const next = await context.newPage(), second = await setup(next)
  await next.goto(`/workspaces/${second.workspaceId}/pipeline?edit=1&add=1`)
  await expect(next.getByRole('dialog', { name: 'Resume unfinished procurement?' })).toHaveCount(0)
  await next.evaluate(key => localStorage.setItem(key, '{bad JSON'), key(second.workspaceId))
  await next.reload()
  await expect(next.getByText(/A local procurement draft could not be read/)).toBeVisible()
  expect((await draft(next, first.workspaceId)).values.name).toBe('Draft procurement')
})

test('storage write failure gives a visible warning without clearing form values', async ({ page }) => {
  const { workspaceId } = await setup(page)
  await page.goto(`/workspaces/${workspaceId}/pipeline`)
  await page.getByRole('dialog', { name: 'Your pipeline plan starts here', exact: true }).getByRole('button', { name: 'Got it', exact: true }).click()
  await page.evaluate(() => { const write = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key.startsWith('ltpp-app:procurement-draft:')) throw new DOMException('Full', 'QuotaExceededError'); write.call(this, key, value) } })
  await page.getByRole('button', { name: '+ Add procurement', exact: true }).click()
  await page.getByLabel('Procurement name', { exact: true }).fill('Keep this input')
  await expect(page.getByText(/Draft recovery is unavailable in this browser/)).toBeVisible()
  await expect(page.getByLabel('Procurement name', { exact: true })).toHaveValue('Keep this input')
  expect(await draft(page, workspaceId)).toBeNull()
})

test('a draft retains surrounding unsaved working changes while editing another procurement', async ({ page }) => {
  const data = await setup(page, true)
  await page.goto(`/workspaces/${data.workspaceId}/pipeline/${data.pipelineId}?edit=1`)
  await page.getByRole('button', { name: '+ Add procurement', exact: true }).click()
  await page.getByLabel('Procurement name', { exact: true }).fill('Second procurement')
  await browsePhase(page, 'Evaluation'); await addMilestone(page, 'Go-live')
  await page.getByLabel('Anchor date', { exact: true }).fill('2033-05-12')
  await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
  await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
  await confirmProcurement(page)
  await page.getByRole('button', { name: 'Existing procurement', exact: true }).click()
  await page.getByLabel('Item 1 duration in weeks', { exact: true }).fill('6')
  expect((await draft(page, data.workspaceId)).context.plans.map((plan: { name: string }) => plan.name)).toEqual(['Existing procurement', 'Second procurement'])
  await reload(page); await resume(page)
  expect((await draft(page, data.workspaceId)).context.plans.map((plan: { name: string }) => plan.name)).toEqual(['Existing procurement', 'Second procurement'])
  await page.getByRole('button', { name: 'Preview changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await confirmProcurement(page)
  await expect(page.getByRole('button', { name: 'Second procurement', exact: true })).toBeVisible()
  expect(await draft(page, data.workspaceId)).toBeNull()
})

test('resuming an older draft cannot overwrite a newer saved pipeline plan', async ({ page }) => {
  const data = await setup(page, true)
  await page.goto(`/workspaces/${data.workspaceId}/pipeline/${data.pipelineId}?edit=1`)
  await page.getByRole('button', { name: 'Existing procurement', exact: true }).click()
  await page.getByLabel('Item 1 duration in weeks', { exact: true }).fill('6')
  await page.evaluate(async data => {
    const path = '/src/data/local-data.ts', { localData } = await import(path)
    const record = await localData.getPipeline(data.workspaceId, data.pipelineId), library = await localData.getLibrary(data.workspaceId)
    await localData.savePipeline({ ...record, expectedRevision: record.revision, expectedLibraryRevision: library.revision, note: 'Saved in another tab' })
  }, data)
  await reload(page); await resume(page)
  await page.getByRole('button', { name: 'Preview changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await confirmProcurement(page)
  await page.getByRole('region', { name: 'Pipeline Plan context' }).getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('group', { name: 'Save the displayed pipeline plan' }).getByRole('button', { name: 'Save', exact: true }).click()
  const modal = page.locator('dialog.save-pipeline-dialog')
  await modal.getByLabel('Notes (optional)', { exact: true }).fill('Recovered changes')
  await modal.getByRole('button', { name: 'Overwrite and save', exact: true }).click()
  await expect(modal.getByRole('alert')).toContainText('changed in another tab')
  const record = await page.evaluate(async data => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.getPipeline(data.workspaceId, data.pipelineId) }, data)
  expect(record!.revision).toBe(2); expect(record!.plans[0].phases[0].weeks).toBe(4)
})
