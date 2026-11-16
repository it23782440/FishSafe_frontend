'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLiveData } from '@/lib/useLiveData';
import { useSpecies } from '@/lib/useSpecies';
import { endpoints } from '@/lib/api';
import { safeRangeText, statusOf } from '@/lib/sensorMeta';
import { formatDateTime, formatMinutes, timeAgo, useNow } from '@/lib/time';
import { windowHours, windowLabel, windowQuery } from '@/lib/window';
import FishArt from '@/components/FishArt';
import EnvironmentalStatus from '@/components/EnvironmentalStatus';
import DateRangePicker from '@/components/DateRangePicker';
import TemperatureChart from '@/components/TemperatureChart';
import PHChart from '@/components/PHChart';
import StatTiles from '@/components/StatTiles';
import ZoneBar from '@/components/ZoneBar';
import RangeGauge from '@/components/RangeGauge';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import LiveIndicator from '@/components/LiveIndicator';
import { Skeleton, ErrorState, EmptyState } from '@/components/Loading';
import { ArrowLeftIcon, CheckIcon, InfoIcon } from '@/components/Icons';

export default function SpeciesDetailPage({ params }) {
  const id = params.id;
  const now = useNow(1000);
  const [win, setWin] = useState({ range: '24h' });
  const [confirm, setConfirm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { currentId, select, saving, error: selErr } = useSpecies();

  const profile = useLiveData(endpoints.speciesOne(id), { interval: 0 });
  const assess = useLiveData(endpoints.speciesAssessment(id));
  const hist = useLiveData(endpoints.speciesHistory(id, windowQuery(win)), { interval: 30000 });

  if (profile.error?.status === 404) {
    return (<><Link href="/species" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"><ArrowLeftIcon size={16} /> Fish species</Link><EmptyState message="This species is not registered" hint="It may have been deleted. Go back to the species list." /></>);
  }
  if (profile.error && !profile.data) return <ErrorState message={profile.error.message} onRetry={profile.refresh} />;

  const sp = profile.data;
  const a = assess.data;
  const h = hist.data;
  const isPond = currentId === id;
  const long = windowHours(win) > 48;
  const th = sp?.thresholds;

  const guidance = sp ? [
    `Keep water temperature within ${safeRangeText('temperature', th.temperature)} for ${sp.name}.`,
    `Keep pH within ${safeRangeText('ph', th.ph)} and watch for pH fluctuations during the day.`,
    'Investigate sudden changes in temperature or pH. Weather, algae blooms or inflow changes are common causes.',
    'If readings look abnormal, check sensor calibration against a reference thermometer and a pH test kit.',
  ] : [];

  return (
    <>
      <Link href="/species" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"><ArrowLeftIcon size={16} /> Fish species</Link>

      {/* identity */}
      <section className="card mb-6 flex flex-col gap-5 overflow-hidden !p-0 md:flex-row">
        <FishArt id={id} name={sp?.name} imageUrl={sp?.imageUrl} className="h-44 w-full shrink-0 md:h-auto md:w-72" />
        <div className="flex-1 p-5">
          {!sp ? <Skeleton className="h-24" /> : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{sp.name}</h1>
                {isPond && <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white dark:text-slate-900">Pond species</span>}
              </div>
              <p className="text-sm italic text-muted">{sp.scientific || 'Scientific name not set'}</p>
              {sp.description && <p className="mt-2 max-w-2xl text-sm text-fg/90">{sp.description}</p>}
              <dl className="mt-4 grid max-w-lg grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-surface-2 p-3"><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Recommended temperature</dt><dd className="mt-0.5 text-lg font-bold tabular-nums text-fg">{safeRangeText('temperature', th.temperature)}</dd><dd className="text-xs text-muted">Danger outside {th.temperature.warnLow}–{th.temperature.warnHigh} °C</dd></div>
                <div className="rounded-xl bg-surface-2 p-3"><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Recommended pH</dt><dd className="mt-0.5 text-lg font-bold tabular-nums text-fg">{safeRangeText('ph', th.ph)}</dd><dd className="text-xs text-muted">Danger outside {th.ph.warnLow}–{th.ph.warnHigh}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {!isPond && <button type="button" className="btn" onClick={() => setConfirm(true)} disabled={saving}>Use {sp.name} for my pond</button>}
                {selErr && <span role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{selErr}</span>}
                <Link href="/settings#species" className="text-sm font-medium text-brand hover:underline">Edit limits</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {assess.error && !a ? <ErrorState message={assess.error.message} onRetry={assess.refresh} /> : !a ? <Skeleton className="h-72 rounded-2xl" /> : <EnvironmentalStatus assessment={a} />}
        </div>
        <section className="card" aria-label="Current readings">
          <h2 className="font-semibold text-fg">Current readings</h2>
          <p className="text-xs text-muted">{a?.readingTimestamp ? `${formatDateTime(a.readingTimestamp)} · ${timeAgo(a.readingTimestamp, now)}` : 'No reading timestamp'}</p>
          {a && th && ['temperature', 'ph'].map((k) => {
            const p = a.parameters[k];
            const shown = a.stale ? 'UNKNOWN' : p.status;
            return (
              <div key={k} className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-fg">{k === 'ph' ? 'pH Level' : 'Temperature'}</span>
                  <StatusBadge status={shown} size="sm" />
                </div>
                <div className="mt-1 text-3xl font-bold tabular-nums text-fg">{p.value != null ? Number(p.value).toFixed(k === 'ph' ? 2 : 1) : '—'}<span className="ml-1 text-sm font-medium text-muted">{p.unit}</span></div>
                <div className="mt-3"><RangeGauge sensorKey={k} value={p.value} thresholds={th[k]} status={shown} /></div>
                <p className="mt-1.5 text-xs text-muted">Recommended {p.expected}</p>
              </div>
            );
          })}
        </section>
      </div>

      {/* history */}
      <section className="mt-6 space-y-6" aria-label="History">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-xl font-bold text-fg">Sensor history for {sp?.name || id}</h2><p className="text-sm text-muted">{windowLabel(win)} · stored readings judged against this species&apos; limits</p></div>
          <div className="flex flex-wrap items-start gap-3"><LiveIndicator updatedAt={hist.updatedAt} isValidating={hist.isValidating} hasError={!!hist.error && !!h} onRefresh={hist.refresh} /><DateRangePicker value={win} onChange={setWin} /></div>
        </div>

        {hist.error && !h ? <ErrorState message={hist.error.message} onRetry={hist.refresh} /> : hist.isLoading && !h ? <Skeleton className="h-96 rounded-2xl" /> : !h || h.count === 0 ? (
          <EmptyState message="No sensor readings in this period" hint="Choose a longer period, or check that the device is reporting." />
        ) : (
          <>
            <div className="card"><h3 className="mb-2 text-sm font-semibold text-fg">Time in each zone ({h.readings} readings)</h3><ZoneBar zones={h.summary.zones} /></div>
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="card"><h3 className="mb-3 font-semibold text-fg">Temperature</h3><StatTiles stats={h.summary.temperature} unit="°C" /><div className="mt-4"><TemperatureChart series={h.series} thresholds={h.thresholds.temperature} long={long} /></div></div>
              <div className="card"><h3 className="mb-3 font-semibold text-fg">pH</h3><StatTiles stats={h.summary.ph} decimals={2} /><div className="mt-4"><PHChart series={h.series} thresholds={h.thresholds.ph} long={long} /></div></div>
            </div>
            {h.bucketed && <p className="flex items-center gap-1.5 text-xs text-muted"><InfoIcon size={14} /> Long period: charts show averages per interval; brief spikes still colour the point.</p>}

            <div className="card">
              <h3 className="font-semibold text-fg">Previous warnings and dangerous conditions</h3>
              <p className="mb-3 text-xs text-muted">Periods when the stored readings left the safe zone for {sp?.name}.</p>
              {h.excursions.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"><CheckIcon size={16} /></span>No warnings or dangerous conditions in this period.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {(showAll ? h.excursions : h.excursions.slice(0, 8)).map((e) => {
                    const pk = e.params[e.parameter];
                    return (
                      <li key={e.start} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-3">
                        <StatusBadge status={e.status} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-fg">{e.reason}</p>
                          <p className="mt-0.5 text-xs text-muted">{formatDateTime(e.start)}{e.durationMinutes > 0 ? ` → ${formatDateTime(e.end)} · ${formatMinutes(e.durationMinutes)}` : ' · single reading'} · peak {pk.peak} {e.parameter === 'ph' ? '' : '°C'}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {h.excursions.length > 8 && (
                <button type="button" className="btn mt-3" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Show fewer' : `Show all ${h.excursions.length} events`}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* recommendations */}
      <section className="card mt-6" aria-label="Recommendations">
        <h2 className="font-semibold text-fg">Recommendations for {sp?.name}</h2>
        {a && a.recommendations.length > 0 && (
          <div className={`mt-3 rounded-xl border p-4 ${statusOf(a.status).border}`}>
            <div className={`text-sm font-semibold ${statusOf(a.status).text}`}>Based on the current condition</div>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-fg/90">{a.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        )}
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">{guidance.map((g) => <li key={g}>{g}</li>)}</ul>
        <p className="mt-3 text-xs text-subtle">General guidance only. It is not a veterinary diagnosis or a guarantee of fish health.</p>
      </section>

      <ConfirmDialog open={confirm} title={`Use ${sp?.name} for your pond?`} message={`FishSafe will judge the live water readings, alerts and the dashboard against ${sp?.name}'s limits. Existing alerts are re-evaluated immediately.`}
        confirmLabel="Use this species" busy={saving} onCancel={() => setConfirm(false)} onConfirm={async () => { await select(id); setConfirm(false); }} />
    </>
  );
}
