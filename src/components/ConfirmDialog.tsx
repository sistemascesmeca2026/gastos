'use client';

export default function ConfirmDialog({
  titulo,
  mensaje,
  textoConfirmar = 'Eliminar',
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onCancelar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-rose-500/40 bg-[var(--surface)] p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h2 className="text-sm font-semibold">{titulo}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">{mensaje}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onCancelar}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="rounded-lg bg-rose-600 hover:bg-rose-500 transition px-4 py-2 text-sm font-medium text-white"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
