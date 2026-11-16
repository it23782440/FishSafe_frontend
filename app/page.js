'use client';
import Link from 'next/link';
import { useLiveData } from '@/lib/useLiveData';
import { useSpeciesOverview, useLatestReading, useDeviceStatus, useAlertActions } from '@/lib/hooks';
import { endpoints } from '@/lib/api';
import { formatValue } from '@/lib/sensorMeta';
import { ZONE_TITLE } from '@/lib/environment';
import { formatDateTime, timeAgo, useNow } from '@/lib/time';
import PageHeader from '@/components/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import LiveIndicator from '@/components/LiveIndicator';
import StatusBadge from '@/components/StatusBadge';
import AlertCard from '@/components/AlertCard';
import TemperatureChart from '@/components/TemperatureChart';
import PHChart from '@/components/PHChart';
import { ErrorState, EmptyState, Notice, Skeleton } from '@/components/Loading';
import { FishIcon, ActivityIcon, CheckIcon, AlertIcon, XIcon, ClockIcon, ArrowRightIcon, WifiOffIcon, SensorIcon } from '@/components/Icons';

export default function DashboardPage() {
  const overview = useSpeciesOverview();
  const latest = useLatestReading();
  const device = useDeviceStatus();
  const alerts = useLiveData(endpoints.alerts({ active: 'true', limit: '5' }), { interval: 15000 });
  const now = useNow(1000);
  const actions = useAlertActions();

  const pondId = overview.data?.pondSpecies;
  const pond = overview.data?.species?.find((s) => s.id === pondId);
  const a = pond?.assessment;
  const trend = useLiveData(pondId ? endpoints.speciesHistory(pondId, 'range=6h') : null, { interval: 30000 });

  const reading = latest.data;
  const noReadings = latest.error?.status === 404;
  const fatal = overview.error && !overview.data;
  const loading = overview.isLoading && !overview.data;
  const sum = overview.data?.summary;
  const dev = device.data;

  // Never show a stale value as a live status.
  const pStatus = (k) => (!a ? 'UNKNOWN' : a.stale ? 'UNKNOWN' : a.parameters[k].status);
  const val = (k) => (reading && reading[k] != null ? formatValue(k, reading[k]) : '—');

  if (fatal) {
    return (<><PageHeader title="Dashboard" /><ErrorState message={overview.error.message} onRetry={overview.refresh} /></>);
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={pond ? `Monitoring water quality for ${pond.name}` : 'Live water-quality monitoring'}
        right={<LiveIndicator updatedAt={overview.updatedAt} isValidating={overview.isValidating} hasError={!!overview.error && !!overview.data} onRefresh={() => { overview.refresh(); latest.refresh(); device.refresh(); alerts.refresh(); trend.refresh(); }} />}
      />

      {dev && !dev.online && (
        <div className="mb-4"><Notice icon={<WifiOffIcon size={18} />}>The device has not sent data for {dev.secondsSinceLastSeen != null ? timeAgo(dev.lastSeen, now) : 'a while'}. Statuses below are marked <b>Unknown</b> until fresh readings arrive.</Notice></div>
      )}
      {noReadings && <div className="mb-4"><EmptyState message="No readings received yet" hint="Power on the device. Values appear here as soon as the first reading is stored." /></div>}

      <section aria-label="Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={FishIcon} label="Registered fish species" value={sum?.total ?? '—'} hint="Manage in Settings" href="/species" loading={loading} />
        <SummaryCard icon={() => <SensorIcon sensor="temperature" size={20} />} label="Water temperature" value={val('temperature')} unit="°C" status={pStatus('temperature')} hint={reading ? `Updated ${timeAgo(reading.timestamp, now)}` : undefined} href="/live" loading={loading} />
        <SummaryCard icon={() => <SensorIcon sensor="ph" size={20} />} label="Water pH" value={val('ph')} status={pStatus('ph')} hint={reading ? `Updated ${timeAgo(reading.timestamp, now)}` : undefined} href="/live" loading={loading} />
        <SummaryCard icon={ActivityIcon} label="Overall condition" value={a ? ZONE_TITLE[a.status].replace(' ZONE', '') : '—'} status={a?.status || 'UNKNOWN'} statusText={a ? ZONE_TITLE[a.status] : undefined} hint={pond ? `For ${pond.name}` : undefined} href={pondId ? `/species/${pondId}` : '/species'} loading={loading} />
        <SummaryCard icon={CheckIcon} label="Species in safe zone" value={sum?.safe ?? '—'} hint={sum ? `of ${sum.total} · current water` : undefined} href="/species" loading={loading} />
        <SummaryCard icon={AlertIcon} label="Species in warning" value={sum?.warning ?? '—'} hint="Approaching or outside recommended" href="/species" loading={loading} />
        <SummaryCard icon={XIcon} label="Species in danger" value={sum?.danger ?? '—'} hint={sum?.unknown ? `${sum.unknown} unknown (no fresh data)` : 'Outside acceptable limits'} href="/species" loading={loading} />
        <SummaryCard icon={ClockIcon} label="Last sensor update" value={reading ? timeAgo(reading.timestamp, now) : '—'} hint={reading ? formatDateTime(reading.timestamp) : 'No readings yet'} href="/live#device" loading={loading} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2" aria-label="Recent trend">
          <div className="mb-3 flex items-center justify-between">
            <div><h2 className="font-semibold text-fg">Last 6 hours</h2><p className="text-xs text-muted">Temperature and pH from stored sensor readings · shaded band = recommended for {pond?.name || 'the pond species'}</p></div>
            <Link href="/analytics" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">Analytics <ArrowRightIcon size={14} /></Link>
          </div>
          {trend.isLoading && !trend.data ? <Skeleton className="h-52 rounded-xl" /> : !trend.data || trend.data.count === 0 ? (
            <EmptyState message="No readings in the last 6 hours" hint="Charts appear when the device has reported in this period." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Temperature (°C)</div><TemperatureChart series={trend.data.series} thresholds={trend.data.thresholds.temperature} long={false} /></div>
              <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">pH</div><PHChart series={trend.data.series} thresholds={trend.data.thresholds.ph} long={false} /></div>
            </div>
          )}
        </section>

        <section className="card" aria-label="Species conditions">
          <h2 className="font-semibold text-fg">Condition by species</h2>
          <p className="text-xs text-muted">The same water, judged against each species&apos; own limits.</p>
          <ul className="mt-3 divide-y divide-line">
            {(overview.data?.species || []).map((s) => (
              <li key={s.id}>
                <Link href={`/species/${s.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-brand">
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-fg">{s.name}</span>{s.id === pondId && <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">Pond species</span>}</span>
                  <StatusBadge status={s.assessment?.status || 'UNKNOWN'} size="sm" />
                </Link>
              </li>
            ))}
            {loading && <Skeleton className="h-24" />}
          </ul>
        </section>
      </div>

      <section className="mt-6" aria-labelledby="active-alerts">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="active-alerts" className="text-lg font-semibold text-fg">Active alerts</h2>
          <Link href="/alerts" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">Notification center <ArrowRightIcon size={14} /></Link>
        </div>
        {alerts.isLoading && !alerts.data ? <Skeleton className="h-24 rounded-2xl" /> : alerts.data?.alerts?.length ? (
          <ul className="space-y-2">{alerts.data.alerts.map((al) => <AlertCard key={al._id} alert={al} now={now} onToggleRead={actions.toggleRead} busy={actions.busyId === al._id} />)}</ul>
        ) : (
          <div className="card flex items-center gap-3 text-sm text-muted"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"><CheckIcon size={18} /></span>No active alerts.</div>
        )}
      </section>
    </>
  );
}
