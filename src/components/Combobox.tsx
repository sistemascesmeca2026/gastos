'use client';
import { useState, useRef, useEffect } from 'react';

type Opcion = { value: string; label: string };

export default function Combobox({
  value,
  onChange,
  opciones,
  placeholder,
  disabled,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  opciones: Opcion[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
        setBusqueda('');
      }
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const seleccionada = opciones.find((o) => o.value === value);
  const filtradas = busqueda
    ? opciones.filter((o) => o.label.toLowerCase().includes(busqueda.toLowerCase()))
    : opciones;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((a) => !a)}
        className={`${className} w-full text-left flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={`truncate ${!seleccionada ? 'text-[var(--text-muted)]' : ''}`}>
          {seleccionada ? seleccionada.label : placeholder}
        </span>
        <span className="text-[var(--text-muted)] flex-shrink-0">▾</span>
      </button>

      {abierto && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl max-h-80 overflow-hidden flex flex-col">
          <input
            autoFocus
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="px-3 py-2 text-sm bg-[var(--surface-2)] border-b border-[var(--border)] outline-none text-[var(--text)]"
          />
          <div className="overflow-y-auto">
            {filtradas.length === 0 && (
              <div className="px-3 py-3 text-sm text-[var(--text-muted)]">Sin resultados</div>
            )}
            {filtradas.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setAbierto(false);
                  setBusqueda('');
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] ${
                  o.value === value ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'text-[var(--text)]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
