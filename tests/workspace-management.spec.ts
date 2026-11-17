import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { Project } from '../src/data/schemas.ts'

async function setup(page: Page) {
  await page.goto('/workspaces')
  const records = await page.evaluate(async () => {
    const dataPath = '/src/data/local-data.ts', projectPath = '/src/domain/project.ts'
    const { localData } = await import(dataPath), { scheduleProject } = await import(projectPath)
    const workspaces = []
    for (const name of ['Alpha team', 'Bravo team', 'Charlie team']) {
      const workspace = await localData.createWorkspace(name)
      const library = await localData.createPhase(workspace.id, { name: 'Preparation', weeks: 2, color: '#315ed4', checks: [] })
      const phase = library.phases[0]
      const project: Project = scheduleProject({ id: crypto.randomUUID(), name: `${name} procurement`, anchor: Date.UTC(2032, 4, 12), planningAnchor: 0, anchorId: 2, anchorName: 'Service begins', nextPhaseId: 3, approvedBaseline: null, phases: [
        { ...phase, id: 1, libraryPhaseId: phase.id, kind: 'phase', durationInherited: true, offset: 0, s: 0, e: 0 },
        { id: 2, name: 'Service begins', kind: 'milestone', weeks: 0, color: '#536ea1', libraryPhaseId: '', durationInherited: false, offset: 0, s: 0, e: 0 },
      ] })
      const live = await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: workspace.id, expectedRevision: 0, expectedLibraryRevision: library.revision, name: `${name} live plan`, plans: [project], acknowledgements: [] })
      await localData.savePipeline({ ...live, id: crypto.randomUUID(), expectedRevision: 0, expectedLibraryRevision: library.revision, name: `${name} alternative` })
      await localData.saveTemplate(workspace.id, crypto.randomUUID(), 0, library.revision, { name: `${name} template`, description: 'Keep this template', anchorId: 2, phases: project.phases.map(({ s: _s, e: _e, ...item }) => item) })
      localStorage.setItem(`ltpp-app:procurement-draft:${workspace.id}`, JSON.stringify({ fixture: name }))
      localStorage.setItem(`ltpp-app:welcome-shortcut-hidden:${workspace.id}`, '1')
      localStorage.setItem(`ltpp-app:welcome-dismissed:${workspace.id}`, '1')
      workspaces.push(workspace)
    }
    localStorage.setItem('ltpp-connected-mockups-v1', 'Keep prototype data')
    localStorage.setItem('unrelated-preference', 'Keep this too')
    return workspaces
  })
  await page.reload()
  return records
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/data/local-data.ts', { DATABASE_NAME } = await import(path)
    const stored = await new Promise<Record<string, unknown[]>>((resolve, reject) => {
      const open = indexedDB.open(DATABASE_NAME)
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const db = open.result, tx = db.transaction(['workspaces', 'libraries', 'pipelines', 'templates'])
        const values: Record<string, unknown[]> = {}
        for (const name of ['workspaces', 'libraries', 'pipelines', 'templates']) {
          const read = tx.objectStore(name).getAll()
          read.onsuccess = () => { values[name] = read.result }
        }
        tx.oncomplete = () => { db.close(); resolve(values) }
        tx.onerror = () => { db.close(); reject(tx.error) }
      }
    })
    return { stored, local: Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])) }
  })
}

const names = (page: Page) => page.locator('.workspace-list li > a > strong')
const confirmation = (page: Page, name = 'Bravo team') => page.getByRole('alertdialog', { name: `Delete “${name}”?`, exact: true })
const bin = (page: Page, name: string) => page.getByRole('button', { name: `Delete ${name}`, exact: true })
const grip = (page: Page, name: string) => page.getByRole('button', { name: `Reorder ${name}`, exact: true })
async function place(page: Page, name: string, key: 'ArrowUp' | 'ArrowDown' | 'Home' | 'End') {
  await grip(page, name).focus()
  await page.keyboard.press('Space'); await page.keyboard.press(key); await page.keyboard.press('Space')
}

