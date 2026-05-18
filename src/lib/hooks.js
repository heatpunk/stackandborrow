// ============================================================
// HOOKS — live BTC prices, lender data, persistent state.
// Ported from the original App.jsx with identical signatures.
// ============================================================

import { useState, useEffect, useCallback } from 'react';

const FALLBACK_BTC_USD = 104287;

const FALLBACK_FX_TO_USD = {
  USD: 1.0, EUR: 1.08, GBP: 1.27, CAD: 0.73,
  AUD: 0.66, JPY: 0.0067, CHF: 1.13, SEK: 0.094,
};

// Detect a sensible default currency from browser locale on first visit
// (no saved preference yet). Returns one of our supported currencies.
export function detectCurrencyFromLocale() {
  if (typeof navigator === 'undefined') return 'USD';
  const locale = navigator.language || navigator.userLanguage || 'en-US';
  const country = locale.split('-')[1]?.toUpperCase() || '';
  const map = {
    SE: 'SEK',
    US: 'USD',
    GB: 'GBP', UK: 'GBP',
    CA: 'CAD',
    AU: 'AUD', NZ: 'AUD',
    JP: 'JPY',
    CH: 'CHF', LI: 'CHF',
    // EU countries → EUR
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
    AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
    SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR',
    CY: 'EUR', HR: 'EUR',
    DK: 'EUR', PL: 'EUR', CZ: 'EUR', HU: 'EUR', RO: 'EUR', BG: 'EUR', NO: 'EUR',
  };
  return map[country] || 'USD';
}

// Detect a sensible default UI language from browser locale.
// Returns one of the supported language codes; falls back to 'en'.
// Mirrors detectCurrencyFromLocale — same input signal, different
// mapping target. Used both on first paint and as the "View in <X>"
// label when the visitor has manually picked English.
const SUPPORTED_UI_LANGUAGES = ['en', 'sv', 'de', 'es', 'fr', 'pt'];
export function detectLanguageFromLocale() {
  if (typeof navigator === 'undefined') return 'en';
  const locale = navigator.language || navigator.userLanguage || 'en';
  const lang = locale.split('-')[0]?.toLowerCase() || 'en';
  return SUPPORTED_UI_LANGUAGES.includes(lang) ? lang : 'en';
}

// Detect a region key for lender filtering.
export function detectRegionFromCurrency(currency) {
  switch (currency) {
    case 'USD': return 'us';
    case 'CAD': return 'ca';
    case 'EUR': case 'SEK': return 'eu';
    case 'GBP': return 'uk';
    case 'AUD': return 'au';
    case 'JPY': return 'jp';
    case 'CHF': return 'ch';
    default:    return 'global';
  }
}

// Live BTC + FX prices from mempool.space, with utxoracle fallback.
// Polls every 5 minutes; exposes manual refresh.
export function useLivePrices() {
  const [data, setData] = useState({
    btcUsd: FALLBACK_BTC_USD,
    fxToUsd: FALLBACK_FX_TO_USD,
    source: 'fallback',
    loading: true,
    updatedAt: null,
    error: null,
  });

  const fetchPrices = useCallback(async () => {
    setData((d) => ({ ...d, loading: true }));
    try {
      const res = await fetch('https://mempool.space/api/v1/prices');
      if (!res.ok) throw new Error('mempool fetch failed');
      const j = await res.json();
      const fx = {
        USD: 1.0,
        EUR: j.EUR ? j.USD / j.EUR : FALLBACK_FX_TO_USD.EUR,
        GBP: j.GBP ? j.USD / j.GBP : FALLBACK_FX_TO_USD.GBP,
        CAD: j.CAD ? j.USD / j.CAD : FALLBACK_FX_TO_USD.CAD,
        AUD: j.AUD ? j.USD / j.AUD : FALLBACK_FX_TO_USD.AUD,
        JPY: j.JPY ? j.USD / j.JPY : FALLBACK_FX_TO_USD.JPY,
        CHF: j.CHF ? j.USD / j.CHF : FALLBACK_FX_TO_USD.CHF,
        // SEK isn't in mempool's response — derive from EUR cross.
        SEK: j.EUR ? (j.USD / j.EUR) / 11.3 : FALLBACK_FX_TO_USD.SEK,
      };
      setData({
        btcUsd: j.USD,
        fxToUsd: fx,
        source: 'mempool.space',
        loading: false,
        updatedAt: new Date(j.time * 1000),
        error: null,
      });
      return;
    } catch (e) {
      // Fallback: utxoracle (USD-only)
      try {
        const res = await fetch('https://api.utxoracle.io/latest.json');
        if (!res.ok) throw new Error('utxoracle failed');
        const j = await res.json();
        setData((prev) => ({
          ...prev,
          btcUsd: j.price,
          source: 'utxoracle.io',
          loading: false,
          updatedAt: new Date(j.updated_at),
          error: 'FX rates approximate',
        }));
        return;
      } catch (e2) {
        setData((prev) => ({ ...prev, loading: false, error: 'Using fallback prices' }));
      }
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchPrices]);

  return { ...data, refresh: fetchPrices };
}

// Reads /lenders.json once at mount. To update rates: edit the JSON.
export function useLenders() {
  const [lenders, setLenders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetch('/lenders.json')
      .then((r) => r.json())
      .then((data) => {
        setLenders(data.lenders || []);
        setLastUpdated(data.lastUpdated || null);
      })
      .catch((e) => {
        console.warn('Could not load lenders.json:', e);
        setLenders([]);
      });
  }, []);

  return { lenders, lastUpdated };
}

