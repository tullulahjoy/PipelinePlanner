import { addMilestone, browsePhase, createInlinePhase, confirmProcurement, editProcurementName, editPhaseRules, moveRow } from './editor-actions.ts'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { SavedPipeline } from '../src/data/schemas.ts'

async function openSave(page: Page, mode = 'Save') {
  await page.getByRole('region', { name: 'Pipeline Plan context' }).getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('group', { name: 'Save the displayed pipeline plan' }).getByRole('button', { name: mode, exact: true }).click()
}
async function workspace(page: Page, name = 'Planning team') {
  await page.goto('/workspaces')
  await page.getByLabel('Workspace name').fill(name)
  await page.getByRole('button', { name: 'Create workspace', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your pipeline plan starts here', exact: true, level: 1 })).toBeVisible()
  await page.getByRole('dialog', { name: 'Your pipeline plan starts here' }).getByRole('button', { name: 'Got it', exact: true }).click()
  return page.url().split('/')[4]!
}

async function phaseDialog(page: Page, name = 'Evaluation', weeks = 2) {
  const dialog = page.getByRole('dialog', { name: 'Create phase', exact: true })
  await dialog.getByLabel('Phase name', { exact: true }).fill(name)
  await dialog.getByLabel('Default duration (weeks)').fill(String(weeks))
  await dialog.getByRole('button', { name: /^Create phase(?: and add to procurement)?$/ }).click()
  await expect(dialog).not.toBeVisible()
}

async function procurement(page: Page, name: string, inlinePhase = false) {
  await expect(page.locator('.pipeline-page').first()).toBeVisible()
  const welcome = page.getByRole('dialog', { name: 'Your pipeline plan starts here', exact: true })
  if (await welcome.isVisible()) await welcome.getByRole('button', { name: 'Got it', exact: true }).click()
  await page.getByRole('button', { name: '+ Add procurement', exact: true }).click()
  await page.getByLabel('Procurement name').fill(name)
  if (inlinePhase) {
    await createInlinePhase(page)
    await phaseDialog(page)
  } else {
    await browsePhase(page, 'Evaluation')
  }
  await addMilestone(page, 'Go-live')
  await page.getByLabel('Anchor date', { exact: true }).fill('2032-05-12')
  await page.getByRole('button', { name: /^Preview (?:schedule|changes)$/ }).click()
  await expect(page.getByRole('heading', { name: 'Review the schedule' })).toBeVisible()
  await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
  await confirmProcurement(page)
  await expect(page.getByRole('heading', { name: 'Editing live pipeline plan', exact: true })).toBeVisible()
}

async function save(page: Page, name = 'Spring pipeline plan') {
  await openSave(page)
  const dialog = page.locator('dialog.save-pipeline-dialog')
  await dialog.getByLabel('Name (required)', { exact: true }).fill(name)
  await dialog.getByLabel('Notes (optional)', { exact: true }).fill('Initial planning review')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Editing live pipeline plan', exact: true })).toContainText('All changes saved')
  return page.evaluate(async () => { const path = '/src/data/local-data.ts'; return (await (await import(path)).localData.getWorkspace(location.pathname.split('/')[2])).currentBaselineId })
}

test('empty Library to saved pipeline plan, reload, edit a duration and Save as', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const id = await workspace(page)
  await procurement(page, 'Community services', true)
  await expect(page.getByText('No clash-checking rules have been set up.', { exact: false })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Pipeline Plan timeline' })).toBeVisible()
  await save(page)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Community services', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Community services', exact: true }).click()
  await expect(page.locator('.procurement-summary')).not.toContainText('Locked')
  await page.getByLabel('Item 1 duration in weeks', { exact: true }).fill('3')
  await expect(page.locator('.duration-provenance').filter({ hasText: 'Custom' })).toBeVisible()
  await page.getByRole('button', { name: /^Preview (?:schedule|changes)$/ }).click()
  await page.locator('.phase-date-details > summary').click()
  await expect(page.getByRole('columnheader', { name: 'What changed' })).toBeVisible()
  await expect(page.getByText('7 May 2032', { exact: false }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await confirmProcurement(page)
  await openSave(page, 'Save as…')
  const dialog = page.locator('dialog.save-pipeline-dialog')
  await dialog.getByLabel('Name (required)', { exact: true }).fill('Longer evaluation')
  await dialog.getByLabel('Notes (optional)', { exact: true }).fill('More evaluation time')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/saved-pipelines\/[\da-f-]+\?edit=1$/)
  const copy = await savedRecord(page, id, page.url().split('/saved-pipelines/')[1].split('?')[0])
  expect(copy.plans[0].phases[0].durationInherited).toBe(false)
  await page.goto(`/workspaces/${id}/saved-pipelines`)
  await expect(page.getByRole('row')).toHaveCount(3)
  await page.getByRole('row').filter({ hasText: 'Spring pipeline plan' }).getByRole('link', { name: 'View', exact: true }).click()
  await expect(page.getByRole('button', { name: '+ Add procurement', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Edit live plan' })).toBeVisible()
  expect(errors).toEqual([])
})

test('critical Add clashes stay visible without requiring justification and optional save notes are retained', async ({ page }) => {
  await workspace(page)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Library', exact: true }).click()
  await page.getByRole('button', { name: /^Manage phases/ }).click()
  await page.getByRole('button', { name: '+ Create phase', exact: true }).click()
  await phaseDialog(page)
  await editPhaseRules(page, 'Evaluation', 'critical')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Live Pipeline', exact: true }).click()
  await procurement(page, 'First procurement')
  await procurement(page, 'Second procurement')
  await expect(page.getByText('1 critical clash', { exact: true }).first()).toBeVisible()
  await expect(page.getByLabel('Reason for proceeding with critical clashes', { exact: true })).toHaveCount(0)
  await save(page)
  await page.getByRole('button', { name: 'Exit edit mode', exact: true }).click()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Saved Pipeline Plans', exact: true }).click()
  await page.getByText('Saved details', { exact: true }).click()
  await expect(page.locator('.saved-details')).toContainText('Initial planning review')
})

test('foreground leave protection keeps edits, then can save before leaving', async ({ page }) => {
  await workspace(page)
  await procurement(page, 'Working procurement', true)
  await page.locator('.app-nav a').filter({ hasText: /^Workspaces$/ }).evaluate(element => (element as HTMLAnchorElement).click())
  const leave = page.getByRole('dialog', { name: 'Unsaved changes', exact: true })
  await expect(leave).toBeVisible()
  await expect(leave.getByRole('button', { name: 'Keep editing' })).toBeFocused()
  await leave.getByRole('button', { name: 'Keep editing' }).click()
  await expect(page.getByRole('button', { name: 'Working procurement', exact: true })).toBeVisible()
  await page.locator('.app-nav a').filter({ hasText: /^Workspaces$/ }).evaluate(element => (element as HTMLAnchorElement).click())
  await leave.getByRole('button', { name: 'Save before leaving' }).click()
  const saving = page.getByRole('dialog', { name: 'Save pipeline plan', exact: true })
  await saving.getByLabel('Name (required)', { exact: true }).fill('Saved before leaving')
  await saving.getByLabel('Notes (optional)', { exact: true }).fill('Keep this working schedule')
  await saving.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your workspaces', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Planning team View workspace', exact: false }).click()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Saved Pipeline Plans', exact: true }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Saved before leaving' })).toBeVisible()
})

