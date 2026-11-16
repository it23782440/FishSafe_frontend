import Link from 'next/link';
import { statusOf } from '@/lib/sensorMeta';
import { PARAM_LABEL } from '@/lib/environment';
import { StatusGlyph } from './Icons';

/* KPI tile: icon, label, big value, optional status text and hint. */
export default function SummaryCard({ icon: Icon, label, value, unit, hint, status, statusText, href, loading }) {
  const s = status ? statusOf(status) : null;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon size={20} />
        </span>
        {s && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
            <StatusGlyph glyph={s.glyph} size={12} />
            {statusText || PARAM_LABEL[status]}
          </span>
        )}
      </div>
      <div className="card-title mt-3">{label}</div>
      {loading ? (
        <div className="mt-1.5 h-8 w-24 animate-pulse rounded bg-line/70" />
      ) : (
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight tabular-nums text-fg">{value}</span>
          {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
        </div>
      )}
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </>
  );
  const cls = 'card relative block overflow-hidden !p-4';
  return href ? (
    <Link href={href} className={`${cls} card-hover`}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
