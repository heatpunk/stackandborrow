// ============================================================
// LANDING PAGE — receipt-style overview that doubles as a
// micro-calculator. Amount + currency are editable; collateral,
// APR, interest, liquidation price and net-sats-kept all recompute
// live. State persists to the same localStorage keys as Calculator
// so jumping between the two preserves the user's scenario.
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  SB,
  CURRENCY_META,
  CURRENCY_STEP,
  LTV_PCT,
  LIQ_LTV_PCT,
  TERM_MONTHS,
} from '../system/tokens.js';
import {
  PaperFrame,
  BrandHeader,
  DashedRule,
  Row,
  Stamp,
  Pill,
  Button,
  PageNav,
  FineFooter,
  LivePriceBadge,
} from '../system/components.jsx';
import { useIsDesktop } from '../system/theme.jsx';
import { DesktopSpreadFrame } from '../system/desktop.jsx';
import { usePersistentState } from '../lib/hooks.js';
import {
  computeInterest,
  computeLiquidationPrice,
  rankLenders,
  toUsd,
  usdTo,
  SATS_PER_BTC,
} from '../lib/math.js';
import { fmtNum, fmtMoney } from '../lib/format.js';
import { useT } from '../i18n/index.jsx';

// Currencies shown as chips. Mirrors the design's
// "also EUR · GBP · SEK · SAT" hint, but clickable.
const CHIP_CURRENCIES = ['USD', 'EUR', 'GBP', 'SEK', 'SAT'];

// Booklet feature list — keys map to landing.feature.<id>.{title,subMobile,subDesktop}.
const FEATURE_IDS = ['ranking', 'tax', 'projection', 'liquidation'];
const FEATURE_NUMERALS = ['I.', 'II.', 'III.', 'IV.'];

// Rotating pull quote shown in the "FROM THE FIELD" card. Quotes stay in
// English in every locale by design. A fresh quote is picked per mount;
// the last index is stored in localStorage so consecutive page loads
// never repeat the same one.
const FIELD_QUOTES = [
  { text: 'Stay humble and stack sats.',                                                                                attribution: 'MATT ODELL' },
  { text: 'Bitcoin is hope.',                                                                                            attribution: 'MICHAEL SAYLOR' },
  { text: 'Not your keys, not your coins.',                                                                              attribution: 'ANDREAS ANTONOPOULOS' },
  { text: 'Running bitcoin.',                                                                                            attribution: 'HAL FINNEY · 2009' },
  { text: 'Bitcoin is the hardest money ever invented.',                                                                 attribution: 'SAIFEDEAN AMMOUS' },
  { text: 'If you don’t believe me or don’t get it, I don’t have time to try to convince you, sorry.',    attribution: 'SATOSHI NAKAMOTO' },
  { text: 'Bitcoin changes absolutely everything.',                                                                      attribution: 'JACK DORSEY' },
  { text: 'Lost coins only make everyone else’s coins worth slightly more. Think of it as a donation to everyone.', attribution: 'SATOSHI NAKAMOTO' },
  { text: 'Selling triggers tax. Borrowing doesn’t. That’s not a loophole — that’s the whole point.', attribution: 'A LONG-TERM HOLDER · NAME WITHHELD' },
  { text: 'Stack sats. Borrow dollars. Never the reverse.',                                                              attribution: 'A PATIENT STACKER · NAME WITHHELD' },
  { text: 'Your bitcoin doesn’t need to leave your wallet to work for you.',                                        attribution: 'FROM THE FIELD' },
  { text: 'Selling bitcoin to buy a house is cutting up the goose for one more egg.',                                    attribution: 'A LONG-TERM HOLDER' },
  { text: 'The bank rents me dollars. I keep the bitcoin.',                                                              attribution: 'A PRACTICAL MAXI' },
  { text: '1 BTC = 1 BTC. The denominator is what changes.',                                                             attribution: 'ANONYMOUS HOLDER' },
  { text: 'Time in bitcoin beats timing bitcoin. Loans bridge the gap.',                                                 attribution: 'NAME WITHHELD' },
];

