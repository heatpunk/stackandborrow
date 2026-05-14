// ============================================================
// LENDERS PAGE — full directory of all lenders from lenders.json
// (chip filters only). Same cost metric as the calculator for sorting, but
// eligibility (region / min loan / max LTV) is not applied here.
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  SB,
  CURRENCY_META,
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
  SunMoonStamp,
} from '../system/components.jsx';
import { useIsDesktop } from '../system/theme.jsx';
import { DesktopSpreadFrame } from '../system/desktop.jsx';
import { rankLenders } from '../lib/math.js';
import { fmtMoney, fmtNum } from '../lib/format.js';

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
function fmtTerm(t) {
  if (!t) return '12mo';
  return t
    .replace(/,\s*prepayable anytime/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\.\s.*$/, '')
    .trim();
}

// Translate raw lender object into display badge metadata.
function badgeFor(l) {
  if (l.badge) return l.badge;
  if (l.custodyType === 'multisig') return 'NON-CUSTODIAL';
  return '—';
}

// Custody label for the terms grid.
function custodyShort(l) {
  if (l.custodyType === 'multisig')  return 'MULTISIG';
  if (l.custodyType === 'segregated') return 'SEGREGATED';
  if (l.custodyType === 'custodial')  return 'CUSTODIAL';
  if (l.custodyType === 'custodial-mixed') return 'MIXED';
  return l.custodyType?.toUpperCase() || 'CUSTODIAL';
}

const FILTERS = [
  { id: 'all',      label: 'ALL' },
  { id: 'us',       label: 'US' },
  { id: 'eu',       label: 'EU' },
  { id: 'btcOnly',  label: 'BTC ONLY' },
  { id: 'noRehypo', label: 'NO REHYPO' },
  { id: 'multisig', label: 'MULTISIG' },
];

