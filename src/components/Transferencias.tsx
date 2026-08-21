'use client';

import { useEffect, useState } from 'react';
import Combobox from '@/components/Combobox';
import ConfirmDialog from '@/components/ConfirmDialog';

type Partida = {
  id: number;
  partida_clave: string;
  partida_descripcion: string;
  capitulo_clave: string;
  capitulo_nombre: string;
  funcion_clave: string;
  funcion_nombre: string;
};

type TransferenciaPar = {
  salida_id: number;
  grupo_transferencia: string;
  fecha: string;
  monto: string;
  concepto: string;
  folio_oficio: string | null;
  estado: string;
  origen_clave: string;
  origen_descripcion: string;
  origen_funcion: string;
  destino_clave: string;
  destino_descripcion: string;
  destino_funcion: string;
  creado_por_nombre: string | null;
};

function money(v: string | number) {
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-40';
const labelCls = 'block text-xs text-[var(--text-muted)] mb-1.5';

function SelectorPartida({
  partidas, funcionSel, capituloSel, partidaId, onFuncion, onCapitulo, onPartida, onNuevaPartida, funcionBloqueada,
}: {
  partidas: Partida[];
  funcionSel: string;
  capituloSel: string;
  partidaId: string;
  onFuncion: (v: string) => void;
  onCapitulo: (v: string) => void;
  onPartida: (v: string) => void;
  onNuevaPartida: () => void;
  funcionBloqueada?: boolean;
}) {
  const funciones = Array.from(new Map(partidas.map((p) => [p.funcion_nombre, `${p.funcion_clave} ${p.funcion_nombre}`])).entries()).sort((a, b) => a[1].localeCompare(b[1]));
  const capitulos = Array.from(new Set(partidas.filter((p) => p.funcion_nombre === funcionSel).map((p) => `${p.capitulo_clave} · ${p.capitulo_nombre}`))).sort();
  const filtradas = partidas.filter((p) => p.funcion_nombre === funcionSel && `${p.capitulo_clave} · ${p.capitulo_nombre}` === capituloSel);

  return (
    <div className="space-y-2">
      <Combobox
        className={inputCls}
        value={funcionSel}
        disabled={funcionBloqueada}
        onChange={onFuncion}
        placeholder={funcionBloqueada ? 'Mismo proyecto que el origen' : 'Función...'}
        opciones={funciones.map(([nombre, etiqueta]) => ({ value: nombre, label: etiqueta }))}
      />
      <Combobox
        className={inputCls}
        value={capituloSel}
        disabled={!funcionSel}
        onChange={onCapitulo}
        placeholder={funcionSel ? 'Capítulo...' : 'Primero elige función'}
        opciones={capitulos.map((c) => ({ value: c, label: c }))}
      />
      <Combobox
        className={inputCls}
        value={partidaId}
        disabled={!capituloSel}
        onChange={(v) => (v === '__nueva__' ? onNuevaPartida() : onPartida(v))}
        placeholder={capituloSel ? 'Partida...' : 'Primero elige capítulo'}
        opciones={[
          ...filtradas.map((p) => ({ value: String(p.id), label: `${p.partida_clave} - ${p.partida_descripcion}` })),
          ...(capituloSel ? [{ value: '__nueva__', label: '+ Agregar partida nueva…' }] : []),
        ]}
      />
    </div>
  );
}

function NuevaPartidaForm({
  etiqueta, clave, setClave, descripcion, setDescripcion, error, guardando, onCancelar, onGuardar,
}: {
  etiqueta: string;
  clave: string; setClave: (v: string) => void;
  descripcion: string; setDescripcion: (v: string) => void;
  error: string; guardando: boolean;
  onCancelar: () => void; onGuardar: () => void;
}) {
  return (
    <div className="mt-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--surface-2)] p-3 space-y-2">
      <p className="text-xs text-[var(--text-muted)]">Nueva partida en <span className="text-[var(--text)]">{etiqueta}</span></p>
      <div>
        <label className={labelCls}>Clave (ej. 21506)</label>
        <input className={inputCls} value={clave} onChange={(e) => setClave(e.target.value)} placeholder="21506" />
      </div>
      <div>
        <label className={labelCls}>Descripción</label>
        <input className={inputCls} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Materiales y útiles de..." />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1" onClick={onCancelar}>Cancelar</button>
        <button type="button" disabled={guardando} className="text-xs bg-[var(--accent)] text-white rounded-md px-3 py-1.5 disabled:opacity-50" onClick={onGuardar}>
          {guardando ? 'Guardando...' : 'Crear y usar esta partida'}
        </button>
      </div>
    </div>
  );
}

export default function Transferencias({ ejercicio, espacio }: { ejercicio: number; espacio: string }) {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [pares, setPares] = useState<TransferenciaPar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [paginaTr, setPaginaTr] = useState(1);
  const POR_PAGINA_TR = 20;
  const [parAEliminar, setParAEliminar] = useState<TransferenciaPar | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const confirmarEliminarPar = async () => {
    if (!parAEliminar) return;
    setEliminando(true);
    try {
      await fetch(`/api/movimientos/${parAEliminar.salida_id}`, { method: 'DELETE' });
      setParAEliminar(null);
      await cargar();
    } finally {
      setEliminando(false);
    }
  };

  const [origenFuncion, setOrigenFuncion] = useState('');
  const [origenCapitulo, setOrigenCapitulo] = useState('');
  const [origenPartidaId, setOrigenPartidaId] = useState('');
  const [destinoFuncion, setDestinoFuncion] = useState('');
  const [destinoCapitulo, setDestinoCapitulo] = useState('');
  const [destinoPartidaId, setDestinoPartidaId] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [concepto, setConcepto] = useState('');
  const [folio, setFolio] = useState('');

  type CapituloCat = { id: number; clave: string; nombre: string; funcion_id: number; funcion_nombre: string };
  const [capitulosCatalogo, setCapitulosCatalogo] = useState<CapituloCat[]>([]);
  const [nuevaPartidaTarget, setNuevaPartidaTarget] = useState<'origen' | 'destino' | null>(null);
  const [nuevaPartidaClave, setNuevaPartidaClave] = useState('');
  const [nuevaPartidaDescripcion, setNuevaPartidaDescripcion] = useState('');
  const [nuevaPartidaError, setNuevaPartidaError] = useState('');
  const [guardandoPartida, setGuardandoPartida] = useState(false);

  const cargar = () => {
    return Promise.all([
      fetch(`/api/partidas?ejercicio=${ejercicio}&espacio=${espacio}`).then((r) => r.json()),
      fetch(`/api/transferencias?ejercicio=${ejercicio}&espacio=${espacio}`).then((r) => r.json()),
      fetch(`/api/capitulos`).then((r) => r.json()),
    ]).then(([p, t, c]) => {
      setPartidas(p);
      setPares(t);
      setCapitulosCatalogo(c);
    });
  };

  const crearPartidaNueva = async () => {
    setNuevaPartidaError('');
    if (!nuevaPartidaClave.trim() || !nuevaPartidaDescripcion.trim()) {
      setNuevaPartidaError('Clave y descripción son obligatorias');
      return;
    }
    const funcionSel = nuevaPartidaTarget === 'origen' ? origenFuncion : destinoFuncion;
    const capituloSel = nuevaPartidaTarget === 'origen' ? origenCapitulo : destinoCapitulo;
    const capituloId = capitulosCatalogo.find(
      (c) => c.funcion_nombre === funcionSel && `${c.clave} · ${c.nombre}` === capituloSel
    )?.id;
    if (!capituloId) {
      setNuevaPartidaError('No se pudo identificar el capítulo seleccionado.');
      return;
    }
    setGuardandoPartida(true);
    try {
      const res = await fetch('/api/partidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capitulo_id: capituloId, clave: nuevaPartidaClave.trim(), descripcion: nuevaPartidaDescripcion.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNuevaPartidaError(data.error || 'No se pudo crear la partida');
        return;
      }
      await cargar();
      if (nuevaPartidaTarget === 'origen') setOrigenPartidaId(String(data.id));
      else setDestinoPartidaId(String(data.id));
      setNuevaPartidaTarget(null);
      setNuevaPartidaClave('');
      setNuevaPartidaDescripcion('');
    } catch {
      setNuevaPartidaError('Error de conexión al crear la partida');
    } finally {
      setGuardandoPartida(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }, [ejercicio]);

  const limpiarForm = () => {
    setOrigenFuncion(''); setOrigenCapitulo(''); setOrigenPartidaId('');
    setDestinoFuncion(''); setDestinoCapitulo(''); setDestinoPartidaId('');
    setMonto(''); setFecha(''); setConcepto(''); setFolio('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (!origenPartidaId || !destinoPartidaId || !monto || !fecha || !concepto) {
      setError('Completa origen, destino, monto, fecha y concepto.');
      return;
    }
    if (espacio === 'ballinas' && origenFuncion !== destinoFuncion) {
      setError('En este espacio, las transferencias solo pueden moverse dentro del mismo proyecto (misma Función).');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/transferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partida_origen_id: Number(origenPartidaId),
          partida_destino_id: Number(destinoPartidaId),
          monto, fecha, concepto,
          folio_oficio: folio || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar la transferencia');
      } else {
        setOk('Transferencia registrada correctamente.');
        limpiarForm();
        cargar();
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const totalTransferido = pares.reduce((a, t) => a + Number(t.monto), 0);

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Cargando transferencias...</p>;

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Registra en un solo paso de dónde sale el recurso y a dónde va. El sistema crea automáticamente el movimiento de salida en la partida de origen y el de entrada en la de destino, ligados entre sí.
      </p>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 mb-6 max-w-3xl">
        <h3 className="text-sm font-semibold">Nueva transferencia</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Partida de origen (de donde sale)</label>
            <SelectorPartida
              partidas={partidas}
              funcionSel={origenFuncion} capituloSel={origenCapitulo} partidaId={origenPartidaId}
              onFuncion={(v) => {
                setOrigenFuncion(v); setOrigenCapitulo(''); setOrigenPartidaId('');
                if (espacio === 'ballinas') { setDestinoFuncion(v); setDestinoCapitulo(''); setDestinoPartidaId(''); }
              }}
              onCapitulo={(v) => { setOrigenCapitulo(v); setOrigenPartidaId(''); }}
              onPartida={setOrigenPartidaId}
              onNuevaPartida={() => { setNuevaPartidaError(''); setNuevaPartidaTarget('origen'); }}
            />
            {nuevaPartidaTarget === 'origen' && (
              <NuevaPartidaForm
                etiqueta={`${origenCapitulo} (${origenFuncion})`}
                clave={nuevaPartidaClave} setClave={setNuevaPartidaClave}
                descripcion={nuevaPartidaDescripcion} setDescripcion={setNuevaPartidaDescripcion}
                error={nuevaPartidaError} guardando={guardandoPartida}
                onCancelar={() => setNuevaPartidaTarget(null)}
                onGuardar={crearPartidaNueva}
              />
            )}
          </div>
          <div>
            <label className={labelCls}>Partida de destino (a dónde va)</label>
            <SelectorPartida
              partidas={partidas}
              funcionSel={destinoFuncion} capituloSel={destinoCapitulo} partidaId={destinoPartidaId}
              onFuncion={(v) => { setDestinoFuncion(v); setDestinoCapitulo(''); setDestinoPartidaId(''); }}
              onCapitulo={(v) => { setDestinoCapitulo(v); setDestinoPartidaId(''); }}
              onPartida={setDestinoPartidaId}
              onNuevaPartida={() => { setNuevaPartidaError(''); setNuevaPartidaTarget('destino'); }}
              funcionBloqueada={espacio === 'ballinas'}
            />
            {nuevaPartidaTarget === 'destino' && (
              <NuevaPartidaForm
                etiqueta={`${destinoCapitulo} (${destinoFuncion})`}
                clave={nuevaPartidaClave} setClave={setNuevaPartidaClave}
                descripcion={nuevaPartidaDescripcion} setDescripcion={setNuevaPartidaDescripcion}
                error={nuevaPartidaError} guardando={guardandoPartida}
                onCancelar={() => setNuevaPartidaTarget(null)}
                onGuardar={crearPartidaNueva}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Importe (MXN)</label>
            <input type="number" step="0.01" className={inputCls} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="9500.00" />
          </div>
          <div>
            <label className={labelCls}>Fecha</label>
            <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()} />
          </div>
          <div>
            <label className={labelCls}>Folio (opcional)</label>
            <input className={inputCls} value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="063/ADM.CESMECA/2026" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Concepto / justificación</label>
          <textarea className={`${inputCls} min-h-16`} value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Reclasificación de material didáctico a desarrollo de información..." />
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}
        {ok && <p className="text-emerald-400 text-sm">{ok}</p>}

        <button type="submit" disabled={saving} className="rounded-lg bg-[var(--accent)] hover:bg-blue-500 disabled:opacity-50 transition px-5 py-2.5 text-sm font-medium text-white">
          {saving ? 'Guardando...' : 'Registrar transferencia'}
        </button>
      </form>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-4 inline-block">
        <p className="text-xs text-[var(--text-muted)] mb-1">Total transferido</p>
        <p className="text-xl font-semibold">${money(totalTransferido)}</p>
      </div>

      {pares.length === 0 ? (
        <p className="text-[var(--text-muted)] text-sm">Aún no se han registrado transferencias en este ejercicio.</p>
      ) : (
        <>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)] text-xs">
                <th className="py-2.5 px-4 font-medium">Fecha</th>
                <th className="py-2.5 px-4 font-medium">Origen</th>
                <th className="py-2.5 px-4 font-medium">Destino</th>
                <th className="py-2.5 px-4 font-medium text-right">Importe</th>
                <th className="py-2.5 px-4 font-medium">Concepto</th>
                <th className="py-2.5 px-4 font-medium">Capturado por</th>
                <th className="py-2.5 px-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pares.slice((paginaTr - 1) * POR_PAGINA_TR, paginaTr * POR_PAGINA_TR).map((t) => (
                <tr key={t.grupo_transferencia} className="border-b border-[var(--border)]/60">
                  <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap">{t.fecha?.toString().slice(0, 10)}</td>
                  <td className="py-2.5 px-4">
                    <span className="text-rose-400">{t.origen_clave}</span> — {t.origen_descripcion}
                    <span className="block text-[10px] text-[var(--text-muted)]">{t.origen_funcion.slice(0, 40)}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-emerald-400">{t.destino_clave}</span> — {t.destino_descripcion}
                    <span className="block text-[10px] text-[var(--text-muted)]">{t.destino_funcion.slice(0, 40)}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium">${money(t.monto)}</td>
                  <td className="py-2.5 px-4 text-[var(--text-muted)] max-w-xs">{t.concepto}</td>
                  <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap text-xs">{t.creado_por_nombre || '—'}</td>
                  <td className="py-2.5 px-4">
                    <button onClick={() => setParAEliminar(t)} className="text-[var(--text-muted)] hover:text-rose-400 text-xs" title="Eliminar transferencia (ambos lados)">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pares.length > POR_PAGINA_TR && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setPaginaTr((p) => Math.max(1, p - 1))}
              disabled={paginaTr === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] disabled:opacity-40 hover:bg-[var(--surface-2)]"
            >
              ← Anterior
            </button>
            <span className="text-xs text-[var(--text-muted)]">Página {paginaTr} de {Math.ceil(pares.length / POR_PAGINA_TR)}</span>
            <button
              onClick={() => setPaginaTr((p) => Math.min(Math.ceil(pares.length / POR_PAGINA_TR), p + 1))}
              disabled={paginaTr === Math.ceil(pares.length / POR_PAGINA_TR)}
              className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] disabled:opacity-40 hover:bg-[var(--surface-2)]"
            >
              Siguiente →
            </button>
          </div>
        )}
        </>
      )}
      {parAEliminar && (
        <ConfirmDialog
          titulo="Eliminar transferencia"
          mensaje={`Se eliminarán ambos lados de esta transferencia: la salida de ${parAEliminar.origen_clave} y la entrada en ${parAEliminar.destino_clave}, por $${money(parAEliminar.monto)}. Esta acción no se puede deshacer.`}
          textoConfirmar={eliminando ? 'Eliminando...' : 'Eliminar'}
          onConfirmar={confirmarEliminarPar}
          onCancelar={() => setParAEliminar(null)}
        />
      )}
    </div>
  );
}
