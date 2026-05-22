// ============================================================
// COMPARE PAGE — head-to-head between two lenders.
// URL pattern: /compare/{a}-vs-{b}, e.g. /compare/ledn-vs-firefish.
//
// Driven entirely from lenders.json + the same rankLenders() math
// used on /lenders, so any rate or rule change there flows through
// here automatically. The slug order doesn't constrain the math —
// we score both lenders and let the lower adjustedTotalCost win;
// the canonical URL is the alphabetical-order slug (handled by SEO).
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
  Button,
} from '../system/components.jsx';
import { useIsDesktop } from '../system/theme.jsx';
import { rankLenders, toUsd } from '../lib/math.js';
import { fmtMoney, fmtNum } from '../lib/format.js';
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

export default function ComparePage({ slug, lenders, lastUpdated, live, currency, region }) {
  const isDesktop = useIsDesktop();

  // Read the calculator's persisted loan amount so all pages
  // (Landing, Calculator, Lenders, Compare) show the same quote size.
  const [loanInCurrency] = usePersistentState('desiredLoan', 50000);
  const loanUsd = toUsd(loanInCurrency, currency, live.meta, live.btcUsd);

  // Parse the slug into two lender IDs. We accept either order; the
  // ranking math + visible "winner" is decided by adjustedTotalCost,
  // not by which side of the URL the user typed first.
  const parts = (slug || '').split('-vs-');
  const aId = parts[0];
  const bId = parts[1];

  const ranked = useMemo(() => {
    if (!lenders || !aId || !bId) return null;
    const a = lenders.find((l) => l.id === aId);
    const b = lenders.find((l) => l.id === bId);
    if (!a || !b) return null;
    return rankLenders([a, b], {
      loanUsd,
      region: region || 'global',
      ltvPct: LTV_PCT,
      termMonths: TERM_MONTHS,
      eligibleOnly: false,
    });
  }, [lenders, aId, bId, region, loanUsd]);

  // Loading state — lenders.json hasn't resolved yet.
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

  // Invalid slug, unknown lender, or same lender twice — show 404.
  if (!ranked || ranked.length !== 2 || aId === bId) {
    return <VoidState404 attemptedPath={'compare/' + slug} />;
  }

  const [winner, runner] = ranked;
  const costDelta = runner.adjustedTotalCost - winner.adjustedTotalCost;
  const aprDelta  = runner.adjustedApr - winner.adjustedApr;

  return isDesktop ? (
    <DesktopCompareLayout
      winner={winner}
      runner={runner}
      costDelta={costDelta}
      aprDelta={aprDelta}
      currency={currency}
      live={live}
      lastUpdated={lastUpdated}
      loanUsd={loanUsd}
    />
  ) : (
    <MobileCompareLayout
      winner={winner}
      runner={runner}
      costDelta={costDelta}
      aprDelta={aprDelta}
      currency={currency}
      live={live}
      lastUpdated={lastUpdated}
      loanUsd={loanUsd}
    />
  );
}

// ============================================================
// Mobile layout — stacked, comparison-row table.
// ============================================================
function MobileCompareLayout({ winner, runner, costDelta, aprDelta, currency, live, lastUpdated, loanUsd }) {
  return (
    <PaperFrame>
      <BrandHeader
        rightSlot={<LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />}
      />

      {/* Eyebrow + hero */}
      <div style={{ marginTop: 4, marginBottom: 8 }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.22em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 8,
        }}>
          HEAD-TO-HEAD · BITCOIN-BACKED LOANS
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: SB.serif, fontSize: 30, fontWeight: 600,
          lineHeight: 1.05, letterSpacing: '-0.025em', color: SB.ink,
        }}>
          {winner.name}{' '}
          <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>
            vs
          </span>{' '}
          {runner.name}.
        </h1>
        <p style={{
          marginTop: 12, marginBottom: 0,
          fontFamily: SB.sans, fontSize: 12.5, lineHeight: 1.55,
          color: SB.inkSoft, textWrap: 'pretty',
        }}>
          On a <b style={{ color: SB.ink }}>{fmtMoney(loanUsd, currency, live.meta, live.btcUsd)} · {TERM_MONTHS}mo · {LTV_PCT}% LTV</b> Bitcoin-backed loan, ranked by adjusted total cost — interest, origination, custody risk.
        </p>
      </div>

      <DashedRule label="VERDICT" />

      <VerdictBlock
        winner={winner}
        runner={runner}
        costDelta={costDelta}
        aprDelta={aprDelta}
        currency={currency}
        live={live}
      />

      <DashedRule label="SIDE-BY-SIDE" />

      <CompareTable
        winner={winner}
        runner={runner}
        currency={currency}
        live={live}
      />

      <DashedRule label="CUSTODY & RISK" />

      <CustodyBlock winner={winner} runner={runner} />

      <DashedRule label="APPLY" />

      <div style={{ display: 'grid', gap: 10 }}>
        <ApplyButton lender={winner} winner={true} />
        <ApplyButton lender={runner} winner={false} />
      </div>

      <DashedRule label="METHODOLOGY" />

      <p style={{
        margin: 0,
        fontFamily: SB.sans, fontSize: 12, lineHeight: 1.6,
        color: SB.inkSoft, textWrap: 'pretty',
      }}>
        Quotes use a <b style={{ color: SB.ink }}>{fmtMoney(loanUsd, currency, live.meta, live.btcUsd)}, {TERM_MONTHS}-month, {LTV_PCT}% LTV</b> Bitcoin-backed loan. Adjusted total cost = interest + origination + membership + a custody-risk premium that prices counterparty risk not reflected in nominal APR. Affiliate links never change the ranking. See <a href="/about" style={{ color: SB.orange, textDecoration: 'none', borderBottom: `1px dashed ${SB.orange}` }}>methodology</a> or browse the <a href="/lenders" style={{ color: SB.orange, textDecoration: 'none', borderBottom: `1px dashed ${SB.orange}` }}>full directory</a>.
      </p>

      <FineFooter source={live.source || 'mempool.space'} updated={lastUpdated} />
      <PageNav active="lender" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// Desktop layout — open-book spread. Left = verdict + hero + methodology,
