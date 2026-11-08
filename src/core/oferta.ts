/**
 * Oferta de agua: de la lluvia bruta a la lluvia neta aprovechable y a m³ captados.
 *
 * Precipitación neta (PN) de cada mes (mm = L/m²):
 *   PN = max(0, P_mes × Ce − días_con_lluvia_mes × descarte)
 *
 * Solo se captan los meses con PN igual o mayor al umbral (40 mm por defecto),
 * según Anaya Garduño (2011), pp. 56–57, fig. 4.7.
 */
import type { ResumenLluvia } from './lluvia';

/**
 * Precipitación neta (PN) mensual mínima para captar, mm (editable).
 * Anaya Garduño (2011), Captación del agua de lluvia. Solución caída del cielo, 1.ª ed., pp. 56–57, fig. 4.7.
 */
export const UMBRAL_CAPTACION_MM = 40;

export interface ResumenOferta {
  /** Lluvia que cae, mm/año (= L por m² de techo). */
  brutaAnualMm: number;
  /** Umbral de PN usado (mm/mes). */
  umbralMm: number;
  /** PN de cada mes antes de aplicar el umbral (mm). */
  pnMensualMm: number[];
  /** true si el mes se capta (PN ≥ umbral). */
  mesesCaptados: boolean[];
  /** Lluvia de los meses con PN bajo el umbral, que no se capta (mm/año). */
  perdidaMesesSecosMm: number;
  /** En los meses captados: lo que no escurre por el material del techo (mm/año). */
  perdidaEscorrentiaMm: number;
  /** En los meses captados: lo que se desvía en el primer descarte (mm/año). */
  perdidaDescarteMm: number;
  /** Lluvia neta cosechada, mm/año (= L por m² de techo): suma de la PN de los meses captados. */
  netaAnualMm: number;
  /** PN cosechada por mes (0 en los meses que no se captan). */
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
  const pnMensualMm = lluvia.mensualMm.map((p, m) =>
    Math.max(0, p * ce - lluvia.diasLluviaMes[m] * descarte),
  );
  const mesesCaptados = pnMensualMm.map((pn) => pn > 0 && pn >= umbral);

  let secos = 0;
  let escorrentia = 0;
  let descartado = 0;
  const netaMensualMm = lluvia.mensualMm.map((p, m) => {
    if (!mesesCaptados[m]) {
      secos += p;
      return 0;
    }
    escorrentia += p - p * ce;
    descartado += p * ce - pnMensualMm[m];
    return pnMensualMm[m];
  });

  const bruta = lluvia.anualMm;
  const neta = netaMensualMm.reduce((t, x) => t + x, 0);
  const area = areaM2 !== null && Number.isFinite(areaM2) && areaM2 > 0 ? areaM2 : null;
  return {
    brutaAnualMm: bruta,
    umbralMm: umbral,
    pnMensualMm,
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
