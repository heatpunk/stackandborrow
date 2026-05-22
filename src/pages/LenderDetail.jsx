// ============================================================
// LENDER DETAIL — single-lender deep dive at /lenders/{id}.
//
// Targets "{lender name} review" searches with structured data,
// independent custody-risk analysis, and links back into both the
// full directory and the head-to-head compare pages.
// ============================================================

import React, { useMemo } from 'react';
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
  PageNav,
  FineFooter,
  LivePriceBadge,
} from '../system/components.jsx';
import { useIsDesktop } from '../system/theme.jsx';
import { rankLenders, toUsd } from '../lib/math.js';
import { fmtMoney, fmtMoneyCompact, fmtNum } from '../lib/format.js';
import { usePersistentState } from '../lib/hooks.js';
import { VoidState404 } from './Void.jsx';

function custodyLabel(l) {
  if (l.custodyType === 'multisig') {
    if (l.custodyKind === 'taproot-vault')   return 'Taproot vault';
    if (l.custodyKind === 'dlc')             return 'DLC (non-custodial)';
    if (l.custodyKind === 'collab-multisig') return 'Collaborative multisig';
    return 'Multisig';
  }
  if (l.custodyType === 'segregated')      return 'Segregated custody';
  if (l.custodyType === 'custodial-mixed') return 'Custodial (mixed model)';
  return 'Custodial';
}

function rehypoLabel(l) {
  if (l.rehypothecation === 'no')       return 'No rehypothecation';
  if (l.rehypothecation === 'optional') return 'Optional rehypothecation';
  if (l.rehypothecation === 'yes' || l.rehypothecation === true) return 'Rehypothecates collateral';
  return 'Rehypothecation policy not disclosed';
}

function rehypoTone(l) {
  if (l.rehypothecation === 'no') return SB.forest;
  if (l.rehypothecation === 'yes' || l.rehypothecation === true) return SB.rust;
  return SB.orange;
}

export default function LenderDetailPage({ id, lenders, lastUpdated, live, currency, region }) {
  const isDesktop = useIsDesktop();

  // Read the calculator's persisted loan amount so all pages
  // (Landing, Calculator, Lenders, Compare) show the same quote size.
  const [loanInCurrency] = usePersistentState('desiredLoan', 50000);
  const loanUsd = toUsd(loanInCurrency, currency, live.meta, live.btcUsd);

  // Rank the full directory so we can show this lender's position
  // and pick adjacent neighbors for the "compare with…" block.
  const ranked = useMemo(() => {
    if (!lenders || lenders.length === 0) return [];
    return rankLenders(lenders, {
      loanUsd,
      region: region || 'global',
      ltvPct: LTV_PCT,
      termMonths: TERM_MONTHS,
      eligibleOnly: false,
    });
  }, [lenders, region, loanUsd]);

  const idx = ranked.findIndex((l) => l.id === id);
  const lender = idx >= 0 ? ranked[idx] : null;

  if (!lenders || lenders.length === 0) {
    return (
      <PaperFrame>
        <BrandHeader />
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: SB.mono, color: SB.inkMute }}>
          Loading…
        </div>
        <PageNav active="lender" />
      </PaperFrame>
    );
  }

  if (!lender) return <VoidState404 attemptedPath={'lenders/' + id} />;

  // Pick up to three "compare against" peers: the rank above, the rank
  // below, and the #1 (if this lender isn't already #1).
  const peers = [];
  const seen = new Set([lender.id]);
  if (idx > 0) { peers.push(ranked[idx - 1]); seen.add(ranked[idx - 1].id); }
  if (idx < ranked.length - 1) { peers.push(ranked[idx + 1]); seen.add(ranked[idx + 1].id); }
  if (!seen.has(ranked[0].id)) peers.push(ranked[0]);

  const props = { lender, ranked, idx, peers, currency, live, lastUpdated, loanUsd };
  return isDesktop ? <DesktopLayout {...props} /> : <MobileLayout {...props} />;
}

