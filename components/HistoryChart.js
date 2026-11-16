'use client';
import { useId, useMemo } from 'react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { SENSORS, STATUS_STYLE, formatValue } from '@/lib/sensorMeta';

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

/* Round the axis to friendly numbers (e.g. 24 / 28 / 32 / 36 instead of 23.8 / 27.8 / ...). */
function niceAxis(lo, hi, target = 4) {
  const raw = Math.max((hi - lo) / target, 1e-6);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= raw) || mag * 10;
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(+v.toFixed(4));
  return { domain: [min, max], ticks };
}

/* Dots only for readings that left the safe range, so problems stand out on the line. */
function StatusDot({ cx, cy, payload }) {
  if (cx == null || cy == null || !payload) return null;
  if (payload.status !== 'WARNING' && payload.status !== 'DANGER') return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill={STATUS_STYLE[payload.status].hex}
      stroke="rgb(var(--surface))"
      strokeWidth={1.5}
    />
  );
}

function ChartTooltip({ active, payload, sensorKey }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  if (p.value === null || p.value === undefined) return null; // hovering inside a data gap
  const meta = SENSORS[sensorKey];
  const st = STATUS_STYLE[p.status] || STATUS_STYLE.UNKNOWN;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lift">
      <div className="text-muted">{new Date(p.t).toLocaleString()}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: st.hex }} />
        <span className="text-base font-semibold tabular-nums text-fg">
          {formatValue(sensorKey, p.value)} {meta?.unit}
        </span>
        <span className={`font-medium ${st.text}`}>{st.label}</span>
      </div>
    </div>
  );
}

/*
 * Historical chart for one sensor.
 *  data       = [{ timestamp, value, status }, ...] chronological
 *  thresholds = backend limits; the safe zone is shaded, warn limits dashed
 *  range      = '1h' | '6h' | '24h' | '7d' | '30d' (controls axis labels)
 */
export default function HistoryChart({ sensorKey, data = [], thresholds, range = '24h', long: longProp, height = 288 }) {
  const meta = SENSORS[sensorKey] || {};
  const gid = useId().replace(/:/g, '');

  const points = useMemo(() => {
    const rows = data.map((d) => ({
      t: new Date(d.timestamp).getTime(),
      value: isNum(d.value) ? d.value : null,
      status: d.status,
    }));
    // Missing data must look missing: where consecutive readings are much further apart than
    // usual (device offline, no uploads) insert an empty point so the line BREAKS instead of
    // drawing a misleading straight line across the gap.
    if (rows.length < 3) return rows;
    const deltas = rows.slice(1).map((r, i) => r.t - rows[i].t).sort((a, b) => a - b);
    const median = deltas[Math.floor(deltas.length / 2)] || 60000;
    const limit = Math.max(median * 4, 5 * 60000);
    const out = [rows[0]];
    for (let i = 1; i < rows.length; i += 1) {
      if (rows[i].t - rows[i - 1].t > limit) out.push({ t: rows[i - 1].t + median, value: null, status: undefined, gap: true });
      out.push(rows[i]);
    }
    return out;
  }, [data]);

  // Length of the unbroken run of readings each point belongs to (0 for gap markers). A run of
  // only a few readings between gaps is too short to see as a line, so those get dots.
  const runLength = useMemo(() => {
    const out = new Array(points.length).fill(0);
    let start = 0;
    for (let i = 0; i <= points.length; i += 1) {
      if (i === points.length || points[i].value == null) {
        for (let j = start; j < i; j += 1) out[j] = i - start;
        start = i + 1;
      }
    }
    return out;
  }, [points]);

  // With hundreds of points, a dot per out-of-range reading looks like beads on a string;
  // the shaded safe band and dashed limits already show excursions, so dots are for sparse data.
  const showDots = points.filter((p) => !p.gap).length <= 60;

  const long = typeof longProp === 'boolean' ? longProp : range === '7d' || range === '30d';
  const fmtTick = (t) =>
    long
      ? new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short' })
      : new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Keep the safe band in view even when readings sit far from it.
  const axis = useMemo(() => {
    const vals = points.map((p) => p.value).filter(isNum);
    const t = thresholds || {};
    const lows = [...vals, isNum(t.safeLow) ? t.safeLow : null].filter(isNum);
    const highs = [...vals, isNum(t.safeHigh) ? t.safeHigh : null].filter(isNum);
    if (!lows.length) return { domain: ['auto', 'auto'], ticks: undefined };
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    const pad = (hi - lo || 1) * 0.1;
    const nice = niceAxis(lo - pad, hi + pad);
    // Readings are never negative for these sensors.
    if (nice.domain[0] < 0) {
      nice.domain[0] = 0;
      nice.ticks = nice.ticks.filter((t) => t >= 0);
    }
    return nice;
  }, [points, thresholds]);
  const domain = axis.domain;

  const color = meta.color || '#0ea5e9';
  const t = thresholds || {};
  const bandLow = isNum(t.safeLow) ? t.safeLow : domain[0];
  const bandHigh = isNum(t.safeHigh) ? t.safeHigh : domain[1];

  return (
    <div className="w-full" style={{ height }} role="img" aria-label={`${meta.label} history chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.14} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
          {isNum(Number(bandLow)) && isNum(Number(bandHigh)) && (
            <ReferenceArea y1={bandLow} y2={bandHigh} fill="#10b981" fillOpacity={0.12} />
          )}
          {isNum(t.warnLow) && (
            <ReferenceLine y={t.warnLow} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.55} />
          )}
          {isNum(t.warnHigh) && (
            <ReferenceLine y={t.warnHigh} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.55} />
          )}
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={fmtTick}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgb(var(--line))' }}
            minTickGap={48}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            width={48}
            domain={domain}
            ticks={axis.ticks}
            interval={0}
            tickLine={false}
            axisLine={false}
            allowDecimals
            tickFormatter={(v) => +Number(v).toFixed(2)}
          />
          <Tooltip
            content={<ChartTooltip sensorKey={sensorKey} />}
            cursor={{ stroke: 'rgb(var(--subtle))', strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.2}
            fill={`url(#${gid})`}
            dot={(dp) => {
              // Dots: out-of-range readings on sparse data, and ANY isolated reading (a lone point
              // between gaps would otherwise be invisible).
              const { cx, cy, index, payload } = dp;
              if (cx == null || cy == null || !payload || payload.value == null) return null;
              const isolated = runLength[index] > 0 && runLength[index] <= 3; // tiny island between gaps
              const bad = payload.status === 'WARNING' || payload.status === 'DANGER';
              if (!isolated && !(showDots && bad)) return null;
              return <circle key={`dot-${index}`} cx={cx} cy={cy} r={isolated ? 3.5 : 3.5} fill={bad ? STATUS_STYLE[payload.status].hex : color} stroke="rgb(var(--surface))" strokeWidth={1.5} />;
            }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgb(var(--surface))' }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
