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
        p.id,
        p.clave AS partida_clave,
        p.descripcion AS partida_descripcion,
        c.clave AS capitulo_clave,
        c.nombre AS capitulo_nombre,
        f.clave AS funcion_clave,
        f.nombre AS funcion_nombre,
        f.ejercicio
      FROM partidas p
      JOIN capitulos c ON c.id = p.capitulo_id
      JOIN funciones f ON f.id = c.funcion_id
    `;

    const condiciones: string[] = [];
    const params: any[] = [];
    if (ejercicio) {
      params.push(ejercicio);
      condiciones.push(`f.ejercicio = $${params.length}`);
    }
    const condEspacio = condicionEspacio(espacio, 'f');
    if (condEspacio) condiciones.push(condEspacio);
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const result = await pool.query(`${base} ${where} ORDER BY f.ejercicio DESC, f.clave, c.clave, p.clave`, params);

    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const { capitulo_id, clave, descripcion, ministrado } = await req.json();
    if (!capitulo_id || !clave || !descripcion) {
      return NextResponse.json({ error: 'Capítulo, clave y descripción son obligatorios' }, { status: 400 });
    }

    await client.query('BEGIN');

    const partidaResult = await client.query(
      `INSERT INTO partidas (capitulo_id, clave, descripcion) VALUES ($1, $2, $3) RETURNING id, clave, descripcion, capitulo_id`,
      [capitulo_id, clave.trim(), descripcion.trim()]
    );
    const partida = partidaResult.rows[0];

    const montoMinistrado = Number(ministrado) || 0;
    await client.query(
      `INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado, por_ejercer, disponible)
       VALUES ($1, CURRENT_DATE, $2, $2, $2, $2, $2)`,
      [partida.id, montoMinistrado]
    );

    await client.query('COMMIT');
    return NextResponse.json(partida, { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Esa partida ya existe en ese capítulo' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
