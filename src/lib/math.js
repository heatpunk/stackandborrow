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
  // All multisig sub-kinds (taproot-vault / dlc / collab-multisig) share 0pp
  // by design — the premium prices rehyp/pooled-custody failure modes, not
  // crypto-design maturity. See METHOD in Lenders.jsx.
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
        // Each lender's `country` field must list explicit regions — there is
        // no `"global"` shortcut. A genuinely worldwide lender is expected
        // to enumerate every supported region (us, ca, eu, uk, ch, au, jp).
        if (!l.country) return true;
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
      // Some lenders (e.g. Xapo Bank) gate loans behind an annual
      // membership. Pro-rate it over the loan term so it folds into
      // totalCost honestly — it's a real out-of-pocket cost, not a risk-
      // adjustment, and we want apples-to-apples comparisons.
      const annualMembershipUsd = l.annualMembershipUsd ?? 0;
      const membershipFeeUsd = annualMembershipUsd * (termMonths / 12);
      const totalCost = interest + origFeeUsd + membershipFeeUsd;
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
        annualMembershipUsd,
        membershipFeeUsd,
        totalCost,
        custodyPremiumPct,
        custodyPremiumUsd,
        adjustedTotalCost,
        adjustedApr,
        isTiered: (l.rateTiers || []).length > 1,
      };
    })
    .sort((a, b) => {
      // Hard tier 1: lenders that pay out in real fiat rank above those that
      // only pay out in stablecoins (USDC/USDT/etc). Stablecoins are crypto
      // tokens, not bank-deliverable cash — for most borrowers needing money
      // in their bank account they require an extra off-ramp step, so we
      // demote them in the default ranking. Anyone who genuinely wants
      // stablecoin output can still see them lower in the list.
      const aFiat = a.payoutType !== 'stablecoin';
      const bFiat = b.payoutType !== 'stablecoin';
      if (aFiat !== bFiat) return aFiat ? -1 : 1;
      // Hard tier 2: BTC-only lenders always rank above multi-collateral.
      const aBtc = a.btcOnly === true;
      const bBtc = b.btcOnly === true;
      if (aBtc !== bBtc) return aBtc ? -1 : 1;
      // Within tier: adjusted cost (custody-risk weighted).
      return a.adjustedTotalCost - b.adjustedTotalCost;
    });
}
