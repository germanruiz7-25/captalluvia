/**
 * Análisis hidráulico del tramo de canal y su bajante frente a las curvas IDF.
 *
 * Cada tramo de canal recibe el agua de A_tramo m² de techo y la entrega a una bajante.
 * El sistema rebalsa cuando el caudal de entrada supera la menor de dos capacidades:
 *  - canal lleno hasta su lado bajo (Manning, sección rectangular), y
 *  - bajante (Wyly y Eaton, llenado 1/3).
 * La intensidad límite es i = 3600·Q / (C·A_tramo). Con la curva IDF de la estación,
 * I = A / (D + B)^n, los aguaceros de duración D ≤ D* = (A / i_lim)^(1/n) − B tienen una
 * intensidad media mayor que la límite: son los que hacen rebalsar el sistema.
 */
import { caudalRacionalLs, limitesSimulacion, type EntradaSimulacion } from './drenaje';
import { PERIODOS_RETORNO, intensidadEstacion, type EstacionIdf, type PeriodoRetorno } from './idf';

export interface FilaPeriodo {
  tr: PeriodoRetorno;
  /** Intensidad de un aguacero de 5 min (mm/h). */
  i5MmH: number;
  /** Caudal que llega al tramo con ese aguacero (L/s). */
  caudalLs: number;
  /** Caudal / capacidad máxima del sistema. */
  uso: number;
  /** Duración máxima (min) de los aguaceros de ese periodo de retorno que superan la capacidad; null si ninguno de 5 min o más. */
  duracionCriticaMin: number | null;
}

export interface AnalisisHidraulico {
  areaTramoM2: number;
  /** Capacidad del canal con el borde libre de diseño (3/4 del lado bajo), L/s. */
  canalDisenoLs: number;
  /** Capacidad del canal lleno hasta el lado bajo, L/s. */
  canalLlenoLs: number;
  /** Capacidad de la bajante, L/s. */
  bajanteLs: number;
  /** Capacidad máxima del tramo (la menor entre canal lleno y bajante), L/s. */
  sistemaLs: number;
  controla: 'canal' | 'bajante';
  /** Intensidad a partir de la cual el tramo rebalsa (mm/h). */
  intensidadLimiteMmH: number;
  /** Intensidad hasta la que se trabaja con borde libre (mm/h). */
  intensidadDisenoLimiteMmH: number;
  intensidadDisenoMmH: number;
  caudalDisenoLs: number;
  periodos: FilaPeriodo[];
}

/** Duración (min) bajo la cual la intensidad media de la curva IDF supera i; null si no hay (o < 5 min). */
export function duracionCriticaMin(est: EstacionIdf, tr: PeriodoRetorno, intensidadMmH: number, minimo = 5): number | null {
  const k = PERIODOS_RETORNO.indexOf(tr);
  if (k < 0 || intensidadMmH <= 0) return null;
  const d = Math.pow(est.a[k] / intensidadMmH, 1 / est.n[k]) - est.b;
  return d >= minimo ? d : null;
}

export function analizarTramo(
  e: EntradaSimulacion,
  intensidadDisenoMmH: number,
  estacion: EstacionIdf | null,
): AnalisisHidraulico {
  const lim = limitesSimulacion(e);
  const aMm = (mmh: number) => (mmh * e.c * e.areaTramoM2) / 3600; // L/s
  const canalDisenoLs = aMm(lim.canalDisenoMmH);
  const canalLlenoLs = aMm(lim.canalRebalsaMmH);
  const bajanteLs = e.capacidadBajanteLs;
  const controla = bajanteLs < canalLlenoLs ? 'bajante' : 'canal';
  const sistemaLs = Math.min(canalLlenoLs, bajanteLs);
  const intensidadLimiteMmH = Math.min(lim.canalRebalsaMmH, lim.bajanteMmH);
  const periodos: FilaPeriodo[] = estacion
    ? PERIODOS_RETORNO.map((tr) => {
        const i5 = intensidadEstacion(estacion, tr, 5);
        const q = caudalRacionalLs(e.c, i5, e.areaTramoM2);
        return {
          tr,
          i5MmH: i5,
          caudalLs: q,
          uso: sistemaLs > 0 ? q / sistemaLs : Infinity,
          duracionCriticaMin: duracionCriticaMin(estacion, tr, intensidadLimiteMmH),
        };
      })
    : [];
  return {
    areaTramoM2: e.areaTramoM2,
    canalDisenoLs,
    canalLlenoLs,
    bajanteLs,
    sistemaLs,
    controla,
    intensidadLimiteMmH,
    intensidadDisenoLimiteMmH: Math.min(lim.canalDisenoMmH, lim.bajanteMmH),
    intensidadDisenoMmH,
    caudalDisenoLs: caudalRacionalLs(e.c, intensidadDisenoMmH, e.areaTramoM2),
    periodos,
  };
}
