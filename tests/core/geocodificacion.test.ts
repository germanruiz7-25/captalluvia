import { describe, expect, it } from 'vitest';
import { buscarLugar, coordenadaTexto, leerBusqueda, urlBusqueda } from '../../src/core/geocodificacion';

describe('búsqueda de lugares (Nominatim)', () => {
  it('arma la URL con el texto, formato y límite', () => {
    const u = new URL(urlBusqueda('  Chiquimula, Guatemala '));
    expect(u.hostname).toBe('nominatim.openstreetmap.org');
    expect(u.searchParams.get('q')).toBe('Chiquimula, Guatemala');
    expect(u.searchParams.get('format')).toBe('jsonv2');
    expect(u.searchParams.get('limit')).toBe('5');
    expect(u.searchParams.get('accept-language')).toBe('es');
  });

  it('lee resultados válidos y descarta los incompletos', () => {
    const r = leerBusqueda([
      { lat: '14.8', lon: '-89.54', display_name: 'Chiquimula, Guatemala' },
      { lat: 'x', lon: '-89', display_name: 'malo' },
      { lat: '1', lon: '2' },
    ]);
    expect(r).toEqual([{ nombre: 'Chiquimula, Guatemala', lat: 14.8, lon: -89.54 }]);
    expect(leerBusqueda({})).toEqual([]);
  });

  it('pide al menos 3 letras', async () => {
    await expect(buscarLugar('ab', (() => {}) as unknown as typeof fetch)).rejects.toThrow();
  });

  it('usa el fetch indicado y devuelve los lugares', async () => {
    const f = (async () => ({ ok: true, json: async () => [{ lat: '14.6', lon: '-90.5', display_name: 'Guatemala' }] })) as unknown as typeof fetch;
    expect(await buscarLugar('Guatemala', f)).toEqual([{ nombre: 'Guatemala', lat: 14.6, lon: -90.5 }]);
  });

  it('muestra coordenadas con 5 decimales', () => {
    expect(coordenadaTexto(14.3123456)).toBe('14.31235');
    expect(coordenadaTexto(-90.79)).toBe('-90.79');
  });
});

import { leerDireccion, urlDireccion } from '../../src/core/geocodificacion';

describe('dirección del punto (Nominatim reverse)', () => {
  it('arma la URL con lat, lon y detalles de dirección', () => {
    const u = new URL(urlDireccion(14.3, -90.78));
    expect(u.pathname).toBe('/reverse');
    expect(u.searchParams.get('lat')).toBe('14.3');
    expect(u.searchParams.get('addressdetails')).toBe('1');
  });

  it('toma aldea, municipio y departamento', () => {
    expect(
      leerDireccion({ address: { village: 'El Rodeo', county: 'Escuintla', state: 'Escuintla', country: 'Guatemala' } }),
    ).toEqual({ comunidad: 'El Rodeo', municipio: 'Escuintla', departamento: 'Escuintla', pais: 'Guatemala' });
  });

  it('si la comunidad es la cabecera, busca un nivel más fino', () => {
    expect(leerDireccion({ address: { town: 'Masagua', suburb: 'Barrio El Centro', state: 'Escuintla' } })).toEqual({
      comunidad: 'Barrio El Centro',
      municipio: 'Masagua',
      departamento: 'Escuintla',
      pais: '',
    });
  });

  it('sin dirección devuelve null', () => {
    expect(leerDireccion({ error: 'Unable to geocode' })).toBeNull();
    expect(leerDireccion(null)).toBeNull();
  });
});