// Persistent state via localStorage. Same key convention as the
// original ("stackandborrow:<key>") so existing saves carry over.
export function usePersistentState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = window.localStorage.getItem(`stackandborrow:${key}`);
      if (stored !== null) return JSON.parse(stored);
    } catch (e) { /* fall through */ }
    return defaultValue;
  });

  const setAndPersist = useCallback((next) => {
    setValue((prev) => {
      const newValue = typeof next === 'function' ? next(prev) : next;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`stackandborrow:${key}`, JSON.stringify(newValue));
        }
      } catch (e) { /* storage full or disabled */ }
      return newValue;
    });
  }, [key]);

  return [value, setAndPersist];
}

// Path routing — re-renders on history navigation. Returns a
// normalized route name: '', 'calculator', 'lenders', 'about', or
// '__notfound__' for anything else. Real URLs (e.g. /calculator)
// are used so each page can be indexed by search engines as its
// own document with its own <title> and meta description.
//
// Backwards compat: legacy hash URLs (#calculator, #lenders,
// #about) and the alternate Swedish surface (#calc, #kalkylator,
// #langivare, /kalkylator, /langivare, /om) are redirected to
// the canonical English path via history.replaceState on first
// paint, so old bookmarks and shared links continue to work and
// search engines see a single canonical URL per page.
const ROUTE_ALIASES = {
  // legacy hash routes
  '#calculator': 'calculator',
  '#calc': 'calculator',
  '#lenders': 'lenders',
  '#about': 'about',
  // Swedish / alternate paths
  '/kalkylator': 'calculator',
  '/kalkylator/': 'calculator',
  '/langivare': 'lenders',
  '/langivare/': 'lenders',
  '/long-givare': 'lenders',
  '/om': 'about',
  '/om/': 'about',
  // Swedish-tax page aliases (shorter forms redirect to the canonical slug).
  '/skatt': 'sweden-tax',
  '/skatt/': 'sweden-tax',
  '/bitcoin-lan-skatt': 'sweden-tax',
};

const CANONICAL_PATH = {
  '': '/',
  calculator: '/calculator',
  lenders: '/lenders',
  about: '/about',
  'sweden-tax': '/skatt-bitcoin-lan',
};

// Compare-route slug pattern: two lender IDs joined by "-vs-".
// Lender IDs in lenders.json are all lowercase a–z (no hyphens),
// so this regex stays simple. If a future lender ID introduces a
// hyphen, widen the character class and revisit canonicalization
// in Compare.jsx.
const COMPARE_SLUG_RE = /^[a-z0-9]+-vs-[a-z0-9]+$/;

