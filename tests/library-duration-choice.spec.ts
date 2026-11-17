import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function setup(page: Page, kind: 'normal' | 'protected' | 'matching' = 'normal') {
  await page.goto('/workspaces')
  return page.evaluate(async kind => {
    const path = '/src/data/local-data.ts', scheduling = '/src/domain/project.ts'
    const { localData } = await import(path), { scheduleProject } = await import(scheduling)
    const workspace = await localData.createWorkspace('Duration choices')
    let library = await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 4, color: '#315ed4', checks: [] })
    library = await localData.createPhase(workspace.id, { name: 'Moderation', weeks: 3, color: '#7658a7', checks: [] })
    localStorage.setItem(`ltpp-app:welcome-dismissed:${workspace.id}`, '1')
    const projects = [['Future procurement', '2032-05-12', true], ['Past procurement', '2020-05-12', true], ['Custom procurement', '2034-05-12', false]].map(([name, anchor, inherited]) => scheduleProject({ id: crypto.randomUUID(), name, anchor: Date.parse(`${anchor}T00:00:00Z`), planningAnchor: 0, anchorId: 3, anchorName: 'Service begins', nextPhaseId: 4, approvedBaseline: null, phases: [...library.phases.map((phase: { id: string; name: string; weeks: number; color: string }, index: number) => ({ ...phase, id: index + 1, weeks: index === 0 && kind === 'matching' ? 6 : index === 0 && !inherited ? 7 : phase.weeks, libraryPhaseId: phase.id, kind: 'phase', durationInherited: index !== 0 || inherited && (kind !== 'protected' || name === 'Past procurement'), offset: 0, s: 0, e: 0 })), { id: 3, name: 'Service begins', weeks: 0, kind: 'milestone', color: '#315ed4', libraryPhaseId: '', durationInherited: false, offset: 0, s: 0, e: 0 }] }))
    const record = await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: workspace.id, expectedRevision: 0, expectedLibraryRevision: library.revision, name: 'Planning pipeline plan', note: 'Initial schedule', plans: projects, acknowledgements: [] })
    return { workspaceId: workspace.id, pipelineId: record.id, evaluationId: library.phases[0].id, moderationId: library.phases[1].id }
  }, kind)
}
async function editDuration(page: Page, weeks: number) {
  const row = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Evaluation', exact: true }) })
  await row.getByRole('button', { name: 'Edit', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Edit phase', exact: true })
  await modal.getByLabel('Default duration (weeks)', { exact: true }).fill(String(weeks))
  await modal.getByRole('button', { name: 'Save phase', exact: true }).click()
  await expect(modal).toHaveCount(0)
}
async function stored(page: Page, data: { workspaceId: string; pipelineId: string }) {
  return page.evaluate(async data => { const path = '/src/data/local-data.ts'; const { localData } = await import(path); return { library: await localData.getLibrary(data.workspaceId), pipeline: await localData.getPipeline(data.workspaceId, data.pipelineId) } }, data)
}

test('the updates panel is visible without expansion and reflects matching, eligible and protected durations', async ({ page }) => {
  const data = await setup(page)
  await page.goto(`/workspaces/${data.workspaceId}/library`)
  const panel = page.getByRole('region', { name: 'Updates to existing schedules', exact: true })
  await expect(panel.getByRole('heading', { name: 'Updates to existing schedules', exact: true })).toBeVisible()
  // Only the deliberate custom duration differs before a default is changed.
  await expect(panel).toContainText('protected from updates')
  await page.evaluate(async data => { const path = '/src/data/local-data.ts'; const { localData } = await import(path); const library = await localData.getLibrary(data.workspaceId); const phase = library.phases[0]; await localData.editPhase(data.workspaceId, phase.id, library.revision, { name: phase.name, weeks: 6, color: phase.color, checks: [] }) }, data)
  await page.reload()
  await expect(panel).toContainText('1 future activity across 1 pipeline plan')
  await expect(panel.getByRole('combobox', { name: 'Pipeline Plan to review', exact: true })).toBeVisible()
})

for (const width of [320, 1440]) {
  test(`keeping existing durations saves the default only and the prompt fits at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    const data = await setup(page)
    const before = (await stored(page, data)).pipeline
    await page.goto(`/workspaces/${data.workspaceId}/library?section=phases`)
    await editDuration(page, 6)
    const prompt = page.getByRole('dialog', { name: 'Where should the new duration be used?', exact: true })
    await expect(prompt).toContainText('from 4 weeks to 6 weeks')
    expect(await prompt.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('duration-choice.png') })
    await prompt.getByRole('button', { name: 'Keep existing procurement durations unchanged', exact: true }).click()
    await expect(prompt).toHaveCount(0)
    const after = await stored(page, data)
    expect(after.library.phases[0].weeks).toBe(6)
    expect(after.pipeline).toEqual(before)
    await expect(page.getByRole('region', { name: 'Updates to existing schedules' })).toContainText('1 future activity')
  })
}

test('choosing procurements opens a focused selective preview with protected activity and explicit Apply/Save', async ({ page }) => {
  const data = await setup(page)
  await page.evaluate(async data => { const path = '/src/data/local-data.ts'; const { localData } = await import(path); const library = await localData.getLibrary(data.workspaceId); const phase = library.phases[1]; await localData.editPhase(data.workspaceId, phase.id, library.revision, { name: phase.name, weeks: 5, color: phase.color, checks: [] }) }, data)
  const before = (await stored(page, data)).pipeline
  await page.goto(`/workspaces/${data.workspaceId}/library?section=phases`)
  await editDuration(page, 6)
  await page.getByRole('button', { name: /^Choose procurements to update \(/ }).click()
  const chooser = page.getByRole('dialog', { name: 'Choose existing procurements to update', exact: true })
  await expect(chooser).toContainText('1 eligible procurement')
  await expect(chooser).not.toContainText('The new Library default is saved.')
  await expect(chooser).not.toContainText('Clash-checking rule changes apply across all pipeline plans.')
  await chooser.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Choose procurements to update (1 eligible)', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Choose procurements to update (1 eligible)', exact: true }).click()
  await chooser.getByRole('radio', { name: /^Planning pipeline/ }).check()
  await chooser.getByRole('link', { name: 'Choose procurements and preview updates', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Review Library timing updates', exact: true })
  await expect(review.getByRole('checkbox')).toHaveCount(3)
  await expect(review).not.toContainText('Moderation:')
  await expect(review.getByRole('checkbox', { name: /Past procurement/ })).toBeDisabled()
  await expect(review.getByRole('checkbox', { name: /Custom procurement/ })).toBeDisabled()
  await review.getByRole('checkbox', { name: /Future procurement/ }).check()
  await review.getByRole('button', { name: 'Preview selected updates', exact: true }).click()
  expect((await stored(page, data)).pipeline).toEqual(before)
  await review.getByRole('button', { name: 'Apply updates', exact: true }).click()
  await expect(page.getByText('Unsaved changes', { exact: true })).toBeVisible()
  expect((await stored(page, data)).pipeline).toEqual(before)
  await page.getByRole('button', { name: 'Future procurement', exact: true }).click()
  await expect(page.getByLabel('Item 1 duration in weeks', { exact: true })).toHaveValue('6')
  await expect(page.getByLabel('Item 2 duration in weeks', { exact: true })).toHaveValue('3')
})

test('inline Library editing keeps unfinished procurement inputs and navigation still requires an explicit decision', async ({ page }) => {
  const data = await setup(page)
  await page.goto(`/workspaces/${data.workspaceId}/pipeline/${data.pipelineId}?edit=1`)
  await page.getByRole('button', { name: 'Future procurement', exact: true }).click()
  await page.getByLabel('Item 1 duration in weeks', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'View Library phase: Evaluation', exact: true }).click()
  const phase = page.getByRole('dialog', { name: 'Edit phase', exact: true })
  await phase.getByLabel('Default duration (weeks)', { exact: true }).fill('6')
  await phase.getByRole('button', { name: 'Save phase', exact: true }).click()
  await page.getByRole('button', { name: /^Choose procurements to update \(/ }).click()
  const chooser = page.getByRole('dialog', { name: 'Choose existing procurements to update', exact: true })
  await expect(chooser).toContainText('unfinished procurement or template edits')
  await chooser.getByRole('radio', { name: /^Current working pipeline/ }).check()
  await chooser.getByRole('link', { name: 'Choose procurements and preview updates', exact: true }).click()
  const guard = page.getByRole('dialog', { name: 'Unsaved changes', exact: true })
  await expect(guard).toBeVisible()
  await guard.getByRole('button', { name: 'Keep editing', exact: true }).click()
  await expect(page.getByLabel('Item 1 duration in weeks', { exact: true })).toHaveValue('8')
  expect((await stored(page, data)).pipeline!.plans[0].phases[0].weeks).toBe(4)
})

test('unchanged duration saves do not prompt, and an empty workspace has an explicit visible empty state', async ({ page }) => {
  const data = await setup(page)
  await page.goto(`/workspaces/${data.workspaceId}/library?section=phases`)
  await page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Evaluation', exact: true }) }).getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('dialog', { name: 'Edit phase', exact: true }).getByRole('button', { name: 'Save phase', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const empty = await page.evaluate(async () => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.createWorkspace('Empty team') })
  await page.goto(`/workspaces/${empty.id}/library`)
  await expect(page.getByRole('region', { name: 'Updates to existing schedules' })).toContainText('No pipeline plans are available to update yet.')
})

test('saving a changed default without any pipeline plans gives confirmation without an update choice', async ({ page }) => {
  await page.goto('/workspaces')
  const id = await page.evaluate(async () => {
    const path = '/src/data/local-data.ts', { localData } = await import(path)
    const workspace = await localData.createWorkspace('New Library')
    await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 3, color: '#315ed4', checks: [] })
    return workspace.id
  })
  await page.goto(`/workspaces/${id}/library?section=phases`)
  await editDuration(page, 4)
  const confirmation = page.getByRole('dialog', { name: 'Library duration updated', exact: true })
  await expect(confirmation).toContainText('default duration is now 4 weeks')
  await expect(confirmation.getByRole('button', { name: /^Choose procurements/ })).toHaveCount(0)
  await expect(confirmation.getByRole('button', { name: 'Done', exact: true })).toBeFocused()
  await confirmation.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

for (const kind of ['protected', 'matching'] as const) {
  test(`no update choice is offered for ${kind} existing schedules`, async ({ page }) => {
    const data = await setup(page, kind)
    const before = (await stored(page, data)).pipeline
    await page.goto(`/workspaces/${data.workspaceId}/library?section=phases`)
    await editDuration(page, 6)
    const confirmation = page.getByRole('dialog', { name: 'Library duration updated', exact: true })
    await expect(confirmation).toContainText(kind === 'protected' ? 'custom durations or have already started' : 'Existing procurements already use this duration. No updates are needed.')
    await expect(confirmation.getByRole('button', { name: /^Choose procurements/ })).toHaveCount(0)
    expect((await stored(page, data)).pipeline).toEqual(before)
    await confirmation.getByRole('button', { name: 'Done', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Updates to existing schedules' }).getByRole('combobox')).toHaveCount(0)
  })
}

test('failed eligibility checks offer retry without implying that no updates exist or saving twice', async ({ page }) => {
  const data = await setup(page)
  await page.goto(`/workspaces/${data.workspaceId}/library?section=phases`)
  await expect(page.getByRole('region', { name: 'Updates to existing schedules' })).toContainText('protected from updates')
  await page.evaluate(async () => {
    const path = '/src/data/local-data.ts', { localData } = await import(path)
    const original = localData.listPipelines
    ;(window as unknown as { restorePipelines: () => void }).restorePipelines = () => { localData.listPipelines = original }
    localData.listPipelines = async () => { throw new Error('Could not check pipeline plans.') }
  })
  const before = (await stored(page, data)).library.revision
  await editDuration(page, 6)
  const failure = page.getByRole('dialog', { name: 'Check existing schedules', exact: true })
  await expect(failure.getByRole('alert')).toContainText('Could not check pipeline plans.')
  await expect(page.getByRole('dialog', { name: 'Library duration updated', exact: true })).toHaveCount(0)
  await page.evaluate(() => (window as unknown as { restorePipelines: () => void }).restorePipelines())
  await failure.getByRole('button', { name: 'Retry checking schedules', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Choose procurements to update (1 eligible)', exact: true })).toBeVisible()
  expect((await stored(page, data)).library.revision).toBe(before + 1)
})
