'use client';
import { useEffect, useRef } from 'react';

/* Accessible confirmation modal for important / destructive actions. */
export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'brand', busy = false, onConfirm, onCancel,
}) {
  const confirmRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);
  if (!open) return null;

  const confirmCls =
    tone === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-brand text-white hover:opacity-90 dark:text-slate-900';
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => !busy && onCancel?.()} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-msg" className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lift animate-rise">
        <h2 id="dlg-title" className="text-lg font-semibold text-fg">{title}</h2>
        <p id="dlg-msg" className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button type="button" ref={confirmRef} onClick={onConfirm} disabled={busy} className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${confirmCls}`}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
