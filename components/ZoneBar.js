/* Share of readings in each zone for the selected window (text labels + colours). */
export default function ZoneBar({ zones }) {
  if (!zones || zones.SAFE === null) return <p className="text-sm text-muted">No readings in this period.</p>;
  const parts = [
    { k: 'SAFE', label: 'Safe', cls: 'bg-emerald-500' },
    { k: 'WARNING', label: 'Warning', cls: 'bg-amber-500' },
    { k: 'DANGER', label: 'Dangerous', cls: 'bg-red-500' },
  ];
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={parts.map((p) => `${p.label} ${zones[p.k]}%`).join(', ')}>
        {parts.map((p) => zones[p.k] > 0 && <div key={p.k} className={p.cls} style={{ width: `${zones[p.k]}%` }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {parts.map((p) => (
          <li key={p.k} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${p.cls}`} />{p.label} <b className="tabular-nums text-fg">{zones[p.k]}%</b></li>
        ))}
      </ul>
    </div>
  );
}
