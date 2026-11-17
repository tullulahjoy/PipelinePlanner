import { expect, test } from '@playwright/test'
import { browsePhase } from './editor-actions.ts'

for (const width of [320, 1440]) {
  test(`phase settings group local edits and shared rules with protected Cancel/Done at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/workspaces')
    const data = await page.evaluate(async () => {
      const path = '/src/data/local-data.ts', { localData } = await import(path)
      const workspace = await localData.createWorkspace('Settings layout')
      await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 4, color: '#315ed4', checks: [] })
      const library = await localData.createPhase(workspace.id, { name: 'Moderation', weeks: 2, color: '#16766f', checks: [{ target: 'self', severity: 'critical', reason: '' }] })
      return { workspaceId: workspace.id, moderationId: library.phases[1].id }
    })
    await page.goto(`/workspaces/${data.workspaceId}/pipeline?edit=1&add=1`)
    await browsePhase(page, 'Evaluation')
    await page.getByRole('button', { name: 'Edit phase: Evaluation', exact: true }).click()
    const modal = page.locator('.schedule-item-dialog')
    await expect(modal.getByLabel('Name', { exact: true })).toBeFocused()
    await expect(modal.getByRole('region', { name: 'Clash-checking rules' })).toContainText('No clash-checking rules are set for this Library phase.')
    await expect(modal).toContainText('Changes to shared clash-checking rules apply across pipeline plans.')
    const name = (await modal.getByLabel('Name', { exact: true }).boundingBox())!
    const link = (await modal.getByRole('combobox', { name: 'Library phase', exact: true }).boundingBox())!
    expect(link.y - name.y - name.height).toBeGreaterThanOrEqual(18)
    await expect(modal.locator('footer').getByRole('button')).toHaveText(['Cancel', 'Done'])
    await expect(modal.getByRole('link')).toHaveCount(0)
    expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('phase-settings-empty.png') })
    await modal.getByLabel('Name', { exact: true }).fill('Temporary name')
    await modal.getByRole('combobox', { name: 'Library phase', exact: true }).selectOption(data.moderationId)
    await expect(modal.locator('.shared-rule-summary')).toContainText('Critical clash')
    await page.screenshot({ path: testInfo.outputPath('phase-settings-rules.png') })
    await modal.locator('footer').getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page.locator('.schedule-editor-table .phase-label')).toHaveText('Evaluation')
    await expect(page.getByRole('button', { name: 'View Library phase: Evaluation', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Edit phase: Evaluation', exact: true }).click()
    await modal.getByLabel('Name', { exact: true }).fill('Local evaluation')
    await modal.locator('footer').getByRole('button', { name: 'Done', exact: true }).click()
    await expect(page.locator('.schedule-editor-table .phase-label')).toHaveText('Local evaluation')
    await page.getByRole('button', { name: 'Edit phase: Local evaluation', exact: true }).click()
    await modal.getByRole('button', { name: 'Edit Library phase and rules', exact: true }).click()
    const libraryEditor = page.locator('.phase-dialog')
    await expect(libraryEditor.getByLabel('Phase name', { exact: true })).toHaveValue('Evaluation')
    await libraryEditor.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(modal.getByLabel('Name', { exact: true })).toHaveValue('Local evaluation')
    await modal.getByRole('button', { name: 'Done', exact: true }).click()
    const stored = await page.evaluate(async id => {
      const path = '/src/data/local-data.ts', { localData } = await import(path)
      return localData.getLibrary(id)
    }, data.workspaceId)
    expect(stored.phases.map((phase: { name: string }) => phase.name)).toEqual(['Evaluation', 'Moderation'])
  })
}
