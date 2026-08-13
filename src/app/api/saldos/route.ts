import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio');

    const base = `
      SELECT
        partida_id, clave, descripcion, capitulo_id, capitulo_clave, capitulo_nombre,
        funcion_id, funcion_nombre, ejercicio,
        original, modificado, ministrado, pre_compromiso, comprometido, devengado,
        ejercido, pagado, por_ejercer, disponible, retirado, neto
      FROM v_saldo_partida
    `;

    const result = ejercicio
      ? await pool.query(`${base} WHERE ejercicio = $1 ORDER BY funcion_nombre, capitulo_clave, clave`, [ejercicio])
      : await pool.query(`${base} ORDER BY ejercicio DESC, funcion_nombre, capitulo_clave, clave`);

    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
