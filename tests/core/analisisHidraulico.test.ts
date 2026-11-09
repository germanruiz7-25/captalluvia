import { describe, expect, it } from 'vitest';
import { analizarTramo, duracionCriticaMin } from '../../src/core/analisisHidraulico';
import { CANAL_COLONIAL_WAVIN, capacidadBajanteLs, capacidadCanalRectangularLs } from '../../src/core/drenaje';
import { ESTACIONES_IDF, intensidadEstacion } from '../../src/core/idf';

const est = ESTACIONES_IDF.find((x) => x.nombre === 'Costa Brava')!;
const entrada = {
  areaTramoM2: 30,
  c: 0.9,
  seccion: CANAL_COLONIAL_WAVIN,
  pendientePct: 0.5,
  material: 'pvc' as const,
  capacidadBajanteLs: capacidadBajanteLs(82),
};

describe('análisis hidráulico del tramo', () => {
  it('capacidades del canal, de la bajante y del sistema', () => {
    const a = analizarTramo(entrada, 234, est);
    expect(a.canalDisenoLs).toBeCloseTo(capacidadCanalRectangularLs(0.1, 0.09, 0.005, 0.011, 0.75), 6);
    expect(a.canalLlenoLs).toBeCloseTo(capacidadCanalRectangularLs(0.1, 0.09, 0.005, 0.011, 1), 6);
    expect(a.sistemaLs).toBe(Math.min(a.canalLlenoLs, a.bajanteLs));
    expect(a.controla).toBe(a.bajanteLs < a.canalLlenoLs ? 'bajante' : 'canal');
    expect(a.intensidadLimiteMmH).toBeCloseTo((a.sistemaLs * 3600) / (0.9 * 30), 6);
    expect(a.caudalDisenoLs).toBeCloseTo((0.9 * 234 * 30) / 3600, 9);
    expect(a.periodos).toHaveLength(6);
  });

  it('duración crítica: en D* la intensidad IDF iguala la intensidad límite', () => {
    const iLim = 200;
    const d = duracionCriticaMin(est, 10, iLim)!;
    expect(d).toBeGreaterThan(5);
    expect(intensidadEstacion(est, 10, d)).toBeCloseTo(iLim, 6);
    // si la intensidad límite es mayor que la de 5 min, ningún aguacero la supera
    expect(duracionCriticaMin(est, 10, 1000)).toBeNull();
  });

  it('con un tramo muy grande los aguaceros frecuentes ya superan la capacidad', () => {
    const grande = analizarTramo({ ...entrada, areaTramoM2: 150 }, 234, est);
    const t2 = grande.periodos[0];
    expect(t2.uso).toBeGreaterThan(1);
    expect(t2.duracionCriticaMin).not.toBeNull();
    const chico = analizarTramo(entrada, 234, est);
    expect(chico.periodos.every((p) => p.duracionCriticaMin === null)).toBe(true);
  });

  it('sin estación no hay tabla por periodo de retorno', () => {
    expect(analizarTramo(entrada, 150, null).periodos).toEqual([]);
  });
});
