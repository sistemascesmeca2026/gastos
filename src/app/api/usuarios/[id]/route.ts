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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { id } = await params;
    const { activo, nombre, nuevaPassword } = await req.json();

    if (typeof activo === 'boolean') {
      if (admin.userId === Number(id) && activo === false) {
        return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 });
      }
      await pool.query(`UPDATE usuarios SET activo = $1 WHERE id = $2`, [activo, id]);
    }

    if (nombre) {
      await pool.query(`UPDATE usuarios SET nombre = $1 WHERE id = $2`, [nombre.trim(), id]);
    }

    if (nuevaPassword) {
      if (nuevaPassword.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }
      const hash = await bcrypt.hash(nuevaPassword, 10);
      await pool.query(`UPDATE usuarios SET password_hash = $1 WHERE id = $2`, [hash, id]);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
