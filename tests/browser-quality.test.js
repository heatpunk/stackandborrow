import assert from 'node:assert/strict'
import test from 'node:test'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4180'
const routes = ['/', '/calculator', '/lenders', '/about', '/skatt-bitcoin-lan', '/compare/ledn-vs-strike', '/lenders/ledn', '/glossary/apr']
const browserPath = process.env.CHROMIUM_PATH || undefined

test('rendered routes have one main, no axe contrast issues, and support keyboard routing', async () => {
  const browser = await chromium.launch({ headless: true, ...(browserPath ? { executablePath: browserPath } : {}) })
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, locale: 'en-US' })
      const page = await context.newPage()
      const pageErrors = []
      page.on('pageerror', (error) => pageErrors.push(error.message))

      for (const route of routes) {
        await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' })
        await page.waitForTimeout(300)
        assert.equal(await page.locator('main').count(), 1, `${route} at ${viewport.width}px has exactly one main landmark`)
        const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        assert.equal(audit.violations.length, 0, `${route} accessibility violations: ${audit.violations.map((violation) => `${violation.id} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`).join('; ')}`)
        assert.deepEqual(pageErrors, [], `${route} browser errors`)
        if (viewport.width >= 1024 && route !== '/calculator') {
          assert.equal(await page.locator('h1').count(), 1, `${route} desktop primary heading`)
        }
      }

      await page.goto(new URL('/', base).href, { waitUntil: 'networkidle' })
      await page.keyboard.press('Tab')
      assert.equal(await page.evaluate(() => document.activeElement.matches('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')), true, 'keyboard focus lands on an interactive control')
      await page.evaluate(() => {
        const link = [...document.querySelectorAll('a')].find((anchor) => anchor.getAttribute('href') === '/calculator')
        link?.focus()
      })
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '/calculator')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => location.pathname === '/calculator')
      await page.goto(new URL('/', base).href, { waitUntil: 'networkidle' })
      await page.evaluate(() => localStorage.setItem('stackandborrow:language', JSON.stringify('sv')))
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForFunction(() => document.documentElement.lang === 'sv' && document.querySelector('main')?.textContent.includes('Behåll dina sats.'))
      const localeChunks = await page.evaluate(() => performance.getEntriesByType('resource').filter((entry) => /\/assets\/(en|sv)-[^/]+\.js$/.test(entry.name)).map((entry) => new URL(entry.name).pathname.split('/').pop()))
      assert.deepEqual([...new Set(localeChunks)].sort(), [localeChunks.find((name) => name.startsWith('sv-'))], 'only the selected Swedish locale chunk is fetched')

      for (const theme of ['light', 'carbon', 'midnight']) {
        await page.evaluate((value) => {
          localStorage.setItem('sb.theme', value)
          document.documentElement.setAttribute('data-theme', value)
        }, theme)
        await page.reload({ waitUntil: 'networkidle' })
        await page.waitForTimeout(300)
        const themedAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        const themedContrast = themedAudit.violations.find((violation) => violation.id === 'color-contrast')
        assert.equal(themedContrast?.nodes.length || 0, 0, `landing contrast in ${theme}: ${themedContrast?.nodes.map((node) => node.target.join(' ')).join(', ')}`)
      }
      await context.close()
    }
  } finally {
    await browser.close()
  }
})
