import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT c.id, c.clave, c.nombre, c.funcion_id, f.clave AS funcion_clave, f.nombre AS funcion_nombre
      FROM capitulos c
      JOIN funciones f ON f.id = c.funcion_id
      ORDER BY f.clave, c.clave
    `);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { funcion_id, clave, nombre } = await req.json();
    if (!funcion_id || !clave || !nombre) {
      return NextResponse.json({ error: 'Función, clave y nombre son obligatorios' }, { status: 400 });
    }
    const result = await pool.query(
      `INSERT INTO capitulos (funcion_id, clave, nombre) VALUES ($1, $2, $3) RETURNING id, clave, nombre, funcion_id`,
      [funcion_id, clave.trim(), nombre.trim()]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Ese capítulo ya existe para esa función' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
