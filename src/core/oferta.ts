/**
 * Oferta de agua: de la lluvia bruta a la lluvia neta aprovechable y a m³ captados.
 *
 * Solo se capta en los meses con lluvia igual o mayor al umbral (40 mm por defecto):
 * en los meses más secos las lluvias son pocas y escasas, y sirven sobre todo para lavar el techo.
 *
 * Lluvia neta de cada mes captado (mm = L/m²):
 *   neta = max(0, P_mes × Ce − días_con_lluvia_mes × descarte)
 */
import type { ResumenLluvia } from './lluvia';

/**
 * Lluvia mensual mínima para captar (editable). Criterio de la metodología SCALL del
 * Colegio de Postgraduados / CIDECALLI (Anaya Garduño, 2011).
 */
export const UMBRAL_CAPTACION_MM = 40;

export interface ResumenOferta {
  /** Lluvia que cae, mm/año (= L por m² de techo). */
  brutaAnualMm: number;
  /** Umbral usado (mm/mes). */
  umbralMm: number;
  /** true si el mes se capta (lluvia ≥ umbral). */
  mesesCaptados: boolean[];
  /** Lluvia de los meses bajo el umbral, que no se capta (mm/año). */
  perdidaMesesSecosMm: number;
  /** En los meses captados: lo que no escurre por el material del techo (mm/año). */
  perdidaEscorrentiaMm: number;
  /** En los meses captados: lo que se desvía en el primer descarte (mm/año). */
  perdidaDescarteMm: number;
  /** Lluvia neta aprovechable, mm/año (= L por m² de techo). */
  netaAnualMm: number;
  netaMensualMm: number[];
  /** Fracción de la lluvia bruta que se aprovecha (0–1). */
  eficiencia: number;
  /** Área de techo con la que se calcularon los m³ (null si no se indicó). */
  areaM2: number | null;
  m3BrutosAnual: number | null;
  m3NetosAnual: number | null;
  m3NetosMensual: number[] | null;
}

export function calcularOferta(
  lluvia: ResumenLluvia,
  coeficienteEscorrentia: number,
  descartePorEventoMm: number,
  areaM2: number | null = null,
  umbralMm: number = UMBRAL_CAPTACION_MM,
): ResumenOferta {
  const ce = Math.min(1, Math.max(0, coeficienteEscorrentia));
  const descarte = Math.max(0, descartePorEventoMm);
  const umbral = Math.max(0, Number(umbralMm) || 0);
  const mesesCaptados = lluvia.mensualMm.map((p) => p > 0 && p >= umbral);

  let secos = 0;
  let escorrentia = 0;
  let descartado = 0;
  const netaMensualMm = lluvia.mensualMm.map((p, m) => {
    if (!mesesCaptados[m]) {
      secos += p;
      return 0;
    }
    const conCe = p * ce;
    const neta = Math.max(0, conCe - lluvia.diasLluviaMes[m] * descarte);
    escorrentia += p - conCe;
    descartado += conCe - neta;
    return neta;
  });

  const bruta = lluvia.anualMm;
  const neta = netaMensualMm.reduce((t, x) => t + x, 0);
  const area = areaM2 !== null && Number.isFinite(areaM2) && areaM2 > 0 ? areaM2 : null;
  return {
    brutaAnualMm: bruta,
    umbralMm: umbral,
    mesesCaptados,
    perdidaMesesSecosMm: secos,
    perdidaEscorrentiaMm: escorrentia,
    perdidaDescarteMm: descartado,
    netaAnualMm: neta,
    netaMensualMm,
    eficiencia: bruta > 0 ? neta / bruta : 0,
    areaM2: area,
    m3BrutosAnual: area === null ? null : (bruta * area) / 1000,
    m3NetosAnual: area === null ? null : (neta * area) / 1000,
    m3NetosMensual: area === null ? null : netaMensualMm.map((x) => (x * area) / 1000),
  };
}
