import { confirmProcurement, editProcurementName, editPhaseRules } from './editor-actions.ts'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const navigation = (page: Page) => page.getByRole('navigation', { name: 'Main navigation' })
const go = (page: Page, name: string) => navigation(page).getByRole('link', { name, exact: true }).click()

async function seed(page: Page, multiple = false) {
  await page.goto('/workspaces')
  return page.evaluate(async multiple => {
    const dataPath = '/src/data/local-data.ts', schedulingPath = '/src/domain/project.ts'
    const { localData } = await import(dataPath)
    const { scheduleProject } = await import(schedulingPath)
    const workspace = await localData.createWorkspace('Planning team')
    const other = await localData.createWorkspace('Other team')
    const library = await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 2, color: '#315ed4', checks: [] })
    const phase = library.phases[0]
    const project = scheduleProject({ id: crypto.randomUUID(), name: 'Community services', anchor: Date.parse('2032-05-12T00:00:00Z'), planningAnchor: 0, anchorId: 2, anchorName: 'Go-live', nextPhaseId: 3, approvedBaseline: null, phases: [
      { id: 1, name: phase.name, kind: 'phase', weeks: 2, offset: 0, libraryPhaseId: phase.id, color: phase.color, durationInherited: true, s: 0, e: 0 },
      { id: 2, name: 'Go-live', kind: 'milestone', weeks: 0, offset: 0, libraryPhaseId: '', color: '#536ea1', durationInherited: false, s: 0, e: 0 },
    ] })
    const plans = multiple ? [project, { ...project, id: crypto.randomUUID(), name: 'Digital services' }] : [project]
    const first = await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: workspace.id, expectedRevision: 0, expectedLibraryRevision: library.revision, name: 'Autumn pipeline plan', note: 'First planning reference', plans, acknowledgements: [] })
    const second = await localData.savePipeline({ ...first, id: crypto.randomUUID(), expectedRevision: 0, expectedLibraryRevision: library.revision, name: 'Spring pipeline plan', note: 'Alternative planning reference' })
    return { workspace, other, first, second, phase }
  }, multiple)
}

