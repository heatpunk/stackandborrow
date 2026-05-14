// ============================================================
// MATH — the loan-math primitives. Pure, no React. Ported from
// the original App.jsx so behavior is identical.
// ============================================================

import { SATS_PER_BTC } from './format.js';

export { SATS_PER_BTC };

// Simple interest over a fractional-year term.
export const computeInterest = (principalUsd, aprPct, termMonths) =>
  principalUsd * (aprPct / 100) * (termMonths / 12);

// Naive CAGR projection — used for back-of-envelope scenario math.
export const projectBtcPrice = (currentPrice, cagrPct, years) =>
  currentPrice * Math.pow(1 + cagrPct / 100, years);

// At what BTC price does the loan hit liqLtv (default 80%)?
// loan / (collateral × liqLtv) = liquidation price
export const computeLiquidationPrice = (loanUsd, collateralBtc, liqLtvPct = 80) =>
  loanUsd / (collateralBtc * (liqLtvPct / 100));

// Convert a currency-denominated value into USD for internal math.
export function toUsd(val, currency, currencyMeta, btcSpotUsd) {
  if (currency === 'SAT') return (val / SATS_PER_BTC) * btcSpotUsd;
  return val * currencyMeta[currency].fxToUsd;
}

// Convert USD back into a display value (without the symbol).
export function usdTo(usd, currency, currencyMeta, btcSpotUsd) {
  if (currency === 'SAT') return (usd / btcSpotUsd) * SATS_PER_BTC;
  return usd / currencyMeta[currency].fxToUsd;
}

// Resolve which rate-tier applies for a given loan size.
// Tiers ascend by maxLoanUsd; `null` = "and above". Falls back to
// the last tier if loan exceeds the table. Mirrors original App.jsx.
export function resolveTier(lender, loanUsd) {
  const tiers = lender.rateTiers || [];
  if (tiers.length === 0) {
    return { aprPct: 10, originationFeePct: lender.originationFeePct ?? 0 };
  }
  for (const t of tiers) {
    if (t.maxLoanUsd === null || loanUsd < t.maxLoanUsd) {
      return {
        aprPct: t.aprPct,
        originationFeePct: t.originationFeePct !== undefined
          ? t.originationFeePct
          : lender.originationFeePct ?? 0,
      };
    }
  }
  const last = tiers[tiers.length - 1];
  return {
    aprPct: last.aprPct,
    originationFeePct: last.originationFeePct !== undefined
      ? last.originationFeePct
      : lender.originationFeePct ?? 0,
  };
}

// Custody risk premium (pp APR). Additive across three independent axes:
// custodyType base + rehypothecation surcharge + multi-collateral surcharge.
// Baseline (0pp) = multisig + no rehyp + BTC-only. Reflects counterparty risk
// that isn't priced into the nominal APR. See methodology in Lenders.jsx.
export function custodyRiskPremiumPct(lender) {
  const base = { multisig: 0.0, 'custodial-mixed': 0.5, custodial: 1.0 };
  const rehypSurcharge = { no: 0.0, optional: 1.5, yes: 3.0 };
  const altcoinSurcharge = lender.btcOnly === true ? 0.0 : 0.5;
  const b = base[lender.custodyType] ?? 1.0;
  const r = rehypSurcharge[lender.rehypothecation] ?? 1.5;
  return b + r + altcoinSurcharge;
}

// Rank lenders for a given loan + region. Total cost = interest + origination,
// plus a custody-risk premium that captures counterparty risk not priced into APR.
// Optionally apply a per-region rate adjustment (some lenders charge more
// outside their home market).
// When `eligibleOnly` is false (directory mode), every lender is scored and
// sorted; eligibility filters are skipped so the list is not region/LTV/min-loan gated.
export function rankLenders(allLenders, { loanUsd, region, ltvPct, termMonths, eligibleOnly = true }) {
  let list = allLenders;
  if (eligibleOnly) {
    list = allLenders
      .filter((l) => {
        if (!l.country) return true;
        if (l.country.includes('global')) return true;
        if (region === 'us' && l.country.includes('us')) return true;
        if (region === 'ca' && l.country.includes('ca')) return true;
        if (region === 'eu' && l.country.includes('eu')) return true;
        if (region === 'ch' && (l.country.includes('ch') || l.country.includes('eu'))) return true;
        if (region === 'uk' && (l.country.includes('uk') || l.country.includes('eu'))) return true;
        if (region === 'au' && l.country.includes('au')) return true;
        if (region === 'jp' && l.country.includes('jp')) return true;
        return false;
      })
      .filter((l) => loanUsd >= (l.minLoanUsd ?? 0) && ltvPct <= (l.maxLtv ?? 100));
  }
  return list
    .map((l) => {
      const { aprPct, originationFeePct } = resolveTier(l, loanUsd);
      const regional = l.regionalRateAdjustment
        ? (l.regionalRateAdjustment[region] ?? l.regionalRateAdjustment.default ?? 0)
        : 0;
      const feeApplies = !(l.feeWaivedFor || []).includes(region);
      const effectiveOrigFee = feeApplies ? originationFeePct : 0;
      const effectiveApr = aprPct + regional + effectiveOrigFee;
      const interest = computeInterest(loanUsd, aprPct + regional, termMonths);
      const origFeeUsd = loanUsd * (effectiveOrigFee / 100);
      const totalCost = interest + origFeeUsd;
      const custodyPremiumPct = custodyRiskPremiumPct(l);
      const custodyPremiumUsd = loanUsd * (custodyPremiumPct / 100) * (termMonths / 12);
      const adjustedTotalCost = totalCost + custodyPremiumUsd;
      const adjustedApr = effectiveApr + custodyPremiumPct;
      return {
        ...l,
        apr: aprPct + regional,
        baseApr: aprPct,
        regionalAdjustment: regional,
        originationFeePctEffective: effectiveOrigFee,
        effectiveApr,
        interest,
        origFeeUsd,
        totalCost,
        custodyPremiumPct,
        custodyPremiumUsd,
        adjustedTotalCost,
        adjustedApr,
        isTiered: (l.rateTiers || []).length > 1,
      };
    })
    .sort((a, b) => a.adjustedTotalCost - b.adjustedTotalCost);
}
