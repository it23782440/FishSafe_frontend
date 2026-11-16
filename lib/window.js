/*
 * Time-window helpers shared by Analytics, species pages and Historical Records.
 * A window is either a preset { range: '24h' | '7d' | '30d' | ... } or a custom
 * { from: ISO, to: ISO } pair. The backend accepts both.
 */
export const PRESETS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export const MAX_CUSTOM_DAYS = 366;

export const presetWindow = (range) => ({ range });

export function windowQuery(win) {
  if (win.from && win.to) return `from=${encodeURIComponent(win.from)}&to=${encodeURIComponent(win.to)}`;
  return `range=${win.range || '24h'}`;
}

export const isCustom = (win) => !!(win.from && win.to);

/** Approximate length of a window in hours (for axis formatting). */
export function windowHours(win) {
  if (isCustom(win)) return (new Date(win.to) - new Date(win.from)) / 3600000;
  return { '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720 }[win.range] || 24;
}

export function windowLabel(win) {
  if (isCustom(win)) {
    const f = (d) => new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    return `${f(win.from)} – ${f(win.to)}`;
  }
  return PRESETS.find((p) => p.value === win.range)?.label || win.range;
}

const pad = (n) => String(n).padStart(2, '0');
export const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Turn two <input type="date"> values (local dates) into a custom window:
 * start of the first day to the end of the last day (or "now" if that is today).
 * Returns { error } for invalid input, otherwise { window }.
 */
export function customWindow(fromStr, toStr, now = new Date()) {
  if (!fromStr || !toStr) return { error: 'Choose both a start and an end date.' };
  const from = new Date(`${fromStr}T00:00:00`);
  let to = new Date(`${toStr}T23:59:59.999`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return { error: 'Enter valid dates.' };
  if (from > now) return { error: 'The start date cannot be in the future.' };
  if (to > now) to = now;
  if (from >= to) return { error: 'The start date must be before the end date.' };
  if (to - from > MAX_CUSTOM_DAYS * 86400000) return { error: `Choose a range of at most ${MAX_CUSTOM_DAYS} days.` };
  return { window: { from: from.toISOString(), to: to.toISOString() } };
}
