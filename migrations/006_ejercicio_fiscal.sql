-- Agrega el concepto de "ejercicio fiscal" (año) a las funciones/programas,
-- para que el POA de cada año viva separado sin mezclarse ni pisarse.
-- Las funciones existentes (cargadas del PDF de marzo 2026) se marcan como 2026.

ALTER TABLE funciones ADD COLUMN IF NOT EXISTS ejercicio INTEGER NOT NULL DEFAULT 2026;

-- La clave de función ya no es única globalmente, sino única por ejercicio
-- (así el mismo número de programa puede repetirse en años distintos).
ALTER TABLE funciones DROP CONSTRAINT IF EXISTS funciones_clave_key;
ALTER TABLE funciones ADD CONSTRAINT funciones_clave_ejercicio_key UNIQUE (clave, ejercicio);

CREATE INDEX IF NOT EXISTS idx_funciones_ejercicio ON funciones(ejercicio);
