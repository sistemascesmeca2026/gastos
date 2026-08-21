'use client';

import { useState } from 'react';

type Partida = {
  clave: string;
  descripcion: string;
  original: number;
  modificado: number;
  ministrado: number;
  pre_compromiso: number;
  comprometido: number;
  devengado: number;
  ejercido: number;
  pagado: number;
  por_ejercer: number;
  disponible: number;
  estadoPartida?: 'nueva' | 'coincide' | 'diferente' | 'sin_corte_previo' | 'nueva_funcion_o_capitulo';
  ministradoAnterior?: number | null;
};

type Capitulo = { clave: string; nombre: string; partidas: Partida[]; estadoCapitulo?: 'nueva' | 'existente' };
type Funcion = { clave: string; nombre: string; capitulos: Capitulo[]; estadoFuncion?: 'nueva' | 'existente' };

type Analisis = {
  dependencia: { clave: string; nombre: string } | null;
  fondo: { clave: string; nombre: string } | null;
  funciones: Funcion[];
  totalMinistradoCalculado: number;
  totalMinistradoDelPDF: number | null;
  coincide: boolean | null;
  lineasNoReconocidas: string[];
};

function money(v: number) {
  return v.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function CargarCorte() {
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [analisis, setAnalisis] = useState<Analisis | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setAnalizando(true);
    setError('');
    setAnalisis(null);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('ejercicio', '2026');
      const res = await fetch('/api/cargar-corte/analizar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo analizar el archivo.');
        return;
      }
      setNombreArchivo(data.nombreArchivo);
      setAnalisis(data.analisis);
    } catch {
      setError('Error de conexión al subir el archivo.');
    } finally {
      setAnalizando(false);
      e.target.value = '';
    }
  };

  const totalPartidas = analisis?.funciones.reduce((a, f) => a + f.capitulos.reduce((a2, c) => a2 + c.partidas.length, 0), 0) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-300 font-medium">🧪 Función experimental (solo admin)</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Sube un PDF de "Estado Presupuestal General" y el sistema lo analiza mostrando una vista previa. Por ahora <strong>no se guarda nada en la base de datos</strong> — es solo para revisar qué tan bien lee el documento antes de construir el siguiente paso (confirmar y cargar).
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <label className="block text-sm font-semibold mb-3">Subir PDF de corte oficial</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={onFileChange}
          disabled={analizando}
          className="block w-full text-sm text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--accent)] file:text-white hover:file:bg-blue-500 disabled:opacity-50"
        />
        {analizando && <p className="text-xs text-[var(--text-muted)] mt-3">Analizando "{nombreArchivo || 'archivo'}"...</p>}
        {error && <p className="text-xs text-rose-400 mt-3">{error}</p>}
      </div>

      {analisis && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="text-sm font-semibold mb-3">Resumen del análisis — {nombreArchivo}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[var(--text-muted)] text-xs">Dependencia</p>
                <p>{analisis.dependencia ? `${analisis.dependencia.clave} — ${analisis.dependencia.nombre}` : '⚠ No detectada'}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs">Fondo</p>
                <p>{analisis.fondo ? `${analisis.fondo.clave} — ${analisis.fondo.nombre}` : '⚠ No detectado'}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs">Funciones / Partidas</p>
                <p>{analisis.funciones.length} funciones, {totalPartidas} partidas</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs">Verificación de suma (Ministrado)</p>
                <p className={analisis.coincide === true ? 'text-emerald-400' : analisis.coincide === false ? 'text-rose-400' : 'text-[var(--text-muted)]'}>
                  {money(analisis.totalMinistradoCalculado)}
                  {analisis.totalMinistradoDelPDF !== null && ` / ${money(analisis.totalMinistradoDelPDF)} (PDF)`}
                  {analisis.coincide === true && ' ✓ Coincide'}
                  {analisis.coincide === false && ' ⚠ No coincide'}
                </p>
              </div>
            </div>
            {analisis.lineasNoReconocidas.length > 0 && (
              <div className="mt-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3">
                <p className="text-xs text-rose-300 font-medium mb-1">⚠ {analisis.lineasNoReconocidas.length} línea(s) que no se pudieron interpretar:</p>
                <ul className="text-xs text-[var(--text-muted)] space-y-0.5 max-h-32 overflow-y-auto">
                  {analisis.lineasNoReconocidas.map((l, i) => <li key={i}>• {l}</li>)}
                </ul>
              </div>
            )}
          </div>

          {analisis.funciones.map((f) => {
            const totalFuncion = f.capitulos.reduce((a, c) => a + c.partidas.reduce((a2, p) => a2 + p.ministrado, 0), 0);
            const nuevas = f.capitulos.reduce((a, c) => a + c.partidas.filter((p) => p.estadoPartida === 'nueva' || p.estadoPartida === 'nueva_funcion_o_capitulo').length, 0);
            const diferentes = f.capitulos.reduce((a, c) => a + c.partidas.filter((p) => p.estadoPartida === 'diferente').length, 0);
            return (
              <div key={f.clave} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="px-5 py-3 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {f.clave} — {f.nombre}{' '}
                      {f.estadoFuncion === 'nueva' && <span className="text-xs font-normal text-sky-400 border border-sky-500/40 rounded px-1.5 py-0.5 ml-1">función nueva</span>}
                      {f.estadoFuncion === 'existente' && <span className="text-xs font-normal text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5 ml-1">ya existe</span>}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Ministrado total: ${money(totalFuncion)}</p>
                  </div>
                  <div className="text-xs flex gap-2">
                    {nuevas > 0 && <span className="text-sky-400">{nuevas} partida(s) nueva(s)</span>}
                    {diferentes > 0 && <span className="text-amber-400">{diferentes} con monto distinto</span>}
                  </div>
                </div>
                {f.capitulos.map((c) => (
                  <div key={c.clave} className="px-5 py-3 border-b border-[var(--border)]/50 last:border-0">
                    <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Capítulo {c.clave} · {c.nombre}</p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[var(--text-muted)]">
                          <th className="pr-3 py-1 font-normal">Partida</th>
                          <th className="pr-3 py-1 font-normal">Descripción</th>
                          <th className="pr-3 py-1 font-normal text-right">Original</th>
                          <th className="pr-3 py-1 font-normal text-right">Modificado</th>
                          <th className="pr-3 py-1 font-normal text-right">Ministrado</th>
                          <th className="pr-3 py-1 font-normal text-right">Por ejercer</th>
                          <th className="pr-3 py-1 font-normal">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.partidas.map((p, i) => (
                          <tr key={i} className="border-t border-[var(--border)]/30">
                            <td className="pr-3 py-1">{p.clave}</td>
                            <td className="pr-3 py-1">{p.descripcion}</td>
                            <td className="pr-3 py-1 text-right">${money(p.original)}</td>
                            <td className="pr-3 py-1 text-right">${money(p.modificado)}</td>
                            <td className="pr-3 py-1 text-right">${money(p.ministrado)}</td>
                            <td className="pr-3 py-1 text-right">${money(p.por_ejercer)}</td>
                            <td className="pr-3 py-1">
                              {(p.estadoPartida === 'nueva' || p.estadoPartida === 'nueva_funcion_o_capitulo') && <span className="text-sky-400">🆕 Nueva</span>}
                              {p.estadoPartida === 'coincide' && <span className="text-emerald-400">✓ Coincide</span>}
                              {p.estadoPartida === 'sin_corte_previo' && <span className="text-[var(--text-muted)]">Ya existe, sin corte previo</span>}
                              {p.estadoPartida === 'diferente' && (
                                <span className="text-amber-400">⚠ Antes ${money(p.ministradoAnterior || 0)}, ahora ${money(p.ministrado)}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-center text-sm text-[var(--text-muted)]">
            Siguiente paso (aún no construido): comparar esta vista previa contra el catálogo ya existente, marcar coincidencias/diferencias, y un botón para confirmar la carga.
          </div>
        </div>
      )}
    </div>
  );
}
