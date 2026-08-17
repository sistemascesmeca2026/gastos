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

export default function Retirado({ ejercicio }: { ejercicio: number }) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/movimientos?ejercicio=${ejercicio}`)
      .then((r) => r.json())
      .then((data: Movimiento[]) => {
        setMovimientos(data.filter((m) => m.tipo_tramite === 'retiro_institucional'));
      })
      .finally(() => setLoading(false));
  }, [ejercicio]);

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Cargando retiros...</p>;

  const totalRetirado = movimientos.reduce((a, m) => a + Number(m.monto), 0);

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Recursos retirados institucionalmente por partida (ej. por gestiones de tiempo con la sede). Cada retiro resta directamente del "Por ejercer" disponible y registra quién lo capturó.
      </p>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6 max-w-xs">
        <p className="text-xs text-[var(--text-muted)] mb-1">Total retirado</p>
        <p className="text-xl font-semibold text-orange-400">${money(totalRetirado)}</p>
      </div>

      {movimientos.length === 0 ? (
        <p className="text-[var(--text-muted)] text-sm">Aún no se han capturado retiros en este ejercicio. Para registrar uno, ve a "Captura de oficios" y selecciona el tipo de trámite "Retiro institucional".</p>
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