// Right = comparison table + custody + apply CTAs.
// ============================================================
function DesktopCompareLayout({ winner, runner, costDelta, aprDelta, currency, live, lastUpdated, loanUsd }) {
  // We keep this self-contained rather than reusing DesktopSpreadFrame,
  // since the compare page is not part of the four-section booklet
  // nav and shouldn't render with currentPage/pageOf.
  return (
    <PaperFrame maxWidth={1320} sidePad={60} innerPad="0 56px">
      <BrandHeader
        size="desktop"
        rightSlot={<LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', marginTop: 8 }}>
        {/* LEFT */}
        <div style={{ padding: '0 32px 0 0', minWidth: 0 }}>
          <div style={{
            fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
            color: SB.inkMute, fontWeight: 700,
            marginTop: 18, marginBottom: 14,
          }}>
            HEAD-TO-HEAD · BITCOIN-BACKED LOANS
          </div>
          <h1 style={{
            margin: 0,
            fontFamily: SB.serif, fontSize: 52, fontWeight: 600,
            lineHeight: 1, letterSpacing: '-0.03em', color: SB.ink,
          }}>
            {winner.name}<br />
            <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>vs</span>{' '}
            {runner.name}.
          </h1>
          <p style={{
            marginTop: 22, marginBottom: 0,
            fontFamily: SB.sans, fontSize: 15, lineHeight: 1.55,
            color: SB.inkSoft, textWrap: 'pretty', maxWidth: 460,
          }}>
            On a <b style={{ color: SB.ink }}>{fmtMoney(loanUsd, currency, live.meta, live.btcUsd)} · {TERM_MONTHS}-month · {LTV_PCT}% LTV</b> Bitcoin-backed loan, ranked by adjusted total cost — interest, origination, custody risk.
          </p>

          <DashedRule label="VERDICT" />
          <VerdictBlock
            winner={winner}
            runner={runner}
            costDelta={costDelta}
            aprDelta={aprDelta}
            currency={currency}
            live={live}
          />

          <DashedRule label="METHODOLOGY" />
          <p style={{
            margin: 0,
            fontFamily: SB.sans, fontSize: 13, lineHeight: 1.6,
            color: SB.inkSoft, textWrap: 'pretty', maxWidth: 480,
          }}>
            Quotes use a <b style={{ color: SB.ink }}>{fmtMoney(loanUsd, currency, live.meta, live.btcUsd)}, {TERM_MONTHS}-month, {LTV_PCT}% LTV</b> Bitcoin-backed loan. Adjusted total cost = interest + origination + membership + a custody-risk premium that prices counterparty risk not reflected in nominal APR. Affiliate links never change the ranking. See <a href="/about" style={{ color: SB.orange, textDecoration: 'none', borderBottom: `1px dashed ${SB.orange}` }}>methodology</a> or browse the <a href="/lenders" style={{ color: SB.orange, textDecoration: 'none', borderBottom: `1px dashed ${SB.orange}` }}>full directory</a>.
          </p>
        </div>

        {/* SPINE */}
        <div style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 0',
        }}>
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
            SIDE-BY-SIDE · {fmtMoney(loanUsd, currency, live.meta, live.btcUsd)} · {TERM_MONTHS} MO
          </div>

          <CompareTable
            winner={winner}
            runner={runner}
            currency={currency}
            live={live}
            desktop
          />

          <DashedRule label="CUSTODY & RISK" />
          <CustodyBlock winner={winner} runner={runner} desktop />

          <DashedRule label="APPLY" />
          <div style={{ display: 'grid', gap: 12 }}>
            <ApplyButton lender={winner} winner={true} />
            <ApplyButton lender={runner} winner={false} />
          </div>
        </div>
      </div>

      <FineFooter source={live.source || 'mempool.space'} updated={lastUpdated} />
      <PageNav active="lender" />
      <div style={{ height: 18 }} />
    </PaperFrame>
  );
}

