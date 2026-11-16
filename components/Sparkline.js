'use client';
import { useId } from 'react';

/* Tiny dependency-free trend line. `values` = array of numbers (oldest -> newest). */
export default function Sparkline({ values = [], color = '#0ea5e9', height = 36, className = '' }) {
  const id = useId().replace(/:/g, '');
  const v = values.filter((n) => typeof n === 'number' && Number.isFinite(n));

  if (v.length < 2) {
    return (
      <div
        className={`flex items-center text-[11px] text-subtle ${className}`}
        style={{ height }}
      >
        <span className="w-full border-t border-dashed border-line" />
      </div>
    );
  }

  const min = Math.min(...v);
  const max = Math.max(...v);
  const span = max - min || 1;
  const W = 100;
  const H = 30;
  const pad = 2;
  const pts = v.map((n, i) => [
    (i / (v.length - 1)) * W,
    H - pad - ((n - min) / span) * (H - pad * 2),
  ]);
  const line = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `0,${H} ${line} ${W},${H}`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r="1.6" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
