import { describe, expect, it } from 'vitest';
import { codigoValido, urlConteo } from '../../src/core/visitas';

describe('conteo de visitas (GoatCounter)', () => {
  it('solo acepta códigos de sitio simples', () => {
    expect(codigoValido('captalluvia')).toBe(true);
    expect(codigoValido('capta-lluvia2')).toBe(true);
    expect(codigoValido('')).toBe(false);
    expect(codigoValido('evil.com/x')).toBe(false);
  });

  it('arma la URL del píxel con ruta, título y evento', () => {
    const u = urlConteo('captalluvia', '/paso-3', { titulo: 'Paso 3 · Techo' }, 1)!;
    expect(u.startsWith('https://captalluvia.goatcounter.com/count?')).toBe(true);
    const q = new URL(u).searchParams;
    expect(q.get('p')).toBe('/paso-3');
    expect(q.get('t')).toBe('Paso 3 · Techo');
    expect(q.get('e')).toBeNull();
    expect(new URL(urlConteo('captalluvia', 'informe-pdf', { evento: true })!).searchParams.get('e')).toBe('true');
    expect(urlConteo('', '/paso-1')).toBeNull();
  });
});
