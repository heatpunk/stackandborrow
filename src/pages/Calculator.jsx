// ============================================================
// CALCULATOR PAGE — the interactive booklet.
// All state persists to localStorage; live BTC price from props;
// lender ranking + projection re-compute on every input change.
// ============================================================

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  SB,
  CURRENCY_META,
  CURRENCY_STEP,
  DEFAULT_PROFILES,
  LTV_PCT,
  LIQ_LTV_PCT,
  TERM_MONTHS,
} from '../system/tokens.js';
import {
  PaperFrame,
  BrandHeader,
  DashedRule,
  Row,
  Pill,
  Button,
  SectionHead,
  PageNav,
  FineFooter,
  LivePriceBadge,
  ensureSliderCss,
} from '../system/components.jsx';
import { usePersistentState } from '../lib/hooks.js';
import {
  VoidStateLoading,
  VoidStateLoanTooSmall,
  VoidStateNoRegion,
} from './Void.jsx';
import {
  computeInterest,
  projectBtcPrice,
  computeLiquidationPrice,
  rankLenders,
  toUsd,
  usdTo,
  SATS_PER_BTC,
} from '../lib/math.js';
import {
  fmtNum,
  fmtSats,
  fmtMoney,
  fmtMoneyCompact,
  fmtPct,
} from '../lib/format.js';

