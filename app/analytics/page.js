'use client';
import { useEffect, useState } from 'react';
import { useLiveData } from '@/lib/useLiveData';
import { useSpeciesOverview } from '@/lib/hooks';
import { endpoints } from '@/lib/api';
import { windowHours, windowLabel, windowQuery } from '@/lib/window';
import PageHeader from '@/components/PageHeader';
import DateRangePicker from '@/components/DateRangePicker';
import TemperatureChart from '@/components/TemperatureChart';
import PHChart from '@/components/PHChart';
import StatTiles from '@/components/StatTiles';
import ZoneBar from '@/components/ZoneBar';
import LiveIndicator from '@/components/LiveIndicator';
import { ErrorState, EmptyState, Skeleton } from '@/components/Loading';
import { InfoIcon } from '@/components/Icons';

export default function AnalyticsPage() {
  const overview = useSpeciesOverview();
  const [win, setWin] = useState({ range: '24h' });
  const [speciesId, setSpeciesId] = useState('');

  // Default the species to the pond species once it is known.
  useEffect(() => {
    if (!speciesId && overview.data?.pondSpecies) setSpeciesId(overview.data.pondSpecies);
  }, [overview.data, speciesId]);

  const hist = useLiveData(speciesId ? endpoints.speciesHistory(speciesId, windowQuery(win)) : null, { interval: 30000 });
  const h = hist.data;
  const long = windowHours(win) > 48;

  return (
    <>
      <PageHeader
        title="Sensor Analytics"
        subtitle="Temperature and pH from stored sensor records, with min / max / average, trend and the share of time spent in each zone."
        right={<div className="flex flex-wrap items-start gap-3"><LiveIndicator updatedAt={hist.updatedAt} isValidating={hist.isValidating} hasError={!!hist.error && !!h} onRefresh={hist.refresh} /></div>}
      />

      <div className="card mb-6 flex flex-wrap items-end justify-between gap-4">
        <label className="text-sm font-medium text-fg">Judge readings against
          <select value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} className="mt-1 block min-w-[220px] rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg">
            {(overview.data?.species || []).map((s) => <option key={s.id} value={s.id}>{s.name}{s.id === overview.data.pondSpecies ? ' (pond species)' : ''}</option>)}
          </select>
        </label>
        <DateRangePicker value={win} onChange={setWin} />
      </div>

      {(overview.error && !overview.data) || (hist.error && !h) ? <ErrorState message={(hist.error || overview.error).message} onRetry={hist.refresh} /> :
        !h && (hist.isLoading || !speciesId) ? <Skeleton className="h-[34rem] rounded-2xl" /> :
        !h || h.count === 0 ? <EmptyState message="No sensor records in this period" hint={`Nothing was stored for ${windowLabel(win).toLowerCase()}. Pick another period or check the device.`} /> : (
          <div className="space-y-6">
            <div className="card"><h2 className="mb-2 text-sm font-semibold text-fg">Time in each zone for {h.species.name} · {windowLabel(win)} · {h.readings} readings</h2><ZoneBar zones={h.summary.zones} /></div>
            <section className="card" aria-label="Temperature analytics">
              <h2 className="mb-3 text-lg font-bold text-fg">Temperature</h2>
              <StatTiles stats={h.summary.temperature} unit="°C" wide />
              <div className="mt-5"><TemperatureChart series={h.series} thresholds={h.thresholds.temperature} long={long} /></div>
            </section>
            <section className="card" aria-label="pH analytics">
              <h2 className="mb-3 text-lg font-bold text-fg">pH</h2>
              <StatTiles stats={h.summary.ph} decimals={2} wide />
              <div className="mt-5"><PHChart series={h.series} thresholds={h.thresholds.ph} long={long} /></div>
            </section>
            <p className="flex items-center gap-1.5 text-xs text-muted"><InfoIcon size={14} />{h.bucketed ? 'Long period: charts show averages per interval and brief spikes still colour the point. ' : ''}Min, max and average are exact over the whole period. Shaded band = recommended range, dashed lines = danger limits.</p>
          </div>
        )}
    </>
  );
}
