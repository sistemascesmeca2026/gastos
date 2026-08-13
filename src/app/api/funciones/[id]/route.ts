import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { subtotal_oficial } = await req.json();
    const valor = subtotal_oficial === '' || subtotal_oficial === null ? null : Number(subtotal_oficial);

    if (valor !== null && isNaN(valor)) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    await pool.query(`UPDATE funciones SET subtotal_oficial = $1 WHERE id = $2`, [valor, id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
