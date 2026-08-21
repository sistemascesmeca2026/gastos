// Analizador del "Estado Presupuestal General del Ejercicio" (PDF oficial de
// Planeación). Extrae Dependencia, Fondo, y cada Función con sus Capítulos y
// Partidas (10 columnas). No escribe nada en la base de datos — solo produce
// una estructura para mostrar en vista previa.

export type PartidaExtraida = {
  clave: string;
  descripcion: string;
  original: number;
  modificado: number;
  ministrado: number;
  pre_compromiso: number;
  comprometido: number;
  devengado: number;
  ejercido: number;
  pagado: number;
  por_ejercer: number;
  disponible: number;
};

export type CapituloExtraido = {
  clave: string;
  nombre: string;
  partidas: PartidaExtraida[];
};

export type FuncionExtraida = {
  clave: string;
  nombre: string;
  capitulos: CapituloExtraido[];
};

export type ResultadoAnalisis = {
  dependencia: { clave: string; nombre: string } | null;
  fondo: { clave: string; nombre: string } | null;
  funciones: FuncionExtraida[];
  totalMinistradoCalculado: number;
  totalMinistradoDelPDF: number | null;
  coincide: boolean | null;
  lineasNoReconocidas: string[];
};

const LINEAS_BASURA = [
  /^UNIVERSIDAD AUT[ÓO]NOMA DE CIENCIAS Y ARTES DE CHIAPAS$/,
  /^UNIVERSIDAD DE CIENCIAS Y ARTES DE CHIAPAS$/,
  /^DIRECCI[ÓO]N GENERAL DE PLANEACI[ÓO]N$/,
  /^DEPARTAMENTO DE PROGRAMACI[ÓO]N Y PRESUPUESTO$/,
  /^ESTADO PRESUPUESTAL GENERAL DEL EJERCICIO \d+$/,
  /^Partida\s+Descripci[óo]n\s+Original/i,
  /^--\s*\d+\s+of\s+\d+\s*--$/,
  /^Powered by TCPDF/i,
  /^Fecha de Impresi[óo]n/i,
  /^P[áa]gina \d+ de \d+$/i,
];

const NUM = '(-?[\\d,]+\\.\\d{2})';
const FILA_10_NUM = new RegExp(
  `^(.*?)\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}$`
);
const PARTIDA_CODIGO = /^(\d{4,6})\s+(.*)$/;

function num(s: string): number {
  return parseFloat(s.replace(/,/g, ''));
}

export function analizarTextoCorte(rawText: string): ResultadoAnalisis {
  const lineas = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !LINEAS_BASURA.some((re) => re.test(l)));

  let dependencia: { clave: string; nombre: string } | null = null;
  let fondo: { clave: string; nombre: string } | null = null;
  const funciones: FuncionExtraida[] = [];
  let funcionActual: FuncionExtraida | null = null;
  let capituloActual: CapituloExtraido | null = null;
  let bufferDescripcion: { clave: string; texto: string } | null = null;
  let totalMinistradoDelPDF: number | null = null;
  const lineasNoReconocidas: string[] = [];

  for (const linea of lineas) {
    if (linea.startsWith('Dependencia:')) {
      const m = linea.match(/^Dependencia:\s*(\d+)\s+(.+)$/);
      if (m) dependencia = { clave: m[1], nombre: m[2].trim() };
      continue;
    }
    if (linea.startsWith('Fondo:')) {
      const m = linea.match(/^Fondo:\s*(\d+)\s+(.+)$/);
      if (m) fondo = { clave: m[1], nombre: m[2].trim() };
      continue;
    }
    if (linea.startsWith('Función:') || linea.startsWith('Funci\u00f3n:')) {
      const m = linea.match(/^Funci[oó]n:\s*(\S+)\s+(.+)$/);
      if (m) {
        const claveF = m[1];
        const existente = funciones.find((f) => f.clave === claveF);
        if (existente) {
          funcionActual = existente;
        } else {
          funcionActual = { clave: claveF, nombre: m[2].trim(), capitulos: [] };
          funciones.push(funcionActual);
        }
        capituloActual = null;
      }
      continue;
    }
    if (linea.startsWith('Capítulo:') || linea.startsWith('Cap\u00edtulo:')) {
      const m = linea.match(/^Cap[ií]tulo:\s*(\d+)\s+(.+)$/);
      if (m && funcionActual) {
        const claveC = m[1];
        const existente = funcionActual.capitulos.find((c) => c.clave === claveC);
        if (existente) {
          capituloActual = existente;
        } else {
          capituloActual = { clave: claveC, nombre: m[2].trim(), partidas: [] };
          funcionActual.capitulos.push(capituloActual);
        }
      }
      continue;
    }
    if (
      /^Subtotal cap[ií]tulo/i.test(linea) ||
      /^Subtotal funci[oó]n/i.test(linea) ||
      /^Subtotal fondo/i.test(linea) ||
      /^Subtotal dependencia/i.test(linea)
    ) {
      continue;
    }
    if (/^Total\s/i.test(linea) || linea === 'Total') {
      const m = linea.match(FILA_10_NUM);
      if (m) totalMinistradoDelPDF = num(m[4]); // columna 3 = Ministrado (0-indexado: original,modificado,ministrado)
      continue;
    }

    const inicioPartida = linea.match(PARTIDA_CODIGO);
    if (inicioPartida && !bufferDescripcion) {
      bufferDescripcion = { clave: inicioPartida[1], texto: inicioPartida[2] };
    } else if (bufferDescripcion) {
      bufferDescripcion.texto += ' ' + linea;
    } else {
      lineasNoReconocidas.push(linea);
      continue;
    }

    const m = bufferDescripcion.texto.match(FILA_10_NUM);
    if (m && capituloActual) {
      const descripcion = m[1].trim();
      const valores = m.slice(2).map(num);
      capituloActual.partidas.push({
        clave: bufferDescripcion.clave,
        descripcion,
        original: valores[0],
        modificado: valores[1],
        ministrado: valores[2],
        pre_compromiso: valores[3],
        comprometido: valores[4],
        devengado: valores[5],
        ejercido: valores[6],
        pagado: valores[7],
        por_ejercer: valores[8],
        disponible: valores[9],
      });
      bufferDescripcion = null;
    }
  }

  let totalMinistradoCalculado = 0;
  for (const f of funciones) {
    for (const c of f.capitulos) {
      for (const p of c.partidas) totalMinistradoCalculado += p.ministrado;
    }
  }
  totalMinistradoCalculado = Math.round(totalMinistradoCalculado * 100) / 100;

  const coincide =
    totalMinistradoDelPDF !== null
      ? Math.abs(totalMinistradoDelPDF - totalMinistradoCalculado) < 0.5
      : null;

  return {
    dependencia,
    fondo,
    funciones,
    totalMinistradoCalculado,
    totalMinistradoDelPDF,
    coincide,
    lineasNoReconocidas,
  };
}