async function changeProject(page: Page, name = 'Pending procurement') {
  await page.getByRole('button', { name: 'Community services', exact: true }).click()
  await expect(page.getByText('Make your changes, preview their effect on the pipeline plan, then save.', { exact: true })).toBeVisible()
  await editProcurementName(page, name)
  await page.getByRole('button', { name: 'Preview changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await confirmProcurement(page)
  await expect(page.getByText('Unsaved changes', { exact: true })).toBeVisible()
}

async function openLiveAlternative(page: Page, data: Awaited<ReturnType<typeof seed>>) {
  await page.goto(`/workspaces/${data.workspace.id}/pipeline?edit=1`)
}

test('leaving the live editor protects changes before opening other pages', async ({ page }) => {
  const data = await seed(page), base = `/workspaces/${data.workspace.id}`
  await openLiveAlternative(page, data)
  await changeProject(page)
  await page.locator('.app-nav a').filter({ hasText: /^Library$/ }).evaluate(element => (element as HTMLAnchorElement).click())
  const guard = page.getByRole('dialog', { name: 'Unsaved changes', exact: true })
  await guard.getByRole('button', { name: 'Keep editing', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pending procurement', exact: true })).toBeVisible()
  await page.locator('.app-nav a').filter({ hasText: /^Library$/ }).evaluate(element => (element as HTMLAnchorElement).click())
  await guard.getByRole('button', { name: 'Save before leaving', exact: true }).click()
  await page.getByRole('dialog', { name: /Save changes to/ }).getByRole('button', { name: 'Overwrite and save', exact: true }).click()
  await expect(page).toHaveURL(`${base}/library`)
  await go(page, 'Saved Pipeline Plans')
  await page.getByRole('row').filter({ hasText: 'Spring pipeline plan' }).getByRole('link', { name: 'View', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Viewing saved pipeline plan', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close Viewing saved pipeline plan', exact: true }).click()
  await go(page, 'Live Pipeline')
  await expect(page.getByRole('button', { name: 'Pending procurement', exact: true })).toBeVisible()
})

test('dirty forms and dirty working pipeline plans share one navigation guard', async ({ page }) => {
  const warnings: string[] = []
  page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()) })
  const data = await seed(page)
  await openLiveAlternative(page, data)
  await changeProject(page)
  await page.getByRole('button', { name: '+ Add procurement', exact: true }).click()
  await page.getByLabel('Procurement name').fill('Unapplied form')
  await page.locator('.app-nav a').filter({ hasText: /^Library$/ }).evaluate(element => (element as HTMLAnchorElement).click())
  const dialog = page.getByRole('dialog', { name: 'Unsaved changes', exact: true })
  await expect(dialog.getByRole('button', { name: 'Keep editing' })).toBeFocused()
  await dialog.getByRole('button', { name: 'Keep editing' }).click()
  await expect(page.getByLabel('Procurement name')).toHaveValue('Unapplied form')
  await page.locator('.app-nav a').filter({ hasText: /^Library$/ }).evaluate(element => (element as HTMLAnchorElement).click())
  await dialog.getByRole('button', { name: 'Discard changes' }).click()
  await dialog.getByRole('button', { name: 'Discard changes' }).click()
  await expect(page.getByRole('heading', { name: 'Templates and phase library', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Manage phases/ }).click()
  await page.getByRole('button', { name: '+ Create phase', exact: true }).click()
  const phase = page.getByRole('dialog', { name: 'Create phase', exact: true })
  await phase.getByLabel('Phase name', { exact: true }).fill('Unfinished definition')
  await phase.getByRole('button', { name: 'Create phase', exact: true }).click()
  await expect(phase).not.toBeVisible()
  await page.getByRole('button', { name: '+ Create phase', exact: true }).click()
  await phase.getByLabel('Phase name', { exact: true }).fill('Discard this form')
  await page.goBack()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Keep editing' }).click()
  await expect(phase.getByLabel('Phase name', { exact: true })).toHaveValue('Discard this form')
  await page.goBack()
  await dialog.getByRole('button', { name: 'Discard changes' }).click()
  await expect(page.getByRole('button', { name: 'Community services', exact: true })).toBeVisible()
  expect(warnings.filter(message => /blocker|maximum update/i.test(message))).toEqual([])
})

test('saved modal close offers save/discard/cancel before workspace switching and retains failed Save inputs', async ({ page }) => {
  const data = await seed(page)
  await page.goto(`/workspaces/${data.workspace.id}/pipeline/${data.second.id}?edit=1`)
  await changeProject(page)
  await page.getByRole('button', { name: 'Exit edit mode', exact: true }).click()
  const close = page.getByRole('dialog', { name: 'Exit edit mode?', exact: true })
  await close.getByRole('button', { name: 'Keep editing', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pending procurement', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Exit edit mode', exact: true }).click()
  await close.getByRole('button', { name: 'Save and exit', exact: true }).click()
  const saving = page.getByRole('dialog', { name: `Save changes to “${data.second.name}”?`, exact: true })
  await saving.getByLabel('Notes (optional)', { exact: true }).fill('Save before changing teams')
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'pipelines') { IDBObjectStore.prototype.put = original; throw new DOMException('Test storage failure', 'QuotaExceededError') }
      return original.apply(this, args)
    }
  })
  await saving.getByRole('button', { name: 'Save and exit', exact: true }).click()
  await expect(saving.getByRole('alert')).toContainText('could not be saved')
  await expect(saving.getByLabel('Notes (optional)', { exact: true })).toHaveValue('Save before changing teams')
  await saving.getByRole('button', { name: 'Save and exit', exact: true }).click()
  await expect(page).toHaveURL(`/workspaces/${data.workspace.id}/saved-pipelines`)
  await navigation(page).getByRole('combobox', { name: 'Workspace', exact: true }).selectOption(data.other.id)
  await expect(page).toHaveURL(`/workspaces/${data.other.id}/saved-pipelines`)
  await go(page, 'Live Pipeline')
  await page.getByRole('dialog', { name: 'Your pipeline plan starts here' }).getByRole('button', { name: 'Got it', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your pipeline plan starts here', exact: true, level: 1 })).toBeVisible()
  await navigation(page).getByRole('combobox').selectOption(data.workspace.id)
  await go(page, 'Saved Pipeline Plans')
  await page.getByRole('row').filter({ hasText: 'Spring pipeline plan' }).getByRole('link', { name: 'Edit', exact: true }).click()
  await page.getByRole('button', { name: 'Pending procurement', exact: true }).click()
  await editProcurementName(page, 'Discarded change')
  await page.getByRole('button', { name: 'Preview changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await confirmProcurement(page)
  await page.getByRole('button', { name: 'Exit edit mode', exact: true }).click()
  await close.getByRole('button', { name: 'Discard changes and exit', exact: true }).click()
  await navigation(page).getByRole('combobox').selectOption(data.other.id)
  await expect(page).toHaveURL(`/workspaces/${data.other.id}/saved-pipelines`)
  const record = await page.evaluate(async ({ workspace, second }) => {
    const modulePath = '/src/data/local-data.ts'; const { localData } = await import(modulePath)
    return localData.getPipeline(workspace.id, second.id)
  }, data)
  expect(record.plans[0].name).toBe('Pending procurement')
})

test('How it works preserves planning guidance and explains the complete first live plan journey', async ({ page }) => {
  await page.goto('/workspaces')
  await page.getByLabel('Workspace name').fill('New team')
  await page.getByRole('button', { name: 'Create workspace' }).click()
  await expect(page.locator('.pipeline-introduction')).toContainText('set its anchor milestone and date (the fixed point around which its schedule must be calculated)')
  await expect(page.locator('.welcome-help p').first()).toHaveText('See How it works for the full guide to building procurement schedules, checking for clashes, saving progress and working with your live plan.')
  await page.locator('.pipeline-introduction').getByRole('link', { name: 'How it works', exact: true }).click()
  const approved = await readFile('mockups/how-it-works.html', 'utf8')
  const reference = await page.context().newPage()
  await reference.setContent(approved)
  const selectors = ['.workflow > li:nth-child(-n+3) h2', '.workflow > li:nth-child(-n+3) p', '.date-notes h2', '.date-notes h3', '.date-notes p']
  for (const selector of selectors) expect(await page.locator(selector).allTextContents()).toEqual((await reference.locator(selector).allTextContents()).map(text => text.replace('the actual date', 'the entered date').replace('Identify problematic overlaps', 'Clash checks').replace('Overlap rules', 'Clash-checking rules')))
  await reference.close()
  await expect(page.locator('.workflow h2')).toHaveText(['Build a procurement’s plan', 'Plan around a fixed date', 'Clash checks', 'Save your live plan', 'Update or explore alternatives', 'Choose a different live plan'])
  await expect(page.locator('.workflow')).toContainText("Your first saved plan becomes your workspace's live plan automatically")
  await expect(page.locator('.workflow')).toContainText('Live Pipeline')
  await expect(page.getByText('Choose Compare beside a plan in Saved Pipeline Plans to compare two saved plans. Exporting to Excel is planned next.', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return to Live Pipeline', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View live pipeline plan', exact: true })).toHaveCount(0)
})

test('Library rule changes refresh the live plan without rescheduling or saving it', async ({ page }) => {
  const data = await seed(page, true)
  await page.goto(`/workspaces/${data.workspace.id}/library`)
  await editPhaseRules(page, 'Evaluation', 'warning', 'Shared evaluation team')
  await go(page, 'Live Pipeline')
  await page.getByRole('link', { name: 'Edit live plan', exact: true }).click()
  await expect(page.getByText('1 warning', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /^Community services: Evaluation Planning dates: 26 Apr 2032 to 7 May 2032/ })).toBeVisible()
  const stored = await page.evaluate(async ({ workspace, first }) => {
    const modulePath = '/src/data/local-data.ts'; const { localData } = await import(modulePath)
    return localData.getPipeline(workspace.id, first.id)
  }, data)
  expect(stored.plans).toEqual(data.first.plans)
})

