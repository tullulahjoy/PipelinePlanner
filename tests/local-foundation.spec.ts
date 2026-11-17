import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DATABASE_NAME } from '../src/data/local-data.ts'

async function createWorkspace(page: Page, name: string) {
  await page.goto('/workspaces')
  await page.getByLabel('Workspace name').fill(name)
  await page.getByRole('button', { name: 'Create workspace' }).click()
  await expect(page.getByRole('heading', { name: 'Your pipeline plan starts here', exact: true, level: 1 })).toBeVisible()
  await page.getByRole('dialog', { name: 'Your pipeline plan starts here' }).getByRole('button', { name: 'Got it', exact: true }).click()
  return page.url().split('/')[4]!
}

test('workspaces persist, remain separate and preserve prototype data', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveURL(/\/workspaces$/)
  await page.evaluate(() => localStorage.setItem('ltpp-connected-mockups-v1', 'prototype-test-sentinel'))
  const firstId = await createWorkspace(page, 'Community services')
  const secondId = await createWorkspace(page, 'Digital services')
  expect(firstId).not.toBe(secondId)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Library', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Templates and phase library', exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Workspace', exact: true }).selectOption(firstId)
  await expect(page).toHaveURL(new RegExp(`/workspaces/${firstId}/library$`))
  await expect(page.getByRole('navigation').getByRole('combobox', { name: 'Workspace', exact: true }).locator('option:checked')).toHaveText('Community services')
  await page.reload()
  await expect(page.getByRole('combobox')).toHaveValue(firstId)
  await page.getByRole('link', { name: 'Saved Pipeline Plans', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Saved Pipeline Plans', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Workspaces', exact: true }).click()
  await expect(page.locator('.workspace-list li')).toHaveCount(2)
  expect(await page.evaluate(() => localStorage.getItem('ltpp-connected-mockups-v1'))).toBe('prototype-test-sentinel')
  expect(errors).toEqual([])
})

test('unfinished entries are not recovered and names receive meaningful validation', async ({ page }) => {
  await page.goto('/workspaces')
  await page.getByLabel('Workspace name').fill('Unfinished workspace')
  await page.reload()
  await expect(page.getByLabel('Workspace name')).toHaveValue('')
  await expect(page.locator('.workspace-list li')).toHaveCount(0)
  await page.getByLabel('Workspace name').fill('   ')
  await page.getByRole('button', { name: 'Create workspace' }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter a workspace name.')
  await expect(page.getByRole('alert')).toBeFocused()
  await createWorkspace(page, '  Trimmed name  ')
  await expect(page.getByRole('combobox', { name: 'Workspace', exact: true }).locator('option:checked')).toHaveText('Trimmed name')
})

test('failed saves keep the form and existing records, then allow retry', async ({ page }) => {
  const existingId = await createWorkspace(page, 'Existing team')
  await page.goto('/workspaces')
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === 'workspaces') {
        IDBObjectStore.prototype.add = original
        throw new DOMException('Test storage failure', 'QuotaExceededError')
      }
      return original.apply(this, args)
    }
  })
  await page.getByLabel('Workspace name').fill('New team')
  await page.getByRole('button', { name: 'Create workspace' }).click()
  await expect(page.getByRole('alert')).toContainText('could not be saved')
  await expect(page.getByLabel('Workspace name')).toHaveValue('New team')
  await expect(page.locator('.workspace-list li')).toHaveCount(1)
  await expect(page.getByRole('alert')).toBeFocused()
  await page.getByRole('button', { name: 'Create workspace' }).click()
  await expect(page.getByRole('heading', { name: 'Your pipeline plan starts here', exact: true, level: 1 })).toBeVisible()
  await page.getByRole('combobox').selectOption(existingId)
  await expect(page.getByRole('combobox', { name: 'Workspace', exact: true }).locator('option:checked')).toHaveText('Existing team')
})

test('an aborted transaction is not reported as saved', async ({ page }) => {
  await page.goto('/workspaces')
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add
    IDBObjectStore.prototype.add = function (...args) {
      const request = original.apply(this, args)
      if (this.name === 'workspaces') this.transaction.abort()
      IDBObjectStore.prototype.add = original
      return request
    }
  })
  await page.getByLabel('Workspace name').fill('Aborted workspace')
  await page.getByRole('button', { name: 'Create workspace' }).click()
  await expect(page.getByRole('alert')).toContainText('could not be saved')
  await page.reload()
  await expect(page.locator('.workspace-list li')).toHaveCount(0)
})

test('unreadable saved records remain untouched', async ({ page }) => {
  const id = await createWorkspace(page, 'Original team')
  await page.evaluate(async ({ database, id }) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(database)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction('workspaces', 'readwrite')
        transaction.objectStore('workspaces').put({ id, schemaVersion: 999, name: 'Do not replace' })
        transaction.oncomplete = () => { db.close(); resolve() }
        transaction.onerror = () => { db.close(); reject(transaction.error) }
      }
      request.onerror = () => reject(request.error)
    })
  }, { database: DATABASE_NAME, id })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Unable to load your workspaces' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('may be damaged or from another app version')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('alert')).toContainText('left unchanged')
  const record = await page.evaluate(async ({ database, id }) => new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open(database)
    request.onsuccess = () => {
      const db = request.result
      const read = db.transaction('workspaces').objectStore('workspaces').get(id)
      read.onsuccess = () => { db.close(); resolve(read.result) }
      read.onerror = () => { db.close(); reject(read.error) }
    }
    request.onerror = () => reject(request.error)
  }), { database: DATABASE_NAME, id })
  expect(record).toEqual({ id, schemaVersion: 999, name: 'Do not replace' })
})

test('unavailable storage has a recoverable error state', async ({ page }) => {
  await page.addInitScript(() => {
    const original = IDBFactory.prototype.open
    IDBFactory.prototype.open = function () {
      IDBFactory.prototype.open = original
      throw new DOMException('Test blocked storage', 'SecurityError')
    }
  })
  await page.goto('/workspaces')
  await expect(page.getByRole('heading', { name: 'Unable to load your workspaces' })).toBeVisible()
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'Your workspaces' })).toBeVisible()
})

test('missing workspaces and unknown URLs offer a way back', async ({ page }) => {
  await page.goto('/workspaces/missing/pipeline')
  await expect(page.getByRole('heading', { name: 'Workspace not found' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to workspaces' }).click()
  await expect(page.getByRole('heading', { name: 'Your workspaces' })).toBeVisible()
  await page.goto('/not-a-page')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

for (const width of [320, 768, 1440]) {
  test(`layout and keyboard navigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await createWorkspace(page, 'A team with a long workspace name that remains readable on a narrow screen')
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Library', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Templates and phase library', exact: true })).toBeVisible()
    await expect(page.locator('main')).toBeFocused()
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Library', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page).toHaveTitle('Library · LTPP')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true })
    await page.getByRole('link', { name: 'Workspaces', exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('workspaces.png'), fullPage: true })
  })
}
