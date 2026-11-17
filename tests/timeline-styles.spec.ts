import { expect, test } from '@playwright/test'

for (const scenario of [
  { query: 'overlap=1', duration: '1 active week', dates: '26 Apr 2032 to 30 Apr 2032' },
  { query: 'overlap=2&christmas=1', duration: '2 active weeks', dates: '16 Dec 2030 to 10 Jan 2031' },
]) {
  test(`all timeline variants show identical overlap details for ${scenario.query}`, async ({ page }) => {
    await page.goto(`/tests/fixtures/timeline-styles.html?${scenario.query}`)
    let reference = ''
    for (const variant of ['page', 'example', 'preview', 'saved']) {
      const blocks = page.getByTestId(variant).getByRole('button', { name: /^Community services: Evaluation \+ Moderation.*Intentional overlap:/ })
      for (const block of await blocks.all()) {
        await block.focus()
        const details = page.getByRole('dialog', { name: 'Community services: timeline details', exact: true })
        await expect(details).toContainText(`Intentional overlap: ${scenario.dates} · ${scenario.duration}`)
        const body = await details.locator('.timeline-tooltip-body').innerText()
        if (!reference) reference = body
        expect(body).toBe(reference)
        await details.getByRole('button', { name: 'Pin tooltip', exact: true }).click()
        await expect(details).toHaveAttribute('data-pinned', 'true')
        await details.getByRole('button', { name: 'Close tooltip', exact: true }).click()
      }
      expect(await blocks.count()).toBeGreaterThan(0)
    }
  })
}

for (const width of [320, 1440]) {
  test(`shared timelines own consistent issue outlines without page CSS at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/tests/fixtures/timeline-styles.html')
    for (const variant of ['page', 'example', 'preview', 'saved']) {
      const chart = page.getByTestId(variant)
      for (const severity of ['warning', 'critical']) {
        const outlines = chart.locator(`.clash-outline.${severity}`)
        await expect(outlines).toHaveCount(2)
        const keys = chart.locator(severity === 'critical' ? '.legend-key.critical' : '.legend-key:not(.critical)')
        for (const element of [...await outlines.all(), ...await keys.all()]) {
          expect(await element.evaluate(el => {
            const style = getComputedStyle(el)
            return { color: style.borderTopColor, style: style.borderTopStyle, width: style.borderTopWidth, inlineColor: (el as HTMLElement).style.borderColor }
          })).toEqual({ color: severity === 'critical' ? 'rgb(180, 61, 78)' : 'rgb(197, 139, 0)', style: severity === 'critical' ? 'solid' : 'dashed', width: '2px', inlineColor: '' })
        }
      }
      const large = variant === 'page' || variant === 'example'
      await expect(chart.locator('.phase-segment').first()).toHaveCSS('height', large ? '25px' : '26px')
      await expect(chart.locator('.clash-outline').first()).toHaveCSS('height', large ? '35px' : '36px')
    }
    await page.screenshot({ path: testInfo.outputPath('shared-timelines.png'), fullPage: true })
  })
}
