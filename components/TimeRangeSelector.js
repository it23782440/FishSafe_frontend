'use client';

const RANGES = [
  { value: '1h', label: '1H', full: 'Last hour' },
  { value: '6h', label: '6H', full: 'Last 6 hours' },
  { value: '24h', label: '24H', full: 'Last 24 hours' },
  { value: '7d', label: '7D', full: 'Last 7 days' },
  { value: '30d', label: '30D', full: 'Last 30 days' },
];

export const rangeLabel = (v) => RANGES.find((r) => r.value === v)?.full || v;

export default function TimeRangeSelector({ value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label="Time range">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          aria-pressed={value === r.value}
          title={r.full}
          onClick={() => onChange(r.value)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
