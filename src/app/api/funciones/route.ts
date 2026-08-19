import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { condicionEspacio } from '@/lib/espacio';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio');
    const espacio = searchParams.get('espacio');

    const condiciones: string[] = [];
    const params: any[] = [];
    if (ejercicio) {
      params.push(ejercicio);
      condiciones.push(`ejercicio = $${params.length}`);
    }
    const condEspacio = condicionEspacio(espacio);
    if (condEspacio) condiciones.push(condEspacio);
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT id, clave, nombre, ejercicio, subtotal_oficial, dependencia, fondo, fondo_nombre FROM funciones ${where} ORDER BY ejercicio DESC, clave`,
      params
    );

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
