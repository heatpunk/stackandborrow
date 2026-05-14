// ============================================================
// VOID / EMPTY STATES — the moments where the booklet can't
// print a normal answer.
//
//   VoidStateLoanTooSmall  — amount below any lender's minimum
//   VoidStateNoRegion      — user's region not served by any lender
//   VoidState404           — unknown route
//   VoidStateLoading       — first BTC price fetch in flight
//
// Each is a full-page booklet with stamp + actionable next step.
// ============================================================

import React from 'react';
import { SB } from '../system/tokens.js';
import {
  PaperFrame,
  BrandHeader,
  DashedRule,
  Row,
  Stamp,
  Button,
  PageNav,
  FineFooter,
} from '../system/components.jsx';
import { useIsDesktop } from '../system/theme.jsx';
import { DesktopSpreadFrame } from '../system/desktop.jsx';

// ============================================================
// 01 · Loan too small
// ============================================================
export function VoidStateLoanTooSmall({ amountLabel = '—', minLabel = '$1,000', onReturn }) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return <DesktopVoidLoanTooSmall amountLabel={amountLabel} minLabel={minLabel} onReturn={onReturn} />;
  }
  return (
    <PaperFrame>
      <BrandHeader
        currentPage="—"
        pageOf="—"
        rightSlot={
          <div style={{
            fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.12em',
            color: SB.rust, textAlign: 'right', fontWeight: 700,
          }}>
            <div>NO QUOTES</div>
            <div style={{ marginTop: 4, color: SB.inkMute, fontWeight: 500 }}>
              AMOUNT BELOW MINIMUM
            </div>
          </div>
        }
      />

      <VoidHero
        eyebrow="ERR · 01"
        title={<>Loan too small.<br /><Italic>No lender will take you.</Italic></>}
        body={`The lowest minimum across the lenders we cover is ${minLabel}. Below that, the math stops being worth it — origination fees would dwarf the loan.`}
      />

      <VoidStampBig line1="LOAN" line2="VOID" line3={`★ < ${minLabel} ★`} color={SB.rust} />

      <DashedRule label="THE NUMBERS" />

      <div style={{ padding: '0 2px' }}>
        <Row label="Amount requested" value={amountLabel} valueStyle={{ color: SB.rust }} />
        <Row label="Minimum across all lenders" value={minLabel} sub="Ledn · Firefish · Xapo" />
        <Row label="Origination would be" value="~$50" sub="dwarfs the principal" valueStyle={{ color: SB.rust }} />
      </div>

      <DashedRule label="WHAT NOW" />

      <BulletList items={[
        ['Increase your loan amount', `try ${minLabel} or more`],
        ['Sell a small chunk instead', 'no interest, no liquidation risk'],
        ['Wait until you need more', 'borrow once, less friction'],
      ]} />

      <div style={{ marginTop: 16 }}>
        <Button onClick={onReturn} href={onReturn ? undefined : '#calculator'}>
          {onReturn ? 'RESET AMOUNT & CONTINUE' : 'RETURN TO CALCULATOR'}
        </Button>
      </div>

      <FineFooter />
      <PageNav active="calc" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// 02 · Region not served
// ============================================================
export function VoidStateNoRegion({ regionLabel = 'your region', regionCode = '—' }) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return <DesktopVoidNoRegion regionLabel={regionLabel} regionCode={regionCode} />;
  }
  return (
    <PaperFrame>
      <BrandHeader
        currentPage="—"
        pageOf="—"
        rightSlot={
          <div style={{
            fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.12em',
            color: SB.rust, textAlign: 'right', fontWeight: 700,
          }}>
            <div>NO QUOTES</div>
            <div style={{ marginTop: 4, color: SB.inkMute, fontWeight: 500 }}>
              REGION NOT SERVED
            </div>
          </div>
        }
      />

      <VoidHero
        eyebrow="ERR · 02"
        title={<>No lenders<br /><Italic>in {regionLabel}.</Italic></>}
        body={`Bitcoin-backed lending is regulated unevenly. We don't currently have a verified lender that serves residents of your detected region (${regionCode.toUpperCase()}).`}
      />

      <VoidStampBig line1="REGION" line2="VOID" line3={`★ ${regionCode.toUpperCase()} · 0 LENDERS ★`} color={SB.rust} />

      <DashedRule label="WHAT'S BLOCKING THIS" />

      <div style={{ padding: '0 2px' }}>
        <Row label="Your detected region" value={`${regionCode.toUpperCase()} · ${regionLabel}`} />
        <Row label="Lenders that serve you" value="0 of 9" valueStyle={{ color: SB.rust }} />
        <Row label="Closest available" value="Global · 3 lenders" sub="Strike · Firefish · Xapo" />
      </div>

      <div style={{
        marginTop: 14, padding: '14px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.2em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 8,
        }}>WHY THIS HAPPENS</div>
        <p style={{
          margin: 0,
          fontFamily: SB.sans, fontSize: 12, lineHeight: 1.55,
          color: SB.inkSoft, textWrap: 'pretty',
        }}>
          Some jurisdictions classify BTC lending in ways that make regulated lenders
          stay out of the market until rules clarify. We&rsquo;ll keep an eye on it.
        </p>
      </div>

      <DashedRule label="WHAT NOW" />

      <BulletList items={[
        ['Switch currency in the calculator', 'see lenders for US / EU / CA'],
        ['Browse the global lender list',     'shows everyone regardless of region'],
        ['Read the terms',                    'philosophy & method'],
      ]} />

      <div style={{ marginTop: 16 }}>
        <Button href="#lenders">BROWSE GLOBAL LENDERS</Button>
      </div>

      <FineFooter />
      <PageNav active="lender" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// 04 · Unknown route (404)
// ============================================================
export function VoidState404({ attemptedPath = '' }) {
  const isDesktop = useIsDesktop();
  const path = attemptedPath || (typeof window !== 'undefined' ? window.location.hash : '');
  if (isDesktop) {
    return <DesktopVoid404 path={path} />;
  }
  return (
    <PaperFrame>
      <BrandHeader
        currentPage="—"
        pageOf="—"
        rightSlot={
          <div style={{
            fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.12em',
            color: SB.rust, textAlign: 'right', fontWeight: 700,
          }}>
            <div>PAGE MISSING</div>
            <div style={{ marginTop: 4, color: SB.inkMute, fontWeight: 500 }}>
              ERR · 04
            </div>
          </div>
        }
      />

      <VoidHero
        eyebrow="404 · NOT IN BOOKLET"
        title={<>This page<br /><Italic>was never printed.</Italic></>}
        body="The URL you tried doesn't match anything in our four-section booklet. Maybe a typo. Maybe a stale link. Either way — let's get you back."
      />

      <VoidStampBig line1="PAGE" line2="VOID" line3="★ HTTP · 404 ★" color={SB.ink} />

      {/* "You tried to reach" receipt */}
      <div style={{
        marginTop: 18, padding: '16px 14px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
        borderStyle: 'solid solid dashed solid',
        position: 'relative',
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.2em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 8,
        }}>YOU TRIED TO REACH</div>
        <div style={{
          fontFamily: SB.mono, fontSize: 13, fontWeight: 600,
          color: SB.ink, padding: '6px 0',
          borderBottom: `1px dotted ${SB.inkLine}`,
          letterSpacing: '-0.005em',
          overflowWrap: 'anywhere',
        }}>
          {path || '/—'}
        </div>
        <div style={{
          marginTop: 10,
          fontFamily: SB.sans, fontSize: 11.5,
          color: SB.inkSoft, lineHeight: 1.5,
          textWrap: 'pretty',
        }}>
          We&rsquo;ve only ever published these four sections. Try one below.
        </div>
      </div>

      <DashedRule label="JUMP TO" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { no: 'I',   t: 'Overview',   sub: 'the pitch',   href: '#' },
          { no: 'II',  t: 'Calculator', sub: 'run numbers', href: '#calculator' },
          { no: 'III', t: 'Lenders',    sub: 'compare 9',   href: '#lenders' },
          { no: 'IV',  t: 'Terms',      sub: 'philosophy',  href: '#about' },
        ].map((p) => (
          <a key={p.no} href={p.href} style={{
            padding: '14px 12px',
            border: `1.5px dashed ${SB.inkLine}`,
            background: 'transparent',
            display: 'flex', alignItems: 'baseline', gap: 10,
            cursor: 'pointer',
            color: SB.ink,
            textDecoration: 'none',
          }}>
            <span style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 22, color: SB.orange, fontWeight: 500, lineHeight: 1 }}>
              {p.no}
            </span>
            <div>
              <div style={{ fontFamily: SB.serif, fontSize: 14, fontWeight: 600, color: SB.ink, lineHeight: 1 }}>
                {p.t}
              </div>
              <div style={{ fontFamily: SB.mono, fontSize: 9, color: SB.inkMute, marginTop: 4, letterSpacing: '0.08em' }}>
                {p.sub.toUpperCase()}
              </div>
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Button href="#">BACK TO OVERVIEW</Button>
      </div>

      <FineFooter />
      <PageNav active="landing" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// 08 · Loading (first BTC price fetch in flight)
// ============================================================
export function VoidStateLoading({ source = 'mempool.space' }) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return <DesktopVoidLoading source={source} />;
  }
  return (
    <PaperFrame>
      <BrandHeader
        currentPage="II"
        pageOf="IV"
        rightSlot={
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.12em',
            color: SB.inkMute, gap: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: SB.orange, fontWeight: 700 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: SB.orange,
                animation: 'sb-pulse 1.2s ease-in-out infinite',
              }} />
              FETCHING BTC
            </div>
            <div>{source} · …</div>
          </div>
        }
      />

      <style>{`
        @keyframes sb-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes sb-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .sb-skel {
          background: linear-gradient(
            90deg,
            rgba(26,22,18,0.06) 0%,
            rgba(26,22,18,0.12) 50%,
            rgba(26,22,18,0.06) 100%
          );
          background-size: 200% 100%;
          animation: sb-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      <VoidHero
        eyebrow="DRAFT · UNVERIFIED"
        title={<>Pulling live<br /><Italic>BTC price&hellip;</Italic></>}
        body={`We refuse to quote stale rates. Hold tight — we're checking ${source} and locking in this minute's spot.`}
      />

      <VoidStampBig line1="DRAFT" line2="ONLY" line3="★ NOT VERIFIED ★" color={SB.orange} />

      <DashedRule label="SKETCHING ESTIMATE" />

      {/* Skeleton rows */}
      <div style={{ padding: '0 2px' }}>
        {[180, 220, 200, 240].map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'baseline', gap: 4,
            padding: '10px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <div className="sb-skel" style={{
              height: 11, width: w, borderRadius: 1,
            }} />
            <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', color: SB.inkFaint, letterSpacing: '0.18em' }}>
              ··········································································
            </span>
            <div className="sb-skel" style={{ height: 11, width: 60 + i * 8, borderRadius: 1 }} />
          </div>
        ))}
      </div>

      <DashedRule label="THIS WON'T TAKE LONG" />

      <div style={{
        marginTop: 4, padding: '14px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 11,
          color: SB.inkSoft, lineHeight: 1.7,
          letterSpacing: '0.02em',
        }}>
          <div>$ curl {source}/api/v1/prices</div>
          <div>$ <span style={{ color: SB.forest }}>200 OK</span> — got USD, EUR, GBP, CAD…</div>
          <div>$ verifying FX cross-rates</div>
          <div>$ <span className="sb-skel" style={{ display: 'inline-block', width: 60, height: 9, verticalAlign: 'middle', borderRadius: 1 }} /> _</div>
        </div>
      </div>

      <FineFooter />
      <PageNav active="calc" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// Building blocks (local to void states)
// ============================================================

function Italic({ children }) {
  return (
    <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>
      {children}
    </span>
  );
}

function VoidHero({ eyebrow, title, body }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.22em',
        color: SB.inkMute, fontWeight: 700, marginBottom: 8,
      }}>
        {eyebrow}
      </div>
      <h1 style={{
        margin: 0,
        fontFamily: SB.serif, fontSize: 32, fontWeight: 600,
        lineHeight: 1.05, letterSpacing: '-0.025em', color: SB.ink,
      }}>
        {title}
      </h1>
      <p style={{
        margin: '12px 0 0',
        fontFamily: SB.sans, fontSize: 12.5, lineHeight: 1.55,
        color: SB.inkSoft, textWrap: 'pretty',
      }}>
        {body}
      </p>
    </div>
  );
}

function VoidStampBig({ line1, line2, line3, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      padding: '24px 0 12px',
      position: 'relative',
    }}>
      <Stamp line1={line1} line2={line2} line3={line3} size={130} color={color} rotate={-6} />
    </div>
  );
}

function BulletList({ items }) {
  const numerals = ['I.', 'II.', 'III.', 'IV.'];
  return (
    <div>
      {items.map(([t, sub], i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr auto',
          alignItems: 'baseline',
          gap: 8,
          padding: '10px 0',
          borderBottom: `1px dotted ${SB.inkLine}`,
        }}>
          <span style={{
            fontFamily: SB.serif, fontStyle: 'italic',
            fontSize: 14, color: SB.orange, fontWeight: 500,
          }}>
            {numerals[i] || `${i + 1}.`}
          </span>
          <span style={{ fontFamily: SB.sans, fontSize: 12.5, fontWeight: 500, color: SB.ink }}>
            {t}
          </span>
          <span style={{
            fontFamily: SB.mono, fontSize: 9,
            color: SB.inkMute, letterSpacing: '0.04em',
            textAlign: 'right',
          }}>
            {sub}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// DESKTOP VOID STATES — open-spread variants for >=1024px.
// Left page = the failure (eyebrow, headline, body, giant stamp).
// Right page = useful recovery (numbers, next steps, CTA).
// ============================================================

function DVoidHero({ eyebrow, title, body }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700, marginBottom: 12,
      }}>
        {eyebrow}
      </div>
      <h1 style={{
        margin: 0,
        fontFamily: SB.serif, fontSize: 60, fontWeight: 600,
        lineHeight: 1.02, letterSpacing: '-0.03em', color: SB.ink,
      }}>
        {title}
      </h1>
      <p style={{
        margin: '20px 0 0',
        fontFamily: SB.sans, fontSize: 15, lineHeight: 1.55,
        color: SB.inkSoft, textWrap: 'pretty', maxWidth: 460,
      }}>
        {body}
      </p>
    </div>
  );
}

function DVoidStampBig({ line1, line2, line3, color, rotate = -6 }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      padding: '40px 0 16px',
    }}>
      <Stamp line1={line1} line2={line2} line3={line3} size={180} color={color} rotate={rotate} />
    </div>
  );
}

function DesktopVoidLoanTooSmall({ amountLabel, minLabel, onReturn }) {
  const left = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        PAGE — · LEFT — VOIDED ESTIMATE
      </div>
      <DVoidHero
        eyebrow="ERR · 01"
        title={<>Loan too small.<br /><Italic>No lender will take you.</Italic></>}
        body={`The lowest minimum across the lenders we cover is ${minLabel}. Below that, the math stops being worth it — origination fees would dwarf the loan.`}
      />
      <DVoidStampBig line1="LOAN" line2="VOID" line3={`★ < ${minLabel} ★`} color={SB.rust} rotate={-7} />
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        PAGE — · RIGHT — WHAT WENT WRONG
      </div>

      <DashedRule label="THE NUMBERS" />
      <div style={{ padding: '0 2px' }}>
        <Row label="Amount requested" value={amountLabel} valueStyle={{ color: SB.rust }} />
        <Row label="Minimum across all lenders" value={minLabel} sub="Ledn · Firefish · Xapo" />
        <Row label="Origination would be" value="~$50" sub="dwarfs the principal" valueStyle={{ color: SB.rust }} />
      </div>

      <DashedRule label="WHAT NOW" />
      <BulletList items={[
        ['Increase your loan amount', `try ${minLabel} or more`],
        ['Sell a small chunk instead', 'no interest, no liquidation risk'],
        ['Wait until you need more', 'borrow once, less friction'],
      ]} />

      <div style={{ marginTop: 22 }}>
        <Button onClick={onReturn} href={onReturn ? undefined : '#calculator'}>
          {onReturn ? 'RESET AMOUNT & CONTINUE' : 'RETURN TO CALCULATOR'}
        </Button>
      </div>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left} right={right}
      active="calc" currentPage="—" pageOf="—"
      spineLabel="VOID · ERR 01 · LOAN BELOW MINIMUM"
      rightSlot={
        <div style={{
          fontFamily: SB.mono, fontSize: 11, letterSpacing: '0.14em',
          color: SB.rust, textAlign: 'right', fontWeight: 700,
        }}>
          <div>NO QUOTES</div>
          <div style={{ marginTop: 5, color: SB.inkMute, fontWeight: 500 }}>
            AMOUNT BELOW MINIMUM
          </div>
        </div>
      }
    />
  );
}

function DesktopVoidNoRegion({ regionLabel, regionCode }) {
  const left = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        PAGE — · LEFT — REGION REJECTED
      </div>
      <DVoidHero
        eyebrow="ERR · 02"
        title={<>No lenders<br /><Italic>in {regionLabel}.</Italic></>}
        body={`Bitcoin-backed lending is regulated unevenly. We don't currently have a verified lender that serves residents of your detected region (${regionCode.toUpperCase()}).`}
      />
      <DVoidStampBig line1="REGION" line2="VOID" line3={`★ ${regionCode.toUpperCase()} · 0 LENDERS ★`} color={SB.rust} rotate={-6} />
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        PAGE — · RIGHT — WHAT'S BLOCKING THIS
      </div>

      <DashedRule label="WHAT'S BLOCKING THIS" />
      <div style={{ padding: '0 2px' }}>
        <Row label="Your detected region" value={`${regionCode.toUpperCase()} · ${regionLabel}`} />
        <Row label="Lenders that serve you" value="0 of 9" valueStyle={{ color: SB.rust }} />
        <Row label="Closest available" value="Global · 3 lenders" sub="Strike · Firefish · Xapo" />
      </div>

      <div style={{
        marginTop: 18, padding: '16px 18px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.2em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 10,
        }}>WHY THIS HAPPENS</div>
        <p style={{
          margin: 0,
          fontFamily: SB.sans, fontSize: 13, lineHeight: 1.6,
          color: SB.inkSoft, textWrap: 'pretty',
        }}>
          Some jurisdictions classify BTC lending in ways that make regulated lenders
          stay out of the market until rules clarify. We'll keep an eye on it.
        </p>
      </div>

      <DashedRule label="WHAT NOW" />
      <BulletList items={[
        ['Switch currency in the calculator', 'see lenders for US / EU / CA'],
        ['Browse the global lender list',     'shows everyone regardless of region'],
        ['Read the terms',                    'philosophy & method'],
      ]} />

      <div style={{ marginTop: 22 }}>
        <Button href="#lenders">BROWSE GLOBAL LENDERS</Button>
      </div>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left} right={right}
      active="lender" currentPage="—" pageOf="—"
      spineLabel={`VOID · ERR 02 · ${regionCode.toUpperCase()} NOT SERVED`}
      rightSlot={
        <div style={{
          fontFamily: SB.mono, fontSize: 11, letterSpacing: '0.14em',
          color: SB.rust, textAlign: 'right', fontWeight: 700,
        }}>
          <div>NO QUOTES</div>
          <div style={{ marginTop: 5, color: SB.inkMute, fontWeight: 500 }}>
            REGION NOT SERVED
          </div>
        </div>
      }
    />
  );
}

