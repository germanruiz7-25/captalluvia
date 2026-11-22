import { describe, expect, it } from 'vitest';
import { distanciaKm, esErrorDeConexion, guardarLluvia, leerLluvias, lluviaCercana, MAXIMO_GUARDADAS } from '../../src/core/lluviaGuardada';
import type { ResumenLluvia } from '../../src/core/lluvia';

function memoria() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}
const lluvia = (anual: number): ResumenLluvia => ({
  mensualMm: Array(12).fill(anual / 12), diasLluviaMes: Array(12).fill(5), anualMm: anual, diasLluviaAnual: 60,
  anios: 20, anioInicio: 2005, anioFin: 2024, mesesSinDatos: [], fuente: 'Open-Meteo (reanálisis ERA5)',
});

describe('lluvia guardada para usar sin internet', () => {
  it('mide distancias', () => {
    // 0.1° de latitud ≈ 11.1 km
    expect(distanciaKm(14.3, -90.78, 14.4, -90.78)).toBeCloseTo(11.1, 1);
  });

  it('guarda, reemplaza el mismo punto y encuentra la más cercana', () => {
    const a = memoria();
    guardarLluvia({ lat: 14.3, lon: -90.78, fecha: '2026-11-01', lugar: 'Masagua', lluvia: lluvia(1500) }, a);
    guardarLluvia({ lat: 14.6, lon: -90.5, fecha: '2026-11-01', lugar: 'Guatemala', lluvia: lluvia(1200) }, a);
    guardarLluvia({ lat: 14.301, lon: -90.781, fecha: '2026-11-02', lugar: 'Masagua', lluvia: lluvia(1510) }, a);
    const l = leerLluvias(a);
    expect(l).toHaveLength(2);
    expect(l[0].lluvia.anualMm).toBe(1510);
    const c = lluviaCercana(14.35, -90.8, l)!;
    expect(c.lugar).toBe('Masagua');
    expect(c.distanciaKm).toBeLessThan(15);
    expect(lluviaCercana(15.5, -91.5, l)).toBeNull();
  });

  it('guarda como máximo 40 lugares', () => {
    const a = memoria();
    for (let i = 0; i < 45; i++) guardarLluvia({ lat: 10 + i * 0.1, lon: -90, fecha: '', lluvia: lluvia(1000) }, a);
    expect(leerLluvias(a)).toHaveLength(MAXIMO_GUARDADAS);
  });

  it('distingue la falta de conexión de un error del servicio', () => {
    expect(esErrorDeConexion(new Error('código 500'), false)).toBe(true);
    expect(esErrorDeConexion(new TypeError('Failed to fetch'), true)).toBe(true);
    expect(esErrorDeConexion(new Error('código 429'), true)).toBe(false);
  });
});
