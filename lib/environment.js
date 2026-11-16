/*
 * Reusable environmental classification utility (client side).
 *
 * The backend is the single source of truth for statuses shown on every page.
 * This module mirrors its rules so the UI can PREVIEW a value against a set of
 * limits (e.g. the "test a value" box when editing a species) and share labels.
 * Rules (identical to backend/src/services/statusService.js):
 *   outside [warnLow, warnHigh]                    -> DANGER
 *   outside [safeLow, safeHigh]                    -> WARNING
 *   within warnMargin of safeLow / safeHigh        -> WARNING (approaching a limit)
 *   otherwise                                      -> SAFE
 * Overall = worst of the parameters; missing data is UNKNOWN, never SAFE.
 */
export const RANK = { DANGER: 3, WARNING: 2, UNKNOWN: 1, SAFE: 0 };

export const ZONE_TITLE = {
  SAFE: 'SAFE ZONE',
  WARNING: 'WARNING ZONE',
  DANGER: 'DANGEROUS ZONE',
  UNKNOWN: 'STATUS UNKNOWN',
};

/** Parameter-level wording: DANGER reads CRITICAL. Text is always shown, never colour alone. */
export const PARAM_LABEL = { SAFE: 'SAFE', WARNING: 'WARNING', DANGER: 'CRITICAL', UNKNOWN: 'UNKNOWN' };

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const lo = (v) => (isNum(v) ? v : -Infinity);
const hi = (v) => (isNum(v) ? v : Infinity);

export function classifyValue(value, t) {
  if (!isNum(value) || !t) return 'UNKNOWN';
  if (value < lo(t.warnLow) || value > hi(t.warnHigh)) return 'DANGER';
  if (value < lo(t.safeLow) || value > hi(t.safeHigh)) return 'WARNING';
  const m = t.warnMargin || 0;
  if (m > 0 && (value < lo(t.safeLow) + m || value > hi(t.safeHigh) - m)) return 'WARNING';
  return 'SAFE';
}

export function worstStatus(list) {
  return list.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'SAFE');
}

export const overallFrom = (temperatureStatus, phStatus) => worstStatus([temperatureStatus, phStatus]);

/** Validate an editable threshold block. Returns an error string or ''. */
export function validateRange(name, r, { min = -Infinity, max = Infinity } = {}) {
  const f = ['warnLow', 'safeLow', 'safeHigh', 'warnHigh'].map((k) => (r[k] === '' || r[k] == null ? NaN : Number(r[k])));
  if (f.some((x) => Number.isNaN(x))) return `${name}: fill in all four limits.`;
  const [wl, sl, sh, wh] = f;
  if (!(wl <= sl && sl < sh && sh <= wh)) return `${name}: limits must satisfy danger-low ≤ safe-low < safe-high ≤ danger-high.`;
  if (f.some((x) => x < min || x > max)) return `${name}: values must be between ${min} and ${max}.`;
  const m = r.warnMargin === '' || r.warnMargin == null ? 0 : Number(r.warnMargin);
  if (Number.isNaN(m) || m < 0) return `${name}: the warning margin must be 0 or more.`;
  if (m >= (sh - sl) / 2) return `${name}: the warning margin must be smaller than half the recommended range.`;
  return '';
}
