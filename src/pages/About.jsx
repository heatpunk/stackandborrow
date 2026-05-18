// ============================================================
// ABOUT PAGE — "Terms of philosophy" manifesto.
// Numbered principles, FAQ, signed/dated signature block, stamp.
// Pure render — no state.
// ============================================================

import React from 'react';
import { SB } from '../system/tokens.js';
import {
  PaperFrame,
  BrandHeader,
  DashedRule,
  Stamp,
  Button,
  PageNav,
  FineFooter,
  SunMoonStamp,
} from '../system/components.jsx';
import { useIsDesktop, useTheme } from '../system/theme.jsx';

// Signature is a white-background PNG of a hand-drawn mark. To make it
// blend into the paper rather than sit on a visible white card, we use
// mix-blend-mode: multiply on light themes (white drops out, dark ink
// shows). On dark themes (carbon/midnight) multiply would kill the mark
// entirely, so we invert first (white→black, blue→light) and use screen
// so the now-black background drops out instead.
function signatureBlend(isDark) {
  return isDark
    ? { mixBlendMode: 'screen', filter: 'invert(1)' }
    : { mixBlendMode: 'multiply' };
}
import { DesktopSpreadFrame } from '../system/desktop.jsx';
import { GLOSSARY_ORDER } from '../lib/glossary.js';
import { glossaryKeyToSlug } from '../lib/seo.js';
import { useT } from '../i18n/index.jsx';

// Principles & FAQ structure: the array carries the layout-only
// data (numerals, identity); strings come from i18n via the id.
const PRINCIPLES = [
  { id: 'i',   no: 'I' },
  { id: 'ii',  no: 'II' },
  { id: 'iii', no: 'III' },
  { id: 'iv',  no: 'IV' },
  { id: 'v',   no: 'V' },
];

const FAQ_IDS = ['funding', 'prices', 'rates', 'feedback'];

