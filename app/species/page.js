'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSpeciesOverview } from '@/lib/hooks';
import PageHeader from '@/components/PageHeader';
import FishSpeciesCard from '@/components/FishSpeciesCard';
import LiveIndicator from '@/components/LiveIndicator';
import { ErrorState, EmptyState, Skeleton } from '@/components/Loading';
import { SearchIcon, PlusIcon } from '@/components/Icons';

const FILTERS = [['ALL', 'All'], ['SAFE', 'Safe'], ['WARNING', 'Warning'], ['DANGER', 'Dangerous'], ['UNKNOWN', 'Unknown']];

export default function SpeciesPage() {
  const { data, error, isLoading, isValidating, updatedAt, refresh } = useSpeciesOverview();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');

  const all = data?.species || [];
  const counts = useMemo(() => {
    const c = { ALL: all.length, SAFE: 0, WARNING: 0, DANGER: 0, UNKNOWN: 0 };
    all.forEach((s) => { c[s.assessment?.status || 'UNKNOWN'] += 1; });
    return c;
  }, [all]);
  const shown = all.filter((s) => {
    const text = `${s.name} ${s.scientific}`.toLowerCase();
    return text.includes(q.trim().toLowerCase()) && (status === 'ALL' || (s.assessment?.status || 'UNKNOWN') === status);
  });

  return (
    <>
      <PageHeader
        title="Fish Species"
        subtitle="Each species has its own temperature and pH limits. The card shows how the current pond water rates for that fish."
        right={<div className="flex items-center gap-3"><LiveIndicator updatedAt={updatedAt} isValidating={isValidating} hasError={!!error && !!data} onRefresh={refresh} />
          <Link href="/settings#species" className="btn"><PlusIcon size={16} /> Add species</Link></div>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or scientific name" aria-label="Search fish species"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-fg placeholder:text-subtle" />
        </div>
        <div className="segmented flex-wrap" role="group" aria-label="Filter by condition">
          {FILTERS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(k)}>{l} <span className="ml-1 text-xs opacity-70">{counts[k]}</span></button>
          ))}
        </div>
      </div>

      {error && !data ? <ErrorState message={error.message} onRetry={refresh} /> : isLoading && !data ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div>
      ) : shown.length === 0 ? (
        <EmptyState message={all.length === 0 ? 'No fish species registered' : 'No species match your search'} hint={all.length === 0 ? 'Add a species in Settings.' : 'Try a different name or clear the condition filter.'} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => <FishSpeciesCard key={s.id} species={s} pond={s.id === data.pondSpecies} />)}
        </div>
      )}
    </>
  );
}
