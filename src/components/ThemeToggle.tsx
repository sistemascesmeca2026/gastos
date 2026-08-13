'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const actual = (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
    setTheme(actual);
  }, []);

  const toggle = () => {
    const nuevo = theme === 'dark' ? 'light' : 'dark';
    setTheme(nuevo);
    document.documentElement.setAttribute('data-theme', nuevo);
    localStorage.setItem('theme', nuevo);
    window.dispatchEvent(new CustomEvent('themechange', { detail: nuevo }));
  };

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--border)] rounded px-2 py-1 text-xs"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
