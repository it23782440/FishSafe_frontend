'use client';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from './Icons';

/* Light/dark toggle. The initial class is set by an inline script in layout.js (no flash). */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('fishsafe-theme', next ? 'dark' : 'light');
    } catch (_) {
      /* storage may be blocked; theme still applies for this visit */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn !px-2.5"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
    >
      {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}
