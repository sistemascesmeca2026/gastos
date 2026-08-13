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

const COLS = ['Original', 'Modificado', 'Ministrado', 'Pre-compromiso', 'Comprometido', 'Devengado', 'Ejercido', 'Pagado', 'Por ejercer', 'Disponible'];
const FIELDS = ['original', 'modificado', 'ministrado', 'pre_compromiso', 'comprometido', 'devengado', 'ejercido', 'pagado', 'por_ejercer', 'disponible'];

export async function GET() {
  try {
    const saldos = await pool.query(`
      SELECT partida_id, clave, descripcion, capitulo_clave, capitulo_nombre, funcion_nombre,
             original, modificado, ministrado, pre_compromiso, comprometido, devengado, ejercido, pagado, por_ejercer, disponible
      FROM v_saldo_partida
      ORDER BY funcion_nombre, capitulo_clave, clave
    `);

    const movimientos = await pool.query(`
      SELECT partida_id, tipo_tramite, monto, concepto, folio_oficio, fecha
      FROM movimientos
      ORDER BY fecha
    `);

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

    const lastColLetter = String.fromCharCode('A'.charCodeAt(0) + 1 + COLS.length + 1); // Partida+Desc+10cols+Observaciones

    for (const [funcion, filas] of Object.entries(grupos)) {
      const nombreHoja = funcion.replace(/PROGRAMA\s*(DE|PARA)?\s*/i, '').slice(0, 31) || 'Función';
      const sheet = workbook.addWorksheet(nombreHoja);

      sheet.mergeCells(`A1:${lastColLetter}1`);
      sheet.getCell('A1').value = 'UNIVERSIDAD DE CIENCIAS Y ARTES DE CHIAPAS';
      sheet.getCell('A1').font = { bold: true, size: 12 };
      sheet.getCell('A1').alignment = { horizontal: 'center' };

      sheet.mergeCells(`A2:${lastColLetter}2`);
      sheet.getCell('A2').value = 'CENTRO DE ESTUDIOS SUPERIORES DE MÉXICO Y CENTROAMÉRICA';
      sheet.getCell('A2').font = { bold: true, italic: true, size: 11 };
      sheet.getCell('A2').alignment = { horizontal: 'center' };

      sheet.mergeCells(`A3:${lastColLetter}3`);
      sheet.getCell('A3').value = 'ESTADO PRESUPUESTAL GENERAL DEL EJERCICIO 2026';
      sheet.getCell('A3').font = { bold: true, italic: true, size: 11 };
      sheet.getCell('A3').alignment = { horizontal: 'center' };

      sheet.mergeCells(`A4:${lastColLetter}4`);
      sheet.getCell('A4').value = funcion;
      sheet.getCell('A4').font = { size: 10 };
      sheet.getCell('A4').alignment = { horizontal: 'center' };

      const headerRow = sheet.getRow(6);
      headerRow.values = ['Partida', 'Descripción', ...COLS, 'Observaciones'];
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D2E9' } };
        cell.border = { bottom: { style: 'thin' } };
      });

      let r = 7;
      const totales: Record<string, number> = Object.fromEntries(FIELDS.map((f) => [f, 0]));

      for (const f of filas as any[]) {
        const row = sheet.getRow(r);
        const valores = FIELDS.map((campo) => {
          const v = Number(f[campo]);
          totales[campo] += v;
          return v;
        });
        row.values = [f.clave, f.descripcion, ...valores, (obsPorPartida[f.partida_id] || []).join('\n')];
        for (let i = 0; i < FIELDS.length; i++) {
          row.getCell(3 + i).numFmt = '$#,##0.00';
        }
        row.getCell(3 + FIELDS.length).alignment = { wrapText: true, vertical: 'top' };
        r++;
      }

      const totalRow = sheet.getRow(r);
      totalRow.values = ['', 'TOTAL', ...FIELDS.map((f) => totales[f]), ''];
      totalRow.eachCell((cell) => { cell.font = { bold: true }; });
      for (let i = 0; i < FIELDS.length; i++) {
        totalRow.getCell(3 + i).numFmt = '$#,##0.00';
      }

      sheet.columns = [
        { width: 10 }, { width: 38 },
        ...FIELDS.map(() => ({ width: 13 })),
        { width: 45 },
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
