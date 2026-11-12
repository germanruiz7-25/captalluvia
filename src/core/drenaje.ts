/**
 * Canaletas y bajantes.
 *
 * 1. Caudal de diseño por el método racional:  Q [L/s] = C × i [mm/h] × A [m²] / 3600
 * 2. Capacidad de la canaleta semicircular con la ecuación de Manning, llenando hasta
 *    el 75 % del radio (25 % de borde libre).
 * 3. Capacidad de cada bajante con la ecuación de Wyly y Eaton para tubos verticales,
 *    con un llenado de 1/3 de la sección:  Q [L/s] = 3.14×10⁻⁴ × r^(5/3) × D^(8/3), D en mm.
 * 4. Con esa capacidad se obtienen los m² de techo que evacua cada bajante y cuántas
 *    bajantes necesita cada canaleta. Se compara con la tabla de los fabricantes de
 *    canales de PVC del mercado de Guatemala y se usa el valor más exigente.
 * 5. Se sugiere el tipo de canal comercial (colonial o alto caudal) que corresponde.
 *
 * Los diámetros que resultan son una SUGERENCIA MÍNIMA: el diseñador decide.
 */

import type { NumeroAguas } from './techo';

/** Caudal por el método racional, en L/s. */
export function caudalRacionalLs(c: number, intensidadMmH: number, areaM2: number): number {
  return (Math.max(0, c) * Math.max(0, intensidadMmH) * Math.max(0, areaM2)) / 3600;
}

/** Área de techo (m²) cuyo caudal de diseño equivale a `caudalLs`. */
export function areaParaCaudalM2(caudalLs: number, c: number, intensidadMmH: number): number {
  const d = c * intensidadMmH;
  return d > 0 ? (caudalLs * 3600) / d : 0;
}

/**
 * Capacidad (L/s) de una canaleta semicircular de diámetro `diametroM`,
 * con pendiente `pendiente` (m/m), rugosidad de Manning `n` y tirante igual a
 * `llenado` × radio (por defecto 0.75: 25 % de borde libre).
 */
export function capacidadCanaletaLs(diametroM: number, pendiente: number, n: number, llenado = 0.75): number {
  const r = diametroM / 2;
  const y = Math.min(1, Math.max(0, llenado)) * r;
  if (r <= 0 || y <= 0 || pendiente <= 0 || n <= 0) return 0;
  const theta = 2 * Math.acos((r - y) / r); // ángulo del segmento mojado
  const area = (r * r * (theta - Math.sin(theta))) / 2;
  const perimetro = r * theta;
  const radioHidraulico = area / perimetro;
  const q = (1 / n) * area * Math.pow(radioHidraulico, 2 / 3) * Math.sqrt(pendiente);
  return q * 1000;
}

/**
 * Capacidad (L/s) de un canal de sección rectangular (Manning). `anchoM` es el fondo y
 * `altoM` la altura del lado más bajo (por donde rebalsaría); el tirante es
 * `llenado` × altoM (por defecto 0.75: 25 % de borde libre).
 */
export function capacidadCanalRectangularLs(anchoM: number, altoM: number, pendiente: number, n: number, llenado = 0.75): number {
  const y = Math.min(1, Math.max(0, llenado)) * altoM;
  if (anchoM <= 0 || y <= 0 || pendiente <= 0 || n <= 0) return 0;
  const area = anchoM * y;
  const radioHidraulico = area / (anchoM + 2 * y);
  return (1 / n) * area * Math.pow(radioHidraulico, 2 / 3) * Math.sqrt(pendiente) * 1000;
}

/** Sección de un canal comercial (mm), tratada como rectángulo para el cálculo. */
export interface SeccionRectangular {
  nombre: string;
  /** Fondo del canal. */
  anchoMm: number;
  /** Altura del lado más bajo (por donde rebalsa). */
  altoBajoMm: number;
  /** Altura del lado más alto. */
  altoAltoMm: number;
  /** Forma del lado alto, solo para el dibujo. */
  perfil: 'recto' | 'colonial';
}

