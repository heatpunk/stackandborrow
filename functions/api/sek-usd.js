// Proxy for Riksbanken's daily SEK/USD fixing.
//
// Riksbanken's api.riksbank.se omits Access-Control-Allow-Origin, so
// browsers block a direct fetch from another origin. Routing through
// this same-origin function adds the CORS header and caches at the
// Cloudflare edge — Riksbanken sees ~4 requests/day globally regardless
// of site traffic, and visitors never expose their IP to a third party
// for an FX rate lookup.

const UPSTREAM = 'https://api.riksbank.se/swea/v1/Observations/Latest/SEKUSDPMI';
const TTL_SECONDS = 21600; // 6h — Riksbanken publishes once per weekday ~13:00 CET

export async function onRequest() {
  const upstream = await fetch(UPSTREAM, {
    cf: { cacheTtl: TTL_SECONDS, cacheEverything: true },
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${TTL_SECONDS}`,
      'access-control-allow-origin': '*',
    },
  });
}
