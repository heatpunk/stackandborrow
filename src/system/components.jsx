// ============================================================
// DESIGN SYSTEM — shared receipt primitives.
// PaperFrame, BrandHeader, DashedRule, Row, Stamp, Pill, Chip,
// Button, PageNav, FineFooter, SectionHead, BitcoinLogo.
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { SB } from './tokens.js';
import { useTheme, useIsDesktop } from './theme.jsx';
import { useT, useLanguage, LANGUAGE_SWITCH_LABELS } from '../i18n/index.jsx';

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
// Wraps every routable page. All visual values resolve to CSS
// variables so dark themes (carbon / midnight) flip automatically.
// ------------------------------------------------------------
export function PaperFrame({ children, maxWidth = 440, sidePad = 12, innerPad = '0 22px' }) {
  return (
    <div style={{ ...paperStyles.stage, padding: `0 ${sidePad}px` }}>
      <div style={paperStyles.slot} />
      <div style={{ ...paperStyles.paper, maxWidth }}>
        <Perf side="top" />
        <div style={{ padding: innerPad }}>{children}</div>
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
      background: `
        radial-gradient(circle at 7px ${isTop ? '0px' : '12px'}, ${SB.stage} 5px, transparent 5.5px) repeat-x,
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
    position: 'relative',
  },
  slot: {
    height: 10,
    margin: '0 -12px',
    background: SB.stage,
    boxShadow: 'inset 0 -6px 10px rgba(0,0,0,0.55)',
  },
  paper: {
    margin: '0 auto',
    background: SB.cream,
    color: SB.ink,
    position: 'relative',
    boxShadow: SB.paperShadow,
    backgroundImage: `repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 3px,
      ${SB.grain} 3px,
      ${SB.grain} 4px
    )`,
  },
};

// ------------------------------------------------------------
// BrandHeader — appears on every page. Logo + wordmark; optional
// right slot for live BTC price, currency picker, etc. `size="desktop"`
// scales for the open-spread layout.
// ------------------------------------------------------------
export function BrandHeader({ rightSlot = null, currentPage = null, pageOf = null, size = 'mobile' }) {
  const t = useT();
  const { lang } = useLanguage();
  const big = size === 'desktop';
  // Locale-format the establishment date in the active language;
  // fall back to en-US if Intl doesn't recognize the tag.
  const dateStr = new Date()
    .toLocaleDateString(lang || 'en-US', { year: 'numeric', month: 'short', day: '2-digit' })
    .toUpperCase();
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: big ? 16 : 12,
        padding: big ? '24px 0 16px' : '18px 0 12px',
        borderBottom: `1.5px solid ${SB.ink}`,
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: big ? 16 : 12, color: 'inherit', textDecoration: 'none', flex: 1, minWidth: 0 }}>
          <BitcoinLogo size={big ? 42 : 32} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: SB.serif,
              fontSize: big ? 30 : 22, fontWeight: 600,
              letterSpacing: '-0.005em',
              lineHeight: 1, color: SB.ink,
            }}>
              {t('common.brand.name')}
            </div>
            <div style={{
              fontFamily: SB.mono,
              fontSize: big ? 10 : 8.5, letterSpacing: '0.2em',
              color: SB.inkMute,
              marginTop: big ? 6 : 5, fontWeight: 600,
            }}>
              {t('common.brand.tagline')}
            </div>
          </div>
        </a>
        {rightSlot}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: SB.mono,
        fontSize: big ? 10 : 9, letterSpacing: '0.18em',
        color: SB.inkMute,
        padding: big ? '10px 0 14px' : '8px 0 12px',
        fontWeight: 500,
      }}>
        <span>{t('common.header.est', { date: dateStr })}</span>
        {currentPage && pageOf ? (
          <span>{t('common.header.pageOf', { current: currentPage, of: pageOf })}</span>
        ) : (
          <span>{t('common.header.issueNumber')}</span>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// SunMoonStamp — corner toggle for light <-> dark. Cmd-click /
// right-click resets to "Match system" (preference = 'auto').
// ------------------------------------------------------------
export function SunMoonStamp({ size = 76, rotate = 8, style = {} }) {
  const t = useT();
  const { theme, toggle, setPreference, preference } = useTheme();
  const isDark = theme !== 'light';
  const onClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) {
      setPreference('auto');
      return;
    }
    toggle();
  };
  const onContextMenu = (e) => { e.preventDefault(); setPreference('auto'); };

  // Read CSS vars at render so the stamp's stroke matches the active theme.
  const fg = isDark ? SB.orange : SB.ink;
  const ringId = `sb-sm-ring-${size}`;

  const title = preference === 'auto'
    ? t('common.theme.titleAuto', { theme })
    : t('common.theme.title', { theme });

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      aria-label={title}
      title={title}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: `2px solid ${fg}`,
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        padding: 0,
        cursor: 'pointer',
        transform: `rotate(${rotate}deg)`,
        opacity: 0.92,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <defs>
          <path id={ringId} d={`M ${size/2}, ${size/2} m -${size/2 - 9}, 0 a ${size/2 - 9},${size/2 - 9} 0 1,1 ${size - 18},0 a ${size/2 - 9},${size/2 - 9} 0 1,1 -${size - 18},0`} />
        </defs>
        <text fill={fg} style={{ fontFamily: SB.mono, fontWeight: 700, letterSpacing: '0.22em' }} fontSize={size * 0.11}>
          <textPath href={`#${ringId}`} startOffset="0">
            {isDark ? t('common.theme.dark') : t('common.theme.light')}
          </textPath>
        </text>
      </svg>
      <div style={{
        width: size * 0.46, height: size * 0.46,
        borderRadius: '50%',
        border: `1.5px solid ${fg}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {isDark ? (
          <svg width={size * 0.3} height={size * 0.3} viewBox="0 0 30 30" aria-hidden="true">
            <path d="M 22 6 A 11 11 0 1 0 22 24 A 9 9 0 0 1 22 6 Z" fill={fg} />
          </svg>
        ) : (
          <svg width={size * 0.34} height={size * 0.34} viewBox="0 0 34 34" aria-hidden="true">
            <circle cx="17" cy="17" r="5.5" fill={fg} />
            {[0,45,90,135,180,225,270,315].map((deg) => (
              <line key={deg}
                x1={17 + Math.cos(deg * Math.PI/180) * 9}
                y1={17 + Math.sin(deg * Math.PI/180) * 9}
                x2={17 + Math.cos(deg * Math.PI/180) * 13}
                y2={17 + Math.sin(deg * Math.PI/180) * 13}
                stroke={fg} strokeWidth="1.5" strokeLinecap="round" />
            ))}
          </svg>
        )}
      </div>
    </button>
  );
}

// ------------------------------------------------------------
// MobileThemeToggleCorner — fixed-position sun/moon stamp shown
// only on mobile. Desktop pages place a larger SunMoonStamp inside
// the open-spread shell, so we suppress this there.
// ------------------------------------------------------------
export function MobileThemeToggleCorner() {
  const { isDesktop } = useTheme();
  if (isDesktop) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 14, right: 14,
      zIndex: 50,
    }}>
      <SunMoonStamp size={56} rotate={0} />
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
  // Title stays nowrap on the underlined row. Subtitle drops to its own
  // line below — keeps mobile from wrapping the title when the subtitle
  // is long (e.g. "whose BTC projection do you trust?").
  return (
    <div style={{ marginTop: 22, marginBottom: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10,
        paddingBottom: 6, borderBottom: `1px solid ${SB.ink}`,
      }}>
        <span style={{ fontFamily: SB.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: SB.orange }}>{no}</span>
        <span style={{ fontFamily: SB.serif, fontSize: 18, fontWeight: 600, color: SB.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      {subtitle && (
        <div style={{
          marginTop: 5,
          fontFamily: SB.mono, fontSize: 9.5, color: SB.inkMute,
          letterSpacing: '0.05em', fontStyle: 'italic',
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Row — itemized line with dotted leader. Used in receipts, terms,
// lender lists. The dots fill the space between label and value.
// ------------------------------------------------------------
export function Row({ label, value, sub, valueStyle = {}, labelStyle = {}, info = null }) {
  // Two-row grid: label+dots and value share the baseline row; sub
  // drops onto its own row spanning the full width, right-aligned.
  // The value column auto-sizes to the value text only, so the
  // dotted leader extends right up to that text regardless of how
  // wide the sub line happens to be.
  // `info` is a GLOSSARY definition — when set, renders an ⓘ icon
  // after the label and switches the label area to overflow:visible
  // so the popover isn't clipped.
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      columnGap: 4,
      alignItems: 'baseline',
      padding: '6px 0',
    }}>
      <div style={{
        gridColumn: 1, gridRow: 1,
        minWidth: 0,
        fontSize: 11.5,
        color: SB.inkSoft,
        display: 'flex', alignItems: 'baseline', gap: 4,
        overflow: info ? 'visible' : 'hidden',
        ...labelStyle,
      }}>
        <span>{label}{info && <InfoIcon def={info} />}</span>
        <span style={{
          flex: 1, overflow: 'hidden', whiteSpace: 'nowrap',
          color: SB.inkFaint, letterSpacing: '0.08em',
        }}>
          {'.'.repeat(300)}
        </span>
      </div>
      <div style={{
        gridColumn: 2, gridRow: 1,
        fontFamily: SB.mono,
        fontSize: 12, fontWeight: 600,
        color: SB.ink,
        whiteSpace: 'nowrap',
        textAlign: 'right',
        ...valueStyle,
      }}>{value}</div>
      {sub && (
        <div style={{
          gridColumn: '1 / span 2', gridRow: 2,
          justifySelf: 'end',
          fontFamily: SB.mono,
          fontSize: 9,
          color: SB.inkMute,
          marginTop: 1, letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}>{sub}</div>
      )}
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
// InfoIcon — tiny superscript ⓘ that reveals a popover with a
// term definition. Data-agnostic: pass `def = { title, body }`,
// usually a lookup from GLOSSARY in lib/glossary.js. Only used on
// result tables (Calculator § II + § VI) per the booklet design —
// see About page for the full glossary.
//
// Behavior:
//   Desktop — hover to open, leaves to close (140 ms grace so the
//             cursor can travel from icon into the popover).
//   Mobile  — tap to toggle. No click-outside dismissal (popovers
//             stay until you tap the icon again or hit Escape).
// ------------------------------------------------------------
export function InfoIcon({ def, glossaryHref = '#about' }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const closeTimerRef = useRef(null);

  // Escape closes — useful for keyboard users, harmless otherwise.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Clear any pending close timer on unmount.
  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  if (!def) return null;

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 140);
  };
  const handleMouseEnter = () => {
    if (!isDesktop) return;
    cancelClose();
    setOpen(true);
  };
  const handleMouseLeave = () => {
    if (!isDesktop) return;
    scheduleClose();
  };
  const handleClick = (e) => {
    e.stopPropagation();
    if (isDesktop) return; // desktop is hover-only
    setOpen((v) => !v);
  };

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        display: 'inline-flex',
        marginLeft: 3,
        verticalAlign: 'super',
        lineHeight: 1,
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        onFocus={isDesktop ? cancelClose : undefined}
        onBlur={isDesktop ? scheduleClose : undefined}
        aria-label={t('common.glossary.iconLabel', { term: def.title })}
        aria-expanded={open}
        style={{
          width: 11, height: 11,
          padding: 0,
          background: 'transparent',
          border: `1px solid ${open ? SB.orange : SB.inkLine}`,
          borderRadius: '50%',
          cursor: 'pointer',
          color: open ? SB.orange : SB.inkMute,
          fontFamily: SB.serif,
          fontSize: 7.5,
          fontStyle: 'italic',
          fontWeight: 600,
          lineHeight: 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >i</button>
      {open && (
        <div role="tooltip" style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          width: 280,
          maxWidth: 'min(280px, calc(100vw - 48px))',
          background: SB.cream,
          border: `1.5px solid ${SB.ink}`,
          padding: '10px 12px 10px',
          zIndex: 50,
          boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          textAlign: 'left',
          verticalAlign: 'baseline',
        }}>
          <div style={{
            fontFamily: SB.serif, fontSize: 14, fontWeight: 600,
            color: SB.ink, letterSpacing: '-0.005em',
            marginBottom: 6,
          }}>{def.title}</div>
          <div style={{
            fontFamily: SB.mono, fontSize: 10.5, color: SB.inkSoft,
            lineHeight: 1.55, letterSpacing: '0.01em',
          }}>{def.body}</div>
          <a
            href={glossaryHref}
            onClick={() => setOpen(false)}
            style={{
              display: 'inline-block',
              marginTop: 10,
              fontFamily: SB.mono, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.14em', color: SB.orange,
              textDecoration: 'none',
            }}
          >{t('common.glossary.link')}</a>
        </div>
      )}
    </span>
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
  const t = useT();
  const pages = [
    { id: 'landing', label: t('common.nav.overview'),   no: 'I',   href: '#' },
    { id: 'calc',    label: t('common.nav.calculator'), no: 'II',  href: '#calculator' },
    { id: 'lender',  label: t('common.nav.lenders'),    no: 'III', href: '#lenders' },
    { id: 'about',   label: t('common.nav.terms'),      no: 'IV',  href: '#about' },
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
// LanguageSwitchLink — the "View in English" toggle for the
// FineFooter. Shows only when the active language and the
// detected language differ enough to make switching meaningful:
//   - viewing in a non-English language → offer English
//   - viewing in English while detected is non-English → offer
//     the way back, labelled in that language's own tongue
//   - viewing in English with no detected mismatch → render nothing
// ------------------------------------------------------------
function LanguageSwitchLink() {
  const { lang, detectedLang, setLanguage } = useLanguage();

  let target = null;
  let label = null;
  if (lang !== 'en') {
    target = 'en';
    label = LANGUAGE_SWITCH_LABELS.en;
  } else if (detectedLang !== 'en' && LANGUAGE_SWITCH_LABELS[detectedLang]) {
    target = detectedLang;
    label = LANGUAGE_SWITCH_LABELS[detectedLang];
  }
  if (!target) return null;

  const onClick = (e) => {
    e.preventDefault();
    setLanguage(target);
  };
  return (
    <>
      <br />
      ※{' '}
      <a
        href="#"
        onClick={onClick}
        style={{ color: SB.inkSoft, textDecoration: 'underline' }}
      >
        {label}
      </a>
    </>
  );
}

// ------------------------------------------------------------
// FineFooter — the ※ disclaimer lines.
// ------------------------------------------------------------
export function FineFooter({ source = 'mempool.space', updated = null }) {
  const t = useT();
  return (
    <div style={{
      marginTop: 18,
      fontFamily: SB.mono,
      fontSize: 8.5,
      color: SB.inkMute,
      lineHeight: 1.7,
      letterSpacing: '0.02em',
    }}>
      {t('common.footer.btcSource', { source })}<br />
      {t('common.footer.disclaimer')}<br />
      {t('common.footer.contact')}<a href="mailto:feedback@stackandborrow.com" style={{ color: SB.inkSoft, textDecoration: 'underline' }}>feedback@stackandborrow.com</a>
      {updated && <><br />{t('common.footer.dataVerified', { updated })}</>}
      <LanguageSwitchLink />
    </div>
  );
}

// ------------------------------------------------------------
// LivePriceBadge — small "BTC · $X" indicator used in the header.
// ------------------------------------------------------------
export function LivePriceBadge({ btcUsd, loading, error, onRefresh }) {
  const t = useT();
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
      <button
        type="button"
        onClick={onRefresh}
        aria-label={!error && !loading ? t('common.livePrice.refreshLabel') : undefined}
        title={!error && !loading ? t('common.livePrice.refresh') : undefined}
        style={{
          background: 'transparent', border: 'none', padding: 0,
          color: SB.inkMute, fontFamily: SB.mono, fontSize: 9,
          letterSpacing: '0.12em', cursor: 'pointer',
        }}
      >
        {error ? t('common.livePrice.retry') : loading ? t('common.livePrice.fetching') : '↻'}
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
