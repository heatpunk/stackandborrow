// ============================================================
// LENDERS PAGE — full directory of all lenders from lenders.json
// (chip filters only). Same cost metric as the calculator for sorting, but
// eligibility (region / min loan / max LTV) is not applied here.
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  SB,
  LTV_PCT,
  TERM_MONTHS,
} from '../system/tokens.js';
import {
  PaperFrame,
  BrandHeader,
  DashedRule,
  Row,
  Pill,
  Chip,
  PageNav,
  FineFooter,
  LivePriceBadge,
} from '../system/components.jsx';
import { useIsDesktop } from '../system/theme.jsx';
import { DesktopSpreadFrame } from '../system/desktop.jsx';
import { rankLenders, toUsd } from '../lib/math.js';
import { fmtMoney, fmtNum } from '../lib/format.js';
import { usePersistentState } from '../lib/hooks.js';
import { useT } from '../i18n/index.jsx';

// Lender-card terms grid cell.
function Term({ k, v }) {
  return (
    <div style={{ minWidth: 0, paddingRight: 6 }}>
      <div style={{
        fontFamily: SB.mono, fontSize: 8.5, fontWeight: 700,
        letterSpacing: '0.16em', color: SB.inkMute,
      }}>{k}</div>
      <div style={{
        fontFamily: SB.mono, fontSize: 11, fontWeight: 600,
        color: SB.ink, marginTop: 3, lineHeight: 1.3,
        overflowWrap: 'break-word',
      }}>{v}</div>
    </div>
  );
}

// Trim a lender's term string into a compact display label:
// drop trailing parentheticals, secondary sentences, and the
// "prepayable anytime" clause — keep the core phrase intact.
function fmtTerm(termStr) {
  if (!termStr) return '12mo';
  return termStr
    .replace(/,\s*prepayable anytime/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\.\s.*$/, '')
    .trim();
}

// Translate raw lender object into display badge metadata.
// Falls back to a translated NON-CUSTODIAL badge for multisig lenders.
function badgeFor(l, t) {
  if (l.badge) return l.badge;
  if (l.custodyType === 'multisig') return t('lenders.badge.nonCustodial');
  return '—';
}

// Custody label for the terms grid (translated via t()).
function custodyShort(l, t) {
  if (l.custodyType === 'multisig') {
    if (l.custodyKind === 'taproot-vault')   return t('lenders.custody.taproot');
    if (l.custodyKind === 'dlc')             return t('lenders.custody.dlc');
    if (l.custodyKind === 'collab-multisig') return t('lenders.custody.collabMsig');
    return t('lenders.custody.multisig');
  }
  if (l.custodyType === 'segregated') return t('lenders.custody.segregated');
  if (l.custodyType === 'custodial')  return t('lenders.custody.custodial');
  if (l.custodyType === 'custodial-mixed') return t('lenders.custody.mixed');
  return l.custodyType?.toUpperCase() || t('lenders.custody.custodial');
}

const FILTER_IDS = ['all', 'us', 'eu', 'btcOnly', 'noRehypo', 'multisig'];

// Curated head-to-head pairs that get prime placement on /lenders.
// All 91 pairs are reachable via /compare/{a}-vs-{b} and listed in the
// sitemap; this block is for the eight matchups that drive the most
// search-volume signal (kept alphabetical to match canonical URL order).
const FEATURED_PAIRS = [
  ['arch',     'strike',    'US heavyweights'],
  ['debifi',   'firefish',  'EU non-custodial'],
  ['firefish', 'ledn',      'EU vs global incumbent'],
  ['ledn',     'nexo',      'BTC-only vs multi-coin CeFi'],
  ['ledn',     'strike',    'most-asked US matchup'],
  ['ledn',     'surge',     'incumbent vs DLC newcomer'],
  ['ledn',     'unchained', 'custodial vs multisig'],
  ['strike',   'unchained', 'rate vs custody'],
];

