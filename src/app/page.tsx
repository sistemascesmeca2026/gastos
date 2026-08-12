'use client';

import { useEffect, useState } from 'react';

type Partida = {
  id: number;
  partida_clave: string;
  partida_descripcion: string;
  capitulo_clave: string;
  capitulo_nombre: string;
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

export default function Home() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

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

  useEffect(() => {
    Promise.all([
      fetch('/api/partidas').then((r) => r.json()),
      fetch('/api/movimientos').then((r) => r.json()),
    ])
      .then(([p, m]) => {
        setPartidas(p);
        setMovimientos(m);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshMovimientos = () => {
    fetch('/api/movimientos')
      .then((r) => r.json())
      .then(setMovimientos);
  };

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
        refreshMovimientos();
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

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', fontFamily: 'sans-serif', color: '#eee' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>CESMECA — Control presupuestal POA</h1>
      <p style={{ color: '#999', marginBottom: 24 }}>Captura de oficios (solicitudes, comprobaciones, reembolsos, retiros)</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32, background: '#1a1a1a', padding: 20, borderRadius: 10 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Partida (función · capítulo · clave)</label>
          <select
            style={inputStyle}
            value={form.partida_id}
            onChange={(e) => setForm({ ...form, partida_id: e.target.value })}
          >
            <option value="">Selecciona una partida...</option>
            {partidas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.funcion_nombre.slice(0, 40)} · {p.capitulo_clave} · {p.partida_clave} - {p.partida_descripcion.slice(0, 40)}
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
          <input type="date" style={inputStyle} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
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

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Movimientos capturados</h2>
      {loading ? (
        <p style={{ color: '#999' }}>Cargando...</p>
      ) : movimientos.length === 0 ? (
        <p style={{ color: '#999' }}>Aún no hay movimientos capturados.</p>
      ) : (
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
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>${Number(m.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '6px 8px' }}>{m.concepto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
