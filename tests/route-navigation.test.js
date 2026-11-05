import assert from 'node:assert/strict'
import test from 'node:test'
import { chromium } from 'playwright'

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4182'

test('Terms opens from the overview without rendering the previous page with new props', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } })
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.locator('a[href="/about"]').first().click()
      await page.waitForURL('**/about')
      await page.waitForLoadState('networkidle')
      await page.locator('main').waitFor()
      assert.equal(await page.getByText('Something went wrong loading the page.', { exact: true }).count(), 0)
      assert.equal(await page.locator('main').count(), 1)
      await page.close()
    }
  } finally {
    await browser.close()
  }
})
