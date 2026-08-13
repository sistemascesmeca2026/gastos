import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';

const TIPO_LABELS: Record<string, string> = {
  solicitud_recursos: 'Solicitud de recursos',
  comprobacion_viaticos: 'Comprobación de viáticos',
  reembolso: 'Reembolso',
  retiro_institucional: 'Retiro institucional',
  transferencia_entrada: 'Transferencia (entrada)',
  transferencia_salida: 'Transferencia (salida)',
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio') || String(new Date().getFullYear());

    const saldos = await pool.query(
      `SELECT partida_id, clave, descripcion, capitulo_clave, capitulo_nombre, funcion_nombre,
              ministrado, retirado, neto, ejercido, comprometido, por_ejercer
       FROM v_saldo_partida WHERE ejercicio = $1
       ORDER BY funcion_nombre, capitulo_clave, clave`,
      [ejercicio]
    );

    const movimientos = await pool.query(`
      SELECT m.partida_id, m.tipo_tramite, m.monto, m.concepto, m.folio_oficio, m.fecha
      FROM movimientos m
      JOIN partidas p ON p.id = m.partida_id
      JOIN capitulos c ON c.id = p.capitulo_id
      JOIN funciones f ON f.id = c.funcion_id
      WHERE f.ejercicio = $1
      ORDER BY fecha
    `, [ejercicio]);

    // Agrupar observaciones (conceptos) por partida
    const obsPorPartida: Record<number, string[]> = {};
    for (const m of movimientos.rows) {
      const tipo = TIPO_LABELS[m.tipo_tramite] || m.tipo_tramite;
      const folio = m.folio_oficio ? ` (${m.folio_oficio})` : '';
      const linea = `${tipo}${folio}: ${m.concepto} — $${Number(m.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
      if (!obsPorPartida[m.partida_id]) obsPorPartida[m.partida_id] = [];
      obsPorPartida[m.partida_id].push(linea);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CESMECA - Sistema POA';
    workbook.created = new Date();

    const grupos: Record<string, typeof saldos.rows> = {};
    for (const s of saldos.rows) {
      if (!grupos[s.funcion_nombre]) grupos[s.funcion_nombre] = [];
      grupos[s.funcion_nombre].push(s);
    }

    for (const [funcion, filas] of Object.entries(grupos)) {
      const nombreHoja = funcion.replace(/PROGRAMA\s*(DE|PARA)?\s*/i, '').slice(0, 31) || 'Función';
      const sheet = workbook.addWorksheet(nombreHoja);

      sheet.mergeCells('A1:F1');
      sheet.getCell('A1').value = 'UNIVERSIDAD DE CIENCIAS Y ARTES DE CHIAPAS';
      sheet.getCell('A1').font = { bold: true, size: 12 };
      sheet.getCell('A1').alignment = { horizontal: 'center' };

      sheet.mergeCells('A2:F2');
      sheet.getCell('A2').value = 'CENTRO DE ESTUDIOS SUPERIORES DE MÉXICO Y CENTROAMÉRICA';
      sheet.getCell('A2').font = { bold: true, italic: true, size: 11 };
      sheet.getCell('A2').alignment = { horizontal: 'center' };

      sheet.mergeCells('A3:F3');
      sheet.getCell('A3').value = 'PROGRAMA OPERATIVO ANUAL 2026';
      sheet.getCell('A3').font = { bold: true, italic: true, size: 11 };
      sheet.getCell('A3').alignment = { horizontal: 'center' };

      sheet.mergeCells('A4:F4');
      sheet.getCell('A4').value = funcion;
      sheet.getCell('A4').font = { size: 10 };
      sheet.getCell('A4').alignment = { horizontal: 'center' };

      const headerRow = sheet.getRow(6);
      headerRow.values = ['Partida', 'Descripción', 'Recurso (Ministrado)', 'Ejercido', 'Comprometido', 'Por ejercer', 'Observaciones'];
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D2E9' } };
        cell.border = { bottom: { style: 'thin' } };
      });

      let r = 7;
      for (const f of filas) {
        const row = sheet.getRow(r);
        row.values = [
          f.clave,
          f.descripcion,
          Number(f.ministrado),
          Number(f.ejercido),
          Number(f.comprometido),
          Number(f.por_ejercer),
          (obsPorPartida[f.partida_id] || []).join('\n'),
        ];
        row.getCell(3).numFmt = '$#,##0.00';
        row.getCell(4).numFmt = '$#,##0.00';
        row.getCell(5).numFmt = '$#,##0.00';
        row.getCell(6).numFmt = '$#,##0.00';
        row.getCell(7).alignment = { wrapText: true, vertical: 'top' };
        r++;
      }

      const totalRow = sheet.getRow(r);
      totalRow.values = [
        '', 'TOTAL',
        filas.reduce((a, f) => a + Number(f.ministrado), 0),
        filas.reduce((a, f) => a + Number(f.ejercido), 0),
        filas.reduce((a, f) => a + Number(f.comprometido), 0),
        filas.reduce((a, f) => a + Number(f.por_ejercer), 0),
        '',
      ];
      totalRow.eachCell((cell) => { cell.font = { bold: true }; });
      totalRow.getCell(3).numFmt = '$#,##0.00';
      totalRow.getCell(4).numFmt = '$#,##0.00';
      totalRow.getCell(5).numFmt = '$#,##0.00';
      totalRow.getCell(6).numFmt = '$#,##0.00';

      sheet.columns = [
        { width: 10 }, { width: 42 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 50 },
      ];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="presupuesto_poa_cesmeca.xlsx"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
