/**
 * Curvas intensidad-duración-frecuencia (IDF) para la intensidad de diseño de canaletas.
 *
 * Fuente 1 (incluida): INSIVUMEH e ICC (2025). Curvas de intensidad, duración y frecuencia (IDF)
 * para la vertiente del Pacífico de Guatemala. 22 estaciones, ecuación I = A / (D + B)^n
 * (I en mm/h, D en minutos), parámetros de la distribución de Gumbel para T = 2, 5, 10, 25, 50
 * y 100 años. Valores transcritos de las tablas del documento.
 *
 * Fuente 2 (forma de Sherman con periodo de retorno, como la app de W. Bardales en Google Earth
 * Engine): I = K · T^m / (D + B)^n. La app enlaza a esa herramienta y permite escribir el valor.
 */

export const PERIODOS_RETORNO = [2, 5, 10, 25, 50, 100] as const;
export type PeriodoRetorno = (typeof PERIODOS_RETORNO)[number];
/** Duraciones cortas que interesan para techos (minutos). */
export const DURACIONES_MIN = [5, 10, 15, 30, 60] as const;

/** Duración de diseño para techos (min) y periodo de retorno sugerido (años). */
export const DURACION_DISENO_MIN = 5;
export const PERIODO_DISENO: PeriodoRetorno = 10;
/** Más allá de esta distancia la estación no se usa sola: se sugiere escribir el dato. */
export const DISTANCIA_MAX_KM = 25;

export interface EstacionIdf {
  nombre: string;
  municipio: string;
  departamento: string;
  lat: number;
  lon: number;
  altitudM: number;
  anios: number;
  b: number;
  /** A para T = 2, 5, 10, 25, 50, 100 años. */
  a: number[];
  /** n para T = 2, 5, 10, 25, 50, 100 años. */
  n: number[];
}

export const FUENTE_IDF_ICC = {
  corta: 'INSIVUMEH e ICC (2025)',
  cita:
    'Instituto Nacional de Sismología, Vulcanología, Meteorología e Hidrología (INSIVUMEH) e Instituto Privado de ' +
    'Investigación sobre Cambio Climático (ICC) (2025). Curvas de intensidad, duración y frecuencia (IDF) para la ' +
    'vertiente del Pacífico de Guatemala. 54 p.',
  autores: 'Amy Molina Estrada y Juan Francisco Low (ICC); Giovanna Pérez y Roberto Aguilar (INSIVUMEH)',
  url: 'https://icc.org.gt/wp-content/uploads/2023/03/265.pdf',
};

export const FUENTE_IDF_BARDALES = {
  corta: 'Bardales, W. (2025) — IDF Guatemala (Sherman)',
  cita:
    'Bardales, W. (2025). IDF_Guatemala_Sherman: curvas IDF de Guatemala con la ecuación de Sherman ' +
    '[aplicación de Google Earth Engine].',
  url: 'https://ee-bardaleswa.projects.earthengine.app/view/idfguatemalasherman',
};

const e = (
  nombre: string,
  municipio: string,
  departamento: string,
  lat: number,
  lon: number,
  altitudM: number,
  anios: number,
  b: number,
  a: number[],
  n: number[],
): EstacionIdf => ({ nombre, municipio, departamento, lat, lon, altitudM, anios, b, a, n });

