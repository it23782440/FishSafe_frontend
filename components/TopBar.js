'use client';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import SpeciesMenu from './SpeciesMenu';
import { MenuIcon, PanelLeftIcon, BellIcon } from './Icons';
import { useDeviceStatus, useUnreadCount } from '@/lib/hooks';
import { useNow, timeAgo } from '@/lib/time';

function ConnectionPill() {
  const { data, isLoading, error } = useDeviceStatus();
  const now = useNow(5000);
  let tone = 'bg-slate-200 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300';
  let dot = 'bg-slate-400';
  let text = 'Checking…';
  if (data) {
    if (data.online) { tone = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'; dot = 'bg-emerald-500 live-dot'; text = 'Device online'; }
    else { tone = 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'; dot = 'bg-amber-500'; text = 'Device offline'; }
  } else if (error && !isLoading) { text = 'Server unreachable'; tone = 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'; dot = 'bg-red-500'; }
  return (
    <Link href="/live#device" className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold md:inline-flex ${tone}`} title={data?.lastSeen ? `Last data ${timeAgo(data.lastSeen, now)}` : undefined}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {text}
    </Link>
  );
}

export default function TopBar({ onMenu, onToggleCollapse, collapsed }) {
  const unread = useUnreadCount();
  return (
    <header className="print:hidden sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="flex h-16 items-center gap-2 px-3 sm:px-6">
        <button type="button" onClick={onMenu} className="btn !px-2.5 lg:hidden" aria-label="Open menu"><MenuIcon size={18} /></button>
        <button type="button" onClick={onToggleCollapse} className="btn hidden !px-2.5 lg:inline-flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <PanelLeftIcon size={18} />
        </button>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ConnectionPill />
          <SpeciesMenu />
          <Link href="/alerts" className="btn relative !px-2.5" aria-label={unread ? `Alerts, ${unread} unread` : 'Alerts'} title="Alerts & notifications">
            <BellIcon size={18} />
            {unread > 0 && <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">{unread > 99 ? '99+' : unread}</span>}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
