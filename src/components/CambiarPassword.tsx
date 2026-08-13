'use client';

import { useState } from 'react';

export default function CambiarPassword({ onClose }: { onClose: () => void }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50';
  const labelCls = 'block text-xs text-[var(--text-muted)] mb-1.5';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (nueva !== confirmar) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordActual: actual, passwordNueva: nueva }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al cambiar la contraseña');
      } else {
        setOk(true);
        setTimeout(onClose, 1500);
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Cambiar contraseña</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm">✕</button>
        </div>

        <div>
          <label className={labelCls}>Contraseña actual</label>
          <input type="password" className={inputCls} value={actual} onChange={(e) => setActual(e.target.value)} autoFocus />
        </div>
        <div>
          <label className={labelCls}>Nueva contraseña</label>
          <input type="password" className={inputCls} value={nueva} onChange={(e) => setNueva(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Confirmar nueva contraseña</label>
          <input type="password" className={inputCls} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}
        {ok && <p className="text-emerald-400 text-sm">Contraseña actualizada correctamente.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[var(--accent)] hover:bg-blue-500 disabled:opacity-50 transition px-4 py-2.5 text-sm font-medium text-white"
        >
          {saving ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}