/** Canal Colonial de Amanco Wavin, según su ficha técnica (fondo 100, lados 90 y 130 mm). */
export const CANAL_COLONIAL_WAVIN: SeccionRectangular = {
  nombre: 'Canal Colonial (Amanco Wavin)',
  anchoMm: 100,
  altoBajoMm: 90,
  altoAltoMm: 130,
  perfil: 'colonial',
};

/** Canal Alto Caudal de Amanco Wavin, según su ficha técnica. */
export const CANAL_ALTO_CAUDAL_WAVIN: SeccionRectangular = {
  nombre: 'Canal Alto Caudal (Amanco Wavin)',
  anchoMm: 151.2,
  altoBajoMm: 90.72,
  altoAltoMm: 136.08,
  perfil: 'recto',
};

export interface EvaluacionRectangular {
  capacidadLs: number;
  tiranteMm: number;
  /** m² de techo que puede servir cada tramo con la lluvia de diseño. */
  areaPorTramoM2: number;
  cumple: boolean;
}

/** Revisa un canal rectangular contra el caudal de cada tramo. */
export function evaluarCanalRectangular(
  seccion: Pick<SeccionRectangular, 'anchoMm' | 'altoBajoMm'>,
  caudalTramoLs: number,
  pendientePct: number,
  material: MaterialCanaleta,
  c: number,
  intensidadMmH: number,
): EvaluacionRectangular {
  const capacidadLs = capacidadCanalRectangularLs(
    seccion.anchoMm / 1000,
    seccion.altoBajoMm / 1000,
    Math.max(0, pendientePct) / 100,
    MATERIALES_CANALETA[material].n,
  );
  return {
    capacidadLs,
    tiranteMm: 0.75 * seccion.altoBajoMm,
    areaPorTramoM2: areaParaCaudalM2(capacidadLs, c, intensidadMmH),
    cumple: capacidadLs > 0 && capacidadLs >= caudalTramoLs,
  };
}

/**
 * Constante de Wyly y Eaton en unidades métricas. La forma original es
 * Q [gpm] = 27.8 × r^(5/3) × d^(8/3) con d en pulgadas; aquí Q en L/s y D en mm (≈ 3.14×10⁻⁴).
 */
const K_WYLY_EATON = (27.8 * 0.0630902) / Math.pow(25.4, 8 / 3);

/** Capacidad (L/s) de una bajante vertical (Wyly y Eaton), diámetro interior en mm. */
export function capacidadBajanteLs(diametroInteriorMm: number, llenado = 1 / 3): number {
  if (diametroInteriorMm <= 0) return 0;
  return K_WYLY_EATON * Math.pow(llenado, 5 / 3) * Math.pow(diametroInteriorMm, 8 / 3);
}

export interface Diametro {
  nombre: string;
  /** Diámetro interior aproximado (mm). */
  interiorMm: number;
}

export interface DiametroTubo extends Diametro {
  /** Diámetro exterior del tubo PVC (mm). */
  exteriorMm: number;
  /** m² de techo por bajante según las tablas de los fabricantes (null si no la publican). */
  m2Fabricante: number | null;
}

/**
 * Tubería PVC para bajantes: diámetro nominal, exterior e interior aproximado.
 * m² por bajante: tablas de Durman (Catálogo de canales para techo, 2024) y
 * Amanco Wavin (Ficha técnica Canales de PVC), que coinciden: 2" → 20 m², 3" → 60 m², 4" → 120 m².
 */
export const BAJANTES: DiametroTubo[] = [
  { nombre: '2"', exteriorMm: 60.3, interiorMm: 54, m2Fabricante: 20 },
  { nombre: '3"', exteriorMm: 88.9, interiorMm: 82, m2Fabricante: 60 },
  { nombre: '4"', exteriorMm: 114.3, interiorMm: 107, m2Fabricante: 120 },
  { nombre: '6"', exteriorMm: 168.3, interiorMm: 158, m2Fabricante: null },
];

export type TipoCanal = 'colonial' | 'alto';

export interface LineaCanal {
  tipo: TipoCanal;
  marca: string;
  modelo: string;
  largosM: number[];
  bajantes: string;
}

