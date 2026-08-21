import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { analizarTextoCorte } from '@/lib/analizadorCorte';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const archivo = formData.get('archivo') as File | null;
    const ejercicio = Number(formData.get('ejercicio')) || new Date().getFullYear();

    if (!archivo) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const bytes = await archivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const parser = new PDFParse({ data: buffer });
    const resultadoPdf = await parser.getText();

    const analisis = analizarTextoCorte(resultadoPdf.text);

    // Comparar cada función/partida contra el catálogo ya existente en la BD.
    if (analisis.dependencia && analisis.fondo) {
      for (const f of analisis.funciones) {
        const funcionExistente = await pool.query(
          `SELECT id FROM funciones WHERE clave = $1 AND ejercicio = $2 AND dependencia = $3 AND fondo = $4`,
          [f.clave, ejercicio, analisis.dependencia.clave, analisis.fondo.clave]
        );
        (f as any).estadoFuncion = funcionExistente.rows.length ? 'existente' : 'nueva';
        const funcionId = funcionExistente.rows[0]?.id ?? null;

        for (const c of f.capitulos) {
          let capituloId: number | null = null;
          if (funcionId) {
            const capExistente = await pool.query(
              `SELECT id FROM capitulos WHERE clave = $1 AND funcion_id = $2`,
              [c.clave, funcionId]
            );
            capituloId = capExistente.rows[0]?.id ?? null;
          }
          (c as any).estadoCapitulo = capituloId ? 'existente' : 'nueva';

          for (const p of c.partidas) {
            (p as any).estadoPartida = 'nueva_funcion_o_capitulo';
            (p as any).ministradoAnterior = null;
            if (capituloId) {
              const partidaExistente = await pool.query(
                `SELECT p.id FROM partidas p WHERE p.clave = $1 AND p.capitulo_id = $2`,
                [p.clave, capituloId]
              );
              const partidaId = partidaExistente.rows[0]?.id ?? null;
              if (!partidaId) {
                (p as any).estadoPartida = 'nueva';
              } else {
                const lb = await pool.query(
                  `SELECT ministrado FROM linea_base WHERE partida_id = $1 ORDER BY fecha_corte DESC LIMIT 1`,
                  [partidaId]
                );
                const ministradoAnterior = lb.rows[0] ? Number(lb.rows[0].ministrado) : null;
                (p as any).ministradoAnterior = ministradoAnterior;
                if (ministradoAnterior === null) {
                  (p as any).estadoPartida = 'sin_corte_previo';
                } else if (Math.abs(ministradoAnterior - p.ministrado) < 0.5) {
                  (p as any).estadoPartida = 'coincide';
                } else {
                  (p as any).estadoPartida = 'diferente';
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, nombreArchivo: archivo.name, ejercicio, analisis });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al analizar el PDF' }, { status: 500 });
  }
}

