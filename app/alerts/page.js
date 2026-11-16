'use client';
import { Fragment, useState } from 'react';
import { useLiveData } from '@/lib/useLiveData';
import { useAlertActions } from '@/lib/hooks';
import { endpoints } from '@/lib/api';
import { dayLabel, useNow } from '@/lib/time';
import PageHeader from '@/components/PageHeader';
import AlertCard, { KIND_LABEL } from '@/components/AlertCard';
import LiveIndicator from '@/components/LiveIndicator';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ErrorState, EmptyState, Skeleton } from '@/components/Loading';
import { MailCheckIcon } from '@/components/Icons';

const VIEWS = [['all', 'All'], ['unread', 'Unread'], ['active', 'Active'], ['DANGER', 'Critical'], ['WARNING', 'Warning'], ['INFO', 'Information']];

export default function AlertsPage() {
  const [view, setView] = useState('all');
  const [kind, setKind] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [marking, setMarking] = useState(false);
  const now = useNow(30000);
  const actions = useAlertActions();

  const opts = { limit: '200' };
  if (view === 'unread') opts.read = 'false';
  if (view === 'active') opts.active = 'true';
  if (['DANGER', 'WARNING', 'INFO'].includes(view)) opts.severity = view;
  if (kind) opts.kind = kind;

  const { data, error, isLoading, isValidating, updatedAt, refresh } = useLiveData(endpoints.alerts(opts), { interval: 15000 });
  const alerts = data?.alerts || [];
  const unread = data?.unreadCount ?? 0;

  let lastDay = null;
  return (
    <>
      <PageHeader
        title="Alerts & Notifications"
        subtitle="Every out-of-range reading, missing sensor and connectivity problem. A continuing condition is one alert, not one per reading."
        right={<div className="flex items-center gap-3"><LiveIndicator updatedAt={updatedAt} isValidating={isValidating} hasError={!!error && !!data} onRefresh={refresh} />
          <button type="button" className="btn" disabled={unread === 0} onClick={() => setConfirm(true)}><MailCheckIcon size={16} /> Mark all as read</button></div>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="segmented flex-wrap" role="group" aria-label="Filter alerts">
          {VIEWS.map(([k, l]) => <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}>{l}{k === 'unread' && unread > 0 ? <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{unread}</span> : null}</button>)}
        </div>
        <label className="text-xs font-medium text-muted">Type
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="ml-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-fg">
            <option value="">All types</option>
            {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>

      {error && !data ? <ErrorState message={error.message} onRetry={refresh} /> : isLoading && !data ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : alerts.length === 0 ? (
        <EmptyState message={view === 'all' && !kind ? 'No alerts yet' : 'No alerts match this filter'} hint={view === 'all' && !kind ? 'Everything has stayed within the safe range and the device has stayed connected.' : 'Try another filter.'} />
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => {
            const day = dayLabel(a.createdAt);
            const head = day !== lastDay;
            lastDay = day;
            return (
              <Fragment key={a._id}>
                {head && <li aria-hidden="true" className="pt-3 text-xs font-semibold uppercase tracking-wide text-muted first:pt-0">{day}</li>}
                <AlertCard alert={a} now={now} onToggleRead={actions.toggleRead} busy={actions.busyId === a._id} />
              </Fragment>
            );
          })}
        </ul>
      )}

      <ConfirmDialog open={confirm} title="Mark all alerts as read?" message={`This marks ${unread} unread notification${unread === 1 ? '' : 's'} as read. The alerts and their history are kept.`} confirmLabel="Mark all as read" busy={marking}
        onCancel={() => setConfirm(false)} onConfirm={async () => { setMarking(true); try { await actions.markAllRead(); } finally { setMarking(false); setConfirm(false); } }} />
    </>
  );
}
