import { describe, expect, it } from 'vitest';
import { capaInicial, capasDisponibles } from '../../src/core/capasMapa';

describe('mapas base', () => {
  it('sin claves solo hay OpenStreetMap', () => {
    const c = capasDisponibles({});
    expect(c.map((x) => x.id)).toEqual(['osm']);
    expect(capaInicial(c).id).toBe('osm');
  });

  it('con claves aparecen los satélites y se ignoran claves vacías', () => {
    const c = capasDisponibles({ esri: 'E1', mapbox: '  ', maptiler: 'M/1' });
    expect(c.map((x) => x.id)).toEqual(['osm', 'esri', 'maptiler']);
    expect(c[1].url).toContain('ibasemaps-api.arcgis.com');
    expect(c[1].url).toContain('token=E1');
    expect(c[2].url).toContain('key=M%2F1');
    expect(c.every((x) => x.atribucion.length > 0)).toBe(true);
  });

  it('Mapbox usa cuadros de 512 px', () => {
    const [, m] = capasDisponibles({ mapbox: 'pk.x' });
    expect(m.id).toBe('mapbox');
    expect(m.tileSize).toBe(512);
    expect(m.zoomOffset).toBe(-1);
    expect(m.url).toContain('access_token=pk.x');
  });

  it('la capa inicial es la guardada, o el primer satélite', () => {
    const c = capasDisponibles({ esri: 'a', maptiler: 'b' });
    expect(capaInicial(c).id).toBe('esri');
    expect(capaInicial(c, 'maptiler').id).toBe('maptiler');
    expect(capaInicial(c, 'osm').id).toBe('osm');
    expect(capaInicial(c, 'mapbox').id).toBe('esri');
  });
});
