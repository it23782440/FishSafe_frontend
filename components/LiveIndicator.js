'use client';
import { useNow, timeAgo } from '@/lib/time';
import { RefreshIcon } from './Icons';

/* "Auto-updating · updated 4s ago" + manual refresh. Turns amber if the connection failed. */
export default function LiveIndicator({ updatedAt, isValidating, hasError, onRefresh }) {
  const now = useNow(1000);
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-2 text-xs text-muted" aria-live="off">
        <span
          className={`h-2 w-2 rounded-full ${hasError ? 'bg-amber-500' : 'bg-emerald-500 live-dot'}`}
        />
        {hasError ? 'Connection problem' : 'Auto-updating'}
        {updatedAt && <span className="hidden sm:inline">· updated {timeAgo(updatedAt, now)}</span>}
      </span>
      <button
        type="button"
        className="btn !px-2.5 !py-1.5"
        onClick={() => onRefresh?.()}
        aria-label="Refresh now"
        title="Refresh now"
      >
        <RefreshIcon size={16} className={isValidating ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
