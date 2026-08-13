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
        COALESCE(SUM(monto) FILTER (WHERE tipo_tramite IN ('comprobacion_viaticos','reembolso') AND estado = 'pagado'), 0) AS ejercido_real,
        COALESCE(SUM(monto) FILTER (WHERE estado IN ('comprometido','solicitado')), 0) AS comprometido_real,
        COALESCE(SUM(monto) FILTER (WHERE tipo_tramite = 'retiro_institucional'), 0) AS retirado_real
    FROM movimientos
    GROUP BY partida_id
)
SELECT
    p.id AS partida_id,
    p.clave,
    p.descripcion,
    c.clave AS capitulo_clave,
    c.nombre AS capitulo_nombre,
    f.nombre AS funcion_nombre,
    f.ejercicio,
    lb.ministrado,
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
