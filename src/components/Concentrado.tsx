'use client';

import { useEffect, useState } from 'react';

type SaldoCompleto = {
  partida_id: number;
  clave: string;
  descripcion: string;
  capitulo_id: number;
  capitulo_clave: string;
  capitulo_nombre: string;
  funcion_id: number;
  funcion_nombre: string;
  ejercicio: number;
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
  retirado: string;
};

type FuncionInfo = { id: number; subtotal_oficial: string | null };
type CapituloInfo = { id: number; subtotal_oficial: string | null };

const CAMPOS_EDITABLES: { key: string; label: string }[] = [
  { key: 'original', label: 'Original' },
  { key: 'modificado', label: 'Modificado' },
  { key: 'ministrado', label: 'Ministrado' },
  { key: 'pre_compromiso', label: 'Pre-compromiso' },
  { key: 'devengado', label: 'Devengado' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'disponible', label: 'Disponible' },
];

const CAMPOS_CALCULADOS: { key: 'comprometido' | 'ejercido' | 'por_ejercer' | 'retirado'; label: string }[] = [
  { key: 'comprometido', label: 'Comprometido' },
  { key: 'ejercido', label: 'Ejercido' },
  { key: 'retirado', label: 'Retirado' },
  { key: 'por_ejercer', label: 'Por ejercer' },
];