/** Canales de PVC que se venden en Guatemala (verificar existencias con el distribuidor). */
export const CANALES_MERCADO: LineaCanal[] = [
  { tipo: 'colonial', marca: 'Amanco Wavin', modelo: 'Canal Colonial (fondo 100 mm, lados de 90 y 130 mm)', largosM: [3, 4, 6], bajantes: 'Redonda 50, 75 o 100 mm; rectangular 60 × 100 mm' },
  { tipo: 'colonial', marca: 'Durman', modelo: 'Estilo Clásico / Estilo Tradicional', largosM: [2, 3, 6], bajantes: 'Redonda 2" o 3"; rectangular 3½ × 2"' },
  { tipo: 'alto', marca: 'Amanco Wavin', modelo: 'Canal Alto Caudal (fondo 151.2 mm, lados de 90.7 y 136.1 mm)', largosM: [3, 4, 6], bajantes: 'Redonda 50, 75 o 100 mm; rectangular 60 × 100 mm' },
  { tipo: 'alto', marca: 'Durman', modelo: 'MaxiCanal (máximo caudal)', largosM: [3, 4, 6], bajantes: 'Redonda 3" o 4"' },
];

export const NOMBRES_TIPO_CANAL: Record<TipoCanal, string> = {
  colonial: 'Canal tipo colonial',
  alto: 'Canal de alto caudal',
};

/**
 * Criterio de la app: se sugiere el canal tipo colonial si bastan bajantes de 3" (1 o 2 por
 * canaleta) y su sección (Canal Colonial de Amanco Wavin) lleva el caudal de cada tramo.
 * Si no, canal de alto caudal con bajantes de 4", agregando bajantes si el canal no alcanza.
 */
export const SECCIONES_COMERCIALES: Record<TipoCanal, SeccionRectangular> = {
  colonial: CANAL_COLONIAL_WAVIN,
  alto: CANAL_ALTO_CAUDAL_WAVIN,
};

/**
 * Largo máximo de canaleta que drena a una bajante (m). Práctica constructiva común: una bajante como
 * máximo cada 10 a 12 m de canal. Más largo, el desnivel por pendiente se acumula (0.5 % × 12 m = 6 cm),
 * el canal se carga al final del tramo y se tapa con más facilidad.
 */
export const TRAMO_MAXIMO_M = 12;

/** Diámetro de bajante más pequeño que se sugiere en la práctica (menos riesgo de taparse). */
export const BAJANTE_MINIMA_PRACTICA = '3"';

/** Canaletas semicirculares comerciales (ancho = diámetro). */
export const CANALETAS: Diametro[] = [
  { nombre: '4" (10 cm)', interiorMm: 100 },
  { nombre: '5" (12.5 cm)', interiorMm: 125 },
  { nombre: '6" (15 cm)', interiorMm: 150 },
  { nombre: '8" (20 cm)', interiorMm: 200 },
];

export const MATERIALES_CANALETA = {
  pvc: { nombre: 'PVC', n: 0.011 },
  lamina: { nombre: 'Lámina galvanizada', n: 0.013 },
} as const;
export type MaterialCanaleta = keyof typeof MATERIALES_CANALETA;

export interface EntradaDrenaje {
  /** Área total del techo en planta (m²). */
  areaM2: number;
  /** Largo del techo = largo de cada canaleta (m). */
  largoM: number;
  aguas: NumeroAguas;
  /** Coeficiente de escorrentía del techo. */
  c: number;
  /** Intensidad de lluvia de diseño (mm/h). */
  intensidadMmH: number;
  /** Pendiente de la canaleta en %. */
  pendientePct: number;
  material: MaterialCanaleta;
  /** Largo máximo de canaleta por bajante (m); por defecto TRAMO_MAXIMO_M. */
  tramoMaximoM?: number;
}

