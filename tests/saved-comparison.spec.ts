import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function setup(page: Page, count = 3, large = false) {
  await page.goto('/workspaces')
  return page.evaluate(async ({ count, large }) => {
    const dataPath = '/src/data/local-data.ts', projectPath = '/src/domain/project.ts'
    const { localData } = await import(dataPath), { scheduleProject } = await import(projectPath)
    const workspace = await localData.createWorkspace('Comparison team')
    let library = await localData.createPhase(workspace.id, { name: 'Evaluation', weeks: 4, color: '#315ed4', checks: [{ target: 'self', severity: 'warning', reason: 'Shared evaluation team' }] })
    library = await localData.createPhase(workspace.id, { name: 'Moderation', weeks: 2, color: '#a7622d', checks: [{ target: 'self', severity: 'critical', reason: 'Shared moderation team' }] })
    const plans = Array.from({ length: large ? 20 : 2 }, (_, index) => scheduleProject({
      id: crypto.randomUUID(), name: index === 0 ? 'Community services' : index === 1 ? 'Digital services' : `Procurement ${index + 1}`,
      anchor: Date.UTC(2032 + (large ? Math.floor(index / 4) : 0), 4, 12), planningAnchor: 0, anchorId: 3, anchorName: 'Service begins', nextPhaseId: 4, approvedBaseline: null,
      phases: [...library.phases.map((phase: { id: string }, index: number) => ({ ...phase, id: index + 1, libraryPhaseId: phase.id, kind: 'phase', durationInherited: true, offset: 0, s: 0, e: 0 })),
        { id: 3, name: 'Service begins', kind: 'milestone', weeks: 0, color: '#536ea1', libraryPhaseId: '', durationInherited: false, offset: 0, s: 0, e: 0 }],
    }))
    const records = []
    for (let index = 0; index < count; index++) {
      const contents = structuredClone(plans)
      if (index === 1) {
        contents[0].phases[0].weeks = 6
        contents[0].phases[0].durationInherited = false
        contents[0] = scheduleProject(contents[0])
      }
      records.push(await localData.savePipeline({ id: crypto.randomUUID(), workspaceId: workspace.id, expectedRevision: 0, expectedLibraryRevision: library.revision,
        name: ['Live plan', 'Alternative plan', 'Matching plan'][index], note: 'Keep these saved notes', plans: contents, acknowledgements: [] }))
    }
    return { workspaceId: workspace.id, records, library }
  }, { count, large })
}

const comparison = (page: Page) => page.getByRole('dialog', { name: 'Compare pipeline plans', exact: true })
const section = (page: Page, name: string) => comparison(page).locator('details.comparison-section').filter({ has: page.getByRole('heading', { name, exact: true }) })
async function open(page: Page, workspaceId: string, name = 'Alternative plan') {
  await page.goto(`/workspaces/${workspaceId}/saved-pipelines`)
  await page.getByRole('link', { name: `Compare ${name}`, exact: true }).click()
  await expect(comparison(page)).toBeVisible()
}
async function savedRecords(page: Page, workspaceId: string) {
  return page.evaluate(async id => { const path = '/src/data/local-data.ts'; return (await import(path)).localData.listPipelines(id) }, workspaceId)
}

