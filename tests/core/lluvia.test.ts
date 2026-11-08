import { describe, expect, it } from 'vitest';
import { resumirMensualManual, resumirSerieDiaria } from '../../src/core/lluvia';
import {
  leerRespuestaOpenMeteo,
  periodoConsulta,
  redondearCoordenada,
  urlOpenMeteo,
  validarCoordenadas,
  consultarLluviaOpenMeteo,
} from '../../src/core/openmeteo';

/** Serie diaria sintética: `mmPorDia(mes)` mm todos los días de cada mes, durante `anios` años. */
function serie(anioInicio: number, anios: number, mmPorDia: (mes0: number) => number | null) {
  const fechas: string[] = [];
  const valores: (number | null)[] = [];
  const d = new Date(Date.UTC(anioInicio, 0, 1));
  const fin = new Date(Date.UTC(anioInicio + anios, 0, 1));
  while (d < fin) {
    fechas.push(d.toISOString().slice(0, 10));
    valores.push(mmPorDia(d.getUTCMonth()));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return { fechas, valores };
}

describe('resumen de serie diaria', () => {
  it('promedia por mes y suma el año', () => {
    // 2 mm diarios de mayo a octubre, 0 el resto, durante 2 años no bisiestos
    const { fechas, valores } = serie(2021, 2, (m) => (m >= 4 && m <= 9 ? 2 : 0));
    const r = resumirSerieDiaria(fechas, valores, 'prueba');
    expect(r.anios).toBe(2);
    expect(r.anioInicio).toBe(2021);
    expect(r.anioFin).toBe(2022);
    expect(r.mensualMm[0]).toBe(0); // enero
    expect(r.mensualMm[4]).toBeCloseTo(62, 6); // mayo: 31 días × 2 mm
    expect(r.mensualMm[5]).toBeCloseTo(60, 6); // junio: 30 × 2
    expect(r.anualMm).toBeCloseTo(2 * (31 + 30 + 31 + 31 + 30 + 31), 6); // 368 mm
    expect(r.diasLluviaMes[4]).toBeCloseTo(31, 6);
    expect(r.diasLluviaAnual).toBeCloseTo(184, 6);
  });

  it('no cuenta como día de lluvia los días bajo 1 mm', () => {
    const { fechas, valores } = serie(2021, 1, () => 0.5);
    const r = resumirSerieDiaria(fechas, valores, 'prueba');
    expect(r.diasLluviaAnual).toBe(0);
    expect(r.anualMm).toBeCloseTo(0.5 * 365, 6);
  });

  it('descarta meses con menos del 80 % de datos y avisa', () => {
    const { fechas, valores } = serie(2021, 1, (m) => (m === 0 ? null : 1));
    const r = resumirSerieDiaria(fechas, valores, 'prueba');
    expect(r.mesesSinDatos).toEqual([0]);
    expect(r.mensualMm[0]).toBe(0);
  });

  it('completa un mes con pocos días faltantes', () => {
    const { fechas, valores } = serie(2021, 1, () => 2);
    valores[0] = null; // falta el 1 de enero
    const r = resumirSerieDiaria(fechas, valores, 'prueba');
    expect(r.mensualMm[0]).toBeCloseTo(62, 6);
  });
});

describe('lluvia mensual ingresada a mano', () => {
  it('reparte los días de lluvia en proporción a la lluvia de cada mes', () => {
    const mm = [0, 0, 0, 0, 200, 200, 100, 100, 200, 200, 0, 0];
    const r = resumirMensualManual(mm, 100);
    expect(r.anualMm).toBe(1000);
    expect(r.diasLluviaMes[4]).toBeCloseTo(20, 6);
    expect(r.diasLluviaMes[6]).toBeCloseTo(10, 6);
    expect(r.diasLluviaAnual).toBe(100);
  });
});

describe('Open-Meteo', () => {
  it('redondea las coordenadas a ~1 km', () => {
    expect(redondearCoordenada(14.30567)).toBe(14.31);
    expect(redondearCoordenada(-90.78512)).toBe(-90.79);
  });
  it('valida coordenadas', () => {
    expect(validarCoordenadas(14.3, -90.8)).toBeNull();
    expect(validarCoordenadas(95, 0)).not.toBeNull();
    expect(validarCoordenadas(0, -200)).not.toBeNull();
  });
  it('pide los últimos 20 años completos', () => {
    expect(periodoConsulta(new Date('2026-11-07T12:00:00'))).toEqual({ inicio: '2006-01-01', fin: '2025-12-31' });
  });
  it('arma la URL con coordenadas redondeadas', () => {
    const url = urlOpenMeteo(14.30567, -90.78512, { inicio: '2006-01-01', fin: '2025-12-31' });
    expect(url).toContain('latitude=14.31');
    expect(url).toContain('longitude=-90.79');
    expect(url).toContain('daily=precipitation_sum');
  });
  it('rechaza respuestas sin serie diaria', () => {
    expect(() => leerRespuestaOpenMeteo({})).toThrow();
    expect(() => leerRespuestaOpenMeteo({ error: true, reason: 'x' })).toThrow(/x/);
  });
  it('consulta y resume (con una respuesta simulada)', async () => {
    const { fechas, valores } = serie(2006, 20, (m) => (m >= 4 && m <= 9 ? 5 : 0));
    const falso = (async () =>
      new Response(JSON.stringify({ daily: { time: fechas, precipitation_sum: valores } }))) as typeof fetch;
    const r = await consultarLluviaOpenMeteo(14.3, -90.8, falso);
    expect(r.anios).toBe(20);
    expect(r.anualMm).toBeCloseTo(5 * 184, 6);
    expect(r.fuente).toContain('Open-Meteo');
  });
});
