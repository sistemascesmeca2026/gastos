-- Tabla para guardar el texto de "Actividad/Específico" del POA original
-- y el monto programado para julio-diciembre 2026, para mostrarlo en
-- Observaciones del informe (en vez de un mensaje genérico).
-- Solo cubre los 6 programas institucionales de Patty Ruiz (Dependencia
-- 4008000, Fondo 0121). Extraído directamente de los PDFs originales del POA.

CREATE TABLE IF NOT EXISTS actividad_pendiente (
  id SERIAL PRIMARY KEY,
  partida_id INT NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  descripcion_actividad TEXT NOT NULL,
  monto_jul_dic NUMERIC(14,2) NOT NULL,
  ejercicio INT NOT NULL DEFAULT 2026,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actividad_pendiente_partida ON actividad_pendiente(partida_id);

-- Limpia inserciones previas de este ejercicio para evitar duplicados si se re-corre
DELETE FROM actividad_pendiente WHERE ejercicio = 2026;

DO $$
DECLARE
  v_partida_id INT;
BEGIN

  -- ============ PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN ============

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='22111' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Compra de agua en garrafón para el consumo diario del personal que labora en CESMECA.', 10000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='29601' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Mantenimiento vehículos.', 10000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='21601' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Gel antibacterial, papel de baño, sanitas, cloro, jabón líquido para manos, detergente.', 15000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='26111' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Combustible para comisiones de dirección y administración a la Cd. de Tuxtla Gutiérrez.', 21580.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='26112' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Mantenimiento vehículos oficiales.', 4000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='35501' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Mantenimiento vehículos oficiales.', 5000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='37511' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Viáticos para el personal del Instituto que viaja a Tuxtla Gutiérrez para gestiones administrativas y entrega de correspondencia.', 21573.80);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='38301' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Apoyo a eventos académicos organizados por la Dirección del Instituto.', 28824.54);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='32701' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Pago anual de la página web del CESMECA.', 2500.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='39202' AND f.nombre='PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Pago de casetas a la ciudad de Tuxtla Gutiérrez por comisiones a lo largo del año.', 6000.00);
  END IF;

  -- ============ PROGRAMA DE GESTIÓN ADMINISTRATIVA ============

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='26111' AND f.nombre='PROGRAMA DE GESTIÓN ADMINISTRATIVA' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Traslados a la ciudad de Tuxtla Gutiérrez para gestiones de la Secretaría de Extensión y Vinculación.', 2905.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='31701' AND f.nombre='PROGRAMA DE GESTIÓN ADMINISTRATIVA' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Pago de licencia de Adobe Creative Cloud para LiminaR.', 26000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='37511' AND f.nombre='PROGRAMA DE GESTIÓN ADMINISTRATIVA' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Viáticos para gestiones de la Secretaría de Extensión y Vinculación a Tuxtla Gutiérrez.', 3883.28);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='32701' AND f.nombre='PROGRAMA DE GESTIÓN ADMINISTRATIVA' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Derechos de uso del nombre LiminaR y dos licencias de Adobe Creative Cloud (áreas editorial y comunicación).', 24000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='39202' AND f.nombre='PROGRAMA DE GESTIÓN ADMINISTRATIVA' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Peaje a la ciudad de Tuxtla Gutiérrez para gestiones de la Secretaría de Extensión y Vinculación.', 1000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='33401' AND f.nombre='PROGRAMA DE GESTIÓN ADMINISTRATIVA' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Capacitaciones al personal del área (LiminaR).', 5000.00);
  END IF;

  -- ============ PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO ============

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='37511' AND f.nombre='PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Viáticos: Congreso Red Estudios de la Democracia, congreso antropología social sureste México, trabajo de investigación ciudades creativas.', 17105.83);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='37111' AND f.nombre='PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Pasajes aéreos: mismos eventos (Congreso Red Democracia, antropología social, ciudades creativas).', 9894.17);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='38301' AND f.nombre='PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Cátedra José Martí (IASPM-AL), Jornada LAUD, Congreso violencia feminicida, XVII Congreso IASPM-AL.', 86000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='33603' AND f.nombre='PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Impresión de libros: Sociedad y democracia en Chiapas hoy; activismo feminista; Memoria y testimonio.', 36000.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='33111' AND f.nombre='PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Revisión de estilo de libro y traducción de artículo al inglés.', 13954.91);
  END IF;

  -- ============ PROGRAMA DE EXCELENCIA EDUCATIVA ============

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='37511' AND f.nombre='PROGRAMA DE EXCELENCIA EDUCATIVA' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Viajes a Tuxtla Gutiérrez para reuniones de trabajo.', 2038.72);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='37211' AND f.nombre='PROGRAMA DE EXCELENCIA EDUCATIVA' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Viajes a Tuxtla Gutiérrez para reuniones de trabajo.', 900.00);
  END IF;

  SELECT p.id INTO v_partida_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave='33603' AND f.nombre='PROGRAMA DE EXCELENCIA EDUCATIVA' AND f.dependencia='4008000' AND f.ejercicio=2026;
  IF v_partida_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES
    (v_partida_id, 'Libro impreso LGAC ODEMCA.', 60000.00);
  END IF;

END $$;

-- Verificación: total insertado
SELECT COUNT(*) AS filas_insertadas, SUM(monto_jul_dic) AS total FROM actividad_pendiente WHERE ejercicio = 2026;