test('workspace order persists, carries into the selector and appends newly created workspaces', async ({ page }) => {
  const records = await setup(page)
  await expect(page.locator('.page-heading p')).toHaveText('Each workspace has its own Library, Procurement Templates and Live Pipeline Plan.')
  await expect(page.locator('.workspace-list > .supporting-text')).toHaveCount(0)
  await place(page, 'Charlie team', 'ArrowUp')
  await expect(names(page)).toHaveText(['Alpha team', 'Charlie team', 'Bravo team'])
  await expect(grip(page, 'Charlie team')).toBeFocused()
  await place(page, 'Alpha team', 'ArrowDown')
  await expect(names(page)).toHaveText(['Charlie team', 'Alpha team', 'Bravo team'])
  await page.reload()
  await expect(names(page)).toHaveText(['Charlie team', 'Alpha team', 'Bravo team'])
  await page.getByLabel('Workspace name', { exact: true }).fill('Delta team')
  await page.getByRole('button', { name: 'Create workspace', exact: true }).click()
  await page.getByRole('dialog', { name: 'Your pipeline plan starts here', exact: true }).getByRole('button', { name: 'Got it', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Workspace', exact: true }).locator('option')).toHaveText(['Charlie team', 'Alpha team', 'Bravo team', 'Delta team'])
  await page.getByRole('navigation').getByRole('link', { name: 'Workspaces', exact: true }).click()
  await expect(names(page)).toHaveText(['Charlie team', 'Alpha team', 'Bravo team', 'Delta team'])
  const stored = await page.evaluate(async id => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.getWorkspace(id) }, records[0].id)
  expect(stored.name).toBe('Alpha team')
  expect(stored.currentBaselineId).toBeTruthy()
})

test('deletion requires explicit confirmation and cancellation preserves every record and draft', async ({ page }) => {
  await setup(page)
  const before = await snapshot(page)
  const launch = bin(page, 'Bravo team')
  await launch.click()
  const dialog = confirmation(page)
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused()
  await expect(dialog).toContainText('saved pipeline plans and unfinished procurement draft')
  await page.keyboard.press('Enter')
  await expect(dialog).toHaveCount(0)
  await expect(launch).toBeFocused()
  expect(await snapshot(page)).toEqual(before)
  await launch.click()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(await snapshot(page)).toEqual(before)
})

test('moving to the first position restores usable keyboard focus after the list updates', async ({ page }) => {
  await setup(page)
  await place(page, 'Bravo team', 'Home')
  await expect(names(page)).toHaveText(['Bravo team', 'Alpha team', 'Charlie team'])
  await expect(grip(page, 'Bravo team')).toBeFocused()
  await page.keyboard.press('Space'); await page.keyboard.press('End')
  await page.keyboard.press('Escape')
  await expect(names(page)).toHaveText(['Bravo team', 'Alpha team', 'Charlie team'])
  await expect(grip(page, 'Bravo team')).toBeFocused()
})

test('confirmed deletion removes only that workspace and its complete local contents', async ({ page }) => {
  const records = await setup(page), target = records[1].id
  const before = await snapshot(page)
  await bin(page, 'Bravo team').click()
  await confirmation(page).getByRole('button', { name: 'Delete workspace', exact: true }).click()
  await expect(confirmation(page)).toHaveCount(0)
  await expect(names(page)).toHaveText(['Alpha team', 'Charlie team'])
  await expect(page.locator(`li[data-workspace-id="${records[2].id}"] > a`)).toBeFocused()
  const after = await snapshot(page)
  for (const [store, values] of Object.entries(before.stored)) {
    const remaining = values.filter(value => {
      const record = value as { id?: string; workspaceId?: string }
      return store === 'workspaces' ? record.id !== target : record.workspaceId !== target
    })
    expect(after.stored[store]).toEqual(remaining)
  }
  const local = Object.fromEntries(Object.entries(before.local).filter(([key]) => !key.endsWith(`:${target}`)))
  expect(after.local).toEqual(local)
  await page.reload()
  await expect(names(page)).toHaveText(['Alpha team', 'Charlie team'])
  await page.goto(`/workspaces/${target}/pipeline`)
  await expect(page.getByRole('heading', { name: 'Workspace not found', exact: true })).toBeVisible()
})

test('an aborted deletion restores local drafts and leaves every database store unchanged', async ({ page }) => {
  await setup(page)
  const before = await snapshot(page)
  await bin(page, 'Bravo team').click()
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.delete
    IDBObjectStore.prototype.delete = function (...args) {
      const request = original.apply(this, args)
      if (this.name === 'workspaces') { IDBObjectStore.prototype.delete = original; this.transaction.abort() }
      return request
    }
  })
  await confirmation(page).getByRole('button', { name: 'Delete workspace', exact: true }).click()
  await expect(confirmation(page).getByRole('alert')).toContainText('could not be deleted')
  expect(await snapshot(page)).toEqual(before)
  await confirmation(page).getByRole('button', { name: 'Delete workspace', exact: true }).click()
  await expect(names(page)).toHaveText(['Alpha team', 'Charlie team'])
})

