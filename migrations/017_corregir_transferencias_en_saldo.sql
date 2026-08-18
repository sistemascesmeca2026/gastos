-- Corrige un error real de cálculo: las transferencias de ENTRADA se estaban
-- contando como "Ejercido" (gasto), restando dos veces el mismo dinero cuando
-- una partida recibía una transferencia. Ahora la entrada suma al disponible
-- (como el Ministrado), y solo la salida se sigue contando como movimiento
-- de recurso (ya que el dinero efectivamente deja esa partida).
--
-- No modifica ningún dato en movimientos ni linea_base — solo corrige
-- la fórmula de la vista v_saldo_partida.

CREATE OR REPLACE VIEW v_saldo_partida AS
 WITH ultima_linea_base AS (
         SELECT DISTINCT ON (linea_base.partida_id) linea_base.id,
            linea_base.partida_id,
            linea_base.fecha_corte,
            linea_base.original,
            linea_base.modificado,
            linea_base.ministrado,
            linea_base.pre_compromiso,
            linea_base.comprometido,
            linea_base.devengado,
            linea_base.ejercido,
            linea_base.pagado,
            linea_base.por_ejercer,
            linea_base.disponible,
            linea_base.creado_en
           FROM linea_base
          ORDER BY linea_base.partida_id, linea_base.fecha_corte DESC
        ), agregados AS (
         SELECT movimientos.partida_id,
            COALESCE(sum(movimientos.monto) FILTER (
              WHERE movimientos.estado = ANY (ARRAY['devengado'::estado_movimiento, 'ejercido'::estado_movimiento, 'pagado'::estado_movimiento])
              AND movimientos.tipo_tramite <> 'transferencia_entrada'::tipo_tramite
            ), 0::numeric) AS ejercido_real,
            COALESCE(sum(movimientos.monto) FILTER (
              WHERE movimientos.estado = ANY (ARRAY['solicitado'::estado_movimiento, 'comprometido'::estado_movimiento])
              AND movimientos.tipo_tramite <> 'transferencia_entrada'::tipo_tramite
            ), 0::numeric) AS comprometido_real,
            COALESCE(sum(movimientos.monto) FILTER (WHERE movimientos.tipo_tramite = 'retiro_institucional'::tipo_tramite), 0::numeric) AS retirado_real,
            COALESCE(sum(movimientos.monto) FILTER (WHERE movimientos.tipo_tramite = 'transferencia_entrada'::tipo_tramite), 0::numeric) AS transferido_entrada_real
           FROM movimientos
          GROUP BY movimientos.partida_id
        )
 SELECT p.id AS partida_id,
    p.clave,
    p.descripcion,
    p.capitulo_id,
    c.clave AS capitulo_clave,
    c.nombre AS capitulo_nombre,
    f.id AS funcion_id,
    f.nombre AS funcion_nombre,
    f.ejercicio,
    lb.fecha_corte,
    COALESCE(lb.original, 0::numeric) AS original,
    COALESCE(lb.modificado, 0::numeric) AS modificado,
    lb.ministrado,
    COALESCE(lb.pre_compromiso, 0::numeric) AS pre_compromiso,
    COALESCE(lb.devengado, 0::numeric) AS devengado,
    COALESCE(lb.pagado, 0::numeric) AS pagado,
    COALESCE(lb.disponible, 0::numeric) AS disponible,
    COALESCE(a.retirado_real, 0::numeric) AS retirado,
    lb.ministrado + COALESCE(a.transferido_entrada_real, 0::numeric) - COALESCE(a.retirado_real, 0::numeric) AS neto,
    COALESCE(a.ejercido_real, 0::numeric) AS ejercido,
    COALESCE(a.comprometido_real, 0::numeric) AS comprometido,
    lb.ministrado + COALESCE(a.transferido_entrada_real, 0::numeric) - COALESCE(a.retirado_real, 0::numeric) - COALESCE(a.ejercido_real, 0::numeric) - COALESCE(a.comprometido_real, 0::numeric) AS por_ejercer
   FROM partidas p
     JOIN capitulos c ON c.id = p.capitulo_id
     JOIN funciones f ON f.id = c.funcion_id
     LEFT JOIN ultima_linea_base lb ON lb.partida_id = p.id
     LEFT JOIN agregados a ON a.partida_id = p.id;
