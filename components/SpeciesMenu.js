'use client';
import { useEffect, useRef, useState } from 'react';
import { useSpecies } from '@/lib/useSpecies';
import { FishIcon, ChevronDownIcon, CheckIcon, RefreshIcon } from './Icons';

/*
 * "Fish type" tab with a dropdown to choose which of the three fish the pond
 * is stocked with. The selection is stored on the device in the backend and
 * drives every safe / warning / danger judgement on the dashboard.
 */
export default function SpeciesMenu() {
  const { species, current, currentId, select, saving, error, clearError } = useSpecies();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const btnRef = useRef(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Move focus into the menu (to the checked item) when it opens.
  useEffect(() => {
    if (!open) return;
    const items = rootRef.current?.querySelectorAll('[role="menuitemradio"]');
    const checked = rootRef.current?.querySelector('[aria-checked="true"]');
    (checked || items?.[0])?.focus();
  }, [open]);

  const onMenuKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...rootRef.current.querySelectorAll('[role="menuitemradio"]')];
    const i = items.indexOf(document.activeElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const choose = async (id) => {
    await select(id);
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          clearError();
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium transition sm:px-3 sm:text-sm ${
          open ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-2 hover:text-fg'
        }`}
      >
        <FishIcon size={17} />
        <span className="hidden md:inline">Fish type</span>
        <span className="hidden rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand lg:inline">
          {current?.name}
        </span>
        <ChevronDownIcon size={15} className={`transition ${open ? 'rotate-180' : ''}`} />
        <span className="sr-only md:hidden">Fish type: {current?.name}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose fish type"
          onKeyDown={onMenuKey}
          className="fixed inset-x-3 top-[4.25rem] z-40 rounded-2xl border border-line bg-surface p-2 shadow-lift animate-rise sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[22rem]"
        >
          <div className="px-3 pb-2 pt-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            Fish in this pond
          </div>

          {species.map((s) => {
            const checked = s.id === currentId;
            return (
              <button
                key={s.id}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                disabled={saving}
                onClick={() => choose(s.id)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:opacity-60 ${
                  checked ? 'bg-brand/10' : 'hover:bg-surface-2'
                }`}
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    checked ? 'border-brand bg-brand text-white dark:text-slate-900' : 'border-line text-transparent'
                  }`}
                >
                  <CheckIcon size={13} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-fg">{s.name}</span>
                  <span className="block text-xs italic text-muted">{s.scientific}</span>
                  {s.description && <span className="mt-1 block text-xs text-muted">{s.description}</span>}
                </span>
              </button>
            );
          })}

          {saving && (
            <p className="flex items-center gap-2 px-3 pt-2 text-xs text-muted" role="status">
              <RefreshIcon size={13} className="animate-spin" /> Applying new limits…
            </p>
          )}
          {error && (
            <p role="alert" className="px-3 pt-2 text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
