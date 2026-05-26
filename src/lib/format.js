// ============================================================
// FORMAT — display helpers. Pure functions, no React.
// ============================================================

// Non-breaking space — used between thousands and before unit/currency
// suffixes so the number and its unit can't be split across lines.
const NBSP = ' ';

export const SATS_PER_BTC = 100_000_000;

// Format an integer with non-breaking-space thousands separators.
// fmtNum(1234567) → "1 234 567"
export function fmtNum(n) {
  if (n == null || isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  return sign + abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

// Format sats — falls back to BTC at large values.
export function fmtSats(sats) {
  if (sats == null || isNaN(sats)) return '—';
  if (Math.abs(sats) >= 1e8) return (sats / 1e8).toFixed(4) + NBSP + 'BTC';
  return fmtNum(sats) + NBSP + 'sats';
}

// Format an amount expressed in USD into the given currency.
// fmtMoney(50000, "EUR") → "€46 296"
export function fmtMoney(usd, currency, currencyMeta, btcSpotUsd) {
  if (usd == null || isNaN(usd)) return '—';
  if (currency === 'SAT') {
    return fmtSats((usd / btcSpotUsd) * SATS_PER_BTC);
  }
  const meta = currencyMeta[currency];
  if (!meta) return '$' + fmtNum(usd);
  const val = usd / meta.fxToUsd;
  if (meta.position === 'post') return fmtNum(val) + NBSP + meta.symbol;
  return meta.symbol + fmtNum(val);
}

// Compact money formatter in the chosen currency: $1.42M, €1.31M, 14.2M kr,
// 1.42 BTC. Falls back to USD when no currency is supplied. Pass `dp` to
// override the default decimal precision (default: 2 for B/M, 1 for K).
export function fmtMoneyCompact(usd, currency, currencyMeta, btcSpotUsd, dp) {
  if (usd == null || isNaN(usd)) return '—';

  if (currency === 'SAT' && btcSpotUsd) {
    return fmtSatsCompact((usd / btcSpotUsd) * SATS_PER_BTC);
  }

  const meta = currency && currencyMeta ? currencyMeta[currency] : null;
  const fx = meta && meta.fxToUsd ? meta.fxToUsd : 1;
  const symbol = meta ? meta.symbol : '$';
  const position = meta ? meta.position : 'pre';

  const val = usd / fx;
  const sign = val < 0 ? '−' : '';
  const abs = Math.abs(val);
  let body;
  if (abs >= 1e9)      body = (abs / 1e9).toFixed(dp != null ? dp : 2) + 'B';
  else if (abs >= 1e6) body = (abs / 1e6).toFixed(dp != null ? dp : 2) + 'M';
  else if (abs >= 1e3) body = (abs / 1e3).toFixed(dp != null ? dp : 1) + 'K';
  else                 body = abs.toFixed(0);

  return position === 'post' ? sign + body + ' ' + symbol : sign + symbol + body;
}

// Compact sats formatter — switches to BTC at >= 0.1 BTC for readability.
function fmtSatsCompact(sats) {
  if (sats == null || isNaN(sats)) return '—';
  const sign = sats < 0 ? '−' : '';
  const abs = Math.abs(sats);
  if (abs >= 1e7) return sign + (abs / 1e8).toFixed(2) + ' BTC';
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M sats';
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K sats';
  return sign + Math.round(abs) + ' sats';
}

// Format a percentage with sign.
// fmtPct(29) → "+29.00%"
export function fmtPct(n, dp = 2) {
  if (n == null || isNaN(n)) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(dp) + '%';
}
