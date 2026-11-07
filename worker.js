const RIKSBANKEN = 'https://api.riksbank.se/swea/v1/Observations/Latest/SEKUSDPMI';
const FRANKFURTER = 'https://api.frankfurter.dev/v2/rate/usd/sek';
const TIMEOUT_MS = 4000;
const CACHE_SECONDS = 21600;

async function getRate(url, source) {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true } });
  if (!response.ok) throw new Error(`${source} returned ${response.status}`);
  const data = await response.json();
  const value = source === 'Riksbanken' ? data.value : data.rate;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error(`${source} returned invalid data`);
  }
  if (source === 'Frankfurter' && (data.base !== 'USD' || data.quote !== 'SEK')) {
    throw new Error('Frankfurter returned the wrong currency pair');
  }
  return { value, date: data.date, source };
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/sek-usd') return env.ASSETS.fetch(request);
    for (const [url, source] of [[RIKSBANKEN, 'Riksbanken'], [FRANKFURTER, 'Frankfurter']]) {
      try {
        const rate = await getRate(url, source);
        return Response.json(rate, { headers: { 'cache-control': 'public, max-age=300' } });
      } catch { /* Try the next provider. */ }
    }
    return Response.json({ error: 'Exchange rate unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  },
};
