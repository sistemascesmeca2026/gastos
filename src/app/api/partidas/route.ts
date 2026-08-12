import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.clave AS partida_clave,
        p.descripcion AS partida_descripcion,
        c.clave AS capitulo_clave,
        c.nombre AS capitulo_nombre,
        f.clave AS funcion_clave,
        f.nombre AS funcion_nombre
      FROM partidas p
      JOIN capitulos c ON c.id = p.capitulo_id
      JOIN funciones f ON f.id = c.funcion_id
      ORDER BY f.clave, c.clave, p.clave
    `);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
