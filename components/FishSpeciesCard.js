import Link from 'next/link';
import FishArt from './FishArt';
import StatusBadge from './StatusBadge';
import { safeRangeText } from '@/lib/sensorMeta';
import { ZONE_TITLE } from '@/lib/environment';
import { ArrowRightIcon } from './Icons';

export default function FishSpeciesCard({ species, pond }) {
  const a = species.assessment;
  const t = species.thresholds || {};
  return (
    <article className="card card-hover group flex flex-col overflow-hidden !p-0">
      {/* decorative duplicate of the button below: skipped by keyboard and screen readers */}
      <Link href={`/species/${species.id}`} aria-hidden="true" tabIndex={-1} className="relative block h-40">
        <FishArt id={species.id} name={species.name} imageUrl={species.imageUrl} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
        {pond && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow dark:text-slate-900">
            Pond species
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold leading-tight text-fg">{species.name}</h3>
        <p className="text-sm italic text-muted">{species.scientific || '—'}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-surface-2 p-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Temperature</dt>
            <dd className="font-semibold tabular-nums text-fg">{safeRangeText('temperature', t.temperature)}</dd>
          </div>
          <div className="rounded-lg bg-surface-2 p-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">pH</dt>
            <dd className="font-semibold tabular-nums text-fg">{safeRangeText('ph', t.ph)}</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">Current condition</span>
          {a ? <StatusBadge status={a.status} size="sm" /> : <StatusBadge status="UNKNOWN" size="sm" />}
        </div>
        {a && a.status !== 'SAFE' && a.reasons?.[0] && <p className="mt-2 line-clamp-2 text-xs text-muted">{a.reasons[0]}</p>}
        <div className="mt-auto pt-4">
        <Link href={`/species/${species.id}`} aria-label={`View details for ${species.name}${a ? `, currently ${ZONE_TITLE[a.status].toLowerCase()}` : ''}`} className="btn w-full !justify-between">
          View details <ArrowRightIcon size={16} />
        </Link>
        </div>
      </div>
    </article>
  );
}
