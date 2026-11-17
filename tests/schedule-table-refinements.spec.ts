import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addMilestone, browsePhase, moveRow } from './editor-actions.ts'

async function setup(page: Page) {
  await page.goto('/workspaces')
  const id = await page.evaluate(async () => {
    const path = '/src/data/local-data.ts', { localData } = await import(path)
    const workspace = await localData.createWorkspace('Schedule refinements')
    let library = await localData.createPhase(workspace.id, { name: 'Bid writing', weeks: 8, color: '#237b51', checks: [] })
    await localData.createPhase(workspace.id, { name: 'Dialogue', weeks: 4, color: '#315ed4', checks: [{ target: 'self', severity: 'critical', reason: '' }, { target: library.phases[0].id, severity: 'critical', reason: '' }] })
    await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 6, color: '#7658a7', checks: [{ target: 'self', severity: 'warning', reason: 'Do not show this rationale in a summary.' }] })
    await localData.createPhase(workspace.id, { name: 'Moderation', weeks: 6, color: '#b66a18', checks: [] })
    await localData.createPhase(workspace.id, { name: 'Short phase', weeks: 1, color: '#536ea1', checks: [] })
    localStorage.setItem(`ltpp-app:welcome-dismissed:${workspace.id}`, '1')
    return workspace.id
  })
  await page.goto(`/workspaces/${id}/pipeline?edit=1&add=1`)
  await page.getByLabel('Procurement name', { exact: true }).fill('Community services')
  return id
}

for (const width of [320, 1440]) {
  test(`new anchor is visibly selected and survives reordering, cancellation and recovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 })
    await setup(page)
    await browsePhase(page, 'Dialogue')
    await addMilestone(page, 'Existing milestone')
    await page.getByRole('button', { name: '+ Add anchor milestone', exact: true }).click()
    let dialog = page.getByRole('dialog', { name: 'Add milestone', exact: true })
    await dialog.getByLabel('Milestone name', { exact: true }).fill('Service commences')
    await dialog.getByRole('button', { name: 'Add milestone', exact: true }).click()
    const anchor = page.getByRole('combobox', { name: 'Anchor milestone', exact: true })
    const row = page.locator('.schedule-editor-table tbody tr').filter({ has: page.locator('.phase-label', { hasText: 'Service commences' }) })
    const id = (await row.getAttribute('data-item-id'))!
    await expect(anchor).toHaveValue(id)
    await expect(anchor.locator('option:checked')).toHaveText('Service commences')
    await moveRow(page, 2, 1)
    await expect(anchor).toHaveValue(id)
    await page.getByRole('button', { name: '+ Add anchor milestone', exact: true }).click()
    dialog = page.getByRole('dialog', { name: 'Add milestone', exact: true })
    await dialog.getByLabel('Milestone name', { exact: true }).fill('Do not add')
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(anchor.locator('option:checked')).toHaveText('Service commences')
    await expect(page.locator('.schedule-phase-name .colour-swatch')).toHaveCount(1)
    await expect(row.locator('.colour-swatch')).toHaveCount(0)
    await page.getByLabel('Anchor date', { exact: true }).fill('2032-05-12')
    page.once('dialog', dialog => void dialog.accept())
    await page.reload()
    await page.getByRole('button', { name: 'Resume draft', exact: true }).click()
    await expect(anchor).toHaveValue(id)
    await expect(anchor.locator('option:checked')).toHaveText('Service commences')
    await page.getByRole('button', { name: 'Preview schedule', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Review the schedule', exact: true })).toBeVisible()
    const stored = await page.evaluate(async () => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.listPipelines(location.pathname.split('/')[2]) })
    expect(stored).toEqual([])
  })

  test(`rule counts, colour swatches and one timing highlight fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await setup(page)
    for (const name of ['Dialogue', 'Bid writing', 'Evaluation', 'Moderation']) await browsePhase(page, name)
    const table = page.locator('.schedule-editor-table'), rows = table.locator('tbody tr')
    await expect(table.locator('details.phase-rule-summary')).toHaveCount(3)
    await expect(table.locator('.phase-rule-summary[open]')).toHaveCount(0)
    await expect(rows.nth(0).locator('.phase-rule-summary summary')).toHaveText('2 critical clash rules')
    await expect(rows.nth(2).locator('.phase-rule-summary summary')).toHaveText('1 warning rule')
    await rows.nth(2).locator('.phase-rule-summary summary').click()
    await expect(rows.nth(2).locator('.phase-rule-line')).toContainText('a warning will be flagged')
    await expect(table.getByText('Do not show this rationale in a summary.', { exact: true })).toHaveCount(0)
    await rows.nth(2).locator('.phase-rule-summary summary').click()
    expect(await rows.nth(0).locator('.schedule-phase-name .colour-swatch').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(49, 94, 212)')
    await page.getByRole('combobox', { name: 'Item 4 relationship', exact: true }).selectOption('overlap')
    await page.getByRole('spinbutton', { name: 'Overlap weeks', exact: true }).fill('2')
    await expect(rows.nth(3).locator('.relationship-description')).toHaveText('2-week overlap with Evaluation.')
    await moveRow(page, 3, 2)
    const note = page.locator('.relationship-note')
    await expect(note.getByRole('heading', { name: 'Check timing after reordering', exact: true })).toBeVisible()
    await expect(note.locator('p')).toHaveText(['Previously: 2-week overlap with Evaluation', 'Now: 2-week overlap with Bid writing'])
    expect(await note.evaluate(el => ({ border: getComputedStyle(el).borderTopWidth, background: getComputedStyle(el).backgroundColor }))).toEqual({ border: '0px', background: 'rgba(0, 0, 0, 0)' })
    const unit = page.locator('.relationship-amount > span[aria-hidden=true]')
    await unit.scrollIntoViewIfNeeded()
    expect(await unit.evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); return range.getClientRects().length })).toBe(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width === 1440) {
      expect((await rows.first().locator('td').nth(1).boundingBox())!.width).toBeLessThan(450)
      expect((await rows.first().locator('td').nth(3).boundingBox())!.width).toBeGreaterThanOrEqual(340)
    }
    await page.screenshot({ path: testInfo.outputPath('schedule-table.png') })
    await note.getByRole('button', { name: 'Keep overlap with Bid writing', exact: true }).click()
    await expect(note).toHaveCount(0)
  })
}

test('Library summary durations use week/weeks without whole', async ({ page }) => {
  const id = await setup(page)
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Discard procurement changes', exact: true }).click()
  await page.goto(`/workspaces/${id}/library?section=phases`)
  const table = page.getByRole('region', { name: 'Library phases', exact: true })
  await expect(table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Short phase', exact: true }) })).toContainText('1 week')
  await expect(table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Bid writing', exact: true }) })).toContainText('8 weeks')
  await expect(table).not.toContainText('whole')
})
