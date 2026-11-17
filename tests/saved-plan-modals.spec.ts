import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { confirmProcurement, editProcurementName } from './editor-actions.ts'

async function setup(page: Page, _live = false) {
  await page.goto('/workspaces')
  const data = await page.evaluate(async () => {
    const dataPath = '/src/data/local-data.ts', projectPath = '/src/domain/project.ts'
    const { localData } = await import(dataPath), { scheduleProject } = await import(projectPath)
    const workspace = await localData.createWorkspace('Saved-plan team')
    const library = await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 4, color: '#315ed4', checks: [] })
    const phase = library.phases[0]
    const project = scheduleProject({ id: crypto.randomUUID(), name: 'Community services', anchor: Date.UTC(2032, 4, 12), planningAnchor: 0, anchorId: 2, anchorName: 'Service begins', nextPhaseId: 3, approvedBaseline: null, phases: [
      { ...phase, id: 1, kind: 'phase', offset: 0, libraryPhaseId: phase.id, durationInherited: true, s: 0, e: 0 },
      { id: 2, name: 'Service begins', kind: 'milestone', weeks: 0, offset: 0, libraryPhaseId: '', color: '#536ea1', durationInherited: false, s: 0, e: 0 },
    ] })
    const record = await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: workspace.id, name: 'Winter plan', note: 'Retain these notes', plans: [project], acknowledgements: [], expectedRevision: 0, expectedLibraryRevision: library.revision })
    const current = await localData.savePipeline({ ...record, id: crypto.randomUUID(), name: 'Live plan', expectedRevision: 0, expectedLibraryRevision: library.revision })
    await localData.makeLive(workspace.id, current.id, current.revision, record.id)
    return { workspace, record }
  })
  await page.goto(`/workspaces/${data.workspace.id}/saved-pipelines`)
  return data
}
const modal = (page: Page, editing = false) => page.getByRole('dialog', { name: editing ? 'Editing pipeline plan' : 'Viewing saved pipeline plan', exact: true })
async function editName(page: Page) {
  await modal(page, true).getByRole('button', { name: 'Community services', exact: true }).click()
  await editProcurementName(page, 'Updated community services')
  await page.getByRole('button', { name: 'Preview changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await confirmProcurement(page)
}
async function openSave(page: Page, mode = 'Save') {
  await modal(page, true).getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('group', { name: 'Save the displayed pipeline plan' }).getByRole('button', { name: mode, exact: true }).click()
}

for (const width of [320, 1440]) test(`saved View is a self-contained modal over its list at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 })
  const data = await setup(page, true)
  const row = page.getByRole('row').filter({ has: page.getByRole('link', { name: 'Winter plan', exact: true }) })
  await row.getByRole('link', { name: 'View', exact: true }).click()
  const view = modal(page)
  await expect(view).toBeVisible()
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden')
  await expect(page).toHaveURL(new RegExp(`/saved-pipelines/${data.record.id}$`))
  await expect(page.locator('.page-heading h1')).toHaveText('Saved Pipeline Plans')
  await expect(page.locator('.app-nav a[aria-current=page]')).toHaveText('Saved Pipeline Plans')
  await expect(view.getByRole('link', { name: 'Edit this pipeline plan', exact: true })).toHaveCount(1)
  await expect(view.getByRole('link', { name: /Resume editing|Return to live|Saved Pipeline Plans/ })).toHaveCount(0)
  await view.getByRole('button', { name: 'Community services', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Community services', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close Community services', exact: true }).click()
  await page.screenshot({ path: info.outputPath('saved-view-modal.png') })
  await view.getByRole('button', { name: 'Close Viewing saved pipeline plan', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/saved-pipelines$`))
  await expect(row.getByRole('link', { name: 'View', exact: true })).toBeFocused()
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Live Pipeline', exact: true }).click()
  await expect(page.locator('.pipeline-context-panel')).toContainText('Live plan')
  await expect(page.locator('.pipeline-context-panel').getByRole('link', { name: 'Saved Pipeline Plans', exact: true })).toHaveCount(0)
})