test('blocked local cleanup prevents database deletion and permits retry', async ({ page }) => {
  await setup(page)
  const before = await snapshot(page)
  await bin(page, 'Bravo team').click()
  await page.evaluate(() => {
    const original = Storage.prototype.removeItem
    let attempts = 0
    Storage.prototype.removeItem = function (key) {
      if (++attempts === 2) { Storage.prototype.removeItem = original; throw new DOMException('Test blocked draft cleanup', 'SecurityError') }
      return original.call(this, key)
    }
  })
  await confirmation(page).getByRole('button', { name: 'Delete workspace', exact: true }).click()
  await expect(confirmation(page).getByRole('alert')).toContainText('local draft are unchanged')
  expect(await snapshot(page)).toEqual(before)
  await confirmation(page).getByRole('button', { name: 'Delete workspace', exact: true }).click()
  await expect(names(page)).toHaveText(['Alpha team', 'Charlie team'])
})

test('failed or stale reordering cannot partially change the saved order or workspace contents', async ({ page }) => {
  const records = await setup(page)
  const before = await snapshot(page)
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'workspaces') { IDBObjectStore.prototype.put = original; throw new DOMException('Test failed ordering write', 'QuotaExceededError') }
      return original.apply(this, args)
    }
  })
  await place(page, 'Bravo team', 'Home')
  await expect(page.getByRole('alert')).toContainText('previous order is unchanged')
  expect(await snapshot(page)).toEqual(before)
  await page.evaluate(async () => { const path = '/src/data/local-data.ts'; await (await import(path)).localData.createWorkspace('New concurrent team') })
  await place(page, 'Bravo team', 'Home')
  await expect(page.getByRole('alert')).toContainText('list changed in another tab')
  const stored = await page.evaluate(async () => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.listWorkspaces() })
  expect(stored.map((record: { id: string }) => record.id).slice(0, 3)).toEqual(records.map(record => record.id))
  await page.getByRole('button', { name: 'Refresh workspaces', exact: true }).click()
  await expect(names(page)).toHaveText(['Alpha team', 'Bravo team', 'Charlie team', 'New concurrent team'])
  await place(page, 'Bravo team', 'Home')
  await expect(names(page)).toHaveText(['Bravo team', 'Alpha team', 'Charlie team', 'New concurrent team'])
})

test('legacy workspaces retain their order and confirmed deletion of the final workspace restores first use', async ({ page }) => {
  const records = await setup(page)
  await page.evaluate(async () => {
    const path = '/src/data/local-data.ts', { DATABASE_NAME } = await import(path)
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open(DATABASE_NAME)
      open.onsuccess = () => {
        const db = open.result, tx = db.transaction('workspaces', 'readwrite'), store = tx.objectStore('workspaces'), read = store.getAll()
        read.onsuccess = () => { for (const value of read.result) { delete value.displayOrder; store.put(value) } }
        tx.oncomplete = () => { db.close(); resolve() }; tx.onerror = () => { db.close(); reject(tx.error) }
      }
      open.onerror = () => reject(open.error)
    })
  })
  await page.reload()
  await expect(names(page)).toHaveText(['Alpha team', 'Bravo team', 'Charlie team'])
  await place(page, 'Charlie team', 'ArrowUp')
  await expect(names(page)).toHaveText(['Alpha team', 'Charlie team', 'Bravo team'])
  for (const record of records) {
    await bin(page, record.name).click()
    await confirmation(page, record.name).getByRole('button', { name: 'Delete workspace', exact: true }).click()
    await expect(confirmation(page, record.name)).toHaveCount(0)
  }
  await expect(page.getByRole('heading', { name: 'Create your first workspace', exact: true })).toBeVisible()
  await expect(page.getByLabel('Workspace name', { exact: true })).toBeFocused()
})