function money(v: string | number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

function agrupar(saldos: SaldoCompleto[]) {
  const porFuncion: Record<string, { funcion_id: number; capitulos: Record<string, { capitulo_id: number; partidas: SaldoCompleto[] }> }> = {};
  for (const s of saldos) {
    if (!porFuncion[s.funcion_nombre]) porFuncion[s.funcion_nombre] = { funcion_id: s.funcion_id, capitulos: {} };
    const capKey = `${s.capitulo_clave} · ${s.capitulo_nombre}`;
    if (!porFuncion[s.funcion_nombre].capitulos[capKey]) {
      porFuncion[s.funcion_nombre].capitulos[capKey] = { capitulo_id: s.capitulo_id, partidas: [] };
    }
    porFuncion[s.funcion_nombre].capitulos[capKey].partidas.push(s);
  }
  return porFuncion;
}

export default function Concentrado({ ejercicio, espacio }: { ejercicio: number; espacio: string }) {
  const [saldos, setSaldos] = useState<SaldoCompleto[]>([]);
  const [funciones, setFunciones] = useState<Record<number, FuncionInfo>>({});
  const [capitulos, setCapitulos] = useState<Record<number, CapituloInfo>>({});
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<{ partidaId: number; campo: string } | null>(null);
  const [editValor, setEditValor] = useState('');
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});

  const cargar = () => {
    return Promise.all([
      fetch(`/api/saldos?ejercicio=${ejercicio}&espacio=${espacio}`).then((r) => r.json()),
      fetch(`/api/funciones?ejercicio=${ejercicio}&espacio=${espacio}`).then((r) => r.json()),
      fetch('/api/capitulos').then((r) => r.json()),
    ]).then(([s, f, c]) => {
      setSaldos(s);
      setFunciones(Object.fromEntries(f.map((x: any) => [x.id, x])));
      setCapitulos(Object.fromEntries(c.map((x: any) => [x.id, x])));
    });
  };

  useEffect(() => {
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }, [ejercicio]);

  const guardarPartida = async (partidaId: number, campo: string) => {
    if (editValor === '' || isNaN(Number(editValor))) return;
    await fetch(`/api/linea-base/${partidaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campo, valor: editValor }),
    });
    setEditando(null);
    cargar();
  };

  const guardarSubtotalCapitulo = async (id: number, valor: string) => {
    await fetch(`/api/capitulos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtotal_oficial: valor }),
    });
    cargar();
  };

  const guardarSubtotalFuncion = async (id: number, valor: string) => {
    await fetch(`/api/funciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtotal_oficial: valor }),
    });
    cargar();
  };

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Cargando concentrado...</p>;

  const grupos = agrupar(saldos);
  const toggle = (k: string) => setAbiertas((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <a
          href={`/api/export/xlsx-concentrado?ejercicio=${ejercicio}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition px-3.5 py-2 text-sm font-medium text-white"
        >
          ⬇ Descargar Excel
        </a>
        <a
          href={`/imprimir-concentrado?ejercicio=${ejercicio}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-blue-500 transition px-3.5 py-2 text-sm font-medium text-white"
        >
          🖨 Imprimir / Guardar PDF
        </a>
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-4">
        Réplica del formato oficial de Planeación. Los 7 campos base son editables; Comprometido, Ejercido y Por ejercer se calculan automáticamente de los oficios capturados.
        Captura el subtotal oficial del PDF por capítulo/función para comparar contra lo calculado (✅ coincide, ⚠️ no coincide).
      </p>

      {Object.entries(grupos).map(([funcionNombre, { funcion_id, capitulos: caps }]) => {
        const funcInfo = funciones[funcion_id];
        const totalCalculadoFuncion = Object.values(caps).reduce(
          (acc, cap) => acc + cap.partidas.reduce((a, p) => a + Number(p.ministrado), 0),
          0
        );
        const oficialFuncion = funcInfo?.subtotal_oficial;
        const coincideFuncion = oficialFuncion !== null && oficialFuncion !== undefined
          ? Math.abs(Number(oficialFuncion) - totalCalculadoFuncion) < 0.5
          : null;

        return (
          <div key={funcionNombre} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] mb-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm">{funcionNombre}</strong>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)]">Calculado: ${money(totalCalculadoFuncion)}</span>
                <span className="text-[var(--text-muted)]">Oficial:</span>
                <input
                  className="w-28 rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-right text-xs"
                  defaultValue={oficialFuncion ?? ''}
                  placeholder="—"
                  onBlur={(e) => { if (e.target.value !== (oficialFuncion ?? '')) guardarSubtotalFuncion(funcion_id, e.target.value); }}
                />
                {coincideFuncion === true && <span title="Coincide">✅</span>}
                {coincideFuncion === false && <span title="No coincide">⚠️</span>}
              </div>
            </div>

            {Object.entries(caps).map(([capKey, { capitulo_id, partidas }]) => {
              const key = `${funcionNombre}::${capKey}`;
              const abierta = !!abiertas[key];
              const capInfo = capitulos[capitulo_id];
              const totalCalculadoCap = partidas.reduce((a, p) => a + Number(p.ministrado), 0);
              const oficialCap = capInfo?.subtotal_oficial;
              const coincideCap = oficialCap !== null && oficialCap !== undefined
                ? Math.abs(Number(oficialCap) - totalCalculadoCap) < 0.5
                : null;

              return (
                <div key={key} className="border-t border-[var(--border)]">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-[var(--surface-2)]/40"
                  >
                    <span className="flex items-center gap-2 text-xs">
                      <span className={`text-[var(--text-muted)] transition-transform ${abierta ? 'rotate-90' : ''}`}>▸</span>
                      Capítulo {capKey}
                    </span>
                    <span className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[var(--text-muted)]">Calc: ${money(totalCalculadoCap)}</span>
                      <span className="text-[var(--text-muted)]">Oficial:</span>
                      <input
                        className="w-24 rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-right text-xs"
                        defaultValue={oficialCap ?? ''}
                        placeholder="—"
                        onBlur={(e) => { if (e.target.value !== (oficialCap ?? '')) guardarSubtotalCapitulo(capitulo_id, e.target.value); }}
                      />
                      {coincideCap === true && <span title="Coincide">✅</span>}
                      {coincideCap === false && <span title="No coincide">⚠️</span>}
                    </span>
                  </button>

                  {abierta && (
                    <div className="overflow-x-auto px-4 pb-4">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                            <th className="py-1.5 pr-3 whitespace-nowrap">Partida</th>
                            <th className="py-1.5 pr-3 whitespace-nowrap">Descripción</th>
                            {CAMPOS_EDITABLES.map((c) => (
                              <th key={c.key} className="py-1.5 pr-3 text-right whitespace-nowrap">{c.label}</th>
                            ))}
                            {CAMPOS_CALCULADOS.map((c) => (
                              <th key={c.key} className="py-1.5 pr-3 text-right whitespace-nowrap opacity-70">{c.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {partidas.map((p) => (
                            <tr key={p.partida_id} className="border-b border-[var(--border)]/60">
                              <td className="py-1.5 pr-3 text-[var(--text-muted)] whitespace-nowrap">{p.clave}</td>
                              <td className="py-1.5 pr-3 min-w-[180px]">{p.descripcion}</td>
                              {CAMPOS_EDITABLES.map((c) => {
                                const val = (p as any)[c.key];
                                const editandoEsta = editando?.partidaId === p.partida_id && editando.campo === c.key;
                                return (
                                  <td key={c.key} className="py-1.5 pr-3 text-right whitespace-nowrap">
                                    {editandoEsta ? (
                                      <input
                                        autoFocus
                                        type="number"
                                        step="0.01"
                                        value={editValor}
                                        onChange={(e) => setEditValor(e.target.value)}
                                        onBlur={() => guardarPartida(p.partida_id, c.key)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') guardarPartida(p.partida_id, c.key);
                                          if (e.key === 'Escape') setEditando(null);
                                        }}
                                        className="w-20 rounded border border-[var(--accent)] bg-[var(--surface-2)] px-1 py-0.5 text-right text-xs"
                                      />
                                    ) : (
                                      <button
                                        onClick={() => { setEditando({ partidaId: p.partida_id, campo: c.key }); setEditValor(String(val ?? 0)); }}
                                        className="hover:text-[var(--accent)]"
                                      >
                                        ${money(val)}
                                      </button>
                                    )}
                                  </td>
                                );
                              })}
                              {CAMPOS_CALCULADOS.map((c) => (
                                <td key={c.key} className="py-1.5 pr-3 text-right whitespace-nowrap opacity-70">
                                  ${money((p as any)[c.key])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