// ============================================================
// MOBILE
// ============================================================
function MobileLayout({ lender, ranked, idx, peers, currency, live, lastUpdated, loanUsd }) {
  const quoteLabel = `QUOTE · ${fmtMoneyCompact(loanUsd, currency, live.meta, live.btcUsd)} · 12MO · 50% LTV`;
  return (
    <PaperFrame>
      <BrandHeader
        rightSlot={<LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />}
      />

      <Eyebrow lender={lender} idx={idx} total={ranked.length} />
      <Hero lender={lender} loanUsd={loanUsd} currency={currency} live={live} />

      <DashedRule label={quoteLabel} />
      <QuoteBlock lender={lender} currency={currency} live={live} />

      <DashedRule label="SPECS" />
      <SpecsTable lender={lender} currency={currency} live={live} />

      <DashedRule label="CUSTODY · RISK" />
      <CustodyBlock lender={lender} />

      <DashedRule label="NOTES" />
      <NotesBlock lender={lender} />

      <DashedRule label="HEAD-TO-HEAD" />
      <PeersBlock lender={lender} peers={peers} />

      <DashedRule label="APPLY" />
      <ApplyButton lender={lender} />

      <Methodology loanUsd={loanUsd} currency={currency} live={live} />

      <FineFooter source={live.source || 'mempool.space'} updated={lastUpdated} />
      <PageNav active="lender" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// DESKTOP — open spread.
// ============================================================
function DesktopLayout({ lender, ranked, idx, peers, currency, live, lastUpdated, loanUsd }) {
  const quoteLabel = `QUOTE · ${fmtMoneyCompact(loanUsd, currency, live.meta, live.btcUsd)} · 12MO · 50% LTV`;
  return (
    <PaperFrame maxWidth={1320} sidePad={60} innerPad="0 56px">
      <BrandHeader
        size="desktop"
        rightSlot={<LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', marginTop: 8 }}>
        {/* LEFT */}
        <div style={{ padding: '0 32px 0 0', minWidth: 0 }}>
          <Eyebrow lender={lender} idx={idx} total={ranked.length} desktop />
          <Hero lender={lender} loanUsd={loanUsd} currency={currency} live={live} desktop />

          <DashedRule label={quoteLabel} />
          <QuoteBlock lender={lender} currency={currency} live={live} desktop />

          <DashedRule label="CUSTODY · RISK" />
          <CustodyBlock lender={lender} desktop />

          <DashedRule label="NOTES" />
          <NotesBlock lender={lender} desktop />
        </div>

        {/* SPINE */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '50%', top: 0, bottom: 0,
            width: 0,
            borderLeft: `1px dashed ${SB.inkLine}`,
            transform: 'translateX(-0.5px)',
          }} />
        </div>

        {/* RIGHT */}
        <div style={{ padding: '0 0 0 32px', minWidth: 0 }}>
          <div style={{
            fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
            color: SB.inkMute, fontWeight: 700,
            marginTop: 18, marginBottom: 14,
          }}>
            DOSSIER · {lender.name.toUpperCase()}
          </div>

          <DashedRule label="SPECS" />
          <SpecsTable lender={lender} currency={currency} live={live} desktop />

          <DashedRule label="HEAD-TO-HEAD" />
          <PeersBlock lender={lender} peers={peers} desktop />

          <DashedRule label="APPLY" />
          <ApplyButton lender={lender} />

          <Methodology loanUsd={loanUsd} currency={currency} live={live} desktop />
        </div>
      </div>

      <FineFooter source={live.source || 'mempool.space'} updated={lastUpdated} />
      <PageNav active="lender" />
      <div style={{ height: 18 }} />
    </PaperFrame>
  );
}

// ============================================================
// Building blocks
// ============================================================

function Eyebrow({ lender, idx, total, desktop = false }) {
  // Display rank position over total (1-indexed, so "#1 of 14").
  return (
    <div style={{
      marginTop: desktop ? 18 : 4,
      fontFamily: SB.mono,
      fontSize: desktop ? 10 : 9,
      letterSpacing: '0.22em',
      color: SB.inkMute, fontWeight: 700,
      marginBottom: desktop ? 14 : 8,
    }}>
      DOSSIER · RANKED #{idx + 1} OF {total}
    </div>
  );
}

function Hero({ lender, desktop = false, loanUsd, currency, live }) {
  const badge = lender.badge;
  return (
    <div style={{ marginBottom: desktop ? 6 : 2, position: 'relative' }}>
      <h1 style={{
        margin: 0,
        fontFamily: SB.serif,
        fontSize: desktop ? 56 : 34,
        fontWeight: 600,
        lineHeight: 1.02,
        letterSpacing: '-0.03em',
        color: SB.ink,
      }}>
        {lender.name}
        <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>.</span>
      </h1>
      {badge && (
        <div style={{ marginTop: desktop ? 14 : 10 }}>
          <Pill color={SB.ink}>{badge}</Pill>
        </div>
      )}
      <p style={{
        marginTop: desktop ? 18 : 12, marginBottom: 0,
        fontFamily: SB.sans,
        fontSize: desktop ? 15 : 13,
        lineHeight: 1.55,
        color: SB.inkSoft, textWrap: 'pretty',
        maxWidth: desktop ? 460 : 'none',
      }}>
        Bitcoin-backed loan review of <b style={{ color: SB.ink }}>{lender.name}</b>. Specs, custody model, ranking, and what differentiates them — measured against the directory at a standard {fmtMoney(loanUsd, currency, live.meta, live.btcUsd)} · 12-month · 50% LTV loan.
      </p>
    </div>
  );
}

function QuoteBlock({ lender, currency, live, desktop = false }) {
  return (
    <div style={{
      padding: '14px 14px',
      border: `1.5px solid ${SB.ink}`,
      background: SB.creamWarm,
    }}>
      <Row
        label="Origination fee"
        value={lender.originationFeePctEffective > 0 ? `${lender.originationFeePctEffective}%` : 'none'}
        sub={lender.originationFeePctEffective > 0 ? 'one-time, paid up front' : ''}
      />
      <Row
        label="APR"
        value={`${lender.effectiveApr.toFixed(2)}%`}
        sub={lender.isTiered ? 'first tier · scales with loan size' : 'fixed rate'}
      />
      {lender.membershipFeeUsd > 0 && (
        <Row
          label="Membership"
          value={fmtMoney(lender.membershipFeeUsd, currency, live.meta, live.btcUsd)}
          sub="annual · pro-rated into total cost"
        />
      )}
      <Row
        label="Total cost (12mo)"
        value={fmtMoney(lender.totalCost, currency, live.meta, live.btcUsd)}
      />
      <Row
        label="Adjusted total cost"
        value={fmtMoney(lender.adjustedTotalCost, currency, live.meta, live.btcUsd)}
        sub={`custody-risk weighted (+${lender.custodyPremiumPct.toFixed(2)} pp)`}
        valueStyle={{ color: SB.orange, fontWeight: 700 }}
      />
    </div>
  );
}

function SpecsTable({ lender, currency, live, desktop = false }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: SB.mono, fontSize: desktop ? 12 : 11,
      border: `1.5px solid ${SB.inkLine}`,
    }}>
      <TH label="Spec" />
      <TH label="Value" />
      <TR label="Maximum LTV" v={`${lender.maxLtv ?? '—'}%`} />
      <TR label="Minimum loan" v={`$${fmtNum(lender.minLoanUsd ?? 0)}`} />
      <TR label="Term" v={lender.term || '—'} mono={false} />
      <TR label="Rollover" v={lender.rollover || '—'} mono={false} />
      <TR label="BTC-only collateral" v={lender.btcOnly ? 'Yes' : 'No (multi)'} tone={lender.btcOnly ? SB.forest : SB.rust} />
      <TR label="Custody model" v={custodyLabel(lender)} mono={false} />
      <TR label="Rehypothecation" v={rehypoLabel(lender)} mono={false} tone={rehypoTone(lender)} />
      <TR label="Regions served" v={(lender.country || []).map((c) => c.toUpperCase()).join(' · ')} mono={false} />
      {lender.excluded && lender.excluded.length > 0 && (
        <TR label="Excluded" v={lender.excluded.join(', ')} mono={false} tone={SB.rust} />
      )}
    </div>
  );
}

