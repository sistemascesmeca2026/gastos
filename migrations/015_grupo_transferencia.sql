ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS grupo_transferencia TEXT;
CREATE INDEX IF NOT EXISTS idx_movimientos_grupo_transferencia ON movimientos(grupo_transferencia);