function normalizePath(pathname, hash) {
  // Strip trailing slash except for root.
  let p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/' && hash) {
    const aliased = ROUTE_ALIASES[hash];
    if (aliased !== undefined) return aliased;
    // Bare # or unknown hash on root → landing.
    return '';
  }
  if (p === '/') return '';
  // Canonical English paths.
  if (p === '/calculator') return 'calculator';
  if (p === '/lenders')    return 'lenders';
  if (p === '/about')      return 'about';
  // Swedish-locale tax page (canonical Swedish slug).
  if (p === '/skatt-bitcoin-lan') return 'sweden-tax';
  // Compare pages — /compare/{a}-vs-{b}.
  if (p.startsWith('/compare/')) {
    const slug = p.slice('/compare/'.length);
    if (COMPARE_SLUG_RE.test(slug)) return 'compare:' + slug;
  }
  // Per-lender detail pages — /lenders/{id}. The lenders.json IDs are
  // all lowercase alphanumeric, so /^[a-z0-9]+$/ catches every legal
  // id and rejects anything with slashes, dashes, or query junk.
  // The exact /lenders match above already returned 'lenders' for the
  // directory page, so this only runs for paths like /lenders/ledn.
  if (p.startsWith('/lenders/')) {
    const id = p.slice('/lenders/'.length);
    if (/^[a-z0-9]+$/.test(id)) return 'lender:' + id;
  }
  // Glossary term pages — /glossary/{term}. Slugs are kebab-case
  // (e.g. "loan-to-value", "tax-event"). The component resolves the
  // slug to a glossary key and 404s if it's unknown.
  if (p.startsWith('/glossary/')) {
    const slug = p.slice('/glossary/'.length);
    if (/^[a-z0-9-]+$/.test(slug)) return 'glossary:' + slug;
  }
  // Alias paths (Swedish, legacy).
  const aliased = ROUTE_ALIASES[p] ?? ROUTE_ALIASES[p + '/'];
  if (aliased !== undefined) return aliased;
  return '__notfound__';
}

// Read the current normalized route from window.location.
function readRoute() {
  if (typeof window === 'undefined') return '';
  return normalizePath(window.location.pathname, window.location.hash);
}

export function useRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    // On first paint, canonicalize the URL: replace hash routes and
    // alias paths with the canonical English path, without adding a
    // history entry (replaceState, not pushState).
    const current = readRoute();
    if (typeof window !== 'undefined' && current !== '__notfound__') {
      const canonical = CANONICAL_PATH[current];
      const here = window.location.pathname.replace(/\/+$/, '') || '/';
      const needsRewrite =
        (window.location.hash && current !== '') ||
        (canonical && here !== canonical && !(canonical === '/' && here === ''));
      if (needsRewrite && canonical) {
        try {
          window.history.replaceState(
            window.history.state,
            '',
            canonical + window.location.search,
          );
          setRoute(current);
        } catch { /* sandboxed history — ignore */ }
      }
    }

    const onChange = () => setRoute(readRoute());
    window.addEventListener('popstate', onChange);
    window.addEventListener('sb:navigate', onChange);
    // Keep hashchange so legacy in-page anchors still work if any
    // remain (e.g. accessibility skip-links).
    window.addEventListener('hashchange', onChange);

    // Document-level click interceptor: any <a> with an internal
    // href ("/", "/calculator", "/lenders", "/about") gets routed
    // through history.pushState instead of triggering a full page
    // reload. External links, mailto:, modifier-clicked links, and
    // links with target="_blank" pass through to the browser.
    const onDocClick = (e) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '' && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('//') || href.includes('://')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
      // In-page hash like #calc, #section — let it scroll natively.
      if (href.startsWith('#')) return;
      if (!href.startsWith('/')) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener('click', onDocClick);

    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('sb:navigate', onChange);
      window.removeEventListener('hashchange', onChange);
      document.removeEventListener('click', onDocClick);
    };
  }, []);

  return route;
}

// Programmatic navigation. Use this from click handlers in Link
// components to update the URL without a full page reload.
export function navigate(path) {
  if (typeof window === 'undefined') return;
  const target = path || '/';
  try {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new Event('sb:navigate'));
    // Reset scroll on route change (browsers don't do this for
    // pushState the way they do for full navigations).
    window.scrollTo(0, 0);
  } catch { /* ignore */ }
}

// Back-compat alias — older code imports useHashRoute. Returns
// the same normalized route name as useRoute.
export const useHashRoute = useRoute;