function TH({ label }) {
  return (
    <div style={{
      padding: '8px 10px',
      borderBottom: `1.5px solid ${SB.ink}`,
      borderRight: `1px dashed ${SB.inkLine}`,
      fontFamily: SB.mono,
      fontWeight: 700,
      fontSize: 9.5,
      letterSpacing: '0.16em',
      color: SB.ink,
    }}>{label}</div>
  );
}

function TR({ label, v, mono = true, tone }) {
  const cellBase = {
    padding: '7px 10px',
    borderBottom: `1px dotted ${SB.inkLine}`,
    fontFamily: mono ? SB.mono : SB.sans,
    fontSize: mono ? 11 : 12,
    lineHeight: 1.4,
    color: SB.ink,
  };
  return (
    <>
      <div style={{ ...cellBase, fontFamily: SB.mono, fontSize: 10, color: SB.inkSoft, fontWeight: 600, letterSpacing: '0.04em', borderRight: `1px dashed ${SB.inkLine}` }}>
        {label}
      </div>
      <div style={{ ...cellBase, fontWeight: 500, color: tone || SB.ink }}>
        {v}
      </div>
    </>
  );
}

function CustodyBlock({ lender, desktop = false }) {
  return (
    <div style={{
      padding: '12px 14px',
      border: `1px dashed ${rehypoTone(lender)}`,
    }}>
      <div style={{
        fontFamily: SB.mono, fontSize: 9, fontWeight: 700,
        letterSpacing: '0.18em', color: rehypoTone(lender),
        marginBottom: 6,
      }}>
        {custodyLabel(lender).toUpperCase()} · {rehypoLabel(lender).toUpperCase()}
      </div>
      <p style={{
        margin: 0,
        fontFamily: SB.sans, fontSize: desktop ? 13 : 12,
        lineHeight: 1.6, color: SB.inkSoft, textWrap: 'pretty',
      }}>
        {lender.custody}
      </p>
    </div>
  );
}

