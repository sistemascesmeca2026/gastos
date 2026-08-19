// Filtro compartido para separar los datos de Patty Ruiz (CESMECA institucional,
// Fondo 0121) de los de Patty Ballinas (4 posgrados + Ingresos Propios Fondo 0130).
export function condicionEspacio(espacio: string | null, prefijo: string = ''): string {
  const p = prefijo ? `${prefijo}.` : '';
  if (espacio === 'ruiz') {
    return `${p}dependencia = '4008000' AND ${p}fondo = '0121'`;
  }
  if (espacio === 'ballinas') {
    return `(${p}dependencia IN ('4052050','4051990','4008010','4008020') OR (${p}dependencia = '4008000' AND ${p}fondo = '0130'))`;
  }
  return '';
}
