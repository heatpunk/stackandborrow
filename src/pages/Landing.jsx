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
  SunMoonStamp,
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

// Currencies shown as chips. Mirrors the design's
// "also EUR · GBP · SEK · SAT" hint, but clickable.
const CHIP_CURRENCIES = ['USD', 'EUR', 'GBP', 'SEK', 'SAT'];

export default function LandingPage({ live, lenders = [], region, initialCurrency }) {
  const isDesktop = useIsDesktop();
  const [currency, setCurrency]           = usePersistentState('currency', initialCurrency || 'USD');
  const [loanInCurrency, setLoanInCurrency] = usePersistentState('desiredLoan', 50000);
  const [showSaveTip, setShowSaveTip]     = useState(false);

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
          YOUR LOAN ESTIMATE
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: SB.serif,
          fontSize: 36, fontWeight: 600,
          lineHeight: 1.02,
          letterSpacing: '-0.025em',
          color: SB.ink,
        }}>
          Keep your sats.<br />
          <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>Free some cash.</span>
        </h1>
        <div style={{
          fontFamily: SB.sans,
          fontSize: 13, lineHeight: 1.55,
          color: SB.inkSoft,
          marginTop: 14,
          maxWidth: 320,
          textWrap: 'pretty',
        }}>
          Type any amount. We compare lenders and show what it costs
          versus selling — net of tax, in sats.
        </div>

        {/* Stamp */}
        <div style={{ position: 'absolute', top: -6, right: -6 }}>
          <Stamp line1="TAX" line2="AWARE" size={82} />
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
          AMOUNT REQUESTED
        </div>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 4,
          marginTop: 8,
        }}>
          {meta.position === 'pre' && (
            <span style={{
              fontFamily: SB.serif,
              fontSize: 32, fontWeight: 400,
              color: SB.inkMute,
              flexShrink: 0,
            }}>
              {meta.symbol}
            </span>
          )}
          <input
            className="lp-amount-input"
            type="text"
            inputMode="numeric"
            aria-label="Loan amount"
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
          <button onClick={cycleCurrency} style={{
            marginLeft: 'auto',
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
          }}>EDIT</span>
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

      <DashedRule label="ESTIMATE" />

      {/* Itemized — all live */}
      <div style={{ padding: '0 2px' }}>
        <Row
          label="Collateral required"
          value={collateralBtc.toFixed(5) + ' BTC'}
          sub={'≈ ' + fmtNum(collateralSats) + ' sats'}
        />
        <Row label="Loan-to-value" value={LTV_PCT + '%'} sub="industry standard" />
        <Row
          label="Best APR available"
          value={aprPct.toFixed(2) + '%'}
          valueStyle={{ color: SB.orange }}
          sub={bestLender ? `${bestLender.name} · ${TERM_MONTHS}mo` : `fallback · ${TERM_MONTHS}mo`}
        />
        <Row
          label={`Interest, ${TERM_MONTHS} months`}
          value={fmtMoney(interestUsd, currency, CURRENCY_META, btcSpotUsd)}
          sub="paid at maturity"
        />
        <Row
          label="Origination fee"
          value={fmtMoney(origFeeUsd, currency, CURRENCY_META, btcSpotUsd)}
          sub={origFeeUsd > 0 ? 'one-time' : 'waived for region'}
        />
        <Row
          label="Liquidation price"
          value={'$' + fmtNum(liqUsd)}
          valueStyle={{ color: SB.rust }}
          sub={Math.abs(liqDropPct).toFixed(1) + '% drop from spot'}
        />
      </div>

      <DashedRule label="SUBTOTAL" />

      <div style={{ padding: '0 2px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '4px 0', fontSize: 11.5,
        }}>
          <span style={{ color: SB.inkSoft }}>Total cost over {TERM_MONTHS}mo</span>
          <span style={{ fontFamily: SB.mono, fontWeight: 700, color: SB.ink }}>
            {fmtMoney(interestUsd + origFeeUsd, currency, CURRENCY_META, btcSpotUsd)}
          </span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '4px 0', fontSize: 11.5,
        }}>
          <span style={{ color: SB.inkSoft }}>Sats you'd sell instead</span>
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
          }}>NET SATS KEPT</span>
          <span style={{
            fontFamily: SB.serif,
            fontSize: 22, fontWeight: 600,
            color: SB.ink,
            letterSpacing: '-0.015em',
          }}>+{fmtNum(satsToSell)}</span>
        </div>
      </div>

      <DashedRule />

      <Button href="#calculator">PRINT FULL BREAKDOWN</Button>

      {/* Tiny action links */}
      <div style={{
        position: 'relative',
        textAlign: 'center', marginTop: 8,
        fontFamily: SB.mono,
        fontSize: 9, letterSpacing: '0.16em',
        color: SB.inkMute,
      }}>
        <a href="#calculator" className="lp-tiny-link">calculator</a>
        <span style={{ margin: '0 6px' }}>·</span>
        <a href="#lenders" className="lp-tiny-link">pick lender</a>
        <span style={{ margin: '0 6px' }}>·</span>
        <button
          className="lp-tiny-link"
          onClick={() => setShowSaveTip((v) => !v)}
        >save scenario</button>

        {showSaveTip && (
          <SaveScenarioTip onClose={() => setShowSaveTip(false)} />
        )}
      </div>

      {/* What's included — line-item style */}
      <DashedRule label="WHAT'S IN THE BOOKLET" />
      <div style={{ padding: '4px 2px' }}>
        {[
          ['I.',   'Honest lender ranking', '9 lenders, by total cost only'],
          ['II.',  'Tax-aware comparison',  'sell vs borrow, net'],
          ['III.', 'Multi-year projection', '4 horizons, 3 scenarios'],
          ['IV.',  'Liquidation alerts',     'real-time price-drop math'],
        ].map(([no, t, sub]) => (
          <div key={no} style={{
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
            }}>{no}</span>
            <span style={{
              fontFamily: SB.sans, fontSize: 12.5, fontWeight: 500,
              color: SB.ink,
            }}>{t}</span>
            <span style={{
              fontFamily: SB.mono, fontSize: 9,
              color: SB.inkMute, letterSpacing: '0.04em',
              textAlign: 'right',
            }}>{sub}</span>
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
        }}>FROM THE FIELD</div>
        <p style={{
          margin: 0,
          fontFamily: SB.serif, fontStyle: 'italic',
          fontSize: 15, lineHeight: 1.4,
          color: SB.ink,
          textWrap: 'pretty',
        }}>
          &ldquo;Selling triggers tax. Borrowing doesn&rsquo;t. That&rsquo;s not a
          loophole — that&rsquo;s the whole point.&rdquo;
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
        }}>SAVE SCENARIO</div>
        <button
          onClick={onClose}
          aria-label="Close tip"
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
        Your inputs are saved here automatically — reload anytime
        and the numbers come back. For a snapshot you can keep
        or share, <strong>take a screenshot</strong> of this view.
      </p>

      <div style={{
        marginTop: 10, paddingTop: 8,
        borderTop: `1px dotted ${SB.inkLine}`,
        fontFamily: SB.mono, fontSize: 9.5,
        color: SB.inkMute,
        letterSpacing: '0.04em',
        lineHeight: 1.5,
      }}>
        <div>macOS · ⌘ Shift 4</div>
        <div>Windows · Win Shift S</div>
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
}) {
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
        PAGE I · LEFT — YOUR LOAN ESTIMATE
      </div>

      <h1 style={{
        margin: 0,
        fontFamily: SB.serif,
        fontSize: 80, fontWeight: 600,
        lineHeight: 0.95,
        letterSpacing: '-0.03em',
        color: SB.ink,
      }}>
        Keep<br />
        your sats.<br />
        <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>
          Free some<br />cash.
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
        Type any amount. We compare nine bitcoin-backed lenders and
        show what the loan really costs versus selling — net of
        capital gains tax, denominated in sats.
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
          AMOUNT REQUESTED
        </div>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 6,
          marginTop: 10,
        }}>
          {meta.position === 'pre' && (
            <span style={{
              fontFamily: SB.serif,
              fontSize: 40, fontWeight: 400,
              color: SB.inkMute, flexShrink: 0,
            }}>{meta.symbol}</span>
          )}
          <input
            className="dl-amount-input"
            type="text"
            inputMode="numeric"
            aria-label="Loan amount"
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
          <button onClick={cycleCurrency} style={{
            marginLeft: 'auto',
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
          }}>EDIT</span>
          {['USD', 'EUR', 'GBP', 'SEK', 'SAT'].map((c) => {
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

      <DashedRule label="ESTIMATE" />

      <div style={{ padding: '0 2px' }}>
        <Row label="Collateral required"
          value={collateralBtc.toFixed(5) + ' BTC'}
          sub={'≈ ' + fmtNum(collateralSats) + ' sats'} />
        <Row label="Loan-to-value" value={LTV_PCT + '%'} sub="industry standard" />
        <Row label="Best APR available"
          value={aprPct.toFixed(2) + '%'}
          valueStyle={{ color: SB.orange }}
          sub={bestLender ? `${bestLender.name} · ${TERM_MONTHS}mo` : `fallback · ${TERM_MONTHS}mo`} />
        <Row label={`Interest, ${TERM_MONTHS} months`}
          value={fmtMoney(interestUsd, currency, CURRENCY_META, btcSpotUsd)}
          sub="paid at maturity" />
        <Row label="Origination fee"
          value={fmtMoney(origFeeUsd, currency, CURRENCY_META, btcSpotUsd)}
          sub={origFeeUsd > 0 ? 'one-time' : 'waived for region'} />
        <Row label="Liquidation price"
          value={'$' + fmtNum(liqUsd)}
          valueStyle={{ color: SB.rust }}
          sub={Math.abs(liqDropPct).toFixed(1) + '% drop from spot'} />
      </div>

      <DashedRule label="SUBTOTAL" />

      <div style={{ padding: '0 2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
          <span style={{ color: SB.inkSoft }}>Total cost over {TERM_MONTHS}mo</span>
          <span style={{ fontFamily: SB.mono, fontWeight: 700, color: SB.ink }}>
            {fmtMoney(interestUsd + origFeeUsd, currency, CURRENCY_META, btcSpotUsd)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
          <span style={{ color: SB.inkSoft }}>Sats you'd sell instead</span>
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
          }}>NET SATS KEPT</span>
          <span style={{
            fontFamily: SB.serif, fontSize: 32, fontWeight: 600,
            color: SB.ink, letterSpacing: '-0.015em',
          }}>+{fmtNum(satsToSell)}</span>
        </div>
      </div>

      <DashedRule />

      <Button href="#calculator">PRINT FULL BREAKDOWN</Button>

      <div style={{
        position: 'relative',
        textAlign: 'center', marginTop: 10,
        fontFamily: SB.mono,
        fontSize: 10, letterSpacing: '0.16em',
        color: SB.inkMute,
      }}>
        <a href="#calculator" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>calculator</a>
        <span style={{ margin: '0 8px' }}>·</span>
        <a href="#lenders" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>pick lender</a>
        <span style={{ margin: '0 8px' }}>·</span>
        <button
          onClick={() => setShowSaveTip((v) => !v)}
          style={{
            background: 'transparent', border: 'none', padding: 0,
            font: 'inherit', color: 'inherit', letterSpacing: 'inherit',
            cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
          }}
        >save scenario</button>
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
        PAGE I · RIGHT — THE PHILOSOPHY
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
        }}>FROM THE FIELD</div>
        <p style={{
          margin: 0,
          fontFamily: SB.serif, fontStyle: 'italic',
          fontSize: 24, lineHeight: 1.32,
          color: SB.ink, textWrap: 'pretty',
          letterSpacing: '-0.005em',
        }}>
          “Selling triggers tax. Borrowing doesn't.
          That's not a loophole — that's the whole point.”
        </p>
        <div style={{
          marginTop: 18,
          fontFamily: SB.mono, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', color: SB.orange,
        }}>
          — A LONG-TERM HOLDER · NAME WITHHELD
        </div>
      </div>

      <DashedRule label="WHAT'S IN THE BOOKLET" />

      <div style={{ padding: '0 2px' }}>
        {[
          ['I.',   'Honest lender ranking',  'Lenders ranked by total cost only. Affiliate commissions never enter the algorithm — they fund hosting.'],
          ['II.',  'Tax-aware comparison',   'Sell vs borrow, net of capital gains. We bake your jurisdiction in.'],
          ['III.', 'Multi-year projection',  '4 horizons × 3 scenarios. Saylor, Wood, or Schiff as your projector.'],
          ['IV.',  'Liquidation alerts',     'Live price-drop math. Six 50%+ drawdowns since 2013. Not if, when.'],
        ].map(([no, t, sub]) => (
          <div key={no} style={{
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
            }}>{no}</span>
            <div>
              <div style={{
                fontFamily: SB.serif, fontSize: 17, fontWeight: 600,
                color: SB.ink, letterSpacing: '-0.005em', marginBottom: 4,
              }}>{t}</div>
              <div style={{
                fontFamily: SB.sans, fontSize: 13, lineHeight: 1.5,
                color: SB.inkSoft, textWrap: 'pretty',
              }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <DashedRule label={`TODAY'S TOP THREE QUOTES · ${TERM_MONTHS}MO`} />

      <div style={{ padding: '0 2px' }}>
        {top3.length === 0 && (
          <div style={{
            padding: '20px 14px', textAlign: 'center',
            fontFamily: SB.mono, fontSize: 11, color: SB.inkMute,
            border: `1px dashed ${SB.inkLine}`,
          }}>
            Loading lender quotes…
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
        <a href="#lenders" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>see all →</a>
      </div>

      <DashedRule />

      <Button href={bestLender?.referralUrl || '#lenders'}>
        {bestLender ? `OPEN WITH ${bestLender.name.toUpperCase()} — BEST RATE` : 'BROWSE ALL LENDERS'}
      </Button>
      <div style={{
        textAlign: 'center', marginTop: 10,
        fontFamily: SB.mono, fontSize: 10,
        letterSpacing: '0.16em', color: SB.inkMute,
      }}>
        you'll leave the booklet · we never see your details
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
