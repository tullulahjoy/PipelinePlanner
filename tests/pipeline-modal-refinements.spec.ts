import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { addMilestone, browsePhase } from './editor-actions.ts'

async function setup(page: Page, saved = false, rules = true) {
  await page.goto('/workspaces')
  return page.evaluate(async ({ saved, rules }) => {
    const path = '/src/data/local-data.ts', projectPath = '/src/domain/project.ts', clashesPath = '/src/domain/scheduling.ts'
    const { localData } = await import(path), { scheduleProject, acknowledgeClashes } = await import(projectPath), { findClashes } = await import(clashesPath)
    const workspace = await localData.createWorkspace('Modal refinements')
    let library = await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 4, color: '#315ed4', checks: rules ? [{ target: 'self', severity: 'warning', reason: '' }] : [] })
    library = await localData.createPhase(workspace.id, { name: 'Moderation', weeks: 2, color: '#a7622d', checks: rules ? [{ target: 'self', severity: 'critical', reason: '' }] : [] })
    localStorage.setItem(`ltpp-app:welcome-dismissed:${workspace.id}`, '1')
    if (!saved) return { workspaceId: workspace.id, pipelineId: '' }
    const plans = ['Community services', 'Digital services'].map(name => scheduleProject({ id: crypto.randomUUID(), name, anchor: Date.UTC(2032, 4, 12), planningAnchor: 0, anchorId: 3, anchorName: 'Service begins', nextPhaseId: 4, approvedBaseline: null, phases: [...library.phases.map((phase: { id: string }, index: number) => ({ ...phase, id: index + 1, kind: 'phase', libraryPhaseId: phase.id, durationInherited: true, offset: 0, s: 0, e: 0 })), { id: 3, name: 'Service begins', kind: 'milestone', weeks: 0, libraryPhaseId: '', color: '#536ea1', durationInherited: false, offset: 0, s: 0, e: 0 }] }))
    const record = await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: workspace.id, expectedRevision: 0, expectedLibraryRevision: library.revision, name: 'Saved pipeline plan', note: 'Initial plan', plans, acknowledgements: acknowledgeClashes(findClashes(plans, library.rules), [], 'Separate teams are available.') })
    return { workspaceId: workspace.id, pipelineId: record.id }
  }, { saved, rules })
}
async function build(page: Page, id: string) {
  await page.goto(`/workspaces/${id}/pipeline?edit=1&add=1`)
  await page.getByLabel('Procurement name', { exact: true }).fill('Procurement A')
  await browsePhase(page, 'Evaluation'); await browsePhase(page, 'Moderation')
  await addMilestone(page, 'Service commences')
  await page.getByLabel('Anchor date', { exact: true }).fill('2032-05-12')
}
async function openSave(page: Page) {
  await page.getByRole('region', { name: 'Pipeline Plan context' }).getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('group', { name: 'Save the displayed pipeline plan' }).getByRole('button', { name: 'Save', exact: true }).click()
  return page.locator('dialog.save-pipeline-dialog')
}
async function warningStyle(elements: Locator) {
  await expect(elements.first()).toBeAttached()
  expect(await elements.count()).toBeGreaterThan(0)
  for (const element of await elements.all()) expect(await element.evaluate(el => ({ color: getComputedStyle(el).borderTopColor, style: getComputedStyle(el).borderTopStyle }))).toEqual({ color: 'rgb(197, 139, 0)', style: 'dashed' })
}

