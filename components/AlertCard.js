'use client';
import Link from 'next/link';
import { SENSORS, formatValue } from '@/lib/sensorMeta';
import { formatDateTime, timeAgo } from '@/lib/time';
import { AlertIcon, XIcon, InfoIcon, CheckIcon, SensorIcon, WifiOffIcon } from './Icons';

/* Backend severities map to the three user-facing levels. */
export const SEVERITY = {
  DANGER: { label: 'Critical', icon: XIcon, badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300', edge: 'border-l-red-500', chip: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  WARNING: { label: 'Warning', icon: AlertIcon, badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300', edge: 'border-l-orange-500', chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' },
  INFO: { label: 'Information', icon: InfoIcon, badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300', edge: 'border-l-sky-500', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
};

export const KIND_LABEL = {
  threshold: 'Reading out of range',
  sensor_missing: 'Missing sensor data',
  device_offline: 'Device offline',
  device_online: 'Device online',
  species_changed: 'Pond species changed',
};

export default function AlertCard({ alert: a, now, onToggleRead, busy }) {
  const sev = SEVERITY[a.severity] || SEVERITY.INFO;
  const kind = a.kind || 'threshold';
  const meta = SENSORS[a.sensor];
  const Icon = kind === 'device_offline' ? WifiOffIcon : meta && kind !== 'species_changed' ? null : sev.icon;
  const unread = !a.read;
  const reading = a.value != null && meta ? `${formatValue(a.sensor, a.value)}${meta.unit ? ` ${meta.unit}` : ''}` : null;

  return (
    <li className={`card flex gap-3 border-l-4 !p-4 ${sev.edge} ${unread ? '' : 'opacity-80'}`}>
      <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${sev.chip}`}>
        {Icon ? <Icon size={19} /> : <SensorIcon sensor={a.sensor} size={19} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {unread && <span className="h-2 w-2 rounded-full bg-brand" title="Unread" aria-label="Unread" />}
          <h3 className="font-semibold text-fg">{a.title || `${meta?.label || a.sensor} ${sev.label.toLowerCase()}`}</h3>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${sev.badge}`}>{sev.label}</span>
          {a.speciesName && kind !== 'device_offline' && kind !== 'device_online' && (
            <Link href={`/species/${a.species}`} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted hover:text-brand">{a.speciesName}</Link>
          )}
          {a.active ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"><span className="h-1.5 w-1.5 rounded-full bg-red-500 live-dot" />Active</span>
          ) : kind === 'threshold' || kind === 'sensor_missing' || kind === 'device_offline' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted"><CheckIcon size={12} />Resolved{a.resolvedAt ? ` ${timeAgo(a.resolvedAt, now)}` : ''}</span>
          ) : null}
        </div>

        {(reading || a.threshold) && kind !== 'species_changed' && (
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {reading && (<div className="flex gap-1.5"><dt className="text-muted">Actual reading</dt><dd className="font-semibold tabular-nums text-fg">{reading}</dd></div>)}
            {a.threshold && (<div className="flex gap-1.5"><dt className="text-muted">{kind === 'threshold' ? 'Expected range' : 'Expected'}</dt><dd className="font-semibold tabular-nums text-fg">{a.threshold}</dd></div>)}
          </dl>
        )}
        <p className="mt-1.5 text-sm text-fg/90"><span className="font-medium">Reason: </span>{a.reason || a.message}</p>
        {a.recommendation && (
          <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted"><span className="font-semibold text-fg">Recommended action: </span>{a.recommendation}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 text-right">
        <time dateTime={a.createdAt} title={formatDateTime(a.createdAt)} className="text-xs text-muted">
          <span className="block font-medium text-fg/80">{timeAgo(a.createdAt, now)}</span>
          <span className="hidden sm:block">{formatDateTime(a.createdAt)}</span>
        </time>
        <button type="button" disabled={busy} onClick={() => onToggleRead(a)} className="btn !px-2.5 !py-1 text-xs">
          {unread ? 'Mark as read' : 'Mark unread'}
        </button>
      </div>
    </li>
  );
}
