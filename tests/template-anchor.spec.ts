import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { ProcurementTemplate } from '../src/data/schemas.ts'
import { addMilestone, browsePhase, moveRow } from './editor-actions.ts'

async function workspace(page: Page) {
  await page.goto('/workspaces')
  const id = await page.evaluate(async () => {
    const path = '/src/data/local-data.ts', { localData } = await import(path)
    const workspace = await localData.createWorkspace('Template anchor team')
    await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 4, color: '#315ed4', checks: [] })
    return workspace.id
  })
  await page.goto(`/workspaces/${id}/library?section=templates`)
  await page.getByRole('button', { name: '+ Create template', exact: true }).click()
  await page.getByLabel('Template name', { exact: true }).fill('Service transfer')
  return id
}

async function anchor(page: Page, name: string) {
  await page.getByRole('button', { name: '+ Add anchor milestone', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Add anchor milestone', exact: true })
  await expect(dialog.getByLabel('Milestone name')).toBeFocused()
  await dialog.getByLabel('Milestone name').fill(name)
  await dialog.getByRole('button', { name: 'Add anchor milestone', exact: true }).click()
  await expect(page.getByLabel('Anchor milestone', { exact: true }).locator('option:checked')).toHaveText(name)
}

for (const width of [320, 1440]) {
  test(`template anchor can be created first, changed, moved and reused without dates at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    const id = await workspace(page)
    await anchor(page, 'Service begins')
    await browsePhase(page, 'Evaluation')
    await addMilestone(page, 'Award review')
    await expect(page.getByLabel('Anchor milestone', { exact: true })).toHaveValue('1')
    await moveRow(page, 0, 1)
    await expect(page.getByLabel('Anchor milestone', { exact: true })).toHaveValue('1')
    await page.getByRole('button', { name: '+ Add anchor milestone', exact: true }).click()
    await page.getByRole('dialog').getByLabel('Milestone name').fill('Cancelled milestone')
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page.locator('.phase-label')).toHaveText(['Evaluation', 'Service begins', 'Award review'])
    await expect(page.getByLabel('Anchor milestone', { exact: true })).toHaveValue('1')
    await expect(page.locator('input[type=date]')).toHaveCount(0)
    const controls = page.getByRole('region', { name: 'Template anchor', exact: true })
    await controls.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('template-anchor.png') })
    await page.getByRole('button', { name: 'Save template', exact: true }).click()
    await expect(page.getByText('Template saved. Existing procurements are unchanged.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await anchor(page, 'Service transfer')
    await expect(page.locator('.phase-label')).toHaveText(['Evaluation', 'Service begins', 'Award review', 'Service transfer'])
    await page.getByRole('button', { name: 'Save template', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible()
    const saved: ProcurementTemplate = await page.evaluate(async id => {
      const path = '/src/data/local-data.ts', { localData } = await import(path)
      return (await localData.listTemplates(id))[0]
    }, id)
    expect(saved.phases.find(item => item.id === saved.anchorId)?.name).toBe('Service transfer')
    expect(saved.phases.some(item => item.name === 'Service begins')).toBe(true)
    expect(saved.phases.every(item => !('s' in item) && !('e' in item))).toBe(true)
    await page.goto(`/workspaces/${id}/pipeline?edit=1&add=1`)
    await page.getByLabel('Start from a template (optional)').selectOption(saved.id)
    await page.getByRole('button', { name: 'Use template', exact: true }).click()
    await expect(page.getByRole('combobox', { name: 'Anchor milestone', exact: true })).toHaveValue(String(saved.phases.findIndex(item => item.id === saved.anchorId) + 1))
    await expect(page.getByLabel('Anchor date', { exact: true })).toHaveValue('')
  })
}

test('removing a selected anchor clears it, guides replacement and never silently selects another milestone', async ({ page }) => {
  await workspace(page)
  await browsePhase(page, 'Evaluation')
  await addMilestone(page, 'Service begins')
  await addMilestone(page, 'Award review')
  await page.getByRole('button', { name: 'Remove milestone: Service begins', exact: true }).click()
  await expect(page.getByLabel('Anchor milestone', { exact: true })).toHaveValue('0')
  await expect(page.getByRole('region', { name: 'Template anchor' }).getByRole('alert')).toContainText('The anchor milestone was removed.')
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await expect(page.locator('.template-editor')).toBeVisible()
  await page.getByLabel('Anchor milestone', { exact: true }).selectOption({ label: 'Award review' })
  await expect(page.getByRole('region', { name: 'Template anchor' }).getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Remove milestone: Award review', exact: true }).click()
  await anchor(page, 'Replacement anchor')
  await expect(page.getByRole('region', { name: 'Template anchor' }).getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await expect(page.getByText('Template saved. Existing procurements are unchanged.', { exact: true })).toBeVisible()
})
