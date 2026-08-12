import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        partida_id,
        clave,
        descripcion,
        capitulo_clave,
        capitulo_nombre,
        funcion_nombre,
        ministrado,
        retirado,
        neto,
        ejercido,
        comprometido,
        por_ejercer
      FROM v_saldo_partida
      ORDER BY funcion_nombre, capitulo_clave, clave
    `);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
