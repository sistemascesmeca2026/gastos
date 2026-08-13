'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';

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
  { value: 'solicitud_recursos', label: 'Solicitud de recursos' },
  { value: 'comprobacion_viaticos', label: 'Comprobación de viáticos' },
  { value: 'reembolso', label: 'Reembolso' },
  { value: 'retiro_institucional', label: 'Retiro institucional' },
  { value: 'transferencia_entrada', label: 'Transferencia (entrada)' },
  { value: 'transferencia_salida', label: 'Transferencia (salida)' },
];

const ESTADOS = [
  { value: 'solicitado', label: 'Solicitado' },
  { value: 'comprometido', label: 'Comprometido' },
  { value: 'devengado', label: 'Devengado' },
  { value: 'ejercido', label: 'Ejercido' },
  { value: 'pagado', label: 'Pagado' },
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
  { key: 'movimientos', label: 'Movimientos capturados' },
] as const;

type TabKey = typeof TABS[number]['key'];

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
    capturado_por: '',
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
          partida_id: '',
          folio_oficio: '',
          fecha: '',
          tipo_tramite: 'solicitud_recursos',
          estado: 'solicitado',
          monto: '',
          concepto: '',
          observaciones: '',
          capturado_por: '',
        });
        setFuncionSel('');
        setCapituloSel('');
        cargarTodo();
      }
    } catch (err: any) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #444',
    background: '#111',
    color: '#eee',
    fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#aaa',
    display: 'block',
    marginBottom: 4,
  };

  const grupos = agruparPorFuncion(saldos);
  const totalMinistrado = saldos.reduce((a, s) => a + Number(s.ministrado), 0);
  const totalEjercido = saldos.reduce((a, s) => a + Number(s.ejercido), 0);
  const totalComprometido = saldos.reduce((a, s) => a + Number(s.comprometido), 0);
  const totalPorEjercer = saldos.reduce((a, s) => a + Number(s.por_ejercer), 0);

  const toggle = (funcion: string) => setAbiertas((prev) => ({ ...prev, [funcion]: !prev[funcion] }));

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px', fontFamily: 'sans-serif', color: '#eee' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>CESMECA — Control presupuestal POA</h1>
      <p style={{ color: '#999', marginBottom: 20 }}>Línea base marzo 2026 · captura de oficios enero-julio</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #333' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #2a78d6' : '2px solid transparent',
              color: tab === t.key ? '#fff' : '#999',
              fontSize: 14,
              fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#999' }}>Cargando...</p>}

      {!loading && tab === 'dashboard' && <Dashboard />}

      {!loading && tab === 'presupuesto' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <a
              href="/api/export/xlsx"
              style={{ padding: '8px 16px', borderRadius: 6, background: '#1baf7a', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
            >
              Descargar Excel
            </a>
            <a
              href="/imprimir"
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '8px 16px', borderRadius: 6, background: '#2a78d6', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
            >
              Imprimir / Guardar PDF
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 12, color: '#999', margin: '0 0 4px' }}>Ministrado</p>
              <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>${money(totalMinistrado)}</p>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 12, color: '#999', margin: '0 0 4px' }}>Ejercido</p>
              <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>${money(totalEjercido)}</p>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 12, color: '#999', margin: '0 0 4px' }}>Comprometido</p>
              <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>${money(totalComprometido)}</p>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 12, color: '#999', margin: '0 0 4px' }}>Por ejercer</p>
              <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>${money(totalPorEjercer)}</p>
            </div>
          </div>

          {Object.keys(grupos).length === 0 ? (
            <p style={{ color: '#999' }}>No hay línea base cargada.</p>
          ) : (
            Object.entries(grupos).map(([funcion, grupo]) => {
              const abierta = !!abiertas[funcion];
              return (
                <div key={funcion} style={{ marginBottom: 10, background: '#1a1a1a', borderRadius: 10, overflow: 'hidden' }}>
                  <button
                    onClick={() => toggle(funcion)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 16,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#888', width: 12, display: 'inline-block' }}>{abierta ? '▾' : '▸'}</span>
                      <strong style={{ fontSize: 14, color: '#eee' }}>{funcion}</strong>
                    </span>
                    <span style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap' }}>
                      Ministrado: ${money(grupo.total_ministrado)} &nbsp;·&nbsp; Por ejercer: ${money(grupo.total_por_ejercer)}
                    </span>
                  </button>
                  {abierta && (
                    <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>
                            <th style={{ padding: '4px 6px' }}>Partida</th>
                            <th style={{ padding: '4px 6px' }}>Descripción</th>
                            <th style={{ padding: '4px 6px', textAlign: 'right' }}>Ministrado</th>
                            <th style={{ padding: '4px 6px', textAlign: 'right' }}>Ejercido</th>
                            <th style={{ padding: '4px 6px', textAlign: 'right' }}>Comprometido</th>
                            <th style={{ padding: '4px 6px', textAlign: 'right' }}>Por ejercer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.partidas.map((p) => (
                            <tr key={p.partida_id} style={{ borderBottom: '1px solid #222' }}>
                              <td style={{ padding: '4px 6px' }}>{p.clave}</td>
                              <td style={{ padding: '4px 6px', color: '#ccc' }}>{p.descripcion}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right' }}>${money(p.ministrado)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right' }}>${money(p.ejercido)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right' }}>${money(p.comprometido)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', color: Number(p.por_ejercer) < 0 ? '#f87171' : '#eee' }}>
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
            })
          )}
        </>
      )}

      {!loading && tab === 'captura' && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#1a1a1a', padding: 20, borderRadius: 10 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Función / Programa</label>
            <select
              style={inputStyle}
              value={funcionSel}
              onChange={(e) => {
                setFuncionSel(e.target.value);
                setCapituloSel('');
                setForm({ ...form, partida_id: '' });
              }}
            >
              <option value="">Selecciona una función...</option>
              {funciones.map(([nombre, etiqueta]) => (
                <option key={nombre} value={nombre}>{etiqueta}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Capítulo</label>
            <select
              style={inputStyle}
              value={capituloSel}
              disabled={!funcionSel}
              onChange={(e) => {
                setCapituloSel(e.target.value);
                setForm({ ...form, partida_id: '' });
              }}
            >
              <option value="">{funcionSel ? 'Selecciona un capítulo...' : 'Primero elige una función'}</option>
              {capitulos.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Partida</label>
            <select
              style={inputStyle}
              value={form.partida_id}
              disabled={!capituloSel}
              onChange={(e) => setForm({ ...form, partida_id: e.target.value })}
            >
              <option value="">{capituloSel ? 'Selecciona una partida...' : 'Primero elige un capítulo'}</option>
              {partidasFiltradas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partida_clave} - {p.partida_descripcion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Folio de oficio</label>
            <input style={inputStyle} value={form.folio_oficio} onChange={(e) => setForm({ ...form, folio_oficio: e.target.value })} placeholder="OF-2026-112" />
          </div>

          <div>
            <label style={labelStyle}>Fecha</label>
            <input
              type="date"
              style={inputStyle}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
            />
          </div>

          <div>
            <label style={labelStyle}>Tipo de trámite</label>
            <select style={inputStyle} value={form.tipo_tramite} onChange={(e) => setForm({ ...form, tipo_tramite: e.target.value })}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Estado</label>
            <select style={inputStyle} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              {ESTADOS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Monto (MXN)</label>
            <input type="number" step="0.01" style={inputStyle} value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="10000.00" />
          </div>

          <div>
            <label style={labelStyle}>Capturado por</label>
            <input style={inputStyle} value={form.capturado_por} onChange={(e) => setForm({ ...form, capturado_por: e.target.value })} placeholder="Tu nombre" />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Concepto (breve)</label>
            <input style={inputStyle} value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Viáticos CDMX - Dr. Solís" />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Observaciones (opcional)</label>
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>

          {error && <div style={{ gridColumn: '1 / -1', color: '#f87171', fontSize: 13 }}>{error}</div>}
          {ok && <div style={{ gridColumn: '1 / -1', color: '#4ade80', fontSize: 13 }}>{ok}</div>}

          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: '#2a78d6', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>
              {saving ? 'Guardando...' : 'Guardar oficio'}
            </button>
          </div>
        </form>
      )}

      {!loading && tab === 'movimientos' && (
        movimientos.length === 0 ? (
          <p style={{ color: '#999' }}>Aún no hay movimientos capturados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#999', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '6px 8px' }}>Fecha</th>
                  <th style={{ padding: '6px 8px' }}>Folio</th>
                  <th style={{ padding: '6px 8px' }}>Partida</th>
                  <th style={{ padding: '6px 8px' }}>Tipo</th>
                  <th style={{ padding: '6px 8px' }}>Estado</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '6px 8px' }}>Concepto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '6px 8px' }}>{m.fecha?.toString().slice(0, 10)}</td>
                    <td style={{ padding: '6px 8px' }}>{m.folio_oficio || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>{m.partida_clave}</td>
                    <td style={{ padding: '6px 8px' }}>{TIPOS.find((t) => t.value === m.tipo_tramite)?.label || m.tipo_tramite}</td>
                    <td style={{ padding: '6px 8px' }}>{ESTADOS.find((s) => s.value === m.estado)?.label || m.estado}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>${money(m.monto)}</td>
                    <td style={{ padding: '6px 8px' }}>{m.concepto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
