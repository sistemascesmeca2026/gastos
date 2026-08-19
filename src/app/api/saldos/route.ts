import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { condicionEspacio } from '@/lib/espacio';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio');
    const espacio = searchParams.get('espacio');

    const base = `
      SELECT
        partida_id, clave, descripcion, capitulo_id, capitulo_clave, capitulo_nombre,
        funcion_id, funcion_nombre, ejercicio, fecha_corte,
        original, modificado, modificado_real, ministrado, pre_compromiso, comprometido, devengado,
        ejercido, pagado, por_ejercer, disponible, retirado, neto, dependencia, fondo, fondo_nombre
      FROM v_saldo_partida
    `;

    const condiciones: string[] = [];
    const params: any[] = [];
    if (ejercicio) {
      params.push(ejercicio);
      condiciones.push(`ejercicio = $${params.length}`);
    }
    const condEspacio = condicionEspacio(espacio);
    if (condEspacio) condiciones.push(condEspacio);

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const result = await pool.query(`${base} ${where} ORDER BY ejercicio DESC, funcion_nombre, capitulo_clave, clave`, params);

    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