function DesktopVoid404({ path }) {
  const left = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        PAGE — · LEFT — UNPRINTED
      </div>
      <DVoidHero
        eyebrow="404 · NOT IN BOOKLET"
        title={<>This page<br /><Italic>was never printed.</Italic></>}
        body="The URL you tried doesn't match anything in our four-section booklet. Maybe a typo. Maybe a stale link. Either way — let's get you back."
      />
      <DVoidStampBig line1="PAGE" line2="VOID" line3="★ HTTP · 404 ★" color={SB.ink} rotate={-6} />
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        PAGE — · RIGHT — JUMP TO
      </div>

      <div style={{
        marginTop: 4, padding: '18px 18px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
        borderStyle: 'solid solid dashed solid',
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.2em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 10,
        }}>YOU TRIED TO REACH</div>
        <div style={{
          fontFamily: SB.mono, fontSize: 15, fontWeight: 600,
          color: SB.ink, padding: '6px 0',
          borderBottom: `1px dotted ${SB.inkLine}`,
          overflowWrap: 'anywhere',
        }}>
          {path || '/—'}
        </div>
        <div style={{
          marginTop: 12,
          fontFamily: SB.sans, fontSize: 13,
          color: SB.inkSoft, lineHeight: 1.55,
          textWrap: 'pretty',
        }}>
          We've only ever published these four sections. Try one below.
        </div>
      </div>

      <DashedRule label="JUMP TO" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { no: 'I',   t: 'Overview',   sub: 'the pitch',   href: '#' },
          { no: 'II',  t: 'Calculator', sub: 'run numbers', href: '#calculator' },
          { no: 'III', t: 'Lenders',    sub: 'compare 9',   href: '#lenders' },
          { no: 'IV',  t: 'Terms',      sub: 'philosophy',  href: '#about' },
        ].map((p) => (
          <a key={p.no} href={p.href} style={{
            padding: '18px 16px',
            border: `1.5px dashed ${SB.inkLine}`,
            display: 'flex', alignItems: 'baseline', gap: 12,
            cursor: 'pointer',
            color: SB.ink, textDecoration: 'none',
          }}>
            <span style={{ fontFamily: SB.serif, fontStyle: 'italic', fontSize: 28, color: SB.orange, fontWeight: 500, lineHeight: 1 }}>
              {p.no}
            </span>
            <div>
              <div style={{ fontFamily: SB.serif, fontSize: 17, fontWeight: 600, color: SB.ink, lineHeight: 1 }}>
                {p.t}
              </div>
              <div style={{ fontFamily: SB.mono, fontSize: 10, color: SB.inkMute, marginTop: 6, letterSpacing: '0.1em' }}>
                {p.sub.toUpperCase()}
              </div>
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <Button href="#">BACK TO OVERVIEW</Button>
      </div>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left} right={right}
      active="landing" currentPage="—" pageOf="—"
      spineLabel="VOID · 404 · NOT IN BOOKLET"
      rightSlot={
        <div style={{
          fontFamily: SB.mono, fontSize: 11, letterSpacing: '0.14em',
          color: SB.rust, textAlign: 'right', fontWeight: 700,
        }}>
          <div>PAGE MISSING</div>
          <div style={{ marginTop: 5, color: SB.inkMute, fontWeight: 500 }}>
            ERR · 04
          </div>
        </div>
      }
    />
  );
}

