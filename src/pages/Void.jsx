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
import { useT } from '../i18n/index.jsx';

// ============================================================
// 01 · Loan too small
// ============================================================
export function VoidStateLoanTooSmall({ amountLabel = '—', minLabel = '$1,000', onReturn }) {
  const isDesktop = useIsDesktop();
  const t = useT();
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
            <div>{t('void.common.noQuotes')}</div>
            <div style={{ marginTop: 4, color: SB.inkMute, fontWeight: 500 }}>
              {t('void.common.amountBelowMin')}
            </div>
          </div>
        }
      />

      <VoidHero
        eyebrow={t('void.loanTooSmall.err')}
        title={<>{t('void.loanTooSmall.titleLine1')}<br /><Italic>{t('void.loanTooSmall.titleLine2')}</Italic></>}
        body={t('void.loanTooSmall.body', { min: minLabel })}
      />

      <VoidStampBig
        line1={t('void.loanTooSmall.stamp1')}
        line2={t('void.loanTooSmall.stamp2')}
        line3={t('void.loanTooSmall.stamp3', { min: minLabel })}
        color={SB.rust}
      />

      <DashedRule label={t('void.loanTooSmall.section.numbers')} />

      <div style={{ padding: '0 2px' }}>
        <Row label={t('void.loanTooSmall.row.requested')} value={amountLabel} valueStyle={{ color: SB.rust }} />
        <Row label={t('void.loanTooSmall.row.minimum')} value={minLabel} sub={t('void.loanTooSmall.row.minimumSub')} />
        <Row label={t('void.loanTooSmall.row.origination')} value={t('void.loanTooSmall.row.originationValue')} sub={t('void.loanTooSmall.row.originationSub')} valueStyle={{ color: SB.rust }} />
      </div>

      <DashedRule label={t('void.loanTooSmall.section.whatNow')} />

      <BulletList items={[
        [t('void.loanTooSmall.option1.title'), t('void.loanTooSmall.option1.sub', { min: minLabel })],
        [t('void.loanTooSmall.option2.title'), t('void.loanTooSmall.option2.sub')],
        [t('void.loanTooSmall.option3.title'), t('void.loanTooSmall.option3.sub')],
      ]} />

      <div style={{ marginTop: 16 }}>
        <Button onClick={onReturn} href={onReturn ? undefined : '#calculator'}>
          {onReturn ? t('void.loanTooSmall.cta.reset') : t('void.loanTooSmall.cta.return')}
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
  const t = useT();
  if (isDesktop) {
    return <DesktopVoidNoRegion regionLabel={regionLabel} regionCode={regionCode} />;
  }
  const code = regionCode.toUpperCase();
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
            <div>{t('void.common.noQuotes')}</div>
            <div style={{ marginTop: 4, color: SB.inkMute, fontWeight: 500 }}>
              {t('void.common.regionNotServed')}
            </div>
          </div>
        }
      />

      <VoidHero
        eyebrow={t('void.noRegion.err')}
        title={<>{t('void.noRegion.titleLine1')}<br /><Italic>{t('void.noRegion.titleLine2', { region: regionLabel })}</Italic></>}
        body={t('void.noRegion.body', { code })}
      />

      <VoidStampBig
        line1={t('void.noRegion.stamp1')}
        line2={t('void.noRegion.stamp2')}
        line3={t('void.noRegion.stamp3', { code })}
        color={SB.rust}
      />

      <DashedRule label={t('void.noRegion.section.blocking')} />

      <div style={{ padding: '0 2px' }}>
        <Row label={t('void.noRegion.row.detected')} value={t('void.noRegion.row.detectedValue', { code, region: regionLabel })} />
        <Row label={t('void.noRegion.row.servers')} value={t('void.noRegion.row.serversValue')} valueStyle={{ color: SB.rust }} />
        <Row label={t('void.noRegion.row.closest')} value={t('void.noRegion.row.closestValue')} sub={t('void.noRegion.row.closestSub')} />
      </div>

      <div style={{
        marginTop: 14, padding: '14px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.2em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 8,
        }}>{t('void.noRegion.whyHeading')}</div>
        <p style={{
          margin: 0,
          fontFamily: SB.sans, fontSize: 12, lineHeight: 1.55,
          color: SB.inkSoft, textWrap: 'pretty',
        }}>
          {t('void.noRegion.whyBody')}
        </p>
      </div>

      <DashedRule label={t('void.noRegion.section.whatNow')} />

      <BulletList items={[
        [t('void.noRegion.option1.title'), t('void.noRegion.option1.sub')],
        [t('void.noRegion.option2.title'), t('void.noRegion.option2.sub')],
        [t('void.noRegion.option3.title'), t('void.noRegion.option3.sub')],
      ]} />

      <div style={{ marginTop: 16 }}>
        <Button href="/lenders">{t('void.noRegion.cta')}</Button>
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
  const t = useT();
  const path = attemptedPath || (typeof window !== 'undefined' ? window.location.pathname : '');
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
            <div>{t('void.common.pageMissing')}</div>
            <div style={{ marginTop: 4, color: SB.inkMute, fontWeight: 500 }}>
              {t('void.notFound.err')}
            </div>
          </div>
        }
      />

      <VoidHero
        eyebrow={t('void.notFound.eyebrow')}
        title={<>{t('void.notFound.titleLine1')}<br /><Italic>{t('void.notFound.titleLine2')}</Italic></>}
        body={t('void.notFound.body')}
      />

      <VoidStampBig
        line1={t('void.notFound.stamp1')}
        line2={t('void.notFound.stamp2')}
        line3={t('void.notFound.stamp3')}
        color={SB.ink}
      />

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
        }}>{t('void.notFound.youTried')}</div>
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
          {t('void.notFound.published')}
        </div>
      </div>

      <DashedRule label={t('void.notFound.section.jumpTo')} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { no: 'I',   tKey: 'overview',   href: '#' },
          { no: 'II',  tKey: 'calculator', href: '#calculator' },
          { no: 'III', tKey: 'lenders',    href: '#lenders' },
          { no: 'IV',  tKey: 'terms',      href: '#about' },
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
                {t(`void.notFound.option.${p.tKey}`)}
              </div>
              <div style={{ fontFamily: SB.mono, fontSize: 9, color: SB.inkMute, marginTop: 4, letterSpacing: '0.08em' }}>
                {t(`void.notFound.option.${p.tKey}Sub`).toUpperCase()}
              </div>
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Button href="/">{t('void.notFound.cta')}</Button>
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
  const t = useT();
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
              {t('void.loading.fetchingBtc')}
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
        eyebrow={t('void.loading.eyebrow')}
        title={<>{t('void.loading.titleLine1')}<br /><Italic>{t('void.loading.titleLine2')}</Italic></>}
        body={t('void.loading.body', { source })}
      />

      <VoidStampBig
        line1={t('void.loading.stamp1')}
        line2={t('void.loading.stamp2')}
        line3={t('void.loading.stamp3')}
        color={SB.orange}
      />

      <DashedRule label={t('void.loading.section.sketching')} />

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
            <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', color: SB.inkFaint, letterSpacing: '0.08em' }}>
              ................................................................................
            </span>
            <div className="sb-skel" style={{ height: 11, width: 60 + i * 8, borderRadius: 1 }} />
          </div>
        ))}
      </div>

      <DashedRule label={t('void.loading.section.wontTakeLong')} />

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
      {items.map(([title, sub], i) => (
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
            {title}
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
  const t = useT();
  const left = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('void.loanTooSmall.desktopLeftLabel')}
      </div>
      <DVoidHero
        eyebrow={t('void.loanTooSmall.err')}
        title={<>{t('void.loanTooSmall.titleLine1')}<br /><Italic>{t('void.loanTooSmall.titleLine2')}</Italic></>}
        body={t('void.loanTooSmall.body', { min: minLabel })}
      />
      <DVoidStampBig
        line1={t('void.loanTooSmall.stamp1')}
        line2={t('void.loanTooSmall.stamp2')}
        line3={t('void.loanTooSmall.stamp3', { min: minLabel })}
        color={SB.rust}
        rotate={-7}
      />
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('void.loanTooSmall.desktopRightLabel')}
      </div>

      <DashedRule label={t('void.loanTooSmall.section.numbers')} />
      <div style={{ padding: '0 2px' }}>
        <Row label={t('void.loanTooSmall.row.requested')} value={amountLabel} valueStyle={{ color: SB.rust }} />
        <Row label={t('void.loanTooSmall.row.minimum')} value={minLabel} sub={t('void.loanTooSmall.row.minimumSub')} />
        <Row label={t('void.loanTooSmall.row.origination')} value={t('void.loanTooSmall.row.originationValue')} sub={t('void.loanTooSmall.row.originationSub')} valueStyle={{ color: SB.rust }} />
      </div>

      <DashedRule label={t('void.loanTooSmall.section.whatNow')} />
      <BulletList items={[
        [t('void.loanTooSmall.option1.title'), t('void.loanTooSmall.option1.sub', { min: minLabel })],
        [t('void.loanTooSmall.option2.title'), t('void.loanTooSmall.option2.sub')],
        [t('void.loanTooSmall.option3.title'), t('void.loanTooSmall.option3.sub')],
      ]} />

      <div style={{ marginTop: 22 }}>
        <Button onClick={onReturn} href={onReturn ? undefined : '#calculator'}>
          {onReturn ? t('void.loanTooSmall.cta.reset') : t('void.loanTooSmall.cta.return')}
        </Button>
      </div>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left} right={right}
      active="calc" currentPage="—" pageOf="—"
      spineLabel={t('void.loanTooSmall.spine')}
      rightSlot={
        <div style={{
          fontFamily: SB.mono, fontSize: 11, letterSpacing: '0.14em',
          color: SB.rust, textAlign: 'right', fontWeight: 700,
        }}>
          <div>{t('void.common.noQuotes')}</div>
          <div style={{ marginTop: 5, color: SB.inkMute, fontWeight: 500 }}>
            {t('void.common.amountBelowMin')}
          </div>
        </div>
      }
    />
  );
}

