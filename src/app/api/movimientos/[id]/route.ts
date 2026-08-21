import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verificarSesion, COOKIE_NAME } from '@/lib/session';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const sesion = await verificarSesion(cookieStore.get(COOKIE_NAME)?.value);

    const { id } = await params;
    const body = await req.json();
    const { partida_id, folio_oficio, fecha, tipo_tramite, estado, monto, concepto, observaciones } = body;

    if (!partida_id || !fecha || !tipo_tramite || !monto || !concepto) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    await pool.query(
      `UPDATE movimientos
       SET partida_id = $1, folio_oficio = $2, fecha = $3, tipo_tramite = $4,
           estado = $5, monto = $6, concepto = $7, observaciones = $8, actualizado_en = now(), actualizado_por_id = $9
       WHERE id = $10`,
      [partida_id, folio_oficio || null, fecha, tipo_tramite, estado || 'solicitado', monto, concepto, observaciones || null, sesion?.userId || null, id]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Si el movimiento es parte de una transferencia (entrada o salida),
    // se borran ambos lados juntos para no dejar ninguno huérfano.
    const result = await pool.query(
      `SELECT tipo_tramite, grupo_transferencia FROM movimientos WHERE id = $1`,
      [id]
    );
    const mov = result.rows[0];

    if (mov && (mov.tipo_tramite === 'transferencia_entrada' || mov.tipo_tramite === 'transferencia_salida') && mov.grupo_transferencia) {
      const del = await pool.query(
        `DELETE FROM movimientos WHERE grupo_transferencia = $1 RETURNING id`,
        [mov.grupo_transferencia]
      );
      return NextResponse.json({ ok: true, borrados: del.rowCount, esTransferencia: true });
    }

    await pool.query(`DELETE FROM movimientos WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true, borrados: 1, esTransferencia: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
