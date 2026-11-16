import { statusOf } from '@/lib/sensorMeta';
import { StatusGlyph } from './Icons';

/* Colour + icon, so status is readable without relying on colour alone. */
export default function StatusBadge({ status = 'UNKNOWN', size = 'md' }) {
  const s = statusOf(status);
  const sm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap ${
        sm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${s.bg} ${s.text}`}
    >
      <StatusGlyph glyph={s.glyph} size={sm ? 12 : 14} />
      {s.label}
    </span>
  );
}