export interface OpcionBajante {
  nombre: string;
  interiorMm: number;
  exteriorMm: number;
  capacidadLs: number;
  /** m² de techo que evacua una bajante con la lluvia de diseño. */
  areaQueEvacuaM2: number;
  /** m² por bajante según el fabricante (null si no hay dato). */
  areaFabricanteM2: number | null;
  /** Bajantes por canaleta: el valor más exigente entre el cálculo, la tabla del fabricante y el largo. */
  porCanaleta: number;
  /** Bajantes por canaleta que pide solo el caudal (cálculo o fabricante). */
  porCaudal: number;
  total: number;
  /** Cumple el diámetro mínimo práctico. */
  practica: boolean;
}

export interface OpcionCanaleta {
  nombre: string;
  diametroMm: number;
  capacidadLs: number;
  /** m² de techo que puede servir cada tramo con la lluvia de diseño. */
  areaPorTramoM2: number;
  cumple: boolean;
}

export interface ResultadoDrenaje {
  numeroCanaletas: number;
  /** Bajantes por canaleta que pide el largo: una cada TRAMO_MAXIMO_M como máximo. */
  bajantesPorLargo: number;
  tramoMaximoM: number;
  /** Qué decide el número de bajantes de la sugerida. */
  motivoBajantes: 'caudal' | 'largo';
  areaPorCanaletaM2: number;
  caudalTotalLs: number;
  caudalPorCanaletaLs: number;
  bajantes: OpcionBajante[];
  /** Índice de la bajante sugerida en `bajantes`. */
  bajanteSugerida: number;
  /** Caudal que lleva cada tramo de canaleta con la bajante sugerida. */
  caudalPorTramoLs: number;
  /** Largo de canaleta que atiende cada bajante (m). */
  tramoM: number;
  canaletas: OpcionCanaleta[];
  /** Índice de la canaleta sugerida en `canaletas` (-1 si ninguna alcanza). */
  canaletaSugerida: number;
  longitudTotalCanaletaM: number;
  /** Tipo de canal comercial sugerido. */
  tipoCanal: TipoCanal;
  /** Productos del mercado que corresponden al tipo sugerido. */
  lineasSugeridas: LineaCanal[];
  /** Sección comercial de referencia del tipo sugerido y su capacidad por tramo. */
  seccionComercial: SeccionRectangular;
  capacidadComercialLs: number;
}

