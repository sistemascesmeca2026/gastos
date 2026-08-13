ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS creado_por_id INTEGER REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS actualizado_por_id INTEGER REFERENCES usuarios(id);
