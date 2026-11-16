/*
 * Central API helper. All dashboard data goes through here so the backend URL
 * and field names are defined in exactly one place.
 */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fishsafebackend-production.up.railway.app'
).replace(/\/$/, '');

export const DEVICE_ID =
  process.env.NEXT_PUBLIC_DEVICE_ID || 'FISHSAFE-001';

export const POLL_MS = Number(process.env.NEXT_PUBLIC_POLL_MS || 10000);

/** Generic JSON fetcher used by SWR. Throws on non-2xx. */
export async function fetcher(path) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  // No Content-Type header on GET: it would turn every poll into a CORS
  // preflight (OPTIONS) request, doubling the traffic for no benefit.
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`API ${res.status}: ${body || res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** JSON request with a body (PUT/POST). Throws on non-2xx with the server's message. */
export async function sendJson(path, method, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = res.statusText;
    let field;
    try {
      const data = await res.json();
      msg = data.error || msg;
      field = data.field; // which form input the server rejected (if any)
    } catch (_) {
      /* non-JSON error body */
    }
    const err = new Error(msg);
    err.status = res.status;
    err.field = field;
    throw err;
  }
  return res.json();
}

// Convenience path builders (single source of truth for endpoints).
export const endpoints = {
  health: () => `/api/health`,
  latest: (deviceId = DEVICE_ID) =>
    `/api/sensors/latest?deviceId=${encodeURIComponent(deviceId)}`,
  history: (range = '24h', deviceId = DEVICE_ID, limit = 500) =>
    `/api/sensors/history?deviceId=${encodeURIComponent(deviceId)}&range=${range}&limit=${limit}`,
  sensor: (sensor, range = '24h', deviceId = DEVICE_ID) =>
    `/api/sensors/${sensor}?deviceId=${encodeURIComponent(deviceId)}&range=${range}`,
  alerts: (opts = {}, deviceId = DEVICE_ID) => {
    const q = new URLSearchParams({ deviceId, ...opts }).toString();
    return `/api/alerts?${q}`;
  },
  device: (deviceId = DEVICE_ID) =>
    `/api/device/status?deviceId=${encodeURIComponent(deviceId)}`,
  // Limits for the species currently selected for this device.
  thresholds: (deviceId = DEVICE_ID) =>
    `/api/config/thresholds?deviceId=${encodeURIComponent(deviceId)}`,
  // Every registered species. With a deviceId each one carries its current assessment + zone counts.
  species: (deviceId) => (deviceId ? `/api/species?deviceId=${encodeURIComponent(deviceId)}` : `/api/species`),
  speciesOne: (id) => `/api/species/${encodeURIComponent(id)}`,
  speciesAssessment: (id, deviceId = DEVICE_ID) =>
    `/api/species/${encodeURIComponent(id)}/assessment?deviceId=${encodeURIComponent(deviceId)}`,
  // `windowQuery` is "range=24h" or "from=...&to=..." (see lib/window.js)
  speciesHistory: (id, windowQuery, deviceId = DEVICE_ID) =>
    `/api/species/${encodeURIComponent(id)}/history?deviceId=${encodeURIComponent(deviceId)}&${windowQuery}`,
  records: (params = {}, deviceId = DEVICE_ID) =>
    `/api/sensors/records?${new URLSearchParams({ deviceId, ...params }).toString()}`,
  markAlertRead: (id) => `/api/alerts/${encodeURIComponent(id)}/read`,
  markAllAlertsRead: (deviceId = DEVICE_ID) => `/api/alerts/read-all?deviceId=${encodeURIComponent(deviceId)}`,
  setSpecies: () => `/api/device/species`,
  summary: (range = '24h', deviceId = DEVICE_ID) =>
    `/api/sensors/summary?deviceId=${encodeURIComponent(deviceId)}&range=${range}`,
  // Harvest Feasibility calculator
  feasibilitySpecies: () => `/api/feasibility/species`,
  feasibilityCalculate: () => `/api/feasibility/calculate`,
};