import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { rankLenders, minLoanUsdFor } from '../src/lib/math.js';

const data = JSON.parse(await readFile(new URL('../public/lenders.json', import.meta.url)));
const lenders = data.lenders;
const strike = lenders.find((l) => l.id === 'strike');

// Static FX matching src/system/tokens.js CURRENCY_META fallbacks.
const meta = { EUR: { fxToUsd: 1.08 }, GBP: { fxToUsd: 1.27 }, USD: { fxToUsd: 1.0 } };

test('Strike keeps the stale US-rate claim out of its notes (rates equalized Oct 2026)', () => {
  assert.ok(!/1% lower/i.test(strike.notes), 'notes must not claim US rates start 1% lower');
});

test('Strike carries region-aware minimums in native currency', () => {
  assert.equal(strike.minLoanByRegion.eu.amount, 5000);
  assert.equal(strike.minLoanByRegion.eu.currency, 'EUR');
  assert.equal(strike.minLoanByRegion.uk.amount, 5000);
  assert.equal(strike.minLoanByRegion.uk.currency, 'GBP');
  assert.equal(strike.minLoanUsd, 10000, 'US/global fallback stays $10,000');
});

test('minLoanUsdFor converts the regional threshold with live FX', () => {
  assert.equal(minLoanUsdFor(strike, 'eu', meta), 5000 * 1.08);
  assert.equal(minLoanUsdFor(strike, 'uk', meta), 5000 * 1.27);
  // ch falls back to eu eligibility but has no own threshold -> global USD min
  assert.equal(minLoanUsdFor(strike, 'us', meta), 10000);
  assert.equal(minLoanUsdFor(strike, 'global', meta), 10000);
});

test('minLoanUsdFor falls back safely without FX or without the field', () => {
  assert.equal(minLoanUsdFor(strike, 'eu', undefined), 10000);
  assert.equal(minLoanUsdFor(strike, 'eu', {}), 10000);
  const plain = { minLoanUsd: 700 };
  assert.equal(minLoanUsdFor(plain, 'eu', meta), 700);
  assert.equal(minLoanUsdFor({}, 'eu', meta), 0);
});

test('a €5,000-equivalent loan qualifies for Strike in the EU but not in the US', () => {
  const loanUsd = 5000 * 1.08; // exactly the EEA minimum
  const base = { loanUsd, ltvPct: 50, termMonths: 12, currencyMeta: meta };
  const eu = rankLenders(lenders, { ...base, region: 'eu' });
  const us = rankLenders(lenders, { ...base, region: 'us' });
  assert.ok(eu.some((l) => l.id === 'strike'), 'Strike must be eligible at €5,000 in the EU');
  assert.ok(!us.some((l) => l.id === 'strike'), 'Strike must NOT be eligible at $5,400 in the US');
});

test('a $9,999 loan still fails the US minimum, $10,000 passes', () => {
  const base = { region: 'us', ltvPct: 50, termMonths: 12, currencyMeta: meta };
  assert.ok(!rankLenders(lenders, { ...base, loanUsd: 9999 }).some((l) => l.id === 'strike'));
  assert.ok(rankLenders(lenders, { ...base, loanUsd: 10000 }).some((l) => l.id === 'strike'));
});

test('ranked entries expose minLoanUsdEffective for display pages', () => {
  const ranked = rankLenders([strike], {
    loanUsd: 6000, region: 'eu', ltvPct: 50, termMonths: 12,
    eligibleOnly: false, currencyMeta: meta,
  });
  assert.equal(ranked[0].minLoanUsdEffective, 5000 * 1.08);
  const usRanked = rankLenders([strike], {
    loanUsd: 6000, region: 'us', ltvPct: 50, termMonths: 12,
    eligibleOnly: false, currencyMeta: meta,
  });
  assert.equal(usRanked[0].minLoanUsdEffective, 10000);
});

test('without currencyMeta the old global behavior is preserved (no crash, USD fallback)', () => {
  const ranked = rankLenders(lenders, { loanUsd: 6000, region: 'eu', ltvPct: 50, termMonths: 12 });
  assert.ok(!ranked.some((l) => l.id === 'strike'), 'falls back to $10,000 when FX is unavailable');
});

test('Arch rollover copy describes the verified one-click rollover (issue #29)', () => {
  const arch = lenders.find((l) => l.id === 'arch');
  assert.match(arch.rollover, /one-click rollover/i);
  assert.match(arch.rollover, /3 months of maturity/i);
  assert.match(arch.rollover, /12 months/);
  assert.match(arch.rollover, /65%/);
  assert.match(arch.term, /1–12 months/);
  // The long-view math keys off rolloverEase; origination fee still applies
  // on rollover (folded into the balance), so 'approval' remains correct.
  assert.equal(arch.rolloverEase, 'approval');
});
