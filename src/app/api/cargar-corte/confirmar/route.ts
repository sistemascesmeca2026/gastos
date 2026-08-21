import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const { dependencia, fondo, funciones, ejercicio, fechaCorte } = await req.json();

    if (!dependencia || !fondo || !Array.isArray(funciones) || !ejercicio || !fechaCorte) {
      return NextResponse.json({ error: 'Faltan datos para confirmar la carga.' }, { status: 400 });
    }

    await client.query('BEGIN');

    let funcionesCreadas = 0, funcionesExistentes = 0;
    let capitulosCreados = 0, capitulosExistentes = 0;
    let partidasCreadas = 0, partidasExistentes = 0;
    let lineaBaseInsertadas = 0;

    for (const f of funciones) {
      let funcionId: number;
      const fExistente = await client.query(
        `SELECT id FROM funciones WHERE clave = $1 AND ejercicio = $2 AND dependencia = $3 AND fondo = $4`,
        [f.clave, ejercicio, dependencia.clave, fondo.clave]
      );
      if (fExistente.rows.length) {
        funcionId = fExistente.rows[0].id;
        funcionesExistentes++;
      } else {
        const ins = await client.query(
          `INSERT INTO funciones (clave, nombre, dependencia, fondo, fondo_nombre, ejercicio)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [f.clave, f.nombre, dependencia.clave, fondo.clave, fondo.nombre, ejercicio]
        );
        funcionId = ins.rows[0].id;
        funcionesCreadas++;
      }

      for (const c of f.capitulos) {
        let capituloId: number;
        const cExistente = await client.query(
          `SELECT id FROM capitulos WHERE clave = $1 AND funcion_id = $2`,
          [c.clave, funcionId]
        );
        if (cExistente.rows.length) {
          capituloId = cExistente.rows[0].id;
          capitulosExistentes++;
        } else {
          const ins = await client.query(
            `INSERT INTO capitulos (clave, nombre, funcion_id) VALUES ($1, $2, $3) RETURNING id`,
            [c.clave, c.nombre, funcionId]
          );
          capituloId = ins.rows[0].id;
          capitulosCreados++;
        }

        for (const p of c.partidas) {
          let partidaId: number;
          const pExistente = await client.query(
            `SELECT id FROM partidas WHERE clave = $1 AND capitulo_id = $2`,
            [p.clave, capituloId]
          );
          if (pExistente.rows.length) {
            partidaId = pExistente.rows[0].id;
            partidasExistentes++;
          } else {
            const ins = await client.query(
              `INSERT INTO partidas (clave, descripcion, capitulo_id) VALUES ($1, $2, $3) RETURNING id`,
              [p.clave, p.descripcion, capituloId]
            );
            partidaId = ins.rows[0].id;
            partidasCreadas++;
          }

          await client.query(
            `INSERT INTO linea_base (partida_id, fecha_corte, original, modificado, ministrado, pre_compromiso, comprometido, devengado, ejercido, pagado, por_ejercer, disponible)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             ON CONFLICT (partida_id, fecha_corte) DO UPDATE SET
               original = EXCLUDED.original, modificado = EXCLUDED.modificado, ministrado = EXCLUDED.ministrado,
               pre_compromiso = EXCLUDED.pre_compromiso, comprometido = EXCLUDED.comprometido, devengado = EXCLUDED.devengado,
               ejercido = EXCLUDED.ejercido, pagado = EXCLUDED.pagado, por_ejercer = EXCLUDED.por_ejercer, disponible = EXCLUDED.disponible`,
            [partidaId, fechaCorte, p.original, p.modificado, p.ministrado, p.pre_compromiso, p.comprometido, p.devengado, p.ejercido, p.pagado, p.por_ejercer, p.disponible]
          );
          lineaBaseInsertadas++;
        }
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      ok: true,
      resumen: { funcionesCreadas, funcionesExistentes, capitulosCreados, capitulosExistentes, partidasCreadas, partidasExistentes, lineaBaseInsertadas },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: err.message || 'Error al confirmar la carga' }, { status: 500 });
  } finally {
    client.release();
  }
}
