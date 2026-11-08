/**
 * Mapa y búsqueda de lugares con OpenStreetMap.
 *
 * - Mapa base: teselas de OpenStreetMap (© colaboradores de OpenStreetMap, ODbL).
 *   Política de uso: https://operations.osmfoundation.org/policies/tiles/
 * - Búsqueda: Nominatim. Política: máximo 1 consulta por segundo, sin autocompletar
 *   (solo se consulta al pulsar "Buscar"). https://operations.osmfoundation.org/policies/nominatim/
 */

export const TESELAS_OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const ATRIBUCION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>';

/** Vista inicial cuando aún no hay punto: Guatemala completa. */
export const VISTA_INICIAL = { lat: 15.6, lon: -90.3, zoom: 7 };
/** Zoom al marcar una vivienda. */
export const ZOOM_VIVIENDA = 17;

export interface LugarEncontrado {
  nombre: string;
  lat: number;
  lon: number;
}

export function urlBusqueda(texto: string, idioma = 'es'): string {
  const p = new URLSearchParams({
    q: texto.trim(),
    format: 'jsonv2',
    limit: '5',
    'accept-language': idioma,
  });
  return `https://nominatim.openstreetmap.org/search?${p}`;
}

export function leerBusqueda(json: unknown): LugarEncontrado[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((r) => {
    const lat = Number(r?.lat);
    const lon = Number(r?.lon);
    const nombre = typeof r?.display_name === 'string' ? r.display_name : '';
    return Number.isFinite(lat) && Number.isFinite(lon) && nombre ? [{ nombre, lat, lon }] : [];
  });
}

let ultimaBusqueda = 0;

/** Busca un lugar por nombre (municipio, aldea, dirección). Respeta 1 consulta por segundo. */
export async function buscarLugar(texto: string, f: typeof fetch = fetch): Promise<LugarEncontrado[]> {
  if (texto.trim().length < 3) throw new Error('Escribe al menos 3 letras.');
  const espera = 1100 - (Date.now() - ultimaBusqueda);
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaBusqueda = Date.now();
  const res = await f(urlBusqueda(texto));
  if (!res.ok) throw new Error('No se pudo buscar el lugar. Intenta de nuevo en unos segundos.');
  return leerBusqueda(await res.json());
}

/** Coordenadas con 5 decimales (~1 m) para mostrar y guardar en el dispositivo. */
export function coordenadaTexto(v: number): string {
  return (Math.round(v * 1e5) / 1e5).toString();
}
