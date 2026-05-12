import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, ComposedChart, Bar } from "recharts";

// ============================================================
// CONSTANTS
// ============================================================

const SATS_PER_BTC = 100_000_000;
const STRATEGY_STORAGE_KEY = "stackandborrow:strategy:v1";

// Tax jurisdictions — focus on what matters for the strategy: step-up basis at death
const TAX_JURISDICTIONS = {
  US: {
    name: "United States",
    capGainsPct: 20,
    stepUpAtDeath: true,
    note: "20% long-term capital gains. Step-up basis at death means heirs inherit at current market value with capital gains tax effectively zeroed. Strategy maximally effective.",
  },
  SE: {
    name: "Sweden",
    capGainsPct: 30,
    stepUpAtDeath: false,
    note: "30% capital gains on crypto. No step-up basis — cost basis transfers to heirs. Strategy works for you, but heirs inherit your unrealized gains and the eventual tax obligation.",
  },
  EU: {
    name: "EU (typical)",
    capGainsPct: 26,
    stepUpAtDeath: false,
    note: "Tax rates vary 20-33% across EU. No step-up basis in most member states. Strategy still defers tax, but does not eliminate it for heirs.",
  },
  CH: {
    name: "Switzerland",
    capGainsPct: 0,
    stepUpAtDeath: true,
    note: "Zero capital gains for private individuals on crypto. Strategy provides liquidity but doesn't save tax (because there's no tax to save).",
  },
  UK: {
    name: "United Kingdom",
    capGainsPct: 24,
    stepUpAtDeath: false,
    note: "Up to 24% capital gains. No step-up basis. Inheritance tax (40%) applies above thresholds. Strategy defers but does not avoid.",
  },
};

// Lender compatibility for Buy-Borrow-Die / Stack & Borrow strategy.
// Grade rationale:
//   A = open-ended terms, guaranteed rollover, no friction
//   B = fixed term but reliable rollover, low refinance friction
//   C = fixed term, conditional rollover, meaningful friction
//   D = fixed term, no guaranteed continuation
const LENDER_COMPATIBILITY = {
  ledn: { grade: "B", reason: "12-mo fixed. Rollover available, subject to approval. No origination fee at refinance (US/CA), elsewhere 2%." },
  strike: { grade: "B", reason: "12-mo fixed. Up to 3 concurrent loans + refinance supported. No fees on rollover. Global availability." },
  arch: { grade: "B", reason: "12-mo fixed. Refinance available. Tiered origination fees decrease at larger loan sizes." },
  firefish: { grade: "C", reason: "P2P marketplace. New loan required at maturity — new counterparty, new negotiation. Flexible terms but uncertain continuation." },
  debifi: { grade: "B", reason: "3-12mo terms. Rollover on agreement. Multisig custody compatible with self-custody-first approach." },
  xapo: { grade: "B+", reason: "30-365 day terms. Extension case-by-case but bank-grade reliability. $1000/yr membership amortizes well over long horizon." },
  figure: { grade: "C", reason: "Variable terms, rehypothecation, custodial. Higher counterparty risk over multi-decade horizons." },
  milo: { grade: "B", reason: "Interest-only with balloon. Deferred-payment option useful for strategy. Strong custody (Coinbase/BitGo)." },
  unchained: { grade: "—", reason: "Business loans only — not applicable to individual strategy." },
};

// Lender data is fetched from /lenders.json; we'll merge with compatibility above.

// ============================================================
// SIMULATION ENGINE — the core of this page
// ============================================================

/**
 * Run the Stack & Borrow simulation over N years.
 *
 * Inputs:
 *   coldStackSats        — never touched. Pure HODL. Grows with BTC price.
 *   bridgeStackSats      — used to repay loans when needed. Self-custodied.
 *   collateralStackSats  — held by lender. Recycled across loans.
 *   annualIncomeUsd      — what user draws each year (in today's dollars)
 *   inflationPct         — used to adjust required income over time
 *   ltvPct               — loan-to-value ratio against collateral
 *   aprPct               — annual interest rate
 *   originationFeePct    — fee charged each time a new loan is taken
 *   btcCagrPct           — assumed BTC compound annual growth rate
 *   years                — simulation horizon
 *   btcSpotUsd           — current BTC price
 *   taxRatePct           — capital gains tax rate for the user's jurisdiction
 *
 * Returns array of yearly snapshots:
 *   { year, btcPrice, coldStackUsd, bridgeStackSats, collateralStackSats,
 *     outstandingDebtUsd, incomeWithdrawnUsd, totalDebtPaidUsd, netWorthUsd,
 *     marginCallRisk, liquidationRisk, bridgeRunoutWarning }
 */
