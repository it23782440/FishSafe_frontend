'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher, endpoints, API_BASE, DEVICE_ID } from '@/lib/api';
import { useSpeciesOverview } from '@/lib/hooks';
import { windowHours, windowLabel, windowQuery, isCustom } from '@/lib/window';
import { formatDateTime, formatMinutes } from '@/lib/time';
import { ZONE_TITLE } from '@/lib/environment';
import PageHeader from '@/components/PageHeader';
import DateRangePicker from '@/components/DateRangePicker';
import StatTiles from '@/components/StatTiles';
import ZoneBar from '@/components/ZoneBar';
import StatusBadge from '@/components/StatusBadge';
import TemperatureChart from '@/components/TemperatureChart';
import PHChart from '@/components/PHChart';
import { SEVERITY, KIND_LABEL } from '@/components/AlertCard';
import { ErrorState, EmptyState, Skeleton } from '@/components/Loading';
import { PrinterIcon, DownloadIcon, RefreshIcon, InfoIcon } from '@/components/Icons';

/* ISO from/to for the alerts API, whichever kind of window is selected. */
function alertWindow(win) {
  if (isCustom(win)) return { from: win.from, to: win.to };
  return { from: new Date(Date.now() - windowHours(win) * 3600000).toISOString(), to: new Date().toISOString() };
}

/*
 * Everything in a report comes from the backend for ONE window: the chosen
 * species' history, the same water judged against every species, the alerts
 * raised in that window and the device status. It is a snapshot (no polling);
 * use "Regenerate" to refresh.
 */
async function buildReport([, speciesId, ids, wq, from, to]) {
  const [main, compare, alerts, device] = await Promise.all([
    fetcher(endpoints.speciesHistory(speciesId, wq)),
    Promise.all(ids.map((id) => fetcher(endpoints.speciesHistory(id, wq, DEVICE_ID)))),
    fetcher(endpoints.alerts({ from, to, limit: '500' })),
    fetcher(endpoints.device()),
  ]);
  return { generatedAt: new Date().toISOString(), main, compare, alerts: alerts.alerts, device };
}

function verdict(h) {
  const z = h.summary.zones;
  if (z.SAFE === null) return 'No readings were stored in this period, so no assessment can be made.';
  const parts = [`${z.SAFE}% of readings were in the safe zone for ${h.species.name}`];
  if (z.WARNING) parts.push(`${z.WARNING}% in the warning zone`);
  if (z.DANGER) parts.push(`${z.DANGER}% in the dangerous zone`);
  return `${parts.join(', ')} (${h.readings.toLocaleString()} readings).`;
}

