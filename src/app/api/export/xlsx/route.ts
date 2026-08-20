import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';
import { condicionEspacio } from '@/lib/espacio';

const DEPENDENCIA_LABELS: Record<string, string> = {
  '4008000': 'CESMECA',
  '4052050': 'DCSH',
  '4051990': 'DEIF',
  '4008010': 'MCSH',
  '4008020': 'MEIF',
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio') || String(new Date().getFullYear());
    const espacio = searchParams.get('espacio');

    const condS: string[] = ['ejercicio = $1'];
    const condEspacioS = condicionEspacio(espacio);
    if (condEspacioS) condS.push(condEspacioS);

    const saldos = await pool.query(
      `SELECT partida_id, funcion_id, clave, descripcion, capitulo_clave, capitulo_nombre, funcion_nombre, dependencia,
              ministrado, retirado, neto, ejercido, comprometido, por_ejercer
       FROM v_saldo_partida WHERE ${condS.join(' AND ')}
       ORDER BY funcion_nombre, capitulo_clave, clave`,
      [ejercicio]
    );

    const condM: string[] = ['f.ejercicio = $1'];
    const condEspacioM = condicionEspacio(espacio, 'f');
    if (condEspacioM) condM.push(condEspacioM);

    const movimientos = await pool.query(`
      SELECT m.partida_id, m.tipo_tramite, m.monto, m.concepto, m.folio_oficio, m.fecha
      FROM movimientos m
      JOIN partidas p ON p.id = m.partida_id
      JOIN capitulos c ON c.id = p.capitulo_id
      JOIN funciones f ON f.id = c.funcion_id
      WHERE ${condM.join(' AND ')}
      ORDER BY fecha
    `, [ejercicio]);

    // Agrupar observaciones (conceptos) por partida.
    // Excluye transferencias: ya tienen su propio control en la pestaña
    // Transferencias, no deben repetirse aquí (indicación de Patty Ruiz).
    const obsPorPartida: Record<number, string[]> = {};
    for (const m of movimientos.rows) {
      if (m.tipo_tramite === 'transferencia_entrada' || m.tipo_tramite === 'transferencia_salida') continue;
      const linea = `${m.concepto} — $${Number(m.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
      if (!obsPorPartida[m.partida_id]) obsPorPartida[m.partida_id] = [];
      obsPorPartida[m.partida_id].push(linea);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CESMECA - Sistema POA';
    workbook.created = new Date();

    // Agrupar por funcion_id (no por nombre) para no mezclar programas
    // distintos que comparten el mismo nombre.
    const grupos: Record<number, { nombre: string; dependencia: string; filas: typeof saldos.rows }> = {};
    for (const s of saldos.rows) {
      if (!grupos[s.funcion_id]) grupos[s.funcion_id] = { nombre: s.funcion_nombre, dependencia: s.dependencia, filas: [] };
      grupos[s.funcion_id].filas.push(s);
    }

    const conteoNombres: Record<string, number> = {};
    for (const { nombre } of Object.values(grupos)) {
      conteoNombres[nombre] = (conteoNombres[nombre] || 0) + 1;
    }

    const nombresHojaUsados = new Set<string>();

    for (const { nombre: funcion, dependencia, filas } of Object.values(grupos)) {
      let base = funcion.replace(/PROGRAMA\s*(DE|PARA)?\s*/i, '').trim();
      let nombreHoja = base.slice(0, 31) || 'Función';
      if (conteoNombres[funcion] > 1) {
        const sufijo = DEPENDENCIA_LABELS[dependencia] || dependencia;
        nombreHoja = `${base.slice(0, 31 - sufijo.length - 3)} (${sufijo})`;
      }
      let nombreFinal = nombreHoja;
      let n = 2;
      while (nombresHojaUsados.has(nombreFinal)) {
        nombreFinal = `${nombreHoja.slice(0, 28)} ${n}`;
        n++;
      }
      nombresHojaUsados.add(nombreFinal);

      const sheet = workbook.addWorksheet(nombreFinal);

      sheet.mergeCells('A1:G1');
      sheet.getCell('A1').value = 'UNIVERSIDAD DE CIENCIAS Y ARTES DE CHIAPAS';
      sheet.getCell('A1').font = { bold: true, size: 12 };
      sheet.getCell('A1').alignment = { horizontal: 'center' };

      sheet.mergeCells('A2:G2');
      sheet.getCell('A2').value = 'CENTRO DE ESTUDIOS SUPERIORES DE MÉXICO Y CENTROAMÉRICA';
      sheet.getCell('A2').font = { bold: true, italic: true, size: 11 };
      sheet.getCell('A2').alignment = { horizontal: 'center' };

      sheet.mergeCells('A3:G3');
      sheet.getCell('A3').value = 'PROGRAMA OPERATIVO ANUAL 2026';
      sheet.getCell('A3').font = { bold: true, italic: true, size: 11 };
      sheet.getCell('A3').alignment = { horizontal: 'center' };

      sheet.mergeCells('A4:G4');
      sheet.getCell('A4').value = `${funcion}${DEPENDENCIA_LABELS[dependencia] ? ' (' + DEPENDENCIA_LABELS[dependencia] + ')' : ''}`;
      sheet.getCell('A4').font = { size: 10 };
      sheet.getCell('A4').alignment = { horizontal: 'center' };

      const headerRow = sheet.getRow(6);
      headerRow.values = ['Partida', 'Descripción', 'Recurso', 'Ejercido', 'Retirado', 'Comprometido', 'Por ejercer', 'Verificación', 'Observaciones'];
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D2E9' } };
        cell.border = { bottom: { style: 'thin' } };
      });

      let r = 7;
      for (const f of filas) {
        const row = sheet.getRow(r);
        const sumaControl = Number(f.ejercido) + Number(f.retirado) + Number(f.comprometido) + Number(f.por_ejercer);
        const coincide = Math.abs(sumaControl - Number(f.ministrado)) < 0.5;
        const observaciones = [...(obsPorPartida[f.partida_id] || [])];
        if (Number(f.por_ejercer) > 0) {
          observaciones.push(`Pendiente por ejercer: $${money(f.por_ejercer)} (programado para el resto del ejercicio ${ejercicio})`);
        }
        row.values = [
          f.clave,
          f.descripcion,
          Number(f.ministrado),
          Number(f.ejercido),
          Number(f.retirado) || null,
          Number(f.comprometido),
          Number(f.por_ejercer),
          coincide ? '✓' : '⚠',
          observaciones.join('\n'),
        ];
        for (let col = 3; col <= 7; col++) row.getCell(col).numFmt = '$#,##0.00';
        row.getCell(8).alignment = { horizontal: 'center' };
        row.getCell(8).font = { color: { argb: coincide ? 'FF16A34A' : 'FFDC2626' }, bold: true };
        row.getCell(9).alignment = { wrapText: true, vertical: 'top' };
        r++;
      }

      const totalRow = sheet.getRow(r);
      totalRow.values = [
        '', 'TOTAL',
        filas.reduce((a, f) => a + Number(f.ministrado), 0),
        filas.reduce((a, f) => a + Number(f.ejercido), 0),
        filas.reduce((a, f) => a + Number(f.retirado), 0),
        filas.reduce((a, f) => a + Number(f.comprometido), 0),
        filas.reduce((a, f) => a + Number(f.por_ejercer), 0),
        '',
        '',
      ];
      totalRow.eachCell((cell) => { cell.font = { bold: true }; });
      for (let col = 3; col <= 7; col++) totalRow.getCell(col).numFmt = '$#,##0.00';

      sheet.columns = [
        { width: 10 }, { width: 42 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 50 },
      ];
    }

    const nombreEspacio = espacio === 'ballinas' ? 'ballinas' : espacio === 'ruiz' ? 'ruiz' : 'todo';
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="presupuesto_poa_${nombreEspacio}.xlsx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