for (const width of [320, 768, 1440]) test(`workspace actions and confirmation fit and support keyboard at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 })
  await setup(page)
  const link = page.locator('.workspace-list li > a').first()
  await expect(link).toBeVisible()
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Move up|Move down/ })).toHaveCount(0)
  const launch = bin(page, 'Bravo team')
  await launch.focus(); await page.keyboard.press('Enter')
  const dialog = confirmation(page)
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused()
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  await expect(dialog.getByRole('button', { name: 'Delete workspace', exact: true })).toBeInViewport()
  await page.screenshot({ path: info.outputPath(`delete-${width}.png`) })
  await page.keyboard.press('Escape')
  await expect(launch).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath(`workspaces-${width}.png`), fullPage: true })
})

test('pointer dragging previews insertion, saves on drop and rejects an outside drop', async ({ page }, info) => {
  await setup(page)
  const before = await snapshot(page)
  const handle = (await grip(page, 'Alpha team').boundingBox())!, last = (await page.locator('.workspace-list li').last().boundingBox())!
  const x = handle.x + handle.width / 2
  await page.mouse.move(x, handle.y + handle.height / 2); await page.mouse.down()
  await page.mouse.move(x, last.y + last.height - 4, { steps: 8 })
  await expect(page.locator('.reorder-ghost')).toBeVisible()
  await expect(page.locator('.workspace-list li.drop-after')).toHaveCount(1)
  await expect(names(page)).toHaveText(['Alpha team', 'Bravo team', 'Charlie team'])
  expect(await snapshot(page)).toEqual(before)
  await page.screenshot({ path: info.outputPath('workspace-drag.png') })
  await page.mouse.up()
  await expect(names(page)).toHaveText(['Bravo team', 'Charlie team', 'Alpha team'])
  await expect(grip(page, 'Alpha team')).toBeFocused()
  const stored = await snapshot(page)
  const again = (await grip(page, 'Alpha team').boundingBox())!
  await page.mouse.move(again.x + again.width / 2, again.y + again.height / 2); await page.mouse.down()
  await page.mouse.move(2, again.y - 20, { steps: 6 }); await page.mouse.up()
  await expect(names(page)).toHaveText(['Bravo team', 'Charlie team', 'Alpha team'])
  await expect(page.locator('.reorder-ghost')).toBeHidden()
  expect(await snapshot(page)).toEqual(stored)
  await page.reload()
  await expect(names(page)).toHaveText(['Bravo team', 'Charlie team', 'Alpha team'])
})

test('keyboard reordering cancels with Escape or Tab and restores handle focus', async ({ page }) => {
  await setup(page)
  const before = await snapshot(page), handle = grip(page, 'Bravo team')
  await handle.focus(); await page.keyboard.press('Space'); await page.keyboard.press('Home'); await page.keyboard.press('Escape')
  await expect(handle).toBeFocused()
  await expect(names(page)).toHaveText(['Alpha team', 'Bravo team', 'Charlie team'])
  await handle.press('Space'); await page.keyboard.press('End')
  await page.keyboard.press('Tab')
  await expect(page.locator('.workspace-list li > a').nth(1)).toBeFocused()
  await expect(names(page)).toHaveText(['Alpha team', 'Bravo team', 'Charlie team'])
  await expect(page.locator('.reorder-ghost')).toBeHidden()
  expect(await snapshot(page)).toEqual(before)
  await expect(page.getByText('View workspace', { exact: true })).toHaveCount(0)
})

test('workspace grips support touch dragging on a narrow screen', async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  await setup(page)
  const handle = (await grip(page, 'Charlie team').boundingBox())!, first = (await page.locator('.workspace-list li').first().boundingBox())!
  const session = await context.newCDPSession(page), x = handle.x + handle.width / 2, y = handle.y + handle.height / 2, to = first.y + 4
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let step = 1; step <= 8; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (to - y) * step / 8 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(names(page)).toHaveText(['Charlie team', 'Alpha team', 'Bravo team'])
  await expect(grip(page, 'Charlie team')).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('workspace-touch.png'), fullPage: true })
  await session.detach(); await context.close()
})
