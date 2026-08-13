'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type Saldo = {
  partida_id: number;
  clave: string;
  descripcion: string;
  capitulo_id: number;
  capitulo_clave: string;
  capitulo_nombre: string;
  funcion_id: number;
  funcion_nombre: string;
  original: string; modificado: string; ministrado: string; pre_compromiso: string;
  comprometido: string; devengado: string; ejercido: string; pagado: string;
  por_ejercer: string; disponible: string;
};

const COLS: { key: keyof Saldo; label: string }[] = [
  { key: 'original', label: 'Original' },
  { key: 'modificado', label: 'Modificado' },
  { key: 'ministrado', label: 'Ministrado' },
  { key: 'pre_compromiso', label: 'Pre-comp.' },
  { key: 'comprometido', label: 'Comprom.' },
  { key: 'devengado', label: 'Devengado' },
  { key: 'ejercido', label: 'Ejercido' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'por_ejercer', label: 'Por ejercer' },
  { key: 'disponible', label: 'Disponible' },
];

function money(v: string | number) {
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

function ImprimirConcentradoContenido() {
  const searchParams = useSearchParams();
  const ejercicio = searchParams.get('ejercicio') || String(new Date().getFullYear());
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [capOficial, setCapOficial] = useState<Record<number, number | null>>({});
  const [funOficial, setFunOficial] = useState<Record<number, number | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/saldos?ejercicio=${ejercicio}`).then((r) => r.json()),
      fetch('/api/capitulos').then((r) => r.json()),
      fetch(`/api/funciones?ejercicio=${ejercicio}`).then((r) => r.json()),
    ]).then(([s, c, f]) => {
      setSaldos(s);
      setCapOficial(Object.fromEntries(c.map((x: any) => [x.id, x.subtotal_oficial])));
      setFunOficial(Object.fromEntries(f.map((x: any) => [x.id, x.subtotal_oficial])));
      setLoading(false);
    });
  }, [ejercicio]);

  if (loading) return <p style={{ padding: 20 }}>Cargando...</p>;

  const porFuncion: Record<string, { funcion_id: number; filas: Saldo[] }> = {};
  for (const s of saldos) {
    if (!porFuncion[s.funcion_nombre]) porFuncion[s.funcion_nombre] = { funcion_id: s.funcion_id, filas: [] };
    porFuncion[s.funcion_nombre].filas.push(s);
  }

  const hoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ background: '#fff', color: '#111', fontFamily: 'Arial, sans-serif', padding: 24, maxWidth: 1500, margin: '0 auto' }}>
      <div className="no-print" style={{ marginBottom: 20 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: '#2a78d6', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>
          Imprimir / Guardar como PDF
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 15, margin: 0 }}>CONCENTRADO OFICIAL — CESMECA UNICACH</h1>
        <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0' }}>Ejercicio {ejercicio} · Generado el {hoy}</p>
      </div>

      {Object.entries(porFuncion).map(([funcion, { funcion_id, filas }]) => {
        const porCapitulo: Record<string, { capitulo_id: number; filas: Saldo[] }> = {};
        for (const f of filas) {
          const key = `${f.capitulo_clave} · ${f.capitulo_nombre}`;
          if (!porCapitulo[key]) porCapitulo[key] = { capitulo_id: f.capitulo_id, filas: [] };
          porCapitulo[key].filas.push(f);
        }
        const totalFuncion = filas.reduce((a, f) => a + Number(f.ministrado), 0);
        const ofFuncion = funOficial[funcion_id];
        const coincideFuncion = ofFuncion != null ? Math.abs(Number(ofFuncion) - totalFuncion) < 0.5 : null;

        return (
          <div key={funcion} style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: 12, background: '#eee', padding: '5px 8px', margin: '0 0 6px' }}>{funcion}</h3>
            {Object.entries(porCapitulo).map(([capKey, { capitulo_id, filas: filasCap }]) => {
              const totalCap = filasCap.reduce((a, f) => a + Number(f.ministrado), 0);
              const ofCap = capOficial[capitulo_id];
              const coincideCap = ofCap != null ? Math.abs(Number(ofCap) - totalCap) < 0.5 : null;

              return (
                <div key={capKey} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 'bold', margin: '4px 0' }}>Capítulo {capKey}</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #999' }}>
                        <th style={{ textAlign: 'left', padding: '3px' }}>Partida</th>
                        <th style={{ textAlign: 'left', padding: '3px' }}>Descripción</th>
                        {COLS.map((c) => <th key={c.key} style={{ textAlign: 'right', padding: '3px', whiteSpace: 'nowrap' }}>{c.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filasCap.map((f) => (
                        <tr key={f.partida_id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '2px 3px' }}>{f.clave}</td>
                          <td style={{ padding: '2px 3px' }}>{f.descripcion}</td>
                          {COLS.map((c) => <td key={c.key} style={{ padding: '2px 3px', textAlign: 'right', whiteSpace: 'nowrap' }}>${money(f[c.key])}</td>)}
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 'bold', borderTop: '1px solid #999' }}>
                        <td colSpan={2}>Subtotal calculado</td>
                        <td colSpan={10} style={{ textAlign: 'right' }}>${money(totalCap)}</td>
                      </tr>
                      {ofCap != null && (
                        <tr style={{ fontWeight: 'bold', color: coincideCap ? '#16a34a' : '#dc2626' }}>
                          <td colSpan={2}>Subtotal oficial (PDF)</td>
                          <td colSpan={10} style={{ textAlign: 'right' }}>${money(ofCap)} {coincideCap ? '✓ COINCIDE' : '⚠ NO COINCIDE'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
            <p style={{ fontSize: 10, fontWeight: 'bold', marginTop: 6 }}>
              TOTAL FUNCIÓN (calculado): ${money(totalFuncion)}
              {ofFuncion != null && (
                <span style={{ color: coincideFuncion ? '#16a34a' : '#dc2626', marginLeft: 12 }}>
                  · Oficial: ${money(ofFuncion)} {coincideFuncion ? '✓ COINCIDE' : '⚠ NO COINCIDE'}
                </span>
              )}
            </p>
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

export default function ImprimirConcentradoPage() {
  return (
    <Suspense fallback={<p style={{ padding: 20 }}>Cargando...</p>}>
      <ImprimirConcentradoContenido />
    </Suspense>
  );
}
