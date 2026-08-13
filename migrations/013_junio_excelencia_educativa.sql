-- Actualiza la línea base del Programa de Excelencia Educativa (2026) con el
-- corte oficial de junio 2026 (Expediente técnico CID junio 2026), que ya
-- refleja recurso realmente ministrado. La vista v_saldo_partida toma
-- automáticamente el snapshot más reciente por fecha_corte, así que no se
-- borra el de marzo, solo se agrega uno nuevo que lo sustituye en los cálculos.

-- 1. Agregar la partida nueva que aparece en el corte de junio (reclasificación
--    de 21701 Materiales didácticos → 21506 Material para el desarrollo de la información)
INSERT INTO partidas (capitulo_id, clave, descripcion)
SELECT c.id, '21506', 'MATERIAL PARA EL DESARROLLO DE LA INFORMACIÓN'
FROM capitulos c
JOIN funciones f ON f.id = c.funcion_id
WHERE f.clave = '2.06.PRDI506.PYI006' AND f.ejercicio = 2026 AND c.clave = '2000'
  AND NOT EXISTS (
    SELECT 1 FROM partidas p WHERE p.capitulo_id = c.id AND p.clave = '21506'
  );

-- 2. Insertar el snapshot de junio 2026 para cada partida de Excelencia Educativa
INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado, pre_compromiso, comprometido, devengado, ejercido, pagado, por_ejercer, disponible)
SELECT p.id, '2026-06-30', v.original, v.modificado, v.ministrado, v.pre_compromiso, v.comprometido, v.devengado, v.ejercido, v.pagado, v.por_ejercer, v.disponible
FROM (VALUES
  -- Capítulo 2000
  ('2000','21601', 700.00, 700.00, 700.00, 0.00, 0.00, 0.00, 0.00, 0.00, 700.00, 700.00),
  ('2000','24601', 1200.00, 1200.00, 1200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1200.00, 1200.00),
  ('2000','21506', 0.00, 9500.00, 9500.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9500.00, 9500.00),
  ('2000','25301', 700.00, 700.00, 700.00, 0.00, 0.00, 0.00, 0.00, 0.00, 700.00, 700.00),
  ('2000','21101', 1300.00, 1300.00, 1300.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1300.00, 1300.00),
  ('2000','21701', 9500.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
  -- Capítulo 3000
  ('3000','37511', 4174.53, 4174.53, 2135.81, 0.00, 300.00, 0.00, 0.00, 300.00, 3574.53, 1535.81),
  ('3000','38301', 20000.00, 20000.00, 20000.00, 10000.00, 3500.00, 0.00, 0.00, 0.00, 6500.00, 6500.00),
  ('3000','31801', 1075.47, 1075.47, 1075.47, 0.00, 550.00, 0.00, 0.00, 0.00, 525.47, 525.47),
  ('3000','33603', 60000.00, 60000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 60000.00, 0.00),
  ('3000','37211', 1350.00, 1350.00, 450.00, 0.00, 140.00, 0.00, 0.00, 140.00, 1070.00, 170.00)
) AS v(capitulo_clave, partida_clave, original, modificado, ministrado, pre_compromiso, comprometido, devengado, ejercido, pagado, por_ejercer, disponible)
JOIN funciones f ON f.clave = '2.06.PRDI506.PYI006' AND f.ejercicio = 2026
JOIN capitulos c ON c.funcion_id = f.id AND c.clave = v.capitulo_clave
JOIN partidas p ON p.capitulo_id = c.id AND p.clave = v.partida_clave;
