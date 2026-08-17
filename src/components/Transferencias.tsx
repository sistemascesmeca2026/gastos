'use client';

import { useEffect, useState } from 'react';

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

function money(v: string | number) {
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function Transferencias({ ejercicio }: { ejercicio: number }) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/movimientos?ejercicio=${ejercicio}`)
      .then((r) => r.json())
      .then((data: Movimiento[]) => {
        setMovimientos(data.filter((m) => m.tipo_tramite === 'transferencia_entrada' || m.tipo_tramite === 'transferencia_salida'));
      })
      .finally(() => setLoading(false));
  }, [ejercicio]);

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Cargando transferencias...</p>;

  const totalEntradas = movimientos.filter((m) => m.tipo_tramite === 'transferencia_entrada').reduce((a, m) => a + Number(m.monto), 0);
  const totalSalidas = movimientos.filter((m) => m.tipo_tramite === 'transferencia_salida').reduce((a, m) => a + Number(m.monto), 0);

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Movimientos que reclasifican recurso entre partidas (modificaciones al presupuesto original). Cada uno registra quién lo capturó.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Total entradas</p>
          <p className="text-xl font-semibold text-emerald-400">${money(totalEntradas)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Total salidas</p>
          <p className="text-xl font-semibold text-rose-400">${money(totalSalidas)}</p>
        </div>
      </div>

      {movimientos.length === 0 ? (
        <p className="text-[var(--text-muted)] text-sm">Aún no se han capturado transferencias en este ejercicio.</p>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)] text-xs">
                <th className="py-2.5 px-4 font-medium">Fecha</th>
                <th className="py-2.5 px-4 font-medium">Movimiento</th>
                <th className="py-2.5 px-4 font-medium">Partida</th>
                <th className="py-2.5 px-4 font-medium">Función</th>
                <th className="py-2.5 px-4 font-medium text-right">Monto</th>
                <th className="py-2.5 px-4 font-medium">Concepto</th>
                <th className="py-2.5 px-4 font-medium">Capturado por</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => {
                const esEntrada = m.tipo_tramite === 'transferencia_entrada';
                return (
                  <tr key={m.id} className="border-b border-[var(--border)]/60">
                    <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap">{m.fecha?.toString().slice(0, 10)}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${esEntrada ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'}`}>
                        {esEntrada ? '↓ Entrada' : '↑ Salida'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">{m.partida_clave} — {m.partida_descripcion}</td>
                    <td className="py-2.5 px-4 text-[var(--text-muted)]">{m.funcion_nombre.slice(0, 35)}</td>
                    <td className={`py-2.5 px-4 text-right font-medium ${esEntrada ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {esEntrada ? '+' : '−'}${money(m.monto)}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--text-muted)] max-w-xs">{m.concepto}</td>
                    <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap text-xs">{m.creado_por_nombre || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
