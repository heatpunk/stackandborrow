import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { GLOSSARY, GLOSSARY_ORDER } from './src/lib/glossary.js'

// Multi-page build: each route gets its own physical HTML file
// with its own <title>, meta description, canonical, OG tags,
// and JSON-LD structured data. Search engines index each URL as
// a separate document. All pages load the same React bundle,
// which then renders the right page based on window.location.
//
// The compare pages (/compare/{a}-vs-{b}) aren't in this input list
// — they're generated at build time by the generateComparePages
// plugin below, which writes one HTML file per alphabetical lender
// pair using lenders.json + the built index.html as a template.
export default defineConfig({
  plugins: [react(), generateComparePages()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        calculator: resolve(__dirname, 'calculator/index.html'),
        lenders:    resolve(__dirname, 'lenders/index.html'),
        about:      resolve(__dirname, 'about/index.html'),
        swedenTax:  resolve(__dirname, 'skatt-bitcoin-lan/index.html'),
      },
    },
  },
})

// Generates /dist/compare/{a}-vs-{b}/index.html for every alphabetical
// pair of lenders in public/lenders.json AND /dist/lenders/{id}/index.html
// for every individual lender. Both flavors are built from the same
// dist/index.html template — only the head metadata changes per file,
// so they all boot from the same hashed JS chunk vite emitted.
// Non-canonical compare orderings (e.g. /compare/strike-vs-ledn) fall
// through Cloudflare Pages' SPA fallback to the root index.html, where
// the React app renders the right pair and the canonical link tag
// points at the alphabetical URL — so duplicate-content risk is
// contained.
function generateComparePages() {
  return {
    name: 'generate-compare-pages',
    apply: 'build',
    writeBundle(opts) {
      const outDir = opts.dir || resolve(__dirname, 'dist')
      const distIndexPath = resolve(outDir, 'index.html')
      const lendersJsonPath = resolve(__dirname, 'public/lenders.json')
      if (!existsSync(distIndexPath) || !existsSync(lendersJsonPath)) return

      const templateHtml = readFileSync(distIndexPath, 'utf8')
      const lendersData = JSON.parse(readFileSync(lendersJsonPath, 'utf8'))
      const lenders = lendersData.lenders || []

      const pairs = []
      for (let i = 0; i < lenders.length; i++) {
        for (let j = i + 1; j < lenders.length; j++) {
          pairs.push([lenders[i], lenders[j]])
        }
      }

      const slugs = []
      for (const [a, b] of pairs) {
        // Always pass the alphabetical pair to buildCompareHtml so
        // the generated title and description match the URL order.
        // The visible "winner vs runner" copy in Compare.jsx is a
        // separate UX choice — that one is sorted by cost.
        const [first, second] = a.id < b.id ? [a, b] : [b, a]
        const slug = `${first.id}-vs-${second.id}`
        slugs.push(slug)
        const pairDir = resolve(outDir, 'compare', slug)
        mkdirSync(pairDir, { recursive: true })
        const html = buildCompareHtml(templateHtml, first, second, slug)
        writeFileSync(resolve(pairDir, 'index.html'), html, 'utf8')
      }

      // Per-lender pages — one HTML shell per lender at /lenders/{id}.
      // Carefully avoid colliding with the existing dist/lenders/index.html
      // (the directory page) — we only write to dist/lenders/{id}/index.html.
      for (const l of lenders) {
        const lenderDir = resolve(outDir, 'lenders', l.id)
        mkdirSync(lenderDir, { recursive: true })
        const html = buildLenderHtml(templateHtml, l, lenders.length)
        writeFileSync(resolve(lenderDir, 'index.html'), html, 'utf8')
      }

      // Glossary term pages — one per entry in src/lib/glossary.js.
      // Slug is kebab-case of the camelCase key (e.g. "tax-event").
      const glossarySlugs = []
      for (const key of GLOSSARY_ORDER) {
        const entry = GLOSSARY[key]
        if (!entry) continue
        const slug = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        glossarySlugs.push(slug)
        const termDir = resolve(outDir, 'glossary', slug)
        mkdirSync(termDir, { recursive: true })
        const html = buildGlossaryHtml(templateHtml, slug, entry)
        writeFileSync(resolve(termDir, 'index.html'), html, 'utf8')
      }

      // Append compare + per-lender + glossary URLs to the sitemap.
      // Splice in just before </urlset> so the hand-written entries
      // (root, /calculator, /lenders, /about, /skatt-bitcoin-lan) stay
      // at the top in priority order.
      const sitemapPath = resolve(outDir, 'sitemap.xml')
      if (existsSync(sitemapPath)) {
        let sitemap = readFileSync(sitemapPath, 'utf8')
        const compareEntries = slugs
          .map((slug) => sitemapEntry(`https://stackandborrow.com/compare/${slug}`, 'weekly', 0.6))
          .join('')
        const lenderEntries = lenders
          .map((l) => sitemapEntry(`https://stackandborrow.com/lenders/${l.id}`, 'weekly', 0.7))
          .join('')
        const glossaryEntries = glossarySlugs
          .map((slug) => sitemapEntry(`https://stackandborrow.com/glossary/${slug}`, 'monthly', 0.5))
          .join('')
        sitemap = sitemap.replace('</urlset>', `${lenderEntries}${glossaryEntries}${compareEntries}</urlset>`)
        writeFileSync(sitemapPath, sitemap, 'utf8')
      }

      console.log(`[generate-compare-pages] wrote ${pairs.length} compare + ${lenders.length} lender + ${glossarySlugs.length} glossary pages and updated sitemap.`)
    },
  }
}

