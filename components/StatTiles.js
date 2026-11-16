import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from './Icons';

const TREND = {
  rising: { icon: ArrowUpIcon, text: 'Rising' },
  falling: { icon: ArrowDownIcon, text: 'Falling' },
  stable: { icon: ArrowRightIcon, text: 'Stable' },
  unknown: { icon: ArrowRightIcon, text: 'Not enough data' },
};

/* Latest / Min / Avg / Max / Trend for one parameter. */
export default function StatTiles({ stats, unit = '', decimals = 1, wide = false }) {
  const f = (v) => (v === null || v === undefined ? '—' : Number(v).toFixed(decimals));
  const tr = TREND[stats?.trend?.direction || 'unknown'];
  const TrIcon = tr.icon;
  const items = [['Latest', f(stats?.latest)], ['Minimum', f(stats?.min)], ['Average', f(stats?.avg)], ['Maximum', f(stats?.max)]];
  return (
    <div className={`grid grid-cols-2 gap-3 ${wide ? 'lg:grid-cols-5' : 'md:grid-cols-3'}`}>
      {items.map(([l, v]) => (
        <div key={l} className="rounded-xl bg-surface-2 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{l}</div>
          <div className="mt-0.5 text-xl font-bold tabular-nums text-fg">{v}<span className="ml-1 text-xs font-medium text-muted">{v !== '—' ? unit : ''}</span></div>
        </div>
      ))}
      <div className={`col-span-2 rounded-xl bg-surface-2 p-3 ${wide ? 'lg:col-span-1' : 'md:col-span-2'}`}>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Trend</div>
        <div className="mt-0.5 inline-flex items-center gap-1 text-xl font-bold text-fg"><TrIcon size={18} />{tr.text}</div>
        {stats?.trend?.delta != null && <div className="text-xs text-muted tabular-nums">{stats.trend.delta > 0 ? '+' : ''}{stats.trend.delta}{unit} over the period</div>}
      </div>
    </div>
  );
}
