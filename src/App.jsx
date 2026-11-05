// ============================================================
// APP — top-level router + error boundary.
//
// Hash routing (#about, #lenders, else Calculator) so it works
// on any static host without server-side routing config.
// All shared data — live BTC price, lender list, region — is
// fetched here and threaded down as props.
// ============================================================

import React from 'react';
import {
  useLivePrices,
  useLenders,
  useRoute,
  detectCurrencyFromLocale,
  detectRegionFromCurrency,
} from './lib/hooks.js';
import { applyRouteSeo } from './lib/seo.js';
import { GLOSSARY } from './lib/glossary.js';
import { SB, ensureThemeCss } from './system/tokens.js';
import { ThemeProvider } from './system/theme.jsx';
import { MobileThemeToggleCorner } from './system/components.jsx';
import { LanguageProvider, useT } from './i18n/index.jsx';

// Separate function component so it can call useT() — the
// class-based ErrorBoundary delegates rendering here.
function ErrorFallback({ error }) {
  const t = useT();
  return (
    <div style={{
      padding: '2rem',
      fontFamily: SB.mono,
      color: SB.rust,
      background: SB.stage,
      minHeight: '100vh',
    }}>
      <h2 style={{ color: SB.cream, fontFamily: SB.serif }}>
        {t('common.error.title')}
      </h2>
      <pre style={{
        background: '#141417',
        padding: '1rem',
        borderRadius: '0.5rem',
        overflow: 'auto',
        fontSize: '0.75rem',
        marginTop: '1rem',
        color: 'rgba(255,255,255,0.85)',
      }}>
        {error?.toString() || t('common.error.unknown')}
        {'\n\n'}
        {error?.stack || ''}
      </pre>
      <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>
        {t('common.error.return.before')}
        <a href="#" style={{ color: SB.orange }}>{t('common.error.return.link')}</a>
        {t('common.error.return.after')}
      </p>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Stack & Borrow error:', error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <ErrorFallback error={this.state.error} />;
  }
}

export default function App() {
  ensureThemeCss();
  const route = useRoute();
  const live = useLivePrices();
  const { lenders, lastUpdated } = useLenders();
  const [activePage, setActivePage] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let Page;
      if (route === '') Page = (await import('./pages/Landing.jsx')).default;
      else if (route === 'calculator') Page = (await import('./pages/Calculator.jsx')).default;
      else if (route === 'lenders') Page = (await import('./pages/Lenders.jsx')).default;
      else if (route === 'about') Page = (await import('./pages/About.jsx')).default;
      else if (route === 'sweden-tax') Page = (await import('./pages/SwedenTax.jsx')).default;
      else if (typeof route === 'string' && route.startsWith('compare:')) Page = (await import('./pages/Compare.jsx')).default;
      else if (typeof route === 'string' && route.startsWith('lender:')) Page = (await import('./pages/LenderDetail.jsx')).default;
      else if (typeof route === 'string' && route.startsWith('glossary:')) Page = (await import('./pages/Glossary.jsx')).default;
      else Page = (await import('./pages/Void.jsx')).VoidState404;
      if (!cancelled) setActivePage({ route, Page });
    };
    load();
    return () => { cancelled = true; };
  }, [route]);

  // Keep <title>, meta description, canonical, OG, and JSON-LD in
  // sync with the active route. Static HTML files set the initial
  // values at first paint (so crawlers without JS see correct
  // meta), and this keeps them right when users navigate
  // client-side. Compare routes pull lender names from lenders.json
  // at render time, so we pass it in for the per-pair lookup.
  React.useEffect(() => { applyRouteSeo(route, { lenders, glossary: GLOSSARY }); }, [route, lenders]);

  // Currency defaults from locale (first visit). The Calculator owns the
  // persistent storage; we only seed the initial value.
  const initialCurrency = React.useMemo(() => detectCurrencyFromLocale(), []);

  // Region is derived from the *currently chosen* currency. The calculator
  // persists currency, but on first paint we read from the same key so the
  // lender filter matches what the user will see in the calc.
  const region = React.useMemo(() => {
    try {
      const stored = window.localStorage.getItem('stackandborrow:currency');
      const c = stored ? JSON.parse(stored) : initialCurrency;
      return detectRegionFromCurrency(c);
    } catch {
      return detectRegionFromCurrency(initialCurrency);
    }
  }, [initialCurrency, route]); // re-check on route change

  // Routes — useRoute() returns a normalized route name:
  //   ''           → Landing (overview, /)
  //   'calculator' → Calculator (/calculator)
  //   'lenders'    → Lenders (/lenders)
  //   'about'      → Terms / About (/about)
  //   'sweden-tax' → Swedish tax guide (/skatt-bitcoin-lan)
  //   'compare:X-vs-Y' → Head-to-head (/compare/X-vs-Y)
  //   anything else → 404
  const pageProps = route === ''
    ? { live, lenders, region, initialCurrency }
    : route === 'calculator'
      ? { live, lenders, lastUpdated, region, initialCurrency }
      : route === 'lenders'
        ? { lenders, lastUpdated, live, currency: readStoredCurrency(initialCurrency), region }
        : route === 'about'
          ? {}
          : route === 'sweden-tax'
            ? { live, lastUpdated }
            : typeof route === 'string' && route.startsWith('compare:')
              ? { slug: route.slice('compare:'.length), lenders, lastUpdated, live, currency: readStoredCurrency(initialCurrency), region }
              : typeof route === 'string' && route.startsWith('lender:')
                ? { id: route.slice('lender:'.length), lenders, lastUpdated, live, currency: readStoredCurrency(initialCurrency), region }
                : typeof route === 'string' && route.startsWith('glossary:')
                  ? { slug: route.slice('glossary:'.length), live, lastUpdated }
                  : { attemptedPath: route };
  // Never pass the next route's props to the previously loaded component.
  const page = activePage?.route === route
    ? React.createElement(activePage.Page, pageProps)
    : <div aria-busy="true" />;

  return (
    <LanguageProvider>
      <ThemeProvider>
        <ErrorBoundary>{page}</ErrorBoundary>
        <MobileThemeToggleCorner />
      </ThemeProvider>
    </LanguageProvider>
  );
}

function readStoredCurrency(fallback) {
  try {
    const stored = window.localStorage.getItem('stackandborrow:currency');
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}
