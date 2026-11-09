/**
 * Conteo de visitas con GoatCounter (sin cookies ni identificadores).
 *
 * Se usa el "píxel" de GoatCounter: una imagen invisible a https://CODIGO.goatcounter.com/count
 * con la ruta del paso (p. ej. /paso-3) o el nombre de un evento (informe-pdf). No se carga ningún
 * script externo y no se envían datos del proyecto ni de la persona.
 * El código del sitio se configura con la variable VITE_GOATCOUNTER_CODE al compilar (docs/ANALITICA.md).
 */

export const CODIGO_GOATCOUNTER: string = (import.meta.env.VITE_GOATCOUNTER_CODE ?? '').trim().toLowerCase();

export function codigoValido(c: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}$/.test(c);
}

export function urlConteo(codigo: string, ruta: string, opciones: { titulo?: string; evento?: boolean } = {}, rnd = Date.now()): string | null {
  if (!codigoValido(codigo)) return null;
  const q = new URLSearchParams({ p: ruta });
  if (opciones.titulo) q.set('t', opciones.titulo);
  if (opciones.evento) q.set('e', 'true');
  q.set('rnd', String(rnd));
  return `https://${codigo}.goatcounter.com/count?${q.toString()}`;
}

/** Cuenta una vista o un evento. No hace nada sin código, en localhost o con "No rastrear" activado. */
export function contar(ruta: string, opciones: { titulo?: string; evento?: boolean } = {}): void {
  try {
    if (typeof window === 'undefined' || typeof Image === 'undefined') return;
    if (/^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname)) return;
    if (navigator.doNotTrack === '1') return;
    const url = urlConteo(CODIGO_GOATCOUNTER, ruta, opciones);
    if (url) new Image().src = url;
  } catch {
    /* el conteo nunca debe interrumpir la app */
  }
}
