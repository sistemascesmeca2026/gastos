import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`SELECT id, clave, nombre FROM funciones ORDER BY clave`);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { clave, nombre } = await req.json();
    if (!clave || !nombre) {
      return NextResponse.json({ error: 'Clave y nombre son obligatorios' }, { status: 400 });
    }
    const result = await pool.query(
      `INSERT INTO funciones (clave, nombre) VALUES ($1, $2) RETURNING id, clave, nombre`,
      [clave.trim(), nombre.trim()]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una función con esa clave' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
