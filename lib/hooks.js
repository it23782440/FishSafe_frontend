'use client';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { useLiveData } from './useLiveData';
import { endpoints, sendJson, DEVICE_ID } from './api';

/* Shared, de-duplicated data hooks (SWR dedupes identical keys across components). */

/** Heartbeat / connectivity of the monitored device. */
export const useDeviceStatus = () => useLiveData(endpoints.device(), { interval: 15000 });

/** All registered species, each with its current assessment, plus zone counts and the pond species. */
export const useSpeciesOverview = () => useLiveData(endpoints.species(DEVICE_ID));

/** Latest raw reading. A 404 means "no readings yet" and is NOT an error state. */
export const useLatestReading = () => useLiveData(endpoints.latest());

/** Unread alert count for the sidebar / bell badge. */
export function useUnreadCount() {
  const { data } = useLiveData(endpoints.alerts({ limit: '1' }), { interval: 15000 });
  return data?.unreadCount ?? 0;
}

/** Species supported by the Harvest Feasibility calculator (static config, no polling). */
export const useFeasibilitySpecies = () =>
  useLiveData(endpoints.feasibilitySpecies(), { interval: 0, revalidateOnFocus: false });

/**
 * Harvest Feasibility: run the calculation on demand (POST, nothing is stored).
 * `error` carries `field` when the server rejected a specific input.
 */
export function useFeasibilityCalculator() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const calculate = async (body) => {
    setLoading(true);
    setError(null);
    try {
      const r = await sendJson(endpoints.feasibilityCalculate(), 'POST', { deviceId: DEVICE_ID, ...body });
      setResult(r);
      return r;
    } catch (e) {
      setError(e);
      return null;
    } finally {
      setLoading(false);
    }
  };
  return { result, error, loading, calculate, clear: () => { setResult(null); setError(null); } };
}

/** Mark alerts read/unread and refresh every cached alert list (list, sidebar badge, bell). */
export function useAlertActions() {
  const { mutate } = useSWRConfig();
  const [busyId, setBusyId] = useState(null);
  const refresh = () => mutate((k) => typeof k === 'string' && k.startsWith('/api/alerts'));
  const toggleRead = async (alert) => {
    setBusyId(alert._id);
    try {
      await sendJson(endpoints.markAlertRead(alert._id), 'PATCH', { read: !alert.read });
      await refresh();
    } finally {
      setBusyId(null);
    }
  };
  const markAllRead = async () => {
    await sendJson(endpoints.markAllAlertsRead(), 'POST', {});
    await refresh();
  };
  return { toggleRead, markAllRead, busyId, refresh };
}
