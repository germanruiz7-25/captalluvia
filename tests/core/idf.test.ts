import { describe, expect, it } from 'vitest';
import {
  DURACIONES_MIN,
  ESTACIONES_IDF,
  PERIODOS_RETORNO,
  distanciaKm,
  estacionMasCercana,
  intensidadEstacion,
  intensidadSherman,
} from '../../src/core/idf';

const balsamo = ESTACIONES_IDF.find((x) => x.nombre === 'El Bálsamo')!;

describe('curvas IDF INSIVUMEH-ICC (2025)', () => {
  it('trae 22 estaciones con 6 periodos de retorno cada una', () => {
    expect(ESTACIONES_IDF).toHaveLength(22);
    for (const est of ESTACIONES_IDF) {
      expect(est.a).toHaveLength(6);
      expect(est.n).toHaveLength(6);
      expect(est.lat).toBeGreaterThan(13.5);
      expect(est.lat).toBeLessThan(15);
      expect(est.lon).toBeLessThan(-90);
    }
  });

  it('El Bálsamo, 5 min y T = 10 años: A / (D + B)^n', () => {
    expect(intensidadEstacion(balsamo, 10, 5)).toBeCloseTo(3657.01 / Math.pow(5 + 18.72, 0.834), 9);
    expect(intensidadEstacion(balsamo, 10, 5)).toBeCloseTo(260.7, 0);
  });

  it('en todas las estaciones la intensidad crece con T y baja con la duración', () => {
    for (const est of ESTACIONES_IDF) {
      for (let k = 1; k < PERIODOS_RETORNO.length; k++) {
        expect(intensidadEstacion(est, PERIODOS_RETORNO[k], 5)).toBeGreaterThan(intensidadEstacion(est, PERIODOS_RETORNO[k - 1], 5));
      }
      for (let k = 1; k < DURACIONES_MIN.length; k++) {
        expect(intensidadEstacion(est, 10, DURACIONES_MIN[k])).toBeLessThan(intensidadEstacion(est, 10, DURACIONES_MIN[k - 1]));
      }
      const i5 = intensidadEstacion(est, 10, 5);
      expect(i5).toBeGreaterThan(100);
      expect(i5).toBeLessThan(400);
    }
  });

  it('Sherman con periodo de retorno: K · T^m / (D + B)^n', () => {
    expect(intensidadSherman(1000, 0.2, 0.7, 10, 10, 5)).toBeCloseTo((1000 * Math.pow(10, 0.2)) / Math.pow(15, 0.7), 9);
    expect(intensidadSherman(1000, 0.2, 0.7, 10, 0, 5)).toBe(0);
  });

  it('distancia y estación más cercana', () => {
    expect(distanciaKm(14, -91, 14, -91)).toBe(0);
    expect(distanciaKm(14, -91, 15, -91)).toBeCloseTo(111.2, 0);
    const c = estacionMasCercana(14.29, -90.99)!;
    expect(c.estacion.nombre).toBe('El Bálsamo');
    expect(c.util).toBe(true);
    const lejos = estacionMasCercana(15.47, -90.37)!; // Cobán
    expect(lejos.util).toBe(false);
    expect(estacionMasCercana(NaN, 0)).toBeNull();
  });
});
