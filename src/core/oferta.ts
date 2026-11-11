/**
 * Oferta de agua: de la lluvia bruta a la lluvia neta aprovechable y a m³ captados.
 *
 * Precipitación neta (PN) de cada mes (mm = L/m²):
 *   PN = max(0, P_mes × Ce − días_con_lluvia_mes × descarte)
 *
 * Solo se captan los meses con PN igual o mayor al umbral (40 mm por defecto),
 * según Anaya Garduño (2011), pp. 56–57, fig. 4.7.
 *
 * Primer descarte por temporada (desde v0.7.0): en lugar de descartar milímetros en cada lluvia,
 * se deja correr la lluvia de los meses previos al inicio de la temporada de captación (el primer
 * mes con PN ≥ umbral): esas primeras lluvias lavan el techo, las canaletas y el tanque y no se
 * captan. Es la forma más sencilla de hacerlo en sistemas artesanales, sin dispositivo de descarte.
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
  /** Lluvia de los meses con PN bajo el umbral, que no se capta (mm/año); incluye la de lavado. */
  perdidaMesesSecosMm: number;
  /** Meses (0–11) de las primeras lluvias, antes del inicio de la captación: lavan el sistema. */
  mesesLavado: number[];
  /** Lluvia de esos meses (mm/año): primer descarte por temporada. */
  lavadoMm: number;
  /** Primer mes de captación (0–11) o null si ningún mes llega al umbral o todos lo superan. */
  inicioCaptacion: number | null;
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

  // Primeras lluvias que lavan el sistema: los meses sin captar que preceden al inicio de la temporada
  const inicio = mesesCaptados.findIndex((c, m) => c && !mesesCaptados[(m + 11) % 12]);
  const mesesLavado: number[] = [];
  if (inicio >= 0) {
    for (let k = 1; k < 12; k++) {
      const m = (inicio - k + 12) % 12;
      if (mesesCaptados[m]) break;
      if (inicio > 0 && m > inicio) break; // no pasar a los meses de fin de año
      mesesLavado.unshift(m);
    }
  }
  const lavado = mesesLavado.reduce((t, m) => t + lluvia.mensualMm[m], 0);

  const bruta = lluvia.anualMm;
  const neta = netaMensualMm.reduce((t, x) => t + x, 0);
  const area = areaM2 !== null && Number.isFinite(areaM2) && areaM2 > 0 ? areaM2 : null;
  return {
    brutaAnualMm: bruta,
    umbralMm: umbral,
    pnMensualMm,
    mesesCaptados,
    perdidaMesesSecosMm: secos,
    mesesLavado,
    lavadoMm: lavado,
    inicioCaptacion: inicio >= 0 ? inicio : null,
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
