-- Reemplaza el contenido de actividad_pendiente: ahora cubre TODAS las
-- partidas de los 6 programas (no solo las programadas jul-dic), porque
-- Patty Ruiz aclaró que el texto debe "arrastrarse" en Observaciones
-- mientras la partida tenga Por ejercer > 0, sin importar en qué mes
-- del POA estaba originalmente programada. Solo deja de aparecer cuando
-- se captura un Retiro institucional sobre esa partida.

DELETE FROM actividad_pendiente WHERE ejercicio = 2026;

CREATE OR REPLACE FUNCTION tmp_agregar_actividad(p_clave TEXT, p_funcion TEXT, p_desc TEXT) RETURNS void AS $func$
DECLARE
  v_id INT;
BEGIN
  SELECT p.id INTO v_id FROM partidas p JOIN capitulos c ON c.id=p.capitulo_id JOIN funciones f ON f.id=c.funcion_id
    WHERE p.clave = p_clave AND f.nombre = p_funcion AND f.dependencia = '4008000' AND f.ejercicio = 2026;
  IF v_id IS NOT NULL THEN
    INSERT INTO actividad_pendiente (partida_id, descripcion_actividad, monto_jul_dic) VALUES (v_id, p_desc, 0);
  END IF;
END;
$func$ LANGUAGE plpgsql;

