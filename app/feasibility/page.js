'use client';
import { useEffect, useRef } from 'react';
import { useFeasibilitySpecies, useFeasibilityCalculator, useSpeciesOverview } from '@/lib/hooks';
import PageHeader from '@/components/PageHeader';
import FeasibilityForm from '@/components/FeasibilityForm';
import FeasibilityResult from '@/components/FeasibilityResult';
import { ErrorState, Skeleton } from '@/components/Loading';

/*
 * Harvest Feasibility: "Can I reach this harvest by this date, and what must I do to get there?"
 * The farmer enters stock, feeding and target; water conditions come from the sensors.
 * All calculations run on the backend (POST /api/feasibility/calculate).
 */
export default function FeasibilityPage() {
  const list = useFeasibilitySpecies();
  const overview = useSpeciesOverview();
  const calc = useFeasibilityCalculator();
  const resultRef = useRef(null);

  // Bring the result into view once it arrives.
  useEffect(() => {
    if (calc.result && resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [calc.result]);

  const species = list.data?.species || [];

  return (
    <>
      <PageHeader
        title="Harvest Feasibility"
        subtitle="Can you reach your harvest by your date – and what must change to get there? Enter what you know about your pond; water conditions come from your sensors."
      />

      {list.error && !list.data ? (
        <ErrorState message={list.error.message} onRetry={list.refresh} />
      ) : (
        <FeasibilityForm
          species={species}
          defaultSpecies={overview.data?.pondSpecies}
          onSubmit={calc.calculate}
          loading={calc.loading}
          serverError={calc.error}
        />
      )}

      <div ref={resultRef} className="scroll-mt-20 pt-6">
        {calc.loading && (
          <div className="space-y-4" aria-busy="true" aria-label="Calculating">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        )}
        {!calc.loading && calc.error && !calc.error.field && calc.error.status !== 400 && (
          <ErrorState message={calc.error.message} onRetry={() => document.querySelector('form [type=submit]')?.click()} />
        )}
        {!calc.loading && calc.result && <FeasibilityResult r={calc.result} />}
      </div>
    </>
  );
}
