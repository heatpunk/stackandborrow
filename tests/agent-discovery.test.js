import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const manifestPath = resolve(root, 'dist/.well-known/ard.json')
const conformancePath = resolve(root, '.vendor/ard-spec/conformance/bin/conformance-test')

async function loadManifest() {
  return JSON.parse(await readFile(manifestPath, 'utf8'))
}

test('ARD manifest passes the pinned official conformance suite', async () => {
  const result = spawnSync(conformancePath, ['manifest', manifestPath], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  assert.match(result.stdout, /All 5 entries validate against ArdEntry/)
})

test('every ARD entry points to a real local resource and has search queries', async () => {
  const manifest = await loadManifest()
  assert.ok(Array.isArray(manifest.entries))
  for (const entry of manifest.entries) {
    assert.equal(typeof entry.identifier, 'string')
    assert.ok(entry.representativeQueries.length >= 2 && entry.representativeQueries.length <= 5)
    assert.equal(Object.hasOwn(entry, 'url') + Object.hasOwn(entry, 'data'), 1)
    if (entry.url) {
      const url = new URL(entry.url)
      assert.equal(url.origin, 'https://stackandborrow.com')
      const pathname = url.pathname.replace(/\/$/, '')
      const file = pathname.endsWith('.json') ? resolve(root, 'dist', pathname.slice(1)) : pathname === '' ? resolve(root, 'dist/index.html') : resolve(root, 'dist', pathname.slice(1), 'index.html')
      await readFile(file)
    }
  }
})

test('llms.txt has an H1 and absolute Markdown links to existing site resources', async () => {
  const content = await readFile(resolve(root, 'public/llms.txt'), 'utf8')
  assert.match(content, /^# .+/)
  const links = [...content.matchAll(/\[[^\]]+\]\((https:\/\/stackandborrow\.com[^)]+)\)/g)].map((match) => new URL(match[1]))
  assert.ok(links.length > 0)
  for (const url of links) {
    const file = url.pathname === '/' ? resolve(root, 'dist/index.html') : resolve(root, 'dist', url.pathname.replace(/^\//, '').replace(/\/$/, ''), url.pathname.endsWith('.json') ? '' : 'index.html')
    await readFile(file)
  }
})

test('deployment headers are limited and keep CSP in report-only mode', async () => {
  const headers = await readFile(resolve(root, 'public/_headers'), 'utf8')
  assert.match(headers, /Content-Security-Policy-Report-Only:/)
  assert.doesNotMatch(headers, /\n\s*Content-Security-Policy:/)
  assert.match(headers, /Strict-Transport-Security: max-age=86400/)
  assert.match(headers, /Cross-Origin-Opener-Policy: same-origin-allow-popups/)
})

test('Vite production output includes locally hosted font files', async () => {
  for (const font of ['fraunces-italic-400.ttf', 'fraunces-normal-400.ttf', 'fraunces-normal-600.ttf', 'geist-normal-400.ttf', 'geist-mono-normal-400.ttf']) {
    await readFile(resolve(root, 'dist/fonts', font))
  }
})


test('all built route shells contain an ARD link and leave main landmarks to React', async () => {
  const { readdir } = await import('node:fs/promises')
  async function htmlFiles(dir) {
    const files = []
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, item.name)
      if (item.isDirectory()) files.push(...await htmlFiles(path))
      else if (item.name.endsWith('.html')) files.push(path)
    }
    return files
  }
  const files = await htmlFiles(resolve(root, 'dist'))
  assert.ok(files.length > 0)
  for (const file of files) {
    const html = await readFile(file, 'utf8')
    assert.equal((html.match(/<main\b/g) || []).length, 0, `${file} must not hardcode a main around React's root`)
    assert.match(html, /<div id="root"><\/div>/, `${file} has a mount root`)
    assert.match(html, /<link rel="ard" href="\/.well-known\/ard\.json"\s*\/>/)
  }
})