function DesktopVoidNoRegion({ regionLabel, regionCode }) {
  const t = useT();
  const code = regionCode.toUpperCase();
  const left = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('void.noRegion.desktopLeftLabel')}
      </div>
      <DVoidHero
        eyebrow={t('void.noRegion.err')}
        title={<>{t('void.noRegion.titleLine1')}<br /><Italic>{t('void.noRegion.titleLine2', { region: regionLabel })}</Italic></>}
        body={t('void.noRegion.body', { code })}
      />
      <DVoidStampBig
        line1={t('void.noRegion.stamp1')}
        line2={t('void.noRegion.stamp2')}
        line3={t('void.noRegion.stamp3', { code })}
        color={SB.rust}
        rotate={-6}
      />
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('void.noRegion.desktopRightLabel')}
      </div>

      <DashedRule label={t('void.noRegion.section.blocking')} />
      <div style={{ padding: '0 2px' }}>
        <Row label={t('void.noRegion.row.detected')} value={t('void.noRegion.row.detectedValue', { code, region: regionLabel })} />
        <Row label={t('void.noRegion.row.servers')} value={t('void.noRegion.row.serversValue')} valueStyle={{ color: SB.rust }} />
        <Row label={t('void.noRegion.row.closest')} value={t('void.noRegion.row.closestValue')} sub={t('void.noRegion.row.closestSub')} />
      </div>

      <div style={{
        marginTop: 18, padding: '16px 18px',
        background: SB.creamWarm,
        border: `1px solid ${SB.inkLine}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.2em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 10,
        }}>{t('void.noRegion.whyHeading')}</div>
        <p style={{
          margin: 0,
          fontFamily: SB.sans, fontSize: 13, lineHeight: 1.6,
          color: SB.inkSoft, textWrap: 'pretty',
        }}>
          {t('void.noRegion.whyBody')}
        </p>
      </div>

      <DashedRule label={t('void.noRegion.section.whatNow')} />
      <BulletList items={[
        [t('void.noRegion.option1.title'), t('void.noRegion.option1.sub')],
        [t('void.noRegion.option2.title'), t('void.noRegion.option2.sub')],
        [t('void.noRegion.option3.title'), t('void.noRegion.option3.sub')],
      ]} />

      <div style={{ marginTop: 22 }}>
        <Button href="/lenders">{t('void.noRegion.cta')}</Button>
      </div>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left} right={right}
      active="lender" currentPage="—" pageOf="—"
      spineLabel={t('void.noRegion.spine', { code })}
      rightSlot={
        <div style={{
          fontFamily: SB.mono, fontSize: 11, letterSpacing: '0.14em',
          color: SB.rust, textAlign: 'right', fontWeight: 700,
        }}>
          <div>{t('void.common.noQuotes')}</div>
          <div style={{ marginTop: 5, color: SB.inkMute, fontWeight: 500 }}>
            {t('void.common.regionNotServed')}
          </div>
        </div>
      }
    />
  );
}

function DesktopVoid404({ path }) {
  const t = useT();
  const left = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('void.notFound.desktopLeftLabel')}
      </div>
      <DVoidHero
        eyebrow={t('void.notFound.eyebrow')}
        title={<>{t('void.notFound.titleLine1')}<br /><Italic>{t('void.notFound.titleLine2')}</Italic></>}
        body={t('void.notFound.body')}
      />
      <DVoidStampBig
        line1={t('void.notFound.stamp1')}
        line2={t('void.notFound.stamp2')}
        line3={t('void.notFound.stamp3')}
        color={SB.ink}
        rotate={-6}
      />
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('void.notFound.desktopRightLabel')}
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
        }}>{t('void.notFound.youTried')}</div>
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
          {t('void.notFound.published')}
        </div>
      </div>

      <DashedRule label={t('void.notFound.section.jumpTo')} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { no: 'I',   tKey: 'overview',   href: '#' },
          { no: 'II',  tKey: 'calculator', href: '#calculator' },
          { no: 'III', tKey: 'lenders',    href: '#lenders' },
          { no: 'IV',  tKey: 'terms',      href: '#about' },
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
                {t(`void.notFound.option.${p.tKey}`)}
              </div>
              <div style={{ fontFamily: SB.mono, fontSize: 10, color: SB.inkMute, marginTop: 6, letterSpacing: '0.1em' }}>
                {t(`void.notFound.option.${p.tKey}Sub`).toUpperCase()}
              </div>
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <Button href="/">{t('void.notFound.cta')}</Button>
      </div>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left} right={right}
      active="landing" currentPage="—" pageOf="—"
      spineLabel={t('void.notFound.spine')}
      rightSlot={
        <div style={{
          fontFamily: SB.mono, fontSize: 11, letterSpacing: '0.14em',
          color: SB.rust, textAlign: 'right', fontWeight: 700,
        }}>
          <div>{t('void.common.pageMissing')}</div>
          <div style={{ marginTop: 5, color: SB.inkMute, fontWeight: 500 }}>
            {t('void.notFound.err')}
          </div>
        </div>
      }
    />
  );
}

function DesktopVoidLoading({ source }) {
  const t = useT();
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
        {t('void.loading.desktopLeftLabel')}
      </div>
      <DVoidHero
        eyebrow={t('void.loading.eyebrow')}
        title={<>{t('void.loading.titleLine1')}<br /><Italic>{t('void.loading.titleLine2')}</Italic></>}
        body={t('void.loading.body', { source })}
      />
      <DVoidStampBig
        line1={t('void.loading.stamp1')}
        line2={t('void.loading.stamp2')}
        line3={t('void.loading.stamp3')}
        color={SB.orange}
        rotate={-5}
      />
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('void.loading.desktopRightLabel')}
      </div>

      <DashedRule label={t('void.loading.section.sketching')} />
      <div style={{ padding: '0 2px' }}>
        {skelRows.map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'baseline', gap: 4,
            padding: '12px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <div className="sb-skel" style={{ height: 12, width: w, borderRadius: 1 }} />
            <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', color: SB.inkFaint, letterSpacing: '0.08em' }}>
              ................................................................................
            </span>
            <div className="sb-skel" style={{ height: 12, width: 80 + i * 10, borderRadius: 1 }} />
          </div>
        ))}
      </div>

      <DashedRule label={t('void.loading.section.wontTakeLong')} />

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
      spineLabel={t('void.loading.spine')}
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
            {t('void.loading.fetchingBtc')}
          </div>
          <div>{source} · …</div>
        </div>
      }
    />
  );
}
