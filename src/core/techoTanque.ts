/**
 * Área de techo para el tanque del periodo crítico.
 *
 * El tanque guarda el agua de los días críticos (época seca) y debe llenarse al 100 % durante la temporada
 * de lluvia. Mientras llueve, el agua del techo cubre primero el consumo del mes y el excedente entra al
 * tanque. Se simula la temporada mes a mes, empezando con el tanque vacío:
 *
 *   S_j = mín(V, máx(0, S_(j−1) + PN_j × A ÷ 1000 − D))
 *
 * con PN_j la precipitación neta captada del mes (mm), A el área de techo (m²), D el consumo mensual
 * (m³) y V el volumen del periodo crítico (m³). El agua que no cabe en el tanque se rebalsa.
 *
 * - Techo para solo llenar el tanque: la menor A con la que S llega a V sin usar el agua en la
 *   temporada (D = 0): A = 1000 × V ÷ ΣPN.
 * - Techo ideal: la menor A con la que, consumiendo D cada mes, el tanque llega a llenarse (S = V).
 *   Una vez lleno, en los meses del final de la temporada en que la lluvia ya no cubre el consumo
 *   (PN × A ÷ 1000 < D) la reserva se protege: se usa solo lo que llueve y el tanque se guarda para los
 *   días críticos. Exigir que esos meses flojos también cubran todo el consumo dispararía el área.
 *
 * Funciones puras (ver tests/core/techoTanque.test.ts). Unidades: mm, m², m³.
 */

export interface EntradaTechoTanque {
  /** PN captada de cada mes (mm), 0 en los meses que no se captan. */
  pnMensualMm: number[];
  mesesCaptados: boolean[];
  /** Volumen que debe quedar en el tanque al terminar la temporada (m³). */
  volumenM3: number;
  /** Consumo de cada mes de la temporada de lluvia (m³). */
  consumoMensualM3: number;
}

export interface AreaTechoTanque {
  /** Meses de la temporada de captación (0–11), en orden. */
  mesesTemporada: number[];
  /** Suma de la PN de la temporada (mm = L/m²). */
  pnTemporadaMm: number;
  /** Consumo de la temporada (m³). */
  consumoTemporadaM3: number;
  /** m² para llenar el tanque sin usar el agua en la temporada (exacto). */
  soloLlenarM2: number | null;
  /** m² para cubrir el consumo de la temporada y terminar con el tanque lleno (exacto). */
  idealM2: number | null;
}

/** Meses de la temporada en orden: empieza el mes que sigue a la época seca. */
export function mesesDeTemporada(mesesCaptados: boolean[], pnMensualMm: number[]): number[] {
  if (!mesesCaptados.some(Boolean)) return [];
  let inicio: number;
  if (mesesCaptados.every(Boolean)) {
    // Sin época seca: la temporada termina en el mes con menos lluvia neta
    let menor = 0;
    for (let i = 1; i < 12; i++) if (pnMensualMm[i] < pnMensualMm[menor]) menor = i;
    inicio = (menor + 1) % 12;
  } else {
    inicio = mesesCaptados.findIndex((c, i) => c && !mesesCaptados[(i + 11) % 12]);
  }
  const meses: number[] = [];
  for (let k = 0; k < 12; k++) {
    const m = (inicio + k) % 12;
    if (mesesCaptados[m]) meses.push(m);
  }
  return meses;
}

/** Nivel del tanque al final de cada mes de la temporada (m³), empezando vacío. */
export function nivelesTemporada(pnMm: number[], meses: number[], areaM2: number, volumenM3: number, consumoM3: number): number[] {
  let s = 0;
  return meses.map((m) => (s = Math.min(volumenM3, Math.max(0, s + (Math.max(0, pnMm[m]) * areaM2) / 1000 - consumoM3))));
}

