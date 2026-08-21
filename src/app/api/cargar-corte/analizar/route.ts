import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { analizarTextoCorte } from '@/lib/analizadorCorte';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const archivo = formData.get('archivo') as File | null;
    if (!archivo) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const bytes = await archivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const parser = new PDFParse({ data: buffer });
    const resultadoPdf = await parser.getText();

    const analisis = analizarTextoCorte(resultadoPdf.text);

    return NextResponse.json({ ok: true, nombreArchivo: archivo.name, analisis });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al analizar el PDF' }, { status: 500 });
  }
}
