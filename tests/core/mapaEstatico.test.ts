import { describe, expect, it } from 'vitest';
import { atribucionTexto, barraEscala, metrosPorPixel, pixelMundo, teselasMapa } from '../../src/core/mapaEstatico';

describe('mapa estático', () => {
  it('pixel del mundo en el origen y en zoom 0', () => {
    const p = pixelMundo(0, 0, 0);
    expect(p.x).toBeCloseTo(128);
    expect(p.y).toBeCloseTo(128);
  });

  it('cubre el recuadro con teselas y deja el punto en el centro', () => {
    const t = teselasMapa({ lat: 14.3, lon: -90.8, zoom: 16, ancho: 400, alto: 300, url: 'https://t/{z}/{x}/{y}.png' });
    expect(t.length).toBeGreaterThanOrEqual(4);
    expect(t.length).toBeLessThanOrEqual(9);
    // Las teselas cubren todo el recuadro
    expect(Math.min(...t.map((x) => x.izquierda))).toBeLessThanOrEqual(0);
    expect(Math.min(...t.map((x) => x.arriba))).toBeLessThanOrEqual(0);
    expect(Math.max(...t.map((x) => x.izquierda + x.lado))).toBeGreaterThanOrEqual(400);
    expect(Math.max(...t.map((x) => x.arriba + x.lado))).toBeGreaterThanOrEqual(300);
    expect(t[0].url).toMatch(/^https:\/\/t\/16\/\d+\/\d+\.png$/);
  });

  it('teselas de 512 px con zoomOffset −1 piden un zoom menos', () => {
    const t = teselasMapa({ lat: 14.3, lon: -90.8, zoom: 16, ancho: 400, alto: 300, url: '{z}/{x}/{y}', tileSize: 512, zoomOffset: -1 });
    expect(t[0].url.startsWith('15/')).toBe(true);
    expect(t.length).toBeLessThanOrEqual(4);
  });

  it('escala: ~2.3 m/px en el ecuador a zoom 16 y barra redonda', () => {
    expect(metrosPorPixel(0, 16)).toBeCloseTo(2.39, 1);
    const b = barraEscala(14.3, 17, 120);
    expect([100, 200, 50, 20]).toContain(b.metros);
    expect(b.px).toBeLessThanOrEqual(120);
    expect(barraEscala(14.3, 7, 100).texto).toMatch(/km$/);
  });

  it('atribución sin HTML', () => {
    expect(atribucionTexto('&copy; <a href="x">OpenStreetMap</a> contributors')).toBe('© OpenStreetMap contributors');
  });
});
