// ============================================================
// DESIGN SYSTEM — shared receipt primitives.
// PaperFrame, BrandHeader, DashedRule, Row, Stamp, Pill, Chip,
// Button, PageNav, FineFooter, SectionHead, BitcoinLogo.
// ============================================================

import React from 'react';
import { SB } from './tokens.js';

// ------------------------------------------------------------
// BitcoinLogo — public-domain Wikipedia mark.
// ------------------------------------------------------------
export function BitcoinLogo({ size = 32, color = SB.orange }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ flexShrink: 0, display: 'block' }}>
      <circle cx="32" cy="32" r="32" fill={color} />
      <path fill={SB.cream} d="M46.103 27.444c.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-.875-1.4 5.616c-.923-.23-1.871-.447-2.813-.662l1.41-5.653-3.51-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.679 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117-.117-.029-.242-.061-.371-.092l-2.296 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.019 4.569 1.139c.85.213 1.683.436 2.502.646l-1.453 5.835 3.508.875 1.439-5.772c.958.26 1.888.5 2.798.726l-1.434 5.745 3.511.875 1.453-5.823c5.987 1.133 10.489.676 12.384-4.739 1.527-4.36-.076-6.875-3.226-8.515 2.294-.529 4.022-2.038 4.483-5.155zm-8.022 11.249c-1.085 4.36-8.426 2.003-10.806 1.412l1.928-7.729c2.38.594 10.012 1.77 8.878 6.317zm1.086-11.312c-.99 3.966-7.1 1.951-9.082 1.457l1.748-7.01c1.982.494 8.365 1.416 7.334 5.553z" />
    </svg>
  );
}

// ------------------------------------------------------------
// PaperFrame — the cream "page" with perforated top/bottom edges,
// subtle horizontal grain, drop shadow against the stage.
// Wraps every routable page.
// ------------------------------------------------------------
export function PaperFrame({ children }) {
  return (
    <div style={paperStyles.stage}>
      <div style={paperStyles.slot} />
      <div style={paperStyles.paper}>
        <Perf side="top" />
        <div style={{ padding: '0 22px' }}>{children}</div>
        <Perf side="bottom" />
      </div>
      <div style={{ height: 10 }} />
    </div>
  );
}

function Perf({ side }) {
  const isTop = side === 'top';
  return (
    <div style={{
      height: 12,
      margin: '0 -22px',
      background: `
        radial-gradient(circle at 7px ${isTop ? '12px' : '0px'}, ${SB.stage} 5px, transparent 5.5px) repeat-x,
        ${SB.cream}
      `,
      backgroundSize: '14px 12px',
    }} />
  );
}

const paperStyles = {
  stage: {
    minHeight: '100vh',
    background: SB.stage,
    padding: '0 12px',
    position: 'relative',
  },
  slot: {
    height: 10,
    margin: '0 -12px',
    background: SB.stage,
    boxShadow: 'inset 0 -6px 10px rgba(0,0,0,0.55)',
  },
  paper: {
    maxWidth: 440,
    margin: '0 auto',
    background: SB.cream,
    color: SB.ink,
    position: 'relative',
    boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 4px 18px rgba(0,0,0,0.35)',
    backgroundImage: `repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 3px,
      rgba(0,0,0,0.012) 3px,
      rgba(0,0,0,0.012) 4px
    )`,
  },
};

