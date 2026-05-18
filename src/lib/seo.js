// ============================================================
// SEO — per-route document head updates.
//
// Static HTML files at /, /calculator/, /lenders/, /about/ set
// the correct <title>, meta description, canonical, OG, Twitter,
// and JSON-LD at first paint so crawlers without JS see the right
// thing for each URL. This module keeps those tags in sync when
// users navigate client-side.
//
// The site is bilingual in intent (English primary, Swedish
// secondary). Descriptions include Swedish keyword variants where
// natural so the Swedish market can find us via "bitcoin lån",
// "bitcoin som säkerhet", etc. hreflang tags in the HTML head
// declare both surfaces.
// ============================================================

const ORIGIN = 'https://stackandborrow.com';

export const SEO_DATA = {
  '': {
    path: '/',
    title: 'Stack & Borrow — Bitcoin-backed loan calculator. Keep your sats. Free your cash.',
    description: 'Bitcoin-backed loan calculator. Compare borrowing vs selling across multiple BTC price scenarios with tax-aware math. Honest lender rankings, sats-first. Bitcoin lån / bitcoin som säkerhet.',
    keywords: 'bitcoin loan calculator, btc backed loan, bitcoin collateral loan, btc loan vs sell, bitcoin tax calculator, bitcoin loan rates, ledn calculator, firefish calculator, debifi calculator, stack and borrow strategy, bitcoin wealth strategy, buy borrow live, btc lending strategy, multi-year bitcoin loan, bitcoin lån, bitcoin som säkerhet, btc lån',
    ogTitle: 'Stack & Borrow — Keep your sats. Free your cash.',
    ogDescription: 'Bitcoin-backed loan calculator. Sats-first, tax-aware, honest lender rankings.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Stack & Borrow',
      url: ORIGIN + '/',
      description: 'Bitcoin-backed loan calculator. Compare borrowing vs selling across multiple BTC price scenarios with tax-aware math. Honest lender rankings, sats-first.',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Bitcoin-backed loan calculator',
        'Sats-first interface with multi-currency support',
        'Tax-aware comparison of borrowing vs selling',
        'Bear, base, and bull case projections',
        'Honest lender ranking by total cost',
        'No signup required',
        'No tracking',
      ],
    },
  },

  calculator: {
    path: '/calculator',
    title: 'Bitcoin Loan Calculator — Borrow vs Sell Math | Stack & Borrow',
    description: 'Free Bitcoin loan calculator. See exactly how many sats you keep by borrowing against BTC instead of selling, across bear, base, and bull cases. Tax-aware. Multi-currency. Räkna ut bitcoin-lån vs försäljning.',
    keywords: 'bitcoin loan calculator, btc loan calculator, bitcoin borrow vs sell, bitcoin collateral calculator, btc tax calculator, bitcoin loan APR, ledn loan calculator, firefish calculator, salt lending calculator, bitcoin loan rates 2026, bitcoin lån kalkylator, btc lån räknare, bitcoin som säkerhet kalkylator',
    ogTitle: 'Bitcoin Loan Calculator — See exactly what you keep',
    ogDescription: 'Compare borrowing against your BTC vs selling. Tax-aware math, multi-year projections, sats-first.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Bitcoin Loan Calculator — Stack & Borrow',
      url: ORIGIN + '/calculator',
      description: 'Free Bitcoin loan calculator. Compare borrowing against BTC vs selling, across bear, base, and bull cases.',
      applicationCategory: 'FinanceApplication',
      applicationSubCategory: 'Loan Calculator',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Compare borrowing vs selling Bitcoin',
        'Tax-aware after-tax cash comparison',
        'Multi-year projections (bear / base / bull)',
        'LTV, APR, and origination fee inputs',
        'Sats kept vs sats spent breakdown',
      ],
    },
  },

  lenders: {
    path: '/lenders',
    title: 'Bitcoin-Backed Lenders Ranked by Honest Total Cost | Stack & Borrow',
    description: 'Compare Bitcoin-backed lenders ranked by adjusted total cost. APR, origination fees, LTV, custody type, and rehypothecation — all in one table. Ledn, Firefish, Debifi, Salt Lending and more.',
    keywords: 'bitcoin lenders comparison, btc backed loan lenders, ledn vs firefish, debifi vs ledn, salt lending review, bitcoin loan rates compared, best bitcoin loan, bitcoin loan APR comparison, multi-collateral lenders, btc only lenders, bitcoin långivare, bitcoin lån jämförelse',
    ogTitle: 'Bitcoin Lenders — Ranked by what they actually cost',
    ogDescription: 'Honest lender comparison: total cost, custody, rehypothecation. Sats-first ranking.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Bitcoin-Backed Lenders Ranked',
      url: ORIGIN + '/lenders',
      description: 'Bitcoin-backed lenders compared by adjusted total cost, APR, origination fees, LTV, custody type, and rehypothecation policy.',
      about: {
        '@type': 'Thing',
        name: 'Bitcoin-backed lending',
      },
    },
  },

  about: {
    path: '/about',
    title: 'About Stack & Borrow — Methodology, Bias, and Math | Stack & Borrow',
    description: 'How Stack & Borrow ranks lenders, the math behind the calculator, and why we are sats-first. Methodology, assumptions, and disclosures. Inga affiliate-länkar.',
    keywords: 'stack and borrow methodology, bitcoin loan ranking method, lender ranking math, bitcoin loan calculator about, sats first methodology, btc loan ranking transparency',
    ogTitle: 'About Stack & Borrow — Methodology and bias',
    ogDescription: 'How we rank lenders, the math behind the calculator, and our sats-first stance.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Stack & Borrow',
      url: ORIGIN + '/about',
      description: 'Methodology, ranking math, and disclosures for Stack & Borrow.',
    },
  },

  'sweden-tax': {
    path: '/skatt-bitcoin-lan',
    lang: 'sv',
    title: 'Skatt på lån mot bitcoin i Sverige — Stack & Borrow',
    description: 'Hur Skatteverket ser på bitcoin-säkrade lån i Sverige: ingen kapitalvinstskatt när du lånar, beskattning vid likvidation, ränteavdrag, och vad som skiljer ett kryptolån från andra lån. Klar och uppdaterad guide.',
    keywords: 'bitcoin lån skatt, låna mot bitcoin skatt sverige, kryptolån skatt, deklarera bitcoin lån, bitcoin som säkerhet skatt, skatteverket bitcoin lån, kapitalvinstskatt bitcoin lån, ränteavdrag kryptolån',
    ogTitle: 'Skatt på lån mot bitcoin i Sverige',
    ogDescription: 'Ingen skattepliktig händelse när du lånar mot bitcoin — men det finns hakar. Klar svensk guide till Skatteverkets praxis.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Skatt på lån mot bitcoin i Sverige',
      inLanguage: 'sv-SE',
      url: ORIGIN + '/skatt-bitcoin-lan',
      description: 'Svensk guide till skatteregler för bitcoin-säkrade lån: när uppstår skattepliktig händelse, ränteavdrag, likvidation och deklaration.',
      author: { '@type': 'Organization', name: 'Stack & Borrow' },
      publisher: { '@type': 'Organization', name: 'Stack & Borrow' },
    },
  },
};

