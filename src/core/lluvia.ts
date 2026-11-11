/**
 * Resumen de lluvia: promedios mensuales, total anual y días con lluvia,
 * a partir de una serie diaria (satélite/reanálisis o estación) o de datos mensuales.
 */

export const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

export const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/** Un día cuenta como "día con lluvia" (evento de primer descarte) desde este umbral. */
export const UMBRAL_DIA_LLUVIA_MM = 1;

/** Fracción mínima de días con dato para aceptar un mes de un año. */
export const COBERTURA_MINIMA_MES = 0.8;

export interface ResumenLluvia {
  /** Lluvia promedio de cada mes (mm), enero a diciembre. */
  mensualMm: number[];
  /** Días con lluvia ≥ 1 mm promedio de cada mes. */
  diasLluviaMes: number[];
  /** Suma de los promedios mensuales (mm/año). */
  anualMm: number;
  /** Días con lluvia promedio al año. */
  diasLluviaAnual: number;
  /** Años con datos usados en el promedio (0 si se ingresó a mano). */
  anios: number;
  anioInicio: number | null;
  anioFin: number | null;
  /** Meses sin ningún año válido (se tomaron como 0 mm). */
  mesesSinDatos: number[];
  fuente: string;
  /** Estaciones usadas cuando la lluvia viene de datos aportados por el usuario. */
  estaciones?: import('./estaciones').UsoEstacion[];
  /** Cómo se combinaron varias estaciones. */
  metodo?: import('./estaciones').MetodoCombinacion;
}

function diasDelMes(anio: number, mes0: number): number {
  return new Date(Date.UTC(anio, mes0 + 1, 0)).getUTCDate();
}

const suma = (xs: number[]) => xs.reduce((t, x) => t + x, 0);

/**
 * Resume una serie diaria de lluvia.
 * @param fechas fechas ISO "AAAA-MM-DD"
 * @param valores lluvia diaria en mm (null = sin dato)
 */
export function resumirSerieDiaria(
  fechas: string[],
  valores: (number | null)[],
  fuente: string,
): ResumenLluvia {
  if (fechas.length !== valores.length) {
    throw new Error('Las fechas y los valores de lluvia no tienen el mismo largo.');
  }
  // Acumulado por año y mes
  const porMes = new Map<string, { anio: number; mes: number; mm: number; validos: number; dias: number }>();
  for (let i = 0; i < fechas.length; i++) {
    const v = valores[i];
    const anio = Number(fechas[i].slice(0, 4));
    const mes = Number(fechas[i].slice(5, 7)) - 1;
    if (!Number.isFinite(anio) || mes < 0 || mes > 11) continue;
    const clave = `${anio}-${mes}`;
    const acc = porMes.get(clave) ?? { anio, mes, mm: 0, validos: 0, dias: 0 };
    if (v !== null && Number.isFinite(v) && v >= 0) {
      acc.mm += v;
      acc.validos += 1;
      if (v >= UMBRAL_DIA_LLUVIA_MM) acc.dias += 1;
    }
    porMes.set(clave, acc);
  }

  const totales: number[][] = Array.from({ length: 12 }, () => []);
  const dias: number[][] = Array.from({ length: 12 }, () => []);
  const aniosValidos = new Set<number>();
  for (const acc of porMes.values()) {
    if (acc.validos >= COBERTURA_MINIMA_MES * diasDelMes(acc.anio, acc.mes)) {
      // Se escala al mes completo si faltan pocos días
      const factor = diasDelMes(acc.anio, acc.mes) / acc.validos;
      totales[acc.mes].push(acc.mm * factor);
      dias[acc.mes].push(acc.dias * factor);
      aniosValidos.add(acc.anio);
    }
  }

  const prom = (xs: number[]) => (xs.length ? suma(xs) / xs.length : 0);
  const mensualMm = totales.map(prom);
  const diasLluviaMes = dias.map(prom);
  const anios = [...aniosValidos].sort((a, b) => a - b);
  return {
    mensualMm,
    diasLluviaMes,
    anualMm: suma(mensualMm),
    diasLluviaAnual: suma(diasLluviaMes),
    anios: anios.length,
    anioInicio: anios[0] ?? null,
    anioFin: anios.at(-1) ?? null,
    mesesSinDatos: totales.flatMap((xs, m) => (xs.length ? [] : [m])),
    fuente,
  };
}

/**
 * Resumen a partir de lluvia mensual escrita a mano.
 * Los días con lluvia del año se reparten entre los meses en proporción a su lluvia.
 */
export function resumirMensualManual(
  mensualMm: number[],
  diasLluviaAnual: number,
  fuente = 'Datos ingresados por el usuario',
): ResumenLluvia {
  const mm = Array.from({ length: 12 }, (_, i) => Math.max(0, Number(mensualMm[i]) || 0));
  const anual = suma(mm);
  const diasAnuales = Math.max(0, Number(diasLluviaAnual) || 0);
  const diasMes = mm.map((x) => (anual > 0 ? (diasAnuales * x) / anual : 0));
  return {
    mensualMm: mm,
    diasLluviaMes: diasMes,
    anualMm: anual,
    diasLluviaAnual: diasAnuales,
    anios: 0,
    anioInicio: null,
    anioFin: null,
    mesesSinDatos: [],
    fuente,
  };
}
