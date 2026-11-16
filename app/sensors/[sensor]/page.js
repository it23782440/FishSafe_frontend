'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLiveData } from '@/lib/useLiveData';
import { useThresholds } from '@/lib/useThresholds';
import { endpoints } from '@/lib/api';
import { SENSORS, SENSOR_KEYS, formatValue, safeRangeText, statusOf } from '@/lib/sensorMeta';
import { summarize } from '@/lib/stats';
import { useSpecies } from '@/lib/useSpecies';
import { timeAgo, fullTime, useNow } from '@/lib/time';
import HistoryChart from '@/components/HistoryChart';
import StatusBadge from '@/components/StatusBadge';
import RangeGauge from '@/components/RangeGauge';
import LiveIndicator from '@/components/LiveIndicator';
import TimeRangeSelector, { rangeLabel } from '@/components/TimeRangeSelector';
import { SensorIcon, ArrowLeftIcon, WrenchIcon } from '@/components/Icons';
import { Skeleton, ErrorState, EmptyState } from '@/components/Loading';

export default function SensorDetailPage({ params }) {
  // In Next 14 (client component) params is a plain object.
  const sensor = params.sensor;
  const known = SENSOR_KEYS.includes(sensor);
  const [range, setRange] = useState('24h');
  const now = useNow(1000);

  // Hooks must run unconditionally. When the sensor is unknown we still call
  // them (pointing at a valid key) and simply render a "not found" message.
  const safeKey = known ? sensor : SENSOR_KEYS[0];
  const series = useLiveData(endpoints.sensor(safeKey, range));
  const latest = useLiveData(endpoints.latest());
  const thresholds = useThresholds();

  const { current: fish } = useSpecies();

  const points = series.data?.series || [];
  // Exact stats for the whole range, computed by the backend (the chart itself may be
  // downsampled for long ranges). Falls back to local math until the response arrives.
  const summary = useLiveData(endpoints.summary(range), { interval: 30000 });
  const localStats = useMemo(() => summarize(points), [points]);
  const remote = summary.data?.sensors?.[safeKey];
  const stats = remote
    ? { count: remote.count, min: remote.min, avg: remote.avg, max: remote.max, safePct: remote.safePct }
    : localStats;

  if (!known) {
    return (
      <EmptyState
        message={`Unknown sensor: ${sensor}`}
        hint="Pick one of the five sensors from the dashboard."
      />
    );
  }

  const meta = SENSORS[sensor];
  const th = thresholds[sensor];
  const reading = latest.data;
  const current = reading ? reading[sensor] : null;
  const status = reading?.statuses?.[sensor] || 'UNKNOWN';
  const s = statusOf(status);

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"
      >
        <ArrowLeftIcon size={16} /> Dashboard
      </Link>

      {/* Sensor switcher */}
      <nav aria-label="Sensors" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {SENSOR_KEYS.map((k) => (
          <Link
            key={k}
            href={`/sensors/${k}`}
            aria-current={k === sensor ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              k === sensor
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-line bg-surface text-muted hover:text-fg'
            }`}
          >
            <SensorIcon sensor={k} size={15} />
            {SENSORS[k].short}
          </Link>
        ))}
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className="grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: `${meta.color}1f`, color: meta.color }}
          >
            <SensorIcon sensor={sensor} size={28} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{meta.label}</h1>
            <p className="mt-0.5 max-w-xl text-sm text-muted">{meta.blurb}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator
            updatedAt={series.updatedAt}
            isValidating={series.isValidating || latest.isValidating}
            hasError={!!series.error && !!series.data}
            onRefresh={() => {
              series.refresh();
              latest.refresh();
            }}
          />
        </div>
      </div>

      {/* Current value + gauge */}
      <section className="card" aria-label="Current value">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="card-title">Current value</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight tabular-nums text-fg">
                {formatValue(sensor, current)}
              </span>
              <span className="text-lg font-medium text-muted">{meta.unit}</span>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={status} />
            <div className="mt-2 text-xs text-muted" title={fullTime(reading?.timestamp)}>
              {reading?.timestamp ? `Updated ${timeAgo(reading.timestamp, now)}` : 'No reading yet'}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <RangeGauge sensorKey={sensor} value={current} thresholds={th} status={status} showScale />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
          <Legend color="#10b981" label={`Safe ${safeRangeText(sensor, th)}`} />
          <Legend color="#f59e0b" label="Warning" />
          <Legend color="#ef4444" label="Danger" />
          <span className="ml-auto">
            Limits for <b className="font-semibold text-fg/80">{fish?.name}</b>
          </span>
        </div>
      </section>

      {/* Range stats */}
      <section aria-label={`Statistics, ${rangeLabel(range)}`} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Minimum" sub={rangeLabel(range)}>
          {formatValue(sensor, stats.min)} <Unit>{meta.unit}</Unit>
        </Stat>
        <Stat label="Average" sub={rangeLabel(range)}>
          {formatValue(sensor, stats.avg)} <Unit>{meta.unit}</Unit>
        </Stat>
        <Stat label="Maximum" sub={rangeLabel(range)}>
          {formatValue(sensor, stats.max)} <Unit>{meta.unit}</Unit>
        </Stat>
        <Stat label="Time in safe range" sub={`${stats.count} readings`}>
          {stats.safePct == null ? '—' : `${stats.safePct}%`}
        </Stat>
      </section>

      {/* History chart */}
      <section className="card" aria-label="History">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-fg">History</h2>
            <p className="text-xs text-muted">
              {rangeLabel(range)} · shaded band is the safe range, dashed lines are danger limits
              {series.data?.bucketed && ' · averaged per interval; spikes still flag the point'}
            </p>
          </div>
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>
        {series.error && !series.data ? (
          <ErrorState message={series.error.message} onRetry={series.refresh} />
        ) : series.isLoading && !points.length ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : points.length === 0 ? (
          <EmptyState
            message="No data in this time range"
            hint="Try a longer range, or check that the device is reporting."
          />
        ) : (
          <HistoryChart sensorKey={sensor} data={points} thresholds={th} range={range} />
        )}
      </section>

      {/* Calibration info */}
      <details className="card group">
        <summary className="flex cursor-pointer list-none items-center gap-3 font-semibold text-fg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
            <WrenchIcon size={16} />
          </span>
          Calibration notes
          <span className="ml-auto text-xs font-normal text-muted group-open:hidden">Show</span>
          <span className="ml-auto hidden text-xs font-normal text-muted group-open:inline">Hide</span>
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-muted">{CALIBRATION[sensor]}</p>
      </details>
    </div>
  );
}

function Stat({ label, sub, children }) {
  return (
    <div className="card !p-4">
      <div className="card-title">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-fg">{children}</div>
      {sub && <div className="mt-0.5 text-xs text-subtle">{sub}</div>}
    </div>
  );
}

const Unit = ({ children }) => <span className="text-sm font-medium text-muted">{children}</span>;

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color, opacity: 0.7 }} />
      {label}
    </span>
  );
}

const CALIBRATION = {
  temperature:
    'DS18B20 is factory-calibrated. Cross-verify against a reference thermometer; apply an offset in firmware if the deviation is consistent.',
  ph: 'Two-point calibration using pH 4.0 and pH 7.0 buffer solutions. Record the pin voltage in each buffer and set PH_V4 / PH_V7 in the firmware.',
  turbidity:
    'Calibrate against clear water (0 NTU) and known NTU reference samples. Set TURB_V_CLEAR to the clear-water sensor voltage.',
  rain: 'Map raw ADC millivolts: RAIN_MV_DRY (dry board) → 0%, RAIN_MV_WET (soaked board) → 100%.',
  conductivity:
    'Calibrate with a known TDS/EC standard solution at 25 °C. The DFRobot formula includes temperature compensation from the live DS18B20 reading.',
};
