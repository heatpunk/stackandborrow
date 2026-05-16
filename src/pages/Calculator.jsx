// ============================================================
// CALCULATOR PAGE — the interactive booklet.
// All state persists to localStorage; live BTC price from props;
// lender ranking + projection re-compute on every input change.
// ============================================================

import React, { useMemo, useCallback, useEffect, useState } from 'react';
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
  SunMoonStamp,
  InfoIcon,
  ensureSliderCss,
} from '../system/components.jsx';
import { GLOSSARY } from '../lib/glossary.js';
import { useIsDesktop } from '../system/theme.jsx';
import { DesktopSpreadFrame, DSectionHead } from '../system/desktop.jsx';
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
  const isDesktop = useIsDesktop();

  // ===== STATE (all persisted) =====
  const [currency, setCurrency]               = usePersistentState('currency', initialCurrency || 'USD');
  const [loanInCurrency, setLoanInCurrency]   = usePersistentState('desiredLoan', 50000);
  const [profileId, setProfileId]             = usePersistentState('activeProfile', 'saylor');
  const [caseId, setCaseId]                   = usePersistentState('activeCase', 'base');
  const [profiles]                            = usePersistentState('profiles', DEFAULT_PROFILES);
  const [expandedQuoteId, setExpandedQuoteId] = useState(null);

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

  if (isDesktop) {
    return (
      <DesktopCalculatorLayout
        live={live}
        currency={currency}
        cycleCurrency={cycleCurrency}
        loanInCurrency={loanInCurrency}
        onSlide={onSlide}
        min={min} max={max} step={step}
        loanUsd={loanUsd}
        btcSpotUsd={btcSpotUsd}
        collateralBtc={collateralBtc}
        collateralSats={collateralSats}
        liqUsd={liqUsd}
        liqDropPct={liqDropPct}
        profileId={profileId} setProfileId={setProfileId}
        caseId={caseId} setCaseId={setCaseId}
        profiles={profiles}
        activeCagr={activeCagr}
        totalOwedUsd={totalOwedUsd}
        collateralBtcAfterSell={collateralBtcAfterSell}
        deltaUsd={deltaUsd}
        ranked={ranked}
        bestLender={bestLender}
        interestUsd={interestUsd}
        satsToSell={satsToSell}
        grossSaleUsd={grossSaleUsd}
        taxOwedUsd={taxOwedUsd}
        fmt={fmt}
        lastUpdated={lastUpdated}
        expandedQuoteId={expandedQuoteId}
        setExpandedQuoteId={setExpandedQuoteId}
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
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.22em',
          color: SB.orange, fontWeight: 700,
        }}>PRINCIPAL · BORROWED</div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {CURRENCY_META[currency].position === 'pre' && (
              <span style={{ fontFamily: SB.serif, fontSize: 32, fontWeight: 400, color: SB.inkMute, lineHeight: 1 }}>
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
          </div>
          <button onClick={cycleCurrency} style={{ ...pickerBtn, flexShrink: 0 }}>
            {CURRENCY_META[currency].label} ▾
          </button>
        </div>

        {/* Slider */}
        <div>
          <input
            type="range"
            min={min} max={max} step={step}
            value={loanInCurrency}
            onChange={onSlide}
            className="sb-slider"
            aria-label="Loan amount"
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
        <Row label="Collateral required" value={collateralBtc.toFixed(5) + ' BTC'} sub={fmtNum(collateralSats) + ' sats'} info={GLOSSARY.collateral} />
        <Row label="Loan-to-value (fixed)" value="50%" info={GLOSSARY.ltv} />
        <Row label="Term length" value="12 months" sub="balloon at maturity" info={GLOSSARY.balloon} />
        <Row label="Liquidation price"
             value={'$' + fmtNum(liqUsd)}
             valueStyle={{ color: SB.rust }}
             sub={Math.abs(liqDropPct).toFixed(1) + '% drop from spot'}
             info={GLOSSARY.liquidation} />
        <Row label="Sats lost if liquidated"
             value={'−' + fmtNum(collateralSats * (LIQ_LTV_PCT / 100))}
             valueStyle={{ color: SB.rust }}
             info={GLOSSARY.sats} />
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

      <SectionHead no="§ IV" title="Projection" subtitle="net of interest, tax & liquidations" />

      <Projection
        spot={btcSpotUsd}
        cagr={activeCagr}
        collateralBtc={collateralBtc}
        totalOwedUsd={totalOwedUsd}
        collateralBtcAfterSell={collateralBtcAfterSell}
        currency={currency}
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
              {deltaUsd >= 0 ? '+' : ''}
              <FormattedMoney usd={deltaUsd} currency={currency} spot={btcSpotUsd} />
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

      <SectionHead no="§ V" title="Best Quotes" subtitle={`ranked by total cost · ${Math.min(4, ranked.length)} of ${Math.max(4, ranked.length)}`} />

      <div style={{ marginBottom: 12 }}>
        {ranked.slice(0, 4).map((q, i) => {
          const rn = ['I', 'II', 'III', 'IV'][i];
          const isExpanded = expandedQuoteId === q.id;
          const truncated = q.notes && q.notes.length > 80;
          const rp = rolloverPillSpec(q.rolloverEase);
          return (
            <div
              key={q.id}
              onClick={() => truncated && setExpandedQuoteId(isExpanded ? null : q.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto',
                alignItems: 'center', gap: 10,
                padding: '10px 0',
                borderBottom: `1px dotted ${SB.inkLine}`,
                cursor: truncated ? 'pointer' : 'default',
              }}>
              <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 15, color: SB.orange, fontWeight: 500 }}>{rn}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: SB.serif, fontSize: 16, fontWeight: 600, color: SB.ink, letterSpacing: '-0.005em' }}>{q.name}</span>
                  <Pill color={i === 0 ? SB.forest : SB.ink} filled={i === 0}>{q.badge || '—'}</Pill>
                  {q.isTiered && <Pill color={SB.orange}>TIERED</Pill>}
                  {rp && <Pill color={rp.color}>{rp.label}</Pill>}
                </div>
                {q.notes && (
                  <div>
                    <div style={{
                      fontFamily: SB.mono, fontSize: 9.5, color: SB.inkMute, marginTop: 3,
                      letterSpacing: '0.02em', lineHeight: 1.45,
                    }}>
                      {isExpanded || !truncated ? q.notes : q.notes.slice(0, 80) + '…'}
                    </div>
                    {truncated && (
                      <div style={{
                        fontFamily: SB.mono, fontSize: 9.5, fontWeight: 700, color: SB.orange,
                        marginTop: 2, letterSpacing: '0.02em',
                      }}>
                        {isExpanded ? 'show less ▴' : 'show more ▾'}
                      </div>
                    )}
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
        {bestLender ? `OPEN WITH ${bestLender.name.toUpperCase()}` : 'BROWSE ALL LENDERS'}
      </Button>
      <div style={{
        textAlign: 'center', marginTop: 8,
        fontFamily: SB.mono,
        fontSize: 9, letterSpacing: '0.16em',
        color: SB.inkMute,
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <span>· you&apos;ll leave Stack &amp; Borrow ·</span>
        <span>not your details</span>
      </div>

      <MaturitySection
        lender={bestLender}
        principalUsd={loanUsd}
        interestUsd={interestUsd}
        totalOwedUsd={totalOwedUsd}
        collateralBtc={collateralBtc}
        collateralSats={collateralSats}
        btcSpotUsd={btcSpotUsd}
        fmt={fmt}
      />

      <LongViewSection
        lender={bestLender}
        loanUsd={loanUsd}
        collateralBtc={collateralBtc}
        btcSpotUsd={btcSpotUsd}
        activeCagr={activeCagr}
        profileId={profileId}
        caseId={caseId}
        profiles={profiles}
        currency={currency}
        fmt={fmt}
      />

      <FineFooter source={live.source} updated={lastUpdated} />
      <PageNav active="calc" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// FormattedMoney — renders a compact money value with post-position
// suffixes ("kr", "sats", "BTC") set at a smaller inline size so the
// unit can't wrap onto its own line in narrow cells. Pre-position
// symbols ($, €) come back from fmtMoneyCompact as one token and pass
// through unchanged.
// ============================================================
function FormattedMoney({ usd, currency, spot }) {
  const s = fmtMoneyCompact(usd, currency, CURRENCY_META, spot);
  const sp = s.lastIndexOf(' ');
  if (sp < 0) return <>{s}</>;
  return (
    <>
      {s.slice(0, sp)}
      <span style={{ fontSize: '0.62em', marginLeft: '0.15em' }}>{s.slice(sp + 1)}</span>
    </>
  );
}

// ============================================================
// Projection — small SVG sparkline of borrow vs sell paths.
// ============================================================
function Projection({ spot, cagr, collateralBtc, totalOwedUsd, collateralBtcAfterSell, currency }) {
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
              fontSize: 14 + i * 3.5,
              fontWeight: 600,
              marginTop: 4,
              color: m.val < 0 ? SB.rust : (i === 3 ? SB.forest : SB.ink),
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              <FormattedMoney usd={m.val} currency={currency} spot={spot} />
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

// Map rolloverEase → pill metadata for § V Best Quotes.
// `revolving` = open credit line; `approval` = lender supports refinance
// but requires re-underwriting; `new-contract` = must apply from scratch.
// Only revolving gets a tinted pill (forest) — it's the standout case.
// The other two share inkMute so neither feels flagged as “bad” — they
// just signal “there's friction at maturity, see § VI”.
function rolloverPillSpec(ease) {
  if (ease === 'revolving')    return { color: SB.forest,  label: '↻ REVOLVING' };
  if (ease === 'approval')     return { color: SB.inkMute, label: '↻ REFINANCE' };
  if (ease === 'new-contract') return { color: SB.inkMute, label: '↻ NEW LOAN' };
  return null;
}

// ============================================================
// MaturitySection — § VI · what happens 12 months from now.
// Same numbers the rest of the page works with, projected forward
// to the maturity date. Three outcomes side-by-side:
//   I   PAY OFF     — wire fiat, reclaim full collateral.
//   II  ROLL OVER   — extend/refinance; stack untouched if approved.
//   III LIQUIDATE   — lender sells enough BTC to cover debt; rest returned.
// Collapsed by default — power-user disclosure under the CTA.
// ============================================================
function MaturitySection({
  lender, principalUsd, interestUsd, totalOwedUsd,
  collateralBtc, collateralSats, btcSpotUsd, fmt,
}) {
  const [open, setOpen] = useState(false);
  if (!lender) return null;

  const btcToCoverDebt = totalOwedUsd / btcSpotUsd;
  const satsToCoverDebt = Math.round(btcToCoverDebt * SATS_PER_BTC);
  const btcKeptAfterLiq = Math.max(0, collateralBtc - btcToCoverDebt);
  const satsKeptAfterLiq = Math.max(0, collateralSats - satsToCoverDebt);

  // ROLL OVER row varies by lender's rolloverEase. Each variant leads
  // with the variant name (matching the § V pill) so the reader can tell
  // the three flavors apart at a glance. Sub explains the practical
  // consequence. Friction level shown by tone.
  const ease = lender.rolloverEase;
  let rollPrimary, rollSub, rollRightSub, rollTone;
  if (ease === 'revolving') {
    rollPrimary = <>Revolving — line stays open <InfoIcon def={GLOSSARY.revolving} /></>;
    rollSub = 'No maturity to roll past. Interest accrues only on the outstanding balance — you decide when to close the line.';
    rollRightSub = 'NO ACTION';
    rollTone = SB.forest;
  } else if (ease === 'approval') {
    rollPrimary = <>Refinance — extends for another term <InfoIcon def={GLOSSARY.refinance} /></>;
    rollSub = 'Lender re-underwrites; a fresh origination fee may apply and a new APR locks in for another 12 months.';
    rollRightSub = 'IF APPROVED';
    rollTone = SB.inkSoft;
  } else {
    rollPrimary = <>New loan — apply from scratch <InfoIcon def={GLOSSARY.newContract} /></>;
    rollSub = 'You re-apply at the lender’s then-current rates and terms. Collateral is released between loans, then re-locked.';
    rollRightSub = 'IF APPROVED';
    rollTone = SB.inkSoft;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'transparent',
          border: `1px dashed ${SB.inkLine}`,
          padding: '10px 14px',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: SB.mono,
          fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.14em',
          color: SB.inkSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
        aria-expanded={open}
      >
        <span>WHAT HAPPENS AT MATURITY?</span>
        <span style={{ color: SB.orange, letterSpacing: '0.08em' }}>
          {open ? '▴ HIDE' : '▾ SHOW'}
        </span>
      </button>

      {open && (
        <>
          <SectionHead
            no="§ VI"
            title="At maturity"
            subtitle={`12 mo · with ${lender.name}`}
          />
          <div style={{
            marginTop: -2, marginBottom: 8,
            fontFamily: SB.mono, fontSize: 10, color: SB.inkSoft,
            letterSpacing: '0.04em', lineHeight: 1.55,
          }}>
            Three paths — pick one based on your situation.
          </div>
          <MaturityOption
            rn="I"
            label="PAY OFF"
            primary={fmt(totalOwedUsd)}
            primarySub={
              <>
                {fmt(interestUsd)} interest + {fmt(principalUsd)} principal{' '}
                <InfoIcon def={GLOSSARY.principal} />
                {' · no tax event'}
              </>
            }
            right={collateralBtc.toFixed(5) + ' BTC'}
            rightSub="STACK KEPT"
            tone={SB.forest}
          />
          <MaturityOption
            rn="II"
            label="ROLL OVER"
            primary={rollPrimary}
            primarySub={rollSub}
            right={collateralBtc.toFixed(5) + ' BTC'}
            rightSub={rollRightSub}
            tone={rollTone}
          />
          <MaturityOption
            rn="III"
            label="LET LENDER LIQUIDATE"
            primary={btcToCoverDebt.toFixed(5) + ' BTC sold'}
            primarySub={
              <>
                @ ${fmtNum(Math.round(btcSpotUsd))} to cover {fmt(totalOwedUsd)} · taxable in most jurisdictions{' '}
                <InfoIcon def={GLOSSARY.taxEvent} />
              </>
            }
            right={btcKeptAfterLiq.toFixed(5) + ' BTC'}
            rightSub="STACK REDUCED"
            tone={SB.rust}
          />
          <div style={{
            marginTop: 10,
            padding: '8px 2px 0',
            fontFamily: SB.mono, fontSize: 9.5, color: SB.inkMute,
            lineHeight: 1.5,
            letterSpacing: '0.02em',
          }}>
            Numbers assume BTC at today&apos;s spot price. Rollover is subject to the lender&apos;s policy at maturity and may carry a fresh origination fee. Some lenders also charge a liquidation fee — check your terms.
          </div>
        </>
      )}
    </div>
  );
}

function MaturityOption({ rn, label, primary, primarySub, right, rightSub, tone, dashed }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px minmax(0, 1fr) auto',
      alignItems: 'center', gap: 10,
      padding: '12px 0',
      borderBottom: `${dashed ? '1px dashed' : '1px dotted'} ${SB.inkLine}`,
    }}>
      <div style={{
        fontFamily: SB.serif, fontStyle: 'italic',
        fontSize: 15, color: tone, fontWeight: 500,
      }}>{rn}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9.5, fontWeight: 700,
          letterSpacing: '0.16em', color: tone, marginBottom: 4,
        }}>{label}</div>
        <div style={{
          fontFamily: SB.serif, fontSize: 16, fontWeight: 600,
          color: SB.ink, letterSpacing: '-0.005em',
        }}>{primary}</div>
        <div style={{
          fontFamily: SB.mono, fontSize: 9.5, color: SB.inkMute,
          marginTop: 3, lineHeight: 1.5,
        }}>{primarySub}</div>
      </div>
      <div style={{ textAlign: 'right', minWidth: 0 }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 13, fontWeight: 700, color: tone,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>{right}</div>
        <div style={{
          fontFamily: SB.mono, fontSize: 8.5, color: SB.inkSoft,
          marginTop: 3, letterSpacing: '0.14em', fontWeight: 700,
        }}>{rightSub}</div>
      </div>
    </div>
  );
}

// ============================================================
// LongViewSection — § VII · stretch the loan beyond maturity.
// A bonus calc for users who want to see what happens if they
// keep rolling the loan year by year (and, optionally, draw a
// fresh loan every year to live off BTC). Inherits the BTC
// price profile from § III and the top-ranked lender from § V.
// Collapsed by default — mirrors § VI's disclosure pattern.
// ============================================================
function LongViewSection({
  lender, loanUsd, collateralBtc, btcSpotUsd,
  activeCagr, profileId, caseId, profiles,
  currency, fmt,
}) {
  const [open, setOpen] = useState(false);
  const [years, setYears] = usePersistentState('longViewYears', 10);
  const [livingOff, setLivingOff] = usePersistentState('longViewLivingOff', false);

  if (!lender) return null;
  if (!loanUsd || loanUsd <= 0) return null;

  // === Math ===
  // Per-year growth model. Origination is charged as a one-shot fee
  // at the start of each rollover year (not folded into APR), so the
  // compounding stays honest. Revolving lines have no rollover event,
  // so no recurring origination.
  const apr = lender.apr ?? 10;
  const origPct = lender.originationFeePctEffective ?? 0;
  const ease = lender.rolloverEase;
  const annualFactor = 1 + apr / 100;
  const reorigEachYear = ease !== 'revolving';

  let owed = loanUsd;
  for (let y = 1; y <= years; y++) {
    if (livingOff && y > 1) owed += loanUsd;                       // fresh draw at start of year y
    if (reorigEachYear)     owed = owed * (1 + origPct / 100);     // origination on rolled balance
    owed = owed * annualFactor;                                    // 12 months of interest
  }

  const btcPriceAtN = projectBtcPrice(btcSpotUsd, activeCagr, years);
  const sane = btcPriceAtN >= 1;                  // guard against negative CAGR over many years
  const btcToSettle = sane ? owed / btcPriceAtN : null;
  const btcRemaining = btcToSettle != null ? collateralBtc - btcToSettle : null;
  const underwater = btcRemaining != null && btcRemaining < 0;

  const priceMul = btcPriceAtN / btcSpotUsd;
  const debtBase = livingOff ? loanUsd * years : loanUsd;
  const debtMul = debtBase > 0 ? owed / debtBase : 0;
  const stackPctLeft = btcRemaining != null && collateralBtc > 0
    ? (btcRemaining / collateralBtc) * 100 : 0;

  // Row II + footnote vary by lender's rolloverEase.
  const easeLabel =
    ease === 'revolving'    ? 'revolving line · no rollover'
    : ease === 'approval'   ? 'refinance every 12 mo'
    :                         'new loan every 12 mo';
  const easeFootnote =
    ease === 'revolving'    ? `Assumes ${lender.name} keeps the line open at today's APR. Interest compounds on whatever balance sits outstanding.`
    : ease === 'approval'   ? `Assumes ${lender.name} keeps refinancing you at today's APR and ${origPct.toFixed(1)}% origination — approval not guaranteed.`
    :                         `Each rollover is a brand-new loan application with ${lender.name} — approval not guaranteed. Numbers assume today's terms hold.`;

  const persona = profiles[profileId]?.persona || profileId;
  const yrLabel = years === 1 ? 'YEAR' : 'YEARS';

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'transparent',
          border: `1px dashed ${SB.inkLine}`,
          padding: '10px 14px',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: SB.mono,
          fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.14em',
          color: SB.inkSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
        aria-expanded={open}
      >
        <span>PLAY WITH THE TIMELINE?</span>
        <span style={{ color: SB.orange, letterSpacing: '0.08em' }}>
          {open ? '▴ HIDE' : '▾ SHOW'}
        </span>
      </button>

      {open && (
        <>
          <SectionHead
            no="§ VII"
            title="Long view"
            subtitle={`${persona} · ${caseId} case · ${lender.name}`}
          />
          <div style={{
            marginTop: -2, marginBottom: 10,
            fontFamily: SB.mono, fontSize: 10, color: SB.inkSoft,
            letterSpacing: '0.04em', lineHeight: 1.55,
          }}>
            Stretch the loan beyond maturity — what does it take to settle later?{' '}
            <InfoIcon def={GLOSSARY.longView} />
          </div>

          {/* === Year slider === */}
          <div style={{
            padding: '10px 0 4px',
            borderTop: `1px dotted ${SB.inkLine}`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 6,
            }}>
              <span style={{
                fontFamily: SB.mono, fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.16em', color: SB.inkSoft,
              }}>SETTLE IN</span>
              <span style={{
                fontFamily: SB.serif, fontSize: 20, fontWeight: 600,
                color: SB.orange, letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {years}
                <span style={{
                  fontFamily: SB.mono, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', color: SB.inkSoft, marginLeft: 6,
                }}>{yrLabel}</span>
              </span>
            </div>
            <input
              type="range"
              min={1} max={20} step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="sb-slider"
              aria-label="Years until settlement"
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 4,
              fontFamily: SB.mono, fontSize: 9, color: SB.inkFaint,
              letterSpacing: '0.05em',
            }}>
              <span>1 YR</span>
              <span>20 YR</span>
            </div>
          </div>

          {/* === Living-off toggle === */}
          <button
            onClick={() => setLivingOff(!livingOff)}
            style={{
              marginTop: 10, width: '100%',
              padding: '10px 12px',
              background: livingOff ? SB.orangeWash : 'transparent',
              border: `1px ${livingOff ? 'solid' : 'dashed'} ${livingOff ? SB.orange : SB.inkLine}`,
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: SB.mono, fontSize: 10,
              color: livingOff ? SB.orange : SB.inkSoft,
            }}
            aria-pressed={livingOff}
          >
            <span style={{
              width: 13, height: 13,
              border: `1.5px solid ${livingOff ? SB.orange : SB.inkLine}`,
              background: livingOff ? SB.orange : 'transparent',
              display: 'inline-block', flexShrink: 0,
              position: 'relative',
            }}>
              {livingOff && (
                <span style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: SB.cream, fontSize: 10, fontWeight: 900, lineHeight: 1,
                }}>✓</span>
              )}
            </span>
            <span style={{ letterSpacing: '0.08em', fontWeight: 700 }}>
              LIVING OFF BTC — DRAW {fmt(loanUsd)} EVERY YEAR
            </span>
          </button>

          {/* === Result rows === */}
          <div style={{ marginTop: 8 }}>
            <MaturityOption
              rn="I"
              label={`BTC PRICE @ Y${years}`}
              primary={sane
                ? <FormattedMoney usd={btcPriceAtN} currency={currency} spot={btcSpotUsd} />
                : 'n/a'}
              primarySub={`${persona} · ${caseId} case`}
              right={sane
                ? `×${priceMul >= 100 ? priceMul.toFixed(0) : priceMul.toFixed(2)}`
                : '—'}
              rightSub="VS TODAY"
              tone={activeCagr >= 0 ? SB.forest : SB.rust}
            />
            <MaturityOption
              rn="II"
              label={`DEBT @ Y${years}`}
              primary={<FormattedMoney usd={owed} currency={currency} spot={btcSpotUsd} />}
              primarySub={
                <>
                  compounded · {easeLabel}{' '}
                  <InfoIcon def={GLOSSARY.rollover} />
                </>
              }
              right={`×${debtMul.toFixed(1)}`}
              rightSub={livingOff ? 'VS YEARLY DRAWS' : 'VS PRINCIPAL'}
              tone={SB.inkSoft}
            />
            <MaturityOption
              rn="III"
              label="BTC TO SETTLE"
              primary={btcToSettle != null ? btcToSettle.toFixed(5) + ' BTC' : 'n/a'}
              primarySub={
                <>
                  at projected price · no tax event{' '}
                  <InfoIcon def={GLOSSARY.taxEvent} />
                </>
              }
              right={btcToSettle != null
                ? <FormattedMoney usd={owed} currency={currency} spot={btcSpotUsd} />
                : '—'}
              rightSub="FIAT VALUE"
              tone={SB.ink}
            />
            <MaturityOption
              rn="IV"
              label="STACK LEFT"
              primary={
                underwater
                  ? <>UNDERWATER <InfoIcon def={GLOSSARY.liquidation} /></>
                  : (btcRemaining != null ? btcRemaining.toFixed(5) + ' BTC' : 'n/a')
              }
              primarySub={
                underwater
                  ? `Debt would need ${btcToSettle.toFixed(5)} BTC — you've locked ${collateralBtc.toFixed(5)}.`
                  : `of ${collateralBtc.toFixed(5)} BTC originally locked`
              }
              right={underwater ? '—' : `${stackPctLeft.toFixed(0)}%`}
              rightSub={underwater ? 'STACK SHORT' : 'STACK KEPT'}
              tone={underwater ? SB.rust : SB.forest}
            />
          </div>

          {/* Stack value box — fiat verdict of what's left, mirrors § IV NET WORTH box */}
          {sane && !underwater && btcRemaining > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 12px 12px', marginTop: 10,
              border: `1.5px dashed ${SB.forest}`,
              background: SB.forestWash,
            }}>
              <div>
                <div style={{
                  fontFamily: SB.mono, fontSize: 10.5, fontWeight: 700,
                  letterSpacing: '0.2em', color: SB.forest,
                }}>STACK VALUE @ Y{years}</div>
                <div style={{
                  fontFamily: SB.mono, fontSize: 9,
                  color: SB.inkMute, marginTop: 3, letterSpacing: '0.06em',
                }}>at projected price · {persona} · {caseId} case</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: SB.serif, fontSize: 26, fontWeight: 600,
                  color: SB.forest, letterSpacing: '-0.02em', lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <FormattedMoney usd={btcRemaining * btcPriceAtN} currency={currency} spot={btcSpotUsd} />
                </div>
                <div style={{
                  fontFamily: SB.mono, fontSize: 9,
                  color: SB.forest,
                  marginTop: 4, fontWeight: 700, letterSpacing: '0.1em',
                }}>
                  ↑ STACK YOU KEPT
                </div>
              </div>
            </div>
          )}

          {/* Bear-case caveat */}
          {underwater && activeCagr < 0 && (
            <div style={{
              marginTop: 8,
              padding: '8px 10px',
              background: SB.rustWash,
              border: `1px dashed ${SB.rust}`,
              fontFamily: SB.mono, fontSize: 10, color: SB.rust,
              letterSpacing: '0.04em', lineHeight: 1.5,
            }}>
              Bear case — BTC needed to settle exceeds your collateral by year {years}.
            </div>
          )}

          {/* Footnote */}
          <div style={{
            marginTop: 10,
            padding: '8px 2px 0',
            fontFamily: SB.mono, fontSize: 9.5, color: SB.inkMute,
            lineHeight: 1.5,
            letterSpacing: '0.02em',
          }}>
            {easeFootnote}
            {livingOff && ' Living-off scenario assumes each new draw is approved at the same LTV.'}
          </div>
        </>
      )}
    </div>
  );
}

