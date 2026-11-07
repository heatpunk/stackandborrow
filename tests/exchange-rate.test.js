import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const configuration = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url)));

test('the deployed Worker routes the exchange-rate endpoint to executable code', async () => {
  assert.ok(configuration.main, 'Cloudflare Workers must have a script entrypoint');
  assert.equal(configuration.assets.binding, 'ASSETS');
  const worker = (await import(new URL(`../${configuration.main}`, import.meta.url))).default;
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ value: 9.8755, date: '2026-11-06' });
  try {
    const response = await worker.fetch(new Request('https://stackandborrow.com/api/sek-usd'), { ASSETS: { fetch: () => new Response('asset', { status: 404 }) } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { value: 9.8755, date: '2026-11-06', source: 'Riksbanken' });
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test('uses Frankfurter when Riksbanken is unavailable', async () => {
  const worker = (await import(new URL(`../${configuration.main}`, import.meta.url))).default;
  const oldFetch = globalThis.fetch;
  const called = [];
  globalThis.fetch = async (url) => {
    called.push(url);
    return called.length === 1
      ? new Response('unavailable', { status: 503 })
      : Response.json({ base: 'USD', quote: 'SEK', rate: 9.81, date: '2026-11-06' });
  };
  try {
    const response = await worker.fetch(new Request('https://stackandborrow.com/api/sek-usd'), {});
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { value: 9.81, date: '2026-11-06', source: 'Frankfurter' });
    assert.match(called[1], /^https:\/\/api\.frankfurter\.dev\//);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test('skips invalid rates, fails closed when both sources fail, and preserves other routes', async () => {
  const worker = (await import(new URL(`../${configuration.main}`, import.meta.url))).default;
  const oldFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ value: -1, rate: 0, date: '2026-11-06', base: 'USD', quote: 'SEK' }); };
  try {
    const bad = await worker.fetch(new Request('https://stackandborrow.com/api/sek-usd'), {});
    assert.equal(bad.status, 503);
    assert.equal(bad.headers.get('cache-control'), 'no-store');
    assert.equal(calls, 2);
    const page = await worker.fetch(new Request('https://stackandborrow.com/lenders'), { ASSETS: { fetch: () => new Response('static page') } });
    assert.equal(await page.text(), 'static page');
  } finally {
    globalThis.fetch = oldFetch;
  }
});
