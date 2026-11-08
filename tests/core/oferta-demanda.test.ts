import { describe, expect, it } from 'vitest';
import { resumirMensualManual } from '../../src/core/lluvia';
import { calcularOferta } from '../../src/core/oferta';
import { calcularDemanda, litrosDeUsos, USOS_INICIALES } from '../../src/core/demanda';
import { areaMinimaM2 } from '../../src/core/techo';

const lluvia = resumirMensualManual([0, 0, 0, 0, 200, 200, 100, 100, 200, 200, 100, 100], 110);

describe('oferta de agua', () => {
  it('descuenta escorrentía y primer descarte', () => {
    const o = calcularOferta(lluvia, 0.9, 1);
    expect(o.brutaAnualMm).toBe(1200);
    expect(o.perdidaEscorrentiaMm).toBeCloseTo(120, 6);
    expect(o.perdidaDescarteMm).toBeCloseTo(110, 6);
    expect(o.netaAnualMm).toBeCloseTo(970, 6); // igual al ejemplo del plan
    expect(o.eficiencia).toBeCloseTo(970 / 1200, 6);
    expect(o.m3NetosAnual).toBeNull();
  });
  it('convierte a m³ con el área de techo', () => {
    const o = calcularOferta(lluvia, 0.9, 1, 95);
    expect(o.m3BrutosAnual).toBeCloseTo(114, 6);
    expect(o.m3NetosAnual).toBeCloseTo(92.15, 6);
    expect(o.m3NetosMensual?.reduce((t, x) => t + x, 0)).toBeCloseTo(92.15, 6);
  });
  it('compara el umbral con la precipitación neta (PN), no con la lluvia', () => {
    // Mayo: 45 mm de lluvia, pero PN = 45 × 0.9 − días × 1 < 40 → no se capta
    const l = resumirMensualManual([0, 0, 0, 0, 45, 200, 100, 100, 200, 200, 0, 0], 100);
    const o = calcularOferta(l, 0.9, 1);
    expect(l.mensualMm[4]).toBeGreaterThan(40);
    expect(o.pnMensualMm[4]).toBeLessThan(40);
    expect(o.mesesCaptados[4]).toBe(false);
    expect(o.netaMensualMm[4]).toBe(0);
    expect(o.mesesCaptados[5]).toBe(true);
    expect(o.netaMensualMm[5]).toBeCloseTo(o.pnMensualMm[5], 6);
  });
  it('no capta los meses con menos de 40 mm', () => {
    // 1,000 mm en meses lluviosos + 30 mm en dos meses secos
    const l = resumirMensualManual([0, 0, 15, 15, 200, 200, 100, 100, 200, 200, 0, 0], 100);
    const o = calcularOferta(l, 0.9, 1);
    expect(o.umbralMm).toBe(40);
    expect(o.mesesCaptados.slice(0, 5)).toEqual([false, false, false, false, true]);
    expect(o.perdidaMesesSecosMm).toBe(30);
    expect(o.netaMensualMm[2]).toBe(0);
    // la suma de pérdidas y neta reconstruye la lluvia bruta
    const total = o.perdidaMesesSecosMm + o.perdidaEscorrentiaMm + o.perdidaDescarteMm + o.netaAnualMm;
    expect(total).toBeCloseTo(o.brutaAnualMm, 6);
  });
  it('con umbral 0 se capta todo mes con lluvia', () => {
    const l = resumirMensualManual([0, 0, 15, 15, 200, 200, 100, 100, 200, 200, 0, 0], 100);
    const o = calcularOferta(l, 0.9, 1, null, 0);
    expect(o.perdidaMesesSecosMm).toBe(0);
    expect(o.mesesCaptados[2]).toBe(true);
  });
  it('un mes nunca queda negativo', () => {
    const seco = resumirMensualManual([2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 5);
    const o = calcularOferta(seco, 0.6, 1);
    expect(o.netaMensualMm.every((x) => x >= 0)).toBe(true);
  });
});

describe('demanda', () => {
  it('escuela: 150 alumnos × 3 L × 180 días = 81 m³', () => {
    expect(calcularDemanda(150, 3, 180).m3Anual).toBeCloseTo(81, 6);
  });
  it('vivienda: 5 × 50 L × 365 días = 91.25 m³', () => {
    expect(calcularDemanda(5, 50, 365).m3Anual).toBeCloseTo(91.25, 6);
  });
  it('dotación personalizada de escuela: 2 L beber + 1 L lavado = 3 L', () => {
    expect(litrosDeUsos(USOS_INICIALES.escuela)).toBe(3);
  });
  it('ignora valores negativos o vacíos', () => {
    expect(litrosDeUsos([{ nombre: 'x', litros: -4 }, { nombre: 'y', litros: Number.NaN }])).toBe(0);
  });
});

describe('área necesaria con la lluvia neta', () => {
  it('escuela de 150 alumnos con 970 mm netos ≈ 83.5 m²', () => {
    const neta = calcularOferta(lluvia, 0.9, 1).netaAnualMm;
    expect(areaMinimaM2(81, neta)).toBeCloseTo(83.505, 2);
  });
});
