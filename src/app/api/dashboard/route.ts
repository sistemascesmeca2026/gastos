import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const porFuncion = await pool.query(`
      SELECT funcion_nombre, SUM(ministrado) AS ministrado, SUM(ejercido) AS ejercido, SUM(por_ejercer) AS por_ejercer
      FROM v_saldo_partida
      GROUP BY funcion_nombre
      ORDER BY SUM(ministrado) DESC
    `);

    const porTipo = await pool.query(`
      SELECT tipo_tramite, SUM(monto) AS total
      FROM movimientos
      GROUP BY tipo_tramite
    `);

    const porMes = await pool.query(`
      SELECT to_char(date_trunc('month', fecha), 'YYYY-MM') AS mes, SUM(monto) AS total
      FROM movimientos
      GROUP BY 1
      ORDER BY 1
    `);

    return NextResponse.json({
      porFuncion: porFuncion.rows,
      porTipo: porTipo.rows,
      porMes: porMes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
