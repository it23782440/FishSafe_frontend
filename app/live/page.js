'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLiveData } from '@/lib/useLiveData';
import { useThresholds } from '@/lib/useThresholds';
import { useSpeciesOverview, useLatestReading, useDeviceStatus } from '@/lib/hooks';
import { endpoints, DEVICE_ID } from '@/lib/api';
import { SENSOR_KEYS, formatValue } from '@/lib/sensorMeta';
import { downsample } from '@/lib/stats';
import { formatDateTime, timeAgo, useNow } from '@/lib/time';
import PageHeader from '@/components/PageHeader';
import LiveIndicator from '@/components/LiveIndicator';
import EnvironmentalStatus from '@/components/EnvironmentalStatus';
import RangeGauge from '@/components/RangeGauge';
import StatusBadge from '@/components/StatusBadge';
import TemperatureChart from '@/components/TemperatureChart';
import PHChart from '@/components/PHChart';
import DeviceHealth from '@/components/DeviceHealth';
import SensorCard from '@/components/SensorCard';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import { ErrorState, EmptyState, Notice, Skeleton } from '@/components/Loading';
import { WifiOffIcon } from '@/components/Icons';

function BigReading({ k, label, unit, reading, assessment, thresholds, stale }) {
  const p = assessment?.parameters?.[k];
  const status = !assessment || stale ? 'UNKNOWN' : p.status;
  const now = useNow(1000);
  return (
    <section className="card" aria-label={label}>
      <div className="flex items-start justify-between gap-2">
        <div className="card-title">{label}</div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-5xl font-bold tracking-tight tabular-nums text-fg">{reading && reading[k] != null ? formatValue(k, reading[k]) : '—'}</span>
        <span className="text-lg font-medium text-muted">{unit}</span>
      </div>
      <p className="mt-1 text-xs text-muted" title={formatDateTime(reading?.timestamp)}>{reading?.timestamp ? `Received ${timeAgo(reading.timestamp, now)}` : 'No reading yet'}</p>
      {thresholds && <div className="mt-5"><RangeGauge sensorKey={k} value={reading?.[k]} thresholds={thresholds} status={status} showScale /></div>}
      {p && p.status !== 'SAFE' && !stale && <p className="mt-3 text-sm text-muted">{p.reason}</p>}
    </section>
  );
}

export default function LivePage() {
  const [range, setRange] = useState('6h');
  const overview = useSpeciesOverview();
  const latest = useLatestReading();
  const device = useDeviceStatus();
  const thresholds = useThresholds();
  const now = useNow(1000);

  const pondId = overview.data?.pondSpecies;
  const pond = overview.data?.species?.find((s) => s.id === pondId);
  const a = pond?.assessment;
  const trend = useLiveData(pondId ? endpoints.speciesHistory(pondId, `range=${range}`) : null, { interval: 30000 });
  const history = useLiveData(endpoints.history('6h', DEVICE_ID, 200), { interval: 30000 });
  const events = useLiveData(endpoints.alerts({ kind: 'device_offline', limit: '5' }), { interval: 30000 });

  const reading = latest.data;
  const noReadings = latest.error?.status === 404;
  const dev = device.data;

  const series = useMemo(() => {
    const rows = Array.isArray(history.data) ? history.data : [];
    const out = {};
    for (const key of SENSOR_KEYS) out[key] = downsample(rows.map((r) => r[key]), 40);
    return out;
  }, [history.data]);

  if (latest.error && !noReadings && !reading) {
    return (<><PageHeader title="Live Monitoring" /><ErrorState message={latest.error.message} onRetry={latest.refresh} /></>);
  }

  return (
    <>
      <PageHeader
        title="Live Monitoring"
        subtitle={'Real-time readings from the pond monitor, updating automatically.'}
        right={<LiveIndicator updatedAt={latest.updatedAt} isValidating={latest.isValidating} hasError={!!latest.error && !!reading} onRefresh={() => { latest.refresh(); device.refresh(); overview.refresh(); trend.refresh(); history.refresh(); events.refresh(); }} />}
      />

      {dev && !dev.online && (
        <div className="mb-4"><Notice icon={<WifiOffIcon size={18} />}><b>Device offline.</b> No data for {timeAgo(dev.lastSeen, now)}. Values shown are the last stored readings and their status is treated as unknown.</Notice></div>
      )}
      {noReadings && <EmptyState message="No readings received yet" hint="Values appear here as soon as the device uploads its first reading." />}

      {!noReadings && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <BigReading k="temperature" label="Water temperature" unit="°C" reading={reading} assessment={a} thresholds={pond?.thresholds?.temperature} stale={a?.stale} />
            <BigReading k="ph" label="Water pH" unit="" reading={reading} assessment={a} thresholds={pond?.thresholds?.ph} stale={a?.stale} />
          </div>
          {a && <div className="mt-6"><EnvironmentalStatus assessment={a} /></div>}

          <section className="card mt-6" aria-label="Live graphs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-semibold text-fg">Live graphs</h2><p className="text-xs text-muted">Stored readings, updating automatically · band = recommended for {pond?.name}</p></div>
              <TimeRangeSelector value={range} onChange={setRange} />
            </div>
            {trend.isLoading && !trend.data ? <Skeleton className="h-64 rounded-xl" /> : !trend.data || trend.data.count === 0 ? (
              <EmptyState message="No readings in this period" hint="Try a longer period." />
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Temperature (°C)</div><TemperatureChart series={trend.data.series} thresholds={trend.data.thresholds.temperature} long={false} /></div>
                <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">pH</div><PHChart series={trend.data.series} thresholds={trend.data.thresholds.ph} long={false} /></div>
              </div>
            )}
          </section>
        </>
      )}

      <h2 className="mb-3 mt-8 text-xl font-bold text-fg">Device health</h2>
      {device.isLoading && !dev ? <Skeleton className="h-48 rounded-2xl" /> : device.error && !dev ? <ErrorState message={device.error.message} onRetry={device.refresh} /> : <DeviceHealth device={dev} events={events.data?.alerts || []} />}

      {reading && (() => {
        const extra = ['turbidity', 'rain', 'conductivity'].filter((k) => reading[k] !== null && reading[k] !== undefined);
        return (
          <section className="mt-8" aria-label="Additional sensors">
            <h2 className="text-xl font-bold text-fg">Additional water-quality sensors</h2>
            {extra.length === 0 ? (
              <p className="mt-1 text-sm text-muted">The device is not sending turbidity, rain or conductivity values, so there is nothing to show here. FishSafe judges fish conditions from temperature and pH.</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted">These sensors use general limits. Open one for its full history.</p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {extra.map((k) => (
                    <SensorCard key={k} sensorKey={k} value={reading[k]} status={reading.statuses?.[k] || 'UNKNOWN'} series={series[k]} thresholds={thresholds[k]} />
                  ))}
                </div>
              </>
            )}
            <p className="mt-3 text-sm text-muted">Need more detail? <Link className="font-medium text-brand hover:underline" href="/sensors/temperature">Temperature</Link> · <Link className="font-medium text-brand hover:underline" href="/sensors/ph">pH</Link></p>
          </section>
        );
      })()}
    </>
  );
}
