import { describe, expect, it } from 'vitest';
import {
  areaMinimaM2,
  calcularTecho,
  demandaAnualM3,
  lluviaAprovechableMm,
  opcionesDeTecho,
  redondearArriba,
} from '../../src/core/techo';

describe('demanda anual', () => {
  it('5 personas × 50 L/día = 91.25 m³/año', () => {
    expect(demandaAnualM3(5, 50)).toBeCloseTo(91.25, 6);
  });
  it('devuelve 0 con datos no válidos', () => {
    expect(demandaAnualM3(0, 50)).toBe(0);
    expect(demandaAnualM3(5, -1)).toBe(0);
  });
});

describe('lluvia aprovechable', () => {
  it('1,200 mm × 0.90 − 110 eventos × 1 mm = 970 mm', () => {
    expect(lluviaAprovechableMm(1200, 0.9, 110, 1)).toBeCloseTo(970, 6);
  });
  it('nunca es negativa', () => {
    expect(lluviaAprovechableMm(50, 0.6, 200, 1)).toBe(0);
  });
});

describe('área mínima', () => {
  it('ejemplo del plan: 94.07 m²', () => {
    expect(areaMinimaM2(91.25, 970)).toBeCloseTo(94.0722, 3);
  });
  it('sin lluvia aprovechable no hay área posible', () => {
    expect(areaMinimaM2(91.25, 0)).toBeNull();
  });
});

describe('redondeo a 0.5 m', () => {
  it.each([
    [9.75, 10],
    [9.5, 9.5],
    [7.96, 8],
    [11.875, 12],
    [13.57, 14],
  ])('%f → %f', (v, esperado) => {
    expect(redondearArriba(v)).toBe(esperado);
  });
});

describe('opciones de techo', () => {
  it('95 m² → 9.5×10, 8×12 y 7×14 (como en el plan)', () => {
    const o = opcionesDeTecho(95);
    expect(o.map((x) => [x.ancho, x.largo])).toEqual([
      [9.5, 10],
      [8, 12],
      [7, 14],
    ]);
  });
  it('cada opción cubre al menos el área pedida', () => {
    for (const area of [12, 38, 57.3, 95, 140, 333]) {
      for (const op of opcionesDeTecho(area)) {
        expect(op.area).toBeGreaterThanOrEqual(Math.ceil(area));
        expect(op.ancho).toBeLessThanOrEqual(op.largo);
      }
    }
  });
});

describe('cálculo completo', () => {
  it('ejemplo del plan con 50 L/día → 95 m²', () => {
    const r = calcularTecho({
      personas: 5,
      litrosPorPersonaDia: 50,
      lluviaAnualMm: 1200,
      diasConLluvia: 110,
      tipoTecho: 'lamina_metalica',
    });
    expect(r.areaMinimaM2).toBe(95);
    expect(r.opciones).toHaveLength(3);
  });
  it('mismo caso con la dotación básica de 20 L/día → 38 m²', () => {
    const r = calcularTecho({
      personas: 5,
      litrosPorPersonaDia: 20,
      lluviaAnualMm: 1200,
      diasConLluvia: 110,
      tipoTecho: 'lamina_metalica',
    });
    expect(r.areaMinimaM2).toBe(38);
  });
});
