import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addMilestone, browsePhase } from './editor-actions.ts'

async function setup(page: Page, existing = false) {
  await page.goto('/workspaces')
  const id = await page.evaluate(async existing => {
    const dataPath = '/src/data/local-data.ts', projectPath = '/src/domain/project.ts'
    const { localData } = await import(dataPath), { scheduleProject } = await import(projectPath)
    const workspace = await localData.createWorkspace('Apply button checks')
    const library = await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 4, color: '#315ed4', checks: [{ target: 'self', severity: 'critical', reason: '' }] })
    localStorage.setItem(`ltpp-app:welcome-dismissed:${workspace.id}`, '1')
    if (existing) {
      const phase = library.phases[0]
      const project = scheduleProject({ id: crypto.randomUUID(), name: 'Existing procurement', anchor: Date.UTC(2032, 4, 12), planningAnchor: 0, anchorId: 2, anchorName: 'Service begins', nextPhaseId: 3, approvedBaseline: null, phases: [
        { ...phase, id: 1, kind: 'phase', libraryPhaseId: phase.id, durationInherited: true, offset: 0, s: 0, e: 0 },
        { id: 2, name: 'Service begins', kind: 'milestone', weeks: 0, color: '#536ea1', libraryPhaseId: '', durationInherited: false, offset: 0, s: 0, e: 0 },
      ] })
      await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: workspace.id, expectedRevision: 0, expectedLibraryRevision: library.revision, name: 'Existing pipeline plan', note: 'Initial plan', plans: [project], acknowledgements: [] })
    }
    return workspace.id
  }, existing)
  if (existing) {
    await page.goto(`/workspaces/${id}/saved-pipelines`)
    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    await page.getByRole('button', { name: '+ Add procurement', exact: true }).click()
  } else await page.goto(`/workspaces/${id}/pipeline?edit=1&add=1`)
}

async function build(page: Page) {
  await page.getByLabel('Procurement name', { exact: true }).fill('New procurement')
  await browsePhase(page, 'Evaluation')
  await addMilestone(page, 'Service begins')
  await page.getByLabel('Anchor date', { exact: true }).fill('2032-05-12')
  await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
}

test('unavailable Add explains preview and schedule changes on hover and keyboard focus', async ({ page }, testInfo) => {
  await setup(page)
  const add = page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true })
  const hint = page.locator('.procurement-apply-hint [role=tooltip]')
  await expect(add).toBeDisabled()
  await expect(add).toHaveCSS('cursor', 'default')
  await add.hover()
  await expect(hint).toBeVisible()
  await expect(hint).toHaveText('Preview the schedule before adding this procurement to the pipeline plan.')
  await add.focus()
  await expect(add).toHaveAccessibleDescription(await hint.innerText())
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Add procurement to pipeline plan?', exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(hint).toBeHidden()
  await build(page)
  await expect(add).toBeEnabled()
  await page.getByLabel('Procurement name', { exact: true }).fill('Changed procurement')
  await expect(add).toBeDisabled()
  await add.focus()
  await expect(hint).toHaveText('The schedule changed. Preview again to refresh the dates and checks.')
  await expect(hint).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('disabled-add-hint.png') })
  await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
  await expect(add).toBeEnabled()
  await add.click()
  await expect(page.getByRole('dialog', { name: 'Add procurement to pipeline plan?', exact: true })).toBeVisible()
})

test('Library changes require another preview; critical clashes remain advisory in confirmation', async ({ page }, testInfo) => {
  await setup(page, true)
  await build(page)
  const add = page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true })
  const hint = page.locator('.procurement-apply-hint [role=tooltip]')
  await expect(add).toBeEnabled()
  const impact = page.getByRole('region', { name: 'Clash checks', exact: true })
  await expect(impact.getByRole('heading', { name: 'Warnings and critical clashes', level: 4 })).toBeVisible()
  await expect(impact.locator('.timeline-row')).toHaveCount(3)
  await expect(impact.locator('.timeline-label').nth(1)).toContainText('New procurement')
  await expect(impact.locator('.timeline-label').nth(2)).toContainText('Existing procurement')
  await expect(page.getByLabel('Reason for proceeding with critical clashes', { exact: true })).toHaveCount(0)
  await add.click()
  const confirm = page.getByRole('dialog', { name: 'Add procurement to pipeline plan?', exact: true })
  await expect(confirm.getByLabel('Reason for proceeding with critical clashes', { exact: true })).toHaveCount(0)
  await expect(confirm).toContainText('Existing procurement')
  await expect(confirm).toContainText('New procurement')
  await page.screenshot({ path: testInfo.outputPath('clash-confirmation.png') })
  await confirm.getByRole('button', { name: 'Back to editing', exact: true }).click()
  await page.getByRole('button', { name: 'View Library phase: Evaluation', exact: true }).click()
  const phase = page.getByRole('dialog', { name: 'Edit phase', exact: true })
  await phase.getByLabel('Phase name', { exact: true }).fill('Evaluation updated')
  await phase.getByRole('button', { name: 'Save phase', exact: true }).click()
  await expect(add).toBeDisabled()
  await add.focus()
  await expect(hint).toHaveText('The Library changed. Preview the schedule again to refresh the checks.')
  await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
  await expect(add).toBeEnabled()
  await add.click()
  await confirm.getByRole('button', { name: 'Add to pipeline plan', exact: true }).click()
  await expect(confirm).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Editing live pipeline plan', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New procurement', exact: true }).click()
  await page.getByRole('button', { name: 'Preview changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  const edit = page.getByRole('dialog', { name: 'Save procurement changes?', exact: true })
  await expect(edit).toContainText('Critical clash')
  await expect(edit.getByLabel('Reason for proceeding with critical clashes', { exact: true })).toHaveCount(0)
  await edit.getByRole('button', { name: 'Confirm and save', exact: true }).click()
  await expect(edit).toHaveCount(0)
})

