import { InboxIcon, AlertIcon, RefreshIcon } from './Icons';

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-line/70 ${className}`} />;
}

/* Skeleton matching the final shape of a SensorCard, so the page doesn't jump. */
export function SensorCardSkeleton() {
  return (
    <div className="card" aria-hidden="true">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mt-5 h-9 w-28" />
      <Skeleton className="mt-4 h-9 w-full" />
      <Skeleton className="mt-4 h-2 w-full rounded-full" />
      <Skeleton className="mt-4 h-3 w-32" />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="card border-red-300/70 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
          <AlertIcon size={18} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Could not load data</p>
          <p className="mt-1 break-all text-sm opacity-90">{message}</p>
          <p className="mt-2 text-xs opacity-75">
            Check that NEXT_PUBLIC_API_BASE_URL points to a running backend and that CORS allows this
            origin. The page retries automatically.
          </p>
          {onRetry && (
            <button type="button" onClick={() => onRetry()} className="btn mt-3">
              <RefreshIcon size={16} /> Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ message = 'No data yet.', hint }) {
  return (
    <div className="card flex flex-col items-center py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-subtle">
        <InboxIcon size={24} />
      </span>
      <p className="mt-3 font-medium text-fg">{message}</p>
      {hint && <p className="mt-1 max-w-md text-sm text-muted">{hint}</p>}
    </div>
  );
}

/* Inline notice bar (e.g. offline / connection problems). tone: 'warn' | 'info' */
export function Notice({ tone = 'warn', icon, children }) {
  const tones = {
    warn: 'border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
    info: 'border-sky-300/80 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
  };
  return (
    <div role="status" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}