export default function AboutPage() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DesktopAboutLayout />;
  const t = useT();
  const { isDark } = useTheme();

  return (
    <PaperFrame>
      <BrandHeader
        currentPage="IV"
        pageOf="IV"
        rightSlot={
          <div style={{
            fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.12em',
            color: SB.inkMute, textAlign: 'right',
          }}>
            <div style={{ color: SB.ink, fontWeight: 700 }}>{t('about.meta.readFirst')}</div>
            <div style={{ marginTop: 4 }}>{t('about.meta.readTime')}</div>
          </div>
        }
      />

      {/* Hero */}
      <div style={{ marginTop: 4, position: 'relative' }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.22em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 8,
        }}>
          {t('about.meta.insert')}
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: SB.serif, fontSize: 34, fontWeight: 600,
          lineHeight: 1.02, letterSpacing: '-0.025em', color: SB.ink,
        }}>
          {t('about.hero.titleLine1')}<br />
          <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>{t('about.hero.titleLine2')}</span>
        </h1>
        <p style={{
          marginTop: 12, marginBottom: 0,
          fontFamily: SB.sans, fontSize: 13, lineHeight: 1.55,
          color: SB.inkSoft, textWrap: 'pretty',
        }}>
          {t('about.hero.subtitle')}
        </p>

        <div style={{
          position: 'absolute', top: -10, right: -8,
          transform: 'rotate(8deg)',
        }}>
          <Stamp line1={t('about.heroStamp.line1')} line2={t('about.heroStamp.line2')} line3={t('about.heroStamp.line3')} size={76} />
        </div>
      </div>

      <DashedRule label={t('about.section.principles')} />

      <div>
        {PRINCIPLES.map((p) => (
          <div key={p.id} style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr',
            gap: 12,
            padding: '14px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <div style={{
              fontFamily: SB.serif, fontStyle: 'italic',
              fontSize: 28, fontWeight: 500, color: SB.orange,
              lineHeight: 1, paddingTop: 2,
            }}>{p.no}</div>
            <div>
              <div style={{
                fontFamily: SB.serif, fontSize: 17, fontWeight: 600,
                color: SB.ink, letterSpacing: '-0.01em', lineHeight: 1.2,
                marginBottom: 6,
              }}>{t(`about.principle.${p.id}.title`)}</div>
              <div style={{
                fontFamily: SB.sans, fontSize: 12, lineHeight: 1.55,
                color: SB.inkSoft, textWrap: 'pretty',
              }}>{t(`about.principle.${p.id}.body`)}</div>
            </div>
          </div>
        ))}
      </div>

      <DashedRule label={t('about.section.notForYou')} />

      <div style={{
        padding: '12px 14px',
        background: SB.rustWash,
        border: `1px dashed ${SB.rust}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.2em',
          color: SB.rust, fontWeight: 700, marginBottom: 10,
        }}>
          {t('about.warning.heading')}
        </div>
        <ul style={{
          margin: 0, paddingLeft: 18,
          fontFamily: SB.sans, fontSize: 12, lineHeight: 1.6,
          color: SB.ink, textWrap: 'pretty',
        }}>
          <li>{t('about.warning.item1')}</li>
          <li>{t('about.warning.item2')}</li>
          <li>{t('about.warning.item3.before')}<i>{t('about.warning.item3.italic')}</i>{t('about.warning.item3.after')}</li>
        </ul>
      </div>

      <DashedRule label={t('about.section.questions')} />

      <div>
        {FAQ_IDS.map((id) => (
          <div key={id} style={{
            padding: '12px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <div style={{
              fontFamily: SB.serif, fontSize: 14, fontWeight: 600,
              color: SB.ink, marginBottom: 6, letterSpacing: '-0.005em',
            }}>{t(`about.faq.${id}.q`)}</div>
            <div style={{
              fontFamily: SB.sans, fontSize: 12, lineHeight: 1.55,
              color: SB.inkSoft, textWrap: 'pretty',
            }}>{t(`about.faq.${id}.a`)}</div>
          </div>
        ))}
      </div>

      <GlossarySection />

      <DashedRule label={t('about.section.signatures')} />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 16, marginTop: 4, marginBottom: 12,
      }}>
        <div>
          <div style={{ height: 56, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
            <img
              src="/signature.png"
              alt=""
              aria-hidden="true"
              style={{
                width: '88%', maxWidth: 180, height: 'auto',
                marginBottom: 2, marginLeft: -4,
                ...signatureBlend(isDark),
              }}
            />
          </div>
          <div style={{ paddingTop: 6, borderTop: `1.5px solid ${SB.ink}` }}>
            <div style={{
              fontFamily: SB.mono, fontSize: 8.5,
              letterSpacing: '0.18em', color: SB.inkMute,
              fontWeight: 600,
            }}>{t('about.sig.signedRole')}</div>
          </div>
        </div>
        <div>
          <div style={{ height: 56, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              fontFamily: SB.mono,
              fontSize: 11, color: SB.ink, lineHeight: 1.2,
              paddingBottom: 0,
            }}>stackandborrow.com</div>
          </div>
          <div style={{ paddingTop: 6, borderTop: `1.5px solid ${SB.ink}` }}>
            <div style={{
              fontFamily: SB.mono, fontSize: 8.5,
              letterSpacing: '0.18em', color: SB.inkMute,
              fontWeight: 600,
            }}>{t('about.sig.domainRole')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
        <Stamp line1={t('about.verifiedStamp.line1')} line2={t('about.verifiedStamp.line2')} line3={t('about.verifiedStamp.line3')} size={106} rotate={4} />
      </div>

      <div style={{ marginTop: 18 }}>
        <Button href="/calculator">{t('common.cta.runCalculator')}</Button>
      </div>

      <FineFooter />
      <PageNav active="about" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// DesktopAboutLayout — open-spread variant for >=1024px.
// Left  = hero + principles. Right = "Who shouldn't", FAQ,
// signatures, verified stamp, CTA.
// ============================================================
function DesktopAboutLayout() {
  const t = useT();
  const { isDark } = useTheme();
  const rightSlot = (
    <div style={{
      fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.14em',
      color: SB.inkMute, textAlign: 'right',
    }}>
      <div style={{ color: SB.ink, fontWeight: 700 }}>{t('about.meta.readFirst')}</div>
      <div style={{ marginTop: 5 }}>{t('about.meta.readTime')}</div>
    </div>
  );

  const left = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('about.desktop.leftLabel')}
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.22em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 10,
        }}>
          {t('about.meta.insert')}
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: SB.serif, fontSize: 64, fontWeight: 600,
          lineHeight: 0.98, letterSpacing: '-0.03em', color: SB.ink,
        }}>
          {t('about.hero.titleLine1')}<br />
          <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>{t('about.hero.titleLine2')}</span>
        </h1>
        <p style={{
          marginTop: 20, marginBottom: 0,
          fontFamily: SB.sans, fontSize: 15, lineHeight: 1.55,
          color: SB.inkSoft, textWrap: 'pretty', maxWidth: 460,
        }}>
          {t('about.hero.subtitle')}
        </p>
      </div>

      <DashedRule label={t('about.section.principles')} />

      <div>
        {PRINCIPLES.map((p) => (
          <div key={p.id} style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr',
            gap: 16,
            padding: '16px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <div style={{
              fontFamily: SB.serif, fontStyle: 'italic',
              fontSize: 32, fontWeight: 500, color: SB.orange,
              lineHeight: 1, paddingTop: 2,
            }}>{p.no}</div>
            <div>
              <div style={{
                fontFamily: SB.serif, fontSize: 19, fontWeight: 600,
                color: SB.ink, letterSpacing: '-0.01em', lineHeight: 1.2,
                marginBottom: 8,
              }}>{t(`about.principle.${p.id}.title`)}</div>
              <div style={{
                fontFamily: SB.sans, fontSize: 13, lineHeight: 1.55,
                color: SB.inkSoft, textWrap: 'pretty',
              }}>{t(`about.principle.${p.id}.body`)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const right = (
    <div>
      <div style={{
        fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
        color: SB.inkMute, fontWeight: 700,
        marginTop: 18, marginBottom: 14,
      }}>
        {t('about.desktop.rightLabel')}
      </div>

      <div style={{
        padding: '16px 18px',
        background: SB.rustWash,
        border: `1px dashed ${SB.rust}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.2em',
          color: SB.rust, fontWeight: 700, marginBottom: 12,
        }}>
          {t('about.warning.heading')}
        </div>
        <ul style={{
          margin: 0, paddingLeft: 22,
          fontFamily: SB.sans, fontSize: 13, lineHeight: 1.65,
          color: SB.ink, textWrap: 'pretty',
        }}>
          <li>{t('about.warning.item1')}</li>
          <li>{t('about.warning.item2')}</li>
          <li>{t('about.warning.item3.before')}<i>{t('about.warning.item3.italic')}</i>{t('about.warning.item3.after')}</li>
        </ul>
      </div>

      <DashedRule label={t('about.section.questions')} />

      <div>
        {FAQ_IDS.map((id) => (
          <div key={id} style={{
            padding: '14px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <div style={{
              fontFamily: SB.serif, fontSize: 16, fontWeight: 600,
              color: SB.ink, marginBottom: 8, letterSpacing: '-0.005em',
            }}>{t(`about.faq.${id}.q`)}</div>
            <div style={{
              fontFamily: SB.sans, fontSize: 13, lineHeight: 1.55,
              color: SB.inkSoft, textWrap: 'pretty',
            }}>{t(`about.faq.${id}.a`)}</div>
          </div>
        ))}
      </div>

      <GlossarySection />

      <DashedRule label={t('about.section.signatures')} />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 20, marginTop: 4, marginBottom: 14,
      }}>
        <div>
          <div style={{ height: 70, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
            <img
              src="/signature.png"
              alt=""
              aria-hidden="true"
              style={{
                width: '82%', maxWidth: 220, height: 'auto',
                marginBottom: 4, marginLeft: -4,
                ...signatureBlend(isDark),
              }}
            />
          </div>
          <div style={{ paddingTop: 8, borderTop: `1.5px solid ${SB.ink}` }}>
            <div style={{
              fontFamily: SB.mono, fontSize: 9.5,
              letterSpacing: '0.18em', color: SB.inkMute,
              fontWeight: 600,
            }}>{t('about.sig.signedRole')}</div>
          </div>
        </div>
        <div>
          <div style={{ height: 70, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              fontFamily: SB.mono,
              fontSize: 13, color: SB.ink, lineHeight: 1.2,
              paddingBottom: 0,
            }}>stackandborrow.com</div>
          </div>
          <div style={{ paddingTop: 8, borderTop: `1.5px solid ${SB.ink}` }}>
            <div style={{
              fontFamily: SB.mono, fontSize: 9.5,
              letterSpacing: '0.18em', color: SB.inkMute,
              fontWeight: 600,
            }}>{t('about.sig.domainRole')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 16px' }}>
        <Stamp line1={t('about.verifiedStamp.line1')} line2={t('about.verifiedStamp.line2')} line3={t('about.verifiedStamp.line3')} size={130} rotate={4} />
      </div>

      <Button href="/calculator">{t('common.cta.runCalculator')}</Button>
    </div>
  );

  return (
    <DesktopSpreadFrame
      left={left}
      right={right}
      active="about"
      currentPage="IV"
      pageOf="IV"
      rightSlot={rightSlot}
    />
  );
}

// ============================================================
// GlossarySection — plain-language definitions for every term
// used on the site. Same data source as the inline ⓘ popovers
// (lib/glossary.js). Both mobile and desktop About layouts call
// this; font sizes scale via useIsDesktop.
// ============================================================
function GlossarySection() {
  const t = useT();
  const isDesktop = useIsDesktop();
  const titleSize = isDesktop ? 16 : 14;
  const bodySize = isDesktop ? 13 : 12;
  return (
    <>
      <DashedRule label={t('common.glossary.label')} />
      <div id="glossary" style={{ scrollMarginTop: 80 }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9.5, color: SB.inkMute,
          letterSpacing: '0.04em', lineHeight: 1.55,
          marginBottom: 6, marginTop: -2,
        }}>
          {t('about.glossary.intro')}
        </div>
        {GLOSSARY_ORDER.map((key) => (
          <div key={key} style={{
            padding: '12px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <a href={`/glossary/${glossaryKeyToSlug(key)}`} style={{
              display: 'inline-block',
              fontFamily: SB.serif, fontSize: titleSize, fontWeight: 600,
              color: SB.ink, marginBottom: 6, letterSpacing: '-0.005em',
              textDecoration: 'none',
              borderBottom: `1px dotted ${SB.inkLine}`,
            }}>{t(`glossary.${key}.title`)}</a>
            <div style={{
              fontFamily: SB.sans, fontSize: bodySize, lineHeight: 1.55,
              color: SB.inkSoft, textWrap: 'pretty',
            }}>{t(`glossary.${key}.body`)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
