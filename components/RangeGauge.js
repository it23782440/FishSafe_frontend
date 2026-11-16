import { SENSORS, STATUS_STYLE, safeRangeText, formatValue } from '@/lib/sensorMeta';

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

/* Build coloured zones (danger | warning | safe | warning | danger) clipped to the gauge domain. */
function zones(th, [lo, hi]) {
  const wl = isNum(th.warnLow) ? th.warnLow : -Infinity;
  const sl = isNum(th.safeLow) ? th.safeLow : -Infinity;
  const sh = isNum(th.safeHigh) ? th.safeHigh : Infinity;
  const wh = isNum(th.warnHigh) ? th.warnHigh : Infinity;
  const raw = [
    [lo, wl, 'DANGER'],
    [wl, sl, 'WARNING'],
    [sl, sh, 'SAFE'],
    [sh, wh, 'WARNING'],
    [wh, hi, 'DANGER'],
  ];
  return raw
    .map(([a, b, status]) => [Math.max(a, lo), Math.min(b, hi), status])
    .filter(([a, b]) => b > a);
}

/*
 * Horizontal gauge showing where the current value sits relative to the
 * safe / warning / danger zones. `thresholds` comes from the backend.
 */
export default function RangeGauge({ sensorKey, value, thresholds, status, showScale = false }) {
  const meta = SENSORS[sensorKey];
  if (!meta || !thresholds) return null;
  const [lo, hi] = meta.domain;
  const span = hi - lo;
  const pct = (n) => ((Math.min(Math.max(n, lo), hi) - lo) / span) * 100;
  const hasValue = isNum(Number(value)) && value !== null && value !== undefined;
  const marker = hasValue ? pct(Number(value)) : null;
  const color = (STATUS_STYLE[status] || STATUS_STYLE.UNKNOWN).hex;
  const label = hasValue
    ? `${meta.label} ${formatValue(sensorKey, value)} ${meta.unit}, safe range ${safeRangeText(sensorKey, thresholds)}`
    : `${meta.label}: no reading`;

  return (
    <div role="img" aria-label={label}>
      <div className="relative h-2 rounded-full overflow-hidden flex bg-line">
        {zones(thresholds, meta.domain).map(([a, b, st]) => (
          <div
            key={`${a}-${st}`}
            className="h-full"
            style={{
              width: `${((b - a) / span) * 100}%`,
              background: STATUS_STYLE[st].hex,
              opacity: st === 'SAFE' ? 0.45 : 0.28,
            }}
          />
        ))}
      </div>
      {marker !== null && (
        <div className="relative h-0">
          <span
            className="absolute -top-[13px] block h-[18px] w-[6px] -translate-x-1/2 rounded-full border-2 border-surface shadow"
            style={{ left: `${marker}%`, background: color }}
          />
        </div>
      )}
      {showScale && (
        <div className="relative mt-3 h-4 text-[11px] text-muted tabular-nums">
          <span className="absolute left-0">{lo}</span>
          {isNum(thresholds.safeLow) && (
            <span className="absolute -translate-x-1/2" style={{ left: `${pct(thresholds.safeLow)}%` }}>
              {thresholds.safeLow}
            </span>
          )}
          {isNum(thresholds.safeHigh) && (
            <span className="absolute -translate-x-1/2" style={{ left: `${pct(thresholds.safeHigh)}%` }}>
              {thresholds.safeHigh}
            </span>
          )}
          <span className="absolute right-0">{hi}</span>
        </div>
      )}
    </div>
  );
}
