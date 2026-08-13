import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { crearSesion, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña son obligatorios' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id, username, password_hash, nombre, activo FROM usuarios WHERE username = $1`,
      [username.trim()]
    );

    const usuario = result.rows[0];
    if (!usuario || !usuario.activo) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const token = await crearSesion(usuario.id, usuario.username);
    const res = NextResponse.json({ ok: true, nombre: usuario.nombre, username: usuario.username });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
