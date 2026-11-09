/**
 * Tanque de almacenamiento: balance mensual oferta-demanda y volumen necesario.
 *
 * Volumen por el método del pico secuente (sequent peak, equivalente a las diferencias
 * acumuladas de Rippl): K_t = max(0, K_{t-1} + D_t − Q_t), volumen = máximo de K en un
 * ciclo estable (se corren dos años y se toma el segundo).
 * Si el techo capta menos de lo que se consume en el año, no hay volumen que cubra todo:
 * se dimensiona para guardar todo el excedente de la época de lluvias y se informa la cobertura.
 */

export interface TanqueComercial {
  capacidadL: number;
  diametroM: number | null;
  alturaM: number | null;
}

/**
 * Tanques de polietileno tipo tinaco. Medidas de 450 a 2,500 L: Rotoplas Centroamérica,
 * Manual de instalación del tinaco. 5,000 y 10,000 L: las medidas varían por fabricante.
 */
export const TANQUES_POLIETILENO: TanqueComercial[] = [
  { capacidadL: 450, diametroM: 0.85, alturaM: 0.99 },
  { capacidadL: 600, diametroM: 0.97, alturaM: 1.12 },
  { capacidadL: 750, diametroM: 1.1, alturaM: 1.02 },
  { capacidadL: 1100, diametroM: 1.1, alturaM: 1.4 },
  { capacidadL: 2500, diametroM: 1.55, alturaM: 1.6 },
  { capacidadL: 5000, diametroM: null, alturaM: null },
  { capacidadL: 10000, diametroM: null, alturaM: null },
];

export const FUENTE_TANQUES =
  'Rotoplas Centroamérica. Manual de instalación del tinaco (capacidades y medidas de 450 a 2,500 L).';

export interface MesBalance {
  captadoM3: number;
  demandaM3: number;
  /** Agua en el tanque al final del mes. */
  nivelM3: number;
  /** Agua que no cabe y se rebalsa. */
  rebalseM3: number;
  /** Demanda que no se pudo cubrir. */
  faltanteM3: number;
}

export interface ResultadoTanque {
  volumenM3: number;
  /** 'cubre': el techo alcanza para la demanda del año; 'parcial': solo una parte. */
  criterio: 'cubre' | 'parcial';
  ofertaAnualM3: number;
  demandaAnualM3: number;
  /** Fracción de la demanda anual que se cubre con el volumen indicado. */
  cobertura: number;
  meses: MesBalance[];
}

const suma = (v: number[]) => v.reduce((a, b) => a + b, 0);

/** Volumen necesario (m³) por el pico secuente, o el excedente máximo si la oferta no alcanza. */
export function volumenNecesarioM3(ofertaM3: number[], demandaM3: number[]): { volumenM3: number; criterio: 'cubre' | 'parcial' } {
  const q = ofertaM3.map((x) => Math.max(0, x));
  const d = demandaM3.map((x) => Math.max(0, x));
  if (suma(q) <= 0) return { volumenM3: 0, criterio: 'parcial' };
  const cubre = suma(q) >= suma(d) - 1e-9;
  let k = 0;
  let maximo = 0;
  for (let ciclo = 0; ciclo < 2; ciclo++) {
    for (let t = 0; t < q.length; t++) {
      k = cubre ? Math.max(0, k + d[t] - q[t]) : Math.max(0, k + q[t] - d[t]);
      if (ciclo === 1) maximo = Math.max(maximo, k);
    }
    if (!cubre && ciclo === 0) k = 0;
  }
  return { volumenM3: maximo, criterio: cubre ? 'cubre' : 'parcial' };
}

/** Simulación mes a mes con un tanque de volumen dado (se muestra el segundo año, ya estable). */
export function simularTanque(ofertaM3: number[], demandaM3: number[], volumenM3: number): MesBalance[] {
  let nivel = 0;
  let meses: MesBalance[] = [];
  for (let ciclo = 0; ciclo < 2; ciclo++) {
    meses = [];
    for (let t = 0; t < ofertaM3.length; t++) {
      const q = Math.max(0, ofertaM3[t]);
      const d = Math.max(0, demandaM3[t]);
      let n = nivel + q - d;
      const faltanteM3 = n < 0 ? -n : 0;
      n = Math.max(0, n);
      const rebalseM3 = n > volumenM3 ? n - volumenM3 : 0;
      nivel = Math.min(volumenM3, n);
      meses.push({ captadoM3: q, demandaM3: d, nivelM3: nivel, rebalseM3, faltanteM3 });
    }
  }
  return meses;
}

export function calcularTanque(ofertaM3: number[], demandaM3: number[], volumenElegidoM3?: number): ResultadoTanque {
  const { volumenM3, criterio } = volumenNecesarioM3(ofertaM3, demandaM3);
  const v = volumenElegidoM3 ?? volumenM3;
  const meses = simularTanque(ofertaM3, demandaM3, v);
  const demandaAnualM3 = suma(demandaM3.map((x) => Math.max(0, x)));
  const faltante = suma(meses.map((m) => m.faltanteM3));
  return {
    volumenM3,
    criterio,
    ofertaAnualM3: suma(ofertaM3.map((x) => Math.max(0, x))),
    demandaAnualM3,
    cobertura: demandaAnualM3 > 0 ? Math.max(0, 1 - faltante / demandaAnualM3) : 0,
    meses,
  };
}

/** Número de tanques de una capacidad para guardar un volumen. */
export function tanquesNecesarios(volumenM3: number, capacidadL: number): number {
  return volumenM3 > 0 && capacidadL > 0 ? Math.ceil((volumenM3 * 1000) / capacidadL - 1e-9) : 0;
}

/** Tanque sugerido: el más pequeño con el que bastan 4 unidades o menos (si no, el más grande). */
export function tanqueSugerido(volumenM3: number, tanques = TANQUES_POLIETILENO): TanqueComercial {
  return tanques.find((t) => tanquesNecesarios(volumenM3, t.capacidadL) <= 4) ?? tanques[tanques.length - 1];
}

export interface Cisterna {
  largoM: number;
  anchoM: number;
  altoUtilM: number;
  bordeLibreM: number;
  volumenM3: number;
}

const arriba = (v: number, paso = 0.1) => Math.ceil(v / paso - 1e-9) * paso;

/**
 * Cisterna de block y cemento (medidas interiores): base cuadrada con la altura útil indicada.
 * Se agrega un borde libre (por defecto 0.30 m) sobre el nivel máximo del agua.
 */
export function sugerirCisterna(volumenM3: number, altoUtilM = 1.5, bordeLibreM = 0.3): Cisterna | null {
  if (volumenM3 <= 0 || altoUtilM <= 0) return null;
  const lado = Math.max(1, Math.round(arriba(Math.sqrt(volumenM3 / altoUtilM)) * 10) / 10);
  return { largoM: lado, anchoM: lado, altoUtilM, bordeLibreM, volumenM3: lado * lado * altoUtilM };
}

export function volumenCisternaM3(largoM: number, anchoM: number, altoUtilM: number): number {
  return Math.max(0, largoM) * Math.max(0, anchoM) * Math.max(0, altoUtilM);
}

/** Barril o tonel de 55 galones estadounidenses (1 galón = 3.785 L). */
export const LITROS_BARRIL = 55 * 3.785411784;

/** Cuántos barriles de 55 galones caben en un volumen (m³). */
export function barrilesEquivalentes(volumenM3: number): number {
  return volumenM3 > 0 ? (volumenM3 * 1000) / LITROS_BARRIL : 0;
}