function simulateStrategy({
  coldStackSats,
  bridgeStackSats,
  collateralStackSats,
  annualIncomeUsd,
  inflationPct,
  ltvPct,
  aprPct,
  originationFeePct,
  btcCagrPct,
  years,
  btcSpotUsd,
  taxRatePct,
  liquidationLtvPct = 80,
}) {
  const snapshots = [];

  // Track state across years
  let currentColdSats = coldStackSats;
  let currentBridgeSats = bridgeStackSats;
  let currentCollateralSats = collateralStackSats;
  let outstandingDebt = 0;
  let cumulativeWithdrawn = 0;
  let cumulativeInterestPaid = 0;
  let cumulativeBridgeUsed = 0; // sats from bridge consumed
  let marginCallEverHit = false;
  let liquidationEverHit = false;

  // Year 0 snapshot
  const year0Price = btcSpotUsd;
  snapshots.push({
    year: 0,
    btcPrice: year0Price,
    coldStackSats: currentColdSats,
    bridgeStackSats: currentBridgeSats,
    collateralStackSats: currentCollateralSats,
    coldStackUsd: (currentColdSats / SATS_PER_BTC) * year0Price,
    bridgeStackUsd: (currentBridgeSats / SATS_PER_BTC) * year0Price,
    collateralStackUsd: (currentCollateralSats / SATS_PER_BTC) * year0Price,
    outstandingDebtUsd: 0,
    incomeWithdrawnUsd: 0,
    totalWithdrawnUsd: 0,
    cumulativeInterestPaid: 0,
    netWorthUsd: ((currentColdSats + currentBridgeSats + currentCollateralSats) / SATS_PER_BTC) * year0Price,
    marginCallRisk: false,
    liquidationRisk: false,
    bridgeRunoutWarning: false,
    annualIncomeNeeded: annualIncomeUsd,
  });

  for (let y = 1; y <= years; y++) {
    const btcPrice = btcSpotUsd * Math.pow(1 + btcCagrPct / 100, y);
    const incomeNeededThisYear = annualIncomeUsd * Math.pow(1 + inflationPct / 100, y - 1);

    // Step 1: Compute the new loan needed this year
    // The new loan must cover: (a) this year's income + (b) repay last year's outstanding debt + interest
    const interestOnOldDebt = outstandingDebt * (aprPct / 100);
    const repaymentRequired = outstandingDebt + interestOnOldDebt;

    // What we need to borrow this year:
    let newLoanGross = incomeNeededThisYear + repaymentRequired;
    // Account for origination fee on the new loan
    const originationFee = newLoanGross * (originationFeePct / 100);
    newLoanGross = newLoanGross + originationFee;

    // Step 2: Check if collateral supports this loan size
    const collateralValueThisYear = (currentCollateralSats / SATS_PER_BTC) * btcPrice;
    const maxBorrowable = collateralValueThisYear * (ltvPct / 100);

    let bridgeUsedThisYear = 0;

    if (newLoanGross > maxBorrowable) {
      // Need to use bridge stack to cover the shortfall
      const shortfallUsd = newLoanGross - maxBorrowable;
      const shortfallSats = (shortfallUsd / btcPrice) * SATS_PER_BTC;
      // Move sats from bridge → collateral to support a larger loan
      const satsToMove = Math.min(shortfallSats * (1 / (ltvPct / 100)), currentBridgeSats);
      currentBridgeSats -= satsToMove;
      currentCollateralSats += satsToMove;
      bridgeUsedThisYear = satsToMove;
      cumulativeBridgeUsed += satsToMove;

      // Recalculate max borrowable after bridge top-up
      const newCollateralValue = (currentCollateralSats / SATS_PER_BTC) * btcPrice;
      const newMaxBorrowable = newCollateralValue * (ltvPct / 100);

      if (newLoanGross > newMaxBorrowable) {
        // Even after using bridge, can't cover full loan. Strategy is breaking down.
        // Reduce the loan to what we can actually borrow.
        newLoanGross = newMaxBorrowable;
        marginCallEverHit = true;
      }
    }

    // Step 3: Pay off old debt + interest
    cumulativeInterestPaid += interestOnOldDebt;
    outstandingDebt = newLoanGross;

    // Step 4: Pay origination fee (already included in newLoanGross)
    // Step 5: Withdraw income (what remains after paying off old loan + origination)
    const incomeReceived = newLoanGross - repaymentRequired - originationFee;
    cumulativeWithdrawn += incomeReceived;

    // Step 6: Check liquidation risk
    // Liquidation triggers if outstanding debt / collateral value > liquidationLtvPct
    const currentLtv = (outstandingDebt / collateralValueThisYear) * 100;
    const liquidationRisk = currentLtv >= liquidationLtvPct * 0.85; // within 15% of liquidation = warning
    if (currentLtv >= liquidationLtvPct) liquidationEverHit = true;

    // Step 7: Bridge runout warning
    const bridgeRunoutWarning = currentBridgeSats < bridgeStackSats * 0.2; // less than 20% of initial bridge

    snapshots.push({
      year: y,
      btcPrice,
      coldStackSats: currentColdSats,
      bridgeStackSats: currentBridgeSats,
      collateralStackSats: currentCollateralSats,
      coldStackUsd: (currentColdSats / SATS_PER_BTC) * btcPrice,
      bridgeStackUsd: (currentBridgeSats / SATS_PER_BTC) * btcPrice,
      collateralStackUsd: (currentCollateralSats / SATS_PER_BTC) * btcPrice,
      outstandingDebtUsd: outstandingDebt,
      incomeWithdrawnUsd: incomeReceived,
      totalWithdrawnUsd: cumulativeWithdrawn,
      cumulativeInterestPaid,
      bridgeUsedThisYear,
      cumulativeBridgeUsed,
      netWorthUsd:
        ((currentColdSats + currentBridgeSats + currentCollateralSats) / SATS_PER_BTC) * btcPrice -
        outstandingDebt,
      marginCallRisk: marginCallEverHit,
      liquidationRisk,
      bridgeRunoutWarning,
      annualIncomeNeeded: incomeNeededThisYear,
    });
  }

  return {
    snapshots,
    summary: {
      finalStackSats: currentColdSats + currentBridgeSats + currentCollateralSats,
      finalStackUsd:
        ((currentColdSats + currentBridgeSats + currentCollateralSats) / SATS_PER_BTC) *
        snapshots[snapshots.length - 1].btcPrice,
      totalWithdrawnUsd: cumulativeWithdrawn,
      finalDebtUsd: outstandingDebt,
      finalNetWorthUsd: snapshots[snapshots.length - 1].netWorthUsd,
      cumulativeInterestPaid,
      marginCallEverHit,
      liquidationEverHit,
      bridgeRunoutWarning: currentBridgeSats < bridgeStackSats * 0.2,
      satsSold: 0, // The whole point. Always zero.
    },
  };
}

// ============================================================
// FORMATTERS
// ============================================================

const THIN_SPACE = "\u202F";

