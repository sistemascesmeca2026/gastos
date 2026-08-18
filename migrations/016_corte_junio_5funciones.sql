-- Corte oficial "Estado Presupuestal General del ejercicio 2026" (04-06-2026)
-- Cubre las 5 funciones que aún no tenían corte posterior a marzo.
-- Excelencia Educativa se omite: ya tiene el corte de junio cargado
-- previamente con los mismos valores (verificado que coinciden).

-- 1. Crear las 2 partidas nuevas que aparecen por reclasificación en este corte
INSERT INTO partidas (capitulo_id, clave, descripcion)
SELECT c.id, '37211', 'PASAJES NACIONALES TERRESTRES'
FROM capitulos c JOIN funciones f ON f.id = c.funcion_id
WHERE f.clave = '2.06.PRDI1034.PYI034' AND f.ejercicio = 2026 AND c.clave = '3000'
  AND NOT EXISTS (SELECT 1 FROM partidas p WHERE p.capitulo_id = c.id AND p.clave = '37211');

INSERT INTO partidas (capitulo_id, clave, descripcion)
SELECT c.id, '26111', 'COMBUSTIBLES'
FROM capitulos c JOIN funciones f ON f.id = c.funcion_id
WHERE f.clave = '2.06.PRDI614.PYI014' AND f.ejercicio = 2026 AND c.clave = '2000'
  AND NOT EXISTS (SELECT 1 FROM partidas p WHERE p.capitulo_id = c.id AND p.clave = '26111');