// ------------------------------------------------------------
// BrandHeader — appears on every page. Logo + wordmark; optional
// right slot for live BTC price, currency picker, etc.
// ------------------------------------------------------------
export function BrandHeader({ rightSlot = null, currentPage = null, pageOf = null }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '18px 0 12px',
        borderBottom: `1.5px solid ${SB.ink}`,
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'inherit', textDecoration: 'none', flex: 1, minWidth: 0 }}>
          <BitcoinLogo size={32} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: SB.serif,
              fontSize: 22, fontWeight: 600,
              letterSpacing: '-0.005em',
              lineHeight: 1, color: SB.ink,
            }}>
              Stack &amp; Borrow
            </div>
            <div style={{
              fontFamily: SB.mono,
              fontSize: 8.5, letterSpacing: '0.2em',
              color: SB.inkMute,
              marginTop: 5, fontWeight: 600,
            }}>
              BITCOIN-BACKED LOAN · BOOKLET
            </div>
          </div>
        </a>
        {rightSlot}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: SB.mono,
        fontSize: 9, letterSpacing: '0.18em',
        color: SB.inkMute,
        padding: '8px 0 12px',
        fontWeight: 500,
      }}>
        <span>EST · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase()}</span>
        {currentPage && pageOf ? (
          <span>{currentPage} OF {pageOf}</span>
        ) : (
          <span>NO. 000.50K</span>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// DashedRule — section divider, optionally labelled.
// ------------------------------------------------------------
export function DashedRule({ label, dotted = false, color = SB.inkLine }) {
  const borderStyle = dotted ? 'dotted' : 'dashed';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      margin: '18px 0 12px',
    }}>
      <div style={{ flex: 1, borderTop: `1px ${borderStyle} ${color}` }} />
      {label && (
        <span style={{
          fontFamily: SB.mono,
          fontSize: 8.5, letterSpacing: '0.22em',
          color: SB.inkSoft, fontWeight: 700,
        }}>
          {label}
        </span>
      )}
      <div style={{ flex: 1, borderTop: `1px ${borderStyle} ${color}` }} />
    </div>
  );
}

