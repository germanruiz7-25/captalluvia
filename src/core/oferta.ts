/**
 * Oferta de agua: de la lluvia bruta a la lluvia neta aprovechable y a m³ captados.
 *
 * Precipitación neta (PN) de cada mes (mm = L/m²):
 *   PN = P_mes × Cc,  con Cc (coeficiente de captación) = Ce × Efc
 * Ce: coeficiente de escorrentía del material del techo; Efc: eficiencia de captación (0.85).
 * Ej.: mayo con 478.1 mm y lámina metálica: 478.1 × 0.9 × 0.85 = 365.7 mm.
 *
 * Solo se captan los meses con PN igual o mayor al umbral (40 mm por defecto),
 * según Anaya Garduño (2011), pp. 56–57, fig. 4.7.
 *
 * Temporada de captación y primer descarte (desde v0.7.0): la época seca es la racha más larga de
 * meses seguidos con PN bajo el umbral (p. ej. diciembre–abril). Esos meses no se captan y su poca
 * lluvia lava el techo, las canaletas y el tanque (primer descarte por temporada, sin dispositivo).
 * Todos los demás meses se captan, aunque alguno de la temporada lluviosa quede bajo el umbral
 * (canícula). Si ningún mes queda bajo el umbral, se captan los 12.
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
  /** En los meses captados: lo que no escurre por el material del techo, (1 − Ce) (mm/año). */
  perdidaEscorrentiaMm: number;
  /** En los meses captados: lo que escurre pero no llega al tanque, Ce × (1 − Efc) (mm/año). */
  perdidaEficienciaMm: number;
  /** Coeficiente de escorrentía, eficiencia de captación y coeficiente de captación usados. */
  ce: number;
  efc: number;
  cc: number;
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
  eficienciaCaptacion: number = 1,
): ResumenOferta {
  const ce = Math.min(1, Math.max(0, coeficienteEscorrentia));
  const efc = Math.min(1, Math.max(0, eficienciaCaptacion));
  const cc = ce * efc;
  const descarte = Math.max(0, descartePorEventoMm);
  const umbral = Math.max(0, Number(umbralMm) || 0);
  const pnMensualMm = lluvia.mensualMm.map((p, m) =>
    Math.max(0, p * cc - lluvia.diasLluviaMes[m] * descarte),
  );
  const bajo = pnMensualMm.map((pn) => pn <= 0 || pn < umbral);
  const seca = epocaSeca(bajo);
  const mesesCaptados = pnMensualMm.map((pn, m) => pn > 0 && !seca.includes(m));

  let secos = 0;
  let escorrentia = 0;
  let eficiencia = 0;
  let descartado = 0;
  const netaMensualMm = lluvia.mensualMm.map((p, m) => {
    if (!mesesCaptados[m]) {
      secos += p;
      return 0;
    }
    escorrentia += p - p * ce;
    eficiencia += p * ce - p * cc;
    descartado += p * cc - pnMensualMm[m];
    return pnMensualMm[m];
  });

  // Las lluvias de la época seca lavan el sistema; la captación empieza el mes siguiente
  const mesesLavado = seca.length < 12 ? seca : [];
  const inicio = mesesLavado.length ? (mesesLavado[mesesLavado.length - 1] + 1) % 12 : -1;
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
    perdidaEficienciaMm: eficiencia,
    ce,
    efc,
    cc,
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

/**
 * Época seca: la racha más larga de meses seguidos (circular: dic → ene) bajo el umbral, en orden.
 * Devuelve [] si ningún mes está bajo el umbral y los 12 meses si todos lo están.
 */
export function epocaSeca(bajo: boolean[]): number[] {
  if (bajo.every(Boolean)) return bajo.map((_, m) => m);
  if (!bajo.some(Boolean)) return [];
  let mejor: number[] = [];
  for (let m = 0; m < 12; m++) {
    if (!bajo[m] || bajo[(m + 11) % 12]) continue; // solo donde empieza una racha
    const racha: number[] = [];
    for (let k = 0; k < 12 && bajo[(m + k) % 12]; k++) racha.push((m + k) % 12);
    if (racha.length > mejor.length) mejor = racha;
  }
  return mejor;
}
