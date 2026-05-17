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
};

// Read-only export of just the URL list — used by build-time
// scripts and the sitemap generator.
export const ROUTE_URLS = Object.values(SEO_DATA).map((d) => ORIGIN + d.path);

// Apply the SEO metadata for a given route to the live document.
// Safe to call repeatedly; idempotent for the same route.
export function applyRouteSeo(route) {
  if (typeof document === 'undefined') return;
  const data = SEO_DATA[route] || SEO_DATA[''];
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
