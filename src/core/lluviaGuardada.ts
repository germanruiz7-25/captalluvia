/**
 * Lluvia guardada en el dispositivo para usar la app sin internet (modo de campo).
 *
 * Cada consulta satelital que sale bien se guarda (resumen mensual, unos 2 KB). Sin conexión, la app
 * usa la lluvia guardada más cercana si está a menos de DISTANCIA_MAXIMA_KM. El reanálisis ERA5 tiene
 * celdas de 9 a 28 km, así que dentro de esa distancia el resumen es prácticamente el mismo.
 * Así, un técnico puede consultar sus comunidades con internet y luego trabajar en campo sin señal.
 */
import type { ResumenLluvia } from './lluvia';

export const CLAVE_LLUVIAS = 'captalluvia.lluvias.v1';
export const MAXIMO_GUARDADAS = 40;
export const DISTANCIA_MAXIMA_KM = 15;

export interface LluviaGuardada {
  lat: number;
  lon: number;
  /** Fecha de la consulta (ISO). */
  fecha: string;
  /** Nombre del lugar, si se conoce. */
  lugar?: string;
  lluvia: ResumenLluvia;
}

type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function almacen(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Distancia en km entre dos puntos (fórmula del haverseno). */
export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = (g: number) => (g * Math.PI) / 180;
  const dLat = r(lat2 - lat1);
  const dLon = r(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function leerLluvias(a: Almacen | null = almacen()): LluviaGuardada[] {
  try {
    const t = a?.getItem(CLAVE_LLUVIAS);
    const l = t ? (JSON.parse(t) as LluviaGuardada[]) : [];
    return Array.isArray(l)
      ? l.filter((x) => x && Number.isFinite(x.lat) && Number.isFinite(x.lon) && Array.isArray(x.lluvia?.mensualMm))
      : [];
  } catch {
    return [];
  }
}

/** Guarda (o reemplaza, si es el mismo punto) la lluvia consultada. La más reciente queda primero. */
export function guardarLluvia(g: LluviaGuardada, a: Almacen | null = almacen()): LluviaGuardada[] {
  const otras = leerLluvias(a).filter((x) => distanciaKm(x.lat, x.lon, g.lat, g.lon) > 1);
  const lista = [g, ...otras].slice(0, MAXIMO_GUARDADAS);
  try {
    a?.setItem(CLAVE_LLUVIAS, JSON.stringify(lista));
  } catch {
    /* almacenamiento lleno o bloqueado: la app sigue funcionando con internet */
  }
  return lista;
}

/** La lluvia guardada más cercana al punto, si está a menos de `maximoKm`. */
export function lluviaCercana(
  lat: number,
  lon: number,
  lista: LluviaGuardada[] = leerLluvias(),
  maximoKm = DISTANCIA_MAXIMA_KM,
): (LluviaGuardada & { distanciaKm: number }) | null {
  let mejor: (LluviaGuardada & { distanciaKm: number }) | null = null;
  for (const x of lista) {
    const d = distanciaKm(lat, lon, x.lat, x.lon);
    if (d <= maximoKm && (!mejor || d < mejor.distanciaKm)) mejor = { ...x, distanciaKm: d };
  }
  return mejor;
}

export function borrarLluvias(a: Almacen | null = almacen()): void {
  try {
    a?.removeItem(CLAVE_LLUVIAS);
  } catch {
    /* nada */
  }
}

/** ¿El error parece de falta de conexión (y no una respuesta de error del servicio)? */
export function esErrorDeConexion(e: unknown, enLinea = typeof navigator === 'undefined' ? true : navigator.onLine): boolean {
  if (!enLinea) return true;
  return e instanceof TypeError; // fetch lanza TypeError cuando no hay red
}