const fmtNum = (n) => {
  if (n == null || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  return sign + abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
};

const fmtSats = (sats) => {
  if (sats == null || isNaN(sats)) return "—";
  if (Math.abs(sats) >= 1e8) return `${(sats / 1e8).toFixed(4)}${THIN_SPACE}BTC`;
  return `${fmtNum(sats)}${THIN_SPACE}sats`;
};

const fmtUsd = (n) => {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return `$${fmtNum(n)}`;
};

const fmtUsdExact = (n) => {
  if (n == null || isNaN(n)) return "—";
  return `$${fmtNum(n)}`;
};

// ============================================================
// STYLES
// ============================================================

const STRATEGY_STYLES = `
  .strategy-page {
    background: #0a0a0b;
    color: #fff;
    min-height: 100vh;
    font-family: 'Geist', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .strategy-wrap {
    max-width: 56rem;
    margin: 0 auto;
    padding: 1.5rem 1rem 8rem;
  }

  /* Header */
  .s-back {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255,255,255,0.55);
    text-decoration: none;
    font-size: 0.8125rem;
    margin-bottom: 2rem;
    transition: color 150ms;
  }
  .s-back:hover { color: #f7931a; }

  /* Hero */
  .s-hero { margin-bottom: 3rem; }
  .s-eyebrow {
    font-family: 'Geist Mono', ui-monospace, monospace;
    font-size: 0.6875rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #f7931a;
    margin-bottom: 1.25rem;
  }
  .s-h1 {
    font-family: 'Fraunces', Georgia, serif;
    font-size: clamp(2.5rem, 6vw, 4rem);
    line-height: 1;
    letter-spacing: -0.025em;
    font-weight: 600;
    margin: 0 0 1.25rem;
    color: #fff;
  }
  .s-h1 .accent { color: #f7931a; font-style: italic; font-weight: 500; }
  .s-lede {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 1.1875rem;
    line-height: 1.55;
    color: rgba(255,255,255,0.7);
    max-width: 36rem;
    font-weight: 400;
  }

  /* Section */
  .s-section { margin: 4rem 0; scroll-margin-top: 2rem; }
  .s-h2 {
    font-family: 'Fraunces', Georgia, serif;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.15;
    margin: 0 0 1rem;
    color: #fff;
  }
  .s-h2 .num {
    font-family: 'Geist Mono', monospace;
    font-size: 0.6875rem;
    letter-spacing: 0.2em;
    color: #f7931a;
    display: block;
    margin-bottom: 0.625rem;
    font-weight: 500;
    text-transform: uppercase;
  }
  .s-p {
    font-size: 0.9375rem;
    color: rgba(255,255,255,0.75);
    line-height: 1.7;
    margin: 0 0 1.25rem;
    max-width: 38rem;
  }
  .s-p strong { color: #fff; font-weight: 600; }
  .s-p .accent { color: #f7931a; }

  /* The three-stack visual */
  .stack-viz {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.875rem;
    margin: 2rem 0;
  }
  @media (max-width: 640px) {
    .stack-viz { grid-template-columns: 1fr; }
  }
  .stack-card {
    border-radius: 1rem;
    padding: 1.5rem 1.25rem;
    border: 1px solid;
    position: relative;
    overflow: hidden;
  }
  .stack-card.cold {
    border-color: rgba(56, 189, 248, 0.3);
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.06), transparent);
  }
  .stack-card.bridge {
    border-color: rgba(247, 147, 26, 0.3);
    background: linear-gradient(135deg, rgba(247, 147, 26, 0.06), transparent);
  }
  .stack-card.collateral {
    border-color: rgba(110, 231, 183, 0.3);
    background: linear-gradient(135deg, rgba(110, 231, 183, 0.06), transparent);
  }
  .stack-icon { font-family: 'Geist Mono', monospace; font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; }
  .stack-card.cold .stack-icon { color: #38bdf8; }
  .stack-card.bridge .stack-icon { color: #f7931a; }
  .stack-card.collateral .stack-icon { color: #6ee7b7; }
  .stack-title {
    font-family: 'Fraunces', serif;
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.375rem;
  }
  .stack-meta {
    font-family: 'Geist Mono', monospace;
    font-size: 0.6875rem;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    margin-bottom: 0.875rem;
  }
  .stack-desc { font-size: 0.8125rem; color: rgba(255,255,255,0.7); line-height: 1.55; }

  /* Simulation control panel */
  .sim {
    background: #141417;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 1.5rem;
    padding: 1.5rem;
    margin: 2rem 0;
  }
  @media (min-width: 768px) {
    .sim { padding: 2rem; }
  }
  .sim-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  @media (min-width: 900px) {
    .sim-grid { grid-template-columns: 22rem 1fr; }
  }
  .sim-controls { display: flex; flex-direction: column; gap: 1.25rem; }
  .sim-output { display: flex; flex-direction: column; gap: 1.5rem; }

  .sim-section-label {
    font-family: 'Geist Mono', monospace;
    font-size: 0.625rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    margin-bottom: 0.625rem;
  }

  .control-row { width: 100%; }
  .control-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }
  .control-label { font-size: 0.875rem; color: rgba(255,255,255,0.85); }
  .control-value {
    font-family: 'Geist Mono', monospace;
    font-size: 0.9375rem;
    color: #f7931a;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .control-sub {
    font-family: 'Geist Mono', monospace;
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.5);
  }

  .num-input-s {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0.75rem;
    border-radius: 0.625rem;
    background: #0a0a0b;
    border: 1px solid rgba(255,255,255,0.15);
    transition: border-color 150ms;
  }
  .num-input-s:focus-within { border-color: rgba(247, 147, 26, 0.6); }
  .num-input-s input {
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    color: #fff;
    font-family: 'Geist Mono', monospace;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
  }
  .num-input-s input::-webkit-inner-spin-button,
  .num-input-s input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .num-input-s-suffix { color: rgba(255,255,255,0.45); font-size: 0.75rem; }

  /* Allocation tri-bar */
  .alloc-bar {
    display: flex;
    height: 0.625rem;
    border-radius: 9999px;
    overflow: hidden;
    background: rgba(255,255,255,0.05);
    margin: 0.625rem 0;
  }
  .alloc-segment {
    transition: width 200ms;
    height: 100%;
  }
  .alloc-segment.cold { background: #38bdf8; }
  .alloc-segment.bridge { background: #f7931a; }
  .alloc-segment.collateral { background: #6ee7b7; }
  .alloc-legend {
    display: flex;
    justify-content: space-between;
    font-family: 'Geist Mono', monospace;
    font-size: 0.625rem;
    color: rgba(255,255,255,0.55);
  }
  .alloc-legend-item { display: flex; align-items: center; gap: 0.375rem; }
  .alloc-legend-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; }
  .alloc-legend-dot.cold { background: #38bdf8; }
  .alloc-legend-dot.bridge { background: #f7931a; }
  .alloc-legend-dot.collateral { background: #6ee7b7; }

  /* Hero results numbers */
  .results-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .result-card {
    padding: 1rem;
    border-radius: 0.875rem;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .result-card.feature {
    grid-column: 1 / -1;
    background: linear-gradient(135deg, rgba(247, 147, 26, 0.08), transparent);
    border-color: rgba(247, 147, 26, 0.3);
    padding: 1.5rem;
  }
  .result-label {
    font-family: 'Geist Mono', monospace;
    font-size: 0.625rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 0.5rem;
  }
  .result-value {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 1.5rem;
    line-height: 1.1;
    color: #fff;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.015em;
  }
  .result-value.featured {
    font-size: clamp(2rem, 5vw, 2.75rem);
    color: #f7931a;
  }
  .result-value.zero {
    color: #6ee7b7;
  }
  .result-sub {
    font-family: 'Geist Mono', monospace;
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.5);
    margin-top: 0.375rem;
  }

  /* Headsup */
  .headsup-s {
    border-radius: 0.625rem;
    border: 1px solid;
    padding: 0.625rem 0.875rem;
    display: flex;
    gap: 0.625rem;
    font-size: 0.75rem;
    line-height: 1.4;
  }
  .headsup-s-icon {
    font-family: 'Geist Mono', monospace;
    font-size: 0.875rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  .hs-warn { border-color: rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.05); color: #fef3c7; }
  .hs-danger { border-color: rgba(248, 113, 113, 0.4); background: rgba(248, 113, 113, 0.06); color: #fecaca; }
  .hs-good { border-color: rgba(110, 231, 183, 0.4); background: rgba(110, 231, 183, 0.05); color: #a7f3d0; }

  /* Sliders */
  .slider-s {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 5px;
    border-radius: 3px;
    background: rgba(255,255,255,0.1);
    outline: none;
    cursor: pointer;
  }
  .slider-s::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--thumb, #f7931a);
    cursor: pointer;
    box-shadow: 0 0 0 3px rgba(247, 147, 26, 0.2);
    border: 2px solid #1a1a1c;
  }
  .slider-s::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--thumb, #f7931a);
    cursor: pointer;
    border: 2px solid #1a1a1c;
  }

  /* Tax jurisdiction selector */
  .jurisdiction-tabs {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: 0.625rem;
    background: #0a0a0b;
    border: 1px solid rgba(255,255,255,0.1);
    flex-wrap: wrap;
  }
  .jur-tab {
    flex: 1;
    min-width: fit-content;
    padding: 0.5rem 0.625rem;
    border: none;
    background: transparent;
    border-radius: 0.4375rem;
    cursor: pointer;
    font-family: 'Geist Mono', monospace;
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.55);
    transition: all 150ms;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .jur-tab:hover { color: rgba(255,255,255,0.85); }
  .jur-tab.active {
    background: rgba(247, 147, 26, 0.15);
    color: #f7931a;
  }

  /* Lender grade table */
  .grade-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.875rem;
  }
  .grade-table thead th {
    font-family: 'Geist Mono', monospace;
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: rgba(255,255,255,0.45);
    text-align: left;
    padding: 0.75rem 0.625rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    font-weight: 500;
  }
  .grade-table td {
    padding: 0.875rem 0.625rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    vertical-align: top;
  }
  .grade-table .lender-name {
    font-family: 'Fraunces', serif;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  .grade-table .reason {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.6);
    line-height: 1.45;
  }
  .grade-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    border-radius: 0.5rem;
    font-family: 'Geist Mono', monospace;
    font-weight: 700;
    font-size: 0.875rem;
    letter-spacing: 0.02em;
    border: 1.5px solid;
  }
  .grade-badge.A { background: rgba(110, 231, 183, 0.12); color: #6ee7b7; border-color: rgba(110, 231, 183, 0.4); }
  .grade-badge.Bp, .grade-badge.B { background: rgba(247, 147, 26, 0.12); color: #f7931a; border-color: rgba(247, 147, 26, 0.4); }
  .grade-badge.C { background: rgba(251, 191, 36, 0.12); color: #fde68a; border-color: rgba(251, 191, 36, 0.4); }
  .grade-badge.D { background: rgba(248, 113, 113, 0.12); color: #fca5a5; border-color: rgba(248, 113, 113, 0.4); }
  .grade-badge.none { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); border-color: rgba(255,255,255,0.15); }

  /* Tax callout */
  .tax-callout {
    margin: 1.5rem 0;
    padding: 1.25rem;
    border-radius: 0.875rem;
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.04), transparent);
    border: 1px solid rgba(56, 189, 248, 0.25);
  }
  .tax-callout-title {
    font-family: 'Geist Mono', monospace;
    font-size: 0.6875rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 0.5rem;
  }
  .tax-callout-body {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.8);
    line-height: 1.6;
  }
  .tax-callout-body strong { color: #fff; }

  /* CTA to calculator */
  .cta-calc {
    margin: 3rem 0;
    padding: 2rem 1.5rem;
    border-radius: 1.25rem;
    background:
      radial-gradient(ellipse at top right, rgba(247, 147, 26, 0.12), transparent 60%),
      #141417;
    border: 1px solid rgba(247, 147, 26, 0.3);
    text-align: center;
  }
  .cta-calc-title {
    font-family: 'Fraunces', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.625rem;
    letter-spacing: -0.015em;
  }
  .cta-calc-desc {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.65);
    margin-bottom: 1.25rem;
    max-width: 26rem;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.55;
  }
  .cta-calc-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 0.625rem;
    background: #f7931a;
    color: #000;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    transition: background 150ms;
  }
  .cta-calc-btn:hover { background: #ffb04a; }

  /* Purge button */
  .purge-btn {
    background: transparent;
    border: 1px solid rgba(248, 113, 113, 0.3);
    color: rgba(248, 113, 113, 0.85);
    padding: 0.5rem 0.875rem;
    border-radius: 0.5rem;
    font-family: 'Geist Mono', monospace;
    font-size: 0.6875rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 150ms;
  }
  .purge-btn:hover {
    background: rgba(248, 113, 113, 0.08);
    color: #fca5a5;
  }

  /* Risk scenario tabs */
  .risk-tabs {
    display: flex;
    gap: 0.5rem;
    margin: 1.5rem 0 1rem;
    flex-wrap: wrap;
  }
  .risk-tab {
    padding: 0.5rem 0.875rem;
    border-radius: 0.5rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.65);
    font-family: 'Geist Mono', monospace;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 150ms;
  }
  .risk-tab:hover { border-color: rgba(255,255,255,0.25); }
  .risk-tab.active {
    background: rgba(248, 113, 113, 0.12);
    border-color: rgba(248, 113, 113, 0.4);
    color: #fca5a5;
  }

  /* Chart container */
  .chart-container {
    margin: 1rem 0;
    padding: 1.25rem;
    background: rgba(255,255,255,0.015);
    border-radius: 0.875rem;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .chart-title {
    font-family: 'Geist Mono', monospace;
    font-size: 0.6875rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    margin-bottom: 0.25rem;
  }
  .chart-sub {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.55);
    margin-bottom: 1rem;
  }

  /* Divider */
  .s-divider {
    border: none;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
    margin: 4rem 0;
  }
`;

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StackVisualization() {
  return (
    <div className="stack-viz">
      <div className="stack-card cold">
        <div className="stack-icon">❄</div>
        <div className="stack-title">Cold storage</div>
        <div className="stack-meta">Touch never</div>
        <div className="stack-desc">
          Pure HODL. Self-custodied, multisig, geographically distributed. This stack exists outside the strategy entirely. It compounds quietly for decades.
        </div>
      </div>
      <div className="stack-card bridge">
        <div className="stack-icon">⇄</div>
        <div className="stack-title">Bridge stack</div>
        <div className="stack-meta">Strategic reserve</div>
        <div className="stack-desc">
          Also self-custodied. Mobilized only when a refinance needs more collateral. Acts as your insurance against bear markets.
        </div>
      </div>
      <div className="stack-card collateral">
        <div className="stack-icon">⚙</div>
        <div className="stack-title">Working collateral</div>
        <div className="stack-meta">At the lender</div>
        <div className="stack-desc">
          The portion held by your chosen lender as security. Backs the loan. Recycled year after year as you refinance.
        </div>
      </div>
    </div>
  );
}

function NumInput({ value, onChange, suffix }) {
  return (
    <div className="num-input-s">
      <input
        type="text"
        inputMode="numeric"
        value={fmtNum(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "");
          onChange(parseInt(digits, 10) || 0);
        }}
      />
      {suffix && <span className="num-input-s-suffix">{suffix}</span>}
    </div>
  );
}

