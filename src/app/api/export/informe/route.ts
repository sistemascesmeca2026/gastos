import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';

const TIPO_LABELS: Record<string, string> = {
  solicitud_recursos: 'Solicitud de recursos',
  comprobacion_viaticos: 'Comprobación de viáticos',
  comprobacion_gasto: 'Comprobación de gasto',
  reembolso: 'Reembolso',
  retiro_institucional: 'Retiro institucional',
  transferencia_entrada: 'Transferencia (entrada)',
  transferencia_salida: 'Transferencia (salida)',
};

const ESTADO_LABELS: Record<string, string> = {
  solicitado: 'Solicitado',
  comprometido: 'Comprometido',
  devengado: 'Devengado',
  ejercido: 'Ejercido',
  pagado: 'Pagado',
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio') || String(new Date().getFullYear());

    const saldos = await pool.query(
      `SELECT partida_id, clave, descripcion, capitulo_clave, capitulo_nombre, funcion_nombre,
              modificado, ejercido, comprometido, retirado, por_ejercer
       FROM v_saldo_partida WHERE ejercicio = $1
       ORDER BY funcion_nombre, capitulo_clave, clave`,
      [ejercicio]
    );

    const movimientos = await pool.query(
      `SELECT m.partida_id, m.tipo_tramite, m.estado, m.monto, m.concepto, m.folio_oficio, m.fecha
       FROM movimientos m
       JOIN partidas p ON p.id = m.partida_id
       JOIN capitulos c ON c.id = p.capitulo_id
       JOIN funciones f ON f.id = c.funcion_id
       WHERE f.ejercicio = $1
       ORDER BY m.fecha`,
      [ejercicio]
    );

    const obsPorPartida: Record<number, string[]> = {};
    for (const m of movimientos.rows) {
      const linea = `${m.concepto} — $${Number(m.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
      if (!obsPorPartida[m.partida_id]) obsPorPartida[m.partida_id] = [];
      obsPorPartida[m.partida_id].push(linea);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CESMECA - Sistema POA';
    workbook.created = new Date();

    const porFuncion: Record<string, typeof saldos.rows> = {};
    for (const s of saldos.rows) {
      if (!porFuncion[s.funcion_nombre]) porFuncion[s.funcion_nombre] = [];
      porFuncion[s.funcion_nombre].push(s);
    }

    for (const [funcion, filas] of Object.entries(porFuncion)) {
      const nombreHoja = funcion.replace(/PROGRAMA\s*(DE|PARA)?\s*/i, '').slice(0, 31) || 'Función';
      const sheet = workbook.addWorksheet(nombreHoja);

      sheet.mergeCells('A1:G1');
      sheet.getCell('A1').value = 'UNIVERSIDAD DE CIENCIAS Y ARTES DE CHIAPAS';
      sheet.getCell('A1').font = { bold: true, size: 12 };
      sheet.mergeCells('A2:G2');
      sheet.getCell('A2').value = 'CENTRO DE ESTUDIOS SUPERIORES DE MÉXICO Y CENTROAMÉRICA';
      sheet.getCell('A2').font = { italic: true, size: 10 };
      sheet.mergeCells('A3:G3');
      sheet.getCell('A3').value = `INFORME DE EJERCICIO PRESUPUESTAL ${ejercicio} — ${funcion}`;
      sheet.getCell('A3').font = { bold: true, size: 10 };

      const headerRow = sheet.getRow(5);
      headerRow.values = ['Partida', 'Descripción', 'Recurso', 'Ejercido', 'Comprometido', 'Retirado', 'Por ejercer', 'Observaciones'];
      headerRow.eachCell((c) => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D2E9' } }; });

      let r = 6;
      const porCapitulo: Record<string, typeof filas> = {};
      for (const f of filas) {
        const key = `${f.capitulo_clave} · ${f.capitulo_nombre}`;
        if (!porCapitulo[key]) porCapitulo[key] = [];
        porCapitulo[key].push(f);
      }

      const totales = { modificado: 0, ejercido: 0, comprometido: 0, retirado: 0, por_ejercer: 0 };

      for (const [capKey, filasCap] of Object.entries(porCapitulo)) {
        const capRow = sheet.getRow(r);
        capRow.getCell(1).value = 'Capítulo:';
        capRow.getCell(2).value = capKey;
        capRow.getCell(1).font = { bold: true };
        capRow.getCell(2).font = { bold: true };
        r++;

        for (const f of filasCap) {
          const row = sheet.getRow(r);
          row.values = [
            f.clave,
            f.descripcion,
            Number(f.modificado),
            Number(f.ejercido),
            Number(f.comprometido),
            Number(f.retirado),
            Number(f.por_ejercer),
            (obsPorPartida[f.partida_id] || []).join('\n'),
          ];
          for (let i = 3; i <= 7; i++) row.getCell(i).numFmt = '$#,##0.00';
          row.getCell(8).alignment = { wrapText: true, vertical: 'top' };

          totales.modificado += Number(f.modificado);
          totales.ejercido += Number(f.ejercido);
          totales.comprometido += Number(f.comprometido);
          totales.retirado += Number(f.retirado);
          totales.por_ejercer += Number(f.por_ejercer);
          r++;
        }
      }

      const totalRow = sheet.getRow(r);
      totalRow.values = ['', 'TOTAL', totales.modificado, totales.ejercido, totales.comprometido, totales.retirado, totales.por_ejercer, ''];
      totalRow.eachCell((c) => { c.font = { bold: true }; });
      for (let i = 3; i <= 7; i++) totalRow.getCell(i).numFmt = '$#,##0.00';

      sheet.columns = [
        { width: 10 }, { width: 40 }, { width: 15 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 55 },
      ];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="informe_ejercicio_${ejercicio}_cesmeca.xlsx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
