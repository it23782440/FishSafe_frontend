'use client';
import useSWR from 'swr';
import { fetcher, endpoints } from './api';
import { FALLBACK_THRESHOLDS } from './sensorMeta';

/*
 * Safe/warning limits from the backend (single source of truth). Fetched once
 * and cached; falls back to the bundled copy so the UI never blocks on it.
 */
export function useThresholds() {
  // The URL includes the device, and the backend answers with the limits of that
  // device's current fish species. After a species change the SWR cache is
  // revalidated (see useSpecies), so these update immediately.
  const { data } = useSWR(endpoints.thresholds(), fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    keepPreviousData: true,
  });

  const merged = {};
  for (const key of Object.keys(FALLBACK_THRESHOLDS)) {
    merged[key] = { ...FALLBACK_THRESHOLDS[key], ...(data?.[key] || {}) };
  }
  return merged;
}
