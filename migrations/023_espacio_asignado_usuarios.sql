-- Agrega la columna espacio_asignado: cuando tiene valor ('ruiz' o
-- 'ballinas'), ese usuario solo ve y captura en ese espacio al iniciar
-- sesión (el selector se oculta). Si es NULL (ej. el admin rhoover),
-- sigue viendo ambos espacios y puede alternar libremente.
-- No borra ni modifica ningún otro dato.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS espacio_asignado TEXT;

UPDATE usuarios SET espacio_asignado = 'ruiz' WHERE username = 'pruiz';
UPDATE usuarios SET espacio_asignado = 'ballinas' WHERE username = 'pballinas';

-- Verificación
SELECT username, nombre, es_admin, espacio_asignado FROM usuarios ORDER BY username;
