'use client';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from 'recharts';

const COLORS = { current: '#94a3b8', recommended: '#0891b2', target: '#10b981' };
const fmtDate = (t) => new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short' });
const fmtKg = (v) => `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;

function ChartTooltip({ active, payload, targetKg }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lift">
      <div className="text-muted">{new Date(p.t).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} · week {Math.round(p.day / 7)}</div>
      <div className="mt-1 space-y-0.5 tabular-nums">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COLORS.recommended }} /> Recommended plan: <b className="text-fg">{fmtKg(p.recommendedKg)}</b> <span className="text-muted">({p.recommendedWeightG} g each)</span></div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COLORS.current }} /> Current plan: <b className="text-fg">{fmtKg(p.currentKg)}</b> <span className="text-muted">({p.currentWeightG} g each)</span></div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COLORS.target }} /> Target: <b className="text-fg">{fmtKg(targetKg)}</b></div>
      </div>
    </div>
  );
}

/* Projected harvest weight (kg in the pond) week by week, current vs recommended plan, with the target line. */
export default function GrowthProjectionChart({ points = [], targetKg, height = 300 }) {
  const data = useMemo(() => points.map((p) => ({ ...p, t: new Date(p.date).getTime() })), [points]);
  const max = Math.max(targetKg || 0, ...data.map((p) => Math.max(p.currentKg, p.recommendedKg)));
  return (
    <div className="w-full" style={{ height }} role="img" aria-label={`Projected harvest weight until the deadline, current plan vs recommended plan, target ${targetKg} kg`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={fmtDate} tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgb(var(--line))' }} minTickGap={40} />
          <YAxis tick={{ fontSize: 11 }} width={56} tickLine={false} axisLine={false} domain={[0, Math.ceil(max * 1.1)]} tickFormatter={(v) => `${Number(v).toLocaleString()} kg`} />
          <Tooltip content={<ChartTooltip targetKg={targetKg} />} cursor={{ stroke: 'rgb(var(--subtle))', strokeDasharray: '3 3' }} />
          <Legend verticalAlign="top" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={targetKg} stroke={COLORS.target} strokeDasharray="6 4" strokeWidth={2} label={{ value: `Target ${fmtKg(targetKg)}`, position: 'insideTopLeft', fill: COLORS.target, fontSize: 11 }} />
          <Line name="Current plan" type="monotone" dataKey="currentKg" stroke={COLORS.current} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          <Line name="Recommended plan" type="monotone" dataKey="recommendedKg" stroke={COLORS.recommended} strokeWidth={2.6} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgb(var(--surface))' }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
