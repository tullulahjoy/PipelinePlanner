import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export async function addMilestone(page: Page, name: string) {
  await page.getByRole('button', { name: '+ Add milestone', exact: true }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add milestone', exact: true })
  await dialog.getByLabel('Milestone name', { exact: true }).fill(name)
  await dialog.getByRole('button', { name: 'Add milestone', exact: true }).click()
}
export async function browsePhase(page: Page, name: string) {
  await page.getByRole('button', { name: '+ Add phase', exact: true }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add phase', exact: true })
  await dialog.getByRole('radio', { name: new RegExp(name) }).check()
  await dialog.getByRole('button', { name: 'Add phase to procurement', exact: true }).click()
}
export async function createInlinePhase(page: Page) {
  await page.getByRole('button', { name: '+ Add phase', exact: true }).first().click()
  await page.getByRole('dialog', { name: 'Add phase', exact: true }).getByRole('button', { name: '+ Create a new phase', exact: true }).click()
}
export async function confirmProcurement(page: Page) {
  const modal = page.getByRole('dialog', { name: /^(Add procurement to pipeline plan\?|Save procurement changes\?)$/ })
  await expect(modal).toBeVisible()
  await modal.getByRole('button', { name: /^(Add to pipeline plan|Confirm and save)$/ }).click()
}
export async function editProcurementName(page: Page, name: string) {
  await page.getByRole('button', { name: 'Edit details', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Edit procurement details', exact: true })
  await modal.getByLabel('Procurement name', { exact: true }).fill(name)
  await modal.getByRole('button', { name: 'Use these details', exact: true }).click()
}
export async function editPhaseRules(page: Page, name: string, severity: 'warning' | 'critical', reason = '') {
  await page.getByRole('button', { name: /^Manage phases/ }).click()
  const row = page.getByRole('region', { name: 'Library phases', exact: true }).getByRole('row').filter({ has: page.getByRole('rowheader', { name: new RegExp(name) }) })
  await row.getByRole('button', { name: 'Edit', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit phase', exact: true })
  await dialog.getByRole('button', { name: '+ Add clash-checking rule', exact: true }).click()
  await dialog.getByLabel('Rule 1 severity', { exact: true }).selectOption(severity)
  if (reason) { await dialog.locator('.phase-rule-explanation summary').first().click(); await dialog.getByLabel('Rule 1 explanation', { exact: true }).fill(reason) }
  await dialog.getByRole('button', { name: 'Save phase', exact: true }).click()
}

export async function moveRow(page: Page, from: number, to: number) {
  const row = page.locator('.schedule-editor-table tbody tr').nth(from)
  await row.getByRole('button', { name: /^Move / }).focus()
  await page.keyboard.press('Space')
  const key = to < from ? 'ArrowUp' : 'ArrowDown'
  for (let index = 0; index < Math.abs(to - from); index++) await page.keyboard.press(key)
  await page.keyboard.press('Space')
}
