'use client';

import { useEffect, useState } from 'react';
import Combobox from '@/components/Combobox';

type Movimiento = {
  id: number;
  folio_oficio: string | null;
  fecha: string;
  tipo_tramite: string;
  estado: string;
  monto: string;
  concepto: string;
  partida_clave: string;
  partida_descripcion: string;
  funcion_nombre: string;
  creado_por_nombre: string | null;
};

type Partida = {
  id: number;
  partida_clave: string;
  partida_descripcion: string;
  capitulo_clave: string;
  capitulo_nombre: string;
  funcion_clave: string;
  funcion_nombre: string;
};

function money(v: string | number) {
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-40';
const labelCls = 'block text-xs text-[var(--text-muted)] mb-1.5';

export default function Retirado({ ejercicio, espacio }: { ejercicio: number; espacio: string }) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);

  const [funcionSel, setFuncionSel] = useState('');
  const [capituloSel, setCapituloSel] = useState('');
  const [partidaId, setPartidaId] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [folio, setFolio] = useState('');
  const [concepto, setConcepto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => {
    setLoading(true);
    return Promise.all([
      fetch(`/api/movimientos?ejercicio=${ejercicio}&espacio=${espacio}`).then((r) => r.json()),
      fetch(`/api/partidas?ejercicio=${ejercicio}&espacio=${espacio}`).then((r) => r.json()),
    ]).then(([m, p]) => {
      setMovimientos(m.filter((x: Movimiento) => x.tipo_tramite === 'retiro_institucional'));
      setPartidas(p);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [ejercicio, espacio]);

  const funciones = Array.from(new Map(partidas.map((p) => [p.funcion_nombre, `${p.funcion_clave} ${p.funcion_nombre}`])).entries()).sort((a, b) => a[1].localeCompare(b[1]));
  const capitulos = Array.from(new Set(partidas.filter((p) => p.funcion_nombre === funcionSel).map((p) => `${p.capitulo_clave} · ${p.capitulo_nombre}`))).sort();
  const partidasFiltradas = partidas.filter((p) => p.funcion_nombre === funcionSel && `${p.capitulo_clave} · ${p.capitulo_nombre}` === capituloSel);

  const registrar = async () => {
    setError('');
    if (!partidaId || !monto || !fecha || !concepto.trim()) {
      setError('Partida, monto, fecha y concepto (fuente/motivo del retiro) son obligatorios.');
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partida_id: Number(partidaId),
          folio_oficio: folio || null,
          fecha,
          tipo_tramite: 'retiro_institucional',
          estado: 'pagado',
          monto: Number(monto),
          concepto: concepto.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo registrar el retiro.');
        return;
      }
      setFuncionSel(''); setCapituloSel(''); setPartidaId(''); setMonto(''); setFecha(''); setFolio(''); setConcepto('');
      await cargar();
    } catch {
      setError('Error de conexión al registrar el retiro.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Cargando retiros...</p>;

  const totalRetirado = movimientos.reduce((a, m) => a + Number(m.monto), 0);

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Recursos retirados institucionalmente por partida (ej. cuando la universidad no libera el recurso de un capítulo en el trimestre). Cada retiro resta directamente del "Por ejercer" disponible de esa partida.
      </p>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-6 max-w-2xl space-y-3">
        <h3 className="text-sm font-semibold">Registrar retiro institucional</h3>

        <div>
          <label className={labelCls}>Función / Programa</label>
          <Combobox
            className={inputCls}
            value={funcionSel}
            onChange={(v) => { setFuncionSel(v); setCapituloSel(''); setPartidaId(''); }}
            placeholder="Selecciona una función..."
            opciones={funciones.map(([nombre, etiqueta]) => ({ value: nombre, label: etiqueta }))}
          />
        </div>
        <div>
          <label className={labelCls}>Capítulo</label>
          <Combobox
            className={inputCls}
            value={capituloSel}
            disabled={!funcionSel}
            onChange={(v) => { setCapituloSel(v); setPartidaId(''); }}
            placeholder={funcionSel ? 'Selecciona un capítulo...' : 'Primero elige función'}
            opciones={capitulos.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div>
          <label className={labelCls}>Partida de la que se retiró el recurso</label>
          <Combobox
            className={inputCls}
            value={partidaId}
            disabled={!capituloSel}
            onChange={setPartidaId}
            placeholder={capituloSel ? 'Selecciona una partida...' : 'Primero elige capítulo'}
            opciones={partidasFiltradas.map((p) => ({ value: String(p.id), label: `${p.partida_clave} - ${p.partida_descripcion}` }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Monto retirado (MXN)</label>
            <input type="number" step="0.01" className={inputCls} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="9500.00" />
          </div>
          <div>
            <label className={labelCls}>Fecha</label>
            <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Folio (opcional)</label>
            <input className={inputCls} value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="063/ADM.CESMECA/2026" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Fuente de financiamiento / motivo del retiro</label>
          <textarea
            className={inputCls}
            rows={2}
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Retiro institucional trimestral — capítulo 3000 no aperturado en sistema de compras."
          />
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <button
          type="button"
          disabled={guardando}
          onClick={registrar}
          className="bg-[var(--accent)] text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Registrar retiro'}
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6 max-w-xs">
        <p className="text-xs text-[var(--text-muted)] mb-1">Total retirado</p>
        <p className="text-xl font-semibold text-orange-400">${money(totalRetirado)}</p>
      </div>

      {movimientos.length === 0 ? (
        <p className="text-[var(--text-muted)] text-sm">Aún no se han capturado retiros en este ejercicio.</p>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)] text-xs">
                <th className="py-2.5 px-4 font-medium">Fecha</th>
                <th className="py-2.5 px-4 font-medium">Partida</th>
                <th className="py-2.5 px-4 font-medium">Función</th>
                <th className="py-2.5 px-4 font-medium text-right">Monto</th>
                <th className="py-2.5 px-4 font-medium">Concepto</th>
                <th className="py-2.5 px-4 font-medium">Capturado por</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-b border-[var(--border)]/60">
                  <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap">{m.fecha?.toString().slice(0, 10)}</td>
                  <td className="py-2.5 px-4">{m.partida_clave} — {m.partida_descripcion}</td>
                  <td className="py-2.5 px-4 text-[var(--text-muted)]">{m.funcion_nombre.slice(0, 35)}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-orange-400">${money(m.monto)}</td>
                  <td className="py-2.5 px-4 text-[var(--text-muted)] max-w-xs">{m.concepto}</td>
                  <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap text-xs">{m.creado_por_nombre || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