/** Nivel más alto que alcanza el tanque en la temporada (m³). */
export function nivelMaximo(pnMm: number[], meses: number[], areaM2: number, volumenM3: number, consumoM3: number): number {
  return Math.max(0, ...nivelesTemporada(pnMm, meses, areaM2, volumenM3, consumoM3));
}

/** Agua en el tanque al terminar la temporada (m³), empezando vacío. */
export function nivelAlFinal(pnMm: number[], meses: number[], areaM2: number, volumenM3: number, consumoM3: number): number {
  const n = nivelesTemporada(pnMm, meses, areaM2, volumenM3, consumoM3);
  return n.length ? n[n.length - 1] : 0;
}

const TOLERANCIA = 1e-6;
const AREA_MAXIMA = 1e7;

export function areaParaTanque(e: EntradaTechoTanque): AreaTechoTanque {
  const meses = mesesDeTemporada(e.mesesCaptados, e.pnMensualMm);
  const pnTemporadaMm = meses.reduce((t, m) => t + Math.max(0, e.pnMensualMm[m]), 0);
  const v = Math.max(0, e.volumenM3);
  const d = Math.max(0, e.consumoMensualM3);
  const base = { mesesTemporada: meses, pnTemporadaMm, consumoTemporadaM3: d * meses.length };
  if (pnTemporadaMm <= 0 || v <= 0) return { ...base, soloLlenarM2: null, idealM2: null };

  const soloLlenarM2 = (1000 * v) / pnTemporadaMm;
  const lleno = (a: number) => nivelMaximo(e.pnMensualMm, meses, a, v, d) >= v - TOLERANCIA;

  let bajo = soloLlenarM2;
  let alto = Math.max(soloLlenarM2, 1) * 2;
  while (!lleno(alto) && alto < AREA_MAXIMA) alto *= 2;
  if (!lleno(alto)) return { ...base, soloLlenarM2, idealM2: null };
  if (lleno(bajo)) return { ...base, soloLlenarM2, idealM2: soloLlenarM2 };
  for (let k = 0; k < 80; k++) {
    const medio = (bajo + alto) / 2;
    if (lleno(medio)) alto = medio;
    else bajo = medio;
  }
  return { ...base, soloLlenarM2, idealM2: alto };
}

/**
 * Consumo mensual máximo (m³) que se puede sacar en la temporada sin impedir que el tanque llegue a
 * llenarse, con un área dada. null si ni sin consumir se llena.
 */
export function consumoPosibleM3(pnMm: number[], meses: number[], areaM2: number, volumenM3: number): number | null {
  if (nivelMaximo(pnMm, meses, areaM2, volumenM3, 0) < volumenM3 - TOLERANCIA) return null;
  let bajo = 0;
  let alto = meses.reduce((t, m) => t + (Math.max(0, pnMm[m]) * areaM2) / 1000, 0);
  for (let k = 0; k < 80; k++) {
    const medio = (bajo + alto) / 2;
    if (nivelMaximo(pnMm, meses, areaM2, volumenM3, medio) >= volumenM3 - TOLERANCIA) bajo = medio;
    else alto = medio;
  }
  return bajo;
}

/**
 * - 'ideal': cubre el consumo de la temporada de lluvia y llena el tanque.
 * - 'soloLlenar': llena el tanque, pero en la temporada el consumo debe limitarse (o no usarse).
 * - 'insuficiente': ni sin usar el agua en la temporada se llena el tanque.
 */
export type EstadoTecho = 'ideal' | 'soloLlenar' | 'insuficiente';

