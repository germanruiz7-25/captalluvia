/**
 * Oferta de agua: de la lluvia bruta a la lluvia neta aprovechable y a m³ captados.
 *
 * Lluvia neta de cada mes (mm = L/m²):
 *   neta = max(0, P_mes × Ce − días_con_lluvia_mes × descarte)
 */
import type { ResumenLluvia } from './lluvia';

export interface ResumenOferta {
  /** Lluvia que cae, mm/año (= L por m² de techo). */
  brutaAnualMm: number;
  /** Lo que no escurre por el material del techo (salpicadura, evaporación, absorción), mm/año. */
  perdidaEscorrentiaMm: number;
  /** Lo que se desvía en el primer descarte (first flush), mm/año. */
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
): ResumenOferta {
  const ce = Math.min(1, Math.max(0, coeficienteEscorrentia));
  const descarte = Math.max(0, descartePorEventoMm);
  const conCe = lluvia.mensualMm.map((p) => p * ce);
  const netaMensualMm = conCe.map((x, m) => Math.max(0, x - lluvia.diasLluviaMes[m] * descarte));
  const bruta = lluvia.anualMm;
  const conCeAnual = conCe.reduce((t, x) => t + x, 0);
  const neta = netaMensualMm.reduce((t, x) => t + x, 0);
  const area = areaM2 !== null && Number.isFinite(areaM2) && areaM2 > 0 ? areaM2 : null;
  return {
    brutaAnualMm: bruta,
    perdidaEscorrentiaMm: bruta - conCeAnual,
    perdidaDescarteMm: conCeAnual - neta,
    netaAnualMm: neta,
    netaMensualMm,
    eficiencia: bruta > 0 ? neta / bruta : 0,
    areaM2: area,
    m3BrutosAnual: area === null ? null : (bruta * area) / 1000,
    m3NetosAnual: area === null ? null : (neta * area) / 1000,
    m3NetosMensual: area === null ? null : netaMensualMm.map((x) => (x * area) / 1000),
  };
}
