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
  InfoIcon,
  ensureSliderCss,
} from '../system/components.jsx';
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
  fmtMoney,
  fmtMoneyCompact,
  fmtPct,
} from '../lib/format.js';
import { useT } from '../i18n/index.jsx';

const SCENARIO_IDS = ['bear', 'base', 'bull'];

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
  const t = useT();

  // ===== STATE (all persisted) =====
  const [currency, setCurrency]               = usePersistentState('currency', initialCurrency || 'USD');
  const [loanInCurrency, setLoanInCurrency]   = usePersistentState('desiredLoan', 50000);
  const [profileId, setProfileId]             = usePersistentState('activeProfile', 'saylor');
  const [caseId, setCaseId]                   = usePersistentState('activeCase', 'base');
  const [profiles]                            = usePersistentState('profiles', DEFAULT_PROFILES);
  const [expandedQuoteId, setExpandedQuoteId] = useState(null);
  const [selectedLenderId, setSelectedLenderId] = usePersistentState('selectedLenderId', null);

  const btcSpotUsd = live.btcUsd;

  // ===== DERIVED VALUES =====
  const loanUsd = toUsd(loanInCurrency, currency, live.meta, btcSpotUsd);
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
  const top4 = ranked.slice(0, 4);
  const activeLender = top4.find(l => l.id === selectedLenderId) || ranked[0];
  const aprPct = activeLender?.apr ?? 10;
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

  const onAmountChange = useCallback((e) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    if (cleaned === '') { setLoanInCurrency(0); return; }
    const n = Number(cleaned);
    if (!isNaN(n)) setLoanInCurrency(n);
  }, [setLoanInCurrency]);

  // Cycle through supported currencies, preserving the loan's USD value.
  const cycleCurrency = useCallback(() => {
    const keys = Object.keys(CURRENCY_META);
    const next = keys[(keys.indexOf(currency) + 1) % keys.length];
    const usd = toUsd(loanInCurrency, currency, live.meta, btcSpotUsd);
    const newVal = usdTo(usd, next, live.meta, btcSpotUsd);
    const m = CURRENCY_META[next];
    const s = CURRENCY_STEP[next] || 1000;
    const clamped = Math.max(m.minLoan, Math.min(m.maxLoan, Math.round(newVal / s) * s));
    setLoanInCurrency(clamped);
    setCurrency(next);
  }, [currency, loanInCurrency, btcSpotUsd, setCurrency, setLoanInCurrency]);

  // Format helpers bound to current currency
  const fmt = (usd) => fmtMoney(usd, currency, live.meta, btcSpotUsd);

  // ===== VOID STATES =====
  // First-paint loading splash: live prices haven't resolved yet.
  if (live.loading && live.source === 'fallback') {
    return <VoidStateLoading source="mempool.space" />;
  }
  // Loan below the global $1,000 floor — no lender will quote.
  if (loanUsd > 0 && loanUsd < 1000) {
    const resetToValid = () => {
      const targetUsd = 1500;
      const inCurrency = usdTo(targetUsd, currency, live.meta, btcSpotUsd);
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
        regionLabel={t(`calc.region.${region}`) || t('calc.region.global')}
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
        onAmountChange={onAmountChange}
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
        activeLender={activeLender}
        interestUsd={interestUsd}
        satsToSell={satsToSell}
        grossSaleUsd={grossSaleUsd}
        taxOwedUsd={taxOwedUsd}
        fmt={fmt}
        lastUpdated={lastUpdated}
        expandedQuoteId={expandedQuoteId}
        setExpandedQuoteId={setExpandedQuoteId}
        selectedLenderId={selectedLenderId}
        setSelectedLenderId={setSelectedLenderId}
      />
    );
  }

  return (
    <PaperFrame>
      <style>{`
        .cp-amount-input {
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
        .cp-amount-input::placeholder { color: ${SB.inkFaint}; }
      `}</style>

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

      <SectionHead no="§ I" title={t('calc.section.loanAmount')} />

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
        }}>{t('calc.amount.label')}</div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          {CURRENCY_META[currency].position === 'pre' && (
            <span style={{ fontFamily: SB.serif, fontSize: 32, fontWeight: 400, color: SB.inkMute, lineHeight: 1, flexShrink: 0 }}>
              {CURRENCY_META[currency].symbol}
            </span>
          )}
          <input
            className="cp-amount-input"
            type="text"
            inputMode="numeric"
            aria-label={t('calc.amount.inputLabel')}
            value={fmtNum(loanInCurrency)}
            onChange={onAmountChange}
            onFocus={(e) => e.target.select()}
          />
          {CURRENCY_META[currency].position === 'post' && (
            <span style={{
              fontFamily: SB.mono, fontSize: 16, fontWeight: 500,
              color: SB.inkMute, marginLeft: 4, flexShrink: 0,
            }}>{CURRENCY_META[currency].symbol}</span>
          )}
        </div>

        {/* Slider */}
        <div>
          <input
            type="range"
            min={min} max={max} step={step}
            value={loanInCurrency}
            onChange={onSlide}
            className="sb-slider"
            aria-label={t('calc.amount.inputLabel')}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 4,
            fontFamily: SB.mono, fontSize: 9, color: SB.inkFaint,
            letterSpacing: '0.05em',
          }}>
            <span>{rangeLabel(min, currency)}</span>
            <span>~{fmtMoney(loanUsd, 'USD', live.meta, btcSpotUsd)} USD</span>
            <span>{rangeLabel(max, currency)}</span>
          </div>
        </div>
      </div>

      <SectionHead no="§ II" title={t('calc.section.collateral')} />

      <div style={{ padding: '0 2px' }}>
        <Row label={t('calc.row.collateral')} value={collateralBtc.toFixed(5) + ' BTC'} sub={fmtNum(collateralSats) + ' sats'} info={{ term: 'collateral' }} />
        <Row label={t('calc.row.ltv')} value="50%" info={{ term: 'ltv' }} />
        <Row label={t('calc.row.term')} value={t('calc.row.termValue')} sub={t('calc.row.termSub')} info={{ term: 'balloon' }} />
        <Row label={t('calc.row.liquidation')}
             value={'$' + fmtNum(liqUsd)}
             valueStyle={{ color: SB.rust }}
             sub={t('calc.row.liquidationSub', { pct: Math.abs(liqDropPct).toFixed(1) })}
             info={{ term: 'liquidation' }} />
        <Row label={t('calc.row.satsLost')}
             value={'−' + fmtNum(collateralSats * (LIQ_LTV_PCT / 100))}
             valueStyle={{ color: SB.rust }}
             info={{ term: 'sats' }} />
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
          <div style={{ fontWeight: 700, letterSpacing: '0.08em' }}>{t('calc.alert.headsUp')}</div>
          <div style={{ marginTop: 2 }}>
            {t('calc.alert.body', { pct: Math.abs(liqDropPct).toFixed(0) })}
          </div>
        </div>
      </div>

      <SectionHead no="§ III" title={t('calc.section.audited')} subtitle={t('calc.section.auditedSub')} />

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
              }}>{fmtPct(p.cases.base, 0)}{t('calc.scenario.perYear')}</div>
            </button>
          );
        })}
      </div>

      {/* Scenario tabs */}
      <div style={{
        display: 'flex', marginTop: 14,
        border: `1.5px solid ${SB.ink}`,
      }}>
        {SCENARIO_IDS.map((c, i) => {
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
              }}>{t(`calc.scenario.${c}`)}</div>
              <div style={{
                fontFamily: SB.serif, fontSize: 16, fontWeight: 600,
                marginTop: 2, color: active ? SB.orange : SB.ink,
                letterSpacing: '-0.01em',
              }}>{fmtPct(v, 0)}</div>
            </button>
          );
        })}
      </div>

      <SectionHead no="§ IV" title={t('calc.section.projection')} subtitle={t('calc.section.projectionSub')} />

      <Projection
        spot={btcSpotUsd}
        cagr={activeCagr}
        collateralBtc={collateralBtc}
        totalOwedUsd={totalOwedUsd}
        collateralBtcAfterSell={collateralBtcAfterSell}
        currency={currency}
        meta={live.meta}
      />

      <DashedRule label={t('calc.section.verdict')} />

      <div style={{ padding: '0 2px' }}>
        <Row
          label={t('calc.verdict.sell')}
          value={'−' + fmtNum(satsToSell) + ' sats'}
          valueStyle={{ color: SB.rust }}
          sub={t('calc.verdict.sellSub', { tax: fmt(taxOwedUsd), gross: fmt(grossSaleUsd) })}
        />
        <Row
          label={t('calc.verdict.borrow')}
          value={t('calc.verdict.borrowValue')}
          valueStyle={{ color: SB.forest }}
          sub={t('calc.verdict.borrowSub', { interest: fmt(interestUsd), months: TERM_MONTHS })}
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
            }}>{t('calc.verdict.netWorth')}</div>
            <div style={{
              fontFamily: SB.mono, fontSize: 9,
              color: SB.inkMute, marginTop: 3, letterSpacing: '0.06em',
            }}>{t('calc.verdict.netWorthSub', { case: caseId, profile: profileId })}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: SB.serif, fontSize: 26, fontWeight: 600,
              color: SB.ink, letterSpacing: '-0.02em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {deltaUsd >= 0 ? '+' : ''}
              <FormattedMoney usd={deltaUsd} currency={currency} meta={live.meta} spot={btcSpotUsd} />
            </div>
            <div style={{
              fontFamily: SB.mono, fontSize: 9,
              color: deltaUsd >= 0 ? SB.forest : SB.rust,
              marginTop: 4, fontWeight: 700, letterSpacing: '0.1em',
            }}>
              {deltaUsd >= 0 ? t('calc.verdict.keepStack') : t('calc.verdict.sellWins')}
            </div>
          </div>
        </div>
      </div>

      <SectionHead no="§ V" title={t('calc.section.bestQuotes')} subtitle={t('calc.section.bestQuotesSub', { shown: Math.min(4, ranked.length), total: Math.max(4, ranked.length) })} />

      <div style={{ marginBottom: 12 }}>
        {ranked.slice(0, 4).map((q, i) => {
          const rn = ['I', 'II', 'III', 'IV'][i];
          const isExpanded = expandedQuoteId === q.id;
          const isActive = q.id === activeLender?.id;
          const truncated = q.notes && q.notes.length > 80;
          const rp = rolloverPillSpec(q.rolloverEase, t);
          return (
            <div
              key={q.id}
              onClick={() => setSelectedLenderId(isActive ? null : q.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto',
                alignItems: 'center', gap: 10,
                padding: '10px 8px',
                marginLeft: -8, marginRight: -8,
                borderBottom: `1px dotted ${SB.inkLine}`,
                background: isActive ? 'rgba(216, 96, 24, 0.05)' : 'transparent',
                boxShadow: isActive ? `inset 2px 0 0 ${SB.orange}` : 'none',
                cursor: 'pointer',
              }}>
              <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 15, color: SB.orange, fontWeight: 500 }}>{rn}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: SB.serif, fontSize: 16, fontWeight: 600, color: SB.ink, letterSpacing: '-0.005em' }}>{q.name}</span>
                  <Pill color={i === 0 ? SB.forest : SB.ink} filled={i === 0}>{q.badge || '—'}</Pill>
                  {isActive && <Pill color={SB.orange} filled>{t('calc.quotes.active')}</Pill>}
                  {q.isTiered && <Pill color={SB.orange}>{t('lenders.badge.tiered')}</Pill>}
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
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedQuoteId(isExpanded ? null : q.id);
                        }}
                        style={{
                          display: 'inline-block',
                          fontFamily: SB.mono, fontSize: 9.5, fontWeight: 700, color: SB.orange,
                          marginTop: 2, letterSpacing: '0.02em',
                          cursor: 'pointer',
                        }}>
                        {isExpanded ? t('calc.quotes.showLess') : t('calc.quotes.showMore')}
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
            {t('calc.quotes.noMatch')}
          </div>
        )}
      </div>

      <Button href={activeLender?.referralUrl || '#lenders'}>
        {activeLender
          ? t('common.cta.openWith', { name: activeLender.name.toUpperCase() })
          : t('common.cta.browseAll')}
      </Button>
      <div style={{
        textAlign: 'center', marginTop: 8,
        fontFamily: SB.mono,
        fontSize: 9, letterSpacing: '0.16em',
        color: SB.inkMute,
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <span>{t('common.leave.line1')}</span>
        <span>{t('common.leave.line2')}</span>
      </div>

      <MaturitySection
        lender={activeLender}
        principalUsd={loanUsd}
        interestUsd={interestUsd}
        totalOwedUsd={totalOwedUsd}
        collateralBtc={collateralBtc}
        collateralSats={collateralSats}
        btcSpotUsd={btcSpotUsd}
        fmt={fmt}
      />

      <LongViewSection
        lender={activeLender}
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
function FormattedMoney({ usd, currency, meta, spot }) {
  const s = fmtMoneyCompact(usd, currency, meta, spot);
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
function Projection({ spot, cagr, collateralBtc, totalOwedUsd, collateralBtcAfterSell, currency, meta }) {
  const t = useT();
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
            {t('calc.projection.borrow')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, borderTop: `1.5px dashed ${SB.ink}`, display: 'inline-block' }} />
            {t('calc.projection.sell')}
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
              {t('calc.projection.year', { n: m.y })}
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
              <FormattedMoney usd={m.val} currency={currency} meta={meta} spot={spot} />
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
function rolloverPillSpec(ease, t) {
  if (ease === 'revolving')    return { color: SB.forest,  label: t('calc.rollPill.revolving') };
  if (ease === 'approval')     return { color: SB.inkMute, label: t('calc.rollPill.refinance') };
  if (ease === 'new-contract') return { color: SB.inkMute, label: t('calc.rollPill.newContract') };
  return null;
}

// ============================================================
// MaturitySection — § VI · what happens 12 months from now.
// ============================================================
function MaturitySection({
  lender, principalUsd, interestUsd, totalOwedUsd,
  collateralBtc, collateralSats, btcSpotUsd, fmt,
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (!lender) return null;

  const btcToCoverDebt = totalOwedUsd / btcSpotUsd;
  const satsToCoverDebt = Math.round(btcToCoverDebt * SATS_PER_BTC);
  const btcKeptAfterLiq = Math.max(0, collateralBtc - btcToCoverDebt);

  const ease = lender.rolloverEase;
  let rollPrimary, rollSub, rollRightSub, rollTone;
  if (ease === 'revolving') {
    rollPrimary = <>{t('calc.maturity.rollover.revolving.primary')}<InfoIcon term="revolving" /></>;
    rollSub = t('calc.maturity.rollover.revolving.sub');
    rollRightSub = t('calc.maturity.rollover.revolving.rightSub');
    rollTone = SB.forest;
  } else if (ease === 'approval') {
    rollPrimary = <>{t('calc.maturity.rollover.refinance.primary')}<InfoIcon term="refinance" /></>;
    rollSub = t('calc.maturity.rollover.refinance.sub');
    rollRightSub = t('calc.maturity.rollover.refinance.rightSub');
    rollTone = SB.inkSoft;
  } else {
    rollPrimary = <>{t('calc.maturity.rollover.newContract.primary')}<InfoIcon term="newContract" /></>;
    rollSub = t('calc.maturity.rollover.newContract.sub');
    rollRightSub = t('calc.maturity.rollover.newContract.rightSub');
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
        <span>{t('calc.maturity.toggle')}</span>
        <span style={{ color: SB.orange, letterSpacing: '0.08em' }}>
          {open ? t('calc.maturity.hide') : t('calc.maturity.show')}
        </span>
      </button>

      {open && (
        <>
          <SectionHead
            no="§ VI"
            title={t('calc.section.atMaturity')}
            subtitle={t('calc.section.atMaturitySub', { months: TERM_MONTHS, lender: lender.name })}
          />
          <div style={{
            marginTop: -2, marginBottom: 8,
            fontFamily: SB.mono, fontSize: 10, color: SB.inkSoft,
            letterSpacing: '0.04em', lineHeight: 1.55,
          }}>
            {t('calc.maturity.intro')}
          </div>
          <MaturityOption
            rn="I"
            label={t('calc.maturity.payoff.label')}
            primary={fmt(totalOwedUsd)}
            primarySub={
              <>
                {t('calc.maturity.payoff.subBefore', { interest: fmt(interestUsd), principal: fmt(principalUsd) })}
                <InfoIcon term="principal" />
                {t('calc.maturity.payoff.subAfter')}
              </>
            }
            right={collateralBtc.toFixed(5) + ' BTC'}
            rightSub={t('calc.maturity.payoff.rightSub')}
            tone={SB.forest}
          />
          <MaturityOption
            rn="II"
            label={t('calc.maturity.rollover.label')}
            primary={rollPrimary}
            primarySub={rollSub}
            right={collateralBtc.toFixed(5) + ' BTC'}
            rightSub={rollRightSub}
            tone={rollTone}
          />
          <MaturityOption
            rn="III"
            label={t('calc.maturity.liquidate.label')}
            primary={t('calc.maturity.liquidate.primary', { btc: btcToCoverDebt.toFixed(5) })}
            primarySub={
              <>
                {t('calc.maturity.liquidate.subBefore', { spot: fmtNum(Math.round(btcSpotUsd)), owed: fmt(totalOwedUsd) })}
                <InfoIcon term="taxEvent" />
              </>
            }
            right={btcKeptAfterLiq.toFixed(5) + ' BTC'}
            rightSub={t('calc.maturity.liquidate.rightSub')}
            tone={SB.rust}
          />
          <div style={{
            marginTop: 10,
            padding: '8px 2px 0',
            fontFamily: SB.mono, fontSize: 9.5, color: SB.inkMute,
            lineHeight: 1.5,
            letterSpacing: '0.02em',
          }}>
            {t('calc.maturity.fineprint')}
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
  currency, fmt, desktop,
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [years, setYears] = usePersistentState('longViewYears', 10);
  const [livingOff, setLivingOff] = usePersistentState('longViewLivingOff', false);

  if (!lender) return null;
  if (!loanUsd || loanUsd <= 0) return null;

  // === Math ===
  const apr = lender.apr ?? 10;
  const origPct = lender.originationFeePctEffective ?? 0;
  const ease = lender.rolloverEase;
  const annualFactor = 1 + apr / 100;
  const reorigEachYear = ease !== 'revolving';

  let owed = loanUsd;
  for (let y = 1; y <= years; y++) {
    if (livingOff && y > 1) owed += loanUsd;
    if (reorigEachYear)     owed = owed * (1 + origPct / 100);
    owed = owed * annualFactor;
  }

  const btcPriceAtN = projectBtcPrice(btcSpotUsd, activeCagr, years);
  const sane = btcPriceAtN >= 1;
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
    ease === 'revolving'  ? t('calc.longView.ease.revolving')
    : ease === 'approval' ? t('calc.longView.ease.refinance')
    :                       t('calc.longView.ease.newContract');
  const easeFootnote =
    ease === 'revolving'  ? t('calc.longView.ease.revolvingFootnote', { lender: lender.name })
    : ease === 'approval' ? t('calc.longView.ease.refinanceFootnote', { lender: lender.name, origPct: origPct.toFixed(1) })
    :                       t('calc.longView.ease.newContractFootnote', { lender: lender.name });

  const persona = profiles[profileId]?.persona || profileId;
  const yrLabel = years === 1 ? t('calc.longView.year') : t('calc.longView.years');
  const nA = t('calc.longView.nA');

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
        <span>{t('calc.longView.toggle')}</span>
        <span style={{ color: SB.orange, letterSpacing: '0.08em' }}>
          {open ? t('calc.maturity.hide') : t('calc.maturity.show')}
        </span>
      </button>

      {open && (
        <>
          <SectionHead
            no="§ VII"
            title={t('calc.longView.title')}
            subtitle={t('calc.longView.subtitle', { persona, case: caseId, lender: lender.name })}
          />
          <div style={{
            marginTop: -2, marginBottom: 10,
            fontFamily: SB.mono, fontSize: 10, color: SB.inkSoft,
            letterSpacing: '0.04em', lineHeight: 1.55,
          }}>
            {t('calc.longView.intro')}{' '}
            <InfoIcon term="longView" />
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
              }}>{t('calc.longView.settleIn')}</span>
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
              aria-label={t('calc.longView.yearAriaLabel')}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 4,
              fontFamily: SB.mono, fontSize: 9, color: SB.inkFaint,
              letterSpacing: '0.05em',
            }}>
              <span>{t('calc.longView.minYear')}</span>
              <span>{t('calc.longView.maxYear')}</span>
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
              {t('calc.longView.livingOff', { amount: fmt(loanUsd) })}
            </span>
          </button>

          {/* === Result rows === */}
          <div style={{ marginTop: 8 }}>
            <MaturityOption
              rn="I"
              label={t('calc.longView.btcPrice.label', { years })}
              primary={sane
                ? <FormattedMoney usd={btcPriceAtN} currency={currency} meta={live.meta} spot={btcSpotUsd} />
                : nA}
              primarySub={t('calc.longView.btcPrice.sub', { persona, case: caseId })}
              right={sane
                ? `×${priceMul >= 100 ? priceMul.toFixed(0) : priceMul.toFixed(2)}`
                : '—'}
              rightSub={t('calc.longView.btcPrice.vsToday')}
              tone={activeCagr >= 0 ? SB.forest : SB.rust}
            />
            <MaturityOption
              rn="II"
              label={t('calc.longView.debt.label', { years })}
              primary={<FormattedMoney usd={owed} currency={currency} meta={live.meta} spot={btcSpotUsd} />}
              primarySub={
                <>
                  {t('calc.longView.debt.subBefore', { easeLabel })}
                  <InfoIcon term="rollover" />
                </>
              }
              right={`×${debtMul.toFixed(1)}`}
              rightSub={livingOff
                ? t('calc.longView.debt.vsYearlyDraws')
                : t('calc.longView.debt.vsPrincipal')}
              tone={SB.inkSoft}
            />
            <MaturityOption
              rn="III"
              label={t('calc.longView.btcToSettle.label')}
              primary={btcToSettle != null ? btcToSettle.toFixed(5) + ' BTC' : nA}
              primarySub={
                <>
                  {t('calc.longView.btcToSettle.subBefore')}
                  <InfoIcon term="taxEvent" />
                </>
              }
              right={btcToSettle != null
                ? <FormattedMoney usd={owed} currency={currency} meta={live.meta} spot={btcSpotUsd} />
                : '—'}
              rightSub={t('calc.longView.btcToSettle.fiatValue')}
              tone={SB.ink}
            />
            <MaturityOption
              rn="IV"
              label={t('calc.longView.stackLeft.label')}
              primary={
                underwater
                  ? <>{t('calc.longView.stackLeft.underwater')} <InfoIcon term="liquidation" /></>
                  : (btcRemaining != null ? btcRemaining.toFixed(5) + ' BTC' : nA)
              }
              primarySub={
                underwater
                  ? t('calc.longView.stackLeft.underwaterSub', {
                      btcNeeded: btcToSettle.toFixed(5),
                      btcLocked: collateralBtc.toFixed(5),
                    })
                  : t('calc.longView.stackLeft.sub', { btcLocked: collateralBtc.toFixed(5) })
              }
              right={underwater ? '—' : `${stackPctLeft.toFixed(0)}%`}
              rightSub={underwater
                ? t('calc.longView.stackLeft.stackShort')
                : t('calc.longView.stackLeft.stackKept')}
              tone={underwater ? SB.rust : SB.forest}
            />
          </div>

          {/* Stack value box — fiat verdict of what's left, mirrors § IV NET WORTH box */}
          {sane && !underwater && btcRemaining > 0 && (desktop ? (
            <div style={{
              padding: '14px 12px 12px', marginTop: 10,
              border: `1.5px dashed ${SB.forest}`,
              background: SB.forestWash,
            }}>
              <div style={{
                fontFamily: SB.mono, fontSize: 10.5, fontWeight: 700,
                letterSpacing: '0.2em', color: SB.forest,
              }}>{t('calc.longView.stackValue.label', { years })}</div>
              <div style={{
                fontFamily: SB.serif, fontSize: 26, fontWeight: 600,
                color: SB.forest, letterSpacing: '-0.02em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'center', marginTop: 12,
              }}>
                {fmt(btcRemaining * btcPriceAtN)}
              </div>
              <div style={{
                fontFamily: SB.mono, fontSize: 9,
                color: SB.forest,
                marginTop: 4, fontWeight: 700, letterSpacing: '0.1em',
                textAlign: 'right',
              }}>
                {t('calc.longView.stackValue.kept')}
              </div>
            </div>
          ) : (
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
                }}>{t('calc.longView.stackValue.label', { years })}</div>
                <div style={{
                  fontFamily: SB.mono, fontSize: 9,
                  color: SB.inkMute, marginTop: 3, letterSpacing: '0.06em',
                }}>{t('calc.longView.stackValue.sub', { persona, case: caseId })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: SB.serif, fontSize: 26, fontWeight: 600,
                  color: SB.forest, letterSpacing: '-0.02em', lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <FormattedMoney usd={btcRemaining * btcPriceAtN} currency={currency} meta={live.meta} spot={btcSpotUsd} />
                </div>
                <div style={{
                  fontFamily: SB.mono, fontSize: 9,
                  color: SB.forest,
                  marginTop: 4, fontWeight: 700, letterSpacing: '0.1em',
                }}>
                  {t('calc.longView.stackValue.kept')}
                </div>
              </div>
            </div>
          ))}

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
              {t('calc.longView.bearCaveat', { years })}
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
            {livingOff && t('calc.longView.livingOffFootnote')}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// DesktopCalculatorLayout — open-spread variant for >=1024px.
// Left = inputs, terms, profile picker, scenarios. Right =
// projection chart, verdict, top-4 quotes, CTA.
// ============================================================
function DesktopCalculatorLayout(props) {
  const t = useT();
  const {
    live, currency, cycleCurrency,
    loanInCurrency, onSlide, onAmountChange, min, max, step,
    loanUsd, btcSpotUsd,
    collateralBtc, collateralSats,
    liqUsd, liqDropPct,
    profileId, setProfileId, caseId, setCaseId, profiles,
    activeCagr, totalOwedUsd, collateralBtcAfterSell, deltaUsd,
    ranked, activeLender, interestUsd, satsToSell, grossSaleUsd, taxOwedUsd,
    fmt, lastUpdated,
    expandedQuoteId, setExpandedQuoteId,
    selectedLenderId, setSelectedLenderId,
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
        {t('calc.desktop.leftLabel')}
      </div>

      <DSectionHead no="§ I" title={t('calc.section.loanAmountDesktop')} />

      <div style={{
        padding: '18px',
        background: SB.orangeWash,
        border: `1.5px dashed ${SB.orangeSoft}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <style>{`
          .dc-amount-input {
            background: transparent;
            border: none;
            outline: none;
            padding: 0;
            margin: 0;
            font-family: ${SB.serif};
            font-size: 60px;
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
          .dc-amount-input::placeholder { color: ${SB.inkFaint}; }
        `}</style>
        <div style={{
          fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.22em',
          color: SB.orange, fontWeight: 700,
        }}>{t('calc.amount.label')}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {meta.position === 'pre' && (
            <span style={{ fontFamily: SB.serif, fontSize: 38, fontWeight: 400, color: SB.inkMute, lineHeight: 1, flexShrink: 0 }}>{meta.symbol}</span>
          )}
          <input
            className="dc-amount-input"
            type="text"
            inputMode="numeric"
            aria-label={t('calc.amount.inputLabel')}
            value={fmtNum(loanInCurrency)}
            onChange={onAmountChange}
            onFocus={(e) => e.target.select()}
          />
          {meta.position === 'post' && (
            <span style={{ fontFamily: SB.mono, fontSize: 22, fontWeight: 500, color: SB.inkMute, marginLeft: 6, flexShrink: 0 }}>{meta.symbol}</span>
          )}
        </div>

        <div>
          <input
            type="range"
            min={min} max={max} step={step}
            value={loanInCurrency}
            onChange={onSlide}
            className="sb-slider"
            aria-label={t('calc.amount.inputLabel')}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 6,
            fontFamily: SB.mono, fontSize: 10, color: SB.inkFaint, letterSpacing: '0.05em',
          }}>
            <span>{rangeLabel(min, currency)}</span>
            <span>~{fmtMoney(loanUsd, 'USD', live.meta, btcSpotUsd)} USD</span>
            <span>{rangeLabel(max, currency)}</span>
          </div>
        </div>
      </div>

      <DSectionHead no="§ II" title={t('calc.section.collateralDesktop')} />

      <div style={{ padding: '0 2px' }}>
        <Row label={t('calc.row.collateral')} value={collateralBtc.toFixed(5) + ' BTC'} sub={fmtNum(collateralSats) + ' sats'} info={{ term: 'collateral' }} />
        <Row label={t('calc.row.ltv')} value="50%" info={{ term: 'ltv' }} />
        <Row label={t('calc.row.term')} value={t('calc.row.termValue')} sub={t('calc.row.termSub')} info={{ term: 'balloon' }} />
        <Row label={t('calc.row.liquidation')}
             value={'$' + fmtNum(liqUsd)}
             valueStyle={{ color: SB.rust }}
             sub={t('calc.row.liquidationSub', { pct: Math.abs(liqDropPct).toFixed(1) })}
             info={{ term: 'liquidation' }} />
        <Row label={t('calc.row.satsLost')}
             value={'−' + fmtNum(collateralSats * (LIQ_LTV_PCT / 100))}
             valueStyle={{ color: SB.rust }}
             info={{ term: 'sats' }} />
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
          <div style={{ fontWeight: 700, letterSpacing: '0.1em' }}>{t('calc.alert.headsUp')}</div>
          <div style={{ marginTop: 4 }}>
            {t('calc.alert.body', { pct: Math.abs(liqDropPct).toFixed(0) })}
          </div>
        </div>
      </div>

      <DSectionHead no="§ III" title={t('calc.section.auditedDesktop')} subtitle={t('calc.section.auditedSub')} />

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
              }}>{fmtPct(p.cases.base, 0)}{t('calc.scenario.perYear')}</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', marginTop: 16, border: `1.5px solid ${SB.ink}` }}>
        {SCENARIO_IDS.map((c, i) => {
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
              }}>{t(`calc.scenario.${c}`)}</div>
              <div style={{
                fontFamily: SB.serif, fontSize: 20, fontWeight: 600,
                marginTop: 4, color: active ? SB.orange : SB.ink,
                letterSpacing: '-0.01em',
              }}>{fmtPct(v, 0)}</div>
            </button>
          );
        })}
      </div>

      <DSectionHead no="§ IV" title={t('calc.section.projection')} subtitle={t('calc.section.projectionSub')} />

      <Projection
        spot={btcSpotUsd}
        cagr={activeCagr}
        collateralBtc={collateralBtc}
        totalOwedUsd={totalOwedUsd}
        collateralBtcAfterSell={collateralBtcAfterSell}
        currency={currency}
        meta={live.meta}
      />

      <DashedRule label={t('calc.section.verdict')} />

      <div style={{ padding: '0 2px' }}>
        <Row
          label={t('calc.verdict.sell')}
          value={'−' + fmtNum(satsToSell) + ' sats'}
          valueStyle={{ color: SB.rust }}
          sub={t('calc.verdict.sellSub', { tax: fmt(taxOwedUsd), gross: fmt(grossSaleUsd) })}
        />
        <Row
          label={t('calc.verdict.borrow')}
          value={t('calc.verdict.borrowValue')}
          valueStyle={{ color: SB.forest }}
          sub={t('calc.verdict.borrowSub', { interest: fmt(interestUsd), months: TERM_MONTHS })}
        />

        <div style={{
          padding: '20px 18px 18px', marginTop: 14,
          border: `1.5px dashed ${SB.orange}`,
          background: SB.orangeWash,
        }}>
          <div style={{
            fontFamily: SB.mono, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.2em', color: SB.orange,
          }}>{t('calc.verdict.netWorth')}</div>
          <div style={{
            fontFamily: SB.serif, fontSize: 32, fontWeight: 600,
            color: SB.ink, letterSpacing: '-0.02em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'center', marginTop: 14,
          }}>
            {(deltaUsd >= 0 ? '+' : '−') + fmt(Math.abs(deltaUsd))}
          </div>
          <div style={{
            fontFamily: SB.mono, fontSize: 10,
            color: deltaUsd >= 0 ? SB.forest : SB.rust,
            marginTop: 6, fontWeight: 700, letterSpacing: '0.12em',
            textAlign: 'right',
          }}>
            {deltaUsd >= 0 ? t('calc.verdict.keepStack') : t('calc.verdict.sellWins')}
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
        {t('calc.desktop.rightLabel')}
      </div>

      <DSectionHead no="§ V" title={t('calc.section.bestQuotesDesktop')} subtitle={t('calc.section.bestQuotesSub', { shown: Math.min(4, ranked.length), total: Math.max(4, ranked.length) })} />

      <div style={{ marginBottom: 14 }}>
        {ranked.slice(0, 4).map((q, i) => {
          const rn = ['I', 'II', 'III', 'IV'][i];
          const isExpanded = expandedQuoteId === q.id;
          const isActive = q.id === activeLender?.id;
          const truncated = q.notes && q.notes.length > 100;
          const rp = rolloverPillSpec(q.rolloverEase, t);
          return (
            <div
              key={q.id}
              onClick={() => setSelectedLenderId(isActive ? null : q.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr auto',
                alignItems: 'center', gap: 12,
                padding: '12px 10px',
                marginLeft: -10, marginRight: -10,
                borderBottom: `1px dotted ${SB.inkLine}`,
                background: isActive ? 'rgba(216, 96, 24, 0.05)' : 'transparent',
                boxShadow: isActive ? `inset 2px 0 0 ${SB.orange}` : 'none',
                cursor: 'pointer',
              }}>
              <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 18, color: SB.orange, fontWeight: 500 }}>{rn}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: SB.serif, fontSize: 18, fontWeight: 600, color: SB.ink, letterSpacing: '-0.005em' }}>{q.name}</span>
                  <Pill color={i === 0 ? SB.forest : SB.ink} filled={i === 0}>{q.badge || '—'}</Pill>
                  {isActive && <Pill color={SB.orange} filled>{t('calc.quotes.active')}</Pill>}
                  {q.isTiered && <Pill color={SB.orange}>{t('lenders.badge.tiered')}</Pill>}
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
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedQuoteId(isExpanded ? null : q.id);
                        }}
                        style={{
                          display: 'inline-block',
                          fontFamily: SB.mono, fontSize: 11, fontWeight: 700, color: SB.orange,
                          marginTop: 2, letterSpacing: '0.02em',
                          cursor: 'pointer',
                        }}>
                        {isExpanded ? t('calc.quotes.showLess') : t('calc.quotes.showMore')}
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
            {t('calc.quotes.noMatchDesktop')}
          </div>
        )}
      </div>

      <Button href={activeLender?.referralUrl || '#lenders'}>
        {activeLender
          ? t('common.cta.openWith', { name: activeLender.name.toUpperCase() })
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

      <MaturitySection
        lender={activeLender}
        principalUsd={loanUsd}
        interestUsd={interestUsd}
        totalOwedUsd={totalOwedUsd}
        collateralBtc={collateralBtc}
        collateralSats={collateralSats}
        btcSpotUsd={btcSpotUsd}
        fmt={fmt}
      />

      <LongViewSection
        lender={activeLender}
        loanUsd={loanUsd}
        collateralBtc={collateralBtc}
        btcSpotUsd={btcSpotUsd}
        activeCagr={activeCagr}
        profileId={profileId}
        caseId={caseId}
        profiles={profiles}
        currency={currency}
        fmt={fmt}
        desktop
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
