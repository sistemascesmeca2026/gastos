-- Subtotales oficiales (columna Ministrado) tomados del PDF
-- "Estado presupuestal del 27 de marzo 2026" — para activar el
-- semáforo de comparación en la pestaña Concentrado oficial.

-- Subtotales por FUNCIÓN
UPDATE funciones SET subtotal_oficial = 5000.00     WHERE clave = '2.06.PRDI101.PYI001'  AND ejercicio = 2026;
UPDATE funciones SET subtotal_oficial = 172301.07   WHERE clave = '2.06.PRDI1029.PYI029' AND ejercicio = 2026;
UPDATE funciones SET subtotal_oficial = 30970.82    WHERE clave = '2.06.PRDI1034.PYI034' AND ejercicio = 2026;
UPDATE funciones SET subtotal_oficial = 0.00        WHERE clave = '2.06.PRDI202.PYI002'  AND ejercicio = 2026;
UPDATE funciones SET subtotal_oficial = 0.00        WHERE clave = '2.06.PRDI506.PYI006'  AND ejercicio = 2026;
UPDATE funciones SET subtotal_oficial = 9000.00     WHERE clave = '2.06.PRDI614.PYI014'  AND ejercicio = 2026;

-- Subtotales por CAPÍTULO (dentro de cada función)
UPDATE capitulos c SET subtotal_oficial = 5000.00
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI101.PYI001' AND f.ejercicio = 2026 AND c.clave = '3000';

UPDATE capitulos c SET subtotal_oficial = 168065.00
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI1029.PYI029' AND f.ejercicio = 2026 AND c.clave = '2000';
UPDATE capitulos c SET subtotal_oficial = 4236.07
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI1029.PYI029' AND f.ejercicio = 2026 AND c.clave = '3000';

UPDATE capitulos c SET subtotal_oficial = 0.00
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI1034.PYI034' AND f.ejercicio = 2026 AND c.clave = '2000';
UPDATE capitulos c SET subtotal_oficial = 30970.82
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI1034.PYI034' AND f.ejercicio = 2026 AND c.clave = '3000';

UPDATE capitulos c SET subtotal_oficial = 0.00
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI202.PYI002' AND f.ejercicio = 2026 AND c.clave = '3000';

UPDATE capitulos c SET subtotal_oficial = 0.00
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI506.PYI006' AND f.ejercicio = 2026 AND c.clave = '2000';
UPDATE capitulos c SET subtotal_oficial = 0.00
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI506.PYI006' AND f.ejercicio = 2026 AND c.clave = '3000';

UPDATE capitulos c SET subtotal_oficial = 0.00
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI614.PYI014' AND f.ejercicio = 2026 AND c.clave = '2000';
UPDATE capitulos c SET subtotal_oficial = 9000.00
FROM funciones f WHERE c.funcion_id = f.id AND f.clave = '2.06.PRDI614.PYI014' AND f.ejercicio = 2026 AND c.clave = '3000';
