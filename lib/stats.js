const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

/** Keep at most `max` evenly spaced points (for sparklines). */
export function downsample(arr, max = 40) {
  if (arr.length <= max) return arr;
  const step = (arr.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => arr[Math.round(i * step)]);
}

/** Summary stats for [{ value, status }] series. */
export function summarize(points = []) {
  const vals = points.map((p) => p.value).filter(isNum);
  if (!vals.length) return { count: 0, min: null, max: null, avg: null, safePct: null };
  const sum = vals.reduce((a, b) => a + b, 0);
  const withStatus = points.filter((p) => p.status && p.status !== 'UNKNOWN');
  const safePct = withStatus.length
    ? Math.round((withStatus.filter((p) => p.status === 'SAFE').length / withStatus.length) * 100)
    : null;
  return {
    count: vals.length,
    min: Math.min(...vals),
    max: Math.max(...vals),
    avg: sum / vals.length,
    safePct,
  };
}

/** Change between first and last finite value. */
export function trendOf(values) {
  const v = values.filter(isNum);
  if (v.length < 2) return null;
  return v[v.length - 1] - v[0];
}
