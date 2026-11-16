'use client';
import { useState } from 'react';
import { useLiveData } from '@/lib/useLiveData';
import { endpoints, API_BASE } from '@/lib/api';
import { formatDateTime } from '@/lib/time';
import { formatValue } from '@/lib/sensorMeta';
import { windowLabel } from '@/lib/window';
import PageHeader from '@/components/PageHeader';
import DateRangePicker from '@/components/DateRangePicker';
import StatusBadge from '@/components/StatusBadge';
import { ErrorState, EmptyState, Skeleton } from '@/components/Loading';
import { DownloadIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/Icons';

const PAGE_SIZES = [25, 50, 100];
const windowParams = (w) => (w.from && w.to ? { from: w.from, to: w.to } : { range: w.range });

export default function HistoryPage() {
  const [win, setWin] = useState({ range: '7d' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const params = { ...windowParams(win), page: String(page), pageSize: String(pageSize) };
  const { data, error, isLoading, refresh } = useLiveData(endpoints.records(params), { interval: 30000 });
  const csv = `${API_BASE}${endpoints.records({ ...windowParams(win), format: 'csv' })}`;
  const cell = 'whitespace-nowrap px-3 py-2.5 text-right tabular-nums';

  return (
    <>
      <PageHeader
        title="Historical Records"
        subtitle="Every stored sensor reading, newest first. Status is judged against the current pond species."
        right={<DateRangePicker value={win} onChange={(w) => { setPage(1); setWin(w); }} />}
      />

      <div className="card !p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <p className="text-sm text-muted">
            {data ? <><b className="text-fg">{data.total.toLocaleString()}</b> records · {windowLabel(win)}{data.species ? ` · judged for ${data.species}` : ''}</> : 'Loading…'}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted">Rows
              <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="ml-2 rounded-lg border border-line bg-surface px-2 py-1 text-sm text-fg">
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <a href={csv} className="btn" aria-disabled={!data?.total}><DownloadIcon size={16} /> Export CSV</a>
          </div>
        </div>

        {error && !data ? <div className="p-4"><ErrorState message={error.message} onRetry={refresh} /></div> : isLoading && !data ? <div className="p-4"><Skeleton className="h-80" /></div> : data.total === 0 ? (
          <div className="p-4"><EmptyState message="No records in this period" hint="Choose a longer period or a different date range." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr><th scope="col" className="px-3 py-2.5 text-left font-semibold">Date & time</th>
                  {['Temp (°C)', 'pH', 'Turbidity (NTU)', 'Rain (%)', 'TDS (ppm)', 'Signal (%)'].map((h) => <th key={h} scope="col" className="px-3 py-2.5 text-right font-semibold">{h}</th>)}
                  <th scope="col" className="px-3 py-2.5 text-left font-semibold">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.rows.map((r) => (
                  <tr key={r._id} className="hover:bg-surface-2/60">
                    <td className="whitespace-nowrap px-3 py-2.5 text-fg">{formatDateTime(r.timestamp)}</td>
                    <td className={cell}>{formatValue('temperature', r.temperature)}</td>
                    <td className={cell}>{formatValue('ph', r.ph)}</td>
                    <td className={cell}>{formatValue('turbidity', r.turbidity)}</td>
                    <td className={cell}>{formatValue('rain', r.rain)}</td>
                    <td className={cell}>{formatValue('conductivity', r.conductivity)}</td>
                    <td className={cell}>{r.signal ?? '—'}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={r.overallStatus} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line p-3 text-sm">
            <button type="button" className="btn" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}><ArrowLeftIcon size={16} /> Newer</button>
            <span className="text-muted">Page <b className="text-fg">{data.page}</b> of {data.pages}</span>
            <button type="button" className="btn" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>Older <ArrowRightIcon size={16} /></button>
          </nav>
        )}
      </div>
    </>
  );
}
