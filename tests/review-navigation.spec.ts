import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import type { Project } from '../src/data/schemas.ts'

async function setup(page: Page, updateLibrary = false) {
  await page.goto('/workspaces')
  return page.evaluate(async updateLibrary => {
    const dataPath = '/src/data/local-data.ts', projectPath = '/src/domain/project.ts'
    const { localData } = await import(dataPath), { scheduleProject } = await import(projectPath)
    const workspace = await localData.createWorkspace('Review navigation')
    const library = await localData.createPhase(workspace.id, { name: 'Preparation', weeks: 2, color: '#315ed4', checks: [] })
    const phase = library.phases[0]
    const project: Project = scheduleProject({ id: crypto.randomUUID(), name: 'Community services', anchor: Date.UTC(2035, 5, 6), planningAnchor: 0, anchorId: 13, anchorName: 'Service begins', nextPhaseId: 14, approvedBaseline: null, phases: [
      ...Array.from({ length: 12 }, (_, index) => ({ ...phase, id: index + 1, name: `Preparation ${index + 1}`, libraryPhaseId: phase.id, kind: 'phase', durationInherited: true, offset: 0, s: 0, e: 0 })),
      { id: 13, name: 'Service begins', kind: 'milestone', weeks: 0, libraryPhaseId: '', color: '#536ea1', durationInherited: false, offset: 0, s: 0, e: 0 },
    ] })
    const live = await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: workspace.id, expectedRevision: 0, expectedLibraryRevision: library.revision, name: 'Live plan', plans: [project], acknowledgements: [] })
    const saved = await localData.savePipeline({ ...live, id: crypto.randomUUID(), expectedRevision: 0, expectedLibraryRevision: library.revision, name: 'Saved alternative' })
    const template = await localData.saveTemplate(workspace.id, crypto.randomUUID(), 0, library.revision, { name: 'Long schedule', description: '', anchorId: 13, phases: project.phases.map(({ s: _s, e: _e, ...item }) => item) })
    if (updateLibrary) await localData.editPhase(workspace.id, phase.id, library.revision, { ...phase, weeks: 3, checks: [] })
    return { workspaceId: workspace.id, liveId: live.id, savedId: saved.id, projectId: project.id, templateId: template.id }
  }, updateLibrary)
}

async function atReview(heading: Locator, pane: Locator, atTop = true) {
  await expect(heading).toBeFocused()
  await expect(heading).toBeInViewport()
  const bounds = (await heading.boundingBox())!, viewport = (await pane.boundingBox())!
  expect(bounds.y).toBeGreaterThanOrEqual(viewport.y - 1)
  expect(bounds.y + bounds.height).toBeLessThan(viewport.y + viewport.height + 1)
  if (atTop) expect(bounds.y - viewport.y).toBeLessThan(60)
  expect(await pane.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
}

for (const width of [320, 1440]) for (const mode of ['add', 'live-edit', 'saved-edit']) {
  test(`${mode} preview and updated preview reveal the review at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 })
    const data = await setup(page)
    const base = `/workspaces/${data.workspaceId}`
    await page.goto(mode === 'saved-edit' ? `${base}/saved-pipelines/${data.savedId}?edit=1&procurement=${data.projectId}` : `${base}/pipeline?edit=1&${mode === 'add' ? 'add=1' : `procurement=${data.projectId}`}`)
    const pane = page.locator('.pipeline-modal > .dialog-content')
    if (mode === 'add') {
      await page.getByLabel('Procurement name', { exact: true }).fill('New procurement')
      await page.getByRole('combobox', { name: 'Start from a template (optional)', exact: true }).selectOption(data.templateId)
      await page.getByRole('button', { name: 'Use template', exact: true }).click()
      await page.getByLabel('Anchor date', { exact: true }).fill('2035-06-06')
    } else {
      await page.getByRole('button', { name: 'Edit details', exact: true }).click()
      const details = page.getByRole('dialog', { name: 'Edit procurement details', exact: true })
      await details.getByLabel('Anchor date', { exact: true }).fill('2035-07-04')
      await details.getByRole('button', { name: 'Use these details', exact: true }).click()
    }
    await page.getByRole('button', { name: mode === 'add' ? 'Preview schedule' : 'Preview changes', exact: true }).click()
    const heading = page.getByRole('heading', { name: 'Review the schedule', exact: true })
    await atReview(heading, pane)
    await pane.evaluate(element => { element.scrollTop = 0 })
    await page.getByRole('button', { name: 'Update preview', exact: true }).click()
    await atReview(heading, pane)
    await page.screenshot({ path: info.outputPath(`review-${mode}-${width}.png`) })
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })
}

for (const width of [320, 1440]) test(`Library timing preview reveals its proposed changes at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 })
  const data = await setup(page, true)
  await page.goto(`/workspaces/${data.workspaceId}/pipeline?edit=1&updates=1`)
  const dialog = page.getByRole('dialog', { name: 'Review Library timing updates', exact: true })
  const pane = dialog.locator(':scope > .dialog-content')
  await expect(dialog.getByRole('checkbox')).toHaveCount(12)
  for (const checkbox of await dialog.getByRole('checkbox').all()) await checkbox.check()
  await dialog.getByRole('button', { name: 'Preview selected updates', exact: true }).click()
  const heading = dialog.getByRole('heading', { name: 'Proposed schedule changes', exact: true })
  await atReview(heading, pane, false)
  await pane.evaluate(element => { element.scrollTop = 0 })
  await dialog.getByRole('button', { name: 'Preview selected updates', exact: true }).click()
  await atReview(heading, pane, false)
  await page.screenshot({ path: info.outputPath(`library-review-${width}.png`) })
})

for (const width of [320, 1440]) test(`Adjust continues to reveal its review below the section navigation at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  const data = await setup(page)
  await page.goto(`/workspaces/${data.workspaceId}/pipeline?edit=1`)
  await page.getByRole('button', { name: 'Adjust pipeline plan', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Adjust pipeline plan', exact: true })
  await dialog.getByLabel('Number of weeks', { exact: true }).fill('2')
  await dialog.getByRole('button', { name: 'Apply movement', exact: true }).click()
  await dialog.getByRole('button', { name: 'Review changes', exact: true }).click()
  const heading = dialog.getByRole('heading', { name: 'Date and duration changes', exact: true })
  await expect(heading).toBeFocused()
  await expect(heading).toBeInViewport()
  const navigation = (await dialog.getByRole('navigation', { name: 'Adjustment review sections', exact: true }).boundingBox())!
  expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(navigation.y + navigation.height)
})

test('failed procurement validation reveals the invalid field and leaves review unopened', async ({ page }) => {
  const data = await setup(page)
  await page.goto(`/workspaces/${data.workspaceId}/pipeline?edit=1&add=1`)
  await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
  const invalid = page.getByLabel('Procurement name', { exact: true })
  await expect(invalid).toHaveAttribute('aria-invalid', 'true')
  await expect(invalid).toBeFocused()
  await expect(invalid).toBeInViewport()
  await expect(page.locator('.editor-card-body > .field-error').first()).toBeInViewport()
  await expect(page.locator('.review-stage .review-card')).toHaveCount(0)
})
