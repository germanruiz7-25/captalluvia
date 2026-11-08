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
  { tipo: 'colonial', marca: 'Amanco Wavin', modelo: 'Canal Colonial', largosM: [3, 4, 6], bajantes: 'Redonda 50, 75 o 100 mm; rectangular 60 × 100 mm' },
  { tipo: 'colonial', marca: 'Durman', modelo: 'Estilo Clásico / Estilo Tradicional', largosM: [2, 3, 6], bajantes: 'Redonda 2" o 3"; rectangular 3½ × 2"' },
  { tipo: 'alto', marca: 'Amanco Wavin', modelo: 'Canal Alto Caudal', largosM: [3, 4, 6], bajantes: 'Redonda 50, 75 o 100 mm; rectangular 60 × 100 mm' },
  { tipo: 'alto', marca: 'Durman', modelo: 'MaxiCanal (máximo caudal)', largosM: [3, 4, 6], bajantes: 'Redonda 3" o 4"' },
];

export const NOMBRES_TIPO_CANAL: Record<TipoCanal, string> = {
  colonial: 'Canal tipo colonial',
  alto: 'Canal de alto caudal',
};

/**
 * Criterio de la app: un canal tipo colonial se acepta si basta con bajantes de 3"
 * (1 o 2 por canaleta) y la sección semicircular equivalente no pasa de 5" (125 mm).
 * Si no, se sugiere un canal de alto caudal con bajantes de 4".
 */
export const EQUIVALENTE_MAX_COLONIAL_MM = 125;

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
  /** Bajantes por canaleta: el valor más exigente entre el cálculo y la tabla del fabricante. */
  porCanaleta: number;
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
}

export function disenarDrenaje(e: EntradaDrenaje): ResultadoDrenaje {
  const numeroCanaletas = e.aguas;
  const areaPorCanaletaM2 = e.areaM2 / numeroCanaletas;
  const caudalTotalLs = caudalRacionalLs(e.c, e.intensidadMmH, e.areaM2);
  const caudalPorCanaletaLs = caudalTotalLs / numeroCanaletas;

  const bajantes: OpcionBajante[] = BAJANTES.map((d) => {
    const capacidadLs = capacidadBajanteLs(d.interiorMm);
    const porCalculo = caudalPorCanaletaLs > 0 ? Math.ceil(caudalPorCanaletaLs / capacidadLs - 1e-9) : 1;
    const porFabricante = d.m2Fabricante ? Math.ceil(areaPorCanaletaM2 / d.m2Fabricante - 1e-9) : 1;
    const porCanaleta = Math.max(1, porCalculo, porFabricante);
    return {
      nombre: d.nombre,
      interiorMm: d.interiorMm,
      exteriorMm: d.exteriorMm,
      capacidadLs,
      areaQueEvacuaM2: areaParaCaudalM2(capacidadLs, e.c, e.intensidadMmH),
      areaFabricanteM2: d.m2Fabricante,
      porCanaleta,
      total: porCanaleta * numeroCanaletas,
      practica: d.interiorMm >= (BAJANTES.find((b) => b.nombre === BAJANTE_MINIMA_PRACTICA)?.interiorMm ?? 0),
    };
  });

  const n = MATERIALES_CANALETA[e.material].n;
  const pendiente = Math.max(0, e.pendientePct) / 100;
  const capacidades = CANALETAS.map((d) => capacidadCanaletaLs(d.interiorMm / 1000, pendiente, n));
  const canaletaMinima = (caudalTramoLs: number) => capacidades.findIndex((q) => q >= caudalTramoLs);

  // 1) Canal tipo colonial: bajantes de 3" (1 o 2 por canaleta) y sección equivalente ≤ 5".
  // 2) Si no alcanza: canal de alto caudal con bajantes de 4".
  const i3 = bajantes.findIndex((b) => b.nombre === '3"');
  const i4 = bajantes.findIndex((b) => b.nombre === '4"');
  const c3 = canaletaMinima(caudalPorCanaletaLs / bajantes[i3].porCanaleta);
  const colonial =
    bajantes[i3].porCanaleta <= 2 && c3 >= 0 && CANALETAS[c3].interiorMm <= EQUIVALENTE_MAX_COLONIAL_MM;
  const tipoCanal: TipoCanal = colonial ? 'colonial' : 'alto';
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
  };
}