/** Tablas Gumbel de INSIVUMEH e ICC (2025). */
export const ESTACIONES_IDF: EstacionIdf[] = [
  e('Xoluta', 'Retalhuleu', 'Retalhuleu', 14.48, -91.86, 52, 13, 23.6, [3085.29, 2526.91, 2339.37, 2199.86, 2138.4, 2100.28], [0.928, 0.845, 0.805, 0.767, 0.744, 0.725]),
  e('Tululá', 'San Andrés Villa Seca', 'Retalhuleu', 14.51, -91.59, 253, 14, 22.54, [3989.11, 3783.98, 3736.81, 3734.13, 3759.42, 3800.6], [0.915, 0.867, 0.843, 0.819, 0.804, 0.791]),
  e('Naranjales', 'Santo Domingo Suchitepéquez', 'Suchitepéquez', 14.37, -91.48, 91, 14, 18.99, [2870.91, 2694.38, 2640.52, 2613.88, 2614.26, 2626.64], [0.904, 0.856, 0.832, 0.807, 0.792, 0.779]),
  e('San Nicolás', 'San Lorenzo', 'Suchitepéquez', 14.18, -91.6, 20, 12, 29.82, [5446.12, 6193.02, 6715.91, 7394.49, 7906.41, 8419.53], [1.04, 1.016, 1.005, 0.995, 0.989, 0.984]),
  e('Lorena', 'San Antonio Suchitepéquez', 'Suchitepéquez', 14.52, -91.42, 340, 14, 19.55, [3228.23, 3298.4, 3365.44, 3465.66, 3548.23, 3635.44], [0.855, 0.83, 0.816, 0.802, 0.793, 0.785]),
  e('Petén Oficina', 'Tiquisate', 'Escuintla', 14.26, -91.41, 51, 17, 17.99, [3182.59, 3241.23, 3331.02, 3475.78, 3597.82, 3727.45], [0.919, 0.878, 0.859, 0.84, 0.829, 0.819]),
  e('Irlanda', 'Tiquisate', 'Escuintla', 14.15, -91.43, 20, 17, 18.55, [3081.21, 3381.69, 3629.14, 3967.97, 4230.75, 4497.87], [0.962, 0.921, 0.905, 0.889, 0.88, 0.873]),
  e('Puyumate', 'Nueva Concepción', 'Escuintla', 14.26, -91.26, 86, 17, 19.79, [3557.01, 3731.29, 3882.6, 4097.17, 4267.68, 4443.67], [0.925, 0.891, 0.874, 0.858, 0.849, 0.84]),
  e('El Platanar', 'Acatenango', 'Chimaltenango', 14.56, -90.94, 1578, 12, 18.55, [2252.19, 2495.72, 2659.75, 2869.08, 3025.47, 3181.4], [0.975, 0.961, 0.954, 0.946, 0.941, 0.937]),
  e('Cengicaña', 'Santa Lucía Cotzumalguapa', 'Escuintla', 14.33, -91.05, 300, 17, 18.81, [2887.92, 3264.13, 3513.38, 3828.46, 4062.3, 4294.48], [0.846, 0.849, 0.85, 0.851, 0.852, 0.853]),
  e('Bonanza', 'La Gomera', 'Escuintla', 14.08, -91.19, 29, 17, 15.23, [2631.96, 2934.51, 3168.92, 3483.74, 3725.49, 3970], [0.906, 0.873, 0.859, 0.847, 0.84, 0.834]),
  e('San Antonio EV', 'Sipacate', 'Escuintla', 14.0, -91.2, 10, 17, 18.46, [2296.68, 2488.84, 2639.01, 2842.75, 3000.43, 3160.72], [0.878, 0.849, 0.836, 0.823, 0.816, 0.81]),
  e('Tehuantepeq', 'Santa Lucía Cotzumalguapa', 'Escuintla', 14.17, -91.1, 60, 17, 16.54, [2857.85, 3200.6, 3434.98, 3736.38, 3962.64, 4188.89], [0.911, 0.892, 0.883, 0.873, 0.868, 0.863]),
  e('El Bálsamo', 'Santa Lucía Cotzumalguapa', 'Escuintla', 14.28, -91.0, 280, 17, 18.72, [3407.58, 3543.7, 3657.01, 3816.69, 3943.6, 4074.82], [0.873, 0.847, 0.834, 0.82, 0.812, 0.804]),
  e('Bouganvilia', 'La Democracia', 'Escuintla', 14.12, -90.94, 60, 17, 16.2, [2460.14, 2480.83, 2532.8, 2622.65, 2700.81, 2785.14], [0.876, 0.838, 0.82, 0.802, 0.791, 0.782]),
  e('Costa Brava', 'La Democracia', 'Escuintla', 14.24, -90.92, 144, 17, 17.81, [3023.72, 2999.72, 3043.16, 3133.88, 3217.78, 3310.63], [0.879, 0.839, 0.821, 0.803, 0.792, 0.783]),
  e('La Giralda', 'San José', 'Escuintla', 13.98, -90.93, 20, 11, 19.55, [3128.63, 2759.59, 2638.14, 2555.87, 2527, 2516.47], [0.956, 0.888, 0.856, 0.823, 0.804, 0.787]),
  e('Trinidad', 'Masagua', 'Escuintla', 14.15, -90.84, 68, 17, 16.54, [2305.6, 2403.06, 2506.72, 2660.33, 2784.53, 2913.6], [0.859, 0.817, 0.798, 0.781, 0.77, 0.762]),
  e('Amazonas', 'Masagua', 'Escuintla', 14.07, -90.77, 28, 16, 18.83, [2415.89, 2259.34, 2344.5, 2517.72, 2669.65, 2831.67], [0.866, 0.763, 0.728, 0.7, 0.685, 0.673]),
  e('San Rafael', 'Taxisco', 'Santa Rosa', 14.02, -90.63, 10, 15, 16.54, [2407.82, 2395.9, 2448.48, 2548.35, 2637.22, 2733.64], [0.892, 0.841, 0.818, 0.796, 0.784, 0.773]),
  e('La Candelaria', 'Taxisco', 'Santa Rosa', 13.91, -90.56, 5, 10, 12.9, [2050.88, 3058.92, 3749.46, 4638.95, 5307.68, 5977.06], [0.855, 0.887, 0.901, 0.914, 0.922, 0.928]),
  e('Trinidad Magdalena', 'Pasaco', 'Jutiapa', 13.93, -90.26, 19, 12, 18.54, [2433.29, 2515.25, 2592.22, 2704.89, 2796.13, 2891.33], [0.889, 0.86, 0.846, 0.831, 0.822, 0.815]),
];

/** Intensidad (mm/h) de una estación para un periodo de retorno y una duración (min). */
export function intensidadEstacion(est: EstacionIdf, tr: PeriodoRetorno, duracionMin: number): number {
  const i = PERIODOS_RETORNO.indexOf(tr);
  if (i < 0 || duracionMin <= 0) return 0;
  return est.a[i] / Math.pow(duracionMin + est.b, est.n[i]);
}

/** Forma de Sherman con periodo de retorno: I = K · T^m / (D + B)^n. */
export function intensidadSherman(k: number, m: number, n: number, b: number, tr: number, duracionMin: number): number {
  if (tr <= 0 || duracionMin + b <= 0) return 0;
  return (k * Math.pow(tr, m)) / Math.pow(duracionMin + b, n);
}

/** Distancia en km sobre la superficie terrestre (haversine). */
export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface EstacionCercana {
  estacion: EstacionIdf;
  km: number;
  /** true si está dentro de la distancia máxima recomendada. */
  util: boolean;
}

export function estacionMasCercana(lat: number, lon: number, estaciones = ESTACIONES_IDF): EstacionCercana | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || estaciones.length === 0) return null;
  let mejor = estaciones[0];
  let km = distanciaKm(lat, lon, mejor.lat, mejor.lon);
  for (const est of estaciones.slice(1)) {
    const d = distanciaKm(lat, lon, est.lat, est.lon);
    if (d < km) {
      km = d;
      mejor = est;
    }
  }
  return { estacion: mejor, km, util: km <= DISTANCIA_MAX_KM };
}
