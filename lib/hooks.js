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