test('failed pipeline plan write preserves working contents and allows retry', async ({ page }) => {
  await workspace(page)
  await procurement(page, 'Unsaved procurement', true)
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'pipelines') { IDBObjectStore.prototype.put = original; throw new DOMException('Test full storage', 'QuotaExceededError') }
      return original.apply(this, args)
    }
  })
  await openSave(page)
  const dialog = page.locator('dialog.save-pipeline-dialog')
  await dialog.getByLabel('Name (required)', { exact: true }).fill('Retry pipeline plan')
  await dialog.getByLabel('Notes (optional)', { exact: true }).fill('Storage failure must not lose work')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('could not be saved')
  await expect(dialog.getByLabel('Name (required)', { exact: true })).toHaveValue('Retry pipeline plan')
  await expect(dialog.getByRole('textbox', { name: 'Notes (optional)', exact: true })).toHaveValue('Storage failure must not lose work')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible()
})

test('a Library phase and its inline warning rule save together, with warnings advisory', async ({ page }) => {
  const workspaceId = await workspace(page)
  await page.getByRole('button', { name: '+ Add procurement', exact: true }).click()
  await page.getByLabel('Procurement name').fill('First procurement')
  await createInlinePhase(page)
  const dialog = page.getByRole('dialog', { name: 'Create phase', exact: true })
  await dialog.getByLabel('Phase name', { exact: true }).fill('Evaluation')
  await dialog.getByRole('button', { name: '+ Add clash-checking rule', exact: true }).click()
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args) {
      const request = original.apply(this, args)
      if (this.name === 'libraries') { this.transaction.abort(); IDBObjectStore.prototype.put = original }
      return request
    }
  })
  await dialog.getByRole('button', { name: /^Create phase(?: and add to procurement)?$/ }).click()
  await expect(dialog.getByRole('alert')).toContainText('Library could not be saved')
  const failed = await page.evaluate(async workspaceId => {
    const modulePath = '/src/data/local-data.ts'; const { localData } = await import(modulePath)
    return localData.getLibrary(workspaceId)
  }, workspaceId)
  expect(failed.phases).toEqual([]); expect(failed.rules).toEqual([])
  await dialog.getByRole('button', { name: /^Create phase(?: and add to procurement)?$/ }).click()
  await expect(dialog).not.toBeVisible()
  await addMilestone(page, 'Go-live')
  await page.getByLabel('Anchor date', { exact: true }).fill('2032-05-12')
  await page.getByRole('button', { name: /^Preview (?:schedule|changes)$/ }).click()
  await page.getByRole('button', { name: 'Add procurement to pipeline plan', exact: true }).click()
  await confirmProcurement(page)
  await procurement(page, 'Second procurement')
  await expect(page.getByText('1 warning', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Reason for proceeding with critical clashes' })).toHaveCount(0)
  const library = await page.evaluate(async workspaceId => {
    const modulePath = '/src/data/local-data.ts'; const { localData } = await import(modulePath)
    return localData.getLibrary(workspaceId)
  }, workspaceId)
  expect(library.phases).toHaveLength(1); expect(library.rules).toHaveLength(1)
})