test('Save as from overwrite keeps the entered reason and creates a distinct record', async ({ page }) => {
  const data = await seed(page)
  await page.goto(`/workspaces/${data.workspace.id}/pipeline/${data.first.id}?edit=1`)
  await changeProject(page)
  await page.getByRole('region', { name: 'Pipeline Plan context' }).getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('group', { name: 'Save the displayed pipeline plan' }).getByRole('button', { name: 'Save', exact: true }).click()
  let dialog = page.getByRole('dialog', { name: /Save changes to/ })
  await expect(dialog.getByText('This will overwrite the previously saved pipeline plan. To keep it and create a new copy, choose Save as and enter a different name.', { exact: true })).toBeVisible()
  await dialog.getByLabel('Notes (optional)', { exact: true }).fill('Keep the original and this alternative')
  await dialog.getByRole('button', { name: 'Save as…', exact: true }).click()
  dialog = page.getByRole('dialog', { name: 'Save pipeline plan', exact: true })
  await expect(dialog.getByLabel('Notes (optional)', { exact: true })).toHaveValue('Keep the original and this alternative')
  await dialog.getByLabel('Name (required)', { exact: true }).fill('Saved as an alternative')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible()
  const records = await page.evaluate(async workspace => {
    const modulePath = '/src/data/local-data.ts'; const { localData } = await import(modulePath)
    return localData.listPipelines(workspace.id)
  }, data.workspace)
  expect(records.find((record: { id: string }) => record.id === data.first.id)).toEqual(data.first)
  const copy = records.find((record: { name: string }) => record.name === 'Saved as an alternative')
  expect(copy.id).not.toBe(data.first.id)
  expect(copy.plans[0].name).toBe('Pending procurement')
})

for (const width of [320, 768, 1440]) {
  test(`workspace controls stay in the header and guide fits at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    const data = await seed(page)
    await page.goto(`/workspaces/${data.workspace.id}/pipeline`)
    for (const name of ['Live Pipeline', 'Library', 'Saved Pipeline Plans', 'How it works']) {
      await go(page, name)
      await expect(navigation(page).getByRole('combobox', { name: 'Workspace', exact: true })).toHaveValue(data.workspace.id)
      await expect(page.locator('main').getByRole('combobox', { name: 'Workspace', exact: true })).toHaveCount(0)
      await expect(page.locator('.workspace-bar')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    await page.screenshot({ path: testInfo.outputPath('guide.png'), fullPage: true })
    await navigation(page).getByRole('link', { name: 'Live Pipeline', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toBeFocused()
    await expect(page.locator('.pipeline-context-panel')).toHaveAttribute('data-state', 'live')
    await page.screenshot({ path: testInfo.outputPath('pipeline.png'), fullPage: true })
  })
}