export default function CalculatorPage({
  live,
  lenders,
  lastUpdated,
  region,
  initialCurrency,
}) {
  // Slider thumb pseudo-element styles need a stylesheet — inject once.
  useEffect(() => { ensureSliderCss(); }, []);

  // ===== STATE (all persisted) =====
  const [currency, setCurrency]               = usePersistentState('currency', initialCurrency || 'USD');
  const [loanInCurrency, setLoanInCurrency]   = usePersistentState('desiredLoan', 50000);
  const [profileId, setProfileId]             = usePersistentState('activeProfile', 'saylor');
  const [caseId, setCaseId]                   = usePersistentState('activeCase', 'base');
  const [profiles]                            = usePersistentState('profiles', DEFAULT_PROFILES);

  const btcSpotUsd = live.btcUsd;

  // ===== DERIVED VALUES =====
  const loanUsd = toUsd(loanInCurrency, currency, CURRENCY_META, btcSpotUsd);
  const collateralUsd = loanUsd / (LTV_PCT / 100);
  const collateralBtc = collateralUsd / btcSpotUsd;
  const collateralSats = Math.round(collateralBtc * SATS_PER_BTC);
  const liqUsd = collateralBtc > 0
    ? computeLiquidationPrice(loanUsd, collateralBtc, LIQ_LTV_PCT)
    : 0;
  const liqDropPct = ((btcSpotUsd - liqUsd) / btcSpotUsd) * 100;
  const taxRate = CURRENCY_META[currency].taxRate;

  // ===== LENDER RANKING =====
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
  const totalOwedUsd = loanUsd + interestUsd;

  // ===== TAX-AWARE SELL PATH =====
  const taxMul = 1 - taxRate / 100;
  const grossSaleUsd = taxMul > 0 ? loanUsd / taxMul : loanUsd;
  const taxOwedUsd = grossSaleUsd - loanUsd;
  const satsToSell = Math.round((grossSaleUsd / btcSpotUsd) * SATS_PER_BTC);

  // ===== PROFILE / CASE =====
  const activeCagr = profiles[profileId].cases[caseId];

  // ===== Y20 VERDICT =====
  const futureBtc20 = projectBtcPrice(btcSpotUsd, activeCagr, 20);
  const borrowNet20 = collateralBtc * futureBtc20 - totalOwedUsd;
  const collateralBtcAfterSell = Math.max(0, collateralBtc - grossSaleUsd / btcSpotUsd);
  const sellNet20 = collateralBtcAfterSell * futureBtc20;
  const deltaUsd = borrowNet20 - sellNet20;

  // ===== INPUT BOUNDS =====
  const min = CURRENCY_META[currency].minLoan;
  const max = CURRENCY_META[currency].maxLoan;
  const step = CURRENCY_STEP[currency] || 1000;

  const onSlide = useCallback((e) => {
    setLoanInCurrency(Number(e.target.value));
  }, [setLoanInCurrency]);

  // Cycle through supported currencies, preserving the loan's USD value.
  const cycleCurrency = useCallback(() => {
    const keys = Object.keys(CURRENCY_META);
    const next = keys[(keys.indexOf(currency) + 1) % keys.length];
    const usd = toUsd(loanInCurrency, currency, CURRENCY_META, btcSpotUsd);
    const newVal = usdTo(usd, next, CURRENCY_META, btcSpotUsd);
    const m = CURRENCY_META[next];
    const s = CURRENCY_STEP[next] || 1000;
    const clamped = Math.max(m.minLoan, Math.min(m.maxLoan, Math.round(newVal / s) * s));
    setLoanInCurrency(clamped);
    setCurrency(next);
  }, [currency, loanInCurrency, btcSpotUsd, setCurrency, setLoanInCurrency]);

  // Format helpers bound to current currency
  const fmt = (usd) => fmtMoney(usd, currency, CURRENCY_META, btcSpotUsd);

  // ===== VOID STATES =====
  // First-paint loading splash: live prices haven't resolved yet.
  if (live.loading && live.source === 'fallback') {
    return <VoidStateLoading source="mempool.space" />;
  }
  // Loan below the global $1,000 floor — no lender will quote.
  if (loanUsd > 0 && loanUsd < 1000) {
    const resetToValid = () => {
      const targetUsd = 1500;
      const inCurrency = usdTo(targetUsd, currency, CURRENCY_META, btcSpotUsd);
      const s = CURRENCY_STEP[currency] || 1000;
      const clamped = Math.max(
        CURRENCY_META[currency].minLoan,
        Math.round(inCurrency / s) * s
      );
      setLoanInCurrency(clamped);
    };
    return (
      <VoidStateLoanTooSmall
        amountLabel={fmt(loanUsd)}
        minLabel="$1,000"
        onReturn={resetToValid}
      />
    );
  }
  // Region not served by any lender (and lender data is loaded).
  if (lenders.length > 0 && ranked.length === 0 && region !== 'global') {
    return (
      <VoidStateNoRegion
        regionLabel={regionLabelFor(region)}
        regionCode={region}
      />
    );
  }

  return (
    <PaperFrame>
      <BrandHeader
        currentPage="II"
        pageOf="IV"
        rightSlot={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />
            <button onClick={cycleCurrency} style={pickerBtn}>
              {CURRENCY_META[currency].label} ▾
            </button>
          </div>
        }
      />

      <SectionHead no="§ I" title="Loan Amount" />

      {/* Amount input */}
      <div style={{
        padding: '14px 14px 14px',
        background: SB.orangeWash,
        border: `1.5px dashed ${SB.orangeSoft}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.22em',
          color: SB.orange, fontWeight: 700,
        }}>PRINCIPAL · BORROWED</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
          {CURRENCY_META[currency].position === 'pre' && (
            <span style={{ fontFamily: SB.serif, fontSize: 32, fontWeight: 400, color: SB.inkMute }}>
              {CURRENCY_META[currency].symbol}
            </span>
          )}
          <span style={{
            fontFamily: SB.serif, fontSize: 46, fontWeight: 600,
            color: SB.ink, letterSpacing: '-0.025em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{fmtNum(loanInCurrency)}</span>
          {CURRENCY_META[currency].position === 'post' && (
            <span style={{
              fontFamily: SB.mono, fontSize: 16, fontWeight: 500,
              color: SB.inkMute, marginLeft: 4,
            }}>{CURRENCY_META[currency].symbol}</span>
          )}
          <button onClick={cycleCurrency} style={{ ...pickerBtn, marginLeft: 'auto' }}>
            {CURRENCY_META[currency].label} ▾
          </button>
        </div>

        {/* Slider */}
        <div style={{ marginTop: 14 }}>
          <input
            type="range"
            min={min} max={max} step={step}
            value={loanInCurrency}
            onChange={onSlide}
            className="sb-slider"
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 4,
            fontFamily: SB.mono, fontSize: 9, color: SB.inkFaint,
            letterSpacing: '0.05em',
          }}>
            <span>{rangeLabel(min, currency)}</span>
            <span>~{fmtMoney(loanUsd, 'USD', CURRENCY_META, btcSpotUsd)} USD</span>
            <span>{rangeLabel(max, currency)}</span>
          </div>
        </div>
      </div>

      <SectionHead no="§ II" title="Collateral & Terms" />

      <div style={{ padding: '0 2px' }}>
        <Row label="Collateral required" value={collateralBtc.toFixed(5) + ' BTC'} sub={fmtNum(collateralSats) + ' sats'} />
        <Row label="Loan-to-value (fixed)" value="50%" />
        <Row label="Term length" value="12 months" sub="balloon at maturity" />
        <Row label="Liquidation price"
             value={'$' + fmtNum(liqUsd)}
             valueStyle={{ color: SB.rust }}
             sub={Math.abs(liqDropPct).toFixed(1) + '% drop from spot'} />
        <Row label="Sats lost if liquidated"
             value={'−' + fmtNum(collateralSats * (LIQ_LTV_PCT / 100))}
             valueStyle={{ color: SB.rust }} />
      </div>

      {/* Liquidation alert */}
      <div style={{
        marginTop: 10, padding: '10px 12px',
        background: SB.rustWash,
        border: `1px dashed ${SB.rust}`,
        display: 'flex', alignItems: 'flex-start', gap: 8,
        fontFamily: SB.mono, fontSize: 10.5,
        color: SB.rust, lineHeight: 1.45,
      }}>
        <span style={{ fontWeight: 700, marginTop: 1 }}>!</span>
        <div>
          <div style={{ fontWeight: 700, letterSpacing: '0.08em' }}>HEADS UP</div>
          <div style={{ marginTop: 2 }}>
            BTC has dropped &gt;{Math.abs(liqDropPct).toFixed(0)}% from a
            12-month high in 6 of the last 12 years. Keep cash for buffer.
          </div>
        </div>
      </div>

      <SectionHead no="§ III" title="Audited By" subtitle="whose BTC projection do you trust?" />

      {/* Profile picker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {Object.entries(profiles).map(([id, p]) => {
          const active = id === profileId;
          return (
            <button
              key={id}
              onClick={() => setProfileId(id)}
              style={{
                padding: '10px 6px 8px',
                border: `1.5px ${active ? 'solid' : 'dashed'} ${active ? SB.ink : SB.inkLine}`,
                background: active ? SB.inkFill : 'transparent',
                color: active ? SB.cream : SB.ink,
                textAlign: 'center', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              title={p.blurb}
            >
              <div style={{
                fontFamily: SB.serif, fontSize: 18, fontStyle: 'italic',
                fontWeight: 500, lineHeight: 1,
                color: active ? SB.orange : SB.inkSoft,
              }}>{p.initials}</div>
              <div style={{
                fontFamily: SB.mono, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.1em', marginTop: 6,
              }}>{p.name}</div>
              <div style={{
                fontFamily: SB.mono, fontSize: 8, fontWeight: 600,
                letterSpacing: '0.14em',
                color: active ? 'rgba(246,241,232,0.6)' : SB.inkMute,
                marginTop: 2,
              }}>{(p.persona || '').toUpperCase()}</div>
              <div style={{
                fontFamily: SB.mono, fontSize: 11, fontWeight: 700,
                marginTop: 6,
                color: active ? SB.orange : SB.ink,
              }}>{fmtPct(p.cases.base, 0)}/yr</div>
            </button>
          );
        })}
      </div>

      {/* Scenario tabs */}
      <div style={{
        display: 'flex', marginTop: 14,
        border: `1.5px solid ${SB.ink}`,
      }}>
        {['bear', 'base', 'bull'].map((c, i) => {
          const active = c === caseId;
          const v = profiles[profileId].cases[c];
          return (
            <button key={c} onClick={() => setCaseId(c)} style={{
              flex: 1, padding: '10px 8px',
              textAlign: 'center',
              borderRight: i < 2 ? `1px dashed ${SB.inkLine}` : 'none',
              borderTop: 'none', borderLeft: 'none', borderBottom: 'none',
              background: active ? SB.inkFill : 'transparent',
              color: active ? SB.cream : SB.ink,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <div style={{
                fontFamily: SB.mono, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.16em',
              }}>{c.toUpperCase()}</div>
              <div style={{
                fontFamily: SB.serif, fontSize: 16, fontWeight: 600,
                marginTop: 2, color: active ? SB.orange : SB.ink,
                letterSpacing: '-0.01em',
              }}>{fmtPct(v, 0)}</div>
            </button>
          );
        })}
      </div>

      <SectionHead no="§ IV" title="Projection · 20 Years" subtitle="net of interest, tax & liquidations" />

      <Projection
        spot={btcSpotUsd}
        cagr={activeCagr}
        collateralBtc={collateralBtc}
        totalOwedUsd={totalOwedUsd}
        collateralBtcAfterSell={collateralBtcAfterSell}
      />

      <DashedRule label="VERDICT" />

      <div style={{ padding: '0 2px' }}>
        <Row
          label="If you SELL today"
          value={'−' + fmtNum(satsToSell) + ' sats'}
          valueStyle={{ color: SB.rust }}
          sub={'+' + fmt(taxOwedUsd) + ' tax · ' + fmt(grossSaleUsd) + ' gross sale'}
        />
        <Row
          label="If you BORROW today"
          value={'−0 sats'}
          valueStyle={{ color: SB.forest }}
          sub={fmt(interestUsd) + ' interest over 12mo'}
        />

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 12px 12px', marginTop: 10,
          border: `1.5px dashed ${SB.orange}`,
          background: SB.orangeWash,
        }}>
          <div>
            <div style={{
              fontFamily: SB.mono, fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.2em', color: SB.orange,
            }}>NET WORTH @ Y20</div>
            <div style={{
              fontFamily: SB.mono, fontSize: 9,
              color: SB.inkMute, marginTop: 3, letterSpacing: '0.06em',
            }}>vs selling · {caseId} case · {profileId}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: SB.serif, fontSize: 26, fontWeight: 600,
              color: SB.ink, letterSpacing: '-0.02em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {deltaUsd >= 0 ? '+' : ''}{fmtMoneyCompact(deltaUsd)}
            </div>
            <div style={{
              fontFamily: SB.mono, fontSize: 9,
              color: deltaUsd >= 0 ? SB.forest : SB.rust,
              marginTop: 4, fontWeight: 700, letterSpacing: '0.1em',
            }}>
              {deltaUsd >= 0 ? '↑ KEEP THE STACK' : '↓ SELL WINS HERE'}
            </div>
          </div>
        </div>
      </div>

      <SectionHead no="§ V" title="Best Quotes" subtitle={`ranked by total cost · top 4 of ${ranked.length}`} />

      <div style={{ marginBottom: 12 }}>
        {ranked.slice(0, 4).map((q, i) => {
          const rn = ['I', 'II', 'III', 'IV'][i];
          return (
            <div key={q.id} style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr auto',
              alignItems: 'center', gap: 10,
              padding: '10px 0',
              borderBottom: `1px dotted ${SB.inkLine}`,
            }}>
              <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 15, color: SB.orange, fontWeight: 500 }}>{rn}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: SB.serif, fontSize: 16, fontWeight: 600, color: SB.ink, letterSpacing: '-0.005em' }}>{q.name}</span>
                  <Pill color={i === 0 ? SB.forest : SB.ink} filled={i === 0}>{q.badge || '—'}</Pill>
                  {q.isTiered && <Pill color={SB.orange}>TIERED</Pill>}
                </div>
                {q.notes && (
                  <div style={{ fontFamily: SB.mono, fontSize: 9.5, color: SB.inkMute, marginTop: 3, letterSpacing: '0.02em' }}>
                    {q.notes.length > 80 ? q.notes.slice(0, 80) + '…' : q.notes}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: SB.mono, fontSize: 13, fontWeight: 700, color: SB.orange }}>
                  {q.effectiveApr.toFixed(2)}%
                </div>
                <div style={{ fontFamily: SB.mono, fontSize: 9.5, color: SB.inkSoft, marginTop: 2 }}>
                  {fmt(q.totalCost)} · 12mo
                </div>
              </div>
            </div>
          );
        })}
        {ranked.length === 0 && (
          <div style={{
            padding: '20px 14px', textAlign: 'center',
            fontFamily: SB.mono, fontSize: 11, color: SB.inkMute,
            border: `1px dashed ${SB.inkLine}`,
          }}>
            No matching lenders for this loan size or region. Try a different amount.
          </div>
        )}
      </div>

      <Button href={bestLender?.referralUrl || '#lenders'}>
        {bestLender ? `OPEN WITH ${bestLender.name.toUpperCase()} — BEST RATE` : 'BROWSE ALL LENDERS'}
      </Button>
      <div style={{
        textAlign: 'center', marginTop: 8,
        fontFamily: SB.mono,
        fontSize: 9, letterSpacing: '0.16em',
        color: SB.inkMute,
      }}>
        you'll leave the booklet · we never see your details
      </div>

      <FineFooter source={live.source} updated={lastUpdated} />
      <PageNav active="calc" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// Projection — small SVG sparkline of borrow vs sell paths.
// ============================================================
function Projection({ spot, cagr, collateralBtc, totalOwedUsd, collateralBtcAfterSell }) {
  const W = 340, H = 130, P = 12;
  const years = 21;

  const { borrowPath, sellPath, marks } = useMemo(() => {
    const bP = [], sP = [];
    for (let y = 0; y < years; y++) {
      const futureBtc = projectBtcPrice(spot, cagr, y);
      const wobble = 1 + Math.sin((y / 4) * Math.PI * 2) * 0.05;
      bP.push(Math.max(1, (collateralBtc * futureBtc - totalOwedUsd) * wobble));
      sP.push(Math.max(1, collateralBtcAfterSell * futureBtc * wobble));
    }
    const milestoneYears = [2, 5, 10, 20];
    const marks = milestoneYears.map((y) => {
      const futureBtc = projectBtcPrice(spot, cagr, y);
      const v = collateralBtc * futureBtc - totalOwedUsd;
      return { y, val: v };
    });
    return { borrowPath: bP, sellPath: sP, marks };
  }, [spot, cagr, collateralBtc, totalOwedUsd, collateralBtcAfterSell]);

  const allVals = [...borrowPath, ...sellPath].filter((v) => v > 0);
  const maxV = Math.max(...allVals, 100);
  const minV = Math.max(0.1, Math.min(...allVals));
  const xOf = (i) => P + (i / (years - 1)) * (W - P * 2);
  const yOf = (v) => {
    if (v <= 0) return H - P;
    const logRatio = Math.log(v / minV) / Math.log(maxV / minV);
    return H - P - logRatio * (H - P * 2);
  };
  const toPath = (arr) =>
    arr.map((v, i) => (i === 0 ? 'M' : 'L') + xOf(i).toFixed(1) + ',' + yOf(v).toFixed(1)).join(' ');

  return (
    <div>
      <div style={{
        position: 'relative',
        border: `1px solid ${SB.inkLine}`,
        background: SB.creamWarm,
        padding: '10px 12px 12px',
      }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          {[0.25, 0.5, 0.75].map((f, i) => (
            <line key={i} x1={P} x2={W - P} y1={H * f} y2={H * f}
              stroke={SB.inkLine} strokeDasharray="2 4" />
          ))}
          <path d={toPath(borrowPath)} fill="none" stroke={SB.orange} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
          <path d={toPath(sellPath)} fill="none" stroke={SB.ink} strokeWidth="1.2"
            strokeDasharray="3 3" strokeLinecap="round" />
          {marks.map((m) => (
            <g key={m.y}>
              <circle cx={xOf(m.y)} cy={yOf(borrowPath[m.y])} r="3"
                fill={SB.cream} stroke={SB.orange} strokeWidth="1.5" />
              <line x1={xOf(m.y)} x2={xOf(m.y)} y1={yOf(borrowPath[m.y])} y2={H - P}
                stroke={SB.inkLine} strokeDasharray="2 3" />
            </g>
          ))}
        </svg>
        <div style={{
          display: 'flex', gap: 14, marginTop: 6,
          fontFamily: SB.mono, fontSize: 9,
          color: SB.inkSoft, letterSpacing: '0.05em',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, height: 2, background: SB.orange, display: 'inline-block' }} />
            BORROW · keep all sats
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, borderTop: `1.5px dashed ${SB.ink}`, display: 'inline-block' }} />
            SELL · post-tax remaining
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6, marginTop: 10,
      }}>
        {marks.map((m, i) => (
          <div key={m.y} style={{
            padding: '6px 4px',
            borderTop: `1.5px solid ${SB.ink}`,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: SB.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: SB.inkMute }}>
              Y{m.y}
            </div>
            <div style={{
              fontFamily: SB.serif,
              fontSize: 12 + i * 1.5,
              fontWeight: 600, marginTop: 4,
              color: m.val < 0 ? SB.rust : (i === 3 ? SB.forest : SB.ink),
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {fmtMoneyCompact(m.val)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact label like "$5K" or "5 000 kr" for slider ends.
function rangeLabel(val, currency) {
  const m = CURRENCY_META[currency];
  if (currency === 'SAT') {
    if (val >= 1e9) return (val / 1e9).toFixed(1) + 'B';
    if (val >= 1e6) return (val / 1e6).toFixed(0) + 'M';
    return fmtNum(val);
  }
  let compact;
  if (val >= 1e6) compact = (val / 1e6).toFixed(val >= 1e7 ? 0 : 1) + 'M';
  else if (val >= 1e3) compact = (val / 1e3).toFixed(0) + 'K';
  else compact = String(val);
  return m.position === 'pre' ? m.symbol + compact : compact + ' ' + m.symbol;
}

const pickerBtn = {
  background: 'transparent',
  border: `1.5px solid ${SB.ink}`,
  padding: '3px 8px',
  fontFamily: SB.mono,
  fontSize: 10, fontWeight: 700,
  letterSpacing: '0.08em',
  color: SB.ink,
  cursor: 'pointer',
};

// Friendly label for a region code (used in NoRegion void state).
function regionLabelFor(code) {
  const map = {
    us: 'the US', ca: 'Canada', eu: 'the EU', uk: 'the UK',
    au: 'Australia', jp: 'Japan', ch: 'Switzerland',
    global: 'your region',
  };
  return map[code] || 'your region';
}