for (const width of [320, 1440]) {
  test(`first Add and Save explain the action and keep controls visible at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 320 ? 600 : 900 })
    const data = await setup(page)
    await page.goto(`/workspaces/${data.workspaceId}/pipeline`)
    await warningStyle(page.locator('.example-timeline .legend-key:not(.critical)'))
    await build(page, data.workspaceId)
    const upper = (await page.locator('.schedule-toolbar .schedule-add-controls .button').last().boundingBox())!
    const lower = (await page.locator('.schedule-bottom-add .button').last().boundingBox())!
    expect(Math.abs(upper.x + upper.width - lower.x - lower.width)).toBeLessThan(2)
    await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
    await warningStyle(page.locator('.review-card .legend-key:not(.critical)'))
    await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
    const confirmation = page.getByRole('dialog', { name: 'Add procurement to pipeline plan?', exact: true })
    await expect(confirmation.locator('.procurement-confirm-summary dd')).toHaveText(['Procurement A', '2 phases, 1 milestone', 'Service commences: 12 May 2032'])
    await expect(confirmation).toContainText('After adding this procurement, save the pipeline plan to keep your work.')
    await expect(confirmation).toContainText('No warnings or critical clashes found.')
    await expect(confirmation.locator('.finding-counts')).toHaveCount(0)
    await page.screenshot({ path: testInfo.outputPath('add-confirmation.png') })
    await confirmation.getByRole('button', { name: 'Back to editing', exact: true }).click()
    await expect(page.locator('.schedule-editor-table tbody tr')).toHaveCount(3)
    await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
    await confirmation.getByRole('button', { name: 'Add to pipeline plan', exact: true }).click()
    const save = await openSave(page)
    await expect(save).toContainText('Name this pipeline plan so you can return to its 1 procurement later.')
    await expect(save).toContainText('Add any notes you want to keep with this pipeline plan.')
    await expect(save).not.toContainText('Explain what changed')
    await expect(save.locator('.save-author')).toHaveCount(0)
    await expect(save).toContainText('No warnings or critical clashes found.')
    await save.getByLabel('Name (required)', { exact: true }).fill('First planning pipeline plan')
    await save.getByLabel('Notes (optional)', { exact: true }).fill('Initial planning assumptions.')
    const content = save.locator('.dialog-content')
    await content.evaluate(el => el.scrollTop = el.scrollHeight)
    const body = (await content.boundingBox())!, footer = (await save.locator('footer').boundingBox())!
    expect(body.y + body.height).toBeLessThanOrEqual(footer.y + 1)
    expect(footer.y + footer.height).toBeLessThanOrEqual(page.viewportSize()!.height)
    expect(await save.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('first-save.png') })
    await save.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(save).toHaveCount(0)
    const record = await page.evaluate(async id => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.listPipelines(id) }, data.workspaceId)
    expect(record[0].savedBy).toBe('Local user'); expect(record[0].savedAt).toBeTruthy()
    await page.getByRole('button', { name: 'Exit edit mode', exact: true }).click()
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Saved Pipeline Plans', exact: true }).click()
    await page.getByText('Saved details', { exact: true }).click()
    await expect(page.locator('.saved-details')).toContainText('Saved by Local user')
  })
}

test('warnings share one amber in saved/live charts and preview/comparison legends, while critical remains solid red', async ({ page }) => {
  const data = await setup(page, true)
  await page.goto(`/workspaces/${data.workspaceId}/pipeline/${data.pipelineId}?edit=1`)
  await warningStyle(page.locator('.clash-outline.warning'))
  await warningStyle(page.locator('.legend-key:not(.critical)'))
  for (const critical of await page.locator('.clash-outline.critical').all()) {
    expect(await critical.evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('solid')
    expect(await critical.evaluate(el => getComputedStyle(el).borderTopColor)).toBe('rgb(180, 61, 78)')
  }
  const overwrite = await openSave(page)
  await expect(overwrite).toContainText('Add any notes you want to keep with this pipeline plan.')
  await expect(overwrite.locator('.finding-counts')).toHaveCount(1)
  await overwrite.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Community services', exact: true }).click()
  await page.getByRole('button', { name: 'Preview changes', exact: true }).click()
  await warningStyle(page.locator('.review-card .legend-key:not(.critical)'))
  await page.getByRole('button', { name: 'Compare with saved schedule', exact: true }).click()
  await warningStyle(page.locator('.schedule-comparison .legend-key:not(.critical)'))
  await page.goto(`/workspaces/${data.workspaceId}/pipeline/${data.pipelineId}`)
  await warningStyle(page.locator('.clash-outline.warning'))
})

test('unconfigured rules are stated honestly in Add and Save confirmations', async ({ page }) => {
  const data = await setup(page, false, false)
  await build(page, data.workspaceId)
  await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
  await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
  const confirmation = page.getByRole('dialog', { name: 'Add procurement to pipeline plan?', exact: true })
  await expect(confirmation).toContainText('No clash-checking rules are configured.')
  await expect(confirmation).not.toContainText('No warnings or critical clashes found.')
  await confirmation.getByRole('button', { name: 'Add to pipeline plan', exact: true }).click()
  const save = await openSave(page)
  await expect(save).toContainText('No clash-checking rules are configured.')
  await expect(save.locator('.finding-counts')).toHaveCount(0)
})
