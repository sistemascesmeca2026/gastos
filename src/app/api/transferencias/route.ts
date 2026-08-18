import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verificarSesion, COOKIE_NAME } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ejercicio = searchParams.get('ejercicio');

    const base = `
      SELECT
        s.id AS salida_id,
        s.grupo_transferencia,
        s.fecha,
        s.monto,
        s.concepto,
        s.folio_oficio,
        s.estado,
        po.clave AS origen_clave,
        po.descripcion AS origen_descripcion,
        fo.nombre AS origen_funcion,
        pd.clave AS destino_clave,
        pd.descripcion AS destino_descripcion,
        fd.nombre AS destino_funcion,
        u.nombre AS creado_por_nombre
      FROM movimientos s
      JOIN movimientos d ON d.grupo_transferencia = s.grupo_transferencia AND d.tipo_tramite = 'transferencia_entrada'
      JOIN partidas po ON po.id = s.partida_id
      JOIN capitulos co ON co.id = po.capitulo_id
      JOIN funciones fo ON fo.id = co.funcion_id
      JOIN partidas pd ON pd.id = d.partida_id
      JOIN capitulos cd ON cd.id = pd.capitulo_id
      JOIN funciones fd ON fd.id = cd.funcion_id
      LEFT JOIN usuarios u ON u.id = s.creado_por_id
      WHERE s.tipo_tramite = 'transferencia_salida' AND s.grupo_transferencia IS NOT NULL
    `;

    const result = ejercicio
      ? await pool.query(`${base} AND fo.ejercicio = $1 ORDER BY s.fecha DESC`, [ejercicio])
      : await pool.query(`${base} ORDER BY s.fecha DESC`);

    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const cookieStore = await cookies();
    const sesion = await verificarSesion(cookieStore.get(COOKIE_NAME)?.value);

    const { partida_origen_id, partida_destino_id, monto, fecha, concepto, folio_oficio, estado } = await req.json();

    if (!partida_origen_id || !partida_destino_id || !monto || !fecha || !concepto) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (origen, destino, monto, fecha, concepto)' }, { status: 400 });
    }
    if (partida_origen_id === partida_destino_id) {
      return NextResponse.json({ error: 'La partida de origen y destino deben ser distintas' }, { status: 400 });
    }

    const grupo = crypto.randomUUID();
    const estadoFinal = estado || 'pagado';

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO movimientos (partida_id, folio_oficio, fecha, tipo_tramite, estado, monto, concepto, creado_por_id, actualizado_por_id, grupo_transferencia)
       VALUES ($1,$2,$3,'transferencia_salida',$4,$5,$6,$7,$7,$8)`,
      [partida_origen_id, folio_oficio || null, fecha, estadoFinal, monto, concepto, sesion?.userId || null, grupo]
    );

    await client.query(
      `INSERT INTO movimientos (partida_id, folio_oficio, fecha, tipo_tramite, estado, monto, concepto, creado_por_id, actualizado_por_id, grupo_transferencia)
       VALUES ($1,$2,$3,'transferencia_entrada',$4,$5,$6,$7,$7,$8)`,
      [partida_destino_id, folio_oficio || null, fecha, estadoFinal, monto, concepto, sesion?.userId || null, grupo]
    );

    await client.query('COMMIT');
    return NextResponse.json({ ok: true, grupo_transferencia: grupo }, { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