// Render a single tile linking to /compare/{a}-vs-{b}.
function ComparisonTile({ a, b, hint, lenders, desktop = false }) {
  const aLender = lenders.find((l) => l.id === a);
  const bLender = lenders.find((l) => l.id === b);
  if (!aLender || !bLender) return null;
  const href = `/compare/${a}-vs-${b}`;
  return (
    <a
      href={href}
      style={{
        display: 'block',
        padding: desktop ? '12px 14px' : '10px 12px',
        border: `1px dashed ${SB.inkLine}`,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 120ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = SB.ink; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = SB.inkLine; }}
    >
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        fontFamily: SB.serif,
        fontSize: desktop ? 17 : 15,
        fontWeight: 600,
        color: SB.ink,
        letterSpacing: '-0.005em',
        lineHeight: 1.2,
      }}>
        <span>{aLender.name}</span>
        <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500, fontSize: desktop ? 14 : 12 }}>vs</span>
        <span>{bLender.name}</span>
      </div>
      <div style={{
        marginTop: 4,
        fontFamily: SB.mono,
        fontSize: 9.5, letterSpacing: '0.08em',
        color: SB.inkMute,
        textTransform: 'uppercase',
      }}>
        {hint} <span style={{ color: SB.orange }}>↗</span>
      </div>
    </a>
  );
}

function FeaturedComparisons({ lenders, desktop = false }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: desktop ? '1fr 1fr' : '1fr',
      gap: 8,
    }}>
      {FEATURED_PAIRS.map(([a, b, hint]) => (
        <ComparisonTile
          key={`${a}-${b}`}
          a={a}
          b={b}
          hint={hint}
          lenders={lenders}
          desktop={desktop}
        />
      ))}
    </div>
  );
}

