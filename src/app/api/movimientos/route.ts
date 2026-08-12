import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
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
        f.nombre AS funcion_nombre
      FROM movimientos m
      JOIN partidas p ON p.id = m.partida_id
      JOIN capitulos c ON c.id = p.capitulo_id
      JOIN funciones f ON f.id = c.funcion_id
      ORDER BY m.fecha DESC, m.id DESC
      LIMIT 200
    `);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      partida_id,
      folio_oficio,
      fecha,
      tipo_tramite,
      estado,
      monto,
      concepto,
      observaciones,
      capturado_por,
    } = body;

    if (!partida_id || !fecha || !tipo_tramite || !monto || !concepto) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (partida, fecha, tipo de trámite, monto, concepto)' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO movimientos
        (partida_id, folio_oficio, fecha, tipo_tramite, estado, monto, concepto, observaciones, capturado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
        capturado_por || null,
      ]
    );

    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