// ============================================================
// Subcomponents
// ============================================================

function VerdictBlock({ winner, runner, costDelta, aprDelta, currency, live }) {
  const tie = Math.abs(costDelta) < 1; // within $1 — call it a tie
  return (
    <div style={{
      padding: '16px 14px',
      border: `1.5px solid ${SB.ink}`,
      background: SB.creamWarm,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: -10, right: 14 }}>
        <div style={{
          background: SB.orange, color: SB.cream,
          padding: '3px 10px',
          fontFamily: SB.mono, fontSize: 9, fontWeight: 700,
          letterSpacing: '0.18em',
        }}>★ LOWER COST</div>
      </div>

      <div style={{
        fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.2em',
        color: SB.inkMute, fontWeight: 700, marginBottom: 6,
      }}>
        WINNER · BY ADJUSTED TOTAL COST
      </div>
      <div style={{
        fontFamily: SB.serif, fontSize: 22, fontWeight: 600, color: SB.ink,
        letterSpacing: '-0.01em', lineHeight: 1.05,
      }}>
        {winner.name}
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
        {winner.btcOnly === true && <Pill color={SB.forest}>BTC ONLY</Pill>}
        {winner.custodyType === 'multisig' && <Pill color={SB.forest}>MULTISIG</Pill>}
        {winner.rehypothecation === 'no' && <Pill color={SB.forest}>NO REHYPO</Pill>}
      </div>

      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: `1px dotted ${SB.inkLine}`,
      }}>
        <Row
          label="Adjusted total cost"
          value={fmtMoney(winner.adjustedTotalCost, currency, live.meta, live.btcUsd)}
          sub={`${winner.adjustedApr.toFixed(2)}% adjusted APR`}
        />
        <Row
          label={`${runner.name}, same loan`}
          value={fmtMoney(runner.adjustedTotalCost, currency, live.meta, live.btcUsd)}
          sub={`${runner.adjustedApr.toFixed(2)}% adjusted APR`}
        />
        <Row
          label={tie ? 'Difference (basically a wash)' : `You save with ${winner.name}`}
          value={tie
            ? '— '
            : fmtMoney(costDelta, currency, live.meta, live.btcUsd)}
          sub={tie ? '' : `${aprDelta.toFixed(2)}% lower adjusted APR`}
          valueStyle={{ color: tie ? SB.ink : SB.forest, fontWeight: 700 }}
        />
      </div>
    </div>
  );
}

function CompareTable({ winner, runner, currency, live, desktop = false }) {
  const fontSize = desktop ? 12 : 11;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr 1fr',
      fontFamily: SB.mono, fontSize,
      border: `1.5px solid ${SB.inkLine}`,
    }}>
      <TH label="Spec" />
      <TH label={winner.name} highlight />
      <TH label={runner.name} />

      <TR
        label="Origination fee"
        a={winner.originationFeePctEffective > 0 ? `${winner.originationFeePctEffective}%` : 'none'}
        b={runner.originationFeePctEffective > 0 ? `${runner.originationFeePctEffective}%` : 'none'}
        aHighlight={winner.originationFeePctEffective <= runner.originationFeePctEffective}
      />
      <TR
        label="APR"
        a={`${winner.effectiveApr.toFixed(2)}%`}
        b={`${runner.effectiveApr.toFixed(2)}%`}
        aHighlight={winner.effectiveApr <= runner.effectiveApr}
      />
      <TR
        label="Total cost (12mo)"
        a={fmtMoney(winner.totalCost, currency, live.meta, live.btcUsd)}
        b={fmtMoney(runner.totalCost, currency, live.meta, live.btcUsd)}
        aHighlight={winner.totalCost <= runner.totalCost}
      />
      <TR
        label="Adjusted total cost"
        a={fmtMoney(winner.adjustedTotalCost, currency, live.meta, live.btcUsd)}
        b={fmtMoney(runner.adjustedTotalCost, currency, live.meta, live.btcUsd)}
        aHighlight
        sub="custody-risk weighted"
      />
      <TR
        label="Maximum LTV"
        a={`${winner.maxLtv ?? '—'}%`}
        b={`${runner.maxLtv ?? '—'}%`}
      />
      <TR
        label="Minimum loan"
        a={`$${fmtNum(winner.minLoanUsd ?? 0)}`}
        b={`$${fmtNum(runner.minLoanUsd ?? 0)}`}
      />
      <TR
        label="Term"
        a={winner.term || '—'}
        b={runner.term || '—'}
        mono={false}
      />
      <TR
        label="BTC-only collateral"
        a={winner.btcOnly ? 'Yes' : 'No (multi)'}
        b={runner.btcOnly ? 'Yes' : 'No (multi)'}
        aHighlight={winner.btcOnly === true && runner.btcOnly !== true}
      />
      <TR
        label="Custody model"
        a={custodyLabel(winner)}
        b={custodyLabel(runner)}
        mono={false}
      />
      <TR
        label="Rehypothecation"
        a={rehypoLabel(winner)}
        b={rehypoLabel(runner)}
        mono={false}
        aTone={rehypoTone(winner)}
        bTone={rehypoTone(runner)}
      />
      <TR
        label="Rollover"
        a={winner.rollover || '—'}
        b={runner.rollover || '—'}
        mono={false}
      />
    </div>
  );
}