test('touch users can tap the unavailable action to read why without adding anything', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 600 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  try {
    await setup(page)
    const add = page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true })
    await add.scrollIntoViewIfNeeded()
    const bounds = (await add.boundingBox())!
    await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    const hint = page.locator('.procurement-apply-hint [role=tooltip]')
    await expect(hint).toBeVisible()
    const box = (await hint.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(320)
    await expect(page.getByRole('dialog', { name: 'Add procurement to pipeline plan?', exact: true })).toHaveCount(0)
    await page.screenshot({ path: testInfo.outputPath('touch-hint.png') })
  } finally { await context.close() }
})

for (const width of [320, 1440]) {
  test(`Christmas active durations are explicit and the timeline break has no text at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 320 ? 600 : 900 })
    await setup(page)
    await build(page)
    await browsePhase(page, 'Evaluation')
    await page.getByLabel('Anchor date', { exact: true }).fill('2031-01-13')
    await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
    const chart = page.locator('.review-card .planning-timeline')
    await expect(chart.locator('.phase-segment.paused .phase-label')).toHaveText([''])
    await expect(chart.locator('.phase-segment.paused')).toHaveAccessibleName(/Christmas and New Year break/)
    await expect(chart.locator('.timeline-legend')).toContainText('Hatching: Christmas and New Year break or scheduled gap')
    await expect(page.getByRole('region', { name: 'Anchor and gaps', exact: true })).toHaveCount(0)
    await page.locator('.phase-date-details summary').click()
    const dates = page.getByRole('region', { name: 'Phase and milestone dates', exact: true })
    await expect(dates.locator('.christmas-duration-note')).toHaveCount(1)
    const affected = dates.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Evaluation', exact: true }) }).first()
    await expect(affected).toContainText('4 active weeks')
    await expect(affected.locator('.christmas-duration-note')).toHaveText('Christmas and New Year break excluded.')
    const unaffected = dates.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Evaluation', exact: true }) }).last()
    await expect(unaffected.locator('.christmas-duration-note')).toHaveCount(0)
    await expect(unaffected).not.toContainText('active weeks')
    await affected.locator('.christmas-duration-note').scrollIntoViewIfNeeded()
    const note = (await affected.locator('.christmas-duration-note').boundingBox())!
    const footer = (await page.locator('.project-actions').boundingBox())!
    if (note.y + note.height > footer.y) await page.locator('.pipeline-modal > .dialog-content').evaluate((element, amount) => element.scrollBy({ top: amount, behavior: 'instant' }), note.y + note.height - footer.y + 16)
    const visibleNote = (await affected.locator('.christmas-duration-note').boundingBox())!
    expect(visibleNote.y + visibleNote.height).toBeLessThanOrEqual((await page.locator('.project-actions').boundingBox())!.y)
    await page.screenshot({ path: testInfo.outputPath('christmas-preview.png') })
    await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Add to pipeline plan', exact: true }).click()
    await expect(page.locator('.pipeline-timeline .phase-segment.paused .phase-label')).toHaveText([''])
  })
}

test('critical clash review stays usable on a narrow screen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 600 })
  await setup(page, true)
  await build(page)
  await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Add procurement to pipeline plan?', exact: true })
  await expect(modal.getByLabel('Reason for proceeding with critical clashes', { exact: true })).toHaveCount(0)
  await expect(modal.locator('.planning-finding')).toHaveCount(1)
  expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('mobile-clash-confirmation.png') })
  await modal.getByRole('button', { name: 'Add to pipeline plan', exact: true }).click()
  await expect(modal).toHaveCount(0)
})