export default function LendersPage({ lenders, lastUpdated, live, currency, region }) {
  const isDesktop = useIsDesktop();
  const t = useT();
  const [filter, setFilter] = useState('all');

  // Read the calculator's persisted loan amount so all pages
  // (Landing, Calculator, Lenders, Compare) show the same quote size.
  const [loanInCurrency] = usePersistentState('desiredLoan', 50000);
  const loanUsd = toUsd(loanInCurrency, currency, live.meta, live.btcUsd);

  const filtered = useMemo(() => {
    return lenders.filter((l) => {
      if (filter === 'us') return l.country?.includes('us');
      if (filter === 'eu') return l.country?.includes('eu');
      if (filter === 'btcOnly') return l.btcOnly === true;
      if (filter === 'noRehypo') return l.rehypothecation === 'no' || l.rehypothecation === false;
      if (filter === 'multisig') return l.custodyType === 'multisig';
      return true;
    });
  }, [lenders, filter]);

  const ranked = useMemo(() =>
    rankLenders(filtered, {
      loanUsd,
      region: region || 'global',
      ltvPct: LTV_PCT,
      termMonths: TERM_MONTHS,
      eligibleOnly: false,
    }),
    [filtered, region, loanUsd]
  );

  // Per-filter count for chip labels (compute over the full list).
  const counts = useMemo(() => ({
    all:      lenders.length,
    us:       lenders.filter((l) => l.country?.includes('us')).length,
    eu:       lenders.filter((l) => l.country?.includes('eu')).length,
    btcOnly:  lenders.filter((l) => l.btcOnly === true).length,
    noRehypo: lenders.filter((l) => l.rehypothecation === 'no' || l.rehypothecation === false).length,
    multisig: lenders.filter((l) => l.custodyType === 'multisig').length,
  }), [lenders]);

  if (isDesktop) {
    return (
      <DesktopLendersLayout
        lenders={lenders}
        ranked={ranked}
        filter={filter}
        setFilter={setFilter}
        counts={counts}
        currency={currency}
        live={live}
        lastUpdated={lastUpdated}
        quoteLoanUsd={loanUsd}
      />
    );
  }

  return (
    <PaperFrame>
      <BrandHeader
        currentPage="III"
        pageOf="IV"
        rightSlot={<LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />}
      />

      {/* Hero */}
      <div style={{ marginTop: 4, marginBottom: 12 }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.22em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 8,
        }}>
          {t('lenders.meta.eyebrow')}
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: SB.serif, fontSize: 30, fontWeight: 600,
          lineHeight: 1.05, letterSpacing: '-0.025em', color: SB.ink,
        }}>
          {t('lenders.hero.titleLine1')}<br />
          <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>{t('lenders.hero.titleLine2')}</span>
        </h1>
        <p style={{
          marginTop: 12, marginBottom: 0,
          fontFamily: SB.sans, fontSize: 12.5, lineHeight: 1.55,
          color: SB.inkSoft, textWrap: 'pretty',
        }}>
          <b style={{ color: SB.ink }}>{t('lenders.hero.bodyBold')}</b>{t('lenders.hero.bodyAfter')}
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        margin: '14px 0 4px',
        justifyContent: 'center',
      }}>
        {FILTER_IDS.map((id) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
            {t(`lenders.filter.${id}`)} · {counts[id] ?? 0}
          </Chip>
        ))}
      </div>
      <div style={{
        fontFamily: SB.mono, fontSize: 9.5,
        color: SB.inkMute, marginTop: 8, letterSpacing: '0.02em',
        textAlign: 'center',
      }}>
        {t('lenders.quoteSizedBefore')}<b style={{ color: SB.ink }}>{t('lenders.quoteSizedValue', { amount: fmtMoney(loanUsd, currency, live.meta, live.btcUsd), months: TERM_MONTHS, ltv: LTV_PCT })}</b>.
      </div>

      <DashedRule label={t('lenders.section.ascending')} />

      {ranked.length === 0 && (
        <div style={{
          padding: '24px 14px',
          fontFamily: SB.mono, fontSize: 11,
          color: SB.inkMute, textAlign: 'center',
          border: `1px dashed ${SB.inkLine}`,
        }}>
          {t('lenders.empty')}
        </div>
      )}

      <div>
        {ranked.map((l, i) => {
          const rn = ['I','II','III','IV','V','VI','VII','VIII','IX','X'][i] || (i + 1);
          const isBest = i === 0;
          const rehypoBad = l.rehypothecation === true || l.rehypothecation === 'yes';
          return (
            <div key={l.id} style={{
              padding: '14px 12px',
              marginBottom: 8,
              border: `1.5px ${isBest ? 'solid' : 'dashed'} ${isBest ? SB.ink : SB.inkLine}`,
              background: isBest ? SB.creamWarm : 'transparent',
              position: 'relative',
            }}>
              {isBest && (
                <div style={{ position: 'absolute', top: -10, right: 14 }}>
                  <div style={{
                    background: SB.orange, color: SB.cream,
                    padding: '2px 8px',
                    fontFamily: SB.mono, fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.18em',
                  }}>{t('lenders.topQuote')}</div>
                </div>
              )}

              {/* Top row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '24px 1fr auto',
                gap: 10, alignItems: 'baseline',
              }}>
                <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 14, color: SB.orange, fontWeight: 500 }}>{rn}</div>
                <div>
                  <a href={`/lenders/${l.id}`} style={{
                    fontFamily: SB.serif, fontSize: 18, fontWeight: 600,
                    color: SB.ink, letterSpacing: '-0.01em', lineHeight: 1,
                    textDecoration: 'none',
                    borderBottom: `1px dotted ${SB.inkLine}`,
                  }}>
                    {l.name}
                  </a>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    <Pill color={isBest ? SB.forest : SB.ink} filled={isBest}>{badgeFor(l, t)}</Pill>
                    {l.isTiered && <Pill color={SB.orange}>{t('lenders.badge.tiered')}</Pill>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: SB.mono, fontSize: 16, fontWeight: 700, color: SB.orange,
                    letterSpacing: '-0.01em',
                  }}>{l.effectiveApr.toFixed(2)}%</div>
                  <div style={{
                    fontFamily: SB.mono, fontSize: 9.5,
                    color: SB.inkSoft, marginTop: 2,
                  }}>{fmtMoney(l.totalCost, currency, live.meta, live.btcUsd)} · 12mo</div>
                  {l.membershipFeeUsd > 0 && (
                    <div style={{
                      fontFamily: SB.mono, fontSize: 9,
                      color: SB.inkMute, marginTop: 2, letterSpacing: '0.02em',
                    }}>
                      {t('lenders.includesMembership', { fee: fmtMoney(l.membershipFeeUsd, currency, live.meta, live.btcUsd) })}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                marginTop: 10, paddingTop: 10,
                borderTop: `1px dotted ${SB.inkLine}`,
              }}>
                <Term k={t('lenders.term.min')} v={'$' + fmtNum(l.minLoanUsd || 0)} />
                <Term k={t('lenders.term.term')} v={fmtTerm(l.term)} />
                <Term k={t('lenders.term.custody')} v={custodyShort(l, t)} />
              </div>

              {/* Note */}
              {l.notes && (
                <div style={{
                  marginTop: 10,
                  fontFamily: SB.sans, fontSize: 11.5, lineHeight: 1.5,
                  color: SB.inkSoft, textWrap: 'pretty',
                }}>{l.notes}</div>
              )}

              {/* Flags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {l.originationFeePctEffective > 0 && (
                  <span style={flagStyle(SB.orange)}>{t('lenders.flag.origFee', { pct: l.originationFeePctEffective })}</span>
                )}
                {l.originationFeePctEffective === 0 && (
                  <span style={flagStyle(SB.forest)}>{t('lenders.flag.noOrigFee')}</span>
                )}
                {l.annualMembershipUsd > 0 && (
                  <span style={flagStyle(SB.orange)}>{t('lenders.flag.membership')}</span>
                )}
                {l.custodyType === 'multisig' && <span style={flagStyle(SB.forest)}>{t('lenders.flag.multisig')}</span>}
                {l.btcOnly === true && <span style={flagStyle(SB.forest)}>{t('lenders.flag.btcOnly')}</span>}
                {l.btcOnly === false && <span style={flagStyle(SB.rust)}>{t('lenders.flag.multiCollateral')}</span>}
                {l.rehypothecation === 'no' && <span style={flagStyle(SB.forest)}>{t('lenders.flag.noRehypo')}</span>}
                {rehypoBad && <span style={flagStyle(SB.rust)}>{t('lenders.flag.rehypo')}</span>}
              </div>

              {/* Apply link */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 12, paddingTop: 10,
                borderTop: `1px dashed ${SB.inkLine}`,
              }}>
                <div style={{
                  fontFamily: SB.mono, fontSize: 9,
                  color: SB.inkMute, letterSpacing: '0.05em',
                }}>
                  {isBest ? t('lenders.recommend') : t('lenders.compare')}
                </div>
                <a
                  href={l.referralUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: SB.mono, fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.16em',
                    color: SB.ink, textDecoration: 'none',
                    borderBottom: `1.5px solid ${SB.orange}`,
                    paddingBottom: 1, cursor: 'pointer',
                  }}>{t('lenders.apply')}</a>
              </div>
            </div>
          );
        })}
      </div>

      <DashedRule label="HEAD-TO-HEAD" />

      <FeaturedComparisons lenders={lenders} />

      <DashedRule label={t('common.glossary.label')} />

      <div>
        <Row label={t('lenders.glossary.rehypo.label')} value={t('lenders.glossary.rehypo.value')}
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 11.5 }}
          sub={t('lenders.glossary.rehypo.sub')} />
        <Row label={t('lenders.glossary.multisig.label')} value={t('lenders.glossary.multisig.value')}
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 11.5 }}
          sub={t('lenders.glossary.multisig.sub')} />
        <Row label={t('lenders.glossary.orig.label')} value={t('lenders.glossary.orig.value')}
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 11.5 }}
          sub={t('lenders.glossary.orig.sub')} />
      </div>

      <FineFooter source={live.source || 'mempool.space'} updated={lastUpdated} />
      <PageNav active="lender" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

