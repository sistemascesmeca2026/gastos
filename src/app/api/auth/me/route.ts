import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarSesion, COOKIE_NAME } from '@/lib/session';
import pool from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sesion = await verificarSesion(cookieStore.get(COOKIE_NAME)?.value);
  if (!sesion) return NextResponse.json({ user: null });

  const result = await pool.query(`SELECT nombre, username FROM usuarios WHERE id = $1`, [sesion.userId]);
  const usuario = result.rows[0];
  if (!usuario) return NextResponse.json({ user: null });

  return NextResponse.json({ user: usuario });
}
