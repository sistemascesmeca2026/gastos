import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { clave, descripcion } = await req.json();

    await pool.query(
      `UPDATE partidas SET clave = COALESCE($1, clave), descripcion = COALESCE($2, descripcion) WHERE id = $3`,
      [clave?.trim() || null, descripcion?.trim() || null, id]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Esa partida ya existe en ese capítulo' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM partidas WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.code === '23503') {
      return NextResponse.json({ error: 'No se puede eliminar: esta partida tiene movimientos registrados' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