function flagStyle(color) {
  return {
    fontFamily: SB.mono, fontSize: 8.5, fontWeight: 700,
    letterSpacing: '0.14em',
    padding: '2px 6px',
    color, border: `1px dashed ${color}`,
  };
}

// ============================================================
// DesktopLendersLayout — open-spread variant for >=1024px.
// Left  = hero, filters, quote header, glossary.
// Right = ranked lender cards.
// ============================================================
function DesktopLendersLayout({
  lenders, ranked, filter, setFilter, counts,
  currency, live, lastUpdated, quoteLoanUsd,
}) {
  const t = useT();
  const rightSlot = (
    <LivePriceBadge
      btcUsd={live.btcUsd} loading={live.loading}
      error={live.error} onRefresh={live.refresh}
    />
  );

  const left = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('lenders.desktop.leftLabel')}
      </div>

      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.22em',
        color: SB.inkMute, fontWeight: 700, marginBottom: 10,
      }}>
        {t('lenders.meta.eyebrow')}
      </div>
      <h1 style={{
        margin: 0,
        fontFamily: SB.serif, fontSize: 56, fontWeight: 600,
        lineHeight: 1, letterSpacing: '-0.03em', color: SB.ink,
      }}>
        {t('lenders.hero.titleLine1')}<br />
        <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>
          {t('lenders.hero.titleLine2')}
        </span>
      </h1>
      <p style={{
        marginTop: 20, marginBottom: 0,
        fontFamily: SB.sans, fontSize: 15, lineHeight: 1.55,
        color: SB.inkSoft, textWrap: 'pretty', maxWidth: 460,
      }}>
        <b style={{ color: SB.ink }}>{t('lenders.hero.bodyBold')}</b>{t('lenders.hero.bodyAfter')}
      </p>

      <DashedRule label={t('lenders.section.filter')} />

      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {FILTER_IDS.map((id) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
            {t(`lenders.filter.${id}`)} · {counts[id] ?? 0}
          </Chip>
        ))}
      </div>
      <div style={{
        fontFamily: SB.mono, fontSize: 11,
        color: SB.inkMute, marginTop: 12, letterSpacing: '0.02em',
        textAlign: 'center',
      }}>
        {t('lenders.quoteSizedBefore')}<b style={{ color: SB.ink }}>
          {t('lenders.quoteSizedValue', { amount: fmtMoney(quoteLoanUsd, currency, live.meta, live.btcUsd), months: TERM_MONTHS, ltv: LTV_PCT })}
        </b>.
      </div>

      <DashedRule label={t('common.glossary.label')} />

      <div>
        <Row label={t('lenders.glossary.rehypo.label')} value={t('lenders.glossary.rehypo.value')}
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 12 }}
          sub={t('lenders.glossary.rehypo.sub')} />
        <Row label={t('lenders.glossary.multisig.label')} value={t('lenders.glossary.multisig.value')}
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 12 }}
          sub={t('lenders.glossary.multisig.sub')} />
        <Row label={t('lenders.glossary.orig.label')} value={t('lenders.glossary.orig.value')}
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 12 }}
          sub={t('lenders.glossary.orig.sub')} />
      </div>

      <DashedRule label="HEAD-TO-HEAD" />

      <FeaturedComparisons lenders={lenders} desktop />

      <DashedRule label={t('lenders.section.method')} />

      <p style={{
        margin: 0,
        fontFamily: SB.sans, fontSize: 12.5, lineHeight: 1.6,
        color: SB.inkSoft, textWrap: 'pretty',
        textAlign: 'center',
      }}>
        {t('lenders.method.bodyBefore')}<b style={{ color: SB.ink }}>{t('lenders.method.bodyBold')}</b>{t('lenders.method.bodyAfter')}
      </p>
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('lenders.desktop.rightLabel')}
      </div>

      {ranked.length === 0 && (
        <div style={{
          padding: '28px 16px',
          fontFamily: SB.mono, fontSize: 12,
          color: SB.inkMute, textAlign: 'center',
          border: `1px dashed ${SB.inkLine}`,
        }}>
          {t('lenders.empty')}
        </div>
      )}

      <div>
        {ranked.map((l, i) => {
          const rn = ['I','II','III','IV','V','VI','VII','VIII','IX','X'][i] || (i + 1);
          const isBest = i === 0;
          const rehypoBad = l.rehypothecation === true || l.rehypothecation === 'yes';
          return (
            <div key={l.id} style={{
              padding: '14px 14px',
              marginBottom: 10,
              border: `1.5px ${isBest ? 'solid' : 'dashed'} ${isBest ? SB.ink : SB.inkLine}`,
              background: isBest ? SB.creamWarm : 'transparent',
              position: 'relative',
            }}>
              {isBest && (
                <div style={{ position: 'absolute', top: -10, right: 14 }}>
                  <div style={{
                    background: SB.orange, color: SB.cream,
                    padding: '3px 10px',
                    fontFamily: SB.mono, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.18em',
                  }}>{t('lenders.topQuote')}</div>
                </div>
              )}
              <div style={{
                display: 'grid', gridTemplateColumns: '28px 1fr auto',
                gap: 12, alignItems: 'baseline',
              }}>
                <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 18, color: SB.orange, fontWeight: 500 }}>{rn}</div>
                <div>
                  <a href={`/lenders/${l.id}`} style={{
                    fontFamily: SB.serif, fontSize: 20, fontWeight: 600,
                    color: SB.ink, letterSpacing: '-0.01em', lineHeight: 1,
                    textDecoration: 'none',
                    borderBottom: `1px dotted ${SB.inkLine}`,
                  }}>
                    {l.name}
                  </a>
                  <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                    <Pill color={isBest ? SB.forest : SB.ink} filled={isBest}>{badgeFor(l, t)}</Pill>
                    {l.isTiered && <Pill color={SB.orange}>{t('lenders.badge.tiered')}</Pill>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: SB.mono, fontSize: 18, fontWeight: 700, color: SB.orange, letterSpacing: '-0.01em' }}>
                    {l.effectiveApr.toFixed(2)}%
                  </div>
                  <div style={{ fontFamily: SB.mono, fontSize: 10.5, color: SB.inkSoft, marginTop: 2 }}>
                    {fmtMoney(l.totalCost, currency, live.meta, live.btcUsd)} · 12mo
                  </div>
                  {l.membershipFeeUsd > 0 && (
                    <div style={{
                      fontFamily: SB.mono, fontSize: 10,
                      color: SB.inkMute, marginTop: 3, letterSpacing: '0.02em',
                    }}>
                      {t('lenders.includesMembership', { fee: fmtMoney(l.membershipFeeUsd, currency, live.meta, live.btcUsd) })}
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                marginTop: 12, paddingTop: 12,
                borderTop: `1px dotted ${SB.inkLine}`,
              }}>
                <Term k={t('lenders.term.min')} v={'$' + fmtNum(l.minLoanUsd || 0)} />
                <Term k={t('lenders.term.term')} v={fmtTerm(l.term)} />
                <Term k={t('lenders.term.custody')} v={custodyShort(l, t)} />
              </div>
              {l.notes && (
                <div style={{
                  marginTop: 10,
                  fontFamily: SB.sans, fontSize: 12, lineHeight: 1.5,
                  color: SB.inkSoft, textWrap: 'pretty',
                }}>{l.notes}</div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {l.originationFeePctEffective > 0 && (
                  <span style={flagStyle(SB.orange)}>{t('lenders.flag.origFee', { pct: l.originationFeePctEffective })}</span>
                )}
                {l.originationFeePctEffective === 0 && (
                  <span style={flagStyle(SB.forest)}>{t('lenders.flag.noOrigFee')}</span>
                )}
                {l.annualMembershipUsd > 0 && (
                  <span style={flagStyle(SB.orange)}>{t('lenders.flag.membership')}</span>
                )}
                {l.custodyType === 'multisig' && <span style={flagStyle(SB.forest)}>{t('lenders.flag.multisig')}</span>}
                {l.btcOnly === true && <span style={flagStyle(SB.forest)}>{t('lenders.flag.btcOnly')}</span>}
                {l.btcOnly === false && <span style={flagStyle(SB.rust)}>{t('lenders.flag.multiCollateral')}</span>}
                {l.rehypothecation === 'no' && <span style={flagStyle(SB.forest)}>{t('lenders.flag.noRehypo')}</span>}
                {rehypoBad && <span style={flagStyle(SB.rust)}>{t('lenders.flag.rehypo')}</span>}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 14, paddingTop: 12,
                borderTop: `1px dashed ${SB.inkLine}`,
              }}>
                <div style={{
                  fontFamily: SB.mono, fontSize: 10,
                  color: SB.inkMute, letterSpacing: '0.05em',
                }}>
                  {isBest ? t('lenders.recommend') : t('lenders.compare')}
                </div>
                <a
                  href={l.referralUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: SB.mono, fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.16em',
                    color: SB.ink, textDecoration: 'none',
                    borderBottom: `1.5px solid ${SB.orange}`,
                    paddingBottom: 2, cursor: 'pointer',
                  }}>{t('lenders.apply')}</a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left}
      right={right}
      active="lender"
      currentPage="III"
      pageOf="IV"
      rightSlot={rightSlot}
      footerSource={live.source || 'mempool.space'}
      footerUpdated={lastUpdated}
    />
  );
}
