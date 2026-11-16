'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, POLL_MS } from './api';

/*
 * Thin wrapper around SWR that polls the given endpoint on an interval.
 * This is our REAL-TIME strategy: polling survives Render's free-tier
 * sleeping, needs no persistent connection and works cleanly on Vercel.
 *
 * Extra over the original: `isValidating` (a request is in flight) and
 * `updatedAt` (when the last successful response arrived) so the UI can show
 * an honest "live / updated 4s ago" indicator.
 */
export function useLiveData(path, { interval = POLL_MS, ...opts } = {}) {
  const [updatedAt, setUpdatedAt] = useState(null);

  const { data, error, isLoading, isValidating, mutate } = useSWR(path, fetcher, {
    refreshInterval: interval,
    revalidateOnFocus: true,
    keepPreviousData: true,
    shouldRetryOnError: true,
    errorRetryInterval: 5000,
    onSuccess: () => setUpdatedAt(Date.now()),
    ...opts,
  });

  return { data, error, isLoading, isValidating, updatedAt, refresh: mutate };
}
