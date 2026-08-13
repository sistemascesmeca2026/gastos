import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ partidaId: string }> }) {
  try {
    const { partidaId } = await params;
    const { ministrado } = await req.json();

    if (ministrado === undefined || ministrado === null || isNaN(Number(ministrado))) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    const existente = await pool.query(
      `SELECT id FROM linea_base WHERE partida_id = $1 ORDER BY fecha_corte DESC LIMIT 1`,
      [partidaId]
    );

    if (existente.rows.length === 0) {
      await pool.query(
        `INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado, por_ejercer, disponible)
         VALUES ($1, CURRENT_DATE, $2, $2, $2, $2, $2)`,
        [partidaId, Number(ministrado)]
      );
    } else {
      await pool.query(
        `UPDATE linea_base SET ministrado = $1, modificado = $1 WHERE id = $2`,
        [Number(ministrado), existente.rows[0].id]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
