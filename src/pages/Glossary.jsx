// ============================================================
// GLOSSARY TERM — single-concept deep-link at /glossary/{slug}.
//
// Each glossary key in src/lib/glossary.js gets its own canonical URL
// so people searching for e.g. "rehypothecation explained" or "what
// is LTV" can land on a standalone page rather than scrolling the
// About page. The content reuses the i18n glossary strings so Swedish
// users get a Swedish definition.
// ============================================================

import React from 'react';
import { SB } from '../system/tokens.js';
import {
  PaperFrame,
  BrandHeader,
  DashedRule,
  PageNav,
  FineFooter,
  LivePriceBadge,
} from '../system/components.jsx';
import { useT } from '../i18n/index.jsx';
import { GLOSSARY, GLOSSARY_ORDER } from '../lib/glossary.js';
import { glossaryKeyToSlug, glossarySlugToKey } from '../lib/seo.js';
import { VoidState404 } from './Void.jsx';

// Curated "see also" graph — hand-picked because adjacency in
// GLOSSARY_ORDER (alphabetical) doesn't reliably mean topical
// closeness. Each entry lists 2–4 related keys.
const RELATED = {
  collateral: ['ltv', 'liquidation', 'custody'],
  ltv: ['collateral', 'liquidation', 'apr'],
  apr: ['interest', 'origination', 'principal'],
  origination: ['apr', 'interest', 'principal'],
  liquidation: ['ltv', 'collateral', 'taxEvent'],
  longView: ['rollover', 'refinance', 'apr'],
  balloon: ['principal', 'interest', 'rollover'],
  sats: ['principal'],
  taxEvent: ['liquidation', 'capitalGains'],
  principal: ['interest', 'apr', 'balloon'],
  interest: ['apr', 'principal', 'origination'],
  custody: ['multisig', 'rehypothecation', 'collateral'],
  rehypothecation: ['custody', 'multisig', 'dlc'],
  multisig: ['custody', 'dlc', 'rehypothecation'],
  dlc: ['multisig', 'custody'],
  rollover: ['refinance', 'newContract', 'revolving'],
  newContract: ['rollover', 'refinance', 'revolving'],
  refinance: ['rollover', 'newContract', 'revolving'],
  revolving: ['rollover', 'refinance', 'newContract'],
  capitalGains: ['taxEvent', 'liquidation'],
};

export default function GlossaryPage({ slug, live, lastUpdated }) {
  const t = useT();
  const key = glossarySlugToKey(slug || '');
  const entry = GLOSSARY[key];

  if (!entry) return <VoidState404 attemptedPath={'glossary/' + slug} />;

  // Use the i18n strings when available so Swedish renders a Swedish
  // definition — falls back to the source glossary.js English copy.
  const title = t(`glossary.${key}.title`) || entry.title;
  const body  = t(`glossary.${key}.body`)  || entry.body;
  const related = RELATED[key] || [];

  return (
    <PaperFrame>
      <BrandHeader
        rightSlot={<LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />}
      />

      <div style={{
        marginTop: 4,
        fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.22em',
        color: SB.inkMute, fontWeight: 700, marginBottom: 8,
      }}>
        GLOSSARY · BITCOIN-BACKED LOANS
      </div>

      <h1 style={{
        margin: 0,
        fontFamily: SB.serif, fontSize: 32, fontWeight: 600,
        lineHeight: 1.05, letterSpacing: '-0.025em', color: SB.ink,
      }}>
        {title}
        <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500 }}>.</span>
      </h1>

      <p style={{
        marginTop: 16,
        fontFamily: SB.sans, fontSize: 14.5, lineHeight: 1.65,
        color: SB.ink, textWrap: 'pretty',
      }}>
        {body}
      </p>

      {related.length > 0 && (
        <>
          <DashedRule label="SE ÄVEN · SEE ALSO" />
          <div style={{ display: 'grid', gap: 6 }}>
            {related.map((k) => {
              const r = GLOSSARY[k];
              if (!r) return null;
              const rSlug = glossaryKeyToSlug(k);
              const rTitle = t(`glossary.${k}.title`) || r.title;
              return (
                <a
                  key={k}
                  href={`/glossary/${rSlug}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between', alignItems: 'baseline',
                    padding: '8px 12px',
                    border: `1px dashed ${SB.inkLine}`,
                    color: SB.ink,
                    textDecoration: 'none',
                    fontFamily: SB.serif,
                    fontSize: 14, fontWeight: 500,
                    letterSpacing: '-0.005em',
                  }}
                >
                  <span>{rTitle}</span>
                  <span style={{ color: SB.orange }}>↗</span>
                </a>
              );
            })}
          </div>
        </>
      )}

      <DashedRule label="MORE" />

      <p style={{
        margin: 0,
        fontFamily: SB.sans, fontSize: 12, lineHeight: 1.6,
        color: SB.inkSoft, textWrap: 'pretty',
      }}>
        Full glossary lives on the <a href="/about" style={{ color: SB.orange, textDecoration: 'none', borderBottom: `1px dashed ${SB.orange}` }}>About</a> page. Run the math on a real loan in the <a href="/calculator" style={{ color: SB.orange, textDecoration: 'none', borderBottom: `1px dashed ${SB.orange}` }}>calculator</a>, or compare lender by lender on <a href="/lenders" style={{ color: SB.orange, textDecoration: 'none', borderBottom: `1px dashed ${SB.orange}` }}>the directory</a>.
      </p>

      <FineFooter source={live.source || 'mempool.space'} updated={lastUpdated} />
      <PageNav active="about" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// Export the full term list (with slugs) so the build-time HTML
// generator can iterate every page without re-deriving the slug rule.
export const GLOSSARY_PAGES = GLOSSARY_ORDER.map((key) => ({
  key,
  slug: glossaryKeyToSlug(key),
  title: GLOSSARY[key].title,
  body: GLOSSARY[key].body,
}));