// Convert between glossary key (camelCase, the keys used in
// src/lib/glossary.js) and URL slug (kebab-case). URLs avoid camelCase
// because it's not idiomatic in web addresses and case-folding rules
// vary across systems.
export function glossaryKeyToSlug(key) {
  return key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
export function glossarySlugToKey(slug) {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// Build SEO for /glossary/{slug}. Pulls title and body from the
// glossary module so we don't drift from the inline popover copy.
// Falls back to null when the slug doesn't resolve to a known term —
// the page component renders 404 in that case.
export function buildGlossarySeo(slug, glossary) {
  if (!glossary) return null;
  const key = glossarySlugToKey(slug);
  const entry = glossary[key];
  if (!entry) return null;
  const canonicalPath = `/glossary/${slug}`;
  const title = `${entry.title} — Bitcoin Loan Glossary | Stack & Borrow`;
  // Truncate body to ~160 chars for description, ending on a word.
  const body = entry.body || '';
  const description = body.length <= 160
    ? body
    : body.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  return {
    path: canonicalPath,
    title,
    description,
    keywords: `${entry.title.toLowerCase()}, ${entry.title.toLowerCase()} definition, ${entry.title.toLowerCase()} bitcoin loan, ${entry.title.toLowerCase()} explained, bitcoin glossary`,
    ogTitle: `${entry.title} — Bitcoin loan glossary`,
    ogDescription: description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      name: entry.title,
      description: body,
      url: ORIGIN + canonicalPath,
      inDefinedTermSet: {
        '@type': 'DefinedTermSet',
        name: 'Stack & Borrow — Bitcoin Loan Glossary',
        url: ORIGIN + '/about',
      },
    },
  };
}

// Build the SEO data for a per-lender detail page (/lenders/{id}).
// Pulls APR, custody, BTC-only and other selling points straight off
// the lender record so the title and description stay accurate when
// rates change in lenders.json.
export function buildLenderSeo(id, lenders) {
  const l = (lenders || []).find((x) => x.id === id);
  if (!l) return null;

  const canonicalPath = `/lenders/${id}`;
  // Headline rate — use the first tier's APR if tiered, otherwise the
  // single rate. Origination fee folds into the descriptor below.
  const baseApr = l.rateTiers?.[0]?.aprPct ?? 0;
  const aprStr = baseApr ? `${baseApr.toFixed(2)}% APR` : '';

  const traits = [];
  if (l.btcOnly === true) traits.push('BTC-only');
  if (l.custodyType === 'multisig') traits.push('multisig');
  if (l.rehypothecation === 'no') traits.push('no rehypothecation');
  const traitStr = traits.length ? `, ${traits.join(', ')}` : '';

  // Keep the title under ~60 chars so it doesn't truncate in SERPs.
  // Rate, custody traits, and LTV go in description and og:title where
  // there's more room.
  const title = `${l.name} Review — Bitcoin-backed Loan Rates | Stack & Borrow`;
  const description = `${l.name} bitcoin-backed loan review: ${aprStr ? aprStr + ', ' : ''}${l.maxLtv ?? '—'}% max LTV${traitStr}. Independent ranking among ${lenders.length} BTC lenders. Sats-first methodology, custody-risk weighted.`;
  const ogTitle = aprStr
    ? `${l.name} — ${aprStr}${traitStr ? ' ·' + traits.map((s) => ' ' + s).join(' ·') : ''}`
    : `${l.name} — Bitcoin loan review`;

  return {
    path: canonicalPath,
    title,
    description,
    keywords: `${l.name.toLowerCase()} review, ${l.name.toLowerCase()} bitcoin loan, ${l.name.toLowerCase()} rates, ${l.name.toLowerCase()} APR, ${l.name.toLowerCase()} vs alternatives, bitcoin-backed lender review, btc loan provider`,
    ogTitle,
    ogDescription: description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${l.name} — Bitcoin-backed loan review`,
      url: ORIGIN + canonicalPath,
      description,
      author: { '@type': 'Organization', name: 'Stack & Borrow' },
      publisher: { '@type': 'Organization', name: 'Stack & Borrow' },
      about: { '@type': 'Organization', name: l.name },
    },
  };
}

// Build the SEO data for a compare page (/compare/{a}-vs-{b}). Lender
// data comes from lenders.json at runtime; the lenders array is passed
// in so we can resolve display names and produce a rich title and
// description. The canonical URL is the alphabetical-order slug, so
// inverted-order requests (/compare/strike-vs-firefish) still collapse
// to one canonical URL in search results.
export function buildCompareSeo(slug, lenders) {
  const parts = (slug || '').split('-vs-');
  if (parts.length !== 2) return null;
  const [aId, bId] = parts;
  const a = (lenders || []).find((l) => l.id === aId);
  const b = (lenders || []).find((l) => l.id === bId);
  if (!a || !b) return null;

  // Canonical slug is alphabetical, so e.g. "ledn-vs-strike" canonicalizes
  // to "ledn-vs-strike" and "strike-vs-ledn" also canonicalizes to "ledn-vs-strike".
  const [c1, c2] = [aId, bId].sort();
  const canonicalSlug = `${c1}-vs-${c2}`;
  const canonicalPath = `/compare/${canonicalSlug}`;
  const aName = a.name;
  const bName = b.name;

  // Title and description shape both Google snippet and OpenGraph card.
  // Keep them tight enough to render fully in SERPs (≤ 60 chars title,
  // ≤ 160 chars description).
  const title = `${aName} vs ${bName} — Bitcoin Loan Comparison | Stack & Borrow`;
  const description = `${aName} vs ${bName}: APR, origination fees, custody, rehypothecation, and total cost on a Bitcoin-backed loan. Independent comparison, sats-first ranking.`;

  return {
    path: canonicalPath,
    title,
    description,
    keywords: `${aName.toLowerCase()} vs ${bName.toLowerCase()}, ${aName.toLowerCase()} review, ${bName.toLowerCase()} review, bitcoin loan comparison, btc backed loan comparison, ${aName.toLowerCase()} vs ${bName.toLowerCase()} rates, bitcoin loan rates compared`,
    ogTitle: `${aName} vs ${bName} — which Bitcoin lender wins?`,
    ogDescription: description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${aName} vs ${bName} — Bitcoin Loan Comparison`,
      url: ORIGIN + canonicalPath,
      description,
      author: { '@type': 'Organization', name: 'Stack & Borrow' },
      publisher: { '@type': 'Organization', name: 'Stack & Borrow' },
      about: [
        { '@type': 'Organization', name: aName },
        { '@type': 'Organization', name: bName },
      ],
    },
  };
}

