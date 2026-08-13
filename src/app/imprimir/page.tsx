'use client';

import { useEffect, useState } from 'react';

type Saldo = {
  partida_id: number;
  clave: string;
  descripcion: string;
  funcion_nombre: string;
  original: string;
  modificado: string;
  ministrado: string;
  pre_compromiso: string;
  comprometido: string;
  devengado: string;
  ejercido: string;
  pagado: string;
  por_ejercer: string;
  disponible: string;
};

const COLS: { key: keyof Saldo; label: string }[] = [
  { key: 'original', label: 'Original' },
  { key: 'modificado', label: 'Modificado' },
  { key: 'ministrado', label: 'Ministrado' },
  { key: 'pre_compromiso', label: 'Pre-compromiso' },
  { key: 'comprometido', label: 'Comprometido' },
  { key: 'devengado', label: 'Devengado' },
  { key: 'ejercido', label: 'Ejercido' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'por_ejercer', label: 'Por ejercer' },
  { key: 'disponible', label: 'Disponible' },
];

function money(v: string | number) {
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

function agruparPorFuncion(saldos: Saldo[]) {
  const grupos: Record<string, Saldo[]> = {};
  for (const s of saldos) {
    if (!grupos[s.funcion_nombre]) grupos[s.funcion_nombre] = [];
    grupos[s.funcion_nombre].push(s);
  }
  return grupos;
}

export default function ImprimirPage() {
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/saldos')
      .then((r) => r.json())
      .then(setSaldos)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Cargando...</p>;

  const grupos = agruparPorFuncion(saldos);
  const hoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ background: '#fff', color: '#111', fontFamily: 'Arial, sans-serif', padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div className="no-print" style={{ marginBottom: 20 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: '#2a78d6', color: '#fff', fontWeight: 500, cursor: 'pointer' }}
        >
          Imprimir / Guardar como PDF
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 16, margin: 0 }}>UNIVERSIDAD DE CIENCIAS Y ARTES DE CHIAPAS</h1>
        <h2 style={{ fontSize: 13, fontStyle: 'italic', margin: '2px 0' }}>CENTRO DE ESTUDIOS SUPERIORES DE MÉXICO Y CENTROAMÉRICA</h2>
        <h3 style={{ fontSize: 13, fontStyle: 'italic', margin: '2px 0' }}>ESTADO PRESUPUESTAL GENERAL DEL EJERCICIO 2026</h3>
        <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0' }}>Generado el {hoy}</p>
      </div>

      {Object.entries(grupos).map(([funcion, filas]) => {
        const totales = Object.fromEntries(COLS.map(({ key }) => [key, filas.reduce((a, f) => a + Number(f[key]), 0)]));

        return (
          <div key={funcion} style={{ marginBottom: 28, pageBreakInside: 'avoid' }}>
            <h4 style={{ fontSize: 12, background: '#eee', padding: '6px 8px', margin: '0 0 6px' }}>{funcion}</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #999' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Partida</th>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Descripción</th>
                  {COLS.map((c) => (
                    <th key={c.key} style={{ textAlign: 'right', padding: '4px', whiteSpace: 'nowrap' }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.partida_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '3px 4px' }}>{f.clave}</td>
                    <td style={{ padding: '3px 4px' }}>{f.descripcion}</td>
                    {COLS.map((c) => (
                      <td key={c.key} style={{ padding: '3px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>${money(f[c.key])}</td>
                    ))}
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', borderTop: '1px solid #999' }}>
                  <td colSpan={2} style={{ padding: '4px' }}>TOTAL</td>
                  {COLS.map((c) => (
                    <td key={c.key} style={{ padding: '4px', textAlign: 'right', whiteSpace: 'nowrap' }}>${money(totales[c.key])}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          body { background: #fff; }
          @page { size: landscape; }
        }
      `}</style>
    </div>
  );
}
