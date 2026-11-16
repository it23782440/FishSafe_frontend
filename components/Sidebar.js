'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FishLogo, GridIcon, FishIcon, ActivityIcon, BarChartIcon, BellIcon, TableIcon, SettingsIcon, XIcon, FileTextIcon } from './Icons';
import { useDeviceStatus, useUnreadCount } from '@/lib/hooks';

const ITEMS = [
  { href: '/', label: 'Dashboard', icon: GridIcon, match: (p) => p === '/' },
  { href: '/species', label: 'Fish Species', icon: FishIcon, match: (p) => p.startsWith('/species') },
  { href: '/live', label: 'Live Monitoring', icon: ActivityIcon, match: (p) => p.startsWith('/live') || p.startsWith('/sensors') || p.startsWith('/system') },
  { href: '/analytics', label: 'Sensor Analytics', icon: BarChartIcon, match: (p) => p.startsWith('/analytics') },
  { href: '/alerts', label: 'Alerts & Notifications', icon: BellIcon, match: (p) => p.startsWith('/alerts'), badge: true },
  { href: '/history', label: 'Historical Records', icon: TableIcon, match: (p) => p.startsWith('/history') },
  { href: '/reports', label: 'Reports', icon: FileTextIcon, match: (p) => p.startsWith('/reports') },
  { href: '/settings', label: 'Settings', icon: SettingsIcon, match: (p) => p.startsWith('/settings') },
];

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const pathname = usePathname();
  const unread = useUnreadCount();
  const device = useDeviceStatus();
  const dev = device.data;
  const online = dev?.online;
  const narrow = collapsed; // only applies at lg+, mobile drawer is always full width

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        aria-label="Sidebar"
        className={`print:hidden fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-nav text-nav-fg shadow-lift transition-[transform,width] duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${narrow ? 'lg:w-[76px]' : 'lg:w-64'}`}
      >
        {/* brand */}
        <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 ${narrow ? 'lg:justify-center lg:px-0' : ''}`}>
          <Link href="/" aria-label="FishSafe home" className="flex items-center gap-3">
            <FishLogo size={34} />
            <span className={`${narrow ? 'lg:hidden' : ''}`}>
              <span className="block text-lg font-bold leading-none tracking-tight text-white">
                Fish<span className="text-aqua">Safe</span>
              </span>
              <span className="mt-1 block text-[11px] leading-none text-nav-fg/70">Aquaculture monitoring</span>
            </span>
          </Link>
          <button type="button" onClick={onClose} aria-label="Close menu" className="ml-auto rounded-lg p-2 text-nav-fg hover:bg-white/10 lg:hidden">
            <XIcon size={18} />
          </button>
        </div>

        {/* navigation */}
        <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {ITEMS.map(({ href, label, icon: Icon, match, badge }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                title={narrow ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-white/15 text-white' : 'text-nav-fg hover:bg-white/10 hover:text-white'
                } ${narrow ? 'lg:justify-center lg:px-0' : ''}`}
              >
                {active && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-aqua" aria-hidden="true" />}
                <Icon size={19} className={active ? 'text-aqua' : ''} />
                <span className={narrow ? 'lg:sr-only' : ''}>{label}</span>
                {badge && unread > 0 && (
                  <span className={`ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white ${narrow ? 'lg:absolute lg:right-2 lg:top-1.5 lg:ml-0' : ''}`} aria-label={`${unread} unread`}>
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* monitored device (there is no user-account system in FishSafe, so this shows the device) */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <Link
            href="/live#device"
            title={narrow ? `Pond monitor: ${online ? 'online' : 'offline'}` : undefined}
            className={`flex items-center gap-3 rounded-xl bg-white/10 p-2.5 transition hover:bg-white/15 ${narrow ? 'lg:justify-center lg:p-2' : ''}`}
          >
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-aqua/20 text-aqua">
              <FishIcon size={18} />
              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-nav ${online ? 'bg-emerald-400' : device.isLoading ? 'bg-slate-400' : 'bg-slate-500'}`} />
            </span>
            <span className={`min-w-0 ${narrow ? 'lg:hidden' : ''}`}>
              <span className="block truncate text-sm font-semibold text-white">Pond Monitor</span>
              <span className="block truncate text-xs text-nav-fg/70">
                {device.isLoading && !dev ? 'Checking…' : online ? 'Online' : 'Offline'}
              </span>
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
