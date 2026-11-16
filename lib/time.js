'use client';
import { useEffect, useState } from 'react';

/** Re-renders the caller every `ms` and returns the current timestamp. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** "just now", "12s ago", "5 min ago", "3 h ago", "2 d ago". */
export function timeAgo(ts, now = Date.now()) {
  if (!ts) return '—';
  const diff = Math.max(0, Math.round((now - new Date(ts).getTime()) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return `${d} d ago`;
}

/** 4521 -> "1h 15m"; 75 -> "1m 15s". */
export function formatDuration(totalSeconds) {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return '—';
  const s = Math.round(totalSeconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

/** "Today" / "Yesterday" / "Mon, 3 Nov" for grouping lists by day. */
export function dayLabel(ts, now = new Date()) {
  const d = new Date(ts);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export const fullTime = (ts) => (ts ? new Date(ts).toLocaleString() : '—');

/** One date/time format for the whole app, e.g. "9 Nov 2026, 14:05". */
export function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString([], {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
export const formatDate = (ts) =>
  ts ? new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const formatClock = (ts) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

/** 125 -> "2 h 5 min"; 45 -> "45 min"; 0 -> "< 1 min" */
export function formatMinutes(min) {
  if (min == null) return '—';
  if (min < 1) return '< 1 min';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  const d = Math.floor(h / 24);
  if (d) return `${d} d ${h % 24} h`;
  return h ? `${h} h ${m} min` : `${m} min`;
}