function NotesBlock({ lender, desktop = false }) {
  if (!lender.notes) return null;
  return (
    <p style={{
      margin: 0,
      fontFamily: SB.sans,
      fontSize: desktop ? 13.5 : 12.5,
      lineHeight: 1.65,
      color: SB.inkSoft, textWrap: 'pretty',
    }}>
      {lender.notes}
    </p>
  );
}

function PeersBlock({ lender, peers, desktop = false }) {
  if (peers.length === 0) return null;
  return (
    <div style={{
      display: 'grid', gap: 8,
      gridTemplateColumns: desktop ? '1fr' : '1fr',
    }}>
      {peers.map((peer) => {
        const [c1, c2] = [lender.id, peer.id].sort();
        const slug = `${c1}-vs-${c2}`;
        const href = `/compare/${slug}`;
        return (
          <a
            key={peer.id}
            href={href}
            style={{
              display: 'block',
              padding: '10px 12px',
              border: `1px dashed ${SB.inkLine}`,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 6,
              fontFamily: SB.serif, fontSize: desktop ? 16 : 14, fontWeight: 600,
              color: SB.ink, letterSpacing: '-0.005em',
            }}>
              <span>{lender.name}</span>
              <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500, fontSize: desktop ? 13 : 11 }}>vs</span>
              <span>{peer.name}</span>
            </div>
            <div style={{
              marginTop: 3,
              fontFamily: SB.mono, fontSize: 9.5,
              color: SB.inkMute, letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Head-to-head · {peer.effectiveApr.toFixed(2)}% effective APR <span style={{ color: SB.orange }}>↗</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function ApplyButton({ lender }) {
  return (
    <a
      href={lender.referralUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        width: '100%',
        padding: '15px 18px',
        border: `2px dashed ${SB.ink}`,
        background: SB.inkFill,
        color: SB.cream,
        fontFamily: SB.mono,
        fontSize: 12, fontWeight: 700,
        letterSpacing: '0.16em',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        textTransform: 'uppercase',
        textDecoration: 'none',
        boxSizing: 'border-box',
      }}>
      <span style={{ color: SB.orange, fontSize: 14 }}>▸</span>
      <span>Open with {lender.name}</span>
      <span style={{ color: SB.orange, fontSize: 14 }}>▸</span>
    </a>
  );
}

function Methodology({ desktop = false, loanUsd, currency, live }) {
  return (
    <p style={{
      margin: '14px 0 0',
      fontFamily: SB.sans, fontSize: desktop ? 12.5 : 11.5,
      lineHeight: 1.6, color: SB.inkSoft, textWrap: 'pretty',
    }}>
      Quotes use a <b style={{ color: SB.ink }}>{fmtMoney(loanUsd, currency, live.meta, live.btcUsd)}, 12-month, 50% LTV</b> loan. Total cost = interest + origination + membership; adjusted cost adds a custody-risk premium for rehypothecation and pooled custody. Affiliate links never change the ranking. See <a href="/about" style={{ color: SB.orange, textDecoration: 'none', borderBottom: `1px dashed ${SB.orange}` }}>methodology</a> or browse the <a href="/lenders" style={{ color: SB.orange, textDecoration: 'none', borderBottom: `1px dashed ${SB.orange}` }}>full directory</a>.
    </p>
  );
}
