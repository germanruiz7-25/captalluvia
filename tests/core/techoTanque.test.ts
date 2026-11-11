import { describe, expect, it } from 'vitest';
import { areaParaTanque, consumoPosibleM3, evaluarTecho, mesesDeTemporada, nivelMaximo } from '../../src/core/techoTanque';

const captados = [false, false, false, false, true, true, true, true, true, true, false, false];
const pnPlano = captados.map((c) => (c ? 100 : 0));

describe('techo para el tanque del periodo crítico', () => {
  it('ordena la temporada desde el mes que sigue a la época seca', () => {
    expect(mesesDeTemporada(captados, pnPlano)).toEqual([4, 5, 6, 7, 8, 9]);
    const cruzaElAnio = [true, true, false, false, false, false, false, true, true, true, true, true];
    expect(mesesDeTemporada(cruzaElAnio, Array(12).fill(50))).toEqual([7, 8, 9, 10, 11, 0, 1]);
  });

  it('solo llenar = 1000 V / ΣPN; ideal = consumo de la temporada + tanque lleno', () => {
    // 6 meses de 100 mm, tanque de 6 m³, consumo de 1 m³/mes
    const r = areaParaTanque({ pnMensualMm: pnPlano, mesesCaptados: captados, volumenM3: 6, consumoMensualM3: 1 });
    expect(r.soloLlenarM2).toBeCloseTo(10, 6);
    expect(r.idealM2).toBeCloseTo(20, 4);
    expect(r.consumoTemporadaM3).toBe(6);
  });

  it('un mes muy lluvioso: el tanque se llena ese mes aunque el anterior no cubra el consumo', () => {
    const pn = [0, 0, 0, 0, 50, 400, 50, 50, 50, 50, 0, 0];
    const r = areaParaTanque({ pnMensualMm: pn, mesesCaptados: captados, volumenM3: 6, consumoMensualM3: 1 });
    // Mayo no cubre el consumo (0.05 A < 1); junio debe dejar 6 m³: 0.4 A − 1 = 6 → A = 17.5
    expect(r.idealM2!).toBeCloseTo(17.5, 3);
    expect(nivelMaximo(pn, r.mesesTemporada, r.idealM2!, 6, 1)).toBeCloseTo(6, 4);
  });

  it('un mes flojo al final de la temporada no dispara el techo: se protege la reserva', () => {
    const pn = [0, 0, 0, 0, 100, 100, 100, 100, 100, 20, 0, 0];
    const r = areaParaTanque({ pnMensualMm: pn, mesesCaptados: captados, volumenM3: 6, consumoMensualM3: 1 });
    // Se llena en septiembre: 5 × (0.1 A − 1) = 6 → A = 22
    expect(r.idealM2!).toBeCloseTo(22, 3);
    const e = evaluarTecho({ pnMensualMm: pn, mesesCaptados: captados, volumenM3: 6, consumoMensualM3: 1, existenteM2: null });
    expect(e.idealM2).toBe(22);
    expect(e.mesLleno).toBe(8);
    expect(e.mesesProteger).toEqual([9]);
  });

  it('evalúa el techo existente', () => {
    const base = { pnMensualMm: pnPlano, mesesCaptados: captados, volumenM3: 6, consumoMensualM3: 1 };
    expect(evaluarTecho({ ...base, existenteM2: 25 }).estado).toBe('ideal');

    const solo = evaluarTecho({ ...base, existenteM2: 15 });
    expect(solo.estado).toBe('soloLlenar');
    expect(solo.faltaIdealM2).toBe(5);
    // Con 15 m² se captan 9 m³: caben 6 en el tanque y 3 para consumir (0.5 m³/mes ≈ 16 L/día)
    expect(solo.litrosDiaPosibles!).toBeCloseTo((0.5 * 1000) / 30.4, 1);

    const poco = evaluarTecho({ ...base, existenteM2: 5 });
    expect(poco.estado).toBe('insuficiente');
    expect(poco.fraccionLlenado).toBeCloseTo(0.5, 6);
    expect(poco.faltaLlenarM2).toBe(5);
    expect(poco.faltaIdealM2).toBe(15);
  });

  it('consumo posible es null si ni sin usarla se llena', () => {
    expect(consumoPosibleM3(pnPlano, [4, 5, 6, 7, 8, 9], 5, 6)).toBeNull();
  });

  it('sin lluvia o sin tanque no hay área', () => {
    const r = areaParaTanque({ pnMensualMm: Array(12).fill(0), mesesCaptados: Array(12).fill(false), volumenM3: 6, consumoMensualM3: 1 });
    expect(r.idealM2).toBeNull();
  });
});
