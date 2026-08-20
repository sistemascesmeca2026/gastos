'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import Catalogo from '@/components/Catalogo';
import Usuarios from '@/components/Usuarios';
import Transferencias from '@/components/Transferencias';
import Retirado from '@/components/Retirado';
import Concentrado from '@/components/Concentrado';
import CambiarPassword from '@/components/CambiarPassword';
import ConfirmDialog from '@/components/ConfirmDialog';
import ThemeToggle from '@/components/ThemeToggle';
import Combobox from '@/components/Combobox';

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
  creado_por_nombre: string | null;
  actualizado_por_nombre: string | null;
};

type Saldo = {
  partida_id: number;
  clave: string;
  descripcion: string;
  capitulo_clave: string;
  capitulo_nombre: string;
  funcion_nombre: string;
  fecha_corte: string | null;
  modificado: string;
  modificado_real: string;
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
  { value: 'comprobacion_gasto', label: 'Comprobación de gasto', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
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
  const grupos: Record<string, { total_modificado: number; total_ministrado: number; total_ejercido: number; total_por_ejercer: number; partidas: Saldo[]; fechasCorte: Set<string> }> = {};
  for (const s of saldos) {
    if (!grupos[s.funcion_nombre]) {
      grupos[s.funcion_nombre] = { total_modificado: 0, total_ministrado: 0, total_ejercido: 0, total_por_ejercer: 0, partidas: [], fechasCorte: new Set() };
    }
    grupos[s.funcion_nombre].total_modificado += Number(s.modificado_real);
    grupos[s.funcion_nombre].total_ministrado += Number(s.ministrado);
    grupos[s.funcion_nombre].total_ejercido += Number(s.ejercido);
    grupos[s.funcion_nombre].total_por_ejercer += Number(s.por_ejercer);
    grupos[s.funcion_nombre].partidas.push(s);
    if (s.fecha_corte) grupos[s.funcion_nombre].fechasCorte.add(s.fecha_corte.toString().slice(0, 10));
  }
  return grupos;
}

function corteLabel(fechasCorte: Set<string>): string {
  if (fechasCorte.size === 0) return 'Sin corte';
  if (fechasCorte.size === 1) {
    const [f] = fechasCorte;
    return `Corte: ${new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }
  const fechas = Array.from(fechasCorte).sort();
  return `Corte mixto: ${new Date(fechas[0] + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} – ${new Date(fechas[fechas.length - 1] + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'captura', label: 'Captura de oficios' },
  { key: 'presupuesto', label: 'Presupuesto (resumen)' },
  { key: 'movimientos', label: 'Movimientos' },
  { key: 'concentrado', label: 'Concentrado oficial (10 col.)' },
  { key: 'catalogo', label: 'Catálogo' },
  { key: 'transferencias', label: 'Transferencias' },
  { key: 'retirado', label: 'Retirado' },
  { key: 'usuarios', label: 'Usuarios' },
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
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editValor, setEditValor] = useState('');

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
  const [editandoMovId, setEditandoMovId] = useState<number | null>(null);
  const [folioNumero, setFolioNumero] = useState('');

  const [filtroFuncion, setFiltroFuncion] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [conceptoExpandido, setConceptoExpandido] = useState<number | null>(null);

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

  const [ejercicioSel, setEjercicioSel] = useState<number>(new Date().getFullYear());
  const [espacio, setEspacio] = useState<'ruiz' | 'ballinas'>('ruiz');
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState<number[]>([]);

  useEffect(() => {
    fetch('/api/ejercicios').then((r) => r.json()).then(setEjerciciosDisponibles);
  }, []);

  type CapituloCat = { id: number; clave: string; nombre: string; funcion_id: number; funcion_nombre: string };
  const [capitulosCatalogo, setCapitulosCatalogo] = useState<CapituloCat[]>([]);
  useEffect(() => {
    fetch('/api/capitulos').then((r) => r.json()).then(setCapitulosCatalogo);
  }, []);

  const [mostrarNuevaPartida, setMostrarNuevaPartida] = useState(false);
  const [nuevaPartidaClave, setNuevaPartidaClave] = useState('');
  const [nuevaPartidaDescripcion, setNuevaPartidaDescripcion] = useState('');
  const [nuevaPartidaError, setNuevaPartidaError] = useState('');
  const [guardandoPartida, setGuardandoPartida] = useState(false);

  const capituloIdSel = capitulosCatalogo.find(
    (c) => c.funcion_nombre === funcionSel && `${c.clave} · ${c.nombre}` === capituloSel
  )?.id;

  const crearPartidaNueva = async () => {
    setNuevaPartidaError('');
    if (!nuevaPartidaClave.trim() || !nuevaPartidaDescripcion.trim()) {
      setNuevaPartidaError('Clave y descripción son obligatorias');
      return;
    }
    if (!capituloIdSel) {
      setNuevaPartidaError('No se pudo identificar el capítulo seleccionado. Verifica función y capítulo.');
      return;
    }
    setGuardandoPartida(true);
    try {
      const res = await fetch('/api/partidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capitulo_id: capituloIdSel, clave: nuevaPartidaClave.trim(), descripcion: nuevaPartidaDescripcion.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNuevaPartidaError(data.error || 'No se pudo crear la partida');
        return;
      }
      await cargarTodo();
      setForm((f) => ({ ...f, partida_id: String(data.id) }));
      setMostrarNuevaPartida(false);
      setNuevaPartidaClave('');
      setNuevaPartidaDescripcion('');
    } catch {
      setNuevaPartidaError('Error de conexión al crear la partida');
    } finally {
      setGuardandoPartida(false);
    }
  };

  const cargarTodo = () => {
    return Promise.all([
      fetch(`/api/partidas?ejercicio=${ejercicioSel}&espacio=${espacio}`).then((r) => r.json()),
      fetch(`/api/movimientos?ejercicio=${ejercicioSel}&espacio=${espacio}`).then((r) => r.json()),
      fetch(`/api/saldos?ejercicio=${ejercicioSel}&espacio=${espacio}`).then((r) => r.json()),
    ]).then(([p, m, s]) => {
      setPartidas(p);
      setMovimientos(m);
      setSaldos(s);
    });
  };

  const [usuario, setUsuario] = useState<{ nombre: string; username: string; es_admin?: boolean; espacio_asignado?: 'ruiz' | 'ballinas' | null } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      setUsuario(d.user);
      if (d.user?.espacio_asignado === 'ruiz' || d.user?.espacio_asignado === 'ballinas') {
        setEspacio(d.user.espacio_asignado);
      }
    });
  }, []);

  const cerrarSesion = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  const [mostrarMenuMobile, setMostrarMenuMobile] = useState(false);

  useEffect(() => {
    setLoading(true);
    cargarTodo().finally(() => setLoading(false));
  }, [ejercicioSel, espacio]);

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
      const folioCompleto = folioNumero.trim() ? `${folioNumero.trim()}/ADM.CESMECA/${ejercicioSel}` : '';
      const url = editandoMovId ? `/api/movimientos/${editandoMovId}` : '/api/movimientos';
      const method = editandoMovId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, folio_oficio: folioCompleto }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar');
      } else {
        setOk(editandoMovId ? 'Oficio actualizado correctamente.' : 'Oficio capturado correctamente.');
        setForm({
          partida_id: '', folio_oficio: '', fecha: '', tipo_tramite: 'solicitud_recursos',
          estado: 'solicitado', monto: '', concepto: '', observaciones: '',
        });
        setFolioNumero('');
        setFuncionSel('');
        setCapituloSel('');
        setEditandoMovId(null);
        cargarTodo();
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const grupos = agruparPorFuncion(saldos);
  const totalModificado = saldos.reduce((a, s) => a + Number(s.modificado_real), 0);
  const totalMinistrado = saldos.reduce((a, s) => a + Number(s.ministrado), 0);
  const totalEjercido = saldos.reduce((a, s) => a + Number(s.ejercido), 0);
  const totalComprometido = saldos.reduce((a, s) => a + Number(s.comprometido), 0);
  const totalPorEjercer = saldos.reduce((a, s) => a + Number(s.por_ejercer), 0);

  const toggle = (funcion: string) => setAbiertas((prev) => ({ ...prev, [funcion]: !prev[funcion] }));

  const iniciarEdicionMovimiento = (m: Movimiento) => {
    const partida = partidas.find((p) => p.partida_clave === m.partida_clave && p.funcion_nombre === m.funcion_nombre);
    setFuncionSel(m.funcion_nombre);
    if (partida) setCapituloSel(`${partida.capitulo_clave} · ${partida.capitulo_nombre}`);
    setForm({
      partida_id: partida ? String(partida.id) : '',
      folio_oficio: m.folio_oficio || '',
      fecha: m.fecha?.toString().slice(0, 10) || '',
      tipo_tramite: m.tipo_tramite,
      estado: m.estado,
      monto: m.monto,
      concepto: m.concepto,
      observaciones: '',
    });
    setEditandoMovId(m.id);
    setFolioNumero((m.folio_oficio || '').split('/')[0]);
    setTab('captura');
  };

  const [movimientoAEliminar, setMovimientoAEliminar] = useState<number | null>(null);

  const eliminarMovimiento = (id: number) => {
    setMovimientoAEliminar(id);
  };

  const confirmarEliminarMovimiento = async () => {
    if (movimientoAEliminar === null) return;
    const res = await fetch(`/api/movimientos/${movimientoAEliminar}`, { method: 'DELETE' });
    setMovimientoAEliminar(null);
    if (res.ok) cargarTodo();
  };

  const funcionesUnicas = Array.from(new Set(movimientos.map((m) => m.funcion_nombre))).sort();

  const movimientosFiltrados = movimientos.filter((m) => {
    if (filtroFuncion && m.funcion_nombre !== filtroFuncion) return false;
    if (filtroTipo && m.tipo_tramite !== filtroTipo) return false;
    if (filtroDesde && m.fecha?.toString().slice(0, 10) < filtroDesde) return false;
    if (filtroHasta && m.fecha?.toString().slice(0, 10) > filtroHasta) return false;
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase();
      const texto = `${m.folio_oficio || ''} ${m.concepto} ${m.partida_clave}`.toLowerCase();
      if (!texto.includes(q)) return false;
    }
    return true;
  });

  const hayFiltrosActivos = !!(filtroFuncion || filtroTipo || filtroDesde || filtroHasta || filtroTexto);
  const limpiarFiltros = () => { setFiltroFuncion(''); setFiltroTipo(''); setFiltroDesde(''); setFiltroHasta(''); setFiltroTexto(''); };

  const [paginaMov, setPaginaMov] = useState(1);
  const POR_PAGINA_MOV = 20;
  useEffect(() => { setPaginaMov(1); }, [filtroFuncion, filtroTipo, filtroDesde, filtroHasta, filtroTexto]);
  const totalPaginasMov = Math.max(1, Math.ceil(movimientosFiltrados.length / POR_PAGINA_MOV));
  const movimientosPagina = movimientosFiltrados.slice((paginaMov - 1) * POR_PAGINA_MOV, paginaMov * POR_PAGINA_MOV);

  const guardarEdicion = async (partidaId: number) => {
    if (editValor === '' || isNaN(Number(editValor))) return;
    try {
      const res = await fetch(`/api/linea-base/${partidaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ministrado: editValor }),
      });
      if (res.ok) {
        setEditandoId(null);
        cargarTodo();
      }
    } catch {
      // silencioso: si falla, el usuario puede reintentar
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">CESMECA — Control presupuestal POA</h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 truncate">Ejercicio fiscal {ejercicioSel}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-muted)] pt-1 flex-shrink-0">
              {!usuario?.espacio_asignado && (
                <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
                  <button
                    onClick={() => setEspacio('ruiz')}
                    className={`px-2.5 py-1 text-xs ${espacio === 'ruiz' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}
                    title="Espacio de Patricia Ruiz: 6 programas institucionales, Subsidio Federal"
                  >
                    Patricia Ruiz
                  </button>
                  <button
                    onClick={() => setEspacio('ballinas')}
                    className={`px-2.5 py-1 text-xs ${espacio === 'ballinas' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}
                    title="Espacio de Patricia Ballinas: posgrados e ingresos propios"
                  >
                    Patricia Ballinas
                  </button>
                </div>
              )}
              <select
                value={ejercicioSel}
                onChange={(e) => setEjercicioSel(Number(e.target.value))}
                className="text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text)]"
                title="Ejercicio fiscal"
              >
                {ejerciciosDisponibles.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <ThemeToggle />
              {usuario && (
                <>
                  <span>{usuario.nombre}</span>
                  <button
                    onClick={() => setMostrarCambiarPassword(true)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--border)] rounded px-2 py-1"
                  >
                    Contraseña
                  </button>
                  <button
                    onClick={cerrarSesion}
                    className="text-[var(--text-muted)] hover:text-rose-400 border border-[var(--border)] rounded px-2 py-1"
                  >
                    Salir
                  </button>
                </>
              )}
            </div>

            <div className="sm:hidden flex items-center gap-2 flex-shrink-0 pt-1">
              <select
                value={ejercicioSel}
                onChange={(e) => setEjercicioSel(Number(e.target.value))}
                className="text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text)]"
                title="Ejercicio fiscal"
              >
                {ejerciciosDisponibles.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <div className="relative">
              <button
                onClick={() => setMostrarMenuMobile((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-lg px-2.5 py-1.5"
              >
                <span className="w-5 h-5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-[10px] font-semibold">
                  {usuario?.nombre?.charAt(0) || '?'}
                </span>
                ☰
              </button>
              {mostrarMenuMobile && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMostrarMenuMobile(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg z-30 p-3 space-y-3">
                    {usuario && <p className="text-sm font-medium px-1">{usuario.nombre}</p>}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs text-[var(--text-muted)]">Tema</span>
                      <ThemeToggle />
                    </div>
                    {usuario && (
                      <div className="border-t border-[var(--border)] pt-2 space-y-1">
                        <button
                          onClick={() => { setMostrarCambiarPassword(true); setMostrarMenuMobile(false); }}
                          className="w-full text-left text-xs text-[var(--text-muted)] hover:text-[var(--accent)] px-1 py-1.5"
                        >
                          Cambiar contraseña
                        </button>
                        <button
                          onClick={cerrarSesion}
                          className="w-full text-left text-xs text-[var(--text-muted)] hover:text-rose-400 px-1 py-1.5"
                        >
                          Salir
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              </div>
            </div>
          </div>

          <nav className="flex gap-1 mt-4 -mb-px overflow-x-auto">
            {TABS.filter((t) => t.key !== 'usuarios' || usuario?.es_admin).map((t) => (
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

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {loading && <p className="text-[var(--text-muted)] text-sm">Cargando...</p>}

        {!loading && tab === 'dashboard' && <Dashboard ejercicio={ejercicioSel} espacio={espacio} />}
        {!loading && tab === 'catalogo' && <Catalogo ejercicioSel={ejercicioSel} />}
        {!loading && tab === 'usuarios' && usuario?.es_admin && <Usuarios />}

        {!loading && tab === 'presupuesto' && (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              <a
                href={`/api/export/xlsx?ejercicio=${ejercicioSel}&espacio=${espacio}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition px-3.5 py-2 text-sm font-medium text-white"
              >
                ⬇ Descargar Excel
              </a>
              <a
                href={`/imprimir?ejercicio=${ejercicioSel}&espacio=${espacio}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-blue-500 transition px-3.5 py-2 text-sm font-medium text-white"
              >
                🖨 Imprimir / Guardar PDF
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <StatCard label="Presupuesto anual (Modificado)" value={`$${money(totalModificado)}`} />
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
                  const tieneSobregiro = grupo.partidas.some((p) => Number(p.por_ejercer) < 0);
                  return (
                    <div key={funcion} className={`rounded-xl border bg-[var(--surface)] overflow-hidden ${tieneSobregiro ? 'border-rose-500/40' : 'border-[var(--border)]'}`}>
                      <button
                        onClick={() => toggle(funcion)}
                        className="w-full flex justify-between items-center gap-3 px-4 py-3.5 text-left hover:bg-[var(--surface-2)]/50 transition"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-[var(--text-muted)] text-xs transition-transform ${abierta ? 'rotate-90' : ''}`}>▸</span>
                          <strong className="text-sm font-medium truncate">{funcion}</strong>
                          <Badge label={corteLabel(grupo.fechasCorte)} color="bg-blue-500/10 text-blue-300 border-blue-500/25" />
                          {tieneSobregiro && <Badge label="⚠ Sobregiro" color="bg-rose-500/15 text-rose-300 border-rose-500/30" />}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                          Anual: ${money(grupo.total_modificado)} · Ministrado: ${money(grupo.total_ministrado)} · <span className="text-emerald-400">${money(grupo.total_por_ejercer)} disp.</span>
                        </span>
                      </button>
                      {abierta && (
                        <div className="px-4 pb-4 overflow-x-auto border-t border-[var(--border)]">
                          <table className="w-full text-xs mt-3 border-collapse">
                            <thead>
                              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                                <th className="py-1.5 pr-3 font-medium">Partida</th>
                                <th className="py-1.5 pr-3 font-medium">Descripción</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Modificado</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Ministrado</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Ejercido</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Comprometido</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Retirado</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Por ejercer</th>
                                <th className="py-1.5 font-medium text-right w-8"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {grupo.partidas.map((p) => (
                                <tr
                                  key={p.partida_id}
                                  className={`border-b border-[var(--border)]/60 hover:bg-[var(--surface-2)]/40 ${
                                    Number(p.por_ejercer) < 0 ? 'bg-rose-500/10' : ''
                                  }`}
                                >
                                  <td className="py-1.5 pr-3 text-[var(--text-muted)]">{p.clave}</td>
                                  <td className="py-1.5 pr-3">{p.descripcion}</td>
                                  <td className="py-1.5 pr-3 text-right">${money(p.modificado_real)}</td>
                                  <td className="py-1.5 pr-3 text-right">
                                    {editandoId === p.partida_id ? (
                                      <input
                                        autoFocus
                                        type="number"
                                        step="0.01"
                                        value={editValor}
                                        onChange={(e) => setEditValor(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') guardarEdicion(p.partida_id); if (e.key === 'Escape') setEditandoId(null); }}
                                        className="w-24 rounded border border-[var(--accent)] bg-[var(--surface-2)] px-1.5 py-0.5 text-right text-xs text-[var(--text)] focus:outline-none"
                                      />
                                    ) : (
                                      `$${money(p.ministrado)}`
                                    )}
                                  </td>
                                  <td className="py-1.5 pr-3 text-right">${money(p.ejercido)}</td>
                                  <td className="py-1.5 pr-3 text-right">${money(p.comprometido)}</td>
                                  <td className="py-1.5 pr-3 text-right text-orange-400">${money(p.retirado)}</td>
                                  <td className={`py-1.5 pr-3 text-right font-medium ${Number(p.por_ejercer) < 0 ? 'text-rose-400' : ''}`}>
                                    ${money(p.por_ejercer)}
                                  </td>
                                  <td className="py-1.5 text-right">
                                    {editandoId === p.partida_id ? (
                                      <div className="flex gap-1 justify-end">
                                        <button onClick={() => guardarEdicion(p.partida_id)} className="text-emerald-400 hover:text-emerald-300 text-xs" title="Guardar">✓</button>
                                        <button onClick={() => setEditandoId(null)} className="text-[var(--text-muted)] hover:text-[var(--text)] text-xs" title="Cancelar">✕</button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => { setEditandoId(p.partida_id); setEditValor(p.ministrado); }}
                                        className="text-[var(--text-muted)] hover:text-[var(--accent)] text-xs"
                                        title="Editar Ministrado"
                                      >
                                        ✎
                                      </button>
                                    )}
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

        {!loading && tab === 'concentrado' && <Concentrado ejercicio={ejercicioSel} espacio={espacio} />}
        {!loading && tab === 'transferencias' && <Transferencias ejercicio={ejercicioSel} espacio={espacio} />}
        {!loading && tab === 'retirado' && <Retirado ejercicio={ejercicioSel} espacio={espacio} />}

        {!loading && tab === 'captura' && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 space-y-4 max-w-[1200px] mx-auto">
            {editandoMovId && (
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                <span className="text-xs text-amber-300">Editando oficio existente</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditandoMovId(null);
                    setForm({ partida_id: '', folio_oficio: '', fecha: '', tipo_tramite: 'solicitud_recursos', estado: 'solicitado', monto: '', concepto: '', observaciones: '' });
                    setFolioNumero('');
                    setFuncionSel('');
                    setCapituloSel('');
                  }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancelar edición
                </button>
              </div>
            )}
            <div>
              <label className={labelCls}>Función / Programa</label>
              <Combobox
                className={inputCls}
                value={funcionSel}
                onChange={(v) => { setFuncionSel(v); setCapituloSel(''); setForm({ ...form, partida_id: '' }); }}
                placeholder="Selecciona una función..."
                opciones={funciones.map(([nombre, etiqueta]) => ({ value: nombre, label: etiqueta }))}
              />
            </div>

            <div>
              <label className={labelCls}>Capítulo</label>
              <Combobox
                className={inputCls}
                value={capituloSel}
                disabled={!funcionSel}
                onChange={(v) => { setCapituloSel(v); setForm({ ...form, partida_id: '' }); }}
                placeholder={funcionSel ? 'Selecciona un capítulo...' : 'Primero elige una función'}
                opciones={capitulos.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <div>
              <label className={labelCls}>Partida</label>
              <Combobox
                className={inputCls}
                value={form.partida_id}
                disabled={!capituloSel}
                onChange={(v) => {
                  if (v === '__nueva__') {
                    setNuevaPartidaError('');
                    setMostrarNuevaPartida(true);
                    return;
                  }
                  setForm({ ...form, partida_id: v });
                }}
                placeholder={capituloSel ? 'Selecciona una partida...' : 'Primero elige un capítulo'}
                opciones={[
                  ...partidasFiltradas.map((p) => ({ value: String(p.id), label: `${p.partida_clave} - ${p.partida_descripcion}` })),
                  ...(capituloSel ? [{ value: '__nueva__', label: '+ Agregar partida nueva…' }] : []),
                ]}
              />
              {mostrarNuevaPartida && (
                <div className="mt-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--surface-2)] p-3 space-y-2">
                  <p className="text-xs text-[var(--text-muted)]">
                    Nueva partida en <span className="text-[var(--text)]">{capituloSel}</span> ({funcionSel})
                  </p>
                  <div>
                    <label className={labelCls}>Clave (ej. 21506)</label>
                    <input
                      className={inputCls}
                      value={nuevaPartidaClave}
                      onChange={(e) => setNuevaPartidaClave(e.target.value)}
                      placeholder="21506"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Descripción</label>
                    <input
                      className={inputCls}
                      value={nuevaPartidaDescripcion}
                      onChange={(e) => setNuevaPartidaDescripcion(e.target.value)}
                      placeholder="Materiales y útiles de..."
                    />
                  </div>
                  {nuevaPartidaError && <p className="text-xs text-rose-400">{nuevaPartidaError}</p>}
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1"
                      onClick={() => { setMostrarNuevaPartida(false); setNuevaPartidaError(''); }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={guardandoPartida}
                      className="text-xs bg-[var(--accent)] text-white rounded-md px-3 py-1.5 disabled:opacity-50"
                      onClick={crearPartidaNueva}
                    >
                      {guardandoPartida ? 'Guardando...' : 'Crear y usar esta partida'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Folio de oficio</label>
                <div className="flex items-center gap-1.5">
                  <input
                    className={`${inputCls} w-24`}
                    value={folioNumero}
                    onChange={(e) => setFolioNumero(e.target.value)}
                    placeholder="065"
                  />
                  <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">/ADM.CESMECA/{ejercicioSel}</span>
                </div>
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
              <label className={labelCls}>Concepto</label>
              <textarea
                className={`${inputCls} min-h-20`}
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                placeholder="Viáticos CDMX - Dr. Solís, o descripción completa del recurso otorgado..."
              />
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
              {saving ? 'Guardando...' : editandoMovId ? 'Actualizar oficio' : 'Guardar oficio'}
            </button>
          </form>
        )}

        {!loading && tab === 'movimientos' && (
          movimientos.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">Aún no hay movimientos capturados.</p>
          ) : (
            <>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>Buscar</label>
                    <input className={inputCls} value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} placeholder="Folio, concepto, partida..." />
                  </div>
                  <div>
                    <label className={labelCls}>Función</label>
                    <Combobox
                      className={inputCls}
                      value={filtroFuncion}
                      onChange={setFiltroFuncion}
                      placeholder="Todas"
                      opciones={[{ value: '', label: 'Todas' }, ...funcionesUnicas.map((f) => ({ value: f, label: f }))]}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tipo de trámite</label>
                    <select className={inputCls} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                      <option value="">Todos</option>
                      {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Desde</label>
                    <input type="date" className={inputCls} value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Hasta</label>
                    <input type="date" className={inputCls} value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
                  </div>
                </div>
                {hayFiltrosActivos && (
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-[var(--text-muted)]">{movimientosFiltrados.length} de {movimientos.length} movimientos</span>
                    <button onClick={limpiarFiltros} className="text-xs text-[var(--accent)] hover:underline">Limpiar filtros</button>
                  </div>
                )}
              </div>

              {movimientosFiltrados.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">Ningún movimiento coincide con los filtros.</p>
              ) : (
            <>
            {/* Vista de tarjetas — solo móvil */}
            <div className="sm:hidden space-y-3">
              {movimientosPagina.map((m) => {
                const tipoInfo = TIPOS.find((t) => t.value === m.tipo_tramite);
                const estadoInfo = ESTADOS.find((s) => s.value === m.estado);
                const expandido = conceptoExpandido === m.id;
                return (
                  <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[var(--text-muted)]">{m.fecha?.toString().slice(0, 10)}</span>
                      <span className="text-sm font-semibold">${money(m.monto)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {tipoInfo && <Badge label={tipoInfo.label} color={tipoInfo.color} />}
                      {estadoInfo && <Badge label={estadoInfo.label} color={estadoInfo.color} />}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">
                      Partida <span className="text-[var(--text)]">{m.partida_clave}</span>
                      {m.folio_oficio && <> · Folio <span className="text-[var(--text)]">{m.folio_oficio}</span></>}
                    </p>
                    <p className={`text-sm text-[var(--text-muted)] ${expandido ? '' : 'line-clamp-3'}`}>{m.concepto}</p>
                    {m.concepto && m.concepto.length > 120 && (
                      <button
                        onClick={() => setConceptoExpandido(expandido ? null : m.id)}
                        className="text-xs text-[var(--accent)] mt-1"
                      >
                        {expandido ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border)]">
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {m.creado_por_nombre || '—'}
                        {m.actualizado_por_nombre && m.actualizado_por_nombre !== m.creado_por_nombre && (
                          <span className="opacity-70"> · editó: {m.actualizado_por_nombre}</span>
                        )}
                      </span>
                      <span className="flex gap-3">
                        <button onClick={() => iniciarEdicionMovimiento(m)} className="text-[var(--text-muted)] hover:text-[var(--accent)] text-xs" title="Editar">✎</button>
                        <button onClick={() => eliminarMovimiento(m.id)} className="text-[var(--text-muted)] hover:text-rose-400 text-xs" title="Eliminar">🗑</button>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista de tabla — solo escritorio */}
            <div className="hidden sm:block rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
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
                    <th className="py-2.5 px-4 font-medium">Capturado por</th>
                    <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosPagina.map((m) => {
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
                        <td className="py-2.5 px-4 text-[var(--text-muted)] max-w-md">{m.concepto}</td>
                        <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap text-xs">
                          {m.creado_por_nombre || '—'}
                          {m.actualizado_por_nombre && m.actualizado_por_nombre !== m.creado_por_nombre && (
                            <span className="block text-[10px] opacity-70">editó: {m.actualizado_por_nombre}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <button onClick={() => iniciarEdicionMovimiento(m)} className="text-[var(--text-muted)] hover:text-[var(--accent)] text-xs mr-2" title="Editar">✎</button>
                          <button onClick={() => eliminarMovimiento(m.id)} className="text-[var(--text-muted)] hover:text-rose-400 text-xs" title="Eliminar">🗑</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginasMov > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setPaginaMov((p) => Math.max(1, p - 1))}
                  disabled={paginaMov === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] disabled:opacity-40 hover:bg-[var(--surface-2)]"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-[var(--text-muted)]">Página {paginaMov} de {totalPaginasMov}</span>
                <button
                  onClick={() => setPaginaMov((p) => Math.min(totalPaginasMov, p + 1))}
                  disabled={paginaMov === totalPaginasMov}
                  className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] disabled:opacity-40 hover:bg-[var(--surface-2)]"
                >
                  Siguiente →
                </button>
              </div>
            )}
            </>
              )}
            </>
          )
        )}
      </main>
      {mostrarCambiarPassword && <CambiarPassword onClose={() => setMostrarCambiarPassword(false)} />}
      {movimientoAEliminar !== null && (
        <ConfirmDialog
          titulo="Eliminar movimiento"
          mensaje="Esta acción no se puede deshacer. El oficio se borrará permanentemente de la base de datos."
          textoConfirmar="Eliminar"
          onConfirmar={confirmarEliminarMovimiento}
          onCancelar={() => setMovimientoAEliminar(null)}
        />
      )}
    </div>
  );
}
