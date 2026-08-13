import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`SELECT DISTINCT ejercicio FROM funciones ORDER BY ejercicio DESC`);
    const anioActual = new Date().getFullYear();
    const anios = new Set(result.rows.map((r) => r.ejercicio));
    anios.add(anioActual);
    return NextResponse.json(Array.from(anios).sort((a, b) => b - a));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
