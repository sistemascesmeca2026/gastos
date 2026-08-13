import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verificarSesion, COOKIE_NAME } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio');

    const base = `
      SELECT
        m.id,
        m.folio_oficio,
        m.fecha,
        m.tipo_tramite,
        m.estado,
        m.monto,
        m.concepto,
        p.clave AS partida_clave,
        p.descripcion AS partida_descripcion,
        f.nombre AS funcion_nombre,
        f.ejercicio,
        cu.nombre AS creado_por_nombre,
        au.nombre AS actualizado_por_nombre
      FROM movimientos m
      JOIN partidas p ON p.id = m.partida_id
      JOIN capitulos c ON c.id = p.capitulo_id
      JOIN funciones f ON f.id = c.funcion_id
      LEFT JOIN usuarios cu ON cu.id = m.creado_por_id
      LEFT JOIN usuarios au ON au.id = m.actualizado_por_id
    `;

    const result = ejercicio
      ? await pool.query(`${base} WHERE f.ejercicio = $1 ORDER BY m.fecha DESC, m.id DESC LIMIT 500`, [ejercicio])
      : await pool.query(`${base} ORDER BY m.fecha DESC, m.id DESC LIMIT 200`);

    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sesion = await verificarSesion(cookieStore.get(COOKIE_NAME)?.value);

    const body = await req.json();
    const { partida_id, folio_oficio, fecha, tipo_tramite, estado, monto, concepto, observaciones } = body;

    if (!partida_id || !fecha || !tipo_tramite || !monto || !concepto) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (partida, fecha, tipo de trámite, monto, concepto)' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO movimientos
        (partida_id, folio_oficio, fecha, tipo_tramite, estado, monto, concepto, observaciones, creado_por_id, actualizado_por_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
       RETURNING id`,
      [
        partida_id,
        folio_oficio || null,
        fecha,
        tipo_tramite,
        estado || 'solicitado',
        monto,
        concepto,
        observaciones || null,
        sesion?.userId || null,
      ]
    );

    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
