'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

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
          datasets: [{ label: 'Ministrado', data: data.porFuncion.map((f) => Number(f.ministrado)), backgroundColor: '#2a78d6', borderRadius: 4 }],
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
          datasets: [{ data: tipos.map((t) => Number(t.total)), backgroundColor: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7'] }],
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
          datasets: [{ label: 'Gasto mensual', data: data.porMes.map((m) => Number(m.total)), borderColor: '#2a78d6', backgroundColor: 'rgba(42,120,214,0.1)', fill: true, tension: 0.3 }],
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

  if (!data) return <p style={{ color: '#999' }}>Cargando dashboard...</p>;

  const totalMinistrado = data.porFuncion.reduce((a, f) => a + Number(f.ministrado), 0);
  const totalEjercido = data.porFuncion.reduce((a, f) => a + Number(f.ejercido), 0);
  const tieneMovimientos = data.porTipo.some((t) => Number(t.total) > 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#999', margin: '0 0 4px' }}>Ministrado total</p>
          <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>${money(totalMinistrado)}</p>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#999', margin: '0 0 4px' }}>Ejercido total</p>
          <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>${money(totalEjercido)}</p>
        </div>
      </div>

      <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Ministrado por función</p>
      <div style={{ position: 'relative', width: '100%', height: 260, marginBottom: 32 }}>
        <canvas ref={funcRef} role="img" aria-label="Barras de recurso ministrado por función"></canvas>
      </div>

      {tieneMovimientos ? (
        <>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Distribución por tipo de trámite</p>
          <div style={{ position: 'relative', width: '100%', height: 240, marginBottom: 32 }}>
            <canvas ref={tipoRef} role="img" aria-label="Dona de distribución por tipo de trámite"></canvas>
          </div>

          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Gasto por mes</p>
          <div style={{ position: 'relative', width: '100%', height: 240 }}>
            <canvas ref={mesRef} role="img" aria-label="Línea de gasto mensual"></canvas>
          </div>
        </>
      ) : (
        <p style={{ color: '#999', fontSize: 13 }}>
          Aún no hay movimientos capturados — la distribución por tipo de trámite y el gasto mensual aparecerán aquí en cuanto se registren oficios.
        </p>
      )}
    </div>
  );
}
