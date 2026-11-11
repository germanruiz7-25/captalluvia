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

// ---------------------------------------------------------------------------
// Dirección del punto (Nominatim reverse): comunidad, municipio y departamento.
// Solo se consulta cuando la persona pulsa "Completar desde el mapa".
// ---------------------------------------------------------------------------

export interface DireccionLugar {
  comunidad: string;
  municipio: string;
  departamento: string;
  /** País (desde v0.8.0). */
  pais?: string;
}

export function urlDireccion(lat: number, lon: number, idioma = 'es'): string {
  const p = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'jsonv2',
    zoom: '16',
    addressdetails: '1',
    'accept-language': idioma,
  });
  return `https://nominatim.openstreetmap.org/reverse?${p}`;
}

/** Interpreta la dirección de Nominatim (en Guatemala: state = departamento; county/city/town = municipio). */
export function leerDireccion(json: unknown): DireccionLugar | null {
  const a = (json as { address?: Record<string, string> } | null)?.address;
  if (!a || typeof a !== 'object') return null;
  const primero = (...claves: string[]) => claves.map((k) => a[k]).find((v) => typeof v === 'string' && v.trim()) ?? '';
  const municipio = primero('municipality', 'county', 'city', 'town', 'village');
  let comunidad = primero('village', 'hamlet', 'suburb', 'neighbourhood', 'quarter', 'isolated_dwelling', 'town', 'city');
  if (comunidad === municipio) comunidad = primero('hamlet', 'suburb', 'neighbourhood', 'quarter') || comunidad;
  const departamento = primero('state', 'state_district', 'region', 'province');
  const pais = primero('country');
  return municipio || departamento || comunidad ? { comunidad, municipio, departamento, pais } : null;
}

export async function buscarDireccion(lat: number, lon: number, f: typeof fetch = fetch): Promise<DireccionLugar | null> {
  const res = await f(urlDireccion(lat, lon));
  if (!res.ok) throw new Error('No se pudo obtener la dirección del punto.');
  return leerDireccion(await res.json());
}