// Friendly label for a region code (used in NoRegion void state).
function regionLabelFor(code) {
  const map = {
    us: 'the US', ca: 'Canada', eu: 'the EU', uk: 'the UK',
    au: 'Australia', jp: 'Japan', ch: 'Switzerland',
    global: 'your region',
  };
  return map[code] || 'your region';
}

// ============================================================
// DesktopCalculatorLayout — open-spread variant for >=1024px.
// Left = inputs, terms, profile picker, scenarios. Right =
// projection chart, verdict, top-4 quotes, CTA.
// ============================================================
function DesktopCalculatorLayout(props) {
  const {
    live, currency, cycleCurrency,
    loanInCurrency, onSlide, min, max, step,
    loanUsd, btcSpotUsd,
    collateralBtc, collateralSats,
    liqUsd, liqDropPct,
    profileId, setProfileId, caseId, setCaseId, profiles,
    activeCagr, totalOwedUsd, collateralBtcAfterSell, deltaUsd,
    ranked, bestLender, interestUsd, satsToSell, grossSaleUsd, taxOwedUsd,
    fmt, lastUpdated,
    expandedQuoteId, setExpandedQuoteId,
  } = props;
  const meta = CURRENCY_META[currency];

  const rightSlot = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      <LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />
      <button onClick={cycleCurrency} style={{
        background: 'transparent',
        border: `1.5px solid ${SB.ink}`,
        padding: '4px 10px',
        fontFamily: SB.mono,
        fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em',
        color: SB.ink, cursor: 'pointer',
      }}>
        {meta.label} ▾
      </button>
    </div>
  );

  const left = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 4,
      }}>
        PAGE II · LEFT — INPUTS · TERMS · PROJECTION
      </div>

      <DSectionHead no="§ I" title="Loan amount" />

      <div style={{
        padding: '18px',
        background: SB.orangeWash,
        border: `1.5px dashed ${SB.orangeSoft}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.22em',
          color: SB.orange, fontWeight: 700,
        }}>PRINCIPAL · BORROWED</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {meta.position === 'pre' && (
            <span style={{ fontFamily: SB.serif, fontSize: 38, fontWeight: 400, color: SB.inkMute, lineHeight: 1 }}>{meta.symbol}</span>
          )}
          <span style={{
            fontFamily: SB.serif, fontSize: 60, fontWeight: 600,
            color: SB.ink, letterSpacing: '-0.025em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{fmtNum(loanInCurrency)}</span>
          {meta.position === 'post' && (
            <span style={{ fontFamily: SB.mono, fontSize: 22, fontWeight: 500, color: SB.inkMute, marginLeft: 6 }}>{meta.symbol}</span>
          )}
        </div>

        <div>
          <input
            type="range"
            min={min} max={max} step={step}
            value={loanInCurrency}
            onChange={onSlide}
            className="sb-slider"
            aria-label="Loan amount"
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 6,
            fontFamily: SB.mono, fontSize: 10, color: SB.inkFaint, letterSpacing: '0.05em',
          }}>
            <span>{rangeLabel(min, currency)}</span>
            <span>~{fmtMoney(loanUsd, 'USD', CURRENCY_META, btcSpotUsd)} USD</span>
            <span>{rangeLabel(max, currency)}</span>
          </div>
        </div>
      </div>

      <DSectionHead no="§ II" title="Collateral & terms" />

      <div style={{ padding: '0 2px' }}>
        <Row label="Collateral required" value={collateralBtc.toFixed(5) + ' BTC'} sub={fmtNum(collateralSats) + ' sats'} info={GLOSSARY.collateral} />
        <Row label="Loan-to-value (fixed)" value="50%" info={GLOSSARY.ltv} />
        <Row label="Term length" value="12 months" sub="balloon at maturity" info={GLOSSARY.balloon} />
        <Row label="Liquidation price"
             value={'$' + fmtNum(liqUsd)}
             valueStyle={{ color: SB.rust }}
             sub={Math.abs(liqDropPct).toFixed(1) + '% drop from spot'}
             info={GLOSSARY.liquidation} />
        <Row label="Sats lost if liquidated"
             value={'−' + fmtNum(collateralSats * (LIQ_LTV_PCT / 100))}
             valueStyle={{ color: SB.rust }}
             info={GLOSSARY.sats} />
      </div>

      <div style={{
        marginTop: 14, padding: '14px 16px',
        background: SB.rustWash,
        border: `1px dashed ${SB.rust}`,
        display: 'flex', alignItems: 'flex-start', gap: 12,
        fontFamily: SB.mono, fontSize: 12,
        color: SB.rust, lineHeight: 1.45,
      }}>
        <span style={{ fontWeight: 700, marginTop: 1, fontSize: 14 }}>!</span>
        <div>
          <div style={{ fontWeight: 700, letterSpacing: '0.1em' }}>HEADS UP</div>
          <div style={{ marginTop: 4 }}>
            BTC has dropped &gt;{Math.abs(liqDropPct).toFixed(0)}% from a
            12-month high in 6 of the last 12 years. Keep cash for buffer.
          </div>
        </div>
      </div>

      <DSectionHead no="§ III" title="Audited by" subtitle="whose BTC projection do you trust?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {Object.entries(profiles).map(([id, p]) => {
          const active = id === profileId;
          return (
            <button key={id} onClick={() => setProfileId(id)} style={{
              padding: '14px 8px 12px',
              border: `1.5px ${active ? 'solid' : 'dashed'} ${active ? SB.ink : SB.inkLine}`,
              background: active ? SB.inkFill : 'transparent',
              color: active ? SB.cream : SB.ink,
              textAlign: 'center', cursor: 'pointer',
              fontFamily: 'inherit',
            }} title={p.blurb}>
              <div style={{
                fontFamily: SB.serif, fontSize: 22, fontStyle: 'italic',
                fontWeight: 500, lineHeight: 1,
                color: active ? SB.orange : SB.inkSoft,
              }}>{p.initials}</div>
              <div style={{
                fontFamily: SB.mono, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', marginTop: 8,
              }}>{p.name}</div>
              <div style={{
                fontFamily: SB.mono, fontSize: 9, fontWeight: 600,
                letterSpacing: '0.14em',
                color: active ? 'rgba(255,255,255,0.6)' : SB.inkMute,
                marginTop: 2,
              }}>{(p.persona || '').toUpperCase()}</div>
              <div style={{
                fontFamily: SB.mono, fontSize: 13, fontWeight: 700,
                marginTop: 8,
                color: active ? SB.orange : SB.ink,
              }}>{fmtPct(p.cases.base, 0)}/yr</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', marginTop: 16, border: `1.5px solid ${SB.ink}` }}>
        {['bear', 'base', 'bull'].map((c, i) => {
          const active = c === caseId;
          const v = profiles[profileId].cases[c];
          return (
            <button key={c} onClick={() => setCaseId(c)} style={{
              flex: 1, padding: '14px 8px',
              textAlign: 'center',
              borderRight: i < 2 ? `1px dashed ${SB.inkLine}` : 'none',
              borderTop: 'none', borderLeft: 'none', borderBottom: 'none',
              background: active ? SB.inkFill : 'transparent',
              color: active ? SB.cream : SB.ink,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <div style={{
                fontFamily: SB.mono, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em',
              }}>{c.toUpperCase()}</div>
              <div style={{
                fontFamily: SB.serif, fontSize: 20, fontWeight: 600,
                marginTop: 4, color: active ? SB.orange : SB.ink,
                letterSpacing: '-0.01em',
              }}>{fmtPct(v, 0)}</div>
            </button>
          );
        })}
      </div>

      <DSectionHead no="§ IV" title="Projection" subtitle="net of interest, tax & liquidations" />

      <Projection
        spot={btcSpotUsd}
        cagr={activeCagr}
        collateralBtc={collateralBtc}
        totalOwedUsd={totalOwedUsd}
        collateralBtcAfterSell={collateralBtcAfterSell}
        currency={currency}
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
          padding: '20px 18px 18px', marginTop: 14,
          border: `1.5px dashed ${SB.orange}`,
          background: SB.orangeWash,
        }}>
          <div>
            <div style={{
              fontFamily: SB.mono, fontSize: 12, fontWeight: 700,
              letterSpacing: '0.2em', color: SB.orange,
            }}>NET WORTH @ Y20</div>
            <div style={{
              fontFamily: SB.mono, fontSize: 10,
              color: SB.inkMute, marginTop: 4, letterSpacing: '0.06em',
            }}>vs selling · {caseId} case · {profileId}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: SB.serif, fontSize: 32, fontWeight: 600,
              color: SB.ink, letterSpacing: '-0.02em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {deltaUsd >= 0 ? '+' : ''}
              <FormattedMoney usd={deltaUsd} currency={currency} spot={btcSpotUsd} />
            </div>
            <div style={{
              fontFamily: SB.mono, fontSize: 10,
              color: deltaUsd >= 0 ? SB.forest : SB.rust,
              marginTop: 6, fontWeight: 700, letterSpacing: '0.12em',
            }}>
              {deltaUsd >= 0 ? '↑ KEEP THE STACK' : '↓ SELL WINS HERE'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 4,
      }}>
        PAGE II · RIGHT — QUOTES & MATURITY
      </div>

      <DSectionHead no="§ V" title="Best quotes" subtitle={`ranked by total cost · ${Math.min(4, ranked.length)} of ${Math.max(4, ranked.length)}`} />

      <div style={{ marginBottom: 14 }}>
        {ranked.slice(0, 4).map((q, i) => {
          const rn = ['I', 'II', 'III', 'IV'][i];
          const isExpanded = expandedQuoteId === q.id;
          const truncated = q.notes && q.notes.length > 100;
          const rp = rolloverPillSpec(q.rolloverEase);
          return (
            <div
              key={q.id}
              onClick={() => truncated && setExpandedQuoteId(isExpanded ? null : q.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr auto',
                alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: `1px dotted ${SB.inkLine}`,
                cursor: truncated ? 'pointer' : 'default',
              }}>
              <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 18, color: SB.orange, fontWeight: 500 }}>{rn}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: SB.serif, fontSize: 18, fontWeight: 600, color: SB.ink, letterSpacing: '-0.005em' }}>{q.name}</span>
                  <Pill color={i === 0 ? SB.forest : SB.ink} filled={i === 0}>{q.badge || '—'}</Pill>
                  {q.isTiered && <Pill color={SB.orange}>TIERED</Pill>}
                  {rp && <Pill color={rp.color}>{rp.label}</Pill>}
                </div>
                {q.notes && (
                  <div>
                    <div style={{
                      fontFamily: SB.mono, fontSize: 11, color: SB.inkMute, marginTop: 4,
                      letterSpacing: '0.02em', lineHeight: 1.5,
                    }}>
                      {isExpanded || !truncated ? q.notes : q.notes.slice(0, 100) + '…'}
                    </div>
                    {truncated && (
                      <div style={{
                        fontFamily: SB.mono, fontSize: 11, fontWeight: 700, color: SB.orange,
                        marginTop: 2, letterSpacing: '0.02em',
                      }}>
                        {isExpanded ? 'show less ▴' : 'show more ▾'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: SB.mono, fontSize: 16, fontWeight: 700, color: SB.orange }}>
                  {q.effectiveApr.toFixed(2)}%
                </div>
                <div style={{ fontFamily: SB.mono, fontSize: 10, color: SB.inkSoft, marginTop: 2 }}>
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
            No matching lenders for this loan size or region.
          </div>
        )}
      </div>

      <Button href={bestLender?.referralUrl || '#lenders'}>
        {bestLender ? `OPEN WITH ${bestLender.name.toUpperCase()}` : 'BROWSE ALL LENDERS'}
      </Button>
      <div style={{
        textAlign: 'center', marginTop: 10,
        fontFamily: SB.mono, fontSize: 10,
        letterSpacing: '0.16em', color: SB.inkMute,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <span>· you&apos;ll leave Stack &amp; Borrow ·</span>
        <span>not your details</span>
      </div>

      <MaturitySection
        lender={bestLender}
        principalUsd={loanUsd}
        interestUsd={interestUsd}
        totalOwedUsd={totalOwedUsd}
        collateralBtc={collateralBtc}
        collateralSats={collateralSats}
        btcSpotUsd={btcSpotUsd}
        fmt={fmt}
      />

      <LongViewSection
        lender={bestLender}
        loanUsd={loanUsd}
        collateralBtc={collateralBtc}
        btcSpotUsd={btcSpotUsd}
        activeCagr={activeCagr}
        profileId={profileId}
        caseId={caseId}
        profiles={profiles}
        currency={currency}
        fmt={fmt}
      />
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left}
      right={right}
      active="calc"
      currentPage="II"
      pageOf="IV"
      rightSlot={rightSlot}
      footerSource={live.source}
      footerUpdated={lastUpdated}
    />
  );
}
