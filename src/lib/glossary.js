// ============================================================
// GLOSSARY — single source of truth for term definitions.
// Used by:
//   - InfoIcon popovers (inline ⓘ on result tables)
//   - Glossary section on the About page (full alphabetical list)
// Keys here are referenced by the page wiring; do not rename
// without updating callers.
// ============================================================

export const GLOSSARY = {
  collateral: {
    title: 'Collateral',
    body: 'The bitcoin you lock with the lender to back the loan. You get it back when you repay. If the BTC price drops far enough, the lender can sell some or all of it to recover the loan — that’s liquidation.',
  },
  ltv: {
    title: 'Loan-to-value (LTV)',
    body: 'Loan amount divided by collateral value, as a percent. 50% LTV means borrowing $50K against $100K of bitcoin. The lower the LTV, the more headroom before a price drop triggers liquidation.',
  },
  apr: {
    title: 'APR — annual percentage rate',
    body: 'The yearly cost of borrowing, expressed as a percent of the loan amount. Includes the interest rate plus any origination fee. 10% APR on a $50K loan is roughly $5,000 per year.',
  },
  origination: {
    title: 'Origination fee',
    body: 'A one-time fee the lender charges to set up the loan — usually 1–2% of the amount borrowed. Some lenders waive it for borrowers in their home region.',
  },
  liquidation: {
    title: 'Liquidation',
    body: 'A forced sale of your collateral if BTC drops past a set threshold (the “liquidation price”). The lender sells just enough BTC to cover what you owe — but it counts as a taxable sale.',
  },
  longView: {
    title: 'Long view',
    body: 'Projects what your loan looks like after multiple yearly rollovers. Assumes the top-ranked lender keeps refinancing you at the same APR and origination policy. A useful sanity check, not a forecast — real rates, BTC prices, and lender terms will all drift over time.',
  },
  balloon: {
    title: 'Balloon payment',
    body: 'A loan where you make no monthly payments (or interest-only payments) during the term, and the full principal is due in a single lump sum at maturity. Most bitcoin-backed loans are structured this way.',
  },
  sats: {
    title: 'Sats — satoshis',
    body: 'The smallest unit of bitcoin. 1 BTC = 100,000,000 sats. This site uses sats so small portions of a bitcoin are easier to compare as whole numbers.',
  },
  taxEvent: {
    title: 'Tax event',
    body: 'An action that triggers a taxable gain or loss in most jurisdictions. Selling bitcoin is a tax event. Borrowing against bitcoin is not — you still own the BTC, so nothing is realized for tax purposes.',
  },
  principal: {
    title: 'Principal',
    body: 'The original amount of money borrowed, separate from interest. On a $50K loan with $5K interest, the principal is $50K and the total owed at maturity is $55K.',
  },
  interest: {
    title: 'Interest',
    body: 'The fee you pay the lender for borrowing money, calculated as a percent (APR) of the principal over time. Most bitcoin-backed loans accrue interest daily and have it paid at maturity.',
  },

  // ----- deeper terms (only in About glossary, not inline) -----

  custody: {
    title: 'Custody',
    body: 'Who holds the bitcoin during the loan. Custodial — the lender (or a third-party custodian) holds it. Multisig — keys are split between you, the lender, and an arbiter, so no single party can move the BTC alone.',
  },
  rehypothecation: {
    title: 'Rehypothecation',
    body: 'When a lender re-uses your collateral — for example, lending it out again or pledging it to secure their own borrowing. Increases counterparty risk: if the lender fails, your BTC may be tangled up with their creditors.',
  },
  multisig: {
    title: 'Multisig — multi-signature',
    body: 'A bitcoin script that requires more than one private key to move funds. Used in collaborative custody (you + lender + arbiter) so no single party can act alone with your collateral.',
  },
  dlc: {
    title: 'DLC — discreet log contract',
    body: 'A bitcoin-native contract design where collateral is locked in a 2-of-2 script and settlement is decided by an oracle (price feed) without a central party. Used by some non-custodial lenders.',
  },
  rollover: {
    title: 'Rollover',
    body: 'The umbrella term for not paying off at maturity. Three flavors: revolving (no maturity to roll past), refinance (a fresh loan replaces the old one), or a new contract (you apply again from scratch). Which one your lender offers determines how much friction is involved.',
  },
  newContract: {
    title: 'New loan at maturity',
    body: 'Some lenders don’t offer refinance — at maturity you must fully repay, then apply for a new loan from scratch if you want to keep borrowing. Treated as a brand-new transaction: fresh credit check, fresh origination fee, fresh APR. More friction than refinance, but your collateral is still released and returned to you between loans.',
  },
  refinance: {
    title: 'Refinance',
    body: 'Replacing your existing loan with a new one at maturity. The lender re-underwrites you, a new APR locks in, and a new origination fee may apply. Your collateral isn’t touched — it just stays put under the new loan. Distinct from a revolving line, which has no maturity to refinance against.',
  },
  revolving: {
    title: 'Revolving credit',
    body: 'An open credit line with no fixed maturity date. You repay and re-draw at any time, like a credit card. There’s nothing to refinance because there’s no end date — interest just accrues on whatever balance is outstanding.',
  },
  capitalGains: {
    title: 'Capital gains tax',
    body: 'Tax on the profit from selling an asset that has appreciated. Selling BTC at a higher price than you bought it triggers capital gains tax in most jurisdictions. Rates and rules vary by country.',
  },
};

// Alphabetical-by-title order for the About glossary section.
export const GLOSSARY_ORDER = [
  'apr',
  'balloon',
  'capitalGains',
  'collateral',
  'custody',
  'dlc',
  'interest',
  'liquidation',
  'longView',
  'ltv',
  'multisig',
  'newContract',
  'origination',
  'principal',
  'refinance',
  'rehypothecation',
  'revolving',
  'rollover',
  'sats',
  'taxEvent',
];
