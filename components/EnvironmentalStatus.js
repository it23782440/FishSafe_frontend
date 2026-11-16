'use client';
import { statusOf } from '@/lib/sensorMeta';
import { ZONE_TITLE, PARAM_LABEL } from '@/lib/environment';
import { formatDateTime, timeAgo, useNow } from '@/lib/time';
import { StatusGlyph, SensorIcon, InfoIcon } from './Icons';

/*
 * FISH ENVIRONMENT STATUS - the dedicated status component for one species.
 * Driven entirely by the backend assessment (so every page agrees). Status is
 * shown as text + icon + colour, never colour alone.
 */
function ParamRow({ p }) {
  const s = statusOf(p.status);
  const has = p.value !== null && p.value !== undefined;
  return (
    <li className="flex flex-wrap items-start gap-3 rounded-xl border border-line bg-surface/70 p-3">
      <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${s.bg} ${s.text}`}>
        <SensorIcon sensor={p.sensor} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-fg">{p.sensor === 'ph' ? 'pH Level' : 'Temperature'}:</span>
          <span className="text-sm font-bold tabular-nums text-fg">
            {has ? `${Number(p.value).toFixed(p.sensor === 'ph' ? 2 : 1)}${p.unit ? ` ${p.unit}` : ''}` : '—'}
          </span>
          <span className={`text-sm font-bold ${s.text}`}>– {PARAM_LABEL[p.status]}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted">Recommended: {p.expected || '—'}</p>
        {p.status !== 'SAFE' && <p className="mt-1.5 text-sm text-fg/90">{p.reason}</p>}
      </div>
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
        <StatusGlyph glyph={s.glyph} size={12} /> {PARAM_LABEL[p.status]}
      </span>
    </li>
  );
}

export default function EnvironmentalStatus({ assessment, compact = false }) {
  const now = useNow(1000);
  if (!assessment) return null;
  const a = assessment;
  const s = statusOf(a.status);
  const last = statusOf(a.lastKnownStatus);

  return (
    <section aria-label={`Environment status for ${a.species?.name}`} aria-live="polite" className={`overflow-hidden rounded-2xl border bg-surface shadow-card ${s.border}`}>
      <div className={`flex flex-wrap items-center gap-4 bg-gradient-to-r ${s.hero} to-transparent p-5`}>
        <span className="relative grid h-14 w-14 shrink-0 place-items-center">
          {a.status !== 'UNKNOWN' && <span className={`absolute inset-0 rounded-full ${s.dot} opacity-25 animate-ring`} />}
          <span className={`relative grid h-14 w-14 place-items-center rounded-full text-white ${s.dot}`}>
            <StatusGlyph glyph={s.glyph} size={26} />
          </span>
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Fish environment status{a.species?.name ? ` · ${a.species.name}` : ''}</div>
          <div className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${s.text}`}>{ZONE_TITLE[a.status]}</div>
          <p className="mt-0.5 text-sm text-muted">{a.message}</p>
        </div>
        <div className="ml-auto text-right text-xs text-muted" title={formatDateTime(a.readingTimestamp)}>
          {a.readingTimestamp ? (<>Latest reading<br /><span className="text-sm font-semibold text-fg">{timeAgo(a.readingTimestamp, now)}</span></>) : 'No readings yet'}
        </div>
      </div>

      <div className="space-y-4 p-5">
        {a.stale && (
          <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <InfoIcon size={16} className="mt-0.5 shrink-0" />
            <span>
              Readings are too old to confirm the current condition. The last known status (about {Math.round((a.ageSeconds || 0) / 60)} min ago) was{' '}
              <b className={last.text}>{ZONE_TITLE[a.lastKnownStatus]}</b>.
            </span>
          </div>
        )}
        <ul className="space-y-2">
          <ParamRow p={a.parameters.temperature} />
          <ParamRow p={a.parameters.ph} />
        </ul>
        {!compact && a.recommendations.length > 0 && (
          <div className="rounded-xl bg-surface-2 p-4">
            <div className="text-sm font-semibold text-fg">Recommended action</div>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted">
              {a.recommendations.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}
        {!compact && a.status === 'SAFE' && <p className="text-sm text-muted">{a.message}</p>}
      </div>
    </section>
  );
}
