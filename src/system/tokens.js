// ============================================================
// DESIGN TOKENS — colors, fonts, currency + profile metadata.
// No React. Imported by everything visual.
//
// Theming model — receipt booklet, three skins:
//   light     — original cream paper / warm-black ink
//   carbon    — black paper / cream ink (mobile dark default)
//   midnight  — deep navy paper / warm cream ink (desktop dark default)
//
// Every visual SB.* value is a `var(--sb-*)` reference. The variables
// live on :root (light) and on [data-theme="carbon|midnight"] selectors,
// injected by `ensureThemeCss()` at first import. The active theme is
// chosen by `<html data-theme="…">`, which is set by ThemeProvider on
// the client (and by a no-FOUC inline script in index.html before paint).
// ============================================================

// Color palette per theme. The values feed `ensureThemeCss()`; the rest
// of the app should reference SB.* (which resolves to CSS vars).
export const THEMES = {
  light: {
    cream:      '#f6f1e8',
    creamWarm:  '#efe8da',
    ink:        '#1a1612',
    inkFill:    'rgba(26, 22, 18, 0.95)',
    inkSoft:    'rgba(26,22,18,0.78)',
    inkMute:    'rgba(26,22,18,0.55)',
    inkFaint:   'rgba(26,22,18,0.32)',
    inkLine:    'rgba(26,22,18,0.18)',
    orange:     '#c1690e',
    orangeSoft: 'rgba(193,105,14,0.55)',
    orangeWash: 'rgba(193,105,14,0.08)',
    rust:       '#9c3416',
    rustWash:   'rgba(156,52,22,0.08)',
    forest:     '#2f5d3a',
    forestWash: 'rgba(47,93,58,0.08)',
    stage:      '#0a0a0b',
    grain:      'rgba(0,0,0,0.012)',
    paperShadow: '0 30px 80px rgba(0,0,0,0.55), 0 4px 18px rgba(0,0,0,0.35)',
    spineFold:  'rgba(0,0,0,0.06)',
  },
  carbon: {
    cream:      '#0e0c09',
    creamWarm:  '#181410',
    ink:        '#f0e9d8',
    inkFill:    'rgba(240,233,216,0.95)',
    inkSoft:    'rgba(240,233,216,0.82)',
    inkMute:    'rgba(240,233,216,0.58)',
    inkFaint:   'rgba(240,233,216,0.32)',
    inkLine:    'rgba(240,233,216,0.20)',
    orange:     '#e89244',
    orangeSoft: 'rgba(232,146,68,0.60)',
    orangeWash: 'rgba(232,146,68,0.12)',
    rust:       '#d96a4a',
    rustWash:   'rgba(217,106,74,0.12)',
    forest:     '#7cc28a',
    forestWash: 'rgba(124,194,138,0.12)',
    stage:      '#000000',
    grain:      'rgba(255,255,255,0.018)',
    paperShadow: '0 30px 80px rgba(0,0,0,0.85), 0 4px 18px rgba(0,0,0,0.55), inset 0 0 60px rgba(255,255,255,0.015)',
    spineFold:  'rgba(0,0,0,0.35)',
  },
  midnight: {
    cream:      '#141822',
    creamWarm:  '#1d2230',
    ink:        '#ece5d2',
    inkFill:    'rgba(236,229,210,0.95)',
    inkSoft:    'rgba(236,229,210,0.82)',
    inkMute:    'rgba(236,229,210,0.58)',
    inkFaint:   'rgba(236,229,210,0.32)',
    inkLine:    'rgba(236,229,210,0.18)',
    orange:     '#eb9445',
    orangeSoft: 'rgba(235,148,69,0.60)',
    orangeWash: 'rgba(235,148,69,0.12)',
    rust:       '#e07a5f',
    rustWash:   'rgba(224,122,95,0.12)',
    forest:     '#6ec88f',
    forestWash: 'rgba(110,200,143,0.12)',
    stage:      '#06080d',
    grain:      'rgba(255,255,255,0.018)',
    paperShadow: '0 30px 80px rgba(0,0,0,0.75), 0 4px 18px rgba(0,0,0,0.45), inset 0 0 60px rgba(255,255,255,0.015)',
    spineFold:  'rgba(0,0,0,0.35)',
  },
};

export const THEME_NAMES = Object.keys(THEMES);

// Build a CSS string of variable declarations for a theme.
function vars(t) {
  return Object.entries(t)
    .map(([k, v]) => `  --sb-${k}: ${v};`)
    .join('\n');
}

// Inject the theme stylesheet exactly once. Idempotent.
export function ensureThemeCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('sb-theme-css')) return;
  const s = document.createElement('style');
  s.id = 'sb-theme-css';
  s.textContent = `
:root {
${vars(THEMES.light)}
}
:root[data-theme="carbon"] {
${vars(THEMES.carbon)}
}
:root[data-theme="midnight"] {
${vars(THEMES.midnight)}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
${vars(THEMES.carbon)}
  }
}
html, body { background: var(--sb-stage); }
body { color-scheme: light dark; }
`;
  document.head.appendChild(s);
}

