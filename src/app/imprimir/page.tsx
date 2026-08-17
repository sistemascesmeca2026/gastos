'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type Saldo = {
  partida_id: number;
  clave: string;
  descripcion: string;
  capitulo_clave: string;
  capitulo_nombre: string;
  funcion_nombre: string;
  ministrado: string;
  ejercido: string;
  retirado: string;
  comprometido: string;
  por_ejercer: string;
};

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

function ImprimirContenido() {
  const searchParams = useSearchParams();
  const ejercicio = searchParams.get('ejercicio') || String(new Date().getFullYear());
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/saldos?ejercicio=${ejercicio}`)
      .then((r) => r.json())
      .then(setSaldos)
      .finally(() => setLoading(false));
  }, [ejercicio]);

  if (loading) return <p style={{ padding: 20 }}>Cargando...</p>;

  const grupos = agruparPorFuncion(saldos);
  const hoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ background: '#fff', color: '#111', fontFamily: 'Arial, sans-serif', padding: 24, maxWidth: 1000, margin: '0 auto' }}>
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
        <h3 style={{ fontSize: 13, fontStyle: 'italic', margin: '2px 0' }}>PROGRAMA OPERATIVO ANUAL 2026</h3>
        <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0' }}>Generado el {hoy}</p>
      </div>

      {Object.entries(grupos).map(([funcion, filas]) => {
        const totMin = filas.reduce((a, f) => a + Number(f.ministrado), 0);
        const totEj = filas.reduce((a, f) => a + Number(f.ejercido), 0);
        const totRet = filas.reduce((a, f) => a + Number(f.retirado), 0);
        const totComp = filas.reduce((a, f) => a + Number(f.comprometido), 0);
        const totPorEj = filas.reduce((a, f) => a + Number(f.por_ejercer), 0);

        return (
          <div key={funcion} style={{ marginBottom: 28, pageBreakInside: 'avoid' }}>
            <h4 style={{ fontSize: 12, background: '#eee', padding: '6px 8px', margin: '0 0 6px' }}>{funcion}</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #999' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Partida</th>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Descripción</th>
                  <th style={{ textAlign: 'right', padding: '4px' }}>Recurso</th>
                  <th style={{ textAlign: 'right', padding: '4px' }}>Ejercido</th>
                  <th style={{ textAlign: 'right', padding: '4px' }}>Retirado</th>
                  <th style={{ textAlign: 'right', padding: '4px' }}>Comprometido</th>
                  <th style={{ textAlign: 'right', padding: '4px' }}>Por ejercer</th>
                  <th style={{ textAlign: 'center', padding: '4px' }}>Verif.</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const sumaControl = Number(f.ejercido) + Number(f.retirado) + Number(f.comprometido) + Number(f.por_ejercer);
                  const coincide = Math.abs(sumaControl - Number(f.ministrado)) < 0.5;
                  return (
                  <tr key={f.partida_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '3px 4px' }}>{f.clave}</td>
                    <td style={{ padding: '3px 4px' }}>{f.descripcion}</td>
                    <td style={{ padding: '3px 4px', textAlign: 'right' }}>${money(f.ministrado)}</td>
                    <td style={{ padding: '3px 4px', textAlign: 'right' }}>${money(f.ejercido)}</td>
                    <td style={{ padding: '3px 4px', textAlign: 'right' }}>${money(f.retirado)}</td>
                    <td style={{ padding: '3px 4px', textAlign: 'right' }}>${money(f.comprometido)}</td>
                    <td style={{ padding: '3px 4px', textAlign: 'right' }}>${money(f.por_ejercer)}</td>
                    <td style={{ padding: '3px 4px', textAlign: 'center', color: coincide ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{coincide ? '✓' : '⚠'}</td>
                  </tr>
                  );
                })}
                <tr style={{ fontWeight: 'bold', borderTop: '1px solid #999' }}>
                  <td colSpan={2} style={{ padding: '4px' }}>TOTAL</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>${money(totMin)}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>${money(totEj)}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>${money(totRet)}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>${money(totComp)}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>${money(totPorEj)}</td>
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
        }
      `}</style>
    </div>
  );
}

export default function ImprimirPage() {
  return (
    <Suspense fallback={<p style={{ padding: 20 }}>Cargando...</p>}>
      <ImprimirContenido />
    </Suspense>
  );
}