-- 2. Insertar el snapshot de junio (04-06-2026) para cada partida
INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado, pre_compromiso, comprometido, devengado, ejercido, pagado, por_ejercer, disponible)
SELECT p.id, '2026-06-04', v.original, v.modificado, v.ministrado, v.pre_compromiso, v.comprometido, v.devengado, v.ejercido, v.pagado, v.por_ejercer, v.disponible
FROM (VALUES
  -- Igualdad de Género (3000)
  ('2.06.PRDI101.PYI001','3000','38301', 5000.00, 5000.00, 5000.00, 5000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),

  -- Infraestructura (2000)
  ('2.06.PRDI1029.PYI029','2000','29101', 4745.00, 4745.00, 4745.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4745.00, 4745.00),
  ('2.06.PRDI1029.PYI029','2000','26111', 40255.00, 45255.00, 23675.00, 9520.74, 0.00, 0.00, 0.00, 11094.04, 24640.22, 3060.22),
  ('2.06.PRDI1029.PYI029','2000','29401', 15000.00, 15000.00, 15000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15000.00, 15000.00),
  ('2.06.PRDI1029.PYI029','2000','21101', 18000.00, 18000.00, 18000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 18000.00, 18000.00),
  ('2.06.PRDI1029.PYI029','2000','29301', 2000.00, 2000.00, 2000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2000.00, 2000.00),
  ('2.06.PRDI1029.PYI029','2000','26112', 8000.00, 8000.00, 4000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8000.00, 4000.00),
  ('2.06.PRDI1029.PYI029','2000','24601', 8000.00, 8000.00, 8000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8000.00, 8000.00),
  ('2.06.PRDI1029.PYI029','2000','22111', 20000.00, 20000.00, 10000.00, 0.00, 4988.00, 0.00, 0.00, 0.00, 15012.00, 5012.00),
  ('2.06.PRDI1029.PYI029','2000','29601', 20000.00, 20000.00, 10000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 20000.00, 10000.00),
  ('2.06.PRDI1029.PYI029','2000','21401', 30000.00, 30000.00, 30000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 30000.00, 30000.00),
  ('2.06.PRDI1029.PYI029','2000','24901', 140000.00, 135000.00, 135000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 135000.00, 135000.00),
  ('2.06.PRDI1029.PYI029','2000','21601', 50000.00, 50000.00, 35000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 50000.00, 35000.00),
  -- Infraestructura (3000)
  ('2.06.PRDI1029.PYI029','3000','32701', 24500.00, 24500.00, 22000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 24500.00, 22000.00),
  ('2.06.PRDI1029.PYI029','3000','38301', 28824.54, 30824.54, 2000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 30824.54, 2000.00),
  ('2.06.PRDI1029.PYI029','3000','35501', 10000.00, 10000.00, 5000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10000.00, 5000.00),
  ('2.06.PRDI1029.PYI029','3000','39202', 10000.00, 13000.00, 7000.00, 2665.00, 95.00, 0.00, 0.00, 2505.00, 7735.00, 1735.00),
  ('2.06.PRDI1029.PYI029','3000','37511', 36675.46, 31675.46, 10101.66, 4286.90, 1230.00, 0.00, 0.00, 2070.00, 24088.56, 2514.76),

  -- Gestión Administrativa (2000)
  ('2.06.PRDI1034.PYI034','2000','21101', 1000.00, 1000.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1000.00, 1000.00),
  ('2.06.PRDI1034.PYI034','2000','21401', 5600.00, 5600.00, 5600.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5600.00, 5600.00),
  ('2.06.PRDI1034.PYI034','2000','26111', 4980.00, 4980.00, 2075.00, 0.00, 0.00, 0.00, 0.00, 700.00, 4280.00, 1375.00),
  -- Gestión Administrativa (3000)
  ('2.06.PRDI1034.PYI034','3000','31701', 26000.00, 26000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 26000.00, 0.00),
  ('2.06.PRDI1034.PYI034','3000','37511', 7009.32, 6209.32, 2326.04, 0.00, 0.00, 0.00, 0.00, 450.00, 5759.32, 1876.04),
  ('2.06.PRDI1034.PYI034','3000','39202', 1510.68, 1510.68, 510.68, 0.00, 0.00, 0.00, 0.00, 105.00, 1405.68, 405.68),
  ('2.06.PRDI1034.PYI034','3000','32701', 67000.00, 67000.00, 43000.00, 13987.21, 10659.24, 0.00, 0.00, 18353.55, 24000.00, 0.00),
  ('2.06.PRDI1034.PYI034','3000','33401', 26900.00, 26900.00, 21900.00, 0.00, 0.00, 0.00, 0.00, 0.00, 26900.00, 21900.00),
  ('2.06.PRDI1034.PYI034','3000','33603', 125000.00, 125000.00, 125000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 125000.00, 125000.00),
  ('2.06.PRDI1034.PYI034','3000','37211', 0.00, 800.00, 800.00, 0.00, 0.00, 0.00, 0.00, 0.00, 800.00, 800.00),

  -- Cultura de Paz (3000)
  ('2.06.PRDI202.PYI002','3000','38301', 25000.00, 25000.00, 25000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 25000.00, 25000.00),

  -- Investigación y Posgrado (2000)
  ('2.06.PRDI614.PYI014','2000','21401', 1500.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
  ('2.06.PRDI614.PYI014','2000','26111', 0.00, 1500.00, 1500.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1500.00, 1500.00),
  -- Investigación y Posgrado (3000)
  ('2.06.PRDI614.PYI014','3000','37511', 36737.95, 36737.95, 19632.12, 6321.60, 0.00, 0.00, 0.00, 0.00, 30416.35, 13310.52),
  ('2.06.PRDI614.PYI014','3000','37211', 1000.00, 1000.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1000.00, 1000.00),
  ('2.06.PRDI614.PYI014','3000','37111', 19807.13, 19807.13, 9912.96, 6598.51, 0.00, 0.00, 0.00, 0.00, 13208.62, 3314.45),
  ('2.06.PRDI614.PYI014','3000','38301', 86000.00, 86000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 86000.00, 0.00),
  ('2.06.PRDI614.PYI014','3000','33111', 30954.91, 30954.91, 17000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 30954.91, 17000.00),
  ('2.06.PRDI614.PYI014','3000','33603', 63000.00, 63000.00, 27000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 63000.00, 27000.00)
) AS v(funcion_clave, capitulo_clave, partida_clave, original, modificado, ministrado, pre_compromiso, comprometido, devengado, ejercido, pagado, por_ejercer, disponible)
JOIN funciones f ON f.clave = v.funcion_clave AND f.ejercicio = 2026
JOIN capitulos c ON c.funcion_id = f.id AND c.clave = v.capitulo_clave
JOIN partidas p ON p.capitulo_id = c.id AND p.clave = v.partida_clave;

-- Verificación: el total ministrado de este corte para estas 5 funciones
-- (sin contar Excelencia Educativa) debe sumar $649,778.46
--   SELECT SUM(ministrado) FROM linea_base WHERE fecha_corte = '2026-06-04';