SELECT tmp_agregar_actividad('21101', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Compra de material de papelería (hojas, plumas, libretas, folders, recopiladores, cd''s, resistol, plumones, marca textos, post it, sobres, etc.)');
SELECT tmp_agregar_actividad('21401', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Compra de tóner para impresoras de Dirección, secretaría académica, administración y recepción.');
SELECT tmp_agregar_actividad('22111', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Compra de agua en garrafón para el consumo diario del personal.');
SELECT tmp_agregar_actividad('29101', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Adquisición de herramientas y refacciones para mantenimiento de instalaciones.');
SELECT tmp_agregar_actividad('29301', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Adquisición de refacciones para mantenimiento de fotocopiadoras.');
SELECT tmp_agregar_actividad('29401', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Adquisición de discos sólidos para equipos de cómputo del personal administrativo.');
SELECT tmp_agregar_actividad('29601', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Mantenimiento vehículos.');
SELECT tmp_agregar_actividad('21601', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Gel antibacterial, papel de baño, sanitas, cloro, jabón líquido para manos, detergente.');
SELECT tmp_agregar_actividad('24601', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Compra de cables, lámparas, cinta eléctrica, focos y extensiones.');
SELECT tmp_agregar_actividad('24901', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Adquisición de impermeabilizantes y pintura para interiores y exteriores del Instituto.');
SELECT tmp_agregar_actividad('26111', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Combustible para comisiones de dirección y administración a Tuxtla Gutiérrez.');
SELECT tmp_agregar_actividad('26112', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Mantenimiento vehículos oficiales.');
SELECT tmp_agregar_actividad('35501', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Mantenimiento vehículos oficiales.');
SELECT tmp_agregar_actividad('37511', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Viáticos para personal que viaja a Tuxtla Gutiérrez para gestiones administrativas y entrega de correspondencia.');
SELECT tmp_agregar_actividad('38301', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Apoyo a eventos académicos organizados por la Dirección del Instituto.');
SELECT tmp_agregar_actividad('32701', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Membresías CLACSO y COMECSO, y pago de la página web del CESMECA.');
SELECT tmp_agregar_actividad('39202', 'PROGRAMA DE INFRAESTRUCTURA, EQUIPAMIENTO, MANTENIMIENTO Y CONSERVACIÓN', 'Pago de casetas a Tuxtla Gutiérrez por comisiones.');
SELECT tmp_agregar_actividad('38301', 'PROGRAMA PARA LA CONSTRUCCIÓN DE LA CULTURA DE PAZ Y LA INCLUSIÓN', 'Segunda edición de la NO Escuela Feminista de Chiapas (transportes, coffee break, alimentación, hospedaje, carteles). Cátedra Mercedes Olivera.');
SELECT tmp_agregar_actividad('38301', 'PROGRAMA DE IGUALDAD SUSTANTIVA Y EQUIDAD DE GÉNERO', 'Apoyo a eventos académicos organizados por el programa de género.');
SELECT tmp_agregar_actividad('21101', 'PROGRAMA DE GESTIÓN ADMINISTRATIVA', 'Adquisición de material de oficina (LiminaR).');
SELECT tmp_agregar_actividad('21401', 'PROGRAMA DE GESTIÓN ADMINISTRATIVA', 'Sandisk para video del área de comunicación y tóner para impresoras de Coordinación editorial y Comunicación.');
SELECT tmp_agregar_actividad('26111', 'PROGRAMA DE GESTIÓN ADMINISTRATIVA', 'Traslados a Tuxtla Gutiérrez para gestiones de la Secretaría de Extensión y Vinculación.');
SELECT tmp_agregar_actividad('31701', 'PROGRAMA DE GESTIÓN ADMINISTRATIVA', 'Pago de licencia de Adobe Creative Cloud para LiminaR.');
SELECT tmp_agregar_actividad('37511', 'PROGRAMA DE GESTIÓN ADMINISTRATIVA', 'Viáticos para gestiones de la Secretaría de Extensión y Vinculación a Tuxtla Gutiérrez.');
SELECT tmp_agregar_actividad('33603', 'PROGRAMA DE GESTIÓN ADMINISTRATIVA', 'Libros impresos de las LGAC.');
SELECT tmp_agregar_actividad('32701', 'PROGRAMA DE GESTIÓN ADMINISTRATIVA', 'Membresía Crossref, software Copyleaks, StreamYard, derechos del nombre LiminaR, licencias Adobe Creative Cloud (editorial, comunicación, LiminaR).');
SELECT tmp_agregar_actividad('39202', 'PROGRAMA DE GESTIÓN ADMINISTRATIVA', 'Peaje a Tuxtla Gutiérrez para gestiones de la Secretaría de Extensión y Vinculación.');
SELECT tmp_agregar_actividad('33401', 'PROGRAMA DE GESTIÓN ADMINISTRATIVA', 'Capacitaciones al personal del área (LiminaR).');
SELECT tmp_agregar_actividad('21401', 'PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO', 'Tóner Brother TN820 para impresión (Dr. Armando Méndez Zárate).');
SELECT tmp_agregar_actividad('37511', 'PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO', 'Viáticos: congresos de musicología, antropología social, estudios de la democracia, consulta de archivo, investigación ciudades creativas, trabajo de campo.');
SELECT tmp_agregar_actividad('37211', 'PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO', 'Transportes terrestres para trabajo de campo de investigación.');
SELECT tmp_agregar_actividad('37111', 'PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO', 'Pasajes aéreos: congresos y trabajos de investigación.');
SELECT tmp_agregar_actividad('38301', 'PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO', 'Conferencista IASPM-AL, Jornada LAUD, Congreso violencia feminicida, XVII Congreso IASPM-AL.');
SELECT tmp_agregar_actividad('33603', 'PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO', 'Impresión de libros: Sociedad y democracia en Chiapas hoy; Numinosas ondas obscuras; activismo feminista; Memoria y testimonio.');
SELECT tmp_agregar_actividad('33111', 'PROGRAMA DE FINANCIAMIENTO PARA LA INVESTIGACIÓN Y EL POSGRADO', 'Diagramación, revisión de estilo y traducción de artículos/libros.');
SELECT tmp_agregar_actividad('21101', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'Compra de material de papelería y oficina para el Centro de Información y Documentación (CID).');
SELECT tmp_agregar_actividad('21701', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'Adquisición de libros especializados para el acervo del CID.');
SELECT tmp_agregar_actividad('21601', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'Papel higiénico, jabón, gel antibacterial, sanitas para el CID.');
SELECT tmp_agregar_actividad('24601', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'Material para instalaciones eléctricas en la oficina del CID.');
SELECT tmp_agregar_actividad('25301', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'Medicamentos para el botiquín del CID.');
SELECT tmp_agregar_actividad('31801', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'Envío de libros a instituciones nacionales con convenio.');
SELECT tmp_agregar_actividad('37511', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'Viajes a Tuxtla Gutiérrez para reuniones de trabajo.');
SELECT tmp_agregar_actividad('37211', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'Viajes a Tuxtla Gutiérrez para reuniones de trabajo.');
SELECT tmp_agregar_actividad('38301', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'XI Foro sobre Ciencias Sociales y Democracia en Chiapas (ODEMCA).');
SELECT tmp_agregar_actividad('33603', 'PROGRAMA DE EXCELENCIA EDUCATIVA', 'Libro impreso LGAC ODEMCA.');

DROP FUNCTION tmp_agregar_actividad(TEXT, TEXT, TEXT);

SELECT COUNT(*) AS filas_insertadas FROM actividad_pendiente WHERE ejercicio = 2026;
