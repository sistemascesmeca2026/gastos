import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';

const COLS = ['Original', 'Modificado', 'Ministrado', 'Pre-compromiso', 'Comprometido', 'Devengado', 'Ejercido', 'Pagado', 'Por ejercer', 'Disponible'];
const FIELDS = ['original', 'modificado', 'ministrado', 'pre_compromiso', 'comprometido', 'devengado', 'ejercido', 'pagado', 'por_ejercer', 'disponible'];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio') || String(new Date().getFullYear());

    const saldos = await pool.query(
      `SELECT partida_id, clave, descripcion, capitulo_id, capitulo_clave, capitulo_nombre, funcion_id, funcion_nombre,
              original, modificado, ministrado, pre_compromiso, comprometido, devengado, ejercido, pagado, por_ejercer, disponible
       FROM v_saldo_partida WHERE ejercicio = $1
       ORDER BY funcion_nombre, capitulo_clave, clave`,
      [ejercicio]
    );

    const capitulos = await pool.query(`SELECT id, subtotal_oficial FROM capitulos`);
    const funciones = await pool.query(`SELECT id, subtotal_oficial FROM funciones WHERE ejercicio = $1`, [ejercicio]);
    const capOficial: Record<number, number | null> = Object.fromEntries(capitulos.rows.map((c) => [c.id, c.subtotal_oficial]));
    const funOficial: Record<number, number | null> = Object.fromEntries(funciones.rows.map((f) => [f.id, f.subtotal_oficial]));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CESMECA - Sistema POA';
    workbook.created = new Date();

    const porFuncion: Record<string, { funcion_id: number; filas: typeof saldos.rows }> = {};
    for (const s of saldos.rows) {
      if (!porFuncion[s.funcion_nombre]) porFuncion[s.funcion_nombre] = { funcion_id: s.funcion_id, filas: [] };
      porFuncion[s.funcion_nombre].filas.push(s);
    }

    for (const [funcion, { funcion_id, filas }] of Object.entries(porFuncion)) {
      const nombreHoja = funcion.replace(/PROGRAMA\s*(DE|PARA)?\s*/i, '').slice(0, 31) || 'Función';
      const sheet = workbook.addWorksheet(nombreHoja);
      const lastCol = String.fromCharCode('A'.charCodeAt(0) + 1 + FIELDS.length);

      sheet.mergeCells(`A1:${lastCol}1`);
      sheet.getCell('A1').value = 'CONCENTRADO OFICIAL — CESMECA UNICACH';
      sheet.getCell('A1').font = { bold: true, size: 12 };
      sheet.mergeCells(`A2:${lastCol}2`);
      sheet.getCell('A2').value = funcion;
      sheet.getCell('A2').font = { italic: true, size: 10 };

      const headerRow = sheet.getRow(4);
      headerRow.values = ['Partida', 'Descripción', ...COLS];
      headerRow.eachCell((c) => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D2E9' } }; });

      let r = 5;
      const porCapitulo: Record<string, { capitulo_id: number; filas: typeof filas }> = {};
      for (const f of filas) {
        const key = `${f.capitulo_clave} · ${f.capitulo_nombre}`;
        if (!porCapitulo[key]) porCapitulo[key] = { capitulo_id: f.capitulo_id, filas: [] };
        porCapitulo[key].filas.push(f);
      }

      let totalFuncionCalc = 0;

      for (const [capKey, { capitulo_id, filas: filasCap }] of Object.entries(porCapitulo)) {
        const capRow = sheet.getRow(r);
        capRow.getCell(1).value = 'Capítulo:';
        capRow.getCell(2).value = capKey;
        capRow.getCell(1).font = { bold: true };
        capRow.getCell(2).font = { bold: true };
        r++;

        let totalCapCalc = 0;
        for (const f of filasCap) {
          const row = sheet.getRow(r);
          const valores = FIELDS.map((c) => Number((f as any)[c]));
          row.values = [f.clave, f.descripcion, ...valores];
          for (let i = 0; i < FIELDS.length; i++) row.getCell(3 + i).numFmt = '$#,##0.00';
          totalCapCalc += Number(f.ministrado);
          r++;
        }
        totalFuncionCalc += totalCapCalc;

        const oficialCap = capOficial[capitulo_id];
        const subtotalRow = sheet.getRow(r);
        subtotalRow.getCell(2).value = 'Subtotal capítulo (calculado)';
        subtotalRow.getCell(2).font = { bold: true };
        subtotalRow.getCell(5).value = totalCapCalc;
        subtotalRow.getCell(5).numFmt = '$#,##0.00';
        subtotalRow.getCell(5).font = { bold: true };
        r++;
        const oficialRow = sheet.getRow(r);
        oficialRow.getCell(2).value = 'Subtotal oficial (PDF)';
        if (oficialCap !== null && oficialCap !== undefined) {
          oficialRow.getCell(5).value = Number(oficialCap);
          oficialRow.getCell(5).numFmt = '$#,##0.00';
          const coincide = Math.abs(Number(oficialCap) - totalCapCalc) < 0.5;
          oficialRow.getCell(6).value = coincide ? 'COINCIDE' : 'NO COINCIDE';
          oficialRow.getCell(6).font = { bold: true, color: { argb: coincide ? 'FF16A34A' : 'FFDC2626' } };
        }
        r += 2;
      }

      const funOfic = funOficial[funcion_id];
      const totalRow = sheet.getRow(r);
      totalRow.getCell(2).value = 'TOTAL FUNCIÓN (calculado)';
      totalRow.getCell(2).font = { bold: true };
      totalRow.getCell(5).value = totalFuncionCalc;
      totalRow.getCell(5).numFmt = '$#,##0.00';
      totalRow.getCell(5).font = { bold: true };
      r++;
      if (funOfic !== null && funOfic !== undefined) {
        const oficialTotalRow = sheet.getRow(r);
        oficialTotalRow.getCell(2).value = 'TOTAL FUNCIÓN (oficial)';
        oficialTotalRow.getCell(5).value = Number(funOfic);
        oficialTotalRow.getCell(5).numFmt = '$#,##0.00';
        const coincide = Math.abs(Number(funOfic) - totalFuncionCalc) < 0.5;
        oficialTotalRow.getCell(6).value = coincide ? 'COINCIDE' : 'NO COINCIDE';
        oficialTotalRow.getCell(6).font = { bold: true, color: { argb: coincide ? 'FF16A34A' : 'FFDC2626' } };
      }

      sheet.columns = [{ width: 10 }, { width: 38 }, ...FIELDS.map(() => ({ width: 13 }))];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="concentrado_oficial_cesmeca.xlsx"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
