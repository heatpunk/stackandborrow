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
} from '../system/components.jsx';

const PRINCIPLES = [
  {
    no: 'I',
    title: 'Lenders ranked by total cost. Period.',
    body: 'APR plus origination fee, multiplied by term. Lowest cost wins. Affiliate commissions never enter the ranking algorithm. If a lender that pays nothing offers you the best deal — they win.',
  },
  {
    no: 'II',
    title: 'Sats first. Everything else is a translation.',
    body: 'The headline number is always "sats you keep." Fiat conversions update from live BTC price. You can switch to USD, EUR, SEK and back; the underlying math is denominated in sats.',
  },
  {
    no: 'III',
    title: 'Tax-aware by default.',
    body: 'To net $N in cash, you must sell enough BTC to cover $N + capital gains tax. We bake the tax into every comparison. You can edit the rate if your jurisdiction differs.',
  },
  {
    no: 'IV',
    title: 'No tracking. No accounts. No data leaves your browser.',
    body: 'Your inputs are saved to localStorage on your device. There are no analytics, no third-party scripts, no signup. The site is a folder of HTML and a JSON of lender rates.',
  },
  {
    no: 'V',
    title: 'Honest about the risks.',
    body: 'BTC has dropped >50% from a 12-month high six times since 2013. Borrowing at 50% LTV means a 50% drawdown is your liquidation event. Six times in twelve years is not "if" — it is "when."',
  },
];

const FAQ = [
  ['Q: How is the site funded?',
   'Some lender links are affiliate. When you click through and take a loan, the lender pays a referral fee. This funds hosting. Ranking is unaffected — pick whichever route you prefer.'],
  ['Q: Where does the BTC price come from?',
   'mempool.space, polled every five minutes. Fallback is utxoracle.io. If both fail we use a baked-in fallback (visibly marked).'],
  ['Q: How often are rates updated?',
   'Quarterly target, sooner when a lender shuts down or moves materially. Last verified date is stamped on the calculator footer.'],
  ['Q: Found something wrong?',
   'feedback@stackandborrow.com — short emails get a faster response.'],
];

export default function AboutPage() {
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
            <div style={{ color: SB.ink, fontWeight: 700 }}>READ THIS FIRST</div>
            <div style={{ marginTop: 4 }}>5-MINUTE READ</div>
          </div>
        }
      />

      {/* Hero */}
      <div style={{ marginTop: 4, position: 'relative' }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.22em',
          color: SB.inkMute, fontWeight: 700, marginBottom: 8,
        }}>
          INSERT · III · OF III
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: SB.serif, fontSize: 34, fontWeight: 600,
          lineHeight: 1.02, letterSpacing: '-0.025em', color: SB.ink,
        }}>
          Terms of<br />
          <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>philosophy.</span>
        </h1>
        <p style={{
          marginTop: 12, marginBottom: 0,
          fontFamily: SB.sans, fontSize: 13, lineHeight: 1.55,
          color: SB.inkSoft, textWrap: 'pretty',
        }}>
          A calculator for the question every long-term bitcoiner faces
          eventually: should I sell some sats, or borrow against them?
          What follows is how we decided to answer.
        </p>

        <div style={{
          position: 'absolute', top: -10, right: -8,
          transform: 'rotate(8deg)',
        }}>
          <Stamp line1="NO" line2="BS" line3="★ SATS FIRST ★" size={76} />
        </div>
      </div>

      <DashedRule label="THE PRINCIPLES" />

      <div>
        {PRINCIPLES.map((p) => (
          <div key={p.no} style={{
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
              }}>{p.title}</div>
              <div style={{
                fontFamily: SB.sans, fontSize: 12, lineHeight: 1.55,
                color: SB.inkSoft, textWrap: 'pretty',
              }}>{p.body}</div>
            </div>
          </div>
        ))}
      </div>

      <DashedRule label="WHO SHOULDN'T USE THIS" />

      <div style={{
        padding: '12px 14px',
        background: SB.rustWash,
        border: `1px dashed ${SB.rust}`,
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.2em',
          color: SB.rust, fontWeight: 700, marginBottom: 10,
        }}>
          ⚠ DO NOT PROCEED IF
        </div>
        <ul style={{
          margin: 0, paddingLeft: 18,
          fontFamily: SB.sans, fontSize: 12, lineHeight: 1.6,
          color: SB.ink, textWrap: 'pretty',
        }}>
          <li>You'd be devastated by a 50% BTC drawdown (which has happened six times)</li>
          <li>You don't understand rehypothecation and which lenders practice it</li>
          <li>You're borrowing to <i>buy more bitcoin</i>. That's leverage — not strategy.</li>
        </ul>
      </div>

      <DashedRule label="THE QUESTIONS" />

      <div>
        {FAQ.map(([q, a], i) => (
          <div key={i} style={{
            padding: '12px 0',
            borderBottom: `1px dotted ${SB.inkLine}`,
          }}>
            <div style={{
              fontFamily: SB.serif, fontSize: 14, fontWeight: 600,
              color: SB.ink, marginBottom: 6, letterSpacing: '-0.005em',
            }}>{q}</div>
            <div style={{
              fontFamily: SB.sans, fontSize: 12, lineHeight: 1.55,
              color: SB.inkSoft, textWrap: 'pretty',
            }}>{a}</div>
          </div>
        ))}
      </div>

      <DashedRule label="SIGNATURES" />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 16, marginTop: 4, marginBottom: 12,
      }}>
        <div style={{ paddingTop: 28, borderTop: `1.5px solid ${SB.ink}` }}>
          <div style={{
            fontFamily: SB.serif, fontStyle: 'italic',
            fontSize: 18, color: SB.ink, lineHeight: 1,
            paddingBottom: 4,
          }}>~ signed</div>
          <div style={{
            fontFamily: SB.mono, fontSize: 8.5,
            letterSpacing: '0.18em', color: SB.inkMute,
            fontWeight: 600,
          }}>THE AUTHOR</div>
        </div>
        <div style={{ paddingTop: 28, borderTop: `1.5px solid ${SB.ink}` }}>
          <div style={{
            fontFamily: SB.serif, fontStyle: 'italic',
            fontSize: 13, color: SB.ink, lineHeight: 1.2,
            paddingBottom: 4,
          }}>stackandborrow.com</div>
          <div style={{
            fontFamily: SB.mono, fontSize: 8.5,
            letterSpacing: '0.18em', color: SB.inkMute,
            fontWeight: 600,
          }}>DOMAIN OF RECORD</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
        <Stamp line1="VERIFIED" line2="CALC" line3="★ MAY 2026 ★" size={106} rotate={4} />
      </div>

      <div style={{ marginTop: 18 }}>
        <Button href="#calc">RUN THE CALCULATOR</Button>
      </div>

      <FineFooter />
      <PageNav active="about" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}