export function disenarDrenaje(e: EntradaDrenaje): ResultadoDrenaje {
  const numeroCanaletas = e.aguas;
  const areaPorCanaletaM2 = e.areaM2 / numeroCanaletas;
  const caudalTotalLs = caudalRacionalLs(e.c, e.intensidadMmH, e.areaM2);
  const caudalPorCanaletaLs = caudalTotalLs / numeroCanaletas;
  const tramoMaximoM = e.tramoMaximoM && e.tramoMaximoM > 0 ? e.tramoMaximoM : TRAMO_MAXIMO_M;
  const bajantesPorLargo = Math.max(1, Math.ceil(e.largoM / tramoMaximoM - 1e-9));

  const bajantes: OpcionBajante[] = BAJANTES.map((d) => {
    const capacidadLs = capacidadBajanteLs(d.interiorMm);
    const porCalculo = caudalPorCanaletaLs > 0 ? Math.ceil(caudalPorCanaletaLs / capacidadLs - 1e-9) : 1;
    const porFabricante = d.m2Fabricante ? Math.ceil(areaPorCanaletaM2 / d.m2Fabricante - 1e-9) : 1;
    const porCaudal = Math.max(1, porCalculo, porFabricante);
    const porCanaleta = Math.max(porCaudal, bajantesPorLargo);
    return {
      nombre: d.nombre,
      interiorMm: d.interiorMm,
      exteriorMm: d.exteriorMm,
      capacidadLs,
      areaQueEvacuaM2: areaParaCaudalM2(capacidadLs, e.c, e.intensidadMmH),
      areaFabricanteM2: d.m2Fabricante,
      porCanaleta,
      porCaudal,
      total: porCanaleta * numeroCanaletas,
      practica: d.interiorMm >= (BAJANTES.find((b) => b.nombre === BAJANTE_MINIMA_PRACTICA)?.interiorMm ?? 0),
    };
  });

  const n = MATERIALES_CANALETA[e.material].n;
  const pendiente = Math.max(0, e.pendientePct) / 100;
  const capacidades = CANALETAS.map((d) => capacidadCanaletaLs(d.interiorMm / 1000, pendiente, n));
  const canaletaMinima = (caudalTramoLs: number) => capacidades.findIndex((q) => q >= caudalTramoLs);

  const capacidadDe = (t: TipoCanal) =>
    capacidadCanalRectangularLs(
      SECCIONES_COMERCIALES[t].anchoMm / 1000,
      SECCIONES_COMERCIALES[t].altoBajoMm / 1000,
      pendiente,
      n,
    );

  // 1) Canal tipo colonial: bajantes de 3" (1 o 2 por canaleta) y la sección colonial alcanza.
  // 2) Si no: canal de alto caudal con bajantes de 4"; se agregan bajantes si el canal no alcanza.
  const i3 = bajantes.findIndex((b) => b.nombre === '3"');
  const i4 = bajantes.findIndex((b) => b.nombre === '4"');
  // El caudal decide el tipo de canal; si el largo pide más bajantes, el canal colonial sigue valiendo.
  const colonial =
    bajantes[i3].porCaudal <= 2 && capacidadDe('colonial') >= caudalPorCanaletaLs / bajantes[i3].porCanaleta - 1e-9;
  const tipoCanal: TipoCanal = colonial ? 'colonial' : 'alto';
  if (!colonial) {
    const capAlto = capacidadDe('alto');
    const minimo = capAlto > 0 ? Math.ceil(caudalPorCanaletaLs / capAlto - 1e-9) : 1;
    bajantes[i4].porCaudal = Math.max(bajantes[i4].porCaudal, minimo);
    if (minimo > bajantes[i4].porCanaleta) {
      bajantes[i4].porCanaleta = minimo;
      bajantes[i4].total = minimo * numeroCanaletas;
    }
  }
  const bajanteSugerida = colonial ? i3 : i4;
  const elegida = bajantes[bajanteSugerida];

  const caudalPorTramoLs = caudalPorCanaletaLs / elegida.porCanaleta;
  const tramoM = e.largoM / elegida.porCanaleta;

  const canaletas: OpcionCanaleta[] = CANALETAS.map((d, i) => ({
    nombre: d.nombre,
    diametroMm: d.interiorMm,
    capacidadLs: capacidades[i],
    areaPorTramoM2: areaParaCaudalM2(capacidades[i], e.c, e.intensidadMmH),
    cumple: capacidades[i] >= caudalPorTramoLs,
  }));

  return {
    numeroCanaletas,
    bajantesPorLargo,
    tramoMaximoM,
    motivoBajantes: elegida.porCanaleta === bajantesPorLargo && bajantesPorLargo > elegida.porCaudal ? 'largo' : 'caudal',
    areaPorCanaletaM2,
    caudalTotalLs,
    caudalPorCanaletaLs,
    bajantes,
    bajanteSugerida,
    caudalPorTramoLs,
    tramoM,
    canaletas,
    canaletaSugerida: canaletas.findIndex((c) => c.cumple),
    longitudTotalCanaletaM: e.largoM * numeroCanaletas,
    tipoCanal,
    lineasSugeridas: CANALES_MERCADO.filter((l) => l.tipo === tipoCanal),
    seccionComercial: SECCIONES_COMERCIALES[tipoCanal],
    capacidadComercialLs: capacidadDe(tipoCanal),
  };
}

// ---------------------------------------------------------------------------
// Simulador: cómo responde el canal y la bajante cuando sube la intensidad.
// ---------------------------------------------------------------------------

/** Intensidad (mm/h) con la que un caudal dado se alcanza sobre un área: i = 3600·Q / (C·A). */
export function intensidadParaCaudal(caudalLs: number, c: number, areaM2: number): number {
  return c > 0 && areaM2 > 0 ? (caudalLs * 3600) / (c * areaM2) : Infinity;
}

