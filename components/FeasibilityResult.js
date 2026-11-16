'use client';
import StatusBadge from './StatusBadge';
import RangeGauge from './RangeGauge';
import GrowthProjectionChart from './GrowthProjectionChart';
import { Notice } from './Loading';
import { CheckIcon, AlertIcon, XIcon, InfoIcon, ClockIcon, WifiOffIcon, SensorIcon } from './Icons';

const fmt = (n, d = 1) => (n === null || n === undefined || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d }));
const money = (n) => (n === null || n === undefined ? '—' : `Rs ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
const date = (iso) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

/* Literal class strings so Tailwind keeps them. */
const VERDICT_STYLE = {
  ACHIEVABLE: { icon: CheckIcon, box: 'border-emerald-300/80 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10', chip: 'bg-emerald-600 text-white', text: 'text-emerald-800 dark:text-emerald-200' },
  ACHIEVABLE_WITH_CHANGES: { icon: CheckIcon, box: 'border-sky-300/80 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10', chip: 'bg-sky-600 text-white', text: 'text-sky-900 dark:text-sky-200' },
  UNLIKELY: { icon: AlertIcon, box: 'border-amber-300/80 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10', chip: 'bg-amber-500 text-white', text: 'text-amber-900 dark:text-amber-200' },
  NOT_POSSIBLE: { icon: XIcon, box: 'border-red-300/80 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10', chip: 'bg-red-600 text-white', text: 'text-red-800 dark:text-red-200' },
};
const CONFIDENCE = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const GAUGE_KEY = { temperature: 'temperature', ph: 'ph', turbidity: 'turbidity', tds: 'conductivity' };

function Section({ title, subtitle, children, right }) {
  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, unit, hint, strong }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="card-title">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`text-2xl font-bold tabular-nums ${strong || 'text-fg'}`}>{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

/* 1. Verdict */
function VerdictCard({ r }) {
  const v = r.verdict;
  const s = VERDICT_STYLE[v.code];
  const Icon = s.icon;
  const p = r.projection;
  return (
    <section className={`rounded-2xl border p-5 shadow-card ${s.box}`} aria-live="polite">
      <div className="flex flex-wrap items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${s.chip}`}><Icon size={24} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`text-2xl font-bold uppercase tracking-tight ${s.text}`}>{v.title}</h2>
            <span className="rounded-full border border-current/20 bg-surface/70 px-2 py-0.5 text-xs font-semibold text-muted">Estimate</span>
          </div>
          <p className={`mt-1 text-base font-medium ${s.text}`}>{v.reason}</p>
          <p className="mt-2 text-sm text-muted">
            <b className="text-fg">Confidence: {CONFIDENCE[v.confidence.level]}.</b> {v.confidence.notes.join(' ')}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Your target" value={fmt(p.targetKg)} unit="kg" hint={`by ${date(r.deadline)} (${fmt(r.weeks)} weeks)`} />
        <Stat label="Current plan" value={fmt(p.current.harvestKg)} unit="kg" hint={`${fmt(p.current.finalWeightG)} g each, ${fmt(p.current.survivors, 0)} alive`} strong={p.current.harvestKg >= p.targetKg ? 'text-emerald-600 dark:text-emerald-300' : 'text-fg'} />
        <Stat label="Recommended plan" value={fmt(p.recommended.harvestKg)} unit="kg" hint={`${fmt(p.recommended.finalWeightG)} g each, ${fmt(p.recommended.survivors, 0)} alive`} strong={p.recommended.harvestKg >= p.targetKg ? 'text-emerald-600 dark:text-emerald-300' : 'text-fg'} />
        <Stat label="Best case" value={fmt(p.bestCase.harvestKg)} unit="kg" hint="perfect water + full feeding" />
      </div>
      {r.alternative && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-3 text-sm text-fg">
          <b>What is possible instead: </b>{r.alternative.message}
        </div>
      )}
    </section>
  );
}

