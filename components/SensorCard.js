import Link from 'next/link';
import StatusBadge from './StatusBadge';
import Sparkline from './Sparkline';
import RangeGauge from './RangeGauge';
import { SensorIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from './Icons';
import { SENSORS, formatValue, safeRangeText, statusOf } from '@/lib/sensorMeta';
import { trendOf } from '@/lib/stats';

/*
 * A single sensor tile for the main dashboard grid.
 * value + status come from the latest reading; `series` (recent values) powers
 * the sparkline and trend; `thresholds` come from the backend.
 */
export default function SensorCard({ sensorKey, value, status, series = [], thresholds }) {
  const meta = SENSORS[sensorKey];
  if (!meta) return null;
  const s = statusOf(status);
  const alerting = status === 'WARNING' || status === 'DANGER';

  const delta = trendOf(series);
  const [lo, hi] = meta.domain;
  const steady = delta === null || Math.abs(delta) < (hi - lo) * 0.01;

  return (
    <Link
      href={`/sensors/${sensorKey}`}
      aria-label={`${meta.label}: ${formatValue(sensorKey, value)} ${meta.unit}, ${s.label}. Open details`}
      className={`card card-hover group relative block overflow-hidden ${
        alerting ? s.border : ''
      }`}
    >
      {/* status accent */}
      <span className={`absolute inset-x-0 top-0 h-1 ${s.bar}`} aria-hidden="true" />

      <div className="flex items-center justify-between gap-2">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{ background: `${meta.color}1f`, color: meta.color }}
        >
          <SensorIcon sensor={sensorKey} size={18} />
        </span>
        <StatusBadge status={status} size="sm" />
      </div>
      <div className="card-title mt-3">{meta.label}</div>

      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tracking-tight tabular-nums text-fg">
            {formatValue(sensorKey, value)}
          </span>
          {meta.unit && <span className="text-sm font-medium text-muted">{meta.unit}</span>}
        </div>
        {delta !== null && (
          <span
            className="mb-1 inline-flex items-center gap-0.5 text-xs font-medium text-muted tabular-nums"
            title="Change over the recent readings"
          >
            {steady ? (
              <ArrowRightIcon size={12} />
            ) : delta > 0 ? (
              <ArrowUpIcon size={12} />
            ) : (
              <ArrowDownIcon size={12} />
            )}
            {steady ? 'steady' : Math.abs(delta).toFixed(meta.decimals)}
          </span>
        )}
      </div>

      <Sparkline values={series} color={meta.color} className="mt-3" />

      <div className="mt-4">
        <RangeGauge sensorKey={sensorKey} value={value} thresholds={thresholds} status={status} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>
          Safe <span className="font-medium text-fg/80">{safeRangeText(sensorKey, thresholds)}</span>
        </span>
        <ArrowRightIcon
          size={14}
          className="opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0"
        />
      </div>
    </Link>
  );
}
