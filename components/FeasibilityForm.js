'use client';
import { useEffect, useMemo, useState } from 'react';
import { InfoIcon, TargetIcon, RefreshIcon } from './Icons';

/* Small accessible tooltip: shows on hover and on keyboard/tap focus. */
export function Tip({ text }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button type="button" className="rounded-full text-subtle transition hover:text-brand focus:text-brand" aria-label={text}>
        <InfoIcon size={14} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 w-56 max-w-[70vw] -translate-x-1/2 rounded-lg border border-line bg-surface p-2.5 text-xs font-normal normal-case leading-snug tracking-normal text-fg opacity-0 shadow-lift transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

const inputCls = (err) =>
  `block w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm tabular-nums text-fg ${err ? 'border-red-400 dark:border-red-500/60' : 'border-line'}`;

function Field({ id, label, tip, error, hint, children, optional }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center text-sm font-medium text-fg">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-muted">(optional)</span>}
        {tip && <Tip text={tip} />}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-300">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* Number input with a unit on the right. */
function NumberInput({ id, value, onChange, unit, error, step = 'any', min = 0, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <input
        id={id} type="number" inputMode="decimal" step={step} min={min} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className={`${inputCls(error)} ${unit ? 'pr-14' : ''}`}
      />
      {unit && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">{unit}</span>}
    </div>
  );
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const EMPTY = {
  species: '', stock: '', avgWeightG: '', stockingDate: '', pondSize: '', pondUnit: 'm2',
  mealsPerDay: 2, feedKgPerDay: '', targetKg: '', deadlineMode: 'months', months: '3', deadline: '',
  survivalPct: '', feedPricePerKg: '', salePricePerKg: '',
};

/* Same rules as the server (backend/src/services/feasibilityService.js parseInput). */
function validate(v, sp) {
  const e = {};
  const n = (x) => (x === '' || x === null || x === undefined ? null : Number(x));
  const counted = sp?.stockUnit !== 'kg';
  if (!sp) e.species = 'Choose a species.';

  const stock = n(v.stock);
  if (stock === null) e.stock = counted ? 'Enter how many fish are in the pond.' : 'Enter the total prawn stock in kg.';
  else if (!(stock > 0)) e.stock = 'Must be more than 0.';
  else if (counted && !Number.isInteger(stock)) e.stock = 'Enter a whole number of fish.';

  const w = n(v.avgWeightG);
  if (w !== null && !(w > 0)) e.avgWeightG = 'Must be more than 0 g.';
  else if (w !== null && sp && w >= sp.maxWeightG) e.avgWeightG = `Must be below ${sp.maxWeightG} g – about the largest ${sp.name} reach in ponds.`;
  if (w === null && !v.stockingDate) e.avgWeightG = 'Enter the average size, or the stocking date below so it can be estimated.';
  if (v.stockingDate && v.stockingDate > todayIso()) e.stockingDate = 'Stocking date cannot be in the future.';

  const pond = n(v.pondSize);
  if (pond !== null && !(pond > 0)) e.pondSize = 'Must be more than 0.';

  const feed = n(v.feedKgPerDay);
  if (feed === null) e.feedKgPerDay = 'Enter how much feed you give per day (0 if none).';
  else if (feed < 0) e.feedKgPerDay = 'Cannot be negative.';

  const target = n(v.targetKg);
  if (target === null) e.targetKg = 'Enter the harvest you want in kg.';
  else if (!(target > 0)) e.targetKg = 'Must be more than 0 kg.';

  if (v.deadlineMode === 'date') {
    if (!v.deadline) e.deadline = 'Choose the harvest date.';
    else if (v.deadline <= todayIso()) e.deadline = 'The deadline is in the past (or today). Choose a future date.';
    else if (v.deadline < addDays(7)) e.deadline = 'The deadline must be at least 7 days away.';
    else if (v.deadline > addDays(730)) e.deadline = 'The deadline must be within 2 years.';
  } else {
    const mo = n(v.months);
    if (mo === null) e.deadline = 'Enter the number of months until harvest.';
    else if (!(mo >= 0.25) || mo > 24) e.deadline = 'Enter between 0.25 and 24 months.';
  }

  const s = n(v.survivalPct);
  if (s !== null && !(s > 0 && s <= 100)) e.survivalPct = 'Enter a percentage between 1 and 100.';
  if (n(v.feedPricePerKg) !== null && n(v.feedPricePerKg) < 0) e.feedPricePerKg = 'Cannot be negative.';
  if (n(v.salePricePerKg) !== null && n(v.salePricePerKg) < 0) e.salePricePerKg = 'Cannot be negative.';

  const body = {
    species: v.species, stock, avgWeightG: w, stockingDate: v.stockingDate || null,
    pondAreaM2: v.pondUnit === 'm2' ? pond : null, pondVolumeM3: v.pondUnit === 'm3' ? pond : null,
    mealsPerDay: Number(v.mealsPerDay), feedKgPerDay: feed, targetKg: target,
    ...(v.deadlineMode === 'date' ? { deadline: v.deadline } : { months: n(v.months) }),
    survivalPct: s, feedPricePerKg: n(v.feedPricePerKg), salePricePerKg: n(v.salePricePerKg),
  };
  return { errors: e, body };
}

/* Server field name -> form field name. */
const FIELD_MAP = { pondAreaM2: 'pondSize', pondVolumeM3: 'pondSize', months: 'deadline' };

export default function FeasibilityForm({ species = [], defaultSpecies, onSubmit, loading, serverError }) {
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const set = (k) => (val) => { setV((p) => ({ ...p, [k]: val })); setErrors((p) => ({ ...p, [k]: undefined })); };

  // Default to the pond's monitored species when the calculator supports it.
  useEffect(() => {
    if (!v.species && species.length) {
      setV((p) => ({ ...p, species: species.some((s) => s.id === defaultSpecies) ? defaultSpecies : species[0].id }));
    }
  }, [species, defaultSpecies, v.species]);

  useEffect(() => {
    if (serverError?.field) setErrors((p) => ({ ...p, [FIELD_MAP[serverError.field] || serverError.field]: serverError.message }));
  }, [serverError]);

  const sp = useMemo(() => species.find((s) => s.id === v.species), [species, v.species]);
  const counted = sp?.stockUnit !== 'kg';
  const animal = counted ? 'fish' : 'prawns';

  const submit = (ev) => {
    ev.preventDefault();
    const { errors: e, body } = validate(v, sp);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = document.getElementById(`fz-${Object.keys(e)[0]}`);
      if (first) first.focus();
      return;
    }
    onSubmit(body);
  };

  const reset = () => { setV({ ...EMPTY, species: v.species }); setErrors({}); };
  // Validation errors without a field show here; network/server errors are shown by the page.
  const generalError = serverError && !serverError.field && serverError.status === 400 ? serverError.message : null;

  return (
    <form onSubmit={submit} noValidate className="card space-y-6" aria-label="Harvest feasibility inputs">
      {/* 1. pond today */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-fg">1. Your pond today</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="fz-species" label="Species" error={errors.species} tip="The animal you are growing in this pond. Growth, feeding and survival figures are set for each species.">
            <select id="fz-species" value={v.species} onChange={(e) => set('species')(e.target.value)} className={inputCls(errors.species)}>
              {!species.length && <option value="">Loading…</option>}
              {species.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field
            id="fz-stock" label={counted ? 'Number of fish now' : 'Total prawn stock now'} error={errors.stock}
            tip={counted ? 'How many fish are in the pond today (your best count after any losses).' : 'Total weight of prawns in the pond today, in kg. The number of prawns is worked out from this and the average size.'}
          >
            <NumberInput id="fz-stock" value={v.stock} onChange={set('stock')} unit={counted ? 'fish' : 'kg'} step={counted ? 1 : 'any'} error={errors.stock} placeholder={counted ? 'e.g. 2000' : 'e.g. 40'} />
          </Field>
          <Field
            id="fz-avgWeightG" label="Average size" optional error={errors.avgWeightG}
            tip={`Weigh 20–30 ${animal} together and divide by the number. Leave empty if you don't know – then enter the stocking date and it will be estimated.`}
          >
            <NumberInput id="fz-avgWeightG" value={v.avgWeightG} onChange={set('avgWeightG')} unit={`g / ${counted ? 'fish' : 'prawn'}`} error={errors.avgWeightG} placeholder="e.g. 50" />
          </Field>
          <Field id="fz-stockingDate" label="Stocking date" optional error={errors.stockingDate} hint="Only needed if you leave the average size empty." tip={`The day the ${animal} were put in the pond. Used to estimate their size from typical growth if you did not weigh them.`}>
            <input id="fz-stockingDate" type="date" max={todayIso()} value={v.stockingDate} onChange={(e) => set('stockingDate')(e.target.value)} className={inputCls(errors.stockingDate)} />
          </Field>
          <Field id="fz-pondSize" label="Pond size" optional error={errors.pondSize} tip="Water surface area (length × width) in m², or the water volume in m³. Used to check whether the pond will be too crowded at harvest.">
            <div className="flex gap-2">
              <NumberInput id="fz-pondSize" value={v.pondSize} onChange={set('pondSize')} error={errors.pondSize} placeholder="e.g. 1000" className="min-w-0 flex-1" />
              <div className="segmented shrink-0" role="group" aria-label="Pond size unit">
                <button type="button" aria-pressed={v.pondUnit === 'm2'} onClick={() => set('pondUnit')('m2')}>m²</button>
                <button type="button" aria-pressed={v.pondUnit === 'm3'} onClick={() => set('pondUnit')('m3')}>m³</button>
              </div>
            </div>
          </Field>
        </div>
      </fieldset>

      {/* 2. feeding */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-fg">2. How you feed now</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="flex items-center text-sm font-medium text-fg" id="fz-meals-label">
              Meals per day
              <Tip text="How many times a day you give feed." />
            </span>
            <div className="segmented mt-1" role="group" aria-labelledby="fz-meals-label">
              {[1, 2, 3, 4].map((x) => (
                <button key={x} type="button" aria-pressed={Number(v.mealsPerDay) === x} onClick={() => set('mealsPerDay')(x)} className="min-w-[2.75rem]">{x}</button>
              ))}
            </div>
          </div>
          <Field id="fz-feedKgPerDay" label="Total feed per day" error={errors.feedKgPerDay} tip="All meals added together, in kg of feed per day. Enter 0 if you are not feeding.">
            <NumberInput id="fz-feedKgPerDay" value={v.feedKgPerDay} onChange={set('feedKgPerDay')} unit="kg/day" error={errors.feedKgPerDay} placeholder="e.g. 4.5" />
          </Field>
        </div>
      </fieldset>

      {/* 3. target */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-fg">3. Your target</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="fz-targetKg" label="Harvest amount" error={errors.targetKg} tip={`The total weight of ${animal} you want to sell or harvest.`}>
            <NumberInput id="fz-targetKg" value={v.targetKg} onChange={set('targetKg')} unit="kg" error={errors.targetKg} placeholder="e.g. 100" />
          </Field>
          <Field id="fz-deadline" label="Harvest by" error={errors.deadline} tip="When you want to harvest: a date, or a number of months from today.">
            <div className="flex flex-wrap gap-2">
              <div className="segmented shrink-0" role="group" aria-label="Deadline type">
                <button type="button" aria-pressed={v.deadlineMode === 'months'} onClick={() => set('deadlineMode')('months')}>In months</button>
                <button type="button" aria-pressed={v.deadlineMode === 'date'} onClick={() => set('deadlineMode')('date')}>Date</button>
              </div>
              <div className="min-w-[8rem] flex-1">
                {v.deadlineMode === 'months' ? (
                  <NumberInput id="fz-deadline" value={v.months} onChange={set('months')} unit="months" step="0.5" error={errors.deadline} />
                ) : (
                  <input id="fz-deadline" type="date" min={addDays(7)} value={v.deadline} onChange={(e) => set('deadline')(e.target.value)} className={inputCls(errors.deadline)} aria-invalid={!!errors.deadline} />
                )}
              </div>
            </div>
          </Field>
        </div>
      </fieldset>

      {/* 4. optional */}
      <details className="group rounded-xl border border-line p-4 [&_summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer list-none text-base font-semibold text-fg">
          4. Survival and prices <span className="text-sm font-normal text-muted">(optional – for the profit view)</span>
          <span className="ml-1 inline-block text-muted transition group-open:rotate-90">›</span>
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="fz-survivalPct" label="Expected survival until harvest" optional error={errors.survivalPct} tip={`What share of today's ${animal} you expect to still be alive at harvest. Leave empty to use a typical value for the species.`}>
            <NumberInput id="fz-survivalPct" value={v.survivalPct} onChange={set('survivalPct')} unit="%" error={errors.survivalPct} placeholder="typical" />
          </Field>
          <Field id="fz-feedPricePerKg" label="Feed price" optional error={errors.feedPricePerKg} tip="What you pay for 1 kg of feed.">
            <NumberInput id="fz-feedPricePerKg" value={v.feedPricePerKg} onChange={set('feedPricePerKg')} unit="Rs/kg" error={errors.feedPricePerKg} />
          </Field>
          <Field id="fz-salePricePerKg" label={`Sale price of ${animal}`} optional error={errors.salePricePerKg} tip={`What buyers pay you for 1 kg of ${animal} at harvest.`}>
            <NumberInput id="fz-salePricePerKg" value={v.salePricePerKg} onChange={set('salePricePerKg')} unit="Rs/kg" error={errors.salePricePerKg} />
          </Field>
        </div>
      </details>

      <p className="flex items-start gap-2 text-xs text-muted">
        <InfoIcon size={14} className="mt-0.5 shrink-0" />
        Water temperature, pH, turbidity, TDS and rain are read automatically from your FishSafe sensors (last 14 days) – you don&apos;t need to enter them.
      </p>

      {generalError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">{generalError}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={loading || !species.length} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:text-slate-900">
          <TargetIcon size={16} /> {loading ? 'Calculating…' : 'Calculate'}
        </button>
        <button type="button" onClick={reset} className="btn" disabled={loading}><RefreshIcon size={16} /> Clear</button>
      </div>
    </form>
  );
}
