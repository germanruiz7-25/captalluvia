import { describe, expect, it } from 'vitest';
import {
  LITROS_BARRIL,
  barrilesEquivalentes,
  calcularTanque,
  simularTanque,
  sugerirCisterna,
  tanqueSugerido,
  tanquesNecesarios,
  volumenCisternaM3,
  volumenNecesarioM3,
} from '../../src/core/tanque';

// Lluvia en 6 meses (mayo-octubre), demanda pareja
const oferta = [0, 0, 0, 0, 15, 15, 15, 15, 15, 15, 0, 0]; // 90 m³
const demanda = Array(12).fill(6); // 72 m³

describe('tanque de almacenamiento', () => {
  it('pico secuente: guarda lo necesario para los 6 meses secos', () => {
    // La época seca dura 6 meses (nov–abr) × 6 = 36 m³
    const r = volumenNecesarioM3(oferta, demanda);
    expect(r.criterio).toBe('cubre');
    expect(r.volumenM3).toBeCloseTo(36, 9);
  });

  it('con ese volumen no falta agua en el año estable', () => {
    const meses = simularTanque(oferta, demanda, 36);
    expect(meses.reduce((a, m) => a + m.faltanteM3, 0)).toBeCloseTo(0, 9);
    expect(Math.max(...meses.map((m) => m.nivelM3))).toBeCloseTo(36, 9);
    // lo que sobra se rebalsa: 90 − 72 = 18 m³
    expect(meses.reduce((a, m) => a + m.rebalseM3, 0)).toBeCloseTo(18, 9);
  });

  it('con un tanque más chico falta agua en la época seca', () => {
    const r = calcularTanque(oferta, demanda, 20);
    expect(r.cobertura).toBeLessThan(1);
    expect(r.cobertura).toBeCloseTo(1 - 16 / 72, 9);
  });

  it('si la oferta no alcanza, guarda todo el excedente y avisa', () => {
    const poca = oferta.map((x) => x / 2); // 45 m³ < 72
    const r = calcularTanque(poca, demanda);
    expect(r.criterio).toBe('parcial');
    expect(r.volumenM3).toBeCloseTo(6 * (7.5 - 6), 9); // 9 m³ de excedente en 6 meses
    expect(r.cobertura).toBeLessThan(1);
  });

  it('sin lluvia no hay tanque', () => {
    expect(volumenNecesarioM3(Array(12).fill(0), demanda).volumenM3).toBe(0);
  });

  it('número de tanques y tanque sugerido', () => {
    expect(tanquesNecesarios(36, 2500)).toBe(15);
    expect(tanquesNecesarios(2.5, 2500)).toBe(1);
    expect(tanquesNecesarios(0, 2500)).toBe(0);
    expect(tanqueSugerido(1).capacidadL).toBe(450); // 3 de 450
    expect(tanqueSugerido(8).capacidadL).toBe(2500); // 4 de 2,500
    expect(tanqueSugerido(36).capacidadL).toBe(10000); // 4 de 10,000
    expect(tanqueSugerido(100).capacidadL).toBe(10000);
  });

  it('cisterna de base cuadrada con altura útil y borde libre', () => {
    const c = sugerirCisterna(36, 1.5)!;
    expect(c.largoM).toBeCloseTo(4.9, 9); // √24 = 4.899 → 4.9
    expect(c.anchoM).toBe(c.largoM);
    expect(c.volumenM3).toBeGreaterThanOrEqual(36);
    expect(c.bordeLibreM).toBe(0.3);
    expect(volumenCisternaM3(3, 2, 1.5)).toBeCloseTo(9, 9);
    expect(sugerirCisterna(0)).toBeNull();
  });
});

describe('barriles de 55 galones', () => {
  it('10 m³ son unos 48 barriles de 208 L', () => {
    expect(LITROS_BARRIL).toBeCloseTo(208.2, 1);
    expect(barrilesEquivalentes(10)).toBeCloseTo(48.03, 2);
    expect(barrilesEquivalentes(0)).toBe(0);
  });

  it('el volumen elegido cambia la simulación y la cobertura', () => {
    const r = calcularTanque(oferta, demanda, 10);
    expect(r.volumenM3).toBeCloseTo(36, 9); // el necesario no cambia
    expect(Math.max(...r.meses.map((m) => m.nivelM3))).toBeCloseTo(10, 9);
    expect(r.cobertura).toBeLessThan(1);
  });
});
