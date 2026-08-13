import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { verificarSesion, COOKIE_NAME } from '@/lib/session';

async function requireAdmin() {
  const cookieStore = await cookies();
  const sesion = await verificarSesion(cookieStore.get(COOKIE_NAME)?.value);
  if (!sesion) return null;
  const result = await pool.query(`SELECT es_admin FROM usuarios WHERE id = $1`, [sesion.userId]);
  if (!result.rows[0]?.es_admin) return null;
  return sesion;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const result = await pool.query(`SELECT id, username, nombre, activo, es_admin, creado_en FROM usuarios ORDER BY id`);
  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { username, password, nombre } = await req.json();
    if (!username || !password || !nombre) {
      return NextResponse.json({ error: 'Usuario, contraseña y nombre son obligatorios' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (username, password_hash, nombre) VALUES ($1, $2, $3) RETURNING id, username, nombre, activo, es_admin`,
      [username.trim(), hash, nombre.trim()]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese nombre de usuario' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
