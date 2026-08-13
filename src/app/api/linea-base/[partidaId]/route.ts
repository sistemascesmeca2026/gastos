import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const CAMPOS_EDITABLES = ['original', 'modificado', 'ministrado', 'pre_compromiso', 'devengado', 'pagado', 'disponible'] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ partidaId: string }> }) {
  try {
    const { partidaId } = await params;
    const body = await req.json();

    // Modo simple retrocompatible: solo { ministrado }
    // Modo completo: { campo: 'original'|'modificado'|..., valor: number }
    let campo: string;
    let valor: number;

    if ('campo' in body) {
      campo = body.campo;
      valor = Number(body.valor);
    } else {
      campo = 'ministrado';
      valor = Number(body.ministrado);
    }

    if (!CAMPOS_EDITABLES.includes(campo as any) || isNaN(valor)) {
      return NextResponse.json({ error: 'Campo o monto inválido' }, { status: 400 });
    }

    const existente = await pool.query(
      `SELECT id FROM linea_base WHERE partida_id = $1 ORDER BY fecha_corte DESC LIMIT 1`,
      [partidaId]
    );

    if (existente.rows.length === 0) {
      await pool.query(
        `INSERT INTO linea_base (partida_id, fecha_corte, ${campo}) VALUES ($1, CURRENT_DATE, $2)`,
        [partidaId, valor]
      );
    } else {
      await pool.query(
        `UPDATE linea_base SET ${campo} = $1 WHERE id = $2`,
        [valor, existente.rows[0].id]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
