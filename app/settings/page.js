'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSpeciesOverview, useDeviceStatus } from '@/lib/hooks';
import { useSpecies } from '@/lib/useSpecies';
import { sendJson, endpoints, API_BASE } from '@/lib/api';
import { safeRangeText } from '@/lib/sensorMeta';
import { useSWRConfig } from 'swr';
import PageHeader from '@/components/PageHeader';
import FishArt from '@/components/FishArt';
import SpeciesForm from '@/components/SpeciesForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ErrorState, Skeleton } from '@/components/Loading';
import { PlusIcon, EditIcon, TrashIcon, InfoIcon } from '@/components/Icons';

export default function SettingsPage() {
  const overview = useSpeciesOverview();
  const device = useDeviceStatus();
  const { currentId, select, saving } = useSpecies();
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState(null); // null | 'new' | species
  const [del, setDel] = useState(null);
  const [useOne, setUseOne] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const refreshAll = () => mutate(() => true);
  const dev = device.data;
  const list = overview.data?.species || [];

  const doDelete = async () => {
    setDelBusy(true);
    try {
      await sendJson(endpoints.speciesOne(del.id), 'DELETE', {});
      setMsg({ type: 'ok', text: `${del.name} was deleted.` });
      await refreshAll();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setDelBusy(false);
      setDel(null);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage fish species and their environmental limits, and review how this dashboard is connected." />

      <section id="species" className="scroll-mt-24" aria-labelledby="sp-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="sp-h" className="text-xl font-bold text-fg">Fish species & limits</h2><p className="text-sm text-muted">Changing limits re-evaluates the pond&apos;s status and alerts immediately.</p></div>
          <button type="button" className="btn !bg-brand !text-white dark:!text-slate-900" onClick={() => setForm('new')}><PlusIcon size={16} /> Add species</button>
        </div>

        {msg.text && <p role={msg.type === 'err' ? 'alert' : 'status'} className={`mb-3 rounded-lg px-3 py-2 text-sm font-medium ${msg.type === 'err' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>{msg.text}</p>}

        {overview.error && !overview.data ? <ErrorState message={overview.error.message} onRetry={overview.refresh} /> : overview.isLoading && !overview.data ? <Skeleton className="h-56 rounded-2xl" /> : (
          <ul className="space-y-3">
            {list.map((s) => (
              <li key={s.id} className="card flex flex-wrap items-center gap-4 !p-4">
                <FishArt id={s.id} name={s.name} imageUrl={s.imageUrl} className="h-16 w-24 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/species/${s.id}`} className="font-semibold text-fg hover:text-brand">{s.name}</Link>
                    {s.id === currentId && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">Pond species</span>}
                    {s.builtIn && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">Default</span>}
                  </div>
                  <p className="text-xs italic text-muted">{s.scientific}</p>
                  <p className="mt-1 text-sm text-muted tabular-nums">Temperature {safeRangeText('temperature', s.thresholds.temperature)} · pH {safeRangeText('ph', s.thresholds.ph)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.id !== currentId && <button type="button" className="btn" disabled={saving} onClick={() => setUseOne(s)}>Use for pond</button>}
                  <button type="button" className="btn" onClick={() => setForm(s)} aria-label={`Edit ${s.name}`}><EditIcon size={16} /> Edit</button>
                  <button type="button" className="btn !text-red-600 dark:!text-red-400" onClick={() => setDel(s)} aria-label={`Delete ${s.name}`}><TrashIcon size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted"><InfoIcon size={14} className="mt-0.5 shrink-0" />Default limits are engineering estimates (tilapia temperature/pH follow the project brief). Confirm values for your pond and climate with a fisheries expert.</p>
      </section>

      <section className="mt-10" aria-labelledby="dev-h">
        <h2 id="dev-h" className="mb-3 text-xl font-bold text-fg">Connection & device</h2>
        <div className="card !py-2">
          <dl className="divide-y divide-line text-sm">
            {[
              ['Device status', dev ? (dev.online ? 'Online' : 'Offline') : '—'],
              ['Backend API', API_BASE],
              ['Data updates', 'Automatic'],
              ['Marked offline after', dev ? `${Math.round(dev.offlineAfterSeconds / 60)} minutes without data` : '—'],
              ['Total readings stored', dev?.totalReadings?.toLocaleString() ?? '—'],
            ].map(([k, v]) => (<div key={k} className="flex flex-wrap justify-between gap-2 py-3"><dt className="text-muted">{k}</dt><dd className="break-all font-medium text-fg">{v}</dd></div>))}
          </dl>
        </div>
        <p className="mt-2 text-xs text-muted">FishSafe has no user accounts yet, so these settings apply to everyone who can open this dashboard.</p>
      </section>

      {form && <SpeciesForm species={form === 'new' ? null : form} onCancel={() => setForm(null)} onSaved={async (saved) => { setForm(null); setMsg({ type: 'ok', text: `${saved.name} saved.` }); await refreshAll(); }} />}
      <ConfirmDialog open={!!del} tone="danger" title={`Delete ${del?.name}?`} message="This removes the species and its limits. It cannot be undone. A species that is currently used by the pond cannot be deleted." confirmLabel="Delete species" busy={delBusy} onCancel={() => setDel(null)} onConfirm={doDelete} />
      <ConfirmDialog open={!!useOne} title={`Use ${useOne?.name} for your pond?`} message={`The dashboard, alerts and live status will be judged against ${useOne?.name}'s limits.`} confirmLabel="Use this species" busy={saving} onCancel={() => setUseOne(null)} onConfirm={async () => { await select(useOne.id); setUseOne(null); }} />
    </>
  );
}