export interface EvaluacionTecho {
  /** Área a usar en el diseño: la existente o, si no hay, la ideal redondeada. */
  existenteM2: number | null;
  /** Área ideal y para solo llenar, redondeadas al m² superior. */
  idealM2: number | null;
  soloLlenarM2: number | null;
  estado: EstadoTecho | null;
  /** m² que le faltan al techo existente para el ideal y para llenar el tanque (0 si no faltan). */
  faltaIdealM2: number;
  faltaLlenarM2: number;
  /** Fracción del tanque que se llena sin consumir en la temporada (1 si se llena). */
  fraccionLlenado: number;
  /** Litros por día que se pueden usar en la temporada con el techo existente sin dejar de llenar el tanque. */
  litrosDiaPosibles: number | null;
  /** Litros por día de la demanda. */
  litrosDiaDemanda: number;
  /** Meses de la temporada (0–11). */
  mesesTemporada: number[];
  /** Con el área de diseño (existente o ideal): mes en que el tanque se llena (null si no se llena). */
  mesLleno: number | null;
  /** Meses después de llenarse en que la lluvia no cubre el consumo: proteger la reserva. */
  mesesProteger: number[];
}

export const DIAS_MES_TEMPORADA = 30.4;

export function evaluarTecho(
  e: EntradaTechoTanque & { existenteM2: number | null },
): EvaluacionTecho {
  const r = areaParaTanque(e);
  const arriba = (v: number | null) => (v === null ? null : Math.ceil(v - 1e-9));
  const idealM2 = arriba(r.idealM2);
  const soloLlenarM2 = arriba(r.soloLlenarM2);
  const a = e.existenteM2 && e.existenteM2 > 0 ? e.existenteM2 : null;
  const litrosDiaDemanda = (Math.max(0, e.consumoMensualM3) * 1000) / DIAS_MES_TEMPORADA;
  let estado: EstadoTecho | null = null;
  let fraccionLlenado = 1;
  let litrosDiaPosibles: number | null = null;
  if (a !== null && r.soloLlenarM2 !== null) {
    const v = Math.max(0, e.volumenM3);
    fraccionLlenado = v > 0 ? Math.min(1, nivelMaximo(e.pnMensualMm, r.mesesTemporada, a, v, 0) / v) : 1;
    if (r.idealM2 !== null && a + 1e-9 >= r.idealM2) estado = 'ideal';
    else if (a + 1e-9 >= r.soloLlenarM2) estado = 'soloLlenar';
    else estado = 'insuficiente';
    if (estado === 'soloLlenar') {
      const c = consumoPosibleM3(e.pnMensualMm, r.mesesTemporada, a, v);
      litrosDiaPosibles = c === null ? 0 : (c * 1000) / DIAS_MES_TEMPORADA;
    }
  }
  // Con el área de diseño: cuándo se llena el tanque y en qué meses posteriores la lluvia ya no cubre el consumo
  let mesLleno: number | null = null;
  const mesesProteger: number[] = [];
  const areaDiseno = a ?? idealM2;
  const vol = Math.max(0, e.volumenM3);
  const dem = Math.max(0, e.consumoMensualM3);
  if (areaDiseno && vol > 0) {
    const consumo = estado === 'soloLlenar' || estado === 'insuficiente' ? 0 : dem;
    const niveles = nivelesTemporada(e.pnMensualMm, r.mesesTemporada, areaDiseno, vol, consumo);
    const k = niveles.findIndex((x) => x >= vol - TOLERANCIA);
    if (k >= 0) {
      mesLleno = r.mesesTemporada[k];
      for (const m of r.mesesTemporada.slice(k + 1)) if ((Math.max(0, e.pnMensualMm[m]) * areaDiseno) / 1000 < dem - 1e-9) mesesProteger.push(m);
    }
  }
  return {
    mesLleno,
    mesesProteger,
    existenteM2: a,
    idealM2,
    soloLlenarM2,
    estado,
    faltaIdealM2: a !== null && idealM2 !== null ? Math.max(0, Math.ceil(idealM2 - a - 1e-9)) : 0,
    faltaLlenarM2: a !== null && soloLlenarM2 !== null ? Math.max(0, Math.ceil(soloLlenarM2 - a - 1e-9)) : 0,
    fraccionLlenado,
    litrosDiaPosibles,
    litrosDiaDemanda,
    mesesTemporada: r.mesesTemporada,
  };
}