test('editing, Save and Save as stay over the list; closing preserves unsaved-change choices', async ({ page }) => {
  const data = await setup(page)
  await page.getByRole('row').filter({ hasText: 'Winter plan' }).getByRole('link', { name: 'Edit', exact: true }).click()
  await editName(page)
  await modal(page, true).getByRole('button', { name: 'Close Editing pipeline plan', exact: true }).click()
  const exit = page.getByRole('dialog', { name: 'Exit edit mode?', exact: true })
  await expect(exit).toContainText('returning to Saved Pipeline Plans')
  await exit.getByRole('button', { name: 'Keep editing', exact: true }).click()
  await expect(modal(page, true)).toContainText('Updated community services')
  await openSave(page)
  await page.getByRole('dialog', { name: 'Save changes to “Winter plan”?', exact: true }).getByRole('button', { name: 'Overwrite and save', exact: true }).click()
  await expect(modal(page, true)).toContainText('All changes saved')
  await expect(page).toHaveURL(new RegExp(`/saved-pipelines/${data.record.id}\\?edit=1$`))
  await expect(page.getByRole('link', { name: 'View saved pipeline plan', exact: true })).toHaveCount(0)
  await expect(modal(page, true).locator('.notice')).toHaveCount(0)
  await openSave(page, 'Save as…')
  const save = page.getByRole('dialog', { name: 'Save pipeline plan', exact: true })
  await save.getByLabel('Name (required)', { exact: true }).fill('Spring alternative')
  await save.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal(page, true)).toContainText('Spring alternative')
  await modal(page, true).getByRole('button', { name: 'Close Editing pipeline plan', exact: true }).click()
  await expect(page).toHaveURL(/\/saved-pipelines$/)
  await expect(page.getByRole('link', { name: 'Spring alternative', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Winter plan', exact: true })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Winter plan' }).getByRole('link', { name: 'Edit', exact: true })).toBeFocused()
})

test('first saved candidate has no duplicate saved navigation; old links redirect and refresh restores the modal', async ({ page }) => {
  const data = await setup(page)
  const base = `/workspaces/${data.workspace.id}`
  await page.goto(`${base}/pipeline`)
  await expect(page.getByRole('link', { name: 'Choose a saved pipeline plan', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Saved Pipeline Plans', exact: true })).toHaveCount(1)
  await page.getByRole('link', { name: 'Edit live plan', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Editing live pipeline plan', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close Editing live pipeline plan', exact: true }).click()
  await page.goto(`${base}/pipeline/${data.record.id}`)
  await expect(page).toHaveURL(`${base}/saved-pipelines/${data.record.id}`)
  await page.reload()
  await expect(modal(page)).toBeVisible()
  await modal(page).getByRole('link', { name: 'Edit this pipeline plan', exact: true }).click()
  await expect(modal(page, true)).toBeVisible()
})

test('outer close protects an unfinished procurement; Adjust is a nested modal with independent discard', async ({ page }) => {
  await setup(page)
  await page.getByRole('row').filter({ hasText: 'Winter plan' }).getByRole('link', { name: 'Edit', exact: true }).click()
  const editing = modal(page, true)
  await editing.getByRole('button', { name: '+ Add procurement', exact: true }).click()
  await page.getByLabel('Procurement name').fill('Unfinished procurement')
  await editing.getByRole('button', { name: 'Close Editing pipeline plan', exact: true }).click()
  const warning = page.getByRole('dialog', { name: 'Unsaved changes', exact: true })
  await warning.getByRole('button', { name: 'Keep editing', exact: true }).click()
  await expect(page.getByLabel('Procurement name')).toHaveValue('Unfinished procurement')
  await editing.getByRole('button', { name: 'Close Editing pipeline plan', exact: true }).click()
  await warning.getByRole('button', { name: 'Discard changes', exact: true }).click()
  await page.getByRole('row').filter({ hasText: 'Winter plan' }).getByRole('link', { name: 'Edit', exact: true }).click()
  await modal(page, true).getByRole('button', { name: 'Adjust pipeline plan', exact: true }).click()
  const adjust = page.getByRole('dialog', { name: 'Adjust pipeline plan', exact: true })
  await adjust.getByRole('button', { name: 'Apply movement', exact: true }).click()
  await adjust.getByRole('button', { name: 'Cancel adjustment', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Discard adjustments', exact: true }).click()
  await expect(modal(page, true)).toBeVisible()
  await expect(modal(page, true)).toContainText('All changes saved')
  await modal(page, true).getByRole('button', { name: 'Close Editing pipeline plan', exact: true }).click()
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')
})

test('a saved procurement deep link opens its details in front of the viewer', async ({ page }) => {
  const data = await setup(page)
  await page.goto(`/workspaces/${data.workspace.id}/pipeline/${data.record.id}?procurement=${data.record.plans[0].id}`)
  const details = page.getByRole('dialog', { name: 'Community services', exact: true })
  await expect(details).toBeVisible()
  await details.getByRole('button', { name: 'Close details', exact: true }).click()
  await expect(modal(page)).toBeVisible()
  await modal(page).getByRole('button', { name: 'Close Viewing saved pipeline plan', exact: true }).click()
  await expect(page).toHaveURL(/\/saved-pipelines$/)
  await expect(page.getByRole('row').filter({ hasText: 'Winter plan' }).getByRole('link', { name: 'View', exact: true })).toBeFocused()
})
