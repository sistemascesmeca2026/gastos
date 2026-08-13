'use client';

import { useEffect, useState } from 'react';

type Funcion = { id: number; clave: string; nombre: string; ejercicio: number };
type Capitulo = { id: number; clave: string; nombre: string; funcion_id: number; funcion_clave: string; funcion_nombre: string };
type Partida = { id: number; partida_clave: string; partida_descripcion: string; capitulo_clave: string; capitulo_nombre: string; funcion_clave: string; funcion_nombre: string };

const inputCls =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-40 disabled:cursor-not-allowed transition';
const labelCls = 'block text-xs text-[var(--text-muted)] mb-1.5';
const cardCls = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3';
const btnCls = 'rounded-lg bg-[var(--accent)] hover:bg-blue-500 disabled:opacity-50 transition px-4 py-2 text-sm font-medium text-white';

export default function Catalogo({ ejercicioSel }: { ejercicioSel: number }) {
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);

  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [fClave, setFClave] = useState('');
  const [fNombre, setFNombre] = useState('');
  const [fEjercicio, setFEjercicio] = useState(ejercicioSel);
  const [savingF, setSavingF] = useState(false);


  const [cFuncionId, setCFuncionId] = useState('');
  const [cClave, setCClave] = useState('');
  const [cNombre, setCNombre] = useState('');
  const [savingC, setSavingC] = useState(false);

  const [pFuncionId, setPFuncionId] = useState('');
  const [pCapituloId, setPCapituloId] = useState('');
  const [pClave, setPClave] = useState('');
  const [pDescripcion, setPDescripcion] = useState('');
  const [pMinistrado, setPMinistrado] = useState('');
  const [savingP, setSavingP] = useState(false);

  const cargar = () => {
    return Promise.all([
      fetch('/api/funciones').then((r) => r.json()),
      fetch('/api/capitulos').then((r) => r.json()),
      fetch(`/api/partidas?ejercicio=${ejercicioSel}`).then((r) => r.json()),
    ]).then(([f, c, p]) => {
      setFunciones(f);
      setCapitulos(c);
      setPartidas(p);
    });
  };

  useEffect(() => {
    cargar().finally(() => setLoading(false));
  }, []);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const crearFuncion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fClave.trim() || !fNombre.trim()) return;
    setSavingF(true);
    try {
      const res = await fetch('/api/funciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: fClave, nombre: fNombre, ejercicio: fEjercicio }),
      });
      const data = await res.json();
      if (!res.ok) return flash(data.error || 'Error al crear la función', false);
      flash('Función creada correctamente.', true);
      setFClave('');
      setFNombre('');
      cargar();
    } finally {
      setSavingF(false);
    }
  };

  const crearCapitulo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cFuncionId || !cClave.trim() || !cNombre.trim()) return;
    setSavingC(true);
    try {
      const res = await fetch('/api/capitulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcion_id: Number(cFuncionId), clave: cClave, nombre: cNombre }),
      });
      const data = await res.json();
      if (!res.ok) return flash(data.error || 'Error al crear el capítulo', false);
      flash('Capítulo creado correctamente.', true);
      setCClave('');
      setCNombre('');
      cargar();
    } finally {
      setSavingC(false);
    }
  };

  const crearPartida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pCapituloId || !pClave.trim() || !pDescripcion.trim()) return;
    setSavingP(true);
    try {
      const res = await fetch('/api/partidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capitulo_id: Number(pCapituloId), clave: pClave, descripcion: pDescripcion, ministrado: pMinistrado || 0 }),
      });
      const data = await res.json();
      if (!res.ok) return flash(data.error || 'Error al crear la partida', false);
      flash('Partida creada correctamente.', true);
      setPClave('');
      setPDescripcion('');
      setPMinistrado('');
    } finally {
      setSavingP(false);
    }
  };

  const capitulosDeFuncion = capitulos.filter((c) => String(c.funcion_id) === pFuncionId);

  const [editFuncionId, setEditFuncionId] = useState<number | null>(null);
  const [editFuncionValor, setEditFuncionValor] = useState({ clave: '', nombre: '' });
  const [editCapituloId, setEditCapituloId] = useState<number | null>(null);
  const [editCapituloValor, setEditCapituloValor] = useState({ clave: '', nombre: '' });
  const [editPartidaId, setEditPartidaId] = useState<number | null>(null);
  const [editPartidaValor, setEditPartidaValor] = useState({ clave: '', descripcion: '' });
  const [confirmarEliminar, setConfirmarEliminar] = useState<{ tipo: 'funcion' | 'capitulo' | 'partida'; id: number; nombre: string } | null>(null);

  const guardarEdicionFuncion = async (id: number) => {
    const res = await fetch(`/api/funciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editFuncionValor),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error || 'Error al editar', false);
    setEditFuncionId(null);
    flash('Función actualizada.', true);
    cargar();
  };

  const guardarEdicionCapitulo = async (id: number) => {
    const res = await fetch(`/api/capitulos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editCapituloValor),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error || 'Error al editar', false);
    setEditCapituloId(null);
    flash('Capítulo actualizado.', true);
    cargar();
  };

  const guardarEdicionPartida = async (id: number) => {
    const res = await fetch(`/api/partidas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPartidaValor),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error || 'Error al editar', false);
    setEditPartidaId(null);
    flash('Partida actualizada.', true);
    cargar();
  };

  const ejecutarEliminar = async () => {
    if (!confirmarEliminar) return;
    const { tipo, id } = confirmarEliminar;
    const url = tipo === 'funcion' ? `/api/funciones/${id}` : tipo === 'capitulo' ? `/api/capitulos/${id}` : `/api/partidas/${id}`;
    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    setConfirmarEliminar(null);
    if (!res.ok) return flash(data.error || 'Error al eliminar', false);
    flash('Eliminado correctamente.', true);
    cargar();
  };

  const funcionesEjercicio = funciones.filter((f) => f.ejercicio === ejercicioSel);
  const [abierto, setAbierto] = useState<{ funciones: boolean; capitulos: boolean; partidas: boolean }>({ funciones: false, capitulos: false, partidas: false });
  const [busquedaPartida, setBusquedaPartida] = useState('');
  const partidasFiltradas = partidas.filter((p) => {
    if (!busquedaPartida) return true;
    const q = busquedaPartida.toLowerCase();
    return `${p.partida_clave} ${p.partida_descripcion} ${p.funcion_nombre}`.toLowerCase().includes(q);
  });

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Cargando catálogo...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      {msg && (
        <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>
      )}

      <form onSubmit={crearFuncion} className={cardCls}>
        <h3 className="text-sm font-semibold">Nueva función / programa</h3>
        <div>
          <label className={labelCls}>Ejercicio (año)</label>
          <input type="number" className={inputCls} value={fEjercicio} onChange={(e) => setFEjercicio(Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Clave (ej. 2.06.PRDI999.PYI099)</label>
          <input className={inputCls} value={fClave} onChange={(e) => setFClave(e.target.value)} placeholder="2.06.PRDI999.PYI099" />
        </div>
        <div>
          <label className={labelCls}>Nombre del programa</label>
          <input className={inputCls} value={fNombre} onChange={(e) => setFNombre(e.target.value)} placeholder="PROGRAMA DE..." />
        </div>
        <button type="submit" disabled={savingF} className={btnCls}>{savingF ? 'Guardando...' : 'Crear función'}</button>
      </form>

      <form onSubmit={crearCapitulo} className={cardCls}>
        <h3 className="text-sm font-semibold">Nuevo capítulo</h3>
        <div>
          <label className={labelCls}>Función</label>
          <select className={inputCls} value={cFuncionId} onChange={(e) => setCFuncionId(e.target.value)}>
            <option value="">Selecciona una función...</option>
            {funciones.map((f) => <option key={f.id} value={f.id}>[{f.ejercicio}] {f.clave} {f.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Clave (ej. 2000, 3000)</label>
          <input className={inputCls} value={cClave} onChange={(e) => setCClave(e.target.value)} placeholder="2000" />
        </div>
        <div>
          <label className={labelCls}>Nombre del capítulo</label>
          <input className={inputCls} value={cNombre} onChange={(e) => setCNombre(e.target.value)} placeholder="MATERIALES Y SUMINISTROS" />
        </div>
        <button type="submit" disabled={savingC || !funciones.length} className={btnCls}>{savingC ? 'Guardando...' : 'Crear capítulo'}</button>
      </form>

      <form onSubmit={crearPartida} className={cardCls}>
        <h3 className="text-sm font-semibold">Nueva partida</h3>
        <div>
          <label className={labelCls}>Función</label>
          <select className={inputCls} value={pFuncionId} onChange={(e) => { setPFuncionId(e.target.value); setPCapituloId(''); }}>
            <option value="">Selecciona una función...</option>
            {funciones.map((f) => <option key={f.id} value={f.id}>[{f.ejercicio}] {f.clave} {f.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Capítulo</label>
          <select className={inputCls} value={pCapituloId} disabled={!pFuncionId} onChange={(e) => setPCapituloId(e.target.value)}>
            <option value="">{pFuncionId ? 'Selecciona un capítulo...' : 'Primero elige una función'}</option>
            {capitulosDeFuncion.map((c) => <option key={c.id} value={c.id}>{c.clave} · {c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Clave de partida (ej. 21101)</label>
          <input className={inputCls} value={pClave} onChange={(e) => setPClave(e.target.value)} placeholder="21101" />
        </div>
        <div>
          <label className={labelCls}>Descripción</label>
          <input className={inputCls} value={pDescripcion} onChange={(e) => setPDescripcion(e.target.value)} placeholder="MATERIALES Y ÚTILES DE OFICINA" />
        </div>
        <div>
          <label className={labelCls}>Ministrado inicial (opcional, MXN)</label>
          <input type="number" step="0.01" className={inputCls} value={pMinistrado} onChange={(e) => setPMinistrado(e.target.value)} placeholder="0.00" />
        </div>
        <button type="submit" disabled={savingP || !pCapituloId} className={btnCls}>{savingP ? 'Guardando...' : 'Crear partida'}</button>
      </form>

      <div className={cardCls.replace('space-y-3', '')}>
        <button
          onClick={() => setAbierto((v) => ({ ...v, funciones: !v.funciones }))}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className={`text-[var(--text-muted)] text-xs transition-transform ${abierto.funciones ? 'rotate-90' : ''}`}>▸</span>
            Funciones existentes ({ejercicioSel})
          </h3>
          <span className="text-xs text-[var(--text-muted)]">{funcionesEjercicio.length}</span>
        </button>
        {abierto.funciones && (
        <div className="space-y-1.5 mt-3">
          {funcionesEjercicio.map((f) => (
            <div key={f.id} className="flex items-center gap-2 text-xs border-b border-[var(--border)] pb-1.5">
              {editFuncionId === f.id ? (
                <>
                  <input className={`${inputCls} py-1`} defaultValue={f.clave} onChange={(e) => setEditFuncionValor((v) => ({ ...v, clave: e.target.value }))} />
                  <input className={`${inputCls} py-1`} defaultValue={f.nombre} onChange={(e) => setEditFuncionValor((v) => ({ ...v, nombre: e.target.value }))} />
                  <button onClick={() => guardarEdicionFuncion(f.id)} className="text-emerald-400">✓</button>
                  <button onClick={() => setEditFuncionId(null)} className="text-[var(--text-muted)]">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate">{f.clave} — {f.nombre}</span>
                  <button onClick={() => { setEditFuncionId(f.id); setEditFuncionValor({ clave: f.clave, nombre: f.nombre }); }} className="text-[var(--text-muted)] hover:text-[var(--accent)]">✎</button>
                  <button onClick={() => setConfirmarEliminar({ tipo: 'funcion', id: f.id, nombre: f.nombre })} className="text-[var(--text-muted)] hover:text-rose-400">🗑</button>
                </>
              )}
            </div>
          ))}
          {funcionesEjercicio.length === 0 && <p className="text-xs text-[var(--text-muted)]">Sin funciones en este ejercicio.</p>}
        </div>
        )}
      </div>

      <div className={cardCls.replace('space-y-3', '')}>
        <button
          onClick={() => setAbierto((v) => ({ ...v, capitulos: !v.capitulos }))}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className={`text-[var(--text-muted)] text-xs transition-transform ${abierto.capitulos ? 'rotate-90' : ''}`}>▸</span>
            Capítulos existentes
          </h3>
          <span className="text-xs text-[var(--text-muted)]">{capitulos.filter((c) => funcionesEjercicio.some((f) => f.id === c.funcion_id)).length}</span>
        </button>
        {abierto.capitulos && (
        <div className="space-y-1.5 mt-3">
          {capitulos.filter((c) => funcionesEjercicio.some((f) => f.id === c.funcion_id)).map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs border-b border-[var(--border)] pb-1.5">
              {editCapituloId === c.id ? (
                <>
                  <input className={`${inputCls} py-1`} defaultValue={c.clave} onChange={(e) => setEditCapituloValor((v) => ({ ...v, clave: e.target.value }))} />
                  <input className={`${inputCls} py-1`} defaultValue={c.nombre} onChange={(e) => setEditCapituloValor((v) => ({ ...v, nombre: e.target.value }))} />
                  <button onClick={() => guardarEdicionCapitulo(c.id)} className="text-emerald-400">✓</button>
                  <button onClick={() => setEditCapituloId(null)} className="text-[var(--text-muted)]">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate">{c.funcion_clave} · {c.clave} — {c.nombre}</span>
                  <button onClick={() => { setEditCapituloId(c.id); setEditCapituloValor({ clave: c.clave, nombre: c.nombre }); }} className="text-[var(--text-muted)] hover:text-[var(--accent)]">✎</button>
                  <button onClick={() => setConfirmarEliminar({ tipo: 'capitulo', id: c.id, nombre: c.nombre })} className="text-[var(--text-muted)] hover:text-rose-400">🗑</button>
                </>
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      <div className={cardCls.replace('space-y-3', '')}>
        <button
          onClick={() => setAbierto((v) => ({ ...v, partidas: !v.partidas }))}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className={`text-[var(--text-muted)] text-xs transition-transform ${abierto.partidas ? 'rotate-90' : ''}`}>▸</span>
            Partidas existentes ({ejercicioSel})
          </h3>
          <span className="text-xs text-[var(--text-muted)]">{partidas.length}</span>
        </button>
        {abierto.partidas && (
        <div className="mt-3">
          <input
            className={`${inputCls} mb-2`}
            placeholder="Buscar por clave, descripción o función..."
            value={busquedaPartida}
            onChange={(e) => setBusquedaPartida(e.target.value)}
          />
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {partidasFiltradas.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-xs border-b border-[var(--border)] pb-1.5">
              {editPartidaId === p.id ? (
                <>
                  <input className={`${inputCls} py-1`} defaultValue={p.partida_clave} onChange={(e) => setEditPartidaValor((v) => ({ ...v, clave: e.target.value }))} />
                  <input className={`${inputCls} py-1`} defaultValue={p.partida_descripcion} onChange={(e) => setEditPartidaValor((v) => ({ ...v, descripcion: e.target.value }))} />
                  <button onClick={() => guardarEdicionPartida(p.id)} className="text-emerald-400">✓</button>
                  <button onClick={() => setEditPartidaId(null)} className="text-[var(--text-muted)]">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate">{p.partida_clave} — {p.partida_descripcion} <span className="text-[var(--text-muted)]">({p.capitulo_clave}, {p.funcion_nombre.slice(0, 25)})</span></span>
                  <button onClick={() => { setEditPartidaId(p.id); setEditPartidaValor({ clave: p.partida_clave, descripcion: p.partida_descripcion }); }} className="text-[var(--text-muted)] hover:text-[var(--accent)]">✎</button>
                  <button onClick={() => setConfirmarEliminar({ tipo: 'partida', id: p.id, nombre: `${p.partida_clave} — ${p.partida_descripcion}` })} className="text-[var(--text-muted)] hover:text-rose-400">🗑</button>
                </>
              )}
            </div>
          ))}
          {partidasFiltradas.length === 0 && <p className="text-xs text-[var(--text-muted)]">Sin resultados.</p>}
        </div>
        </div>
        )}
      </div>

      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setConfirmarEliminar(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-rose-500/40 bg-[var(--surface)] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h2 className="text-sm font-semibold">Eliminar {confirmarEliminar.tipo}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  "{confirmarEliminar.nombre}" — esta acción no se puede deshacer. Se bloqueará si tiene movimientos u otros datos vinculados.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setConfirmarEliminar(null)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]">Cancelar</button>
              <button onClick={ejecutarEliminar} className="rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-medium text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
