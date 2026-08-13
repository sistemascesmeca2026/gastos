'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

Chart.defaults.color = '#8b93a7';
Chart.defaults.borderColor = '#262b38';

type DashboardData = {
  porFuncion: { funcion_nombre: string; ministrado: string; ejercido: string; por_ejercer: string }[];
  porTipo: { tipo_tramite: string; total: string }[];
  porMes: { mes: string; total: string }[];
};

const TIPO_LABELS: Record<string, string> = {
  solicitud_recursos: 'Solicitud de recursos',
  comprobacion_viaticos: 'Comprobación de viáticos',
  reembolso: 'Reembolso',
  retiro_institucional: 'Retiro institucional',
  transferencia_entrada: 'Transferencia (entrada)',
  transferencia_salida: 'Transferencia (salida)',
};

function money(v: string | number) {
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const funcRef = useRef<HTMLCanvasElement>(null);
  const tipoRef = useRef<HTMLCanvasElement>(null);
  const mesRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<Chart[]>([]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (!data) return;

    chartsRef.current.forEach((c) => c.destroy());
    chartsRef.current = [];

    if (funcRef.current) {
      const c = new Chart(funcRef.current, {
        type: 'bar',
        data: {
          labels: data.porFuncion.map((f) => f.funcion_nombre.slice(0, 22)),
          datasets: [{ label: 'Ministrado', data: data.porFuncion.map((f) => Number(f.ministrado)), backgroundColor: '#3b82f6', borderRadius: 6 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { ticks: { callback: (v) => '$' + Number(v).toLocaleString('es-MX') } },
            x: { ticks: { maxRotation: 30, minRotation: 30 } },
          },
        },
      });
      chartsRef.current.push(c);
    }

    if (tipoRef.current) {
      const tipos = data.porTipo.filter((t) => Number(t.total) > 0);
      const c = new Chart(tipoRef.current, {
        type: 'doughnut',
        data: {
          labels: tipos.map((t) => TIPO_LABELS[t.tipo_tramite] || t.tipo_tramite),
          datasets: [{ data: tipos.map((t) => Number(t.total)), backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#a78bfa', '#ec4899'] }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
      });
      chartsRef.current.push(c);
    }

    if (mesRef.current && data.porMes.length > 0) {
      const c = new Chart(mesRef.current, {
        type: 'line',
        data: {
          labels: data.porMes.map((m) => m.mes),
          datasets: [{ label: 'Gasto mensual', data: data.porMes.map((m) => Number(m.total)), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)', fill: true, tension: 0.3 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { ticks: { callback: (v) => '$' + Number(v).toLocaleString('es-MX') } } },
        },
      });
      chartsRef.current.push(c);
    }

    return () => {
      chartsRef.current.forEach((c) => c.destroy());
      chartsRef.current = [];
    };
  }, [data]);

  if (!data) return <p className="text-[var(--text-muted)] text-sm">Cargando dashboard...</p>;

  const totalMinistrado = data.porFuncion.reduce((a, f) => a + Number(f.ministrado), 0);
  const totalEjercido = data.porFuncion.reduce((a, f) => a + Number(f.ejercido), 0);
  const tieneMovimientos = data.porTipo.some((t) => Number(t.total) > 0);

  const cardCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4";
  const chartCardCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 mb-5";

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={cardCls}>
          <p className="text-xs text-[var(--text-muted)] mb-1">Ministrado total</p>
          <p className="text-xl font-semibold">${money(totalMinistrado)}</p>
        </div>
        <div className={cardCls}>
          <p className="text-xs text-[var(--text-muted)] mb-1">Ejercido total</p>
          <p className="text-xl font-semibold text-amber-400">${money(totalEjercido)}</p>
        </div>
      </div>

      <div className={chartCardCls}>
        <p className="text-sm font-medium mb-3">Ministrado por función</p>
        <div className="relative w-full" style={{ height: 260 }}>
          <canvas ref={funcRef} role="img" aria-label="Barras de recurso ministrado por función"></canvas>
        </div>
      </div>

      {tieneMovimientos ? (
        <>
          <div className={chartCardCls}>
            <p className="text-sm font-medium mb-3">Distribución por tipo de trámite</p>
            <div className="relative w-full" style={{ height: 240 }}>
              <canvas ref={tipoRef} role="img" aria-label="Dona de distribución por tipo de trámite"></canvas>
            </div>
          </div>

          <div className={chartCardCls}>
            <p className="text-sm font-medium mb-3">Gasto por mes</p>
            <div className="relative w-full" style={{ height: 240 }}>
              <canvas ref={mesRef} role="img" aria-label="Línea de gasto mensual"></canvas>
            </div>
          </div>
        </>
      ) : (
        <p className="text-[var(--text-muted)] text-sm">
          Aún no hay movimientos capturados — la distribución por tipo de trámite y el gasto mensual aparecerán aquí en cuanto se registren oficios.
        </p>
      )}
    </div>
  );
}
