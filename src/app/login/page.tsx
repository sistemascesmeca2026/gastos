'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
      } else {
        router.push(params.get('next') || '/');
        router.refresh();
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <div className="text-center mb-2">
          <h1 className="text-lg font-semibold">CESMECA — Control POA</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Inicia sesión para continuar</p>
        </div>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Usuario</label>
          <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Contraseña</label>
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] hover:bg-blue-500 disabled:opacity-50 transition px-4 py-2.5 text-sm font-medium text-white"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
