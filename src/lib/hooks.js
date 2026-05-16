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

// Hash routing — re-renders on hashchange. Returns the current hash
// string (with leading "#" or empty).
export function useHashRoute() {
  const [route, setRoute] = useState(
    typeof window !== 'undefined' ? window.location.hash : ''
  );
  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return route;
}
