import React, { useState, useMemo, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";

// ============================================================
// CONFIG
// ============================================================

const SATS_PER_BTC = 100_000_000;
const FALLBACK_BTC_USD = 81000;
const THIN_SPACE = "\u202F"; // narrow no-break space, used as thousands separator

const FALLBACK_FX_TO_USD = {
  USD: 1.0, EUR: 1.08, GBP: 1.27, CAD: 0.73,
  AUD: 0.66, JPY: 0.0067, CHF: 1.13, SEK: 0.094,
};

const CURRENCY_META = {
  SAT: { symbol: "sats", label: "SAT", region: "global", taxRate: 0 },
  USD: { symbol: "$", label: "USD", region: "us", taxRate: 20 },
  EUR: { symbol: "€", label: "EUR", region: "eu", taxRate: 26 },
  GBP: { symbol: "£", label: "GBP", region: "uk", taxRate: 20 },
  CAD: { symbol: "C$", label: "CAD", region: "ca", taxRate: 25 },
  AUD: { symbol: "A$", label: "AUD", region: "au", taxRate: 22 },
  JPY: { symbol: "¥", label: "JPY", region: "jp", taxRate: 20 },
  CHF: { symbol: "Fr", label: "CHF", region: "ch", taxRate: 0 },
  SEK: { symbol: "kr", label: "SEK", region: "eu", taxRate: 30 },
};

// Each profile has bear/base/bull CAGRs — all editable
const DEFAULT_PROFILES = {
  saylor: {
    name: "Michael Saylor",
    persona: "Maximalist",
    blurb: "Sees BTC as the apex monetary good. Long-term ~$13M target by 2045.",
    cases: { bear: 15, base: 29, bull: 50 },
    color: "#f7931a",
    emoji: "🟧",
  },
  wood: {
    name: "Cathie Wood",
    persona: "Disruptive-tech bull",
    blurb: "ARK's published bull case ~$2.4M by 2030, base ~$1.5M, bear ~$700K.",
    cases: { bear: 25, base: 40, bull: 65 },
    color: "#22d3ee",
    emoji: "🚀",
  },
  schiff: {
    name: "Peter Schiff",
    persona: "Permabear",
    blurb: "Has called BTC zero for over a decade. His 'bull case' is barely surviving.",
    cases: { bear: -20, base: -8, bull: 0 },
    color: "#94a3b8",
    emoji: "🥶",
  },
};

// LENDERS are fetched from /lenders.json at runtime (see useLenders hook below).
// To update rates: edit public/lenders.json, no code change needed.

// ============================================================
// BITCOIN SVG LOGO (Wikipedia public domain)
// ============================================================

const BitcoinLogo = ({ size = 40 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width={size}
    height={size}
    style={{ display: "block" }}
  >
    <circle cx="32" cy="32" r="32" fill="#f7931a" />
    <path
      fill="#fff"
      d="M46.103 27.444c.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-.875-1.4 5.616c-.923-.23-1.871-.447-2.813-.662l1.41-5.653-3.51-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.679 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117-.117-.029-.242-.061-.371-.092l-2.296 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.019 4.569 1.139c.85.213 1.683.436 2.502.646l-1.453 5.835 3.508.875 1.439-5.772c.958.26 1.888.5 2.798.726l-1.434 5.745 3.511.875 1.453-5.823c5.987 1.133 10.489.676 12.384-4.739 1.527-4.36-.076-6.875-3.226-8.515 2.294-.529 4.022-2.038 4.483-5.155zm-8.022 11.249c-1.085 4.36-8.426 2.003-10.806 1.412l1.928-7.729c2.38.594 10.012 1.77 8.878 6.317zm1.086-11.312c-.99 3.966-7.1 1.951-9.082 1.457l1.748-7.01c1.982.494 8.365 1.416 7.334 5.553z"
    />
  </svg>
);

// ============================================================
// STYLES
// ============================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .bcalc { 
    background: #0a0a0b; 
    color: #fff; 
    min-height: 100vh; 
    font-family: 'Geist', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .bcalc-wrap { max-width: 28rem; margin: 0 auto; padding: 1.5rem 1rem 8rem; }
  .bcalc * { box-sizing: border-box; }

  .display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
  .mono { font-family: 'Geist Mono', ui-monospace, 'SF Mono', monospace; font-variant-numeric: tabular-nums; }

  .card {
    border-radius: 1rem;
    border: 1px solid rgba(255,255,255,0.1);
    background: #141417;
  }

  /* HEADER */
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
  .logo-row { display: flex; align-items: center; gap: 0.625rem; }
  .logo-icon-wrap {
    width: 2.5rem; height: 2.5rem;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(247, 147, 26, 0.25);
  }
  .logo-title { font-family: 'Fraunces', serif; font-size: 1.125rem; font-weight: 600; line-height: 1; letter-spacing: -0.01em; }
  .logo-subtitle { font-size: 0.625rem; color: rgba(255,255,255,0.45); margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.15em; }

  /* TICKER */
  .ticker {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1rem;
    padding: 0.625rem 1rem;
    border-radius: 0.75rem;
    background: #141417;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .ticker-status { display: flex; align-items: center; gap: 0.5rem; }
  .status-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; }
  .status-dot.live { background: #34d399; animation: pulse-dot 2s ease-in-out infinite; }
  .status-dot.loading { background: #fbbf24; }
  .status-dot.error { background: #f87171; }
  .ticker-label { font-size: 0.6875rem; color: rgba(255,255,255,0.6); }
  .ticker-price { display: flex; align-items: baseline; gap: 0.5rem; }
  .ticker-tag { font-size: 0.6875rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500; }
  .ticker-value { font-family: 'Geist Mono', monospace; font-size: 1rem; font-weight: 600; font-variant-numeric: tabular-nums; }
  .ticker-refresh {
    background: none; border: none; color: rgba(255,255,255,0.45);
    cursor: pointer; font-size: 1rem;
    transition: color 150ms;
  }
  .ticker-refresh:hover { color: #f7931a; }

  /* INPUTS */
  .section-label {
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-weight: 500;
  }
  .input-stack { display: flex; flex-direction: column; gap: 1.25rem; }
  .input-row { width: 100%; }
  .input-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; }
  .input-label { font-size: 0.875rem; color: rgba(255,255,255,0.8); }
  .input-meta { font-family: 'Geist Mono', monospace; font-size: 0.6875rem; color: rgba(255,255,255,0.55); }
  .input-value-orange { font-family: 'Geist Mono', monospace; font-size: 1rem; color: #f7931a; font-weight: 600; font-variant-numeric: tabular-nums; }

  .num-input {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.625rem 0.75rem;
    border-radius: 0.75rem;
    background: #0a0a0b;
    border: 1px solid rgba(255,255,255,0.15);
    transition: border-color 150ms;
  }
  .num-input:focus-within { border-color: rgba(247, 147, 26, 0.6); }
  .num-input input {
    background: transparent; border: none; outline: none;
    width: 100%;
    color: #fff;
    font-family: 'Geist Mono', monospace;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
  }
  .num-input input::-webkit-inner-spin-button,
  .num-input input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .num-input input { -moz-appearance: textfield; }
  .num-input-suffix { color: rgba(255,255,255,0.5); font-size: 0.75rem; }

  /* SLIDER */
  .slider {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 6px;
    border-radius: 3px;
    background: rgba(255,255,255,0.1);
    outline: none; cursor: pointer;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--thumb, #f7931a);
    cursor: pointer;
    box-shadow: 0 0 0 4px rgba(247, 147, 26, 0.2), 0 2px 6px rgba(0,0,0,0.4);
    border: 2px solid #1a1a1c;
    transition: box-shadow 150ms;
  }
  .slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 6px rgba(247, 147, 26, 0.3), 0 2px 6px rgba(0,0,0,0.4);
  }
  .slider::-moz-range-thumb {
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--thumb, #f7931a);
    cursor: pointer;
    border: 2px solid #1a1a1c;
  }
  .slider-scale { display: flex; justify-content: space-between; font-size: 0.625rem; color: rgba(255,255,255,0.4); margin-top: 0.375rem; font-family: 'Geist Mono', monospace; }

  /* TERM CHIPS */
  .term-row { display: flex; gap: 0.375rem; }
  .term-chip {
    flex: 1; padding: 0.625rem 0;
    border-radius: 0.5rem;
    font-family: 'Geist Mono', monospace;
    font-size: 0.75rem;
    background: #0a0a0b;
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    transition: all 150ms;
  }
  .term-chip:hover { border-color: rgba(255,255,255,0.3); }
  .term-chip.active {
    background: rgba(247, 147, 26, 0.2);
    border-color: rgba(247, 147, 26, 0.6);
    color: #f7931a;
  }

  /* HEADLINE */
  .headline-card { padding: 1.5rem; position: relative; overflow: hidden; }
  .headline-eyebrow {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.5);
    font-weight: 500;
    margin-bottom: 0.75rem;
  }
  .headline-glow { position: relative; display: inline-block; }
  .headline-glow::before {
    content: '';
    position: absolute;
    inset: -50% -20%;
    background: radial-gradient(ellipse at center, rgba(247, 147, 26, 0.2), transparent 65%);
    z-index: 0; pointer-events: none;
  }
  .headline-glow > * { position: relative; z-index: 1; }
  .headline-keep {
    font-family: 'Fraunces', serif;
    font-size: 2rem; line-height: 1.05;
    letter-spacing: -0.015em;
    color: #fff; font-weight: 500;
  }
  .headline-amount {
    font-family: 'Fraunces', serif;
    font-size: 2.5rem; line-height: 1.05;
    letter-spacing: -0.015em;
    color: #f7931a; font-weight: 600;
    margin-top: 0.25rem;
  }
  .headline-detail {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.7);
    margin-top: 1rem;
    line-height: 1.5;
  }
  .headline-detail .muted { color: rgba(255,255,255,0.5); }
  .headline-detail .bright { font-family: 'Geist Mono', monospace; color: #00ff66; font-weight: 500; }
  .headline-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem; margin-top: 1.25rem; padding-top: 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .headline-cell-label {
    font-size: 0.625rem; text-transform: uppercase;
    letter-spacing: 0.1em; color: rgba(255,255,255,0.5);
  }
  .headline-cell-value {
    font-family: 'Geist Mono', monospace; font-size: 0.875rem;
    margin-top: 0.25rem; font-variant-numeric: tabular-nums;
  }
  .text-emerald { color: #6ee7b7; }
  .text-red { color: #fca5a5; }

  /* HEADS-UP */
  .headsup {
    border-radius: 0.75rem; border: 1px solid;
    padding: 0.75rem; display: flex; gap: 0.75rem;
  }
  .headsup-icon { font-family: 'Geist Mono', monospace; font-size: 1rem; line-height: 1; margin-top: 0.125rem; }
  .headsup-title { font-size: 0.75rem; font-weight: 600; }
  .headsup-detail { font-size: 0.6875rem; opacity: 0.9; margin-top: 0.125rem; line-height: 1.4; }
  .tone-info { border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.08); color: #bae6fd; }
  .tone-warning { border-color: rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.08); color: #fef3c7; }
  .tone-danger { border-color: rgba(248, 113, 113, 0.4); background: rgba(248, 113, 113, 0.08); color: #fecaca; }
  .tone-good { border-color: rgba(110, 231, 183, 0.4); background: rgba(110, 231, 183, 0.08); color: #a7f3d0; }

  /* PROFILES */
  .profiles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.75rem; }
  .profile-btn {
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(255,255,255,0.1);
    background: #0a0a0b;
    text-align: left;
    cursor: pointer;
    transition: all 150ms;
    font-family: inherit; color: inherit;
  }
  .profile-btn:hover { border-color: rgba(255,255,255,0.25); }
  .profile-btn.active {
    border-color: rgba(247, 147, 26, 0.5);
    background: rgba(247, 147, 26, 0.1);
  }
  .profile-emoji { font-size: 1.25rem; margin-bottom: 0.25rem; }
  .profile-name { font-size: 0.6875rem; font-weight: 500; line-height: 1.2; }
  .profile-persona { font-size: 0.625rem; color: rgba(255,255,255,0.5); margin-top: 0.125rem; }
  .profile-cagr { font-family: 'Geist Mono', monospace; font-size: 0.75rem; margin-top: 0.5rem; font-weight: 600; font-variant-numeric: tabular-nums; }
  .profile-blurb { font-size: 0.75rem; color: rgba(255,255,255,0.6); font-style: italic; line-height: 1.5; }
  .profile-edit-link {
    display: inline-block; margin-top: 0.75rem;
    background: none; border: none; cursor: pointer; padding: 0;
    font-size: 0.6875rem; color: #f7931a;
    text-decoration: underline; text-underline-offset: 2px;
    transition: color 150ms; font-family: inherit;
  }
  .profile-edit-link:hover { color: #ffb04a; }

  /* CASE PICKER */
  .case-picker {
    display: flex; gap: 0.25rem; margin-bottom: 1rem;
    padding: 0.25rem; border-radius: 0.5rem;
    background: #0a0a0b;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .case-pill {
    flex: 1; padding: 0.375rem 0;
    border: none; background: transparent;
    border-radius: 0.375rem; cursor: pointer;
    font-family: 'Geist Mono', monospace;
    font-size: 0.6875rem; color: rgba(255,255,255,0.6);
    text-transform: uppercase; letter-spacing: 0.05em;
    transition: all 150ms;
  }
  .case-pill:hover { color: rgba(255,255,255,0.9); }
  .case-pill.active {
    background: rgba(247, 147, 26, 0.15);
    color: #f7931a;
  }
  .case-pill.bear.active { background: rgba(248, 113, 113, 0.12); color: #fca5a5; }
  .case-pill.bull.active { background: rgba(110, 231, 183, 0.12); color: #6ee7b7; }

  /* CHART */
  .chart-wrap { height: 14rem; }
  .chart-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.625rem; }
  .legend-item { display: flex; align-items: center; gap: 0.375rem; color: rgba(255,255,255,0.7); }
  .legend-line { width: 12px; height: 2px; border-radius: 1px; }
  .legend-dashed { width: 12px; border-top: 1.5px dashed rgba(255,255,255,0.6); }

  /* METRICS GRID */
  .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; }
  .metric-card { border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.1); background: #141417; padding: 0.875rem; }
  .metric-card.warn { border-color: rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.05); }
  .metric-label { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); margin-bottom: 0.25rem; }
  .metric-value { font-family: 'Geist Mono', monospace; font-size: 0.875rem; font-weight: 600; color: #fff; font-variant-numeric: tabular-nums; }
  .metric-sub { font-size: 0.625rem; color: rgba(255,255,255,0.5); font-family: 'Geist Mono', monospace; margin-top: 0.125rem; }

  /* LENDER */
  .lender-cta {
    width: 100%; padding: 1rem;
    border-radius: 1rem;
    border: 1px solid rgba(247, 147, 26, 0.4);
    background: linear-gradient(135deg, rgba(247, 147, 26, 0.1), transparent);
    cursor: pointer; margin-bottom: 1rem;
    transition: background 150ms;
    font-family: inherit; color: inherit;
  }
  .lender-cta:hover { background: linear-gradient(135deg, rgba(247, 147, 26, 0.15), transparent); }
  .lender-cta-row { display: flex; align-items: center; justify-content: space-between; }
  .lender-cta-title { font-size: 0.875rem; font-weight: 500; color: #fff; text-align: left; }
  .lender-cta-sub { font-size: 0.6875rem; color: rgba(255,255,255,0.6); margin-top: 0.125rem; text-align: left; }
  .lender-cta-arrow { color: #f7931a; font-size: 1.125rem; transition: transform 200ms; }
  .lender-cta-arrow.open { transform: rotate(180deg); }

  .lender-card-body { padding: 1rem; }
  .lender-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.5rem; }
  .lender-rank { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-family: 'Geist Mono', monospace; }
  .lender-name { font-family: 'Fraunces', serif; font-size: 1.125rem; font-weight: 600; line-height: 1; }
  .lender-term { font-size: 0.6875rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem; }
  .lender-apr { font-family: 'Geist Mono', monospace; font-size: 1rem; font-weight: 600; color: #f7931a; font-variant-numeric: tabular-nums; }
  .lender-apr-label { font-size: 0.625rem; color: rgba(255,255,255,0.5); }
  .pill-row { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.625rem; }
  .pill {
    display: inline-flex; align-items: center; gap: 0.25rem;
    padding: 0.125rem 0.5rem; border-radius: 9999px;
    font-size: 0.6875rem; font-weight: 500;
    border: 1px solid;
  }
  .pill-neutral { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.15); }
  .pill-orange { background: rgba(247, 147, 26, 0.15); color: #f7931a; border-color: rgba(247, 147, 26, 0.4); }
  .pill-warning { background: rgba(251, 191, 36, 0.15); color: #fde68a; border-color: rgba(251, 191, 36, 0.4); }
  .pill-good { background: rgba(110, 231, 183, 0.15); color: #6ee7b7; border-color: rgba(110, 231, 183, 0.4); }
  .lender-actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
  .lender-toggle { background: none; border: none; padding: 0; font-size: 0.6875rem; color: rgba(255,255,255,0.6); cursor: pointer; transition: color 150ms; font-family: inherit; }
  .lender-toggle:hover { color: #fff; }
  .lender-link { font-size: 0.6875rem; color: #f7931a; text-decoration: none; margin-left: auto; transition: color 150ms; }
  .lender-link:hover { color: #ffb04a; }
  .lender-detail { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); }
  .lender-detail-item { margin-bottom: 0.625rem; }
  .lender-detail-label { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); }
  .lender-detail-value { font-size: 0.75rem; color: rgba(255,255,255,0.8); line-height: 1.4; margin-top: 0.125rem; }

  /* CURRENCY PICKER */
  .picker-wrap { position: relative; }
  .picker-button {
    display: flex; align-items: center; gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    background: #141417;
    border: 1px solid rgba(255,255,255,0.15);
    font-size: 0.75rem; cursor: pointer;
    transition: border-color 150ms;
    color: #fff; font-family: inherit;
  }
  .picker-button:hover { border-color: rgba(247, 147, 26, 0.5); }
  .picker-currency { font-family: 'Geist Mono', monospace; font-weight: 600; letter-spacing: 0.02em; }
  .picker-caret { color: rgba(255,255,255,0.5); font-size: 0.625rem; }
  .picker-menu {
    position: absolute; right: 0; top: calc(100% + 0.5rem);
    background: #141417;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 0.75rem;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    overflow: hidden; z-index: 20;
    min-width: 6rem;
  }
  .picker-item {
    display: flex; align-items: center;
    width: 100%; padding: 0.5rem 0.875rem;
    background: none; border: none;
    font-size: 0.75rem; color: rgba(255,255,255,0.85);
    cursor: pointer; text-align: left;
    font-family: 'Geist Mono', monospace;
    font-weight: 600; letter-spacing: 0.02em;
    transition: background 150ms;
  }
  .picker-item:hover { background: rgba(255,255,255,0.05); }
  .picker-item.active { background: rgba(247, 147, 26, 0.15); color: #f7931a; }

  /* MODAL */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 50;
    display: grid; place-items: center;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(4px); padding: 1rem;
  }
  .modal {
    width: 100%; max-width: 24rem;
    border-radius: 1rem;
    border: 1px solid rgba(255,255,255,0.15);
    background: #141417; padding: 1.5rem;
    max-height: 90vh; overflow-y: auto;
  }
  .modal-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
  .modal-emoji { font-size: 1.875rem; }
  .modal-title { font-family: 'Fraunces', serif; font-size: 1.25rem; font-weight: 600; }
  .modal-persona { font-size: 0.75rem; color: rgba(255,255,255,0.6); }
  .modal-blurb { font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-bottom: 1rem; font-style: italic; line-height: 1.5; }
  .modal-projection { font-size: 0.6875rem; color: rgba(255,255,255,0.5); margin-bottom: 1rem; line-height: 1.5; }
  .modal-projection .mono { color: rgba(255,255,255,0.8); }
  .modal-actions { display: flex; gap: 0.5rem; }
  .btn {
    flex: 1; padding: 0.625rem 1rem;
    border-radius: 0.75rem; cursor: pointer;
    font-size: 0.75rem; font-weight: 500;
    transition: all 150ms; font-family: inherit;
  }
  .btn-secondary {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.7);
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.05); }
  .btn-primary {
    background: #f7931a;
    border: 1px solid #f7931a;
    color: #000; font-weight: 600;
  }
  .btn-primary:hover { background: #e8870e; }
  .case-edit { margin-bottom: 1rem; }
  .case-edit-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.375rem; }
  .case-edit-label { font-size: 0.75rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; }
  .case-edit-value { font-family: 'Geist Mono', monospace; font-size: 0.875rem; font-weight: 600; font-variant-numeric: tabular-nums; }

  /* TAX */
  .tax-toggle { display: flex; justify-content: space-between; align-items: center; width: 100%; background: none; border: none; padding: 0; cursor: pointer; color: inherit; font-family: inherit; }
  .tax-detail { margin-top: 0.75rem; }
  .tax-meta-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.625rem; margin-top: 0.5rem; }
  .tax-meta-row .muted { color: rgba(255,255,255,0.5); }
  .tax-reset {
    background: none; border: none; cursor: pointer;
    color: #f7931a; text-decoration: underline; text-underline-offset: 2px;
    font-family: inherit; font-size: inherit;
  }
  .tax-reset:hover { color: #ffb04a; }
  .tax-help { font-size: 0.625rem; color: rgba(255,255,255,0.45); line-height: 1.5; margin-top: 0.5rem; }

  /* FOOTER */
  .footer { font-size: 0.625rem; color: rgba(255,255,255,0.4); text-align: center; line-height: 1.6; margin-top: 3rem; margin-bottom: 1.5rem; }
  .footer-row { margin-bottom: 0.5rem; }
  .footer .mono { color: rgba(255,255,255,0.6); }
  .footer-disclaimer { color: rgba(255,255,255,0.35); }
  .footer-tiny { color: rgba(255,255,255,0.3); }

  /* EMPTY */
  .empty {
    text-align: center; padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(255,255,255,0.1);
    background: #141417;
  }
  .empty-emoji { font-size: 1.875rem; margin-bottom: 0.5rem; }
  .empty-title { font-size: 0.875rem; color: rgba(255,255,255,0.8); }
  .empty-detail { font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 0.5rem; }

  .p-5 { padding: 1.25rem; }
  .mb-3 { margin-bottom: 0.75rem; }
  .mb-4 { margin-bottom: 1rem; }
  .stack-3 > * + * { margin-top: 0.75rem; }
  .stack-2 > * + * { margin-top: 0.5rem; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .anim-in { animation: fadeInUp 400ms ease-out backwards; }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

// ============================================================
// HELPERS
// ============================================================

// Format a number with thin-space thousands separator (Swedish/European style)
const fmtNum = (n) => {
  if (n == null || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  // Insert THIN_SPACE every 3 digits from the right
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
  return sign + s;
};

const fmtSats = (sats) => {
  if (sats == null || isNaN(sats)) return "—";
  if (Math.abs(sats) >= 1e8) return `${(sats / 1e8).toFixed(4)} BTC`;
  return `${fmtNum(sats)} sats`;
};

const fmtFiat = (amount, currency) => {
  if (amount == null || isNaN(amount)) return "—";
  const meta = CURRENCY_META[currency];
  if (!meta) return amount.toFixed(2);
  if (currency === "SAT") return fmtSats(amount);
  if (currency === "JPY") return `${meta.symbol}${fmtNum(amount)}`;
  if (currency === "SEK") return `${fmtNum(amount)} ${meta.symbol}`;
  return `${meta.symbol}${fmtNum(amount)}`;
};

const computeInterest = (principalUsd, aprPct, termMonths) =>
  principalUsd * (aprPct / 100) * (termMonths / 12);

const projectBtcPrice = (currentPrice, cagrPct, years) =>
  currentPrice * Math.pow(1 + cagrPct / 100, years);

const computeLiquidationPrice = (loanUsd, collateralBtc, liqLtvPct = 80) =>
  loanUsd / (collateralBtc * (liqLtvPct / 100));

// ============================================================
// HOOKS
// ============================================================

function useLivePrices() {
  const [data, setData] = useState({
    btcUsd: FALLBACK_BTC_USD,
    fxToUsd: FALLBACK_FX_TO_USD,
    source: "fallback", loading: true, updatedAt: null, error: null,
  });

  const fetchPrices = useCallback(async () => {
    setData((d) => ({ ...d, loading: true }));
    try {
      const res = await fetch("https://mempool.space/api/v1/prices");
      if (!res.ok) throw new Error("mempool fetch failed");
      const j = await res.json();
      const fx = {
        USD: 1.0,
        EUR: j.EUR ? j.USD / j.EUR : FALLBACK_FX_TO_USD.EUR,
        GBP: j.GBP ? j.USD / j.GBP : FALLBACK_FX_TO_USD.GBP,
        CAD: j.CAD ? j.USD / j.CAD : FALLBACK_FX_TO_USD.CAD,
        AUD: j.AUD ? j.USD / j.AUD : FALLBACK_FX_TO_USD.AUD,
        JPY: j.JPY ? j.USD / j.JPY : FALLBACK_FX_TO_USD.JPY,
        CHF: j.CHF ? j.USD / j.CHF : FALLBACK_FX_TO_USD.CHF,
        SEK: j.EUR ? (j.USD / j.EUR) / 11.3 : FALLBACK_FX_TO_USD.SEK,
      };
      setData({
        btcUsd: j.USD, fxToUsd: fx, source: "mempool.space",
        loading: false, updatedAt: new Date(j.time * 1000), error: null,
      });
      return;
    } catch (e) {
      try {
        const res = await fetch("https://api.utxoracle.io/latest.json");
        if (!res.ok) throw new Error("utxoracle failed");
        const j = await res.json();
        setData((prev) => ({
          ...prev, btcUsd: j.price, source: "utxoracle.io",
          loading: false, updatedAt: new Date(j.updated_at), error: "FX rates approximate",
        }));
        return;
      } catch (e2) {
        setData((prev) => ({ ...prev, loading: false, error: "Using fallback prices" }));
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

function usePersistentState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    // Read from localStorage on initial render (synchronous, avoids flash)
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = window.localStorage.getItem(`stackandborrow:${key}`);
      if (stored !== null) return JSON.parse(stored);
    } catch (e) { /* fallback to default */ }
    return defaultValue;
  });

  const setAndPersist = useCallback((next) => {
    setValue((prev) => {
      const newValue = typeof next === "function" ? next(prev) : next;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`stackandborrow:${key}`, JSON.stringify(newValue));
        }
      } catch (e) { /* storage full or disabled, ignore */ }
      return newValue;
    });
  }, [key]);

  return [value, setAndPersist];
}

// Fetch lender data from a JSON file (so you can update rates without code changes)
function useLenders() {
  const [lenders, setLenders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetch("/lenders.json")
      .then((r) => r.json())
      .then((data) => {
        setLenders(data.lenders || []);
        setLastUpdated(data.lastUpdated || null);
      })
      .catch((e) => {
        console.warn("Could not load lenders.json:", e);
        setLenders([]);
      });
  }, []);

  return { lenders, lastUpdated };
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const live = useLivePrices();
  const { lenders: LENDERS, lastUpdated: lendersLastUpdated } = useLenders();
  const BTC_SPOT_USD = live.btcUsd;

  // ===== INPUT STATE =====
  // Loan-first flow: user enters DESIRED LOAN AMOUNT in their currency.
  // Default 50,000 SEK ≈ $4,700 — a meaningful amount for actual borrowing.
  const [currency, setCurrency] = usePersistentState("currency", "SEK");
  const [desiredLoanInCurrency, setDesiredLoanInCurrency] = usePersistentState("desiredLoan", 50000);
  const [ltvPct, setLtvPct] = usePersistentState("ltvPct", 40);
  const [aprPct, setAprPct] = usePersistentState("aprPct", 10);
  const [termMonths, setTermMonths] = usePersistentState("termMonths", 12);
  const [activeProfile, setActiveProfile] = usePersistentState("activeProfile", "saylor");
  const [activeCase, setActiveCase] = usePersistentState("activeCase", "base");
  const [profiles, setProfiles] = usePersistentState("profiles", DEFAULT_PROFILES);
  const [taxRate, setTaxRate] = usePersistentState("taxRate", null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showLenders, setShowLenders] = useState(false);

  const effectiveTaxRate = taxRate ?? CURRENCY_META[currency].taxRate;

  const usdToCurrency = useCallback((usd, c = currency) => {
    if (c === "SAT") return (usd / BTC_SPOT_USD) * SATS_PER_BTC;
    return usd / live.fxToUsd[c];
  }, [BTC_SPOT_USD, live.fxToUsd, currency]);

  const currencyToUsd = useCallback((amount, c = currency) => {
    if (c === "SAT") return (amount / SATS_PER_BTC) * BTC_SPOT_USD;
    return amount * live.fxToUsd[c];
  }, [BTC_SPOT_USD, live.fxToUsd, currency]);

  const fiatCurrency = currency === "SAT" ? "USD" : currency;
  const fmtFiatOutput = useCallback((usd) => {
    if (fiatCurrency === "USD") return fmtFiat(usd, "USD");
    return fmtFiat(usd / live.fxToUsd[fiatCurrency], fiatCurrency);
  }, [fiatCurrency, live.fxToUsd]);

  // ===== DERIVED VALUES (loan-first) =====
  // The user has stated how much they want to borrow.
  // We compute the collateral they'd need at the chosen LTV.
  const loanUsd = currencyToUsd(desiredLoanInCurrency);
  const collateralUsdNeeded = ltvPct > 0 ? loanUsd / (ltvPct / 100) : 0;
  const collateralBtcNeeded = collateralUsdNeeded / BTC_SPOT_USD;
  const collateralSatsNeeded = Math.round(collateralBtcNeeded * SATS_PER_BTC);

  const interestUsd = computeInterest(loanUsd, aprPct, termMonths);
  const totalOwedUsd = loanUsd + interestUsd;
  const liquidationUsd = collateralBtcNeeded > 0 ? computeLiquidationPrice(loanUsd, collateralBtcNeeded) : 0;
  const liquidationDropPct = ((BTC_SPOT_USD - liquidationUsd) / BTC_SPOT_USD) * 100;
  const termYears = termMonths / 12;

  // Active profile + active case = the CAGR being used
  const activeCagr = profiles[activeProfile].cases[activeCase];
  const futureBtcPrice = projectBtcPrice(BTC_SPOT_USD, activeCagr, termYears);

  // ===== TAX-AWARE SELL PATH =====
  // To NET `loanUsd` cash, you must sell enough BTC to cover loan + capital gains tax.
  // gross_sale = loanUsd / (1 - taxRate)
  const taxMultiplier = 1 - effectiveTaxRate / 100;
  const grossSaleNeededUsd = taxMultiplier > 0 ? loanUsd / taxMultiplier : loanUsd;
  const taxOwedOnSaleUsd = grossSaleNeededUsd - loanUsd;
  const satsToSell = (grossSaleNeededUsd / BTC_SPOT_USD) * SATS_PER_BTC;

  // Future value: if user borrows, all their collateral keeps appreciating.
  // If user sells, only the part they DIDN'T sell appreciates.
  const futureCollateralValueUsd = collateralBtcNeeded * futureBtcPrice;
  const borrowPathFutureNetUsd = futureCollateralValueUsd - totalOwedUsd;

  // Sell path: future value = collateral remaining after sale, times future price.
  const collateralBtcRemainingAfterSell = Math.max(0, collateralBtcNeeded - grossSaleNeededUsd / BTC_SPOT_USD);
  const sellPathFutureBtcValueUsd = collateralBtcRemainingAfterSell * futureBtcPrice;

  // HEADLINE: "you keep N sats" = the sats you'd have sold (incl. tax) if you weren't borrowing
  const satsKept = satsToSell;
  const satsKeptFutureValueUsd = (satsKept / SATS_PER_BTC) * futureBtcPrice;
  const advantageUsd = borrowPathFutureNetUsd - sellPathFutureBtcValueUsd;

  // ===== HEADS-UPS =====
  const headsUps = [];
  if (ltvPct >= 60) {
    headsUps.push({ tone: "danger", icon: "⚠", title: "High LTV — liquidation risk", detail: `BTC only needs to drop ${liquidationDropPct.toFixed(0)}% before liquidation. Historical drawdowns of 30–50% are normal.` });
  } else if (ltvPct >= 50) {
    headsUps.push({ tone: "warning", icon: "▲", title: "Elevated LTV", detail: `Liquidation triggers if BTC drops ~${liquidationDropPct.toFixed(0)}%. Many bitcoiners stay under 40% for buffer.` });
  }
  if (termMonths < 18) {
    headsUps.push({ tone: "info", icon: "↻", title: "Term shorter than typical bull cycle", detail: `${termMonths} months may end before BTC's next cycle peak (~4yr cycle). Check rollover terms.` });
  }
  // Bear-case test using the schiff bear case as the harshest assumption
  const harshBearCagr = profiles.schiff.cases.bear;
  const bearFuturePrice = projectBtcPrice(BTC_SPOT_USD, harshBearCagr, termYears);
  const bearCollateralChangeUsd = (bearFuturePrice - BTC_SPOT_USD) * collateralBtcNeeded;
  if (interestUsd > Math.max(0, bearCollateralChangeUsd) && interestUsd > 0 && bearCollateralChangeUsd <= 0) {
    headsUps.push({ tone: "warning", icon: "◯", title: "Bear case: interest exceeds appreciation", detail: `In a flat-to-down scenario, you'd pay ${fmtFiatOutput(interestUsd)} in interest while collateral stagnates or falls.` });
  }
  if (aprPct >= 14) {
    headsUps.push({ tone: "warning", icon: "%", title: "High APR — verify it beats selling", detail: `At ${aprPct}% APR, the borrow path only wins if BTC outpaces the rate.` });
  }
  if (advantageUsd < 0 && activeCagr >= 0) {
    headsUps.push({ tone: "warning", icon: "✕", title: "Selling may be cheaper here", detail: "Under your current parameters, borrowing costs more than selling — even with tax. Try lowering APR, LTV, or shortening term." });
  }

  // ===== CHART DATA =====
  // Show net position over time for each PROFILE'S BASE CASE (so chart is comparing the
  // central forecasts of each thinker, not their bull/bear extremes — that would be noisy).
  // The ACTIVE selection (profile + case) shows as the bold line.
  const chartData = useMemo(() => {
    const points = [];
    for (let m = 0; m <= termMonths; m++) {
      const yrs = m / 12;
      const point = { month: m };
      Object.entries(profiles).forEach(([key, p]) => {
        // For non-active profiles, use base case. For active profile, use the selected case.
        const cagrToUse = key === activeProfile ? p.cases[activeCase] : p.cases.base;
        const price = projectBtcPrice(BTC_SPOT_USD, cagrToUse, yrs);
        const owedAtM = m === 0 ? loanUsd : loanUsd + computeInterest(loanUsd, aprPct, m);
        point[key] = collateralBtcNeeded * price - owedAtM;
      });
      // Sell path uses active profile/case
      const sellPrice = projectBtcPrice(BTC_SPOT_USD, activeCagr, yrs);
      point.sell = collateralBtcRemainingAfterSell * sellPrice;
      points.push(point);
    }
    return points;
  }, [profiles, termMonths, collateralBtcNeeded, loanUsd, aprPct, activeProfile, activeCase, activeCagr, BTC_SPOT_USD, collateralBtcRemainingAfterSell]);

  // ===== LENDERS =====
  const userRegion = CURRENCY_META[currency].region;
  const eligibleLenders = LENDERS.filter((l) => {
    if (l.country.includes("global")) return true;
    if (userRegion === "us" && l.country.includes("us")) return true;
    if (userRegion === "ca" && l.country.includes("ca")) return true;
    if (userRegion === "eu" && l.country.includes("eu")) return true;
    if (userRegion === "ch" && (l.country.includes("ch") || l.country.includes("eu"))) return true;
    return false;
  });

  const rankedLenders = useMemo(() => {
    return [...eligibleLenders]
      .filter((l) => loanUsd >= l.minLoanUsd && ltvPct <= l.maxLtv)
      .map((l) => {
        const midRate = (l.rateRange[0] + l.rateRange[1]) / 2;
        const feeApplies = !l.feeWaivedFor.includes(userRegion);
        const effectiveApr = midRate + (feeApplies ? l.originationFeePct : 0);
        const totalCost = computeInterest(loanUsd, effectiveApr, termMonths);
        return { ...l, effectiveApr, totalCost };
      })
      .sort((a, b) => a.totalCost - b.totalCost)
      .slice(0, 4);
  }, [eligibleLenders, loanUsd, ltvPct, termMonths, userRegion]);

  // For the input field: when SAT is selected currency, it doesn't make sense for "loan amount"
  // (you don't borrow sats — you borrow fiat). So we display USD as the loan unit if user picks SAT.
  const loanInputCurrency = currency === "SAT" ? "USD" : currency;
  const loanInputValue = currency === "SAT"
    ? Math.round(loanUsd)
    : Math.round(desiredLoanInCurrency);

  const onLoanInputChange = (v) => {
    if (currency === "SAT") {
      // Treat input as USD, store the equivalent in our currency state
      setDesiredLoanInCurrency(v);
    } else {
      setDesiredLoanInCurrency(v);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bcalc">
      <style>{STYLES}</style>
      <div className="bcalc-wrap">
        {/* HEADER */}
        <header className="header anim-in" style={{ animationDelay: "0ms" }}>
          <div className="logo-row">
            <div className="logo-icon-wrap"><BitcoinLogo size={40} /></div>
            <div>
              <div className="logo-title">Stack & Borrow</div>
              <div className="logo-subtitle">Keep your sats. Free your cash.</div>
            </div>
          </div>
          <CurrencyPicker currency={currency} setCurrency={setCurrency} />
        </header>

        {/* TICKER */}
        <div className="ticker anim-in" style={{ animationDelay: "30ms" }}>
          <div className="ticker-status">
            <div className={`status-dot ${live.loading ? "loading" : live.error ? "error" : "live"}`} />
            <span className="ticker-label">{live.loading ? "Fetching..." : live.error ? "Offline" : "Live"}</span>
          </div>
          <div className="ticker-price">
            <span className="ticker-tag">BTC</span>
            <span className="ticker-value">{fmtFiat(BTC_SPOT_USD / live.fxToUsd[fiatCurrency], fiatCurrency)}</span>
          </div>
          <button className="ticker-refresh" onClick={live.refresh} title="Refresh">↻</button>
        </div>

        {/* INPUTS */}
        <div className="card p-5 mb-4 anim-in" style={{ animationDelay: "60ms" }}>
          <div className="section-label" style={{ marginBottom: "1rem" }}>Your loan</div>
          <div className="input-stack">

            {/* DESIRED LOAN AMOUNT (the new primary input) */}
            <div className="input-row">
              <div className="input-header">
                <label className="input-label">Loan amount</label>
              </div>
              <NumInput
                value={loanInputValue}
                onChange={onLoanInputChange}
                suffix={CURRENCY_META[loanInputCurrency].label}
              />
            </div>

            {/* LTV */}
            <div className="input-row">
              <div className="input-header">
                <label className="input-label">Loan-to-Value</label>
                <span className="input-value-orange">{ltvPct}%</span>
              </div>
              <input className="slider" type="range" min={10} max={75} step={1} value={ltvPct} onChange={(e) => setLtvPct(parseFloat(e.target.value))} />
              <div className="slider-scale">
                <span>10%</span><span>conservative</span><span>aggressive</span><span>75%</span>
              </div>
            </div>

            {/* APR */}
            <div className="input-row">
              <div className="input-header">
                <label className="input-label">Interest rate (APR)</label>
                <span className="input-value-orange">{aprPct.toFixed(1)}%</span>
              </div>
              <input className="slider" type="range" min={4} max={20} step={0.25} value={aprPct} onChange={(e) => setAprPct(parseFloat(e.target.value))} />
            </div>

            {/* Term */}
            <div className="input-row">
              <div className="input-header">
                <label className="input-label">Term</label>
                <span className="input-value-orange">{termMonths} months</span>
              </div>
              <div className="term-row">
                {[6, 12, 18, 24, 36].map((m) => (
                  <button key={m} onClick={() => setTermMonths(m)} className={`term-chip ${termMonths === m ? "active" : ""}`}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <TaxRateControl currency={currency} taxRate={taxRate} effectiveTaxRate={effectiveTaxRate} setTaxRate={setTaxRate} />
          </div>
        </div>

        {/* HEADLINE */}
        <div className="card headline-card mb-4 anim-in" style={{ animationDelay: "120ms" }}>
          <div className="headline-eyebrow">If you borrow instead of sell</div>
          <div className="headline-glow">
            <div className="headline-keep">You keep</div>
            <div className="headline-amount">{fmtSats(satsKept)}</div>
          </div>
          <div className="headline-detail">
            ...that you'd otherwise sell. <span className="muted">At {profiles[activeProfile].name}'s {activeCase} case ({activeCagr > 0 ? "+" : ""}{activeCagr}% CAGR), those sats are worth </span>
            <span className="bright">{fmtFiatOutput(satsKeptFutureValueUsd)}</span>
            <span className="muted"> in {termMonths} months.</span>
          </div>
          <div className="headline-grid">
            <div>
              <div className="headline-cell-label">Interest</div>
              <div className="headline-cell-value">{fmtFiatOutput(interestUsd)}</div>
            </div>
            <div>
              <div className="headline-cell-label">Tax saved</div>
              <div className="headline-cell-value text-emerald">{fmtFiatOutput(taxOwedOnSaleUsd)}</div>
            </div>
            <div>
              <div className="headline-cell-label">Net edge</div>
              <div className={`headline-cell-value ${advantageUsd > 0 ? "text-emerald" : "text-red"}`} style={{ fontWeight: 600 }}>
                {advantageUsd > 0 ? "+" : ""}{fmtFiatOutput(advantageUsd)}
              </div>
            </div>
          </div>
        </div>

        {/* HEADS-UPS */}
        {headsUps.length > 0 && (
          <div className="stack-2 mb-4 anim-in" style={{ animationDelay: "180ms" }}>
            {headsUps.map((h, i) => (
              <div key={i} className={`headsup tone-${h.tone}`}>
                <div className="headsup-icon">{h.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="headsup-title">{h.title}</div>
                  <div className="headsup-detail">{h.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROFILES */}
        <div className="card p-5 mb-4 anim-in" style={{ animationDelay: "240ms" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div className="section-label">Projection profile</div>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Geist Mono', monospace" }}>tap to switch</div>
          </div>
          <div className="profiles-grid">
            {Object.entries(profiles).map(([key, p]) => (
              <button key={key} onClick={() => setActiveProfile(key)} className={`profile-btn ${activeProfile === key ? "active" : ""}`}>
                <div className="profile-emoji">{p.emoji}</div>
                <div className="profile-name">{p.name}</div>
                <div className="profile-persona">{p.persona}</div>
                <div className="profile-cagr" style={{ color: p.color }}>
                  {p.cases[activeCase] > 0 ? "+" : ""}{p.cases[activeCase]}%/yr
                </div>
              </button>
            ))}
          </div>

          {/* CASE PICKER (Bear / Base / Bull) */}
          <div className="case-picker">
            {["bear", "base", "bull"].map((c) => (
              <button
                key={c}
                onClick={() => setActiveCase(c)}
                className={`case-pill ${c} ${activeCase === c ? "active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="profile-blurb">"{profiles[activeProfile].blurb}"</div>
          <button onClick={() => setEditingProfile(activeProfile)} className="profile-edit-link">
            Edit {profiles[activeProfile].name}'s assumptions →
          </button>
        </div>

        {/* CHART */}
        <div className="card p-5 mb-4 anim-in" style={{ animationDelay: "300ms" }}>
          <div className="section-label" style={{ marginBottom: "0.25rem" }}>Net position over time</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>
            Each profile's base case. Active profile/case shown bold.
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "Geist Mono" }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "Geist Mono" }}
                  tickLine={false} axisLine={false}
                  tickFormatter={(v) => {
                    const conv = v / live.fxToUsd[fiatCurrency];
                    if (Math.abs(conv) >= 1e6) return `${(conv/1e6).toFixed(1)}M`;
                    if (Math.abs(conv) >= 1e3) return `${(conv/1e3).toFixed(0)}k`;
                    return Math.round(conv);
                  }}
                />
                <Tooltip
                  contentStyle={{ background: "#0f0f10", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, fontFamily: "Geist Mono", fontSize: 11 }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                  formatter={(v, n) => {
                    const m = { saylor: "Saylor", wood: "Wood", schiff: "Schiff", sell: "If sold" };
                    return [fmtFiatOutput(v), m[n] || n];
                  }}
                  labelFormatter={(m) => `Month ${m}`}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                {Object.entries(profiles).map(([key, p]) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={p.color}
                    strokeWidth={key === activeProfile ? 2.5 : 1}
                    strokeOpacity={key === activeProfile ? 1 : 0.4}
                    dot={false} />
                ))}
                <Line type="monotone" dataKey="sell" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            {Object.entries(profiles).map(([key, p]) => (
              <div key={key} className="legend-item">
                <div className="legend-line" style={{ background: p.color }} />
                <span>{p.name}</span>
              </div>
            ))}
            <div className="legend-item">
              <div className="legend-dashed" />
              <span>If you sold</span>
            </div>
          </div>
        </div>

        {/* METRICS — collateral now appears here */}
        <div className="metric-grid anim-in" style={{ animationDelay: "360ms" }}>
          <div className="metric-card">
            <div className="metric-label">Collateral needed</div>
            <div className="metric-value">{fmtSats(collateralSatsNeeded)}</div>
            <div className="metric-sub">{fmtFiatOutput(collateralUsdNeeded)}</div>
          </div>
          <div className={`metric-card ${liquidationDropPct < 30 ? "warn" : ""}`}>
            <div className="metric-label">Liquidation at</div>
            <div className="metric-value">{fmtFiat(liquidationUsd / live.fxToUsd[fiatCurrency], fiatCurrency)}</div>
            <div className="metric-sub">-{liquidationDropPct.toFixed(0)}% from spot</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">BTC at maturity</div>
            <div className="metric-value">{fmtFiat(futureBtcPrice / live.fxToUsd[fiatCurrency], fiatCurrency)}</div>
            <div className="metric-sub">{activeCagr > 0 ? "+" : ""}{(((futureBtcPrice / BTC_SPOT_USD) - 1) * 100).toFixed(0)}% projected</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total owed</div>
            <div className="metric-value">{fmtFiatOutput(totalOwedUsd)}</div>
            <div className="metric-sub">principal + interest</div>
          </div>
        </div>

        {/* LENDERS */}
        <button onClick={() => setShowLenders(!showLenders)} className="lender-cta anim-in" style={{ animationDelay: "420ms" }}>
          <div className="lender-cta-row">
            <div>
              <div className="lender-cta-title">
                {showLenders ? "Hide" : "Show"} {rankedLenders.length} matched lender{rankedLenders.length !== 1 ? "s" : ""}
              </div>
              <div className="lender-cta-sub">
                Best fits for {CURRENCY_META[currency].label} · {ltvPct}% LTV · {termMonths}mo
              </div>
            </div>
            <div className={`lender-cta-arrow ${showLenders ? "open" : ""}`}>↓</div>
          </div>
        </button>

        {showLenders && (
          <div className="stack-3" style={{ marginBottom: "1.5rem" }}>
            {rankedLenders.length === 0 ? (
              <div className="empty">
                <div className="empty-emoji">🤷</div>
                <div className="empty-title">No lender matches your current parameters.</div>
                <div className="empty-detail">Try adjusting LTV, term, or loan size. Some lenders have $10K+ minimums or LTV caps under 50%.</div>
              </div>
            ) : (
              rankedLenders.map((l, i) => (
                <LenderCard key={l.id} lender={l} rank={i + 1} userRegion={userRegion} fmtFiatOutput={fmtFiatOutput} />
              ))
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="footer">
          <div className="footer-row">
            BTC spot via <span className="mono">{live.source}</span>
            {live.updatedAt && <> · updated <span className="mono">{live.updatedAt.toLocaleTimeString()}</span></>}
          </div>
          <div className="footer-disclaimer">
            Lender data {lendersLastUpdated ? <>last verified <span className="mono">{lendersLastUpdated}</span></> : "snapshot"} — verify current terms before borrowing.<br />
            Some lender links are affiliate partnerships. Rankings computed purely from rate, fee, and term — never from commission.
          </div>
          <div className="footer-tiny" style={{ marginTop: "0.5rem" }}>
            Not financial advice. Liquidation calc assumes 80% trigger LTV (varies by lender).
          </div>
        </div>
      </div>

      {editingProfile && (
        <EditProfileModal
          profile={profiles[editingProfile]}
          btcSpotUsd={BTC_SPOT_USD}
          onSave={(updated) => {
            setProfiles({ ...profiles, [editingProfile]: { ...profiles[editingProfile], ...updated } });
            setEditingProfile(null);
          }}
          onReset={() => {
            setProfiles({ ...profiles, [editingProfile]: DEFAULT_PROFILES[editingProfile] });
            setEditingProfile(null);
          }}
          onClose={() => setEditingProfile(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// SUBCOMPONENTS
// ============================================================

function NumInput({ value, onChange, suffix, prefix }) {
  // Display value with thin-space separators while user types raw numbers
  return (
    <div className="num-input">
      {prefix && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", fontFamily: "'Geist Mono', monospace" }}>{prefix}</span>}
      <input
        type="text"
        inputMode="numeric"
        value={fmtNum(value)}
        onChange={(e) => {
          // Strip all non-digits then parse
          const digits = e.target.value.replace(/[^\d]/g, "");
          onChange(parseInt(digits, 10) || 0);
        }}
      />
      {suffix && <span className="num-input-suffix">{suffix}</span>}
    </div>
  );
}

function CurrencyPicker({ currency, setCurrency }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="picker-wrap">
      <button onClick={() => setOpen(!open)} className="picker-button">
        <span className="picker-currency">{CURRENCY_META[currency].label}</span>
        <span className="picker-caret">▾</span>
      </button>
      {open && (
        <div className="picker-menu">
          {Object.entries(CURRENCY_META).map(([code, m]) => (
            <button key={code} onClick={() => { setCurrency(code); setOpen(false); }}
              className={`picker-item ${currency === code ? "active" : ""}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaxRateControl({ currency, taxRate, effectiveTaxRate, setTaxRate }) {
  const [expanded, setExpanded] = useState(false);
  const isCustom = taxRate !== null;
  const defaultRate = CURRENCY_META[currency].taxRate;

  return (
    <div className="input-row">
      <button onClick={() => setExpanded(!expanded)} className="tax-toggle">
        <label className="input-label">Capital gains tax rate</label>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
          <span className="input-value-orange">{effectiveTaxRate}%</span>
          <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.5)" }}>{expanded ? "▴" : "▾"}</span>
        </div>
      </button>
      {expanded && (
        <div className="tax-detail">
          <input className="slider" type="range" min={0} max={50} step={1} value={effectiveTaxRate} onChange={(e) => setTaxRate(Math.round(parseFloat(e.target.value)))} />
          <div className="tax-meta-row">
            <span className="muted">{isCustom ? "Custom rate" : `Default for ${CURRENCY_META[currency].label} (${defaultRate}%)`}</span>
            {isCustom && <button onClick={() => setTaxRate(null)} className="tax-reset">use default</button>}
          </div>
          <div className="tax-help">
            Used to calculate the tax you'd owe if you sold sats instead. Assumes worst-case zero cost basis — adjust down if your basis is closer to spot.
          </div>
        </div>
      )}
    </div>
  );
}

function LenderCard({ lender, rank, userRegion, fmtFiatOutput }) {
  const [expanded, setExpanded] = useState(false);
  const custodyTone = { multisig: "good", "custodial-mixed": "neutral", custodial: "neutral" };
  const rehypTone = { no: "good", optional: "warning", yes: "warning" };
  const rehypLabel = { no: "no rehypothecation", optional: "optional rehyp.", yes: "rehypothecation" };
  const custodyLabel = { multisig: "multisig", "custodial-mixed": "custodial (options)", custodial: "custodial" };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="lender-card-body">
        <div className="lender-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
              <div className="lender-rank">#{rank}</div>
              <div className="lender-name">{lender.name}</div>
              {lender.badge && <span className="pill pill-orange">{lender.badge}</span>}
            </div>
            <div className="lender-term">{lender.term}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div className="lender-apr">{lender.effectiveApr.toFixed(2)}%</div>
            <div className="lender-apr-label">effective APR</div>
          </div>
        </div>
        <div className="pill-row">
          <span className={`pill pill-${custodyTone[lender.custodyType]}`}>{custodyLabel[lender.custodyType]}</span>
          <span className={`pill pill-${rehypTone[lender.rehypothecation]}`}>{rehypLabel[lender.rehypothecation]}</span>
          <span className="pill pill-neutral">max {lender.maxLtv}% LTV</span>
          {lender.originationFeePct > 0 && (
            <span className="pill pill-neutral">
              {lender.feeWaivedFor.includes(userRegion) ? "fee waived" : `${lender.originationFeePct}% origination`}
            </span>
          )}
        </div>
        <div className="lender-actions">
          <button onClick={() => setExpanded(!expanded)} className="lender-toggle">
            {expanded ? "Less detail" : "More detail →"}
          </button>
          <a href={lender.referralUrl} target="_blank" rel="noopener noreferrer" className="lender-link">
            Visit {lender.name} ↗
          </a>
        </div>
        {expanded && (
          <div className="lender-detail">
            <DetailRow label="Custody" value={lender.custody} />
            <DetailRow label="Rollover" value={lender.rollover} />
            <DetailRow label="Min loan" value={`$${fmtNum(lender.minLoanUsd)}`} />
            <DetailRow label="Notes" value={lender.notes} />
            <DetailRow label="Total interest cost" value={fmtFiatOutput(lender.totalCost)} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="lender-detail-item">
      <div className="lender-detail-label">{label}</div>
      <div className="lender-detail-value">{value}</div>
    </div>
  );
}

function EditProfileModal({ profile, btcSpotUsd, onSave, onReset, onClose }) {
  const [cases, setCases] = useState(profile.cases);

  const setCase = (which, val) => setCases({ ...cases, [which]: val });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-emoji">{profile.emoji}</div>
          <div>
            <div className="modal-title">{profile.name}</div>
            <div className="modal-persona">{profile.persona}</div>
          </div>
        </div>
        <div className="modal-blurb">"{profile.blurb}"</div>

        {["bear", "base", "bull"].map((which) => {
          const colorMap = { bear: "#fca5a5", base: profile.color, bull: "#6ee7b7" };
          return (
            <div key={which} className="case-edit">
              <div className="case-edit-row">
                <span className="case-edit-label">{which} case</span>
                <span className="case-edit-value" style={{ color: colorMap[which] }}>
                  {cases[which] > 0 ? "+" : ""}{cases[which]}%/yr
                </span>
              </div>
              <input
                className="slider"
                type="range" min={-30} max={100} step={1}
                value={cases[which]}
                onChange={(e) => setCase(which, parseFloat(e.target.value))}
                style={{ "--thumb": colorMap[which] }}
              />
            </div>
          );
        })}

        <div className="modal-projection">
          <strong>Base case</strong> projects BTC at <span className="mono" style={{ fontFamily: "'Geist Mono', monospace" }}>${fmtNum(Math.round(projectBtcPrice(btcSpotUsd, cases.base, 1)))}</span> in 1yr,{" "}
          <span className="mono" style={{ fontFamily: "'Geist Mono', monospace" }}>${fmtNum(Math.round(projectBtcPrice(btcSpotUsd, cases.base, 5)))}</span> in 5yr.
        </div>

        <div className="modal-actions">
          <button onClick={onReset} className="btn btn-secondary">Reset to defaults</button>
          <button onClick={() => onSave({ cases })} className="btn btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}