function DesktopVoidLoading({ source }) {
  const skelRows = [220, 280, 240, 320, 200];
  const left = (
    <div>
      <style>{`
        @keyframes sb-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes sb-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .sb-skel {
          background: linear-gradient(
            90deg,
            var(--sb-inkLine) 0%,
            var(--sb-inkFaint) 50%,
            var(--sb-inkLine) 100%
          );
          background-size: 200% 100%;
          animation: sb-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        PAGE II · LEFT — SKETCHING ESTIMATE
      </div>
      <DVoidHero
        eyebrow="DRAFT · UNVERIFIED"
        title={<>Pulling live<br /><Italic>BTC price…</Italic></>}
        body={`We refuse to quote stale rates. Hold tight — we're checking ${source} and locking in this minute's spot.`}
      />
      <DVoidStampBig line1="DRAFT" line2="ONLY" line3="★ NOT VERIFIED ★" color={SB.orange} rotate={-5} />
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        PAGE II · RIGHT — SKELETONS
      </div>

      <DashedRule label="SKETCHING ESTIMATE" />
      <div style={{ padding: '0 2px' }}>
        {skelRows.map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'baseline', gap: 4,
            padding: '12px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <div className="sb-skel" style={{ height: 12, width: w, borderRadius: 1 }} />
            <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', color: SB.inkFaint, letterSpacing: '0.18em' }}>
              ··········································································
            </span>
            <div className="sb-skel" style={{ height: 12, width: 80 + i * 10, borderRadius: 1 }} />
          </div>
        ))}
      </div>

      <DashedRule label="THIS WON'T TAKE LONG" />

      <div style={{
        marginTop: 4, padding: '16px 18px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 12.5,
          color: SB.inkSoft, lineHeight: 1.75,
          letterSpacing: '0.02em',
        }}>
          <div>$ curl {source}/api/v1/prices</div>
          <div>$ <span style={{ color: SB.forest }}>200 OK</span> — got USD, EUR, GBP, CAD…</div>
          <div>$ verifying FX cross-rates</div>
          <div>$ <span className="sb-skel" style={{ display: 'inline-block', width: 80, height: 11, verticalAlign: 'middle', borderRadius: 1 }} /> _</div>
        </div>
      </div>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left} right={right}
      active="calc" currentPage="II" pageOf="IV"
      spineLabel="DRAFT · FETCHING SPOT PRICE"
      rightSlot={
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          fontFamily: SB.mono, fontSize: 11, letterSpacing: '0.14em',
          color: SB.inkMute, gap: 5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: SB.orange, fontWeight: 700 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: SB.orange,
              animation: 'sb-pulse 1.2s ease-in-out infinite',
            }} />
            FETCHING BTC
          </div>
          <div>{source} · …</div>
        </div>
      }
    />
  );
}
