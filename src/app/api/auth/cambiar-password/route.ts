import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { verificarSesion, COOKIE_NAME } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sesion = await verificarSesion(cookieStore.get(COOKIE_NAME)?.value);
    if (!sesion) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { passwordActual, passwordNueva } = await req.json();
    if (!passwordActual || !passwordNueva) {
      return NextResponse.json({ error: 'Completa ambos campos' }, { status: 400 });
    }
    if (passwordNueva.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const result = await pool.query(`SELECT password_hash FROM usuarios WHERE id = $1`, [sesion.userId]);
    const usuario = result.rows[0];
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const valido = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!valido) {
      return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 401 });
    }

    const nuevoHash = await bcrypt.hash(passwordNueva, 10);
    await pool.query(`UPDATE usuarios SET password_hash = $1 WHERE id = $2`, [nuevoHash, sesion.userId]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
