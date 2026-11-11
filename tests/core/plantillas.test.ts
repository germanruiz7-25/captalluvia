import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { readSheet } from 'read-excel-file/node';
import { leerCsv, leerEstaciones, type Celda } from '../../src/core/estaciones';

describe('plantillas de lluvia', () => {
  it('la plantilla mensual en Excel se lee sin errores', async () => {
    const filas = (await readSheet('public/plantillas/lluvia-mensual.xlsx')) as Celda[][];
    const r = leerEstaciones(filas);
    expect(r.errores).toEqual([]);
    expect(r.estaciones[0].tipo).toBe('mensual');
    expect(r.estaciones[0].aniosCompletos).toBe(2);
  });
  it('la plantilla diaria en Excel trae fechas reales', async () => {
    const filas = (await readSheet('public/plantillas/lluvia-diaria.xlsx')) as Celda[][];
    const r = leerEstaciones(filas);
    expect(r.errores).toEqual([]);
    expect(r.estaciones[0].tipo).toBe('diaria');
  });
  it('las plantillas CSV se leen igual', () => {
    for (const f of ['lluvia-mensual.csv', 'lluvia-diaria.csv']) {
      const r = leerEstaciones(leerCsv(readFileSync(`public/plantillas/${f}`, 'utf8')));
      expect(r.errores).toEqual([]);
      expect(r.estaciones[0].lat).toBeCloseTo(14.3057);
    }
  });
});