// SB.* — every visual value resolves to a CSS variable so the active
// `data-theme` cascades automatically. Fonts and currency metadata
// are plain strings (they don't change between themes).
export const SB = {
  cream:      'var(--sb-cream)',
  creamWarm:  'var(--sb-creamWarm)',
  ink:        'var(--sb-ink)',
  inkFill:    'var(--sb-inkFill)',
  inkSoft:    'var(--sb-inkSoft)',
  inkMute:    'var(--sb-inkMute)',
  inkFaint:   'var(--sb-inkFaint)',
  inkLine:    'var(--sb-inkLine)',
  orange:     'var(--sb-orange)',
  orangeSoft: 'var(--sb-orangeSoft)',
  orangeWash: 'var(--sb-orangeWash)',
  rust:       'var(--sb-rust)',
  rustWash:   'var(--sb-rustWash)',
  forest:     'var(--sb-forest)',
  forestWash: 'var(--sb-forestWash)',
  stage:      'var(--sb-stage)',
  grain:      'var(--sb-grain)',
  paperShadow:'var(--sb-paperShadow)',
  spineFold:  'var(--sb-spineFold)',

  serif: "'Fraunces', Georgia, serif",
  sans:  "'Geist', system-ui, -apple-system, sans-serif",
  mono:  "'Geist Mono', ui-monospace, 'SF Mono', monospace",
};

// Currency metadata. `taxRate` is the rough capital-gains rate used
// for the tax-aware sell path. `position` controls symbol placement.
// `minLoan` / `maxLoan` bound the input range per currency.
export const CURRENCY_META = {
  SAT: { symbol: 'sats', label: 'SAT', position: 'post', region: 'global', taxRate: 0,  fxToUsd: null,  minLoan: 1_000_000, maxLoan: 5_000_000_000 },
  USD: { symbol: '$',    label: 'USD', position: 'pre',  region: 'us',     taxRate: 20, fxToUsd: 1.0,    minLoan: 1000,      maxLoan: 5_000_000 },
  EUR: { symbol: '€',    label: 'EUR', position: 'pre',  region: 'eu',     taxRate: 26, fxToUsd: 1.08,   minLoan: 1000,      maxLoan: 4_600_000 },
  GBP: { symbol: '£',    label: 'GBP', position: 'pre',  region: 'uk',     taxRate: 20, fxToUsd: 1.27,   minLoan: 800,       maxLoan: 3_900_000 },
  CAD: { symbol: 'C$',   label: 'CAD', position: 'pre',  region: 'ca',     taxRate: 25, fxToUsd: 0.73,   minLoan: 1000,      maxLoan: 6_800_000 },
  AUD: { symbol: 'A$',   label: 'AUD', position: 'pre',  region: 'au',     taxRate: 22, fxToUsd: 0.66,   minLoan: 1500,      maxLoan: 7_500_000 },
  JPY: { symbol: '¥',    label: 'JPY', position: 'pre',  region: 'jp',     taxRate: 20, fxToUsd: 0.0067, minLoan: 100_000,   maxLoan: 750_000_000 },
  CHF: { symbol: 'Fr',   label: 'CHF', position: 'pre',  region: 'ch',     taxRate: 0,  fxToUsd: 1.13,   minLoan: 900,       maxLoan: 4_400_000 },
  SEK: { symbol: 'kr',   label: 'SEK', position: 'post', region: 'eu',     taxRate: 30, fxToUsd: 0.094,  minLoan: 10_000,    maxLoan: 53_000_000 },
};

// Step sizes per currency for the loan-amount slider.
export const CURRENCY_STEP = {
  USD: 1000, EUR: 1000, GBP: 1000, CAD: 1000, AUD: 1000, CHF: 1000,
  SEK: 10_000, JPY: 100_000, SAT: 1_000_000,
};

// CAGR projections for each "auditor." Bear/Base/Bull, all editable.
export const DEFAULT_PROFILES = {
  saylor: {
    name: 'M. SAYLOR',
    persona: 'Maximalist',
    blurb: "Sees BTC as the apex monetary good. Long-term ~$13M target by 2045.",
    initials: 'MS',
    cases: { bear: 15, base: 29, bull: 50 },
  },
  wood: {
    name: 'C. WOOD',
    persona: 'Disruptor',
    blurb: "ARK's published bull case ~$2.4M by 2030; base ~$1.5M; bear ~$700K.",
    initials: 'CW',
    cases: { bear: 25, base: 40, bull: 65 },
  },
  schiff: {
    name: 'P. SCHIFF',
    persona: 'Permabear',
    blurb: "Has called BTC zero for over a decade. His 'bull case' is barely surviving.",
    initials: 'PS',
    cases: { bear: -20, base: -8, bull: 0 },
  },
};

// Fixed system constants.
export const LTV_PCT = 50;
export const LIQ_LTV_PCT = 80;
export const TERM_MONTHS = 12;