function AllocationControls({ coldPct, bridgePct, collateralPct, onChange }) {
  // Two sliders control three values; the third is the remainder
  const handleColdChange = (newCold) => {
    const remaining = 100 - newCold;
    const ratio = bridgePct / (bridgePct + collateralPct) || 0.5;
    onChange(newCold, remaining * ratio, remaining * (1 - ratio));
  };

  const handleBridgeChange = (newBridge) => {
    const maxBridge = 100 - coldPct;
    const clampedBridge = Math.min(newBridge, maxBridge);
    onChange(coldPct, clampedBridge, 100 - coldPct - clampedBridge);
  };

  return (
    <div>
      <div className="alloc-bar">
        <div className="alloc-segment cold" style={{ width: `${coldPct}%` }} />
        <div className="alloc-segment bridge" style={{ width: `${bridgePct}%` }} />
        <div className="alloc-segment collateral" style={{ width: `${collateralPct}%` }} />
      </div>
      <div className="alloc-legend" style={{ marginBottom: "1rem" }}>
        <div className="alloc-legend-item">
          <div className="alloc-legend-dot cold" />
          <span>Cold {coldPct}%</span>
        </div>
        <div className="alloc-legend-item">
          <div className="alloc-legend-dot bridge" />
          <span>Bridge {bridgePct}%</span>
        </div>
        <div className="alloc-legend-item">
          <div className="alloc-legend-dot collateral" />
          <span>Collateral {collateralPct}%</span>
        </div>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <div className="control-header">
          <label className="control-label">Cold storage</label>
          <span className="control-value" style={{ color: "#38bdf8" }}>{coldPct}%</span>
        </div>
        <input
          className="slider-s"
          type="range" min={0} max={90} step={5}
          value={coldPct}
          onChange={(e) => handleColdChange(parseFloat(e.target.value))}
          style={{ "--thumb": "#38bdf8" }}
        />
      </div>

      <div>
        <div className="control-header">
          <label className="control-label">Bridge reserve</label>
          <span className="control-value">{bridgePct}%</span>
        </div>
        <input
          className="slider-s"
          type="range" min={0} max={100 - coldPct} step={5}
          value={bridgePct}
          onChange={(e) => handleBridgeChange(parseFloat(e.target.value))}
        />
        <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", marginTop: "0.375rem" }}>
          Working collateral: {collateralPct}% (auto)
        </div>
      </div>
    </div>
  );
}

