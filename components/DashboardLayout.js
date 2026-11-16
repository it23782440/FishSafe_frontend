'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

/* App shell: collapsible sidebar (remembered), top bar, animated page area. */
export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem('fishsafe-sidebar') === 'collapsed'); } catch (_) { /* storage blocked */ }
  }, []);
  useEffect(() => setMobileOpen(false), [pathname]); // close the drawer after navigating

  const toggle = () => {
    setCollapsed((c) => {
      try { localStorage.setItem('fishsafe-sidebar', c ? 'expanded' : 'collapsed'); } catch (_) { /* ignore */ }
      return !c;
    });
  };

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'} print:!pl-0`}>
        <TopBar onMenu={() => setMobileOpen(true)} onToggleCollapse={toggle} collapsed={collapsed} />
        <main id="main" key={pathname} className="mx-auto max-w-7xl animate-rise px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <footer className="print:hidden mx-auto max-w-7xl px-6 pb-8 text-center text-xs text-subtle">
          FishSafe · Real-time freshwater aquaculture monitoring · Guidance shown is general and not veterinary advice.
        </footer>
      </div>
    </div>
  );
}