// Read-only export of just the URL list — used by build-time
// scripts and the sitemap generator.
export const ROUTE_URLS = Object.values(SEO_DATA).map((d) => ORIGIN + d.path);

// Apply the SEO metadata for a given route to the live document.
// Safe to call repeatedly; idempotent for the same route.
//
// `route` is the normalized route name from useRoute(). For dynamic
// compare routes ("compare:{slug}") the lenders array is consulted to
// build a per-pair title and description. If the lenders haven't loaded
// yet (first paint before the lenders.json fetch resolves), the static
// HTML shell's meta tags are already correct — we no-op rather than
// overwriting them with landing-page defaults.
export function applyRouteSeo(route, ctx = {}) {
  if (typeof document === 'undefined') return;
  let data;
  if (typeof route === 'string' && route.startsWith('compare:')) {
    const slug = route.slice('compare:'.length);
    data = buildCompareSeo(slug, ctx.lenders);
    // No lender data yet → leave the static HTML shell's tags alone.
    if (!data) return;
  } else if (typeof route === 'string' && route.startsWith('lender:')) {
    const id = route.slice('lender:'.length);
    data = buildLenderSeo(id, ctx.lenders);
    if (!data) return;
  } else if (typeof route === 'string' && route.startsWith('glossary:')) {
    const slug = route.slice('glossary:'.length);
    data = buildGlossarySeo(slug, ctx.glossary);
    if (!data) return;
  } else {
    data = SEO_DATA[route] || SEO_DATA[''];
  }
  const canonicalUrl = ORIGIN + data.path;

  document.title = data.title;
  setMetaName('description', data.description);
  setMetaName('keywords',    data.keywords);
  setLinkRel('canonical',    canonicalUrl);

  setMetaProperty('og:type',        'website');
  setMetaProperty('og:url',         canonicalUrl);
  setMetaProperty('og:title',       data.ogTitle || data.title);
  setMetaProperty('og:description', data.ogDescription || data.description);
  setMetaProperty('og:image',       ORIGIN + '/og-image.png');

  setMetaName('twitter:card',        'summary_large_image');
  setMetaName('twitter:url',         canonicalUrl);
  setMetaName('twitter:title',       data.ogTitle || data.title);
  setMetaName('twitter:description', data.ogDescription || data.description);
  setMetaName('twitter:image',       ORIGIN + '/og-image.png');

  // hreflang — declare English (default) and Swedish surfaces.
  // The Swedish surface is the same URL; the i18n layer flips the
  // body language. Google understands "this URL serves multiple
  // languages" via x-default + per-language alternates.
  setLinkAlternate('en', canonicalUrl);
  setLinkAlternate('sv', canonicalUrl);
  setLinkAlternate('x-default', canonicalUrl);

  setJsonLd(data.jsonLd);
}

function setMetaName(name, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaProperty(property, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLinkRel(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setLinkAlternate(hreflang, href) {
  let el = document.head.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(obj) {
  if (!obj) return;
  let el = document.head.querySelector('script[type="application/ld+json"][data-sb-route]');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-sb-route', '1');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj);
}