/* 3. Gap analysis */
function GapAnalysis({ r }) {
  const g = r.gap;
  const unitWord = r.species.stockUnit === 'kg' ? 'prawn' : 'fish';
  const bars = [
    ['Needed for your target', g.requiredRateGPerWeek, 'bg-slate-800 dark:bg-slate-200'],
    ['Current plan', g.currentRateGPerWeek, 'bg-slate-400'],
    ['Recommended plan', g.recommendedRateGPerWeek, 'bg-cyan-600'],
    ['Best case', g.bestRateGPerWeek, 'bg-emerald-500'],
  ];
  const max = Math.max(...bars.map((b) => Math.max(b[1] || 0, 0)), 0.01);
  return (
    <Section title="Gap analysis" subtitle={`Growth each ${unitWord} must make, compared with what each plan achieves (losses from deaths included).`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={`Needed size per ${unitWord}`} value={fmt(g.requiredFinalWeightG)} unit="g" hint={`now ${fmt(r.stock.avgWeightG)} g${r.stock.sizeEstimated ? ' (estimated)' : ''}`} />
        <Stat label="Needed growth" value={fmt(g.requiredRateGPerWeek, 2)} unit="g/week" hint={g.requiredSgr !== null ? `SGR ${fmt(g.requiredSgr, 2)} %/day` : undefined} />
        <Stat label="Shortfall (current plan)" value={fmt(g.shortfallKg)} unit="kg" hint={g.shortfallRecommendedKg > 0 ? `${fmt(g.shortfallRecommendedKg)} kg with the recommended plan` : 'none with the recommended plan'} strong={g.shortfallKg > 0 ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'} />
      </div>
      <div className="mt-4 space-y-2.5" role="list" aria-label="Growth rates in grams per week">
        {bars.map(([label, val, cls]) => (
          <div key={label} role="listitem" className="grid grid-cols-[8.5rem_1fr_4.5rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_5rem]">
            <span className="text-muted">{label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-line"><span className={`block h-full rounded-full ${cls}`} style={{ width: `${(Math.max(val || 0, 0) / max) * 100}%` }} /></span>
            <span className="text-right font-semibold tabular-nums text-fg">{fmt(val, 2)} g/wk</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* 4. Feeding actions */
function Feeding({ r }) {
  const f = r.feeding;
  const statusTone = { OVERFEEDING: 'DANGER', UNDERFEEDING: 'WARNING', OK: 'SAFE', NO_FEEDING: 'WARNING' }[f.status];
  const statusText = { OVERFEEDING: 'Overfeeding', UNDERFEEDING: 'Underfeeding', OK: 'Feeding OK', NO_FEEDING: 'Too cold to feed' }[f.status];
  const row = (label, cur, rec) => (
    <tr className="border-t border-line">
      <th scope="row" className="py-2 pr-3 text-left font-medium text-muted">{label}</th>
      <td className="py-2 pr-3 tabular-nums text-fg">{cur}</td>
      <td className="py-2 font-semibold tabular-nums text-fg">{rec}</td>
    </tr>
  );
  return (
    <Section title="Feeding actions" subtitle="Based on the feeding table for this size and your water temperature." right={<StatusBadge status={statusTone} size="sm" />}>
      <p className="rounded-xl bg-brand/10 px-4 py-3 text-base font-semibold text-fg">
        <span className="sr-only">{statusText}: </span>{f.summary}
      </p>
      {f.today && <div className="mt-3"><Notice icon={<AlertIcon size={18} />}>{f.today.message} <b>Today: about {fmt(f.today.feedKg, 2)} kg in {f.today.meals} meal(s).</b></Notice></div>}
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-muted"><th className="pb-2" /><th className="pb-2 pr-3">Now</th><th className="pb-2">Recommended</th></tr></thead>
            <tbody>
              {row('Meals per day', f.current.mealsPerDay, f.recommended.mealsPerDay)}
              {row('Feed per day', `${fmt(f.current.feedKgPerDay, 2)} kg`, `${fmt(f.recommended.feedKgPerDay, 2)} kg`)}
              {row('Feed per meal', `${fmt(f.current.kgPerMeal, 2)} kg`, `${fmt(f.recommended.feedKgPerDay / f.recommended.mealsPerDay, 2)} kg avg`)}
              {row('% of body weight', `${fmt(f.current.pctBodyWeight, 2)} %`, `${fmt(f.recommended.pctBodyWeight, 2)} %`)}
            </tbody>
          </table>
        </div>
        <div>
          <div className="card-title mb-2 flex items-center gap-1.5"><ClockIcon size={14} /> Recommended meal times</div>
          <ul className="space-y-1.5">
            {f.recommended.meals.map((m) => (
              <li key={m.time} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="font-semibold tabular-nums text-fg">{m.time}</span>
                <span className="tabular-nums text-fg">{fmt(m.kg, 2)} kg <span className="text-muted">({m.sharePct}%)</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-fg">
        {f.notes.map((n) => <li key={n}>{n}</li>)}
        <li>
          Feed needed for the target: about <b>{fmt(f.targetFeed.totalKg, 0)} kg</b> in total ({fmt(f.targetFeed.gainKg)} kg of growth × FCR {f.targetFeed.fcr}),
          or about {fmt(f.targetFeed.perDayKg, 2)} kg/day on average. Your current plan uses about {fmt(f.targetFeed.currentPlanTotalKg, 0)} kg until the deadline.
        </li>
      </ul>
    </Section>
  );
}

/* 5. Environment actions */
function Environment({ r }) {
  const e = r.environment;
  return (
    <Section title="Water conditions" subtitle="Target ranges for this species compared with your pond's latest and recent readings.">
      <div className="mb-4">
        <Notice tone={e.source === 'default' ? 'warn' : 'info'} icon={e.source === 'default' ? <WifiOffIcon size={18} /> : <SensorIcon sensor="temperature" size={18} />}>{e.note}</Notice>
      </div>
      <div className={`mb-4 rounded-xl border p-3 text-sm ${e.limiting.waterBlocksTarget ? 'border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200' : 'border-line bg-surface-2 text-fg'}`}>
        <b>{e.limiting.waterBlocksTarget ? 'Water is limiting your target. ' : 'Water and the target: '}</b>{e.limiting.message}
      </div>
      <ul className="divide-y divide-line">
        {e.rows.map((row) => {
          const unit = row.unit ? ` ${row.unit}` : '';
          const tgt = row.target.low !== null && row.target.high !== null ? `${row.target.low}–${row.target.high}${unit}` : row.target.high !== null ? `≤ ${row.target.high}${unit}` : `≥ ${row.target.low}${unit}`;
          return (
            <li key={row.key} className="grid gap-3 py-4 first:pt-0 md:grid-cols-[13rem_1fr]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-fg">{row.label}</span>
                  <StatusBadge status={row.status} size="sm" />
                </div>
                <div className="mt-1 text-xs text-muted">Target: <b className="text-fg">{tgt}</b> ({row.target.note})</div>
                <div className="mt-0.5 text-xs text-muted tabular-nums">
                  Now: <b className="text-fg">{row.latest === null ? '—' : `${fmt(row.latest, 2)}${unit}`}</b> · 14-day avg: {row.recentMean === null ? '—' : `${fmt(row.recentMean, 2)}${unit}`}
                </div>
                {row.growthEffectPct < 0 && <div className="mt-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">Growth {row.growthEffectPct}%</div>}
              </div>
              <div className="min-w-0">
                {(row.latest ?? row.recentMean) !== null && (
                  <div className="mb-3 pt-2"><RangeGauge sensorKey={GAUGE_KEY[row.key]} value={row.latest ?? row.recentMean} thresholds={row.limits} status={row.status} /></div>
                )}
                <p className="text-sm text-fg">{row.instruction}</p>
              </div>
            </li>
          );
        })}
        <li className="grid gap-3 py-4 md:grid-cols-[13rem_1fr]">
          <div>
            <div className="flex items-center gap-2"><span className="font-semibold text-fg">Rain risk</span><StatusBadge status={e.rain.status} size="sm" /></div>
            {e.rain.days > 0 && <div className="mt-1 text-xs text-muted">Heavy rain on {e.rain.heavyDays} of {e.rain.days} days</div>}
          </div>
          <p className="text-sm text-fg">{e.rain.instruction}</p>
        </li>
      </ul>
      {e.fixes.length > 0 && (
        <div className="mt-2 rounded-xl bg-surface-2 p-4">
          <div className="card-title mb-2">What to fix first</div>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-fg">{e.fixes.map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
      )}
    </Section>
  );
}

/* Stocking density */
function Density({ d, r }) {
  return (
    <Section title="Pond crowding" subtitle={`Pond area ${fmt(d.areaM2)} m²${d.areaFromVolume ? ' (from volume, assuming 1.2 m depth)' : ''}.`} right={<StatusBadge status={d.status} size="sm" />}>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Now" value={fmt(d.currentKgM2, 2)} unit="kg/m²" hint={`${fmt(d.animalsPerM2)} ${r.species.stockUnit === 'kg' ? 'prawns' : 'fish'}/m²`} />
        <Stat label="At target" value={fmt(d.targetKgM2, 2)} unit="kg/m²" />
        <Stat label="Recommended plan" value={fmt(d.projectedKgM2, 2)} unit="kg/m²" />
        <Stat label="Usual limit" value={fmt(d.maxKgM2, 2)} unit="kg/m²" hint="without strong aeration" />
      </div>
      <p className="mt-3 text-sm text-fg">{d.message}</p>
    </Section>
  );
}

/* 6. Business view */
function Business({ b }) {
  const rows = [
    ['Harvest', (x) => `${fmt(x.harvestKg)} kg`],
    ['Feed used', (x) => `${fmt(x.feedKg, 0)} kg`],
    ['Feed cost', (x) => money(x.feedCost)],
    ['Expected revenue', (x) => money(x.revenue)],
    ['Profit (revenue − feed)', (x) => money(x.profit)],
    ['FCR (feed ÷ harvest gain, losses included)', (x) => fmt(x.fcr, 2)],
    ['Feed cost per kg produced', (x) => (x.costPerKgProduced === null ? '—' : `Rs ${fmt(x.costPerKgProduced, 0)}`)],
  ];
  return (
    <Section title="Business view" subtitle={`Feed Rs ${b.feedPricePerKg ?? '—'}/kg · sale price Rs ${b.salePricePerKg ?? '—'}/kg`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-muted"><th className="pb-2" /><th className="pb-2 pr-3">Current plan</th><th className="pb-2">Recommended plan</th></tr></thead>
          <tbody>
            {rows.map(([label, get]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="py-2 pr-3 text-left font-medium text-muted">{label}</th>
                <td className="py-2 pr-3 tabular-nums text-fg">{get(b.current)}</td>
                <td className="py-2 font-semibold tabular-nums text-fg">{get(b.recommended)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">{b.note}</p>
    </Section>
  );
}

/* 7. Assumptions */
function Assumptions({ r }) {
  return (
    <section className="card">
      <details className="group [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
          <span>
            <span className="text-lg font-semibold text-fg">Assumptions used</span>
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">Estimate</span>
          </span>
          <span className="text-sm text-brand group-open:hidden">Show {r.assumptions.length}</span>
          <span className="hidden text-sm text-brand group-open:inline">Hide</span>
        </summary>
        <dl className="mt-4 divide-y divide-line text-sm">
          {r.assumptions.map((a) => (
            <div key={a.label} className="grid gap-1 py-2.5 sm:grid-cols-[14rem_1fr]">
              <dt className="font-medium text-fg">{a.label}</dt>
              <dd className="text-muted">{a.value} <span className="ml-1 whitespace-nowrap rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-subtle">{a.source}</span></dd>
            </div>
          ))}
        </dl>
      </details>
      <p className="mt-3 flex items-start gap-2 text-xs text-muted"><InfoIcon size={14} className="mt-0.5 shrink-0" />{r.disclaimer}</p>
    </section>
  );
}

export default function FeasibilityResult({ r }) {
  return (
    <div className="space-y-6 animate-rise">
      <VerdictCard r={r} />
      <Section title="Growth projection" subtitle={`Total weight of ${r.species.name} in the pond, week by week until ${date(r.deadline)}.`}>
        <GrowthProjectionChart points={r.projection.points} targetKg={r.projection.targetKg} />
      </Section>
      <GapAnalysis r={r} />
      <Feeding r={r} />
      <Environment r={r} />
      {r.density && <Density d={r.density} r={r} />}
      {r.business && <Business b={r.business} />}
      <Assumptions r={r} />
    </div>
  );
}