test('saved scope, status filtering and modal close keep the list and launch focus', async ({ page }) => {
  const data = await setup(page)
  await page.goto(`/workspaces/${data.workspaceId}/saved-pipelines`)
  const row = page.getByRole('row').filter({ has: page.getByRole('link', { name: 'Alternative plan', exact: true }) })
  await row.locator('summary').click()
  await expect(row.locator('.saved-scope')).toContainText('2 procurements')
  await expect(row.locator('.saved-scope')).toContainText('12 May 2032')
  await expect(row).toContainText('Keep these saved notes')
  await page.getByRole('combobox', { name: 'Show', exact: true }).selectOption('live')
  await expect(page.locator('.saved-plans tbody tr')).toHaveCount(1)
  await expect(page.locator('.saved-plans tbody')).toContainText('Live plan')
  await page.getByRole('combobox', { name: 'Show', exact: true }).selectOption('saved')
  await expect(page.locator('.saved-plans tbody tr')).toHaveCount(2)
  const launcher = page.getByRole('link', { name: 'Compare Alternative plan', exact: true })
  await launcher.click()
  await expect(comparison(page).getByRole('combobox', { name: 'Pipeline', exact: true })).toHaveValue(data.records[0].id)
  await expect(comparison(page).getByRole('combobox', { name: 'Compare with', exact: true })).toHaveValue(data.records[1].id)
  await expect(comparison(page).locator('details.comparison-section[open]')).toHaveCount(0)
  await expect(comparison(page).getByRole('heading', { level: 2 })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(comparison(page)).toHaveCount(0)
  await expect(launcher).toBeFocused()
  await expect(page.getByRole('combobox', { name: 'Show', exact: true })).toHaveValue('saved')
  await row.getByRole('link', { name: 'View', exact: true }).click()
  const view = page.getByRole('dialog', { name: 'Viewing saved pipeline plan', exact: true })
  await view.locator('details.saved-details summary').click()
  await expect(view.locator('.saved-scope')).toContainText('2 procurements')
  await expect(view.locator('.saved-scope')).toContainText('12 May 2032')
})

test('independent alternatives show duration changes, matching issues and neutral reversed selections', async ({ page }) => {
  const data = await setup(page)
  const unchanged = await savedRecords(page, data.workspaceId)
  await open(page, data.workspaceId)
  const schedules = section(page, 'Schedule differences')
  await schedules.locator(':scope > summary').click()
  const procurement = schedules.locator('details.comparison-procurement')
  await expect(procurement).toHaveCount(1)
  await expect(procurement).not.toHaveAttribute('open')
  await expect(procurement.locator(':scope > summary')).toContainText('Phase durations altered')
  await procurement.locator(':scope > summary').click()
  await expect(procurement).toContainText('active duration increased from 4 to 6 weeks')
  await procurement.locator('.comparison-exact-dates > summary').click()
  await expect(procurement.getByRole('table')).toContainText('4 active weeks')
  await expect(procurement.getByRole('table')).toContainText('6 active weeks')
  const findings = section(page, 'Warnings and critical clashes')
  await findings.locator(':scope > summary').click()
  const pairs = findings.locator('.comparison-finding-pair')
  await expect(pairs).toHaveCount(1)
  await pairs.locator(':scope > summary').click()
  await expect(pairs.getByText('Same in both pipelines', { exact: true })).toHaveCount(2)
  await findings.getByRole('combobox', { name: 'Comparison', exact: true }).selectOption('differences')
  await expect(findings).toContainText('Choose All issues to inspect the matching issues.')
  await findings.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await findings.getByRole('searchbox').fill('No such procurement')
  await expect(findings).toContainText('No issues match these filters.')
  await expect(findings.getByRole('status')).toHaveText('Showing 0 of 1 procurement group.')
  await findings.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(findings.getByRole('status')).toHaveCount(0)
  await comparison(page).getByRole('combobox', { name: 'Pipeline', exact: true }).selectOption(data.records[1].id)
  await expect(comparison(page).getByRole('combobox', { name: 'Compare with', exact: true })).toHaveValue(data.records[0].id)
  await expect(comparison(page).locator('details.comparison-section[open]')).toHaveCount(0)
  await schedules.locator(':scope > summary').click()
  await schedules.locator('.comparison-procurement > summary').click()
  await expect(schedules).toContainText('active duration decreased from 6 to 4 weeks')
  expect(await savedRecords(page, data.workspaceId)).toEqual(unchanged)
})

for (const width of [320, 1440]) test(`comparison deep links, all timeline rows and synchronised scrolling work at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 })
  const data = await setup(page, 3, true)
  await open(page, data.workspaceId)
  const url = page.url()
  await page.reload()
  await expect(comparison(page)).toBeVisible()
  await expect(page).toHaveURL(url)
  const timelines = section(page, 'Timelines')
  await timelines.locator(':scope > summary').click()
  const charts = timelines.locator('.planning-timeline')
  await expect(charts).toHaveCount(2)
  await expect(charts.first().locator('.timeline-row:not(.ruler-row)')).toHaveCount(20)
  await expect(charts.last().locator('.timeline-row:not(.ruler-row)')).toHaveCount(20)
  await timelines.getByRole('combobox', { name: 'Viewing window', exact: true }).selectOption('6')
  const scrollers = timelines.locator('.timeline-scroll')
  await scrollers.first().evaluate(element => { element.scrollLeft = 180 })
  await expect.poll(async () => scrollers.evaluateAll(elements => Math.abs(elements[0].scrollLeft - elements[1].scrollLeft))).toBeLessThan(2)
  await scrollers.last().evaluate(element => { element.scrollLeft = 75 })
  await expect.poll(async () => scrollers.evaluateAll(elements => Math.abs(elements[0].scrollLeft - elements[1].scrollLeft))).toBeLessThan(2)
  await timelines.getByRole('combobox', { name: 'Viewing window', exact: true }).selectOption('all')
  await expect(timelines.getByLabel('Window starts', { exact: true })).toBeDisabled()
  expect(await comparison(page).evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath(`comparison-${width}.png`) })
  await comparison(page).getByRole('button', { name: 'Close', exact: true }).click()
  await expect(comparison(page)).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Compare Live plan', exact: true })).toBeFocused()
})

test('identical plans, rule refresh and stale or missing selections stay read-only', async ({ page }) => {
  const data = await setup(page)
  await open(page, data.workspaceId, 'Matching plan')
  await expect(comparison(page).getByRole('region', { name: 'Comparison summary', exact: true })).toContainText('Schedules match')
  const unchanged = await savedRecords(page, data.workspaceId)
  await page.evaluate(async ({ workspaceId, library }) => {
    const path = '/src/data/local-data.ts'; const { localData } = await import(path)
    await localData.editPhase(workspaceId, library.phases[0].id, library.revision, { ...library.phases[0], checks: [] })
  }, data)
  await comparison(page).getByRole('button', { name: 'Refresh comparison', exact: true }).click()
  await expect(comparison(page).locator('.comparison-overview .finding-counts').first()).toContainText('0 warnings')
  expect(await savedRecords(page, data.workspaceId)).toEqual(unchanged)
  await page.goto(`/workspaces/${data.workspaceId}/saved-pipelines?compare=${data.records[0].id}&with=${data.records[0].id}`)
  await expect(comparison(page)).toContainText('Choose two different saved pipeline plans')
  await page.goto(`/workspaces/${data.workspaceId}/saved-pipelines?compare=${crypto.randomUUID()}&with=${data.records[1].id}`)
  await expect(comparison(page)).toContainText('A selected plan may no longer be available')
  await comparison(page).getByRole('combobox', { name: 'Pipeline', exact: true }).selectOption(data.records[0].id)
  await expect(comparison(page).getByRole('region', { name: 'Comparison summary', exact: true })).toBeVisible()
})

test('zero and one-plan workspaces have no Compare actions and meaningful empty filters', async ({ page }) => {
  const empty = await setup(page, 0)
  await page.goto(`/workspaces/${empty.workspaceId}/saved-pipelines`)
  await expect(page.getByRole('heading', { name: 'No saved pipeline plans yet', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Compare / })).toHaveCount(0)
  const one = await setup(page, 1)
  await page.goto(`/workspaces/${one.workspaceId}/saved-pipelines`)
  await expect(page.getByRole('link', { name: /^Compare / })).toHaveCount(0)
  await page.getByRole('combobox', { name: 'Show', exact: true }).selectOption('saved')
  await expect(page.getByText('No pipeline plans match this filter.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Show all pipeline plans', exact: true }).click()
  await expect(page.locator('.saved-plans tbody tr')).toHaveCount(1)
  await page.goto(`/workspaces/${one.workspaceId}/saved-pipelines?compare=${one.records[0].id}&with=missing`)
  await expect(comparison(page)).toContainText('Save at least two pipeline plans')
})

test('renamed counterparts retain identity while separately created same-name procurements stay separate', async ({ page }) => {
  const data = await setup(page)
  await page.evaluate(async ({ records, library }) => {
    const path = '/src/data/local-data.ts'; const { localData } = await import(path)
    const record = records[1], plans = structuredClone(record.plans)
    plans[0].name = 'Renamed community procurement'
    plans.push({ ...structuredClone(records[0].plans[0]), id: crypto.randomUUID() })
    plans.splice(1, 1)
    await localData.savePipeline({ ...record, plans, expectedRevision: record.revision, expectedLibraryRevision: library.revision })
  }, data)
  const stored = await savedRecords(page, data.workspaceId)
  await open(page, data.workspaceId)
  const schedules = section(page, 'Schedule differences')
  await schedules.locator(':scope > summary').click()
  await expect(schedules.locator('.comparison-procurement')).toHaveCount(3)
  const renamed = schedules.locator('.comparison-procurement').filter({ has: page.locator('summary > strong').filter({ hasText: 'Renamed community procurement' }) })
  await renamed.locator(':scope > summary').click()
  await expect(renamed).toContainText('Procurement renamed from Community services to Renamed community procurement.')
  await expect(schedules.locator('.comparison-change-labels')).toContainText(['Names altered', 'Only in Live plan', 'Only in Alternative plan'])
  await comparison(page).getByRole('button', { name: 'Close', exact: true }).click()
  expect(await savedRecords(page, data.workspaceId)).toEqual(stored)
})

test('refresh loads updated saved contents and Christmas explanations without changing either record', async ({ page }) => {
  const data = await setup(page)
  await open(page, data.workspaceId)
  await page.evaluate(async ({ records, library }) => {
    const dataPath = '/src/data/local-data.ts', projectPath = '/src/domain/project.ts'
    const { localData } = await import(dataPath), { scheduleProject } = await import(projectPath)
    const record = records[1], plans = structuredClone(record.plans)
    plans[0].anchor = Date.UTC(2033, 0, 19)
    plans[0] = scheduleProject(plans[0])
    await localData.savePipeline({ ...record, plans, expectedRevision: record.revision, expectedLibraryRevision: library.revision })
  }, data)
  const stored = await savedRecords(page, data.workspaceId)
  await comparison(page).getByRole('button', { name: 'Refresh comparison', exact: true }).click()
  const schedules = section(page, 'Schedule differences')
  await schedules.locator(':scope > summary').click()
  await schedules.locator('.comparison-procurement > summary').click()
  await expect(schedules).toContainText('Now includes the Christmas break')
  await expect(schedules).toContainText('active duration also changed from 4 to 6 weeks')
  await schedules.locator('.comparison-exact-dates > summary').click()
  await expect(schedules.getByRole('table')).toContainText('19 Jan 2033')
  expect(await savedRecords(page, data.workspaceId)).toEqual(stored)
  await page.goBack()
  await expect(comparison(page)).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Compare Alternative plan', exact: true })).toBeFocused()
})
