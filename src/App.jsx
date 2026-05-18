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

import CalculatorPage    from './pages/Calculator.jsx';
import LendersPage       from './pages/Lenders.jsx';
import AboutPage         from './pages/About.jsx';
import LandingPage       from './pages/Landing.jsx';
import ComparePage       from './pages/Compare.jsx';
import LenderDetailPage  from './pages/LenderDetail.jsx';
import GlossaryPage      from './pages/Glossary.jsx';
import SwedenTaxPage     from './pages/SwedenTax.jsx';
import { VoidState404 }  from './pages/Void.jsx';
import { GLOSSARY }      from './lib/glossary.js';
import { SB, ensureThemeCss } from './system/tokens.js';
import { ThemeProvider } from './system/theme.jsx';
import { MobileThemeToggleCorner } from './system/components.jsx';
import { LanguageProvider, useT } from './i18n/index.jsx';

// Loads our two webfonts once at the document level.
function ensureFonts() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('sb-fonts')) return;
  const link = document.createElement('link');
  link.id = 'sb-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500;1,9..144,600&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
  // Background tracks the active theme via CSS var (set by ensureThemeCss).
  document.body.style.margin = '0';
  document.body.style.fontFamily = "'Geist', system-ui, sans-serif";
  document.body.style.webkitFontSmoothing = 'antialiased';
}

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
  ensureFonts();
  ensureThemeCss();
  const route = useRoute();
  const live = useLivePrices();
  const { lenders, lastUpdated } = useLenders();

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
  let page;
  if (route === '') {
    page = (
      <LandingPage
        live={live}
        lenders={lenders}
        region={region}
        initialCurrency={initialCurrency}
      />
    );
  } else if (route === 'calculator') {
    page = (
      <CalculatorPage
        live={live}
        lenders={lenders}
        lastUpdated={lastUpdated}
        region={region}
        initialCurrency={initialCurrency}
      />
    );
  } else if (route === 'lenders') {
    page = (
      <LendersPage
        lenders={lenders}
        lastUpdated={lastUpdated}
        live={live}
        currency={readStoredCurrency(initialCurrency)}
        region={region}
      />
    );
  } else if (route === 'about') {
    page = <AboutPage />;
  } else if (route === 'sweden-tax') {
    page = <SwedenTaxPage live={live} lastUpdated={lastUpdated} />;
  } else if (typeof route === 'string' && route.startsWith('compare:')) {
    const slug = route.slice('compare:'.length);
    page = (
      <ComparePage
        slug={slug}
        lenders={lenders}
        lastUpdated={lastUpdated}
        live={live}
        currency={readStoredCurrency(initialCurrency)}
        region={region}
      />
    );
  } else if (typeof route === 'string' && route.startsWith('lender:')) {
    const id = route.slice('lender:'.length);
    page = (
      <LenderDetailPage
        id={id}
        lenders={lenders}
        lastUpdated={lastUpdated}
        live={live}
        currency={readStoredCurrency(initialCurrency)}
        region={region}
      />
    );
  } else if (typeof route === 'string' && route.startsWith('glossary:')) {
    const slug = route.slice('glossary:'.length);
    page = <GlossaryPage slug={slug} live={live} lastUpdated={lastUpdated} />;
  } else {
    page = <VoidState404 attemptedPath={route} />;
  }

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
