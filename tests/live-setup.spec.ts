import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addMilestone, browsePhase, confirmProcurement } from './editor-actions.ts'

async function workspace(page: Page) {
  await page.goto('/workspaces')
  return page.evaluate(async () => {
    const path = '/src/data/local-data.ts', { localData } = await import(path)
    const workspace = await localData.createWorkspace('Guided setup team')
    const library = await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 4, color: '#315ed4', checks: [{ target: 'self', severity: 'critical', reason: 'Shared team' }] })
    localStorage.setItem(`ltpp-app:welcome-dismissed:${workspace.id}`, '1')
    return { workspace, library }
  })
}
async function add(page: Page, name: string) {
  await page.getByRole('button', { name: '+ Add procurement', exact: true }).click()
  await page.getByLabel('Procurement name', { exact: true }).fill(name)
  await browsePhase(page, 'Evaluation')
  await addMilestone(page, 'Service begins')
  await page.getByLabel('Anchor date', { exact: true }).fill('2032-05-12')
  await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
  await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
  await expect(page.getByLabel('Reason for proceeding with critical clashes', { exact: true })).toHaveCount(0)
  await confirmProcurement(page)
}
async function save(page: Page, name: string) {
  await page.getByRole('region', { name: 'Pipeline Plan context' }).getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('group', { name: 'Save the displayed pipeline plan' }).getByRole('button', { name: 'Save', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Save pipeline plan', exact: true })
  await dialog.getByLabel('Name (required)', { exact: true }).fill(name)
  await expect(dialog.getByLabel('Notes (optional)', { exact: true })).not.toHaveAttribute('required')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).not.toBeVisible()
}
for (const width of [390, 1440]) test(`first Save establishes live without baseline steps at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 })
  const data = await workspace(page), base = `/workspaces/${data.workspace.id}`
  await page.goto(`${base}/pipeline`)
  await page.getByRole('dialog', { name: 'Your pipeline plan starts here', exact: true }).getByRole('button', { name: 'Got it', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your pipeline plan starts here', exact: true, level: 1 })).toBeVisible()
  await add(page, 'Community services')
  await save(page, 'First live plan')
  await expect(page.getByRole('dialog', { name: 'Editing live pipeline plan', exact: true })).toContainText('All changes saved')
  await page.getByRole('button', { name: 'Close Editing live pipeline plan', exact: true }).click()
  await expect(page).toHaveURL(`${base}/pipeline`)
  await expect(page.locator('.pipeline-context-panel')).toHaveAttribute('data-state', 'live')
  await expect(page.getByRole('button', { name: 'Getting started', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Choose a saved pipeline plan', exact: true })).toHaveCount(0)
  await page.reload()
  await page.getByRole('link', { name: 'Edit live plan', exact: true }).click()
  await add(page, 'Digital services')
  await page.getByRole('region', { name: 'Pipeline Plan context' }).getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('group', { name: 'Save the displayed pipeline plan' }).getByRole('button', { name: 'Save', exact: true }).click()
  const saving = page.getByRole('dialog', { name: /Save changes to/ })
  await expect(saving.getByLabel('Reason for proceeding with critical clashes', { exact: true })).toHaveCount(0)
  await saving.getByRole('button', { name: 'Overwrite and save', exact: true }).click()
  await page.getByRole('button', { name: 'Exit edit mode', exact: true }).click()
  await expect(page.locator('.pipeline-context-panel')).toContainText('1 critical clash')
  await page.screenshot({ path: info.outputPath('first-live-plan.png') })
  const stored = await page.evaluate(async id => { const path = '/src/data/local-data.ts', { localData } = await import(path); return { workspace: await localData.getWorkspace(id), records: await localData.listPipelines(id) } }, data.workspace.id)
  expect(stored.workspace.currentBaselineId).toBe(stored.records[0].id)
  expect(stored.records).toHaveLength(1)
  expect(stored.records[0].plans).toHaveLength(2)
  expect(stored.records[0].confirmation).toBeUndefined()
})

async function savedPipeline(page: Page) {
  const data = await workspace(page)
  return page.evaluate(async data => {
    const path = '/src/data/local-data.ts', projectPath = '/src/domain/project.ts'
    const { localData } = await import(path), { scheduleProject } = await import(projectPath)
    const phase = data.library.phases[0]
    const plans = ['Community services', 'Digital services'].map(name => scheduleProject({ id: crypto.randomUUID(), name, anchor: Date.UTC(2032, 4, 12), planningAnchor: 0, anchorId: 2, anchorName: 'Service begins', nextPhaseId: 3, approvedBaseline: null, phases: [
      { ...phase, id: 1, kind: 'phase', libraryPhaseId: phase.id, durationInherited: true, offset: 0, s: 0, e: 0 },
      { id: 2, name: 'Service begins', kind: 'milestone', weeks: 0, color: '#536ea1', libraryPhaseId: '', durationInherited: false, offset: 0, s: 0, e: 0 },
    ] }))
    const record = await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: data.workspace.id, expectedRevision: 0, expectedLibraryRevision: data.library.revision, name: 'Selected pipeline plan', plans, acknowledgements: [] })
    return { ...data, record }
  }, data)
}
test('Pipeline Plan stays live while saved alternatives open and close over their list', async ({ page }) => {
  const data = await savedPipeline(page), base = `/workspaces/${data.workspace.id}`
  const alternative = await page.evaluate(async data => {
    const path = '/src/data/local-data.ts', { localData } = await import(path)
    return localData.savePipeline({ ...data.record, id: crypto.randomUUID(), name: 'Alternative', expectedRevision: 0, expectedLibraryRevision: data.library.revision })
  }, data)
  await page.goto(`${base}/pipeline/${alternative.id}`)
  const view = page.getByRole('dialog', { name: 'Viewing saved pipeline plan', exact: true })
  await expect(view).toBeVisible()
  await expect(page.locator('.app-nav a[aria-current=page]')).toHaveText('Saved Pipeline Plans')
  await expect(view.getByRole('link', { name: 'Return to live pipeline plan', exact: true })).toHaveCount(0)
  await view.getByRole('button', { name: 'Close Viewing saved pipeline plan', exact: true }).click()
  await page.getByRole('link', { name: 'Live Pipeline', exact: true }).click()
  await expect(page.locator('.pipeline-context-panel')).toHaveAttribute('data-state', 'live')
  await page.goto(`${base}/pipeline/${alternative.id}?edit=1`)
  await page.getByRole('button', { name: 'Community services', exact: true }).click()
  await page.getByLabel('Item 1 duration in weeks', { exact: true }).fill('5')
  await page.getByRole('button', { name: 'Preview changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await confirmProcurement(page)
  await page.getByRole('button', { name: 'Exit edit mode', exact: true }).click()
  const close = page.getByRole('dialog', { name: 'Exit edit mode?', exact: true })
  await close.getByRole('button', { name: 'Keep editing', exact: true }).click()
  await expect(page.getByText('Unsaved changes', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Exit edit mode', exact: true }).click()
  await close.getByRole('button', { name: 'Discard changes and exit', exact: true }).click()
  await expect(page).toHaveURL(`${base}/saved-pipelines`)
  await page.getByRole('link', { name: 'Live Pipeline', exact: true }).click()
  await expect(page.locator('.context-name-row')).toContainText('Selected pipeline plan')
  await expect(page.getByRole('link', { name: 'Resume editing', exact: true })).toHaveCount(0)
})

test('Library Apply and save names the pipeline plan, retains applied work after cancel/failure, and saves optional notes', async ({ page }) => {
  const data = await savedPipeline(page), base = `/workspaces/${data.workspace.id}`
  await page.evaluate(async data => { const path = '/src/data/local-data.ts'; await (await import(path)).localData.editPhase(data.workspace.id, data.library.phases[0].id, data.library.revision, { ...data.library.phases[0], weeks: 6, checks: [{ target: 'self', severity: 'critical', reason: '' }] }) }, data)
  await page.goto(`${base}/pipeline/${data.record.id}?edit=1&updates=1`)
  const review = page.getByRole('dialog', { name: 'Review Library timing updates', exact: true })
  await expect(review).toContainText('Pipeline Plan: Selected pipeline plan')
  await review.getByRole('checkbox').first().check()
  await review.getByRole('button', { name: 'Preview selected updates', exact: true }).click()
  await expect(review.getByLabel('Reason for proceeding with critical clashes', { exact: true })).toHaveCount(0)
  await review.getByRole('button', { name: 'Apply and save...', exact: true }).click()
  let dialog = page.getByRole('dialog', { name: 'Save changes to “Selected pipeline plan”?', exact: true })
  await expect(dialog.getByLabel('Notes (optional)', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('Unsaved changes', { exact: true })).toBeVisible()
  const stored = () => page.evaluate(async data => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.getPipeline(data.workspace.id, data.record.id) }, data)
  expect((await stored()).plans).toEqual(data.record.plans)
  await page.evaluate(async () => {
    const path = '/src/data/local-data.ts', { localData } = await import(path), original = localData.savePipeline
    localData.savePipeline = async (input: unknown) => { if (sessionStorage.getItem('fail-save')) throw new Error('Simulated save failure'); return original(input) }
    sessionStorage.setItem('fail-save', '1')
  })
  await page.getByRole('region', { name: 'Pipeline Plan context' }).getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('group', { name: 'Save the displayed pipeline plan' }).getByRole('button', { name: 'Save', exact: true }).click()
  dialog = page.getByRole('dialog', { name: 'Save changes to “Selected pipeline plan”?', exact: true })
  await dialog.getByLabel('Notes (optional)', { exact: true }).fill('Updated Library duration')
  await dialog.getByRole('button', { name: 'Overwrite and save', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Simulated save failure')
  await expect(dialog.getByLabel('Notes (optional)', { exact: true })).toHaveValue('Updated Library duration')
  expect((await stored()).plans).toEqual(data.record.plans)
  await page.evaluate(() => sessionStorage.removeItem('fail-save'))
  await dialog.getByRole('button', { name: 'Overwrite and save', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  const after = await stored()
  expect(after.note).toBe('Updated Library duration')
  expect(after.plans[0].phases[0].weeks).toBe(6)
  expect(after.plans[1].phases[0].weeks).toBe(4)
  expect(after.acknowledgements).toEqual([])
})
