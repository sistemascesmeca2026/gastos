-- Alta de catálogo: 4 posgrados (Fondo 0121) + Ingresos Propios (Fondo 0130)
-- Patty Ballinas. Capítulo 1000 excluido en todos los casos.
-- fecha_corte usada: 2026-08-19 (fecha de captura de este catálogo, ya que
-- los documentos fuente no traen una fecha de corte explícita como los
-- del POA anual). Ajustar si Patty Ballinas confirma otra fecha de corte real.
-- No modifica ningún dato existente de Patty Ruiz.

DO $$
DECLARE
  v_funcion_id INT;
  v_capitulo_id INT;
  v_partida_id INT;
  v_fecha DATE := '2026-08-19';
BEGIN

  -- ============ FONDO 0121 — DCSH (4052050) ============

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('1.07.PRDI1030.PYI030', 'PROGRAMA DE PLANEACIÓN Y EVALUACIÓN INSTITUCIONAL', '4052050', '0121', 'SUBSIDIO FEDERAL (APOYO SOLIDARIO)', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '3000', 'SERVICIOS GENERALES') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '38301', 'CONGRESOS Y CONVENCIONES') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 7800.00, 7800.00, 7800.00);

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('1.07.PRDI506.PYI006', 'PROGRAMA DE EXCELENCIA EDUCATIVA', '4052050', '0121', 'SUBSIDIO FEDERAL (APOYO SOLIDARIO)', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '2000', 'MATERIALES Y SUMINISTROS') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '26111', 'COMBUSTIBLES') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 21580.00, 21580.00, 21580.00);
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '3000', 'SERVICIOS GENERALES') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '37511', 'VIÁTICOS NACIONALES') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 6472.14, 6472.14, 6472.14);
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '39202', 'OTROS IMPUESTOS Y DERECHOS') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 1647.86, 1647.86, 1647.86);

  -- ============ FONDO 0121 — DEIF (4051990) ============

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('1.07.PRDI506.PYI006-DEIF', 'PROGRAMA DE EXCELENCIA EDUCATIVA', '4051990', '0121', 'SUBSIDIO FEDERAL (APOYO SOLIDARIO)', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '2000', 'MATERIALES Y SUMINISTROS') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '26111', 'COMBUSTIBLES') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 7470.00, 7470.00, 7470.00);
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '3000', 'SERVICIOS GENERALES') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '35201', 'MANTENIMIENTO Y CONSERVACIÓN DE MOBILIARIO Y EQUIPO DE ADMINISTRACIÓN') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 30030.00, 30030.00, 30030.00);

  -- ============ FONDO 0121 — MCSH (4008010) ============

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('1.06.PRDI1030.PYI030', 'PROGRAMA DE PLANEACIÓN Y EVALUACIÓN INSTITUCIONAL', '4008010', '0121', 'SUBSIDIO FEDERAL (APOYO SOLIDARIO)', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '3000', 'SERVICIOS GENERALES') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '38301', 'CONGRESOS Y CONVENCIONES') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 0.00, 6000.00, 3000.00);

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('1.06.PRDI506.PYI006', 'PROGRAMA DE EXCELENCIA EDUCATIVA', '4008010', '0121', 'SUBSIDIO FEDERAL (APOYO SOLIDARIO)', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '2000', 'MATERIALES Y SUMINISTROS') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '26111', 'COMBUSTIBLES') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 0.00, 11620.00, 4980.00);
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '3000', 'SERVICIOS GENERALES') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '37511', 'VIÁTICOS NACIONALES') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 0.00, 14022.97, 6472.14);
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '39202', 'OTROS IMPUESTOS Y DERECHOS') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 0.00, 5857.03, 2000.00);

  -- ============ FONDO 0121 — MEIF (4008020) ============

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('1.06.PRDI101.PYI001', 'PROGRAMA DE IGUALDAD SUSTANTIVA Y EQUIDAD DE GÉNERO', '4008020', '0121', 'SUBSIDIO FEDERAL (APOYO SOLIDARIO)', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '2000', 'MATERIALES Y SUMINISTROS') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '22111', 'PRODUCTOS ALIMENTICIOS PARA PERSONAS') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 3000.00, 3000.00, 0.00);

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('1.06.PRDI303.PYI003', 'PROGRAMA PARA EL DIÁLOGO Y LA RIQUEZA INTERCULTURAL', '4008020', '0121', 'SUBSIDIO FEDERAL (APOYO SOLIDARIO)', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '3000', 'SERVICIOS GENERALES') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '37211', 'PASAJES NACIONALES TERRESTRES') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado, pre_compromiso) VALUES (v_partida_id, v_fecha, 1000.00, 1000.00, 1000.00, 922.00);

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('1.06.PRDI505.PYI005', 'PROGRAMA DE FORMACIÓN Y BIENESTAR INTEGRAL ESTUDIANTIL', '4008020', '0121', 'SUBSIDIO FEDERAL (APOYO SOLIDARIO)', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '2000', 'MATERIALES Y SUMINISTROS') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '21601', 'MATERIAL DE LIMPIEZA') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 5000.00, 5000.00, 0.00);

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('1.06.PRDI508.PYI008', 'PROGRAMA DE FORMACIÓN Y ACTUALIZACIÓN DOCENTE', '4008020', '0121', 'SUBSIDIO FEDERAL (APOYO SOLIDARIO)', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '2000', 'MATERIALES Y SUMINISTROS') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '21401', 'MATERIALES Y ÚTILES CONSUMIBLES PARA EL PROCESAMIENTO EN EQUIPO Y BIENES INFORMÁTICOS') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 28500.00, 28500.00, 0.00);

  -- ============ FONDO 0130 — INGRESOS PROPIOS — CESMECA (4008000) ============

  INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
  VALUES ('5.01.PRDI1155.PYI055', 'PROGRAMA PARA FORTALECER LA GESTIÓN ADMINISTRATIVA DE LAS UNIDADES ACADÉMICAS Y ADMINISTRATIVAS', '4008000', '0130', 'INGRESOS PROPIOS', 2026)
  ON CONFLICT (clave, ejercicio) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id INTO v_funcion_id;
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '2000', 'MATERIALES Y SUMINISTROS') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '29401', 'REFACCIONES Y ACCESORIOS PARA EQUIPO DE CÓMPUTO Y TELECOMUNICACIONES') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 0.00, 6186.28, 6186.28);
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '25401', 'MATERIALES, ACCESORIOS Y SUMINISTROS MÉDICOS') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 0.00, 55090.04, 55090.04);
  INSERT INTO capitulos (funcion_id, clave, nombre) VALUES (v_funcion_id, '5000', 'BIENES MUEBLES E INMUEBLES') RETURNING id INTO v_capitulo_id;
  INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES (v_capitulo_id, '51501', 'BIENES INFORMÁTICOS') RETURNING id INTO v_partida_id;
  INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado) VALUES (v_partida_id, v_fecha, 0.00, 88064.88, 88064.88);

END $$;

-- Verificación final: totales por dependencia y fondo
SELECT f.dependencia, f.fondo, f.fondo_nombre, SUM(lb.modificado) AS total_modificado, SUM(lb.ministrado) AS total_ministrado
FROM linea_base lb
JOIN partidas p ON p.id = lb.partida_id
JOIN capitulos c ON c.id = p.capitulo_id
JOIN funciones f ON f.id = c.funcion_id
WHERE lb.fecha_corte = '2026-08-19'
GROUP BY f.dependencia, f.fondo, f.fondo_nombre
ORDER BY f.dependencia;
