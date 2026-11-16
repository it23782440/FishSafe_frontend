/*
 * Presentation metadata for the five sensors. Keys MUST match the backend
 * field names (temperature, ph, turbidity, rain, conductivity).
 *
 * Safe/warning limits shown in the UI come from the backend
 * (GET /api/config/thresholds, see useThresholds). FALLBACK_THRESHOLDS below
 * only mirrors backend/src/config/thresholds.js so the page still renders
 * sensibly while that request is loading or if it fails.
 */
export const SENSORS = {
  temperature: {
    key: 'temperature',
    label: 'Temperature',
    short: 'Temp',
    unit: '°C',
    color: '#ef4444',
    decimals: 1,
    source: 'Proposal (tilapia)',
    domain: [18, 40], // visual scale for the range gauge
    blurb: 'Drives fish metabolism and how much oxygen the water can hold.',
  },
  ph: {
    key: 'ph',
    label: 'pH Level',
    short: 'pH',
    unit: '',
    color: '#8b5cf6',
    decimals: 2,
    source: 'Proposal',
    domain: [5, 10],
    blurb: 'Acidity of the water. Extremes stress fish and change how toxic ammonia is.',
  },
  turbidity: {
    key: 'turbidity',
    label: 'Turbidity',
    short: 'Turbidity',
    unit: 'NTU',
    color: '#0ea5e9',
    decimals: 1,
    source: 'Assumption',
    domain: [0, 50],
    blurb: 'Cloudiness from suspended particles, algae or runoff.',
  },
  rain: {
    key: 'rain',
    label: 'Rain',
    short: 'Rain',
    unit: '%',
    color: '#3b82f6',
    decimals: 0,
    source: 'Assumption',
    domain: [0, 100],
    blurb: 'Rain detected on the floating device. Heavy rain can dilute and cool the pond.',
  },
  conductivity: {
    key: 'conductivity',
    label: 'Conductivity / TDS',
    short: 'TDS',
    unit: 'ppm',
    color: '#f59e0b',
    decimals: 0,
    source: 'Assumption',
    domain: [0, 1200],
    blurb: 'Total dissolved solids. Sudden shifts can signal runoff or contamination.',
  },
};

export const SENSOR_KEYS = Object.keys(SENSORS);

// null = "no bound on that side" (the backend uses -Infinity, which JSON turns into null).
export const FALLBACK_THRESHOLDS = {
  temperature: { warnLow: 23, safeLow: 25, safeHigh: 32, warnHigh: 34 },
  ph: { warnLow: 6.0, safeLow: 6.5, safeHigh: 8.5, warnHigh: 9.0 },
  turbidity: { warnLow: null, safeLow: null, safeHigh: 25, warnHigh: 40 },
  rain: { warnLow: null, safeLow: null, safeHigh: 50, warnHigh: 80 },
  conductivity: { warnLow: 50, safeLow: 100, safeHigh: 800, warnHigh: 1000 },
};

export function formatValue(sensorKey, value) {
  const meta = SENSORS[sensorKey];
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(meta ? meta.decimals : 1);
}

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

/** Human readable safe range, e.g. "25 – 32 °C" or "≤ 25 NTU". */
export function safeRangeText(sensorKey, th) {
  const meta = SENSORS[sensorKey];
  const t = th || FALLBACK_THRESHOLDS[sensorKey];
  if (!meta || !t) return '—';
  const unit = meta.unit ? ` ${meta.unit}` : '';
  const d = meta.decimals;
  const lo = isNum(t.safeLow) ? Number(t.safeLow.toFixed(d)) : null;
  const hi = isNum(t.safeHigh) ? Number(t.safeHigh.toFixed(d)) : null;
  if (lo !== null && hi !== null) return `${lo} – ${hi}${unit}`;
  if (hi !== null) return `≤ ${hi}${unit}`;
  if (lo !== null) return `≥ ${lo}${unit}`;
  return '—';
}

/*
 * Status styling. Each status carries colour AND a glyph so meaning never
 * depends on colour alone (colour-blind friendly).
 * `hex` is for SVG/Recharts where Tailwind classes can't be used.
 */
export const STATUS_STYLE = {
  SAFE: {
    label: 'Safe',
    glyph: 'check',
    hex: '#10b981',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-100 dark:bg-emerald-500/15',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    border: 'border-emerald-300/70 dark:border-emerald-500/30',
    hero: 'from-emerald-500/15 dark:from-emerald-400/10',
  },
  WARNING: {
    label: 'Warning',
    glyph: 'alert',
    hex: '#f59e0b',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-500/15',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    border: 'border-amber-300/80 dark:border-amber-500/35',
    hero: 'from-amber-500/20 dark:from-amber-400/10',
  },
  DANGER: {
    label: 'Danger',
    glyph: 'x',
    hex: '#ef4444',
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-100 dark:bg-red-500/15',
    dot: 'bg-red-500',
    bar: 'bg-red-500',
    border: 'border-red-300/80 dark:border-red-500/40',
    hero: 'from-red-500/20 dark:from-red-400/10',
  },
  UNKNOWN: {
    label: 'Unknown',
    glyph: 'dash',
    hex: '#94a3b8',
    text: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-500/15',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400',
    border: 'border-slate-300/70 dark:border-slate-600/50',
    hero: 'from-slate-500/10 dark:from-slate-400/10',
  },
};

export const statusOf = (s) => STATUS_STYLE[s] || STATUS_STYLE.UNKNOWN;
