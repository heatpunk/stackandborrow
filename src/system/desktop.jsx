// ============================================================
// DESKTOP SHELL — "Spread" layout (≥1024px).
//
// The booklet rendered as an OPEN BOOK: one wide paper, two columns
// of content, a soft center spine (vertical dashed gutter + fold
// shadow + three hole punches + vertical wordmark). The brand bar
// and page nav stretch across the full spread. The sun/moon stamp
// sits in the upper-right of the right page.
// ============================================================

import React from 'react';
import { SB } from './tokens.js';
import {
  PaperFrame,
  BrandHeader,
  PageNav,
  FineFooter,
  SunMoonStamp,
} from './components.jsx';
import { useT } from '../i18n/index.jsx';

export function DesktopSpreadFrame({
  left,
  right,
  active = 'landing',
  rightSlot,
  currentPage,
  pageOf,
  showSunMoon = true,
  spineLabel,
  footerSource,
  footerUpdated,
}) {
  const t = useT();
  const resolvedSpineLabel = spineLabel ?? t('common.spineLabel');
  return (
    <PaperFrame maxWidth={1320} sidePad={60} innerPad="0 56px">
      <BrandHeader
        size="desktop"
        currentPage={currentPage}
        pageOf={pageOf}
        rightSlot={rightSlot}
      />

      {/* Open-book content: two columns + spine */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 60px 1fr',
        gap: 0,
        marginTop: 8,
        position: 'relative',
      }}>
        {/* LEFT page */}
        <div style={{ padding: '0 32px 0 0', minWidth: 0 }}>
          {left}
        </div>

        {/* SPINE */}
        <div style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 0',
        }}>
          <div style={{
            position: 'absolute',
            left: '50%', top: 0, bottom: 0,
            width: 0,
            borderLeft: `1px dashed ${SB.inkLine}`,
            transform: 'translateX(-0.5px)',
          }} />
          <div style={{
            position: 'absolute',
            left: '50%', top: 0, bottom: 0,
            width: 40,
            transform: 'translateX(-50%)',
            background: `radial-gradient(ellipse at center, ${SB.spineFold} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 9, height: 9,
              borderRadius: '50%',
              background: SB.stage,
              border: `1px solid ${SB.inkLine}`,
              position: 'relative', zIndex: 1,
              marginTop: i === 0 ? 30 : 0,
              marginBottom: i === 2 ? 30 : 0,
            }} />
          ))}

          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            transformOrigin: 'center',
            fontFamily: SB.mono,
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.32em',
            color: SB.inkFaint,
            whiteSpace: 'nowrap',
            background: SB.cream, padding: '4px 10px',
            zIndex: 2,
          }}>
            {resolvedSpineLabel}
          </div>
        </div>

        {/* RIGHT page */}
        <div style={{ padding: '0 0 0 32px', minWidth: 0, position: 'relative' }}>
          {right}
          {showSunMoon && (
            <div style={{ position: 'absolute', top: -28, right: 8, zIndex: 3 }}>
              <SunMoonStamp size={86} rotate={10} />
            </div>
          )}
        </div>
      </div>

      <FineFooter source={footerSource} updated={footerUpdated} />
      <PageNav active={active} />
      <div style={{ height: 18 }} />
    </PaperFrame>
  );
}

// Numbered section heading tuned for desktop columns.
export function DSectionHead({ no, title, subtitle }) {
  return (
    <div style={{ marginTop: 26, marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12,
        paddingBottom: 8, borderBottom: `1px solid ${SB.ink}`,
      }}>
        <span style={{ fontFamily: SB.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: SB.orange }}>{no}</span>
        <span style={{ fontFamily: SB.serif, fontSize: 22, fontWeight: 600, color: SB.ink, letterSpacing: '-0.01em' }}>{title}</span>
        {subtitle && (
          <span style={{ marginLeft: 'auto', fontFamily: SB.mono, fontSize: 10, color: SB.inkMute, letterSpacing: '0.05em', fontStyle: 'italic' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
