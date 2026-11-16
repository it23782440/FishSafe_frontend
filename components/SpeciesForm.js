'use client';
import { useMemo, useState } from 'react';
import { sendJson, endpoints } from '@/lib/api';
import { classifyValue, overallFrom, validateRange, ZONE_TITLE } from '@/lib/environment';
import { statusOf } from '@/lib/sensorMeta';
import StatusBadge from './StatusBadge';
import { XIcon } from './Icons';

const FIELDS = [
  ['warnLow', 'Danger below'],
  ['safeLow', 'Recommended min'],
  ['safeHigh', 'Recommended max'],
  ['warnHigh', 'Danger above'],
  ['warnMargin', 'Warning margin'],
];
const blank = (v) => (v === null || v === undefined ? '' : String(v));
const toRange = (r = {}) => Object.fromEntries(FIELDS.map(([k]) => [k, blank(r[k])]));
const num = (v) => (v === '' ? null : Number(v));

function RangeInputs({ label, unit, value, onChange, step }) {
  return (
    <fieldset className="rounded-xl border border-line p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label} {unit && <span className="font-normal text-muted">({unit})</span>}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {FIELDS.map(([k, l]) => (
          <label key={k} className="text-xs font-medium text-muted">{l}
            <input type="number" inputMode="decimal" step={step} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm tabular-nums text-fg" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* Create / edit a fish species and its limits. `species` = existing profile (edit) or null (create). */
export default function SpeciesForm({ species, onSaved, onCancel }) {
  const editing = !!species;
  const [name, setName] = useState(species?.name || '');
  const [scientific, setScientific] = useState(species?.scientific || '');
  const [description, setDescription] = useState(species?.description || '');
  const [imageUrl, setImageUrl] = useState(species?.imageUrl || '');
  const [temp, setTemp] = useState(toRange(species?.thresholds?.temperature || { warnLow: 22, safeLow: 25, safeHigh: 30, warnHigh: 33, warnMargin: 1 }));
  const [ph, setPh] = useState(toRange(species?.thresholds?.ph || { warnLow: 6, safeLow: 6.5, safeHigh: 8.5, warnHigh: 9, warnMargin: 0.3 }));
  const [testT, setTestT] = useState('');
  const [testP, setTestP] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => {
    const tn = testT === '' ? null : Number(testT);
    const pn = testP === '' ? null : Number(testP);
    const asNum = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, num(v)]));
    const ts = classifyValue(tn, asNum(temp));
    const ps = classifyValue(pn, asNum(ph));
    return { ts, ps, overall: overallFrom(ts, ps) };
  }, [testT, testP, temp, ph]);

  const submit = async (e) => {
    e.preventDefault();
    const msg =
      (name.trim().length < 2 ? 'Enter a species name.' : '') ||
      validateRange('Temperature', temp, { min: -5, max: 60 }) ||
      validateRange('pH', ph, { min: 0, max: 14 });
    if (msg) return setError(msg);
    setError('');
    setSaving(true);
    const toBody = (r) => Object.fromEntries(FIELDS.map(([k]) => [k, num(r[k]) ?? (k === 'warnMargin' ? 0 : null)]));
    const body = { name: name.trim(), scientific: scientific.trim(), description: description.trim(), imageUrl: imageUrl.trim(), thresholds: { temperature: toBody(temp), ph: toBody(ph) } };
    try {
      const saved = editing ? await sendJson(endpoints.speciesOne(species.id), 'PUT', body) : await sendJson('/api/species', 'POST', body);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'mt-1 block w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg';
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onCancel} aria-hidden="true" />
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="sf-title" className="relative my-6 w-full max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-lift animate-rise">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="sf-title" className="text-xl font-bold text-fg">{editing ? `Edit ${species.name}` : 'Add fish species'}</h2>
            <p className="mt-1 text-sm text-muted">Limits decide the Safe / Warning / Dangerous zones. Confirm suitable values for your pond with a fisheries expert.</p>
          </div>
          <button type="button" onClick={onCancel} className="btn !px-2" aria-label="Close"><XIcon size={16} /></button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-fg">Species name *<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required /></label>
          <label className="text-sm font-medium text-fg">Scientific name<input className={`${inputCls} italic`} value={scientific} onChange={(e) => setScientific(e.target.value)} maxLength={80} /></label>
          <label className="text-sm font-medium text-fg sm:col-span-2">Description<input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} /></label>
          <label className="text-sm font-medium text-fg sm:col-span-2">Photo URL (optional)
            <input className={inputCls} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://… (an illustration is shown if empty)" />
          </label>
        </div>

        <div className="mt-5 space-y-4">
          <RangeInputs label="Temperature" unit="°C" value={temp} onChange={setTemp} step="0.1" />
          <RangeInputs label="pH" value={ph} onChange={setPh} step="0.1" />
        </div>
        <p className="mt-2 text-xs text-muted">Danger = outside the “danger” limits. Warning = outside the recommended range, or within the warning margin of a recommended limit.</p>

        <div className="mt-5 rounded-xl bg-surface-2 p-4">
          <div className="text-sm font-semibold text-fg">Test a reading with these limits</div>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-muted">Temperature (°C)<input type="number" step="0.1" value={testT} onChange={(e) => setTestT(e.target.value)} className="mt-1 block w-28 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-fg" /></label>
            <label className="text-xs font-medium text-muted">pH<input type="number" step="0.1" value={testP} onChange={(e) => setTestP(e.target.value)} className="mt-1 block w-28 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-fg" /></label>
            <div className="flex items-center gap-2 text-sm" aria-live="polite">
              <StatusBadge status={preview.ts} size="sm" /> <StatusBadge status={preview.ps} size="sm" />
              <span className={`font-bold ${statusOf(preview.overall).text}`}>{ZONE_TITLE[preview.overall]}</span>
            </div>
          </div>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:text-slate-900">
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add species'}
          </button>
        </div>
      </form>
    </div>
  );
}
