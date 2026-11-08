/**
 * Motor de cálculo del área de techo (captación) de CaptaLluvia.
 *
 * Todas las funciones son puras: no leen la interfaz ni la red,
 * así se pueden probar de forma aislada (ver tests/core/techo.test.ts).
 *
 * Unidades: lluvia en mm (= L/m²), áreas en m², volúmenes en m³.
 */

/** Coeficientes de escorrentía por material de techo (editables por el usuario). */
export const COEFICIENTES_ESCORRENTIA = {
  lamina_metalica: 0.9,
  teja_barro: 0.8,
  losa_concreto: 0.8,
  paja: 0.6,
} as const;

export type TipoTecho = keyof typeof COEFICIENTES_ESCORRENTIA;

export const NOMBRES_TECHO: Record<TipoTecho, string> = {
  lamina_metalica: 'Lámina metálica',
  teja_barro: 'Teja de barro',
  losa_concreto: 'Losa de concreto',
  paja: 'Paja',
};

/** Dotaciones de referencia en litros por persona al día. */
export const DOTACIONES = {
  basica_oms: 20,
  referencia_onu_minima: 50,
  referencia_onu_optima: 100,
} as const;

/** Demanda anual de la familia en m³. */
export function demandaAnualM3(
  personas: number,
  litrosPorPersonaDia: number,
  diasPorAnio = 365,
): number {
  if (personas <= 0 || litrosPorPersonaDia <= 0) return 0;
  return (personas * litrosPorPersonaDia * diasPorAnio) / 1000;
}

/**
 * Lluvia aprovechable en mm al año: lluvia × coeficiente de escorrentía,
 * menos el primer descarte (first flush) de cada evento de lluvia.
 */
export function lluviaAprovechableMm(
  lluviaAnualMm: number,
  coeficienteEscorrentia: number,
  eventosLluvia: number,
  descartePorEventoMm = 1,
): number {
  const neta = lluviaAnualMm * coeficienteEscorrentia - eventosLluvia * descartePorEventoMm;
  return Math.max(0, neta);
}

/**
 * Área mínima de techo (proyección horizontal, m²) que capta en un año
 * promedio el agua que la familia consume en un año.
 *
 * A_min = 1000 · V_demanda / (P · Ce − n · d_ff)
 *
 * Devuelve `null` si la lluvia aprovechable es cero (no hay área posible).
 */
export function areaMinimaM2(demandaM3: number, lluviaAprovechable: number): number | null {
  if (lluviaAprovechable <= 0) return null;
  return (1000 * demandaM3) / lluviaAprovechable;
}

/** Redondea hacia arriba al múltiplo de `paso` (por defecto 0.5 m). */
export function redondearArriba(valor: number, paso = 0.5): number {
  return Math.ceil(valor / paso - 1e-9) * paso;
}

export interface OpcionTecho {
  forma: 'casi_cuadrado' | 'rectangular' | 'alargado';
  nombre: string;
  /** Lado corto en m. */
  ancho: number;
  /** Lado largo en m (donde va la canaleta). */
  largo: number;
  /** ancho × largo en m². */
  area: number;
}

const FORMAS: { forma: OpcionTecho['forma']; nombre: string; proporcion: number }[] = [
  { forma: 'casi_cuadrado', nombre: 'Casi cuadrado', proporcion: 1 },
  { forma: 'rectangular', nombre: 'Rectangular', proporcion: 1.5 },
  { forma: 'alargado', nombre: 'Alargado', proporcion: 2 },
];

/**
 * Propone tres formas de techo que cubren al menos el área pedida.
 * El área se redondea primero al m² entero superior; luego cada lado
 * se redondea hacia arriba a 0.5 m.
 */
export function opcionesDeTecho(areaM2: number): OpcionTecho[] {
  if (!Number.isFinite(areaM2) || areaM2 <= 0) return [];
  const objetivo = Math.ceil(areaM2 - 1e-9);
  return FORMAS.map(({ forma, nombre, proporcion }) => {
    const a = redondearArriba(Math.sqrt(objetivo / proporcion));
    const b = redondearArriba(objetivo / a);
    const ancho = Math.min(a, b);
    const largo = Math.max(a, b);
    return { forma, nombre, ancho, largo, area: Math.round(ancho * largo * 100) / 100 };
  });
}

export interface EntradaTecho {
  personas: number;
  litrosPorPersonaDia: number;
  lluviaAnualMm: number;
  diasConLluvia: number;
  tipoTecho: TipoTecho;
  descartePorEventoMm?: number;
}

export interface ResultadoTecho {
  demandaM3: number;
  lluviaAprovechableMm: number;
  areaMinimaExactaM2: number | null;
  areaMinimaM2: number | null;
  opciones: OpcionTecho[];
}

/** Cálculo completo del área de techo a partir de los datos de la familia y del lugar. */
export function calcularTecho(e: EntradaTecho): ResultadoTecho {
  const ce = COEFICIENTES_ESCORRENTIA[e.tipoTecho];
  const demandaM3 = demandaAnualM3(e.personas, e.litrosPorPersonaDia);
  const aprovechable = lluviaAprovechableMm(
    e.lluviaAnualMm,
    ce,
    e.diasConLluvia,
    e.descartePorEventoMm ?? 1,
  );
  const exacta = areaMinimaM2(demandaM3, aprovechable);
  const redondeada = exacta === null ? null : Math.ceil(exacta - 1e-9);
  return {
    demandaM3,
    lluviaAprovechableMm: aprovechable,
    areaMinimaExactaM2: exacta,
    areaMinimaM2: redondeada,
    opciones: redondeada === null ? [] : opcionesDeTecho(redondeada),
  };
}
