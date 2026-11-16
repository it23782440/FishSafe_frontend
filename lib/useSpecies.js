'use client';
import { useCallback, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { fetcher, sendJson, endpoints, DEVICE_ID } from './api';
import { useSpeciesOverview } from './hooks';

// Shown if the backend isn't reachable yet / has no species endpoint.
const FALLBACK = [
  { id: 'tilapia', name: 'Nile Tilapia', scientific: 'Oreochromis niloticus', description: '' },
  { id: 'carp', name: 'Common Carp', scientific: 'Cyprinus carpio', description: '' },
  { id: 'catfish', name: 'African Catfish', scientific: 'Clarias gariepinus', description: '' },
];

/*
 * Fish species selection.
 *  - `species`  list of selectable profiles (from GET /api/species)
 *  - `current`  the profile currently applied to this device
 *  - `select`   switches species: optimistic UI, PUT to the backend, then every
 *               cached API response is revalidated so statuses, gauges, charts
 *               and alerts all re-evaluate against the new limits at once.
 */
export function useSpecies() {
  const { mutate } = useSWRConfig();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const list = useSpeciesOverview();
  const device = useSWR(endpoints.device(), fetcher, { refreshInterval: 15000, keepPreviousData: true });

  const species = list.data?.species || FALLBACK;
  const defaultId = list.data?.default || 'tilapia';
  const currentId = list.data?.pondSpecies || device.data?.species || defaultId;
  const current = species.find((s) => s.id === currentId) || species[0];

  const select = useCallback(
    async (id) => {
      if (id === currentId || saving) return;
      setSaving(true);
      setError(null);
      try {
        // Optimistic: update the device cache right away, revalidate afterwards.
        await mutate(
          endpoints.device(),
          (prev) => ({ ...(prev || {}), deviceId: DEVICE_ID, species: id }),
          { revalidate: false }
        );
        await sendJson(endpoints.setSpecies(), 'PUT', { deviceId: DEVICE_ID, species: id });
        await mutate(() => true); // revalidate everything (latest, history, alerts, thresholds...)
      } catch (e) {
        setError(e.message || 'Could not change fish type');
        await mutate(endpoints.device()); // roll back to the server's truth
      } finally {
        setSaving(false);
      }
    },
    [currentId, saving, mutate]
  );

  return { species, current, currentId, select, saving, error, clearError: () => setError(null) };
}
