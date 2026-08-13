import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio');

    const result = ejercicio
      ? await pool.query(`SELECT id, clave, nombre, ejercicio FROM funciones WHERE ejercicio = $1 ORDER BY clave`, [ejercicio])
      : await pool.query(`SELECT id, clave, nombre, ejercicio FROM funciones ORDER BY ejercicio DESC, clave`);

    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { clave, nombre, ejercicio } = await req.json();
    if (!clave || !nombre || !ejercicio) {
      return NextResponse.json({ error: 'Clave, nombre y ejercicio son obligatorios' }, { status: 400 });
    }
    const result = await pool.query(
      `INSERT INTO funciones (clave, nombre, ejercicio) VALUES ($1, $2, $3) RETURNING id, clave, nombre, ejercicio`,
      [clave.trim(), nombre.trim(), Number(ejercicio)]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una función con esa clave en ese ejercicio' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