// ------------------------------------------------------------
// SectionHead — numbered (§ I, § II…) section heading with serif title.
// ------------------------------------------------------------
export function SectionHead({ no, title, subtitle }) {
  return (
    <div style={{ marginTop: 22, marginBottom: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10,
        paddingBottom: 6, borderBottom: `1px solid ${SB.ink}`,
      }}>
        <span style={{ fontFamily: SB.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: SB.orange }}>{no}</span>
        <span style={{ fontFamily: SB.serif, fontSize: 18, fontWeight: 600, color: SB.ink, letterSpacing: '-0.01em' }}>{title}</span>
        {subtitle && (
          <span style={{ marginLeft: 'auto', fontFamily: SB.mono, fontSize: 9, color: SB.inkMute, letterSpacing: '0.05em', fontStyle: 'italic' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Row — itemized line with dotted leader. Used in receipts, terms,
// lender lists. The dots fill the space between label and value.
// ------------------------------------------------------------
export function Row({ label, value, sub, valueStyle = {}, labelStyle = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      padding: '6px 0',
    }}>
      <div style={{
        flex: 1, minWidth: 0,
        fontSize: 11.5,
        color: SB.inkSoft,
        display: 'flex', alignItems: 'baseline', gap: 4,
        overflow: 'hidden',
        ...labelStyle,
      }}>
        <span>{label}</span>
        <span style={{
          flex: 1, overflow: 'hidden', whiteSpace: 'nowrap',
          color: SB.inkFaint, letterSpacing: '0.08em',
        }}>
          ................................................................................
        </span>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: SB.mono,
          fontSize: 12, fontWeight: 600,
          color: SB.ink,
          ...valueStyle,
        }}>{value}</div>
        {sub && (
          <div style={{
            fontFamily: SB.mono,
            fontSize: 9,
            color: SB.inkMute,
            marginTop: 1, letterSpacing: '0.02em',
          }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Stamp — circular faux-rubber stamp. Decorative.
// ------------------------------------------------------------
export function Stamp({ line1, line2, line3 = '★ EST 2026 ★', color = SB.orange, rotate = -12, size = 88 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      border: `2.5px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: 0.78,
      transform: `rotate(${rotate}deg)`,
      pointerEvents: 'none',
    }}>
      <div style={{
        width: size - 12, height: size - 12,
        borderRadius: '50%',
        border: `1px dashed ${color}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color,
        fontFamily: SB.serif,
        fontWeight: 700,
        textAlign: 'center',
        lineHeight: 1,
      }}>
        <span style={{ fontSize: size * 0.18, letterSpacing: '0.08em' }}>{line1}</span>
        <span style={{ fontSize: size * 0.18, letterSpacing: '0.08em', marginTop: 2 }}>{line2}</span>
        {line3 && (
          <span style={{
            fontFamily: SB.mono,
            fontSize: size * 0.08, letterSpacing: '0.16em',
            marginTop: 5, fontWeight: 600,
          }}>{line3}</span>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Pill — outlined mini-tag for badges and flags.
// ------------------------------------------------------------
export function Pill({ children, color = SB.ink, filled = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 6px',
      fontFamily: SB.mono,
      fontSize: 8.5, fontWeight: 700,
      letterSpacing: '0.14em',
      color: filled ? SB.cream : color,
      background: filled ? color : 'transparent',
      border: `1px solid ${color}`,
    }}>{children}</span>
  );
}

// ------------------------------------------------------------
// Chip — selectable mono tab. For filter rows, currency tabs.
// ------------------------------------------------------------
export function Chip({ children, active = false, color = SB.ink, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? color : 'transparent',
        color: active ? SB.cream : SB.ink,
        border: `1.5px solid ${active ? color : SB.ink}`,
        padding: '5px 10px',
        fontFamily: SB.mono,
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.1em',
        cursor: 'pointer',
      }}
    >{children}</button>
  );
}

// ------------------------------------------------------------
// Button — primary CTA. Dashed outline + filled body.
// ------------------------------------------------------------
export function Button({ children, onClick, href, color = SB.ink, fill = true, full = true }) {
  const baseStyle = {
    width: full ? '100%' : 'auto',
    padding: '15px 18px',
    border: `2px dashed ${color}`,
    background: fill ? (color === SB.ink ? SB.inkFill : color) : 'transparent',
    color: fill ? SB.cream : color,
    fontFamily: SB.mono,
    fontSize: 12, fontWeight: 700,
    letterSpacing: '0.16em',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    textTransform: 'uppercase',
    textDecoration: 'none',
    boxSizing: 'border-box',
  };
  const inside = (
    <>
      <span style={{ color: SB.orange, fontSize: 14 }}>▸</span>
      <span>{children}</span>
      <span style={{ color: SB.orange, fontSize: 14 }}>▸</span>
    </>
  );
  if (href) {
    return <a href={href} onClick={onClick} style={baseStyle}>{inside}</a>;
  }
  return <button onClick={onClick} style={baseStyle}>{inside}</button>;
}

// ------------------------------------------------------------
// PageNav — bottom navigation (page numbers as tabs).
// Four sections in the booklet: Overview (landing), Calculator,
// Lenders, Terms.
// ------------------------------------------------------------
export function PageNav({ active = 'landing' }) {
  const pages = [
    { id: 'landing', label: 'OVERVIEW',   no: 'I',   href: '#' },
    { id: 'calc',    label: 'CALCULATOR', no: 'II',  href: '#calculator' },
    { id: 'lender',  label: 'LENDERS',    no: 'III', href: '#lenders' },
    { id: 'about',   label: 'TERMS',      no: 'IV',  href: '#about' },
  ];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      borderTop: `1.5px solid ${SB.ink}`,
      borderBottom: `1px solid ${SB.inkLine}`,
      marginTop: 14,
    }}>
      {pages.map((p, i) => {
        const isActive = p.id === active;
        return (
          <a
            key={p.id}
            href={p.href}
            style={{
              padding: '12px 4px 10px',
              textAlign: 'center',
              borderRight: i < 3 ? `1px dashed ${SB.inkLine}` : 'none',
              background: isActive ? SB.inkFill : 'transparent',
              color: isActive ? SB.cream : SB.ink,
              textDecoration: 'none',
              display: 'block',
            }}>
            <div style={{
              fontFamily: SB.serif,
              fontStyle: 'italic',
              fontSize: 14, fontWeight: 500,
              lineHeight: 1,
              color: isActive ? SB.orange : SB.inkFaint,
            }}>{p.no}</div>
            <div style={{
              fontFamily: SB.mono,
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.16em',
              marginTop: 4,
            }}>{p.label}</div>
          </a>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// FineFooter — the ※ disclaimer lines.
// ------------------------------------------------------------
export function FineFooter({ source = 'mempool.space', updated = null }) {
  return (
    <div style={{
      marginTop: 18,
      fontFamily: SB.mono,
      fontSize: 8.5,
      color: SB.inkMute,
      lineHeight: 1.7,
      letterSpacing: '0.02em',
    }}>
      ※ Live BTC: {source} · ranked by total cost, not commission.<br />
      ※ Not financial advice. No data leaves your browser.<br />
      ※ stackandborrow.com · <a href="mailto:feedback@stackandborrow.com" style={{ color: SB.inkSoft, textDecoration: 'underline' }}>feedback@stackandborrow.com</a>
      {updated && <><br />※ Lender data verified {updated}.</>}
    </div>
  );
}

// ------------------------------------------------------------
// LivePriceBadge — small "BTC · $X" indicator used in the header.
// ------------------------------------------------------------
export function LivePriceBadge({ btcUsd, loading, error, onRefresh }) {
  const dotColor = loading ? SB.orange : error ? SB.rust : SB.forest;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      fontFamily: SB.mono,
      fontSize: 9, letterSpacing: '0.12em',
      color: SB.inkMute,
      gap: 4,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        color: SB.ink, fontWeight: 700,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: dotColor,
        }} />
        BTC · ${btcUsd ? Math.round(btcUsd).toLocaleString('en-US') : '—'}
      </div>
      <button onClick={onRefresh} style={{
        background: 'transparent', border: 'none', padding: 0,
        color: SB.inkMute, fontFamily: SB.mono, fontSize: 9,
        letterSpacing: '0.12em', cursor: 'pointer',
      }}>
        {error ? 'RETRY ↻' : loading ? 'FETCHING…' : 'REFRESH ↻'}
      </button>
    </div>
  );
}

// ------------------------------------------------------------
// Inject slider thumb styles once. (Range inputs can't be styled
// fully via inline styles — pseudos require a stylesheet.)
// ------------------------------------------------------------
let sliderCssInjected = false;
export function ensureSliderCss() {
  if (sliderCssInjected || typeof document === 'undefined') return;
  if (document.getElementById('sb-slider-css')) { sliderCssInjected = true; return; }
  const s = document.createElement('style');
  s.id = 'sb-slider-css';
  s.textContent = `
    .sb-slider {
      -webkit-appearance: none; appearance: none;
      width: 100%; height: 24px;
      background: transparent;
      cursor: pointer; outline: none;
    }
    .sb-slider::-webkit-slider-runnable-track {
      height: 4px; background: ${SB.inkLine}; border: none;
    }
    .sb-slider::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: ${SB.cream};
      border: 2px solid ${SB.orange};
      box-shadow: 0 0 0 2px ${SB.cream}, 0 1px 4px rgba(0,0,0,0.15);
      margin-top: -6px; cursor: pointer;
    }
    .sb-slider::-moz-range-track {
      height: 4px; background: ${SB.inkLine}; border: none;
    }
    .sb-slider::-moz-range-thumb {
      width: 16px; height: 16px;
      border-radius: 50%;
      background: ${SB.cream};
      border: 2px solid ${SB.orange};
      box-shadow: 0 0 0 2px ${SB.cream}, 0 1px 4px rgba(0,0,0,0.15);
      cursor: pointer;
    }
  `;
  document.head.appendChild(s);
  sliderCssInjected = true;
}
