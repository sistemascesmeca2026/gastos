import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if ('subtotal_oficial' in body) {
      const valor = body.subtotal_oficial === '' || body.subtotal_oficial === null ? null : Number(body.subtotal_oficial);
      if (valor !== null && isNaN(valor)) {
        return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
      }
      await pool.query(`UPDATE capitulos SET subtotal_oficial = $1 WHERE id = $2`, [valor, id]);
    }

    if (body.clave || body.nombre) {
      await pool.query(
        `UPDATE capitulos SET clave = COALESCE($1, clave), nombre = COALESCE($2, nombre) WHERE id = $3`,
        [body.clave?.trim() || null, body.nombre?.trim() || null, id]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Ese capítulo ya existe para esa función' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM capitulos WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.code === '23503') {
      return NextResponse.json({ error: 'No se puede eliminar: este capítulo tiene partidas con movimientos registrados' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