/**
 * Llenado del canal rectangular (fracción de la altura del lado bajo) para un caudal.
 * Devuelve un valor mayor que 1 cuando el canal rebalsa (caudal / capacidad a sección llena).
 */
export function llenadoCanalRectangular(anchoM: number, altoM: number, pendiente: number, n: number, caudalLs: number): number {
  if (caudalLs <= 0) return 0;
  const lleno = capacidadCanalRectangularLs(anchoM, altoM, pendiente, n, 1);
  if (lleno <= 0) return Infinity;
  if (caudalLs >= lleno) return caudalLs / lleno;
  let bajo = 0;
  let alto = 1;
  for (let k = 0; k < 60; k++) {
    const medio = (bajo + alto) / 2;
    if (capacidadCanalRectangularLs(anchoM, altoM, pendiente, n, medio) < caudalLs) bajo = medio;
    else alto = medio;
  }
  return (bajo + alto) / 2;
}

export type EstadoCanal = 'holgado' | 'borde' | 'rebalsa';

export interface EntradaSimulacion {
  /** m² de techo que llegan a cada tramo (a cada bajante). */
  areaTramoM2: number;
  c: number;
  seccion: Pick<SeccionRectangular, 'anchoMm' | 'altoBajoMm'>;
  pendientePct: number;
  material: MaterialCanaleta;
  /** Capacidad de la bajante elegida (L/s). */
  capacidadBajanteLs: number;
}

export interface Simulacion {
  intensidadMmH: number;
  caudalTramoLs: number;
  /** Fracción de la altura del lado bajo (>1 = rebalsa). */
  llenado: number;
  estadoCanal: EstadoCanal;
  /** Caudal / capacidad de la bajante. */
  usoBajante: number;
}

export interface LimitesSimulacion {
  /** Intensidad hasta la que el canal trabaja dentro del diseño (3/4 del lado bajo). */
  canalDisenoMmH: number;
  /** Intensidad a partir de la cual el canal rebalsa (lleno hasta el lado bajo). */
  canalRebalsaMmH: number;
  /** Intensidad a partir de la cual la bajante se satura. */
  bajanteMmH: number;
  /** Qué falla primero. */
  fallaPrimero: 'canal' | 'bajante';
}

export function limitesSimulacion(e: EntradaSimulacion): LimitesSimulacion {
  const b = e.seccion.anchoMm / 1000;
  const h = e.seccion.altoBajoMm / 1000;
  const s = Math.max(0, e.pendientePct) / 100;
  const n = MATERIALES_CANALETA[e.material].n;
  const canalDisenoMmH = intensidadParaCaudal(capacidadCanalRectangularLs(b, h, s, n, 0.75), e.c, e.areaTramoM2);
  const canalRebalsaMmH = intensidadParaCaudal(capacidadCanalRectangularLs(b, h, s, n, 1), e.c, e.areaTramoM2);
  const bajanteMmH = intensidadParaCaudal(e.capacidadBajanteLs, e.c, e.areaTramoM2);
  return { canalDisenoMmH, canalRebalsaMmH, bajanteMmH, fallaPrimero: bajanteMmH < canalRebalsaMmH ? 'bajante' : 'canal' };
}

export function simularIntensidad(e: EntradaSimulacion, intensidadMmH: number): Simulacion {
  const caudalTramoLs = caudalRacionalLs(e.c, Math.max(0, intensidadMmH), e.areaTramoM2);
  const llenado = llenadoCanalRectangular(
    e.seccion.anchoMm / 1000,
    e.seccion.altoBajoMm / 1000,
    Math.max(0, e.pendientePct) / 100,
    MATERIALES_CANALETA[e.material].n,
    caudalTramoLs,
  );
  const estadoCanal: EstadoCanal = llenado > 1 + 1e-9 ? 'rebalsa' : llenado > 0.75 + 1e-9 ? 'borde' : 'holgado';
  return {
    intensidadMmH,
    caudalTramoLs,
    llenado,
    estadoCanal,
    usoBajante: e.capacidadBajanteLs > 0 ? caudalTramoLs / e.capacidadBajanteLs : Infinity,
  };
}