export default function ReportsPage() {
  const overview = useSpeciesOverview();
  const [win, setWin] = useState({ range: '7d' });
  const [speciesId, setSpeciesId] = useState('');
  // The window is frozen when a report is generated, so "last 7 days" does not drift while reading it.
  const [frozen, setFrozen] = useState(() => alertWindow({ range: '7d' }));

  useEffect(() => { if (!speciesId && overview.data?.pondSpecies) setSpeciesId(overview.data.pondSpecies); }, [overview.data, speciesId]);
  useEffect(() => { setFrozen(alertWindow(win)); }, [win]);

  const ids = useMemo(() => (overview.data?.species || []).map((s) => s.id), [overview.data]);
  const wq = windowQuery(win);
  const key = speciesId && ids.length ? ['report', speciesId, ids, wq, frozen.from, frozen.to] : null;
  const { data: r, error, isLoading, isValidating, mutate } = useSWR(key, buildReport, {
    revalidateOnFocus: false, refreshInterval: 0, keepPreviousData: false,
  });

  const regenerate = () => { setFrozen(alertWindow(win)); mutate(); };
  const csv = `${API_BASE}${endpoints.records(isCustom(win) ? { from: win.from, to: win.to, format: 'csv' } : { range: win.range, format: 'csv' })}`;

  const alertSummary = useMemo(() => {
    const out = { total: 0, DANGER: 0, WARNING: 0, INFO: 0, byKind: {} };
    (r?.alerts || []).forEach((a) => { out.total += 1; out[a.severity] += 1; const k = a.kind || 'threshold'; out.byKind[k] = (out.byKind[k] || 0) + 1; });
    return out;
  }, [r]);
  const offline = (r?.alerts || []).filter((a) => a.kind === 'device_offline');

  const h = r?.main;
  const long = windowHours(win) > 48;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="A printable water-quality report for any period: time in each zone, readings, warnings, alerts and connectivity, judged against the fish species you choose."
        right={
          <div className="no-print flex flex-wrap items-center gap-2">
            <button type="button" className="btn" onClick={regenerate} disabled={isValidating}><RefreshIcon size={16} className={isValidating ? 'animate-spin' : ''} /> Regenerate</button>
            <a href={csv} className="btn"><DownloadIcon size={16} /> Records CSV</a>
            <button type="button" className="btn !bg-brand !text-white dark:!text-slate-900" onClick={() => window.print()} disabled={!h}><PrinterIcon size={16} /> Print / Save as PDF</button>
          </div>
        }
      />

      <div className="no-print card mb-6 flex flex-wrap items-end justify-between gap-4">
        <label className="text-sm font-medium text-fg">Fish species
          <select value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} className="mt-1 block min-w-[220px] rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg">
            {(overview.data?.species || []).map((s) => <option key={s.id} value={s.id}>{s.name}{s.id === overview.data.pondSpecies ? ' (pond species)' : ''}</option>)}
          </select>
        </label>
        <DateRangePicker value={win} onChange={setWin} />
      </div>

      {error && !r ? <ErrorState message={error.message} onRetry={() => mutate()} /> : (isLoading || !key) && !r ? <Skeleton className="h-[40rem] rounded-2xl" /> : !r ? null : (
        <article aria-label="Water quality report" className="space-y-6">
          {/* header */}
          <section className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">FishSafe water quality report</div>
                <h2 className="mt-1 text-2xl font-bold text-fg">{h.species.name}</h2>
                <p className="text-sm text-muted">{windowLabel(win)}</p>
              </div>
              <div className="text-right text-xs text-muted">Generated<br /><span className="font-semibold text-fg">{formatDateTime(r.generatedAt)}</span></div>
            </div>
            <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-fg">{verdict(h)}</p>
          </section>

          {h.count === 0 ? (
            <EmptyState message="No sensor readings in this period" hint="Choose a longer period or check that the device was reporting." />
          ) : (
            <>
              {/* key figures */}
              <section aria-label="Key figures" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  ['Readings analysed', h.readings.toLocaleString(), ''],
                  ['Alerts raised', alertSummary.total, `${alertSummary.DANGER} critical · ${alertSummary.WARNING} warning · ${alertSummary.INFO} info`],
                  ['Warnings / danger events', h.excursions.length, 'periods outside the safe zone'],
                  ['Offline periods', offline.length, offline.length ? 'device stopped reporting' : 'no connectivity problems'],
                ].map(([l, v, sub]) => (
                  <div key={l} className="card !p-4"><div className="card-title">{l}</div><div className="mt-1 text-3xl font-bold tabular-nums text-fg">{v}</div><div className="text-xs text-muted">{sub}</div></div>
                ))}
              </section>

              {/* zones + comparison */}
              <section className="card" aria-label="Time in each zone">
                <h3 className="mb-2 font-semibold text-fg">Time in each zone for {h.species.name}</h3>
                <ZoneBar zones={h.summary.zones} />
                <h3 className="mb-2 mt-6 font-semibold text-fg">The same water, judged for each species</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="py-2 pr-3 text-left font-semibold">Species</th><th scope="col" className="px-3 py-2 text-right font-semibold">Safe</th><th scope="col" className="px-3 py-2 text-right font-semibold">Warning</th><th scope="col" className="px-3 py-2 text-right font-semibold">Dangerous</th><th scope="col" className="px-3 py-2 text-right font-semibold">Events</th></tr></thead>
                    <tbody className="divide-y divide-line">
                      {r.compare.map((c) => (
                        <tr key={c.species.id} className={c.species.id === h.species.id ? 'bg-brand/5' : ''}>
                          <th scope="row" className="py-2.5 pr-3 text-left font-medium text-fg">{c.species.name}</th>
                          {['SAFE', 'WARNING', 'DANGER'].map((k) => <td key={k} className="px-3 py-2.5 text-right tabular-nums">{c.summary.zones[k] ?? '—'}{c.summary.zones[k] != null ? '%' : ''}</td>)}
                          <td className="px-3 py-2.5 text-right tabular-nums">{c.excursions.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* parameters */}
              <section className="card" aria-label="Temperature"><h3 className="mb-3 font-semibold text-fg">Temperature</h3><StatTiles stats={h.summary.temperature} unit="°C" wide /><div className="mt-4"><TemperatureChart series={h.series} thresholds={h.thresholds.temperature} long={long} /></div></section>
              <section className="card" aria-label="pH"><h3 className="mb-3 font-semibold text-fg">pH</h3><StatTiles stats={h.summary.ph} decimals={2} wide /><div className="mt-4"><PHChart series={h.series} thresholds={h.thresholds.ph} long={long} /></div></section>

              {/* events */}
              <section className="card" aria-label="Warnings and dangerous conditions">
                <h3 className="font-semibold text-fg">Warnings and dangerous conditions</h3>
                {h.excursions.length === 0 ? <p className="mt-2 text-sm text-muted">None in this period.</p> : (
                  <ul className="mt-2 divide-y divide-line">
                    {h.excursions.slice(0, 10).map((e) => (
                      <li key={e.start} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-2.5">
                        <StatusBadge status={e.status} size="sm" />
                        <div className="min-w-0 flex-1"><p className="text-sm text-fg">{e.reason}</p><p className="text-xs text-muted">{formatDateTime(e.start)}{e.durationMinutes > 0 ? ` · ${formatMinutes(e.durationMinutes)}` : ' · single reading'}</p></div>
                      </li>
                    ))}
                  </ul>
                )}
                {h.excursions.length > 10 && <p className="mt-2 text-xs text-muted">Showing the 10 most recent of {h.excursions.length}. See the species page for the full list.</p>}
              </section>

              <section className="card" aria-label="Alerts">
                <h3 className="font-semibold text-fg">Alerts in this period</h3>
                {alertSummary.total === 0 ? <p className="mt-2 text-sm text-muted">No alerts were raised.</p> : (
                  <>
                    <p className="mt-1 text-sm text-muted">{Object.entries(alertSummary.byKind).map(([k, n]) => `${n} × ${KIND_LABEL[k] || k}`).join(' · ')}</p>
                    <ul className="mt-2 divide-y divide-line">
                      {r.alerts.slice(0, 15).map((a) => {
                        const sev = SEVERITY[a.severity] || SEVERITY.INFO;
                        return (
                          <li key={a._id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5 text-sm">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${sev.badge}`}>{sev.label}</span>
                            <div className="min-w-0 flex-1"><span className="font-medium text-fg">{a.title || a.message}</span><p className="text-xs text-muted">{a.reason || a.message}</p></div>
                            <span className="text-xs text-muted">{formatDateTime(a.createdAt)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    {alertSummary.total > 15 && <p className="mt-2 text-xs text-muted">Showing 15 of {alertSummary.total}. <Link href="/alerts" className="no-print font-medium text-brand hover:underline">Open the notification center</Link></p>}
                  </>
                )}
              </section>

              {offline.length > 0 && (
                <section className="card" aria-label="Connectivity">
                  <h3 className="font-semibold text-fg">Connectivity</h3>
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {offline.map((a) => (
                      <li key={a._id} className="flex flex-wrap justify-between gap-2 py-2"><span className="text-fg">Offline from {formatDateTime(a.createdAt)}</span><span className="text-muted">{a.active ? 'still offline' : `back online · ${formatMinutes(Math.round((new Date(a.resolvedAt) - new Date(a.createdAt)) / 60000))}`}</span></li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          <p className="flex items-start gap-1.5 text-xs text-muted"><InfoIcon size={14} className="mt-0.5 shrink-0" />Generated from stored sensor readings and judged against the limits configured for {h.species.name} ({ZONE_TITLE.SAFE.toLowerCase()} / warning / dangerous). It is general guidance, not a veterinary diagnosis or a guarantee of fish health.</p>
        </article>
      )}
    </>
  );
}
