'use client';

import { useEffect, useState } from 'react';

type Funcion = { id: number; clave: string; nombre: string; ejercicio: number };
type Capitulo = { id: number; clave: string; nombre: string; funcion_id: number; funcion_clave: string; funcion_nombre: string };

const inputCls =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-40 disabled:cursor-not-allowed transition';
const labelCls = 'block text-xs text-[var(--text-muted)] mb-1.5';
const cardCls = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3';
const btnCls = 'rounded-lg bg-[var(--accent)] hover:bg-blue-500 disabled:opacity-50 transition px-4 py-2 text-sm font-medium text-white';

export default function Catalogo({ ejercicioSel }: { ejercicioSel: number }) {
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
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
    ]).then(([f, c]) => {
      setFunciones(f);
      setCapitulos(c);
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
    </div>
  );
}
