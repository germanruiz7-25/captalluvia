import { describe, expect, it } from 'vitest';
import {
  calidadPorAnios,
  combinarEstaciones,
  estacionManual,
  fechaDe,
  leerCsv,
  leerEstaciones,
  numero,
  pesos,
  type Celda,
} from '../../src/core/estaciones';

const MM = [5, 5, 10, 40, 150, 250, 200, 200, 280, 220, 60, 10];

function mensual(nombre: string, lat: number, lon: number, anios: number[], factor = 1): Celda[][] {
  const filas: Celda[][] = [];
  for (const a of anios) for (let m = 1; m <= 12; m++) filas.push([nombre, lat, lon, a, m, MM[m - 1] * factor]);
  return filas;
}

const ENC = ['Estación', 'Latitud', 'Longitud', 'Año', 'Mes', 'Lluvia (mm)'];
const anios = (desde: number, n: number) => Array.from({ length: n }, (_, i) => desde + i);

describe('lectura de valores', () => {
  it('números con coma o punto decimal y faltantes', () => {
    expect(numero('12,5')).toBe(12.5);
    expect(numero('1.234,5')).toBe(1234.5);
    expect(numero('1,234.5')).toBe(1234.5);
    expect(numero('ND')).toBeNull();
    expect(numero('')).toBeNull();
  });
  it('fechas de Excel, ISO y día/mes/año', () => {
    expect(fechaDe('2020-03-15')).toEqual([2020, 2, 15]);
    expect(fechaDe('15/03/2020')).toEqual([2020, 2, 15]);
    expect(fechaDe(43905)).toEqual([2020, 2, 15]);
    expect(fechaDe(new Date(Date.UTC(2020, 2, 15)))).toEqual([2020, 2, 15]);
    expect(fechaDe('31/02/2020')).toBeNull();
  });
});

describe('estaciones con datos mensuales', () => {
  it('promedia cada mes y califica por años de registro', () => {
    const r = leerEstaciones([ENC, ...mensual('Masagua', 14.2, -90.85, anios(2010, 12))]);
    expect(r.errores).toEqual([]);
    const e = r.estaciones[0];
    expect(e.nombre).toBe('Masagua');
    expect(e.tipo).toBe('mensual');
    expect(e.mensualMm[8]).toBeCloseTo(280);
    expect(e.aniosCompletos).toBe(12);
    expect(e.anioInicio).toBe(2010);
    expect(e.calidad).toBe('buena');
    expect(calidadPorAnios(6)).toBe('regular');
    expect(calidadPorAnios(3)).toBe('insuficiente');
  });

  it('acepta nombres de mes y separa varias estaciones', () => {
    const filas: Celda[][] = [ENC, ['A', '14,1', '-90,8', 2020, 'Enero', 10], ['B', 14.5, -90.5, 2020, 'feb', 20]];
    const r = leerEstaciones(filas);
    expect(r.estaciones.map((e) => e.nombre)).toEqual(['A', 'B']);
    expect(r.estaciones[0].mensualMm[0]).toBe(10);
    expect(r.estaciones[1].calidad).toBe('insuficiente');
  });

  it('exige coordenadas válidas', () => {
    const r = leerEstaciones([ENC, ['Sin coordenadas', '', '', 2020, 1, 10]]);
    expect(r.estaciones).toHaveLength(0);
    expect(r.errores[0]).toMatch(/latitud y longitud/);
    expect(leerEstaciones([['x', 'y'], [1, 2]]).errores[0]).toMatch(/encabezados/);
  });
});

describe('estaciones con datos diarios', () => {
  it('suma los días, cuenta días con lluvia y descarta meses incompletos', () => {
    const filas: Celda[][] = [['Estación', 'Latitud', 'Longitud', 'Fecha', 'Lluvia (mm)']];
    for (let d = 1; d <= 31; d++) filas.push(['Costa', 14, -91, `2021-01-${String(d).padStart(2, '0')}`, d <= 10 ? 2 : 0]);
    for (let d = 1; d <= 10; d++) filas.push(['Costa', 14, -91, `2021-02-${String(d).padStart(2, '0')}`, 5]); // 10 de 28 días: incompleto
    const r = leerEstaciones(filas);
    const e = r.estaciones[0];
    expect(e.tipo).toBe('diaria');
    expect(e.mensualMm[0]).toBeCloseTo(20);
    expect(e.diasLluviaMes![0]).toBeCloseTo(10);
    expect(e.aniosPorMes[1]).toBe(0);
  });
});

describe('combinar estaciones', () => {
  const r = leerEstaciones([ENC, ...mensual('Cerca', 14.30, -90.80, anios(2005, 15)), ...mensual('Lejos', 14.60, -90.80, anios(2012, 8), 2)]);
  const [cerca, lejos] = r.estaciones;
  const sitio = { lat: 14.31, lon: -90.79 };

  it('una estación: su promedio, con la distancia y los años en la fuente', () => {
    const l = combinarEstaciones([cerca], sitio, 'idw', 120);
    expect(l.mensualMm[8]).toBeCloseTo(280);
    expect(l.diasLluviaAnual).toBeCloseTo(120);
    expect(l.anios).toBe(15);
    expect(l.estaciones![0].distanciaKm).toBeGreaterThan(1);
    expect(l.fuente).toMatch(/^Estación Cerca \(15 años, 2005–2019, a 1.5 km\)/);
  });

  it('IDW pesa más la estación cercana; promedio simple pesa igual', () => {
    const w = pesos([1.5, 33], 'idw');
    expect(w[0]).toBeGreaterThan(0.99);
    expect(pesos([1, 10], 'simple')).toEqual([0.5, 0.5]);
    const simple = combinarEstaciones([cerca, lejos], sitio, 'simple', 120);
    expect(simple.mensualMm[8]).toBeCloseTo(420);
    expect(simple.anios).toBe(8);
    expect(simple.metodo).toBe('simple');
    const idw = combinarEstaciones([cerca, lejos], sitio, 'idw', 120);
    expect(idw.mensualMm[8]).toBeLessThan(290);
    expect(idw.fuente).toMatch(/inverso de la distancia/);
  });

  it('estación escrita a mano con coordenadas y años', () => {
    const l = estacionManual({ nombre: 'Masagua', lat: 14.2, lon: -90.85, anios: 7 }, MM, 110, sitio);
    expect(l.anualMm).toBe(1430);
    expect(l.anios).toBe(7);
    expect(l.fuente).toMatch(/promedios mensuales ingresados por el usuario/);
  });
});

describe('CSV', () => {
  it('detecta punto y coma y comillas', () => {
    expect(leerCsv('Estación;Lluvia (mm)\r\n"La ""A""";12,5\n')).toEqual([['Estación', 'Lluvia (mm)'], ['La "A"', '12,5']]);
    expect(leerCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });
});