function TH({ label, highlight = false }) {
  return (
    <div style={{
      padding: '8px 10px',
      borderBottom: `1.5px solid ${SB.ink}`,
      borderRight: `1px dashed ${SB.inkLine}`,
      background: highlight ? SB.creamWarm : 'transparent',
      fontWeight: 700,
      fontSize: 9.5,
      letterSpacing: '0.16em',
      color: SB.ink,
    }}>{label}</div>
  );
}

function TR({ label, a, b, sub = null, aHighlight = false, mono = true, aTone, bTone }) {
  const cellBase = {
    padding: '7px 10px',
    borderBottom: `1px dotted ${SB.inkLine}`,
    borderRight: `1px dashed ${SB.inkLine}`,
    fontFamily: mono ? SB.mono : SB.sans,
    fontSize: mono ? 11 : 12,
    lineHeight: 1.4,
    color: SB.ink,
  };
  return (
    <>
      <div style={{ ...cellBase, fontFamily: SB.mono, fontSize: 10, color: SB.inkSoft, fontWeight: 600, letterSpacing: '0.04em' }}>
        {label}
        {sub && (
          <div style={{ fontSize: 8.5, color: SB.inkMute, marginTop: 2, letterSpacing: '0.02em' }}>{sub}</div>
        )}
      </div>
      <div style={{
        ...cellBase,
        fontWeight: aHighlight ? 700 : 500,
        color: aTone || (aHighlight ? SB.forest : SB.ink),
        background: aHighlight ? SB.creamWarm : 'transparent',
      }}>{a}</div>
      <div style={{
        ...cellBase,
        borderRight: 'none',
        fontWeight: 500,
        color: bTone || SB.ink,
      }}>{b}</div>
    </>
  );
}

function CustodyBlock({ winner, runner, desktop = false }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <CustodyCard lender={winner} winner={true} desktop={desktop} />
      <CustodyCard lender={runner} winner={false} desktop={desktop} />
    </div>
  );
}

function CustodyCard({ lender, winner, desktop }) {
  return (
    <div style={{
      padding: '12px 14px',
      border: `1.5px ${winner ? 'solid' : 'dashed'} ${winner ? SB.ink : SB.inkLine}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 10, marginBottom: 6,
      }}>
        <div style={{
          fontFamily: SB.serif, fontSize: desktop ? 17 : 15, fontWeight: 600,
          color: SB.ink, letterSpacing: '-0.005em',
        }}>{lender.name}</div>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, fontWeight: 700,
          letterSpacing: '0.14em', color: rehypoTone(lender),
        }}>
          {custodyLabel(lender).toUpperCase()}
        </div>
      </div>
      <p style={{
        margin: 0,
        fontFamily: SB.sans, fontSize: desktop ? 12.5 : 11.5,
        lineHeight: 1.55, color: SB.inkSoft, textWrap: 'pretty',
      }}>
        {lender.custody}
      </p>
    </div>
  );
}

function ApplyButton({ lender, winner }) {
  // Reuses the same outbound link the rest of the site uses, with
  // the standard noopener/noreferrer for affiliate trackers.
  return (
    <a
      href={lender.referralUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        width: '100%',
        padding: '15px 18px',
        border: `2px dashed ${SB.ink}`,
        background: winner ? SB.inkFill : 'transparent',
        color: winner ? SB.cream : SB.ink,
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
      <span>{winner ? `Open with ${lender.name} — Lower cost` : `Open with ${lender.name}`}</span>
      <span style={{ color: SB.orange, fontSize: 14 }}>▸</span>
    </a>
  );
}
