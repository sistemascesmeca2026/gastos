'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import Catalogo from '@/components/Catalogo';

type Partida = {
  id: number;
  partida_clave: string;
  partida_descripcion: string;
  capitulo_clave: string;
  capitulo_nombre: string;
  funcion_clave: string;
  funcion_nombre: string;
};

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
};

type Saldo = {
  partida_id: number;
  clave: string;
  descripcion: string;
  capitulo_clave: string;
  capitulo_nombre: string;
  funcion_nombre: string;
  ministrado: string;
  retirado: string;
  neto: string;
  ejercido: string;
  comprometido: string;
  por_ejercer: string;
};

const TIPOS = [
  { value: 'solicitud_recursos', label: 'Solicitud de recursos', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { value: 'comprobacion_viaticos', label: 'Comprobación de viáticos', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'reembolso', label: 'Reembolso', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { value: 'retiro_institucional', label: 'Retiro institucional', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { value: 'transferencia_entrada', label: 'Transferencia (entrada)', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  { value: 'transferencia_salida', label: 'Transferencia (salida)', color: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' },
];

const ESTADOS = [
  { value: 'solicitado', label: 'Solicitado', color: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' },
  { value: 'comprometido', label: 'Comprometido', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'devengado', label: 'Devengado', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { value: 'ejercido', label: 'Ejercido', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  { value: 'pagado', label: 'Pagado', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
];

function money(v: string | number) {
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

function agruparPorFuncion(saldos: Saldo[]) {
  const grupos: Record<string, { total_ministrado: number; total_ejercido: number; total_por_ejercer: number; partidas: Saldo[] }> = {};
  for (const s of saldos) {
    if (!grupos[s.funcion_nombre]) {
      grupos[s.funcion_nombre] = { total_ministrado: 0, total_ejercido: 0, total_por_ejercer: 0, partidas: [] };
    }
    grupos[s.funcion_nombre].total_ministrado += Number(s.ministrado);
    grupos[s.funcion_nombre].total_ejercido += Number(s.ejercido);
    grupos[s.funcion_nombre].total_por_ejercer += Number(s.por_ejercer);
    grupos[s.funcion_nombre].partidas.push(s);
  }
  return grupos;
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'captura', label: 'Captura de oficios' },
  { key: 'presupuesto', label: 'Presupuesto por función' },
  { key: 'movimientos', label: 'Movimientos' },
  { key: 'catalogo', label: 'Catálogo' },
] as const;

type TabKey = typeof TABS[number]['key'];

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${color}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' | 'bad' }) {
  const toneClass = tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : tone === 'bad' ? 'text-rose-400' : 'text-[var(--text)]';
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className={`text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-40 disabled:cursor-not-allowed transition';
const labelCls = 'block text-xs text-[var(--text-muted)] mb-1.5';

export default function Home() {
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    partida_id: '',
    folio_oficio: '',
    fecha: '',
    tipo_tramite: 'solicitud_recursos',
    estado: 'solicitado',
    monto: '',
    concepto: '',
    observaciones: '',
  });

  const [funcionSel, setFuncionSel] = useState('');
  const [capituloSel, setCapituloSel] = useState('');

  const funciones = Array.from(
    new Map(partidas.map((p) => [p.funcion_nombre, `${p.funcion_clave} ${p.funcion_nombre}`])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));
  const capitulos = Array.from(
    new Set(
      partidas
        .filter((p) => p.funcion_nombre === funcionSel)
        .map((p) => `${p.capitulo_clave} · ${p.capitulo_nombre}`)
    )
  ).sort();
  const partidasFiltradas = partidas.filter(
    (p) => p.funcion_nombre === funcionSel && `${p.capitulo_clave} · ${p.capitulo_nombre}` === capituloSel
  );

  const cargarTodo = () => {
    return Promise.all([
      fetch('/api/partidas').then((r) => r.json()),
      fetch('/api/movimientos').then((r) => r.json()),
      fetch('/api/saldos').then((r) => r.json()),
    ]).then(([p, m, s]) => {
      setPartidas(p);
      setMovimientos(m);
      setSaldos(s);
    });
  };

  useEffect(() => {
    cargarTodo().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');

    if (!form.partida_id || !form.fecha || !form.monto || !form.concepto) {
      setError('Completa partida, fecha, monto y concepto.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar');
      } else {
        setOk('Oficio capturado correctamente.');
        setForm({
          partida_id: '', folio_oficio: '', fecha: '', tipo_tramite: 'solicitud_recursos',
          estado: 'solicitado', monto: '', concepto: '', observaciones: '',
        });
        setFuncionSel('');
        setCapituloSel('');
        cargarTodo();
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const grupos = agruparPorFuncion(saldos);
  const totalMinistrado = saldos.reduce((a, s) => a + Number(s.ministrado), 0);
  const totalEjercido = saldos.reduce((a, s) => a + Number(s.ejercido), 0);
  const totalComprometido = saldos.reduce((a, s) => a + Number(s.comprometido), 0);
  const totalPorEjercer = saldos.reduce((a, s) => a + Number(s.por_ejercer), 0);

  const toggle = (funcion: string) => setAbiertas((prev) => ({ ...prev, [funcion]: !prev[funcion] }));

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">CESMECA — Control presupuestal POA</h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Línea base marzo 2026 · captura de oficios enero–julio</p>

          <nav className="flex gap-1 mt-4 -mb-px overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition ${
                  tab === t.key
                    ? 'border-[var(--accent)] text-[var(--text)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading && <p className="text-[var(--text-muted)] text-sm">Cargando...</p>}

        {!loading && tab === 'dashboard' && <Dashboard />}
        {!loading && tab === 'catalogo' && <Catalogo />}

        {!loading && tab === 'presupuesto' && (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              <a
                href="/api/export/xlsx"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition px-3.5 py-2 text-sm font-medium text-white"
              >
                ⬇ Descargar Excel
              </a>
              <a
                href="/imprimir"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-blue-500 transition px-3.5 py-2 text-sm font-medium text-white"
              >
                🖨 Imprimir / Guardar PDF
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard label="Ministrado" value={`$${money(totalMinistrado)}`} />
              <StatCard label="Ejercido" value={`$${money(totalEjercido)}`} tone="warn" />
              <StatCard label="Comprometido" value={`$${money(totalComprometido)}`} />
              <StatCard label="Por ejercer" value={`$${money(totalPorEjercer)}`} tone="good" />
            </div>

            {Object.keys(grupos).length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm">No hay línea base cargada.</p>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(grupos).map(([funcion, grupo]) => {
                  const abierta = !!abiertas[funcion];
                  return (
                    <div key={funcion} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                      <button
                        onClick={() => toggle(funcion)}
                        className="w-full flex justify-between items-center gap-3 px-4 py-3.5 text-left hover:bg-[var(--surface-2)]/50 transition"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-[var(--text-muted)] text-xs transition-transform ${abierta ? 'rotate-90' : ''}`}>▸</span>
                          <strong className="text-sm font-medium truncate">{funcion}</strong>
                        </span>
                        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                          ${money(grupo.total_ministrado)} · <span className="text-emerald-400">${money(grupo.total_por_ejercer)} disp.</span>
                        </span>
                      </button>
                      {abierta && (
                        <div className="px-4 pb-4 overflow-x-auto border-t border-[var(--border)]">
                          <table className="w-full text-xs mt-3 border-collapse">
                            <thead>
                              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                                <th className="py-1.5 pr-3 font-medium">Partida</th>
                                <th className="py-1.5 pr-3 font-medium">Descripción</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Ministrado</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Ejercido</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Comprometido</th>
                                <th className="py-1.5 font-medium text-right">Por ejercer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grupo.partidas.map((p) => (
                                <tr key={p.partida_id} className="border-b border-[var(--border)]/60 hover:bg-[var(--surface-2)]/40">
                                  <td className="py-1.5 pr-3 text-[var(--text-muted)]">{p.clave}</td>
                                  <td className="py-1.5 pr-3">{p.descripcion}</td>
                                  <td className="py-1.5 pr-3 text-right">${money(p.ministrado)}</td>
                                  <td className="py-1.5 pr-3 text-right">${money(p.ejercido)}</td>
                                  <td className="py-1.5 pr-3 text-right">${money(p.comprometido)}</td>
                                  <td className={`py-1.5 text-right font-medium ${Number(p.por_ejercer) < 0 ? 'text-rose-400' : ''}`}>
                                    ${money(p.por_ejercer)}
                                  </td>
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
            )}
          </>
        )}

        {!loading && tab === 'captura' && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 space-y-4 max-w-2xl">
            <div>
              <label className={labelCls}>Función / Programa</label>
              <select
                className={inputCls}
                value={funcionSel}
                onChange={(e) => { setFuncionSel(e.target.value); setCapituloSel(''); setForm({ ...form, partida_id: '' }); }}
              >
                <option value="">Selecciona una función...</option>
                {funciones.map(([nombre, etiqueta]) => (
                  <option key={nombre} value={nombre}>{etiqueta}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Capítulo</label>
              <select
                className={inputCls}
                value={capituloSel}
                disabled={!funcionSel}
                onChange={(e) => { setCapituloSel(e.target.value); setForm({ ...form, partida_id: '' }); }}
              >
                <option value="">{funcionSel ? 'Selecciona un capítulo...' : 'Primero elige una función'}</option>
                {capitulos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Partida</label>
              <select
                className={inputCls}
                value={form.partida_id}
                disabled={!capituloSel}
                onChange={(e) => setForm({ ...form, partida_id: e.target.value })}
              >
                <option value="">{capituloSel ? 'Selecciona una partida...' : 'Primero elige un capítulo'}</option>
                {partidasFiltradas.map((p) => (
                  <option key={p.id} value={p.id}>{p.partida_clave} - {p.partida_descripcion}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Folio de oficio</label>
                <input className={inputCls} value={form.folio_oficio} onChange={(e) => setForm({ ...form, folio_oficio: e.target.value })} placeholder="OF-2026-112" />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                />
              </div>
              <div>
                <label className={labelCls}>Tipo de trámite</label>
                <select className={inputCls} value={form.tipo_tramite} onChange={(e) => setForm({ ...form, tipo_tramite: e.target.value })}>
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select className={inputCls} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  {ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Monto (MXN)</label>
                <input type="number" step="0.01" className={inputCls} value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="10000.00" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Concepto (breve)</label>
              <input className={inputCls} value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Viáticos CDMX - Dr. Solís" />
            </div>

            <div>
              <label className={labelCls}>Observaciones (opcional)</label>
              <textarea className={`${inputCls} min-h-16`} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
            </div>

            {error && <p className="text-rose-400 text-sm">{error}</p>}
            {ok && <p className="text-emerald-400 text-sm">{ok}</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--accent)] hover:bg-blue-500 disabled:opacity-50 transition px-5 py-2.5 text-sm font-medium text-white"
            >
              {saving ? 'Guardando...' : 'Guardar oficio'}
            </button>
          </form>
        )}

        {!loading && tab === 'movimientos' && (
          movimientos.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">Aún no hay movimientos capturados.</p>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)] text-xs">
                    <th className="py-2.5 px-4 font-medium">Fecha</th>
                    <th className="py-2.5 px-4 font-medium">Folio</th>
                    <th className="py-2.5 px-4 font-medium">Partida</th>
                    <th className="py-2.5 px-4 font-medium">Tipo</th>
                    <th className="py-2.5 px-4 font-medium">Estado</th>
                    <th className="py-2.5 px-4 font-medium text-right">Monto</th>
                    <th className="py-2.5 px-4 font-medium">Concepto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => {
                    const tipoInfo = TIPOS.find((t) => t.value === m.tipo_tramite);
                    const estadoInfo = ESTADOS.find((s) => s.value === m.estado);
                    return (
                      <tr key={m.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--surface-2)]/40">
                        <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap">{m.fecha?.toString().slice(0, 10)}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">{m.folio_oficio || '—'}</td>
                        <td className="py-2.5 px-4">{m.partida_clave}</td>
                        <td className="py-2.5 px-4">{tipoInfo && <Badge label={tipoInfo.label} color={tipoInfo.color} />}</td>
                        <td className="py-2.5 px-4">{estadoInfo && <Badge label={estadoInfo.label} color={estadoInfo.color} />}</td>
                        <td className="py-2.5 px-4 text-right font-medium">${money(m.monto)}</td>
                        <td className="py-2.5 px-4 text-[var(--text-muted)]">{m.concepto}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>
    </div>
  );
}