function sitemapEntry(loc, changefreq, priority) {
  return (
    `  <url>\n` +
    `    <loc>${loc}</loc>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    `    <xhtml:link rel="alternate" hreflang="en" href="${loc}"/>\n` +
    `    <xhtml:link rel="alternate" hreflang="sv" href="${loc}"/>\n` +
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>\n` +
    `  </url>\n`
  )
}

function buildCompareHtml(template, lenderA, lenderB, canonicalSlug) {
  // The canonical-slug name order ("ledn-vs-strike") drives the visible
  // title via lenderA = first alphabetically, lenderB = second. This
  // means the same alphabetical pair always gets the same generated
  // file and the same title/description.
  const aName = lenderA.name
  const bName = lenderB.name
  const canonicalUrl = `https://stackandborrow.com/compare/${canonicalSlug}`
  const title = `${aName} vs ${bName} — Bitcoin Loan Comparison | Stack & Borrow`
  const description = `${aName} vs ${bName}: APR, origination fees, custody, rehypothecation, and total cost on a Bitcoin-backed loan. Independent comparison, sats-first ranking.`
  const ogTitle = `${aName} vs ${bName} — which Bitcoin lender wins?`
  const keywords = [
    `${aName.toLowerCase()} vs ${bName.toLowerCase()}`,
    `${aName.toLowerCase()} review`,
    `${bName.toLowerCase()} review`,
    'bitcoin loan comparison',
    'btc backed loan comparison',
    `${aName.toLowerCase()} vs ${bName.toLowerCase()} rates`,
    'bitcoin loan rates compared',
  ].join(', ')

  // Build a fresh head section by replacing the meta tags that change
  // per route. The template's <body> and asset references are kept
  // untouched, so the React bundle still boots from the same hashed
  // chunk that vite emitted into dist/assets/.
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeAttr(description)}" />`,
    )
    .replace(
      /<meta name="keywords" content="[^"]*"\s*\/?>/,
      `<meta name="keywords" content="${escapeAttr(keywords)}" />`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${canonicalUrl}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${canonicalUrl}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${escapeAttr(ogTitle)}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${escapeAttr(description)}" />`,
    )
    .replace(
      /<meta name="twitter:url" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:url" content="${canonicalUrl}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    )

  // Replace the per-page hreflang alternates so both surfaces point
  // at this canonical URL — the page is bilingual at one URL.
  html = html
    .replace(
      /<link rel="alternate" hreflang="en" href="[^"]*"\s*\/?>/,
      `<link rel="alternate" hreflang="en" href="${canonicalUrl}" />`,
    )
    .replace(
      /<link rel="alternate" hreflang="sv" href="[^"]*"\s*\/?>/,
      `<link rel="alternate" hreflang="sv" href="${canonicalUrl}" />`,
    )
    .replace(
      /<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/,
      `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`,
    )

  // Drop the WebApplication / WebSite / Organization JSON-LD blocks
  // that ship in the root index.html and replace them with one
  // Article block specific to this pair. Crawlers see exactly one
  // page identity per URL.
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${aName} vs ${bName} — Bitcoin Loan Comparison`,
    url: canonicalUrl,
    description,
    author: { '@type': 'Organization', name: 'Stack & Borrow' },
    publisher: { '@type': 'Organization', name: 'Stack & Borrow' },
    about: [
      { '@type': 'Organization', name: aName },
      { '@type': 'Organization', name: bName },
    ],
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stackandborrow.com/' },
      { '@type': 'ListItem', position: 2, name: 'Lenders', item: 'https://stackandborrow.com/lenders' },
      { '@type': 'ListItem', position: 3, name: `${aName} vs ${bName}`, item: canonicalUrl },
    ],
  }
  // Strip every existing JSON-LD block and inject ours.
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g,
    '',
  )
  const newJsonLd =
    `    <script type="application/ld+json">\n${JSON.stringify(articleJsonLd, null, 2)}\n    </script>\n` +
    `    <script type="application/ld+json">\n${JSON.stringify(breadcrumbJsonLd, null, 2)}\n    </script>\n`
  html = html.replace(/(<link rel="icon")/, `${newJsonLd}    $1`)

  return html
}

// Build the per-lender HTML shell for /lenders/{id}. Mirrors the
// JS-side buildLenderSeo() — title and description must stay
// in sync with what applyRouteSeo() writes client-side, so the
// page identity is the same whether a crawler hits the pre-rendered
// file or the SPA fallback.
function buildLenderHtml(template, lender, totalLenders) {
  const id = lender.id
  const name = lender.name
  const canonicalUrl = `https://stackandborrow.com/lenders/${id}`
  const baseApr = lender.rateTiers?.[0]?.aprPct ?? 0
  const aprStr = baseApr ? `${baseApr.toFixed(2)}% APR` : ''
  const traits = []
  if (lender.btcOnly === true) traits.push('BTC-only')
  if (lender.custodyType === 'multisig') traits.push('multisig')
  if (lender.rehypothecation === 'no') traits.push('no rehypothecation')
  const traitStr = traits.length ? `, ${traits.join(', ')}` : ''

  const title = `${name} Review — Bitcoin-backed Loan Rates | Stack & Borrow`
  const description = `${name} bitcoin-backed loan review: ${aprStr ? aprStr + ', ' : ''}${lender.maxLtv ?? '—'}% max LTV${traitStr}. Independent ranking among ${totalLenders} BTC lenders. Sats-first methodology, custody-risk weighted.`
  const ogTitle = aprStr
    ? `${name} — ${aprStr}${traits.length ? ' · ' + traits.join(' · ') : ''}`
    : `${name} — Bitcoin loan review`
  const keywords = [
    `${name.toLowerCase()} review`,
    `${name.toLowerCase()} bitcoin loan`,
    `${name.toLowerCase()} rates`,
    `${name.toLowerCase()} APR`,
    `${name.toLowerCase()} vs alternatives`,
    'bitcoin-backed lender review',
    'btc loan provider',
  ].join(', ')

  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeAttr(description)}" />`)
    .replace(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${escapeAttr(keywords)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeAttr(ogTitle)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeAttr(description)}" />`)
    .replace(/<meta name="twitter:url" content="[^"]*"\s*\/?>/, `<meta name="twitter:url" content="${canonicalUrl}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeAttr(description)}" />`)

  html = html
    .replace(/<link rel="alternate" hreflang="en" href="[^"]*"\s*\/?>/, `<link rel="alternate" hreflang="en" href="${canonicalUrl}" />`)
    .replace(/<link rel="alternate" hreflang="sv" href="[^"]*"\s*\/?>/, `<link rel="alternate" hreflang="sv" href="${canonicalUrl}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/, `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`)

  // Strip generic JSON-LD blocks and emit lender-specific Article +
  // BreadcrumbList. Crawlers see exactly one entity per URL.
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${name} — Bitcoin-backed loan review`,
    url: canonicalUrl,
    description,
    author: { '@type': 'Organization', name: 'Stack & Borrow' },
    publisher: { '@type': 'Organization', name: 'Stack & Borrow' },
    about: { '@type': 'Organization', name: name },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stackandborrow.com/' },
      { '@type': 'ListItem', position: 2, name: 'Lenders', item: 'https://stackandborrow.com/lenders' },
      { '@type': 'ListItem', position: 3, name: `${name} review`, item: canonicalUrl },
    ],
  }
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '')
  const newJsonLd =
    `    <script type="application/ld+json">\n${JSON.stringify(articleJsonLd, null, 2)}\n    </script>\n` +
    `    <script type="application/ld+json">\n${JSON.stringify(breadcrumbJsonLd, null, 2)}\n    </script>\n`
  html = html.replace(/(<link rel="icon")/, `${newJsonLd}    $1`)

  return html
}

// Build the per-glossary-term HTML shell. Title and description come
// straight from the glossary module so they match what
// buildGlossarySeo() writes client-side.
function buildGlossaryHtml(template, slug, entry) {
  const canonicalUrl = `https://stackandborrow.com/glossary/${slug}`
  const title = `${entry.title} — Bitcoin Loan Glossary | Stack & Borrow`
  const body = entry.body || ''
  const description = body.length <= 160
    ? body
    : body.slice(0, 157).replace(/\s+\S*$/, '') + '…'
  const ogTitle = `${entry.title} — Bitcoin loan glossary`
  const keywords = [
    entry.title.toLowerCase(),
    `${entry.title.toLowerCase()} definition`,
    `${entry.title.toLowerCase()} bitcoin loan`,
    `${entry.title.toLowerCase()} explained`,
    'bitcoin glossary',
  ].join(', ')

  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeAttr(description)}" />`)
    .replace(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${escapeAttr(keywords)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeAttr(ogTitle)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeAttr(description)}" />`)
    .replace(/<meta name="twitter:url" content="[^"]*"\s*\/?>/, `<meta name="twitter:url" content="${canonicalUrl}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeAttr(description)}" />`)

  html = html
    .replace(/<link rel="alternate" hreflang="en" href="[^"]*"\s*\/?>/, `<link rel="alternate" hreflang="en" href="${canonicalUrl}" />`)
    .replace(/<link rel="alternate" hreflang="sv" href="[^"]*"\s*\/?>/, `<link rel="alternate" hreflang="sv" href="${canonicalUrl}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/, `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`)

  const definedTermJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: entry.title,
    description: body,
    url: canonicalUrl,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Stack & Borrow — Bitcoin Loan Glossary',
      url: 'https://stackandborrow.com/about',
    },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stackandborrow.com/' },
      { '@type': 'ListItem', position: 2, name: 'About', item: 'https://stackandborrow.com/about' },
      { '@type': 'ListItem', position: 3, name: entry.title, item: canonicalUrl },
    ],
  }
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '')
  const newJsonLd =
    `    <script type="application/ld+json">\n${JSON.stringify(definedTermJsonLd, null, 2)}\n    </script>\n` +
    `    <script type="application/ld+json">\n${JSON.stringify(breadcrumbJsonLd, null, 2)}\n    </script>\n`
  html = html.replace(/(<link rel="icon")/, `${newJsonLd}    $1`)

  return html
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}
