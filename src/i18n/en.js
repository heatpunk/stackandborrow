// ============================================================
// EN — English source-of-truth strings.
//
// Edit this file when copy changes. Then ask Claude:
//   "translate new/changed strings to sv/de/es/fr/pt"
// Keys are namespaced by area: common.* shared, <page>.* per page,
// glossary.<key>.{title|body} for term definitions.
// ============================================================

export default {
  // ----- COMMON: brand, header, nav, footer, errors -----

  'common.brand.name': 'Stack & Borrow',
  'common.brand.tagline': '· BITCOIN-BACKED LOANS ·',
  'common.header.est': 'EST · {date}',
  'common.header.pageOf': '{current} OF {of}',
  'common.header.issueNumber': 'NO. 000.50K',

  'common.nav.overview': 'OVERVIEW',
  'common.nav.calculator': 'CALCULATOR',
  'common.nav.lenders': 'LENDERS',
  'common.nav.terms': 'TERMS',

  'common.footer.btcSource': '※ Live BTC: {source} · ranked by total cost, not commission.',
  'common.footer.disclaimer': '※ Not financial advice. No data leaves your browser.',
  'common.footer.contact': '※ stackandborrow.com · ',
  'common.footer.dataVerified': '※ Lender data verified {updated}.',

  'common.cta.runCalculator': 'RUN THE CALCULATOR',
  'common.cta.compareLenders': 'COMPARE LENDERS',

  'common.spineLabel': 'STACK & BORROW · BOOKLET · 2026',

  'common.glossary.label': 'GLOSSARY',
  'common.glossary.link': '↗ FULL GLOSSARY',
  'common.glossary.iconLabel': 'What is {term}?',

  'common.theme.dark': '★ DARK · NIGHT MODE · TAP TO SWITCH ',
  'common.theme.light': '★ LIGHT · DAY MODE · TAP TO SWITCH ',
  'common.theme.titleAuto': 'Theme: auto ({theme}) — click to override',
  'common.theme.title': 'Theme: {theme} — click to flip, ⌘-click to match system',

  'common.error.title': 'Something went wrong loading the page.',
  'common.error.unknown': 'Unknown error',
  'common.error.return.before': 'Try ',
  'common.error.return.link': 'returning to the overview',
  'common.error.return.after': ', or open the browser console for details.',

  'common.livePrice.fetching': 'FETCHING…',
  'common.livePrice.retry': 'RETRY ↻',
  'common.livePrice.refresh': 'Refresh',
  'common.livePrice.refreshLabel': 'Refresh live BTC price',

  // ----- ABOUT PAGE -----

  'about.meta.readFirst': 'READ THIS FIRST',
  'about.meta.readTime': '5-MINUTE READ',
  'about.meta.insert': 'INSERT · III · OF III',

  'about.hero.titleLine1': 'Terms of',
  'about.hero.titleLine2': 'philosophy.',
  'about.hero.subtitle': 'A calculator for the question every long-term bitcoiner faces eventually: should I sell some sats, or borrow against them? What follows is how we decided to answer.',

  'about.heroStamp.line1': 'NO',
  'about.heroStamp.line2': 'BS',
  'about.heroStamp.line3': '★ SATS FIRST ★',

  'about.section.principles': 'THE PRINCIPLES',
  'about.section.notForYou': "WHO SHOULDN'T USE THIS",
  'about.section.questions': 'THE QUESTIONS',
  'about.section.signatures': 'SIGNATURES',

  'about.principle.i.title': 'BTC-only first. Then total cost. Period.',
  'about.principle.i.body': 'BTC-only lenders rank above multi-collateral, always. Within each tier, lowest total cost wins — with custody-risk and membership fees baked in. Affiliate commissions never enter the algorithm. If a lender that pays us nothing offers you the best deal, they win.',
  'about.principle.ii.title': 'Sats first. Everything else is a translation.',
  'about.principle.ii.body': 'The headline number is always "sats you keep." Fiat conversions update from live BTC price. You can switch to USD, EUR, SEK and back; the underlying math is denominated in sats.',
  'about.principle.iii.title': 'Tax-aware by default.',
  'about.principle.iii.body': 'To net $N in cash, you must sell enough BTC to cover $N + capital gains tax. We bake the tax into every comparison. You can edit the rate if your jurisdiction differs.',
  'about.principle.iv.title': 'No tracking. No accounts. No data leaves your browser.',
  'about.principle.iv.body': 'Your inputs are saved to localStorage on your device. There are no analytics, no third-party scripts, no signup. The site is a folder of HTML and a JSON of lender rates.',
  'about.principle.v.title': 'Honest about the risks.',
  'about.principle.v.body': 'BTC has dropped >50% from a 12-month high six times since 2013. Borrowing at 50% LTV means a 50% drawdown is your liquidation event. Six times in twelve years is not if but when.',

  'about.warning.heading': '⚠ DO NOT PROCEED IF',
  'about.warning.item1': "You'd be devastated by a 50% BTC drawdown (which has happened six times)",
  'about.warning.item2': "You don't understand rehypothecation and which lenders practice it",
  'about.warning.item3.before': "You're borrowing to ",
  'about.warning.item3.italic': 'buy more bitcoin',
  'about.warning.item3.after': ". That's leverage, not strategy.",

  'about.faq.funding.q': 'Q: How is the site funded?',
  'about.faq.funding.a': 'Some lender links are affiliate. When you click through and take a loan, the lender pays a referral fee. This funds hosting. Ranking is unaffected — pick whichever route you prefer.',
  'about.faq.prices.q': 'Q: Where does the BTC price come from?',
  'about.faq.prices.a': 'mempool.space, polled every five minutes. Fallback is utxoracle.io. If both fail we use a baked-in fallback (visibly marked).',
  'about.faq.rates.q': 'Q: How often are rates updated?',
  'about.faq.rates.a': 'Quarterly target, sooner when a lender shuts down or moves materially. Last verified date is stamped on the calculator footer.',
  'about.faq.feedback.q': 'Q: Found something wrong?',
  'about.faq.feedback.a': 'feedback@stackandborrow.com — short emails get a faster response.',

  'about.sig.signed': '~ signed',
  'about.sig.signedRole': 'THE AUTHOR',
  'about.sig.domainRole': 'DOMAIN OF RECORD',

  'about.verifiedStamp.line1': 'VERIFIED',
  'about.verifiedStamp.line2': 'CALC',
  'about.verifiedStamp.line3': '★ MAY 2026 ★',

  'about.desktop.leftLabel': 'PAGE IV · LEFT — THE PRINCIPLES',
  'about.desktop.rightLabel': 'PAGE IV · RIGHT — CAVEATS, Q&A, SIGNED',

  'about.glossary.intro': 'Plain-language definitions for every term used on this site.',

  // ----- GLOSSARY (used both inline ⓘ and on About page) -----

  'glossary.collateral.title': 'Collateral',
  'glossary.collateral.body': 'The bitcoin you lock with the lender to back the loan. You get it back when you repay. If the BTC price drops far enough, the lender can sell some or all of it to recover the loan — that’s liquidation.',
  'glossary.ltv.title': 'Loan-to-value (LTV)',
  'glossary.ltv.body': 'Loan amount divided by collateral value, as a percent. 50% LTV means borrowing $50K against $100K of bitcoin. The lower the LTV, the more headroom before a price drop triggers liquidation.',
  'glossary.apr.title': 'APR — annual percentage rate',
  'glossary.apr.body': 'The yearly cost of borrowing, expressed as a percent of the loan amount. Includes the interest rate plus any origination fee. 10% APR on a $50K loan is roughly $5,000 per year.',
  'glossary.origination.title': 'Origination fee',
  'glossary.origination.body': 'A one-time fee the lender charges to set up the loan — usually 1–2% of the amount borrowed. Some lenders waive it for borrowers in their home region.',
  'glossary.liquidation.title': 'Liquidation',
  'glossary.liquidation.body': 'A forced sale of your collateral if BTC drops past a set threshold (the “liquidation price”). The lender sells just enough BTC to cover what you owe — but it counts as a taxable sale.',
  'glossary.balloon.title': 'Balloon payment',
  'glossary.balloon.body': 'A loan where you make no monthly payments (or interest-only payments) during the term, and the full principal is due in a single lump sum at maturity. Most bitcoin-backed loans are structured this way.',
  'glossary.sats.title': 'Sats — satoshis',
  'glossary.sats.body': 'The smallest unit of bitcoin. 1 BTC = 100,000,000 sats. This site uses sats so small portions of a bitcoin are easier to compare as whole numbers.',
  'glossary.taxEvent.title': 'Tax event',
  'glossary.taxEvent.body': 'An action that triggers a taxable gain or loss in most jurisdictions. Selling bitcoin is a tax event. Borrowing against bitcoin is not — you still own the BTC, so nothing is realized for tax purposes.',
  'glossary.principal.title': 'Principal',
  'glossary.principal.body': 'The original amount of money borrowed, separate from interest. On a $50K loan with $5K interest, the principal is $50K and the total owed at maturity is $55K.',
  'glossary.interest.title': 'Interest',
  'glossary.interest.body': 'The fee you pay the lender for borrowing money, calculated as a percent (APR) of the principal over time. Most bitcoin-backed loans accrue interest daily and have it paid at maturity.',
  'glossary.custody.title': 'Custody',
  'glossary.custody.body': 'Who holds the bitcoin during the loan. Custodial — the lender (or a third-party custodian) holds it. Multisig — keys are split between you, the lender, and an arbiter, so no single party can move the BTC alone.',
  'glossary.rehypothecation.title': 'Rehypothecation',
  'glossary.rehypothecation.body': 'When a lender re-uses your collateral — for example, lending it out again or pledging it to secure their own borrowing. Increases counterparty risk: if the lender fails, your BTC may be tangled up with their creditors.',
  'glossary.multisig.title': 'Multisig — multi-signature',
  'glossary.multisig.body': 'A bitcoin script that requires more than one private key to move funds. Used in collaborative custody (you + lender + arbiter) so no single party can act alone with your collateral.',
  'glossary.dlc.title': 'DLC — discreet log contract',
  'glossary.dlc.body': 'A bitcoin-native contract design where collateral is locked in a 2-of-2 script and settlement is decided by an oracle (price feed) without a central party. Used by some non-custodial lenders.',
  'glossary.rollover.title': 'Rollover',
  'glossary.rollover.body': 'The umbrella term for not paying off at maturity. Three flavors: revolving (no maturity to roll past), refinance (a fresh loan replaces the old one), or a new contract (you apply again from scratch). Which one your lender offers determines how much friction is involved.',
  'glossary.newContract.title': 'New loan at maturity',
  'glossary.newContract.body': 'Some lenders don’t offer refinance — at maturity you must fully repay, then apply for a new loan from scratch if you want to keep borrowing. Treated as a brand-new transaction: fresh credit check, fresh origination fee, fresh APR. More friction than refinance, but your collateral is still released and returned to you between loans.',
  'glossary.refinance.title': 'Refinance',
  'glossary.refinance.body': 'Replacing your existing loan with a new one at maturity. The lender re-underwrites you, a new APR locks in, and a new origination fee may apply. Your collateral isn’t touched — it just stays put under the new loan. Distinct from a revolving line, which has no maturity to refinance against.',
  'glossary.revolving.title': 'Revolving credit',
  'glossary.revolving.body': 'An open credit line with no fixed maturity date. You repay and re-draw at any time, like a credit card. There’s nothing to refinance because there’s no end date — interest just accrues on whatever balance is outstanding.',
  'glossary.capitalGains.title': 'Capital gains tax',
  'glossary.capitalGains.body': 'Tax on the profit from selling an asset that has appreciated. Selling BTC at a higher price than you bought it triggers capital gains tax in most jurisdictions. Rates and rules vary by country.',
};