function JurisdictionTabs({ value, onChange }) {
  return (
    <div className="jurisdiction-tabs">
      {Object.entries(TAX_JURISDICTIONS).map(([code, j]) => (
        <button
          key={code}
          className={`jur-tab ${value === code ? "active" : ""}`}
          onClick={() => onChange(code)}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// MAIN STRATEGY PAGE
// ============================================================

function loadSavedState(defaultState) {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STRATEGY_STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch (e) {}
  return defaultState;
}

function saveState(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function detectJurisdiction() {
  if (typeof navigator === "undefined") return "US";
  const locale = navigator.language || "en-US";
  const country = (locale.split("-")[1] || "").toUpperCase();
  const map = {
    SE: "SE",
    US: "US",
    CH: "CH",
    LI: "CH",
    GB: "UK",
    UK: "UK",
  };
  if (map[country]) return map[country];
  const euCountries = ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PT", "IE", "FI", "GR", "LU", "DK", "PL", "CZ", "HU", "NO"];
  if (euCountries.includes(country)) return "EU";
  return "US";
}

export default function StrategyPage({ btcSpotUsd, lenders, fiatCurrency, fxToUsd, fmtFiatOutput }) {
  const defaultState = {
    totalStackSats: 100_000_000, // 1 BTC
    coldPct: 60,
    bridgePct: 25,
    collateralPct: 15,
    annualIncomeUsd: 60000,
    inflationPct: 3,
    ltvPct: 35,
    btcCagrPct: 20,
    years: 10,
    selectedLenderId: "strike",
    jurisdiction: detectJurisdiction(),
    riskScenario: "base",
  };

  const [state, setState] = useState(() => loadSavedState(defaultState));

  // Persist state on change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const setField = (field, value) => setState((s) => ({ ...s, [field]: value }));
  const setAllocation = (cold, bridge, collateral) =>
    setState((s) => ({
      ...s,
      coldPct: Math.round(cold),
      bridgePct: Math.round(bridge),
      collateralPct: Math.round(collateral),
    }));

  const purgeAndReset = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STRATEGY_STORAGE_KEY);
      } catch (e) {}
    }
    setState({ ...defaultState, jurisdiction: detectJurisdiction() });
  };

  // Resolve selected lender data
  const selectedLender = lenders?.find((l) => l.id === state.selectedLenderId);
  const lenderApr = useMemo(() => {
    if (!selectedLender || !selectedLender.rateTiers) return 10;
    const loanSize = state.annualIncomeUsd * 3; // rough estimate for tier resolution
    for (const tier of selectedLender.rateTiers) {
      if (tier.maxLoanUsd === null || loanSize < tier.maxLoanUsd) return tier.aprPct;
    }
    return selectedLender.rateTiers[selectedLender.rateTiers.length - 1].aprPct;
  }, [selectedLender, state.annualIncomeUsd]);
  const lenderOrigFee = selectedLender?.originationFeePct ?? 1;

  // Apply scenario overrides to CAGR
  const effectiveCagr = useMemo(() => {
    if (state.riskScenario === "bear") return Math.max(-5, state.btcCagrPct - 15);
    if (state.riskScenario === "stagnation") return 2;
    return state.btcCagrPct;
  }, [state.riskScenario, state.btcCagrPct]);

  // Derive sat allocations
  const coldStackSats = Math.round((state.totalStackSats * state.coldPct) / 100);
  const bridgeStackSats = Math.round((state.totalStackSats * state.bridgePct) / 100);
  const collateralStackSats = Math.round((state.totalStackSats * state.collateralPct) / 100);

  // Run simulation
  const simulation = useMemo(
    () =>
      simulateStrategy({
        coldStackSats,
        bridgeStackSats,
        collateralStackSats,
        annualIncomeUsd: state.annualIncomeUsd,
        inflationPct: state.inflationPct,
        ltvPct: state.ltvPct,
        aprPct: lenderApr,
        originationFeePct: lenderOrigFee,
        btcCagrPct: effectiveCagr,
        years: state.years,
        btcSpotUsd,
        taxRatePct: TAX_JURISDICTIONS[state.jurisdiction]?.capGainsPct || 25,
      }),
    [
      coldStackSats, bridgeStackSats, collateralStackSats,
      state.annualIncomeUsd, state.inflationPct, state.ltvPct,
      lenderApr, lenderOrigFee, effectiveCagr, state.years,
      btcSpotUsd, state.jurisdiction,
    ]
  );

  const { snapshots, summary } = simulation;
  const finalSnap = snapshots[snapshots.length - 1];
  const jurisdiction = TAX_JURISDICTIONS[state.jurisdiction];

  // Chart data — convert USD to user's display currency
  const displayChartData = useMemo(() => {
    const rate = fxToUsd && fiatCurrency ? fxToUsd[fiatCurrency] || 1 : 1;
    return snapshots.map((s) => ({
      year: s.year,
      cold: s.coldStackUsd / rate,
      bridge: s.bridgeStackUsd / rate,
      collateral: s.collateralStackUsd / rate,
      debt: s.outstandingDebtUsd / rate,
      netWorth: s.netWorthUsd / rate,
      income: s.incomeWithdrawnUsd / rate,
    }));
  }, [snapshots, fxToUsd, fiatCurrency]);

  // Build heads-ups
  const headsups = [];
  if (summary.liquidationEverHit) {
    headsups.push({ tone: "danger", icon: "✕", text: "Strategy collapses: liquidation event in this scenario. Lower LTV, increase bridge stack, or assume higher CAGR." });
  } else if (summary.marginCallEverHit) {
    headsups.push({ tone: "warn", icon: "▲", text: "Strategy under stress: needed to consume bridge reserves to maintain loans. Higher cold storage allocation reduces this risk." });
  }
  if (summary.bridgeRunoutWarning) {
    headsups.push({ tone: "warn", icon: "↘", text: "Bridge stack nearly depleted by end of horizon. Consider larger bridge allocation or shorter time horizon." });
  }
  if (!summary.liquidationEverHit && !summary.marginCallEverHit && summary.totalWithdrawnUsd > state.annualIncomeUsd * state.years) {
    headsups.push({ tone: "good", icon: "✓", text: `Strategy intact across ${state.years} years. Sats sold: zero. Stack grew while delivering income.` });
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="strategy-page">
      <style>{STRATEGY_STYLES}</style>

      <div className="strategy-wrap">
        <a href="#" className="s-back">← Back to calculator</a>

        {/* HERO */}
        <header className="s-hero">
          <div className="s-eyebrow">The Strategy</div>
          <h1 className="s-h1">
            Stack &amp; <span className="accent">Borrow.</span>
          </h1>
          <p className="s-lede">
            Most people see "borrow against bitcoin" and picture a bank holding their stack. The smart version splits the stack — most of it stays in self-custody, untouched, while a small working portion does the borrowing. Done right, you never sell a single sat.
          </p>
        </header>

        {/* SECTION 1: THREE STACKS */}
        <section className="s-section">
          <h2 className="s-h2">
            <span className="num">01 · The premise</span>
            One stack, three roles.
          </h2>
          <p className="s-p">
            The first mistake people make is treating their bitcoin as a single, fungible pile. A serious strategy treats it as three distinct stacks with different jobs.
          </p>
          <StackVisualization />
          <p className="s-p">
            Cold storage is sacred. Bridge is your insurance against bad timing. Only working collateral interacts with a lender. <strong>This single mental shift</strong> is what makes the strategy psychologically possible for self-custody-first bitcoiners.
          </p>
        </section>

        <hr className="s-divider" />

        {/* SECTION 2: HOW IT WORKS */}
        <section className="s-section">
          <h2 className="s-h2">
            <span className="num">02 · The mechanic</span>
            Loop the loan. Live the difference.
          </h2>
          <p className="s-p">
            Each year, you take a loan against your working collateral. The loan covers your annual income <em>plus</em> repayment of last year's loan with interest. Because bitcoin appreciates faster than your interest rate, the new loan is comfortably larger than the old debt — and the difference is yours to live on.
          </p>
          <p className="s-p">
            You never sell sats. You never trigger a taxable event. You just refinance.
          </p>
          <p className="s-p">
            Discipline is the hard part: that annual lump sum needs to last twelve months. The mental model that works: <strong className="accent">treat it as your year's salary</strong>. Pay yourself monthly out of it. The rest sits as buying power — or, for the truly bitcoin-pilled, gets converted right back to BTC and lives in cold storage until the next month's draw.
          </p>
        </section>

        <hr className="s-divider" />

        {/* SECTION 3: THE SIMULATION */}
        <section className="s-section" id="simulation">
          <h2 className="s-h2">
            <span className="num">03 · The simulation</span>
            Play with the fourth dimension.
          </h2>
          <p className="s-p">
            Run your own numbers. The simulation models annual refinancing, BTC appreciation, your jurisdiction's tax treatment, and a realistic lender's actual rate tiers. Adjust anything. See where the strategy holds — and where it breaks.
          </p>

          <div className="sim">
            <div className="sim-grid">
              {/* LEFT: CONTROLS */}
              <div className="sim-controls">
                {/* STACK */}
                <div className="control-row">
                  <div className="sim-section-label">Your stack</div>
                  <div className="control-header">
                    <label className="control-label">Total bitcoin</label>
                    <span className="control-sub">{fmtUsd((state.totalStackSats / SATS_PER_BTC) * btcSpotUsd)}</span>
                  </div>
                  <NumInput
                    value={state.totalStackSats}
                    onChange={(v) => setField("totalStackSats", v)}
                    suffix="sats"
                  />
                </div>

                {/* ALLOCATION */}
                <div className="control-row">
                  <div className="sim-section-label">Allocation</div>
                  <AllocationControls
                    coldPct={state.coldPct}
                    bridgePct={state.bridgePct}
                    collateralPct={state.collateralPct}
                    onChange={setAllocation}
                  />
                </div>

                {/* INCOME */}
                <div className="control-row">
                  <div className="sim-section-label">Lifestyle</div>
                  <div className="control-header">
                    <label className="control-label">Annual income needed</label>
                    <span className="control-sub">{fmtFiatOutput ? fmtFiatOutput(state.annualIncomeUsd) : fmtUsdExact(state.annualIncomeUsd)}</span>
                  </div>
                  <NumInput
                    value={state.annualIncomeUsd}
                    onChange={(v) => setField("annualIncomeUsd", v)}
                    suffix="USD"
                  />
                </div>

                {/* LTV */}
                <div className="control-row">
                  <div className="control-header">
                    <label className="control-label">Loan-to-value</label>
                    <span className="control-value">{state.ltvPct}%</span>
                  </div>
                  <input
                    className="slider-s"
                    type="range" min={10} max={50} step={1}
                    value={state.ltvPct}
                    onChange={(e) => setField("ltvPct", parseFloat(e.target.value))}
                  />
                </div>

                {/* CAGR */}
                <div className="control-row">
                  <div className="control-header">
                    <label className="control-label">BTC growth (CAGR)</label>
                    <span className="control-value">{state.btcCagrPct}%/yr</span>
                  </div>
                  <input
                    className="slider-s"
                    type="range" min={-10} max={60} step={1}
                    value={state.btcCagrPct}
                    onChange={(e) => setField("btcCagrPct", parseFloat(e.target.value))}
                  />
                </div>

                {/* HORIZON */}
                <div className="control-row">
                  <div className="control-header">
                    <label className="control-label">Horizon</label>
                    <span className="control-value">{state.years} yr</span>
                  </div>
                  <input
                    className="slider-s"
                    type="range" min={1} max={40} step={1}
                    value={state.years}
                    onChange={(e) => setField("years", parseInt(e.target.value))}
                  />
                </div>

                {/* LENDER */}
                <div className="control-row">
                  <div className="sim-section-label">Lender</div>
                  <select
                    className="num-input-s"
                    style={{ width: "100%", color: "#fff" }}
                    value={state.selectedLenderId}
                    onChange={(e) => setField("selectedLenderId", e.target.value)}
                  >
                    {(lenders || [])
                      .filter((l) => LENDER_COMPATIBILITY[l.id]?.grade !== "—")
                      .map((l) => (
                        <option key={l.id} value={l.id} style={{ background: "#0a0a0b" }}>
                          {l.name} — S&B-grade {LENDER_COMPATIBILITY[l.id]?.grade || "?"}
                        </option>
                      ))}
                  </select>
                  <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)", marginTop: "0.5rem" }}>
                    Using {lenderApr.toFixed(2)}% APR, {lenderOrigFee}% origination
                  </div>
                </div>

                {/* JURISDICTION */}
                <div className="control-row">
                  <div className="sim-section-label">Jurisdiction</div>
                  <JurisdictionTabs
                    value={state.jurisdiction}
                    onChange={(v) => setField("jurisdiction", v)}
                  />
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <button className="purge-btn" onClick={purgeAndReset}>
                    ⌫ Purge state
                  </button>
                </div>
              </div>

              {/* RIGHT: OUTPUT */}
              <div className="sim-output">
                {/* HEADLINE RESULTS */}
                <div className="results-grid">
                  <div className="result-card feature">
                    <div className="result-label">After {state.years} years</div>
                    <div className="result-value zero featured">{fmtSats(summary.satsSold)} sold</div>
                    <div className="result-sub">
                      Total drawn: <strong style={{ color: "#fff" }}>{fmtFiatOutput ? fmtFiatOutput(summary.totalWithdrawnUsd) : fmtUsdExact(summary.totalWithdrawnUsd)}</strong> in life expenses without selling a single sat
                    </div>
                  </div>

                  <div className="result-card">
                    <div className="result-label">Final stack</div>
                    <div className="result-value">{fmtSats(summary.finalStackSats)}</div>
                    <div className="result-sub">
                      Worth {fmtFiatOutput ? fmtFiatOutput(summary.finalStackUsd) : fmtUsdExact(summary.finalStackUsd)}
                    </div>
                  </div>

                  <div className="result-card">
                    <div className="result-label">Net worth (stack − debt)</div>
                    <div className="result-value">{fmtFiatOutput ? fmtFiatOutput(summary.finalNetWorthUsd) : fmtUsdExact(summary.finalNetWorthUsd)}</div>
                    <div className="result-sub">
                      Outstanding debt: {fmtFiatOutput ? fmtFiatOutput(summary.finalDebtUsd) : fmtUsdExact(summary.finalDebtUsd)}
                    </div>
                  </div>
                </div>

                {/* HEADSUPS */}
                {headsups.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {headsups.map((h, i) => (
                      <div key={i} className={`headsup-s ${h.tone === "danger" ? "hs-danger" : h.tone === "warn" ? "hs-warn" : "hs-good"}`}>
                        <span className="headsup-s-icon">{h.icon}</span>
                        <span>{h.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* MAIN CHART: stacked area of three stacks over time */}
                <div className="chart-container">
                  <div className="chart-title">Stack value vs debt</div>
                  <div className="chart-sub">Three stacks compound while debt grows linearly. The gap is your net worth.</div>
                  <div style={{ height: "16rem" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={displayChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                        <XAxis
                          dataKey="year"
                          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10, fontFamily: "Geist Mono" }}
                          tickLine={false}
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                          label={{ value: "years", position: "insideBottom", offset: -2, style: { fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Geist Mono" } }}
                        />
                        <YAxis
                          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10, fontFamily: "Geist Mono" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => {
                            if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
                            if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
                            if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
                            return Math.round(v);
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0f0f10",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 12,
                            fontFamily: "Geist Mono",
                            fontSize: 11,
                          }}
                          labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                          formatter={(v, n) => {
                            const label = { cold: "Cold", bridge: "Bridge", collateral: "Collateral", debt: "Debt" }[n] || n;
                            return [fmtFiatOutput ? fmtFiatOutput(v * (fxToUsd?.[fiatCurrency] || 1)) : fmtUsdExact(v), label];
                          }}
                          labelFormatter={(y) => `Year ${y}`}
                        />
                        <Area type="monotone" dataKey="cold" stackId="1" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="bridge" stackId="1" stroke="#f7931a" fill="#f7931a" fillOpacity={0.55} />
                        <Area type="monotone" dataKey="collateral" stackId="1" stroke="#6ee7b7" fill="#6ee7b7" fillOpacity={0.55} />
                        <Line type="monotone" dataKey="debt" stroke="#fca5a5" strokeWidth={2} strokeDasharray="4 3" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.625rem", color: "rgba(255,255,255,0.6)", flexWrap: "wrap", fontFamily: "'Geist Mono', monospace" }}>
                    <span><span style={{ display: "inline-block", width: "0.5rem", height: "0.5rem", background: "#38bdf8", borderRadius: "50%", marginRight: "0.375rem" }} />Cold</span>
                    <span><span style={{ display: "inline-block", width: "0.5rem", height: "0.5rem", background: "#f7931a", borderRadius: "50%", marginRight: "0.375rem" }} />Bridge</span>
                    <span><span style={{ display: "inline-block", width: "0.5rem", height: "0.5rem", background: "#6ee7b7", borderRadius: "50%", marginRight: "0.375rem" }} />Collateral</span>
                    <span><span style={{ display: "inline-block", width: "0.5rem", height: "0.5rem", background: "#fca5a5", borderRadius: "50%", marginRight: "0.375rem" }} />Outstanding debt</span>
                  </div>
                </div>

                {/* TAX CALLOUT */}
                <div className="tax-callout">
                  <div className="tax-callout-title">{jurisdiction.name} · {jurisdiction.capGainsPct}% cap gains</div>
                  <div className="tax-callout-body">{jurisdiction.note}</div>
                </div>

                {/* RISK SCENARIOS */}
                <div>
                  <div className="sim-section-label" style={{ marginBottom: "0.5rem" }}>Stress test</div>
                  <div className="risk-tabs">
                    <button
                      className={`risk-tab ${state.riskScenario === "base" ? "active" : ""}`}
                      onClick={() => setField("riskScenario", "base")}
                    >
                      Base case
                    </button>
                    <button
                      className={`risk-tab ${state.riskScenario === "bear" ? "active" : ""}`}
                      onClick={() => setField("riskScenario", "bear")}
                    >
                      Bear market (-15% CAGR)
                    </button>
                    <button
                      className={`risk-tab ${state.riskScenario === "stagnation" ? "active" : ""}`}
                      onClick={() => setField("riskScenario", "stagnation")}
                    >
                      Stagnation (2% CAGR)
                    </button>
                  </div>
                  <p className="s-p" style={{ fontSize: "0.8125rem", margin: 0 }}>
                    Effective CAGR in use: <strong className="accent">{effectiveCagr}%</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="s-divider" />

        {/* SECTION 4: LENDER COMPATIBILITY */}
        <section className="s-section">
          <h2 className="s-h2">
            <span className="num">04 · Lender compatibility</span>
            S&amp;B-grade.
          </h2>
          <p className="s-p">
            Not every lender is built for this. The strategy depends on <strong>reliable refinancing</strong> — and lender terms vary wildly on that exact point. Here's how each lender we list scores against the strategy's needs.
          </p>
          <table className="grade-table">
            <thead>
              <tr>
                <th style={{ width: "5rem" }}>Grade</th>
                <th>Lender</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {(lenders || []).map((l) => {
                const compat = LENDER_COMPATIBILITY[l.id];
                if (!compat) return null;
                const gradeClass =
                  compat.grade === "—" ? "none" :
                  compat.grade === "B+" ? "Bp" :
                  compat.grade;
                return (
                  <tr key={l.id}>
                    <td><span className={`grade-badge ${gradeClass}`}>{compat.grade}</span></td>
                    <td><span className="lender-name">{l.name}</span></td>
                    <td><span className="reason">{compat.reason}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="s-p" style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)" }}>
            No lender on this list currently offers an unconditional, open-ended line of credit — which is why no one earns an A grade. The strategy works with B-grade lenders, but it requires you to actively manage rollover each year. If the market evolves to offer A-grade options, this page will reflect it.
          </p>
        </section>

        <hr className="s-divider" />

        {/* SECTION 5: RISKS */}
        <section className="s-section">
          <h2 className="s-h2">
            <span className="num">05 · The honest risks</span>
            What can break this.
          </h2>
          <p className="s-p">
            The strategy works on three assumptions. Each one can fail, and each failure mode has its own remedy. Understanding all three is the price of admission.
          </p>
          <ol className="s-p" style={{ paddingLeft: "1.25rem" }}>
            <li style={{ marginBottom: "0.875rem" }}>
              <strong>Bitcoin appreciates faster than your interest rate.</strong> Historically true at the multi-year scale, but a deep 5-year bear market can break the refinance loop. <span className="accent">Remedy: bigger bridge stack, lower LTV.</span>
            </li>
            <li style={{ marginBottom: "0.875rem" }}>
              <strong>Your lender stays solvent.</strong> BlockFi, Celsius, Genesis all died in 2022. The lenders today are different (no rehypothecation, regulated, real custody) — but counterparty risk over decades is real. <span className="accent">Remedy: diversify lenders, prefer multisig custody.</span>
            </li>
            <li>
              <strong>You can roll over each year.</strong> Most lenders allow it; none formally guarantee it across decades. <span className="accent">Remedy: keep relationships with 2+ lenders, monitor terms quarterly.</span>
            </li>
          </ol>
        </section>

        {/* CTA BACK TO CALCULATOR */}
        <div className="cta-calc">
          <div className="cta-calc-title">Ready to run real numbers?</div>
          <div className="cta-calc-desc">
            The strategy above zooms out over decades. The calculator zooms in on a single loan — your loan. Same math, sharper focus.
          </div>
          <a href="#" className="cta-calc-btn">Open the calculator →</a>
        </div>
      </div>
    </div>
  );
}