// Pick a uniformly random index that differs from the last one shown.
// Reads/writes the last index from localStorage so the no-repeat rule
// survives page reloads.
function pickFieldQuoteIndex() {
  if (typeof window === 'undefined') return 0;
  let lastIdx = -1;
  try {
    const stored = window.localStorage.getItem('stackandborrow:lastQuoteIdx');
    if (stored !== null) lastIdx = parseInt(stored, 10);
  } catch (e) { /* storage disabled */ }

  let nextIdx;
  if (FIELD_QUOTES.length <= 1 || lastIdx < 0 || lastIdx >= FIELD_QUOTES.length) {
    nextIdx = Math.floor(Math.random() * FIELD_QUOTES.length);
  } else {
    // Pick uniformly from the (N - 1) indices that aren't lastIdx.
    nextIdx = Math.floor(Math.random() * (FIELD_QUOTES.length - 1));
    if (nextIdx >= lastIdx) nextIdx++;
  }

  try {
    window.localStorage.setItem('stackandborrow:lastQuoteIdx', String(nextIdx));
  } catch (e) { /* storage disabled */ }

  return nextIdx;
}

export default function LandingPage({ live, lenders = [], region, initialCurrency }) {
  const isDesktop = useIsDesktop();
  const t = useT();
  const [currency, setCurrency]           = usePersistentState('currency', initialCurrency || 'USD');
  const [loanInCurrency, setLoanInCurrency] = usePersistentState('desiredLoan', 50000);
  const [showSaveTip, setShowSaveTip]     = useState(false);
  const [fieldQuoteIdx]                   = useState(pickFieldQuoteIndex);
  const fieldQuote = FIELD_QUOTES[fieldQuoteIdx];

  const btcSpotUsd = live?.btcUsd || 100000;
  const meta = CURRENCY_META[currency];

  // ===== DERIVED =====
  const loanUsd = toUsd(loanInCurrency, currency, CURRENCY_META, btcSpotUsd);
  const collateralUsd = loanUsd / (LTV_PCT / 100);
  const collateralBtc = collateralUsd / btcSpotUsd;
  const collateralSats = Math.round(collateralBtc * SATS_PER_BTC);
  const liqUsd = collateralBtc > 0
    ? computeLiquidationPrice(loanUsd, collateralBtc, LIQ_LTV_PCT)
    : 0;
  const liqDropPct = ((btcSpotUsd - liqUsd) / btcSpotUsd) * 100;

  // ===== BEST LENDER =====
  const ranked = useMemo(() =>
    rankLenders(lenders, {
      loanUsd,
      region: region || 'global',
      ltvPct: LTV_PCT,
      termMonths: TERM_MONTHS,
    }),
    [lenders, loanUsd, region]
  );
  const bestLender = ranked[0];
  const aprPct = bestLender?.apr ?? 10;
  const interestUsd = computeInterest(loanUsd, aprPct, TERM_MONTHS);
  const origFeeUsd = bestLender?.origFeeUsd ?? 0;

  // ===== TAX-AWARE SELL PATH =====
  const taxRate = meta.taxRate;
  const taxMul = 1 - taxRate / 100;
  const grossSaleUsd = taxMul > 0 ? loanUsd / taxMul : loanUsd;
  const satsToSell = Math.round((grossSaleUsd / btcSpotUsd) * SATS_PER_BTC);

  // ===== HANDLERS =====
  const pickCurrency = useCallback((next) => {
    if (next === currency) return;
    const usd = toUsd(loanInCurrency, currency, CURRENCY_META, btcSpotUsd);
    const newVal = usdTo(usd, next, CURRENCY_META, btcSpotUsd);
    const m = CURRENCY_META[next];
    const s = CURRENCY_STEP[next] || 1000;
    const clamped = Math.max(m.minLoan, Math.min(m.maxLoan, Math.round(newVal / s) * s));
    setLoanInCurrency(clamped);
    setCurrency(next);
  }, [currency, loanInCurrency, btcSpotUsd, setCurrency, setLoanInCurrency]);

  const cycleCurrency = useCallback(() => {
    const keys = Object.keys(CURRENCY_META);
    const next = keys[(keys.indexOf(currency) + 1) % keys.length];
    pickCurrency(next);
  }, [currency, pickCurrency]);

  const onAmountChange = useCallback((e) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    if (cleaned === '') { setLoanInCurrency(0); return; }
    const n = Number(cleaned);
    if (!isNaN(n)) setLoanInCurrency(n);
  }, [setLoanInCurrency]);

  if (isDesktop) {
    return (
      <DesktopLandingLayout
        live={live}
        currency={currency}
        meta={meta}
        loanInCurrency={loanInCurrency}
        onAmountChange={onAmountChange}
        pickCurrency={pickCurrency}
        cycleCurrency={cycleCurrency}
        collateralBtc={collateralBtc}
        collateralSats={collateralSats}
        aprPct={aprPct}
        bestLender={bestLender}
        interestUsd={interestUsd}
        origFeeUsd={origFeeUsd}
        liqUsd={liqUsd}
        liqDropPct={liqDropPct}
        satsToSell={satsToSell}
        ranked={ranked}
        showSaveTip={showSaveTip}
        setShowSaveTip={setShowSaveTip}
        btcSpotUsd={btcSpotUsd}
        fieldQuote={fieldQuote}
      />
    );
  }

  return (
    <PaperFrame>
      <style>{`
        @keyframes lp-caret { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
        .lp-amount-input {
          background: transparent;
          border: none;
          outline: none;
          padding: 0;
          margin: 0;
          font-family: ${SB.serif};
          font-size: 46px;
          font-weight: 600;
          color: ${SB.ink};
          letter-spacing: -0.025em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          width: 100%;
          min-width: 0;
          text-align: center;
          caret-color: ${SB.orange};
        }
        .lp-amount-input::placeholder { color: ${SB.inkFaint}; }
        .lp-amount-input:focus { caret-color: ${SB.orange}; }
        .lp-tiny-link {
          background: transparent; border: none; padding: 0;
          font: inherit; color: inherit; letter-spacing: inherit;
          cursor: pointer; text-decoration: underline;
          text-decoration-color: ${SB.inkFaint};
          text-underline-offset: 3px;
        }
        .lp-tiny-link:hover { color: ${SB.orange}; }
      `}</style>

      <BrandHeader
        currentPage="I"
        pageOf="IV"
        rightSlot={
          <LivePriceBadge
            btcUsd={live?.btcUsd}
            loading={live?.loading}
            error={live?.error}
            onRefresh={live?.refresh}
          />
        }
      />

      {/* HERO */}
      <div style={{ position: 'relative', marginTop: 4 }}>
        <div style={{
          fontFamily: SB.mono,
          fontSize: 9, letterSpacing: '0.22em',
          color: SB.inkMute,
          fontWeight: 700,
          marginBottom: 10,
        }}>
          {t('landing.meta.eyebrow')}
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: SB.serif,
          fontSize: 36, fontWeight: 600,
          lineHeight: 1.02,
          letterSpacing: '-0.025em',
          color: SB.ink,
        }}>
          {t('landing.hero.titleLine1')}<br />
          <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>{t('landing.hero.titleLine2')}</span>
        </h1>
        <div style={{
          fontFamily: SB.sans,
          fontSize: 13, lineHeight: 1.55,
          color: SB.inkSoft,
          marginTop: 14,
          maxWidth: 320,
          textWrap: 'pretty',
        }}>
          {t('landing.hero.subtitleMobile')}
        </div>

        {/* Stamp */}
        <div style={{ position: 'absolute', top: -6, right: -6 }}>
          <Stamp line1={t('landing.heroStamp.line1')} line2={t('landing.heroStamp.line2')} size={82} />
        </div>
      </div>

      <DashedRule />

      {/* Amount input — editable */}
      <div style={{
        padding: '14px 14px 14px',
        background: SB.orangeWash,
        border: `1.5px dashed ${SB.orangeSoft}`,
      }}>
        <div style={{
          fontFamily: SB.mono,
          fontSize: 9, letterSpacing: '0.22em',
          color: SB.orange, fontWeight: 700,
        }}>
          {t('landing.amount.label')}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          marginTop: 8,
        }}>
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {meta.position === 'pre' && (
              <span style={{
                fontFamily: SB.serif,
                fontSize: 32, fontWeight: 400,
                color: SB.inkMute,
                lineHeight: 1,
                flexShrink: 0,
              }}>
                {meta.symbol}
              </span>
            )}
            <input
              className="lp-amount-input"
              type="text"
              inputMode="numeric"
              aria-label={t('landing.amount.inputLabel')}
              value={fmtNum(loanInCurrency)}
              onChange={onAmountChange}
              onFocus={(e) => e.target.select()}
            />
            {meta.position === 'post' && (
              <span style={{
                fontFamily: SB.mono,
                fontSize: 16, fontWeight: 500,
                color: SB.inkMute, marginLeft: 4,
                flexShrink: 0,
              }}>
                {meta.symbol}
              </span>
            )}
          </div>
          <button onClick={cycleCurrency} style={{
            background: 'transparent',
            border: `1.5px solid ${SB.ink}`,
            padding: '4px 10px',
            fontFamily: SB.mono,
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em',
            color: SB.ink,
            cursor: 'pointer',
            flexShrink: 0,
          }}>
            {meta.label} ▾
          </button>
        </div>

        {/* Currency chips */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 12, paddingTop: 10,
          borderTop: `1px dotted ${SB.inkLine}`,
          flexWrap: 'wrap',
        }}>
          <span style={{
            background: SB.ink, color: SB.cream,
            padding: '2px 6px', letterSpacing: '0.18em',
            fontWeight: 700, fontSize: 8.5,
            fontFamily: SB.mono,
          }}>{t('landing.amount.editChip')}</span>
          {CHIP_CURRENCIES.map((c) => {
            const isActive = c === currency;
            return (
              <button
                key={c}
                onClick={() => pickCurrency(c)}
                style={{
                  background: isActive ? SB.ink : 'transparent',
                  color: isActive ? SB.cream : SB.inkSoft,
                  border: `1px solid ${isActive ? SB.ink : SB.inkLine}`,
                  padding: '2px 8px',
                  fontFamily: SB.mono,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  lineHeight: 1.4,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <DashedRule label={t('landing.section.estimate')} />

      {/* Itemized — all live */}
      <div style={{ padding: '0 2px' }}>
        <Row
          label={t('landing.row.collateral')}
          value={collateralBtc.toFixed(5) + ' BTC'}
          sub={'≈ ' + fmtNum(collateralSats) + ' sats'}
        />
        <Row label={t('landing.row.ltv')} value={LTV_PCT + '%'} sub={t('landing.row.ltvSub')} />
        <Row
          label={t('landing.row.apr')}
          value={aprPct.toFixed(2) + '%'}
          valueStyle={{ color: SB.orange }}
          sub={t('landing.row.aprSub', { months: TERM_MONTHS })}
        />
        <Row
          label={t('landing.row.interest', { months: TERM_MONTHS })}
          value={fmtMoney(interestUsd, currency, CURRENCY_META, btcSpotUsd)}
          sub={t('landing.row.interestSub')}
        />
        <Row
          label={t('landing.row.origination')}
          value={fmtMoney(origFeeUsd, currency, CURRENCY_META, btcSpotUsd)}
          sub={origFeeUsd > 0 ? t('landing.row.origSubOnce') : t('landing.row.origSubWaived')}
        />
        <Row
          label={t('landing.row.liquidation')}
          value={'$' + fmtNum(liqUsd)}
          valueStyle={{ color: SB.rust }}
          sub={t('landing.row.liquidationSub', { pct: Math.abs(liqDropPct).toFixed(1) })}
        />
      </div>

      <DashedRule label={t('landing.section.subtotal')} />

      <div style={{ padding: '0 2px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '4px 0', fontSize: 11.5,
        }}>
          <span style={{ color: SB.inkSoft }}>{t('landing.subtotal.total', { months: TERM_MONTHS })}</span>
          <span style={{ fontFamily: SB.mono, fontWeight: 700, color: SB.ink }}>
            {fmtMoney(interestUsd + origFeeUsd, currency, CURRENCY_META, btcSpotUsd)}
          </span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '4px 0', fontSize: 11.5,
        }}>
          <span style={{ color: SB.inkSoft }}>{t('landing.subtotal.satsSold')}</span>
          <span style={{ fontFamily: SB.mono, fontWeight: 700, color: SB.orange }}>
            −{fmtNum(satsToSell)}
          </span>
        </div>

        {/* NET SATS KEPT — dashed orange stamp box */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 12px 12px',
          marginTop: 10,
          border: `1.5px dashed ${SB.orange}`,
          background: SB.orangeWash,
        }}>
          <span style={{
            fontFamily: SB.mono,
            fontSize: 10.5, letterSpacing: '0.2em',
            fontWeight: 700,
            color: SB.orange,
          }}>{t('landing.subtotal.netLabel')}</span>
          <span style={{
            fontFamily: SB.serif,
            fontSize: 22, fontWeight: 600,
            color: SB.ink,
            letterSpacing: '-0.015em',
          }}>+{fmtNum(satsToSell)}</span>
        </div>
      </div>

      <DashedRule />

      <Button href="/calculator">{t('landing.cta.fullBreakdown')}</Button>

      {/* Tiny action links */}
      <div style={{
        position: 'relative',
        textAlign: 'center', marginTop: 8,
        fontFamily: SB.mono,
        fontSize: 9, letterSpacing: '0.16em',
        color: SB.inkMute,
      }}>
        <a href="/calculator" className="lp-tiny-link">{t('landing.tiny.calculator')}</a>
        <span style={{ margin: '0 6px' }}>·</span>
        <a href="/lenders" className="lp-tiny-link">{t('landing.tiny.lender')}</a>
        <span style={{ margin: '0 6px' }}>·</span>
        <button
          className="lp-tiny-link"
          onClick={() => setShowSaveTip((v) => !v)}
        >{t('landing.tiny.save')}</button>

        {showSaveTip && (
          <SaveScenarioTip onClose={() => setShowSaveTip(false)} />
        )}
      </div>

      {/* What's included — line-item style */}
      <DashedRule label={t('landing.section.booklet')} />
      <div style={{ padding: '4px 2px' }}>
        {FEATURE_IDS.map((id, i) => (
          <div key={id} style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr auto',
            alignItems: 'baseline',
            gap: 8,
            padding: '8px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <span style={{
              fontFamily: SB.serif, fontStyle: 'italic',
              fontSize: 14, color: SB.orange, fontWeight: 500,
            }}>{FEATURE_NUMERALS[i]}</span>
            <span style={{
              fontFamily: SB.sans, fontSize: 12.5, fontWeight: 500,
              color: SB.ink,
            }}>{t(`landing.feature.${id}.title`)}</span>
            <span style={{
              fontFamily: SB.mono, fontSize: 9,
              color: SB.inkMute, letterSpacing: '0.04em',
              textAlign: 'right',
            }}>{t(`landing.feature.${id}.subMobile`)}</span>
          </div>
        ))}
      </div>

      {/* Pull quote */}
      <div style={{
        marginTop: 18, padding: '14px 16px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: -10, left: 12,
          background: SB.cream,
          padding: '0 8px',
          fontFamily: SB.mono,
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.2em',
          color: SB.inkMute,
        }}>{t('landing.quote.eyebrow')}</div>
        <p style={{
          margin: 0,
          fontFamily: SB.serif, fontStyle: 'italic',
          fontSize: 15, lineHeight: 1.4,
          color: SB.ink,
          textWrap: 'pretty',
        }}>
          &ldquo;{fieldQuote.text}&rdquo;
        </p>
      </div>

      <FineFooter />
      <PageNav active="landing" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// SaveScenarioTip — small printable-receipt-style popover that
// reminds the user to screenshot the view. The numbers themselves
// already persist to localStorage, but a screenshot is the only
// way to capture a snapshot they can revisit / share.
// ============================================================
function SaveScenarioTip({ onClose }) {
  const t = useT();
  return (
    <div
      role="dialog"
      style={{
        position: 'absolute',
        left: '50%', top: 'calc(100% + 10px)',
        transform: 'translateX(-50%)',
        width: 260,
        background: SB.cream,
        border: `1.5px dashed ${SB.ink}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)',
        padding: '12px 14px 14px',
        textAlign: 'left',
        zIndex: 20,
        fontFamily: SB.sans,
      }}>
      {/* perforated top mini-strip */}
      <div style={{
        position: 'absolute',
        top: -6, left: 0, right: 0,
        height: 6,
        background: `radial-gradient(circle at 4px -1px, ${SB.stage} 3px, transparent 3.5px) repeat-x`,
        backgroundSize: '8px 6px',
      }} />

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 6,
      }}>
        <div style={{
          fontFamily: SB.mono,
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.2em',
          color: SB.orange,
        }}>{t('landing.saveTip.label')}</div>
        <button
          onClick={onClose}
          aria-label={t('landing.saveTip.close')}
          style={{
            background: 'transparent', border: 'none', padding: 0,
            cursor: 'pointer', fontFamily: SB.mono, fontSize: 14,
            color: SB.inkMute, lineHeight: 1,
          }}
        >×</button>
      </div>

      <p style={{
        margin: 0,
        fontFamily: SB.sans, fontSize: 12, lineHeight: 1.5,
        color: SB.ink,
        textWrap: 'pretty',
      }}>
        {t('landing.saveTip.body.before')}<strong>{t('landing.saveTip.body.bold')}</strong>{t('landing.saveTip.body.after')}
      </p>

      <div style={{
        marginTop: 10, paddingTop: 8,
        borderTop: `1px dotted ${SB.inkLine}`,
        fontFamily: SB.mono, fontSize: 9.5,
        color: SB.inkMute,
        letterSpacing: '0.04em',
        lineHeight: 1.5,
      }}>
        <div>{t('landing.saveTip.mac')}</div>
        <div>{t('landing.saveTip.win')}</div>
      </div>
    </div>
  );
}

// ============================================================
// DesktopLandingLayout — open-spread variant for >=1024px.
// Left page = the live estimate. Right page = the pitch + top
// lender quotes + CTA. Same data, different proportions.
// ============================================================
function DesktopLandingLayout({
  live, currency, meta, loanInCurrency,
  onAmountChange, pickCurrency, cycleCurrency,
  collateralBtc, collateralSats,
  aprPct, bestLender, interestUsd, origFeeUsd,
  liqUsd, liqDropPct, satsToSell,
  ranked, showSaveTip, setShowSaveTip, btcSpotUsd,
  fieldQuote,
}) {
  const t = useT();
  const top3 = ranked.slice(0, 3);

  const rightSlot = (
    <LivePriceBadge
      btcUsd={live?.btcUsd}
      loading={live?.loading}
      error={live?.error}
      onRefresh={live?.refresh}
    />
  );

  const left = (
    <div>
      <style>{`
        @keyframes dl-caret { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
        .dl-amount-input {
          background: transparent; border: none; outline: none;
          padding: 0; margin: 0;
          font-family: ${SB.serif};
          font-size: 64px; font-weight: 600;
          color: ${SB.ink};
          letter-spacing: -0.025em; line-height: 1;
          font-variant-numeric: tabular-nums;
          width: 100%; min-width: 0;
          text-align: center;
          caret-color: ${SB.orange};
        }
        .dl-amount-input::placeholder { color: ${SB.inkFaint}; }
      `}</style>

      <div style={{
        fontFamily: SB.mono,
        fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute,
        fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('landing.desktop.leftLabel')}
      </div>

      <h1 style={{
        margin: 0,
        fontFamily: SB.serif,
        fontSize: 80, fontWeight: 600,
        lineHeight: 0.95,
        letterSpacing: '-0.03em',
        color: SB.ink,
      }}>
        {t('landing.hero.titleLine1')}<br />
        <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>
          {t('landing.hero.titleLine2')}
        </span>
      </h1>

      <p style={{
        marginTop: 22, marginBottom: 0,
        fontFamily: SB.sans,
        fontSize: 16, lineHeight: 1.55,
        color: SB.inkSoft,
        maxWidth: 460,
        textWrap: 'pretty',
      }}>
        {t('landing.hero.subtitleDesktop')}
      </p>

      <DashedRule />

      <div style={{
        padding: '20px 20px 20px',
        background: SB.orangeWash,
        border: `1.5px dashed ${SB.orangeSoft}`,
      }}>
        <div style={{
          fontFamily: SB.mono,
          fontSize: 10, letterSpacing: '0.22em',
          color: SB.orange, fontWeight: 700,
        }}>
          {t('landing.amount.label')}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          marginTop: 10,
        }}>
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {meta.position === 'pre' && (
              <span style={{
                fontFamily: SB.serif,
                fontSize: 40, fontWeight: 400,
                color: SB.inkMute, lineHeight: 1, flexShrink: 0,
              }}>{meta.symbol}</span>
            )}
            <input
              className="dl-amount-input"
              type="text"
              inputMode="numeric"
              aria-label={t('landing.amount.inputLabel')}
              value={fmtNum(loanInCurrency)}
              onChange={onAmountChange}
              onFocus={(e) => e.target.select()}
            />
            {meta.position === 'post' && (
              <span style={{
                fontFamily: SB.mono,
                fontSize: 18, fontWeight: 500,
                color: SB.inkMute, marginLeft: 4, flexShrink: 0,
              }}>{meta.symbol}</span>
            )}
          </div>
          <button onClick={cycleCurrency} style={{
            background: 'transparent',
            border: `1.5px solid ${SB.ink}`,
            padding: '6px 12px',
            fontFamily: SB.mono,
            fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em',
            color: SB.ink, cursor: 'pointer', flexShrink: 0,
          }}>
            {meta.label} ▾
          </button>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 14, paddingTop: 12,
          borderTop: `1px dotted ${SB.inkLine}`,
          fontFamily: SB.mono, fontSize: 11,
          flexWrap: 'wrap',
        }}>
          <span style={{
            background: SB.ink, color: SB.cream,
            padding: '3px 8px', letterSpacing: '0.18em',
            fontWeight: 700, fontSize: 9.5,
          }}>{t('landing.amount.editChip')}</span>
          {CHIP_CURRENCIES.map((c) => {
            const isActive = c === currency;
            return (
              <button
                key={c}
                onClick={() => pickCurrency(c)}
                style={{
                  background: isActive ? SB.ink : 'transparent',
                  color: isActive ? SB.cream : SB.inkSoft,
                  border: `1px solid ${isActive ? SB.ink : SB.inkLine}`,
                  padding: '3px 10px',
                  fontFamily: SB.mono,
                  fontSize: 10.5, fontWeight: 700,
                  letterSpacing: '0.1em',
                  cursor: 'pointer', lineHeight: 1.4,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <DashedRule label={t('landing.section.estimate')} />

      <div style={{ padding: '0 2px' }}>
        <Row label={t('landing.row.collateral')}
          value={collateralBtc.toFixed(5) + ' BTC'}
          sub={'≈ ' + fmtNum(collateralSats) + ' sats'} />
        <Row label={t('landing.row.ltv')} value={LTV_PCT + '%'} sub={t('landing.row.ltvSub')} />
        <Row label={t('landing.row.apr')}
          value={aprPct.toFixed(2) + '%'}
          valueStyle={{ color: SB.orange }}
          sub={t('landing.row.aprSub', { months: TERM_MONTHS })} />
        <Row label={t('landing.row.interest', { months: TERM_MONTHS })}
          value={fmtMoney(interestUsd, currency, CURRENCY_META, btcSpotUsd)}
          sub={t('landing.row.interestSub')} />
        <Row label={t('landing.row.origination')}
          value={fmtMoney(origFeeUsd, currency, CURRENCY_META, btcSpotUsd)}
          sub={origFeeUsd > 0 ? t('landing.row.origSubOnce') : t('landing.row.origSubWaived')} />
        <Row label={t('landing.row.liquidation')}
          value={'$' + fmtNum(liqUsd)}
          valueStyle={{ color: SB.rust }}
          sub={t('landing.row.liquidationSub', { pct: Math.abs(liqDropPct).toFixed(1) })} />
      </div>

      <DashedRule label={t('landing.section.subtotal')} />

      <div style={{ padding: '0 2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
          <span style={{ color: SB.inkSoft }}>{t('landing.subtotal.total', { months: TERM_MONTHS })}</span>
          <span style={{ fontFamily: SB.mono, fontWeight: 700, color: SB.ink }}>
            {fmtMoney(interestUsd + origFeeUsd, currency, CURRENCY_META, btcSpotUsd)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
          <span style={{ color: SB.inkSoft }}>{t('landing.subtotal.satsSold')}</span>
          <span style={{ fontFamily: SB.mono, fontWeight: 700, color: SB.orange }}>
            −{fmtNum(satsToSell)}
          </span>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 18px 18px', marginTop: 14,
          border: `1.5px dashed ${SB.orange}`,
          background: SB.orangeWash,
        }}>
          <span style={{
            fontFamily: SB.mono, fontSize: 12,
            letterSpacing: '0.2em', fontWeight: 700, color: SB.orange,
          }}>{t('landing.subtotal.netLabel')}</span>
          <span style={{
            fontFamily: SB.serif, fontSize: 32, fontWeight: 600,
            color: SB.ink, letterSpacing: '-0.015em',
          }}>+{fmtNum(satsToSell)}</span>
        </div>
      </div>

      <DashedRule />

      <Button href="/calculator">{t('landing.cta.fullBreakdown')}</Button>

      <div style={{
        position: 'relative',
        textAlign: 'center', marginTop: 10,
        fontFamily: SB.mono,
        fontSize: 10, letterSpacing: '0.16em',
        color: SB.inkMute,
      }}>
        <a href="/calculator" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>{t('landing.tiny.calculator')}</a>
        <span style={{ margin: '0 8px' }}>·</span>
        <a href="/lenders" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>{t('landing.tiny.lender')}</a>
        <span style={{ margin: '0 8px' }}>·</span>
        <button
          onClick={() => setShowSaveTip((v) => !v)}
          style={{
            background: 'transparent', border: 'none', padding: 0,
            font: 'inherit', color: 'inherit', letterSpacing: 'inherit',
            cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
          }}
        >{t('landing.tiny.save')}</button>
        {showSaveTip && <SaveScenarioTip onClose={() => setShowSaveTip(false)} />}
      </div>
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono,
        fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('landing.desktop.rightLabel')}
      </div>

      <div style={{
        padding: '24px 22px 28px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -11, left: 18,
          background: SB.cream, padding: '0 10px',
          fontFamily: SB.mono, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.22em', color: SB.inkMute,
        }}>{t('landing.quote.eyebrow')}</div>
        <p style={{
          margin: 0,
          fontFamily: SB.serif, fontStyle: 'italic',
          fontSize: 24, lineHeight: 1.32,
          color: SB.ink, textWrap: 'pretty',
          letterSpacing: '-0.005em',
        }}>
          &ldquo;{fieldQuote.text}&rdquo;
        </p>
        <div style={{
          marginTop: 18,
          fontFamily: SB.mono, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', color: SB.orange,
        }}>
          — {fieldQuote.attribution}
        </div>
      </div>

      <DashedRule label={t('landing.section.booklet')} />

      <div style={{ padding: '0 2px' }}>
        {FEATURE_IDS.map((id, i) => (
          <div key={id} style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr',
            alignItems: 'baseline', gap: 16,
            padding: '14px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <span style={{
              fontFamily: SB.serif, fontStyle: 'italic',
              fontSize: 24, color: SB.orange, fontWeight: 500,
              lineHeight: 1, paddingTop: 3,
            }}>{FEATURE_NUMERALS[i]}</span>
            <div>
              <div style={{
                fontFamily: SB.serif, fontSize: 17, fontWeight: 600,
                color: SB.ink, letterSpacing: '-0.005em', marginBottom: 4,
              }}>{t(`landing.feature.${id}.title`)}</div>
              <div style={{
                fontFamily: SB.sans, fontSize: 13, lineHeight: 1.5,
                color: SB.inkSoft, textWrap: 'pretty',
              }}>{t(`landing.feature.${id}.subDesktop`)}</div>
            </div>
          </div>
        ))}
      </div>

      <DashedRule label={t('landing.desktop.topQuotes', { months: TERM_MONTHS })} />

      <div style={{ padding: '0 2px' }}>
        {top3.length === 0 && (
          <div style={{
            padding: '20px 14px', textAlign: 'center',
            fontFamily: SB.mono, fontSize: 11, color: SB.inkMute,
            border: `1px dashed ${SB.inkLine}`,
          }}>
            {t('landing.desktop.loadingQuotes')}
          </div>
        )}
        {top3.map((q, i) => {
          const rn = ['I', 'II', 'III'][i];
          return (
            <div key={q.id} style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto',
              alignItems: 'center', gap: 12,
              padding: '12px 0',
              borderBottom: `1px dotted ${SB.inkLine}`,
            }}>
              <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 18, color: SB.orange, fontWeight: 500 }}>{rn}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: SB.serif, fontSize: 18, fontWeight: 600, color: SB.ink, letterSpacing: '-0.005em' }}>{q.name}</span>
                  <Pill color={i === 0 ? SB.forest : SB.ink} filled={i === 0}>{q.badge || '—'}</Pill>
                </div>
                {q.notes && (
                  <div style={{ fontFamily: SB.mono, fontSize: 11, color: SB.inkMute, marginTop: 4 }}>
                    {q.notes.length > 80 ? q.notes.slice(0, 80) + '…' : q.notes}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: SB.mono, fontSize: 16, fontWeight: 700, color: SB.orange }}>
                  {q.effectiveApr.toFixed(2)}%
                </div>
                <div style={{ fontFamily: SB.mono, fontSize: 10, color: SB.inkSoft, marginTop: 2 }}>
                  {fmtMoney(q.totalCost, currency, CURRENCY_META, btcSpotUsd)} · {TERM_MONTHS}mo
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 14, textAlign: 'center',
        fontFamily: SB.mono, fontSize: 10,
        letterSpacing: '0.16em', color: SB.inkMute,
      }}>
        <a href="/lenders" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>{t('landing.desktop.seeAll')}</a>
      </div>

      <DashedRule />

      <Button href={bestLender?.referralUrl || '#lenders'}>
        {bestLender
          ? t('common.cta.openWithBest', { name: bestLender.name.toUpperCase() })
          : t('common.cta.browseAll')}
      </Button>
      <div style={{
        textAlign: 'center', marginTop: 10,
        fontFamily: SB.mono, fontSize: 10,
        letterSpacing: '0.16em', color: SB.inkMute,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <span>{t('common.leave.line1')}</span>
        <span>{t('common.leave.line2')}</span>
      </div>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left}
      right={right}
      active="landing"
      currentPage="I"
      pageOf="IV"
      rightSlot={rightSlot}
    />
  );
}
