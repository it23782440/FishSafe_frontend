'use client';
import { useState } from 'react';
import { PRESETS, customWindow, isCustom, toDateInput } from '@/lib/window';
import { CalendarIcon } from './Icons';

/* Preset ranges + a validated custom date range. `value` / `onChange` use lib/window.js windows. */
export default function DateRangePicker({ value, onChange, presets = PRESETS }) {
  const today = new Date();
  const week = new Date(Date.now() - 6 * 86400000);
  const [open, setOpen] = useState(isCustom(value));
  const [from, setFrom] = useState(toDateInput(week));
  const [to, setTo] = useState(toDateInput(today));
  const [error, setError] = useState('');
  const custom = isCustom(value);

  const apply = () => {
    const r = customWindow(from, to);
    if (r.error) return setError(r.error);
    setError('');
    onChange(r.window);
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="segmented max-w-full flex-wrap" role="group" aria-label="Time range">
        {presets.map((p) => (
          <button key={p.value} type="button" aria-pressed={!custom && value.range === p.value} onClick={() => { setOpen(false); setError(''); onChange({ range: p.value }); }}>
            {p.label.replace('Last ', '')}
          </button>
        ))}
        <button type="button" aria-pressed={custom} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span className="inline-flex items-center gap-1.5"><CalendarIcon size={14} /> Custom</span>
        </button>
      </div>
      {open && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3 shadow-card">
          <label className="text-xs font-medium text-muted">From
            <input type="date" value={from} max={toDateInput(today)} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm text-fg" />
          </label>
          <label className="text-xs font-medium text-muted">To
            <input type="date" value={to} max={toDateInput(today)} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm text-fg" />
          </label>
          <button type="button" onClick={apply} className="btn !bg-brand !text-white dark:!text-slate-900">Apply</button>
          {error && <p role="alert" className="basis-full text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
