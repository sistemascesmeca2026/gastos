import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio');

    const porFuncion = ejercicio
      ? await pool.query(
          `SELECT funcion_nombre, SUM(ministrado) AS ministrado, SUM(ejercido) AS ejercido, SUM(por_ejercer) AS por_ejercer
           FROM v_saldo_partida WHERE ejercicio = $1 GROUP BY funcion_nombre ORDER BY SUM(ministrado) DESC`,
          [ejercicio]
        )
      : await pool.query(
          `SELECT funcion_nombre, SUM(ministrado) AS ministrado, SUM(ejercido) AS ejercido, SUM(por_ejercer) AS por_ejercer
           FROM v_saldo_partida GROUP BY funcion_nombre ORDER BY SUM(ministrado) DESC`
        );

    const filtroMov = ejercicio
      ? `JOIN partidas p ON p.id = m.partida_id JOIN capitulos c ON c.id = p.capitulo_id JOIN funciones f ON f.id = c.funcion_id WHERE f.ejercicio = ${Number(ejercicio)}`
      : '';

    const porTipo = await pool.query(`
      SELECT tipo_tramite, SUM(monto) AS total
      FROM movimientos m
      ${filtroMov}
      GROUP BY tipo_tramite
    `);

    const porMes = await pool.query(`
      SELECT to_char(date_trunc('month', fecha), 'YYYY-MM') AS mes, SUM(monto) AS total
      FROM movimientos m
      ${filtroMov}
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