export default function LendersPage({ lenders, lastUpdated, live, currency, region }) {
  const isDesktop = useIsDesktop();
  const [filter, setFilter] = useState('all');
  // Standardize on a $50K loan for the default ranking display.
  const QUOTE_LOAN_USD = 50000;

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
      loanUsd: QUOTE_LOAN_USD,
      region: region || 'global',
      ltvPct: LTV_PCT,
      termMonths: TERM_MONTHS,
      eligibleOnly: false,
    }),
    [filtered, region]
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
        quoteLoanUsd={QUOTE_LOAN_USD}
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
          DIRECTORY · ALL VETTED QUOTES
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: SB.serif, fontSize: 30, fontWeight: 600,
          lineHeight: 1.05, letterSpacing: '-0.025em', color: SB.ink,
        }}>
          Many lenders.<br />
          <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>One ranking metric.</span>
        </h1>
        <p style={{
          marginTop: 12, marginBottom: 0,
          fontFamily: SB.sans, fontSize: 12.5, lineHeight: 1.55,
          color: SB.inkSoft, textWrap: 'pretty',
        }}>
          Ranked by total cost <b style={{ color: SB.ink }}>plus a custody-risk
          premium</b>. Rehypothecation, pooled custody, and multi-collateral
          books add unpriced counterparty risk — multisig, no-rehyp, BTC-only
          lenders carry no premium. Affiliate fees never adjust the order.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        margin: '14px 0 4px',
        justifyContent: 'center',
      }}>
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label} · {counts[f.id] ?? 0}
          </Chip>
        ))}
      </div>
      <div style={{
        fontFamily: SB.mono, fontSize: 9.5,
        color: SB.inkMute, marginTop: 8, letterSpacing: '0.02em',
        textAlign: 'center',
      }}>
        Quote sized for <b style={{ color: SB.ink }}>{fmtMoney(QUOTE_LOAN_USD, currency, CURRENCY_META, live.btcUsd)} · 12mo · 50% LTV</b>.
      </div>

      <DashedRule label="QUOTES · ASCENDING BY ADJUSTED COST" />

      {ranked.length === 0 && (
        <div style={{
          padding: '24px 14px',
          fontFamily: SB.mono, fontSize: 11,
          color: SB.inkMute, textAlign: 'center',
          border: `1px dashed ${SB.inkLine}`,
        }}>
          No matching lenders. Try a different filter.
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
                  }}>★ TOP QUOTE</div>
                </div>
              )}

              {/* Top row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '24px 1fr auto',
                gap: 10, alignItems: 'baseline',
              }}>
                <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 14, color: SB.orange, fontWeight: 500 }}>{rn}</div>
                <div>
                  <div style={{ fontFamily: SB.serif, fontSize: 18, fontWeight: 600, color: SB.ink, letterSpacing: '-0.01em', lineHeight: 1 }}>
                    {l.name}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    <Pill color={isBest ? SB.forest : SB.ink} filled={isBest}>{badgeFor(l)}</Pill>
                    {l.isTiered && <Pill color={SB.orange}>TIERED</Pill>}
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
                  }}>{fmtMoney(l.totalCost, currency, CURRENCY_META, live.btcUsd)} · 12mo</div>
                  {l.custodyPremiumPct > 0 && (
                    <div style={{
                      fontFamily: SB.mono, fontSize: 9,
                      color: SB.rust, marginTop: 3, letterSpacing: '0.02em',
                    }}>
                      +{fmtMoney(l.custodyPremiumUsd, currency, CURRENCY_META, live.btcUsd)} custody risk
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
                <Term k="MIN" v={'$' + fmtNum(l.minLoanUsd || 0)} />
                <Term k="TERM" v={fmtTerm(l.term)} />
                <Term k="CUSTODY" v={custodyShort(l)} />
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
                  <span style={flagStyle(SB.orange)}>{l.originationFeePctEffective}% ORIG FEE</span>
                )}
                {l.originationFeePctEffective === 0 && (
                  <span style={flagStyle(SB.forest)}>NO ORIG FEE</span>
                )}
                {l.custodyType === 'multisig' && <span style={flagStyle(SB.forest)}>MULTISIG</span>}
                {l.btcOnly === true && <span style={flagStyle(SB.forest)}>BTC ONLY</span>}
                {l.btcOnly === false && <span style={flagStyle(SB.rust)}>MULTI-COLLATERAL</span>}
                {l.rehypothecation === 'no' && <span style={flagStyle(SB.forest)}>NO REHYPO</span>}
                {rehypoBad && <span style={flagStyle(SB.rust)}>⚠ REHYPO</span>}
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
                  {isBest ? 'WE RECOMMEND THIS QUOTE' : 'compare terms before applying'}
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
                  }}>APPLY →</a>
              </div>
            </div>
          );
        })}
      </div>

      <DashedRule label="GLOSSARY" />

      <div>
        <Row label="Rehypothecation" value="lender lends out your collateral"
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 11.5 }}
          sub="higher rate, higher risk" />
        <Row label="Multisig custody" value="keys split 2-of-3"
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 11.5 }}
          sub="strongest model" />
        <Row label="Origination fee" value="paid upfront, not APR"
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 11.5 }}
          sub="effective rate bumps up" />
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
        PAGE III · LEFT — THE DIRECTORY
      </div>

      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.22em',
        color: SB.inkMute, fontWeight: 700, marginBottom: 10,
      }}>
        DIRECTORY · ALL VETTED QUOTES
      </div>
      <h1 style={{
        margin: 0,
        fontFamily: SB.serif, fontSize: 56, fontWeight: 600,
        lineHeight: 1, letterSpacing: '-0.03em', color: SB.ink,
      }}>
        Many lenders.<br />
        <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>
          One ranking metric.
        </span>
      </h1>
      <p style={{
        marginTop: 20, marginBottom: 0,
        fontFamily: SB.sans, fontSize: 15, lineHeight: 1.55,
        color: SB.inkSoft, textWrap: 'pretty', maxWidth: 460,
      }}>
        Ranked by total cost <b style={{ color: SB.ink }}>plus a custody-risk
        premium</b>. Rehypothecation, pooled custody, and multi-collateral
        books add unpriced counterparty risk — multisig, no-rehyp, BTC-only
        lenders carry no premium. Affiliate fees never adjust the order.
      </p>

      <DashedRule label="FILTER" />

      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label} · {counts[f.id] ?? 0}
          </Chip>
        ))}
      </div>
      <div style={{
        fontFamily: SB.mono, fontSize: 11,
        color: SB.inkMute, marginTop: 12, letterSpacing: '0.02em',
        textAlign: 'center',
      }}>
        Quote sized for <b style={{ color: SB.ink }}>
          {fmtMoney(quoteLoanUsd, currency, CURRENCY_META, live.btcUsd)} · 12mo · 50% LTV
        </b>.
      </div>

      <DashedRule label="GLOSSARY" />

      <div>
        <Row label="Rehypothecation" value="lender lends out your collateral"
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 12 }}
          sub="higher rate, higher risk" />
        <Row label="Multisig custody" value="keys split 2-of-3"
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 12 }}
          sub="strongest model" />
        <Row label="Origination fee" value="paid upfront, not APR"
          valueStyle={{ fontFamily: SB.sans, fontWeight: 500, fontSize: 12 }}
          sub="effective rate bumps up" />
      </div>

      <DashedRule label="METHOD" />

      <p style={{
        margin: 0,
        fontFamily: SB.sans, fontSize: 12.5, lineHeight: 1.6,
        color: SB.inkSoft, textWrap: 'pretty',
        textAlign: 'center',
      }}>
        Rates verified quarterly. Tiered lenders resolve to the band
        that covers your loan size. Ranking adds a <b style={{ color: SB.ink }}>custody-risk
        premium</b> on top of nominal cost: <b style={{ color: SB.ink }}>+0.0pp</b> for
        multisig, +0.5pp for custodial-mixed, +1.0pp for fully custodial;
        plus <b style={{ color: SB.ink }}>+1.5pp</b> if rehyp is optional,
        +3.0pp if always rehypothecated; plus +0.5pp if collateral is multi-asset.
        Rehypothecation is the single common cause of every major BTC-lender
        failure — Celsius, BlockFi, Genesis, Voyager all rehypothecated.
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
        PAGE III · RIGHT — QUOTES, ASCENDING BY ADJUSTED COST
      </div>

      {ranked.length === 0 && (
        <div style={{
          padding: '28px 16px',
          fontFamily: SB.mono, fontSize: 12,
          color: SB.inkMute, textAlign: 'center',
          border: `1px dashed ${SB.inkLine}`,
        }}>
          No matching lenders. Try a different filter.
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
                  }}>★ TOP QUOTE</div>
                </div>
              )}
              <div style={{
                display: 'grid', gridTemplateColumns: '28px 1fr auto',
                gap: 12, alignItems: 'baseline',
              }}>
                <div style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 18, color: SB.orange, fontWeight: 500 }}>{rn}</div>
                <div>
                  <div style={{ fontFamily: SB.serif, fontSize: 20, fontWeight: 600, color: SB.ink, letterSpacing: '-0.01em', lineHeight: 1 }}>
                    {l.name}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                    <Pill color={isBest ? SB.forest : SB.ink} filled={isBest}>{badgeFor(l)}</Pill>
                    {l.isTiered && <Pill color={SB.orange}>TIERED</Pill>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: SB.mono, fontSize: 18, fontWeight: 700, color: SB.orange, letterSpacing: '-0.01em' }}>
                    {l.effectiveApr.toFixed(2)}%
                  </div>
                  <div style={{ fontFamily: SB.mono, fontSize: 10.5, color: SB.inkSoft, marginTop: 2 }}>
                    {fmtMoney(l.totalCost, currency, CURRENCY_META, live.btcUsd)} · 12mo
                  </div>
                  {l.custodyPremiumPct > 0 && (
                    <div style={{
                      fontFamily: SB.mono, fontSize: 10,
                      color: SB.rust, marginTop: 4, letterSpacing: '0.02em',
                    }}>
                      +{fmtMoney(l.custodyPremiumUsd, currency, CURRENCY_META, live.btcUsd)} custody risk
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                marginTop: 12, paddingTop: 12,
                borderTop: `1px dotted ${SB.inkLine}`,
              }}>
                <Term k="MIN" v={'$' + fmtNum(l.minLoanUsd || 0)} />
                <Term k="TERM" v={fmtTerm(l.term)} />
                <Term k="CUSTODY" v={custodyShort(l)} />
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
                  <span style={flagStyle(SB.orange)}>{l.originationFeePctEffective}% ORIG FEE</span>
                )}
                {l.originationFeePctEffective === 0 && (
                  <span style={flagStyle(SB.forest)}>NO ORIG FEE</span>
                )}
                {l.custodyType === 'multisig' && <span style={flagStyle(SB.forest)}>MULTISIG</span>}
                {l.btcOnly === true && <span style={flagStyle(SB.forest)}>BTC ONLY</span>}
                {l.btcOnly === false && <span style={flagStyle(SB.rust)}>MULTI-COLLATERAL</span>}
                {l.rehypothecation === 'no' && <span style={flagStyle(SB.forest)}>NO REHYPO</span>}
                {rehypoBad && <span style={flagStyle(SB.rust)}>⚠ REHYPO</span>}
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
                  {isBest ? 'WE RECOMMEND THIS QUOTE' : 'compare terms before applying'}
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
                  }}>APPLY →</a>
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
