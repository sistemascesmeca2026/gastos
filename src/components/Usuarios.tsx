'use client';

import { useEffect, useState } from 'react';

type Usuario = { id: number; username: string; nombre: string; activo: boolean; es_admin: boolean };

const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50';
const labelCls = 'block text-xs text-[var(--text-muted)] mb-1.5';
const cardCls = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3';
const btnCls = 'rounded-lg bg-[var(--accent)] hover:bg-blue-500 disabled:opacity-50 transition px-4 py-2 text-sm font-medium text-white';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);

  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const cargar = () => fetch('/api/usuarios').then((r) => r.json()).then(setUsuarios);

  useEffect(() => {
    cargar().finally(() => setLoading(false));
  }, []);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !nombre.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nombre }),
      });
      const data = await res.json();
      if (!res.ok) return flash(data.error || 'Error al crear usuario', false);
      flash('Usuario creado correctamente.', true);
      setUsername('');
      setPassword('');
      setNombre('');
      cargar();
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (u: Usuario) => {
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !u.activo }),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error || 'Error', false);
    cargar();
  };

  const guardarReset = async (id: number) => {
    if (resetPassword.length < 6) return flash('La contraseña debe tener al menos 6 caracteres', false);
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevaPassword: resetPassword }),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error || 'Error', false);
    flash('Contraseña actualizada.', true);
    setResetId(null);
    setResetPassword('');
  };

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Cargando usuarios...</p>;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>}

      <form onSubmit={crearUsuario} className={cardCls}>
        <h3 className="text-sm font-semibold">Nuevo usuario</h3>
        <div>
          <label className={labelCls}>Usuario (para iniciar sesión)</label>
          <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jperez" />
        </div>
        <div>
          <label className={labelCls}>Nombre completo</label>
          <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" />
        </div>
        <div>
          <label className={labelCls}>Contraseña inicial</label>
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className={btnCls}>{saving ? 'Guardando...' : 'Crear usuario'}</button>
      </form>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)] text-xs">
              <th className="py-2.5 px-4 font-medium">Usuario</th>
              <th className="py-2.5 px-4 font-medium">Nombre</th>
              <th className="py-2.5 px-4 font-medium">Estado</th>
              <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-[var(--border)]/60">
                <td className="py-2.5 px-4">{u.username}{u.es_admin && <span className="ml-1.5 text-[10px] text-amber-400">admin</span>}</td>
                <td className="py-2.5 px-4">{u.nombre}</td>
                <td className="py-2.5 px-4">
                  <span className={u.activo ? 'text-emerald-400' : 'text-rose-400'}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td className="py-2.5 px-4 text-right whitespace-nowrap">
                  {resetId === u.id ? (
                    <span className="inline-flex items-center gap-1">
                      <input
                        type="password"
                        placeholder="Nueva contraseña"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="w-32 rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                      />
                      <button onClick={() => guardarReset(u.id)} className="text-emerald-400 hover:text-emerald-300 text-xs">✓</button>
                      <button onClick={() => { setResetId(null); setResetPassword(''); }} className="text-[var(--text-muted)] text-xs">✕</button>
                    </span>
                  ) : (
                    <>
                      <button onClick={() => setResetId(u.id)} className="text-[var(--text-muted)] hover:text-[var(--accent)] text-xs mr-3">Resetear contraseña</button>
                      <button onClick={() => toggleActivo(u)} className="text-[var(--text-muted)] hover:text-rose-400 text-xs">
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
