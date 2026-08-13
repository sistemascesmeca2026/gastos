-- Corrige v_saldo_partida: ahora el cálculo se basa únicamente en el campo
-- "estado" del movimiento (siguiendo la progresión oficial Solicitado →
-- Comprometido → Devengado → Ejercido → Pagado), en vez de una combinación
-- de tipo_tramite + estado que dejaba fuera "Devengado" y "Ejercido".
--
--   Comprometido = Solicitado + Comprometido  (reservado, aún no gastado)
--   Ejercido      = Devengado + Ejercido + Pagado  (el gasto ya ocurrió)

DROP VIEW IF EXISTS v_saldo_partida;

CREATE VIEW v_saldo_partida AS
WITH ultima_linea_base AS (
    SELECT DISTINCT ON (partida_id) *
    FROM linea_base
    ORDER BY partida_id, fecha_corte DESC
),
agregados AS (
    SELECT
        partida_id,
        COALESCE(SUM(monto) FILTER (WHERE estado IN ('devengado','ejercido','pagado')), 0) AS ejercido_real,
        COALESCE(SUM(monto) FILTER (WHERE estado IN ('solicitado','comprometido')), 0) AS comprometido_real,
        COALESCE(SUM(monto) FILTER (WHERE tipo_tramite = 'retiro_institucional'), 0) AS retirado_real
    FROM movimientos
    GROUP BY partida_id
)
SELECT
    p.id AS partida_id,
    p.clave,
    p.descripcion,
    p.capitulo_id,
    c.clave AS capitulo_clave,
    c.nombre AS capitulo_nombre,
    f.id AS funcion_id,
    f.nombre AS funcion_nombre,
    f.ejercicio,
    COALESCE(lb.original, 0) AS original,
    COALESCE(lb.modificado, 0) AS modificado,
    lb.ministrado,
    COALESCE(lb.pre_compromiso, 0) AS pre_compromiso,
    COALESCE(lb.devengado, 0) AS devengado,
    COALESCE(lb.pagado, 0) AS pagado,
    COALESCE(lb.disponible, 0) AS disponible,
    COALESCE(a.retirado_real, 0) AS retirado,
    (lb.ministrado - COALESCE(a.retirado_real, 0)) AS neto,
    COALESCE(a.ejercido_real, 0) AS ejercido,
    COALESCE(a.comprometido_real, 0) AS comprometido,
    (lb.ministrado - COALESCE(a.retirado_real, 0) - COALESCE(a.ejercido_real, 0) - COALESCE(a.comprometido_real, 0)) AS por_ejercer
FROM partidas p
JOIN capitulos c ON c.id = p.capitulo_id
JOIN funciones f ON f.id = c.funcion_id
LEFT JOIN ultima_linea_base lb ON lb.partida_id = p.id
LEFT JOIN agregados a ON a.partida_id = p.id;