test('unfinished pipeline plan contents are not recovered but explicitly created Library phases remain', async ({ page, context }) => {
  const workspaceId = await workspace(page)
  await procurement(page, 'Unfinished procurement', true)
  await page.close({ runBeforeUnload: false })
  const next = await context.newPage()
  await next.goto(`/workspaces/${workspaceId}/pipeline`)
  await expect(next.getByRole('dialog', { name: 'Your pipeline plan starts here', exact: true })).toBeVisible()
  const saved = await next.evaluate(async workspaceId => {
    const modulePath = '/src/data/local-data.ts'; const { localData } = await import(modulePath)
    return { pipelines: await localData.listPipelines(workspaceId), library: await localData.getLibrary(workspaceId) }
  }, workspaceId)
  expect(saved.pipelines).toEqual([])
  expect(saved.library.phases.map((phase: { name: string }) => phase.name)).toEqual(['Evaluation'])
})

test('reordering requires relationship review and removed schedule identities are not reused', async ({ page }) => {
  const workspaceId = await workspace(page)
  await procurement(page, 'Reordered procurement', true)
  await page.getByRole('button', { name: 'Reordered procurement', exact: true }).click()
  await browsePhase(page, 'Evaluation')
  await page.getByRole('combobox', { name: 'Item 3 relationship', exact: true }).selectOption('gap')
  await page.getByRole('spinbutton', { name: 'Gap weeks', exact: true }).fill('0')
  await page.getByRole('button', { name: /^Preview (?:schedule|changes)$/ }).click()
  await expect(page.getByRole('spinbutton', { name: 'Gap weeks', exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('spinbutton', { name: 'Gap weeks', exact: true }).fill('1')
  await moveRow(page, 2, 1)
  await page.getByRole('button', { name: /^Preview (?:schedule|changes)$/ }).click()
  await expect(page.getByRole('alert')).toContainText('Review the highlighted timing relationships')
  await page.getByRole('button', { name: 'Keep this relationship', exact: true }).click()
  await page.getByRole('button', { name: /^Preview (?:schedule|changes)$/ }).click()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await confirmProcurement(page)
  await page.getByRole('button', { name: 'Reordered procurement', exact: true }).click()
  await page.locator('.schedule-editor-table tbody tr').nth(1).getByRole('button', { name: /^Remove / }).click()
  await expect(page.getByRole('button', { name: 'Keep this relationship', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: /^Preview (?:schedule|changes)$/ }).click()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await confirmProcurement(page)
  await page.getByRole('button', { name: 'Reordered procurement', exact: true }).click()
  await browsePhase(page, 'Evaluation')
  await page.getByRole('button', { name: /^Preview (?:schedule|changes)$/ }).click()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await confirmProcurement(page)
  const id = await save(page)
  const record = await savedRecord(page, workspaceId, id)
  expect(record.plans[0].phases.map(phase => phase.id)).toEqual([1, 2, 4])
  expect(record.plans[0].anchor).toBe(Date.parse('2032-05-12T00:00:00Z'))
})

async function savedRecord(page: Page, workspaceId: string, id: string): Promise<SavedPipeline> {
  return page.evaluate(async ({ workspaceId, id }) => {
    const modulePath = '/src/data/local-data.ts'
    const { localData } = await import(modulePath)
    return localData.getPipeline(workspaceId, id)
  }, { workspaceId, id })
}

test('a stale tab cannot overwrite a newer record and can keep its work with Save as', async ({ page, context }) => {
  const workspaceId = await workspace(page)
  await procurement(page, 'Original procurement', true)
  const id = await save(page)
  const original = await savedRecord(page, workspaceId, id)
  const other = await context.newPage()
  await other.goto(page.url())
  await other.getByRole('button', { name: 'Original procurement', exact: true }).click()
  await editProcurementName(other, 'My pending procurement')
  await other.getByRole('button', { name: /^Preview (?:schedule|changes)$/ }).click()
  await other.getByRole('button', { name: 'Save changes' }).click()
  await confirmProcurement(other)
  await page.evaluate(async record => {
    const modulePath = '/src/data/local-data.ts'
    const { localData } = await import(modulePath)
    const library = await localData.getLibrary(record.workspaceId)
    await localData.savePipeline({ ...record, note: 'Saved by the other tab', expectedRevision: record.revision, expectedLibraryRevision: library.revision })
  }, original)
  await openSave(other)
  const dialog = other.locator('dialog.save-pipeline-dialog')
  await dialog.getByRole('textbox', { name: 'Notes (optional)', exact: true }).fill('Keep my pending work')
  await dialog.getByRole('button', { name: 'Overwrite and save', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('changed in another tab')
  await expect(dialog.getByRole('textbox', { name: 'Notes (optional)', exact: true })).toHaveValue('Keep my pending work')
  const latest = await savedRecord(page, workspaceId, id)
  expect(latest.note).toBe('Saved by the other tab')
  expect(latest.plans).toEqual(original.plans)
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(other.getByRole('button', { name: 'My pending procurement', exact: true })).toBeVisible()
  await openSave(other, 'Save as…')
  await other.getByRole('textbox', { name: 'Name (required)', exact: true }).fill('My separate copy')
  await other.getByRole('textbox', { name: 'Notes (optional)', exact: true }).fill('Keep my pending work')
  await other.locator('dialog.save-pipeline-dialog').getByRole('button', { name: 'Save', exact: true }).click()
  await expect(other.getByText('All changes saved', { exact: true })).toBeVisible()
})

test('new Library rules refresh assessments without changing saved dates and are rechecked at Save', async ({ page }) => {
  const workspaceId = await workspace(page)
  await procurement(page, 'First procurement', true)
  await procurement(page, 'Second procurement')
  const id = await save(page)
  const original = await savedRecord(page, workspaceId, id)
  await page.evaluate(async ({ workspaceId, phaseId }) => {
    const modulePath = '/src/data/local-data.ts'
    const { localData } = await import(modulePath)
    await localData.createRule(workspaceId, { a: phaseId, b: phaseId, severity: 'critical', reason: 'Evaluation team capacity' })
  }, { workspaceId, phaseId: original.plans[0].phases[0].libraryPhaseId })
  await openSave(page)
  const dialog = page.locator('dialog.save-pipeline-dialog')
  await dialog.getByRole('textbox', { name: 'Notes (optional)', exact: true }).fill('Review latest rules')
  await dialog.getByRole('button', { name: 'Overwrite and save', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Library changed')
  await dialog.getByRole('button', { name: 'Refresh clash checks' }).click()
  await expect(dialog.getByRole('textbox', { name: 'Reason for proceeding with critical clashes', exact: true })).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Overwrite and save', exact: true }).click()
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible()
  const latest = await savedRecord(page, workspaceId, id)
  expect(latest.plans).toEqual(original.plans)
  expect(latest.acknowledgements).toEqual([])
})

test('workspace data boundaries reject foreign pipeline plan writes and rule links', async ({ page }) => {
  const workspaceId = await workspace(page)
  await procurement(page, 'Private to first workspace', true)
  const id = await save(page)
  const original = await savedRecord(page, workspaceId, id)
  const result = await page.evaluate(async record => {
    const modulePath = '/src/data/local-data.ts'
    const { localData } = await import(modulePath)
    const other = await localData.createWorkspace('Separate team')
    const foreign = await localData.getPipeline(other.id, record.id)
    let ruleError = '', saveError = ''
    try { await localData.createRule(other.id, { a: record.plans[0].phases[0].libraryPhaseId, b: record.plans[0].phases[0].libraryPhaseId, severity: 'warning', reason: '' }) } catch (error) { ruleError = String(error) }
    try { await localData.savePipeline({ ...record, workspaceId: other.id, expectedRevision: record.revision, expectedLibraryRevision: 0 }) } catch (error) { saveError = String(error) }
    return { foreign, ruleError, saveError, library: await localData.getLibrary(other.id), records: await localData.listPipelines(other.id) }
  }, original)
  expect(result.foreign).toBeUndefined()
  expect(result.ruleError).toContain('Choose phases from this workspace')
  expect(result.saveError).toContain('changed in another tab')
  expect(result.library.phases).toEqual([])
  expect(result.records).toEqual([])
  expect(await savedRecord(page, workspaceId, id)).toEqual(original)
})

test('the database upgrade preserves existing v1 workspace records and starts with an empty Library', async ({ page }) => {
  await page.route('**/storage-bootstrap', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Storage fixture</title>' }))
  await page.goto('/storage-bootstrap')
  const original = await page.evaluate(async () => {
    const record = { schemaVersion: 1, id: crypto.randomUUID(), name: 'Existing workspace', createdAt: '2026-11-11T12:00:00.000Z', createdBy: 'local-user' }
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('ltpp-app-local', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('workspaces', { keyPath: 'id' })
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('workspaces', 'readwrite')
        tx.objectStore('workspaces').add(record)
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      request.onerror = () => reject(request.error)
    })
    return record
  })
  await page.goto(`/workspaces/${original.id}/library`)
  await page.getByRole('button', { name: /^Manage phases/ }).click()
  await expect(page.getByText('Your Library is empty.', { exact: false })).toBeVisible()
  const result = await page.evaluate(async id => {
    const modulePath = '/src/data/local-data.ts'
    const { localData } = await import(modulePath)
    return { workspace: await localData.getWorkspace(id), library: await localData.getLibrary(id) }
  }, original.id)
  expect(result.workspace).toEqual(original)
  expect(result.library.phases).toEqual([])
  expect(result.library.rules).toEqual([])
})

for (const width of [320, 1440]) {
  test(`planning layout, detail dialog and discard at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await workspace(page)
    await procurement(page, 'Community services', true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('pipeline.png'), fullPage: true })
    await page.getByRole('button', { name: /^Community services: Evaluation/ }).focus()
    await page.keyboard.press('Enter')
    const details = page.getByRole('dialog', { name: 'Community services: timeline details', exact: true })
    await expect(details).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(details).not.toBeVisible()
    await page.getByRole('button', { name: 'Community services', exact: true }).click()
    await page.getByLabel('Item 1 duration in weeks', { exact: true }).fill('4')
    const sizing = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, elements: [...document.querySelectorAll('main *')].filter(element => element.getBoundingClientRect().right > innerWidth && !element.closest('.table-scroll')).map(element => ({ tag: element.tagName, class: element.className, right: element.getBoundingClientRect().right })).slice(0, 8) }))
    expect(sizing.document, JSON.stringify(sizing)).toBeLessThanOrEqual(width)
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    const discard = page.getByRole('dialog', { name: 'Discard procurement changes?', exact: true })
    await expect(discard.getByRole('button', { name: 'Keep editing' })).toBeFocused()
    await discard.getByRole('button', { name: 'Discard procurement changes', exact: true }).click()
    await page.getByRole('button', { name: 'Community services', exact: true }).click()
    await expect(page.getByLabel('Item 1 duration in weeks', { exact: true })).toHaveValue('2')
  })
}
