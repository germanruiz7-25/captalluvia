import { describe, expect, it } from 'vitest';
import {
  areaParaCaudalM2,
  capacidadBajanteLs,
  capacidadCanaletaLs,
  caudalRacionalLs,
  disenarDrenaje,
} from '../../src/core/drenaje';

describe('método racional', () => {
  it('Q = C·i·A/3600: 95 m², C 0.9, 150 mm/h = 3.56 L/s', () => {
    expect(caudalRacionalLs(0.9, 150, 95)).toBeCloseTo(3.5625, 4);
  });
  it('el área que corresponde a un caudal es la inversa', () => {
    expect(areaParaCaudalM2(3.5625, 0.9, 150)).toBeCloseTo(95, 6);
  });
});

describe('canaleta semicircular (Manning)', () => {
  it('4" con 0.5 % de pendiente, PVC, 75 % de llenado ≈ 1.29 L/s', () => {
    expect(capacidadCanaletaLs(0.1, 0.005, 0.011)).toBeCloseTo(1.29, 2);
  });
  it('a sección semicircular llena coincide con la fórmula cerrada', () => {
    // A = πD²/8, R = D/4
    const D = 0.15;
    const esperado = (1 / 0.011) * ((Math.PI * D * D) / 8) * Math.pow(D / 4, 2 / 3) * Math.sqrt(0.01) * 1000;
    expect(capacidadCanaletaLs(D, 0.01, 0.011, 1)).toBeCloseTo(esperado, 6);
  });
  it('más pendiente o más diámetro dan más capacidad', () => {
    expect(capacidadCanaletaLs(0.1, 0.01, 0.011)).toBeGreaterThan(capacidadCanaletaLs(0.1, 0.005, 0.011));
    expect(capacidadCanaletaLs(0.125, 0.005, 0.011)).toBeGreaterThan(capacidadCanaletaLs(0.1, 0.005, 0.011));
  });
});

describe('bajantes (Wyly y Eaton, llenado 1/3)', () => {
  it('3" (82 mm interior) ≈ 6.4 L/s, igual a la forma original en gpm y pulgadas', () => {
    const gpm = 27.8 * Math.pow(1 / 3, 5 / 3) * Math.pow(82 / 25.4, 8 / 3);
    expect(capacidadBajanteLs(82)).toBeCloseTo(6.40, 2);
    expect(capacidadBajanteLs(82)).toBeCloseTo(gpm * 0.0630902, 2);
  });
  it('crece con D^(8/3)', () => {
    expect(capacidadBajanteLs(164) / capacidadBajanteLs(82)).toBeCloseTo(Math.pow(2, 8 / 3), 6);
  });
});

describe('diseño de canaletas y bajantes', () => {
  const base = { areaM2: 96, largoM: 12, c: 0.9, intensidadMmH: 150, pendientePct: 0.5, material: 'pvc' as const };

  it('dos aguas: dos canaletas, cada una con la mitad del caudal', () => {
    const r = disenarDrenaje({ ...base, aguas: 2 });
    expect(r.numeroCanaletas).toBe(2);
    expect(r.caudalPorCanaletaLs).toBeCloseTo(r.caudalTotalLs / 2, 9);
    expect(r.longitudTotalCanaletaM).toBe(24);
  });

  it('sugiere al menos 3" y una canaleta que cumple', () => {
    const r = disenarDrenaje({ ...base, aguas: 2 });
    const b = r.bajantes[r.bajanteSugerida];
    expect(b.nombre).toBe('3"');
    expect(b.porCanaleta).toBe(1);
    expect(r.canaletaSugerida).toBeGreaterThanOrEqual(0);
    const c = r.canaletas[r.canaletaSugerida];
    expect(c.capacidadLs).toBeGreaterThanOrEqual(r.caudalPorTramoLs);
    // la anterior más pequeña no alcanza
    if (r.canaletaSugerida > 0) expect(r.canaletas[r.canaletaSugerida - 1].cumple).toBe(false);
  });

  it('un techo pequeño usa canal tipo colonial con bajante de 3"', () => {
    const r = disenarDrenaje({ ...base, aguas: 2 });
    expect(r.tipoCanal).toBe('colonial');
    expect(r.lineasSugeridas.every((l) => l.tipo === 'colonial')).toBe(true);
    expect(r.lineasSugeridas.map((l) => l.marca)).toEqual(['Amanco Wavin', 'Durman']);
  });

  it('un techo grande pide canal de alto caudal con bajantes de 4"', () => {
    const r = disenarDrenaje({ ...base, areaM2: 1200, largoM: 40, aguas: 2 });
    const b = r.bajantes[r.bajanteSugerida];
    expect(r.tipoCanal).toBe('alto');
    expect(b.nombre).toBe('4"');
    // 600 m² por canaleta / 120 m² por bajante de 4" (fabricante) = 5
    expect(b.porCanaleta).toBe(5);
    expect(b.porCanaleta * b.capacidadLs).toBeGreaterThanOrEqual(r.caudalPorCanaletaLs);
    expect(r.tramoM).toBeCloseTo(40 / 5, 9);
  });

  it('usa el valor más exigente entre el cálculo y la tabla del fabricante', () => {
    // 100 m² por canaleta: el cálculo pide 1 bajante de 3", el fabricante 2 (60 m² c/u)
    const r = disenarDrenaje({ ...base, areaM2: 100, largoM: 10, aguas: 1 });
    const b3 = r.bajantes.find((b) => b.nombre === '3"')!;
    expect(Math.ceil(r.caudalPorCanaletaLs / b3.capacidadLs)).toBe(1);
    expect(b3.areaFabricanteM2).toBe(60);
    expect(b3.porCanaleta).toBe(2);
    const b2 = r.bajantes.find((b) => b.nombre === '2"')!;
    expect(b2.porCanaleta).toBe(5); // 100 / 20
    const b6 = r.bajantes.find((b) => b.nombre === '6"')!;
    expect(b6.areaFabricanteM2).toBeNull();
  });

  it('cada opción de bajante cubre el caudal de su canaleta', () => {
    const r = disenarDrenaje({ ...base, areaM2: 500, largoM: 25, aguas: 1 });
    for (const b of r.bajantes) {
      expect(b.porCanaleta * b.capacidadLs).toBeGreaterThanOrEqual(r.caudalPorCanaletaLs - 1e-9);
    }
  });
});
