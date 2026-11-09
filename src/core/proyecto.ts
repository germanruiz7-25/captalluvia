/**
 * Guardado del proyecto en este dispositivo (localStorage). Nada se envía a un servidor.
 * Si el navegador no permite guardar (modo privado, almacenamiento lleno), la app sigue
 * funcionando sin guardar.
 */
import type { ResumenLluvia } from './lluvia';

export const CLAVE_PROYECTO = 'captalluvia.proyecto.v1';

export interface ProyectoGuardado {
  paso: number;
  nombreProyecto: string;
  lat: string;
  lon: string;
  lluvia: ResumenLluvia | null;
  tipoTecho: string;
  aguas: number;
  descarteMm: number;
  umbralMm: number;
  areaDisponible: number | null;
  /** Medidas en planta del techo existente (m). */
  anchoTecho?: number | null;
  largoTecho?: number | null;
  edificio: string;
  usuarios: number;
  dotacionId: string;
  usos: { nombre: string; litros: number }[];
  diasUso: number;
}

type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function almacen(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function lluviaValida(l: unknown): l is ResumenLluvia {
  const x = l as ResumenLluvia;
  return (
    !!x &&
    Array.isArray(x.mensualMm) &&
    x.mensualMm.length === 12 &&
    x.mensualMm.every((v) => Number.isFinite(v)) &&
    Array.isArray(x.diasLluviaMes) &&
    Number.isFinite(x.anualMm)
  );
}

/** Lee el proyecto guardado; devuelve null si no hay o si está dañado. */
export function cargarProyecto(a: Almacen | null = almacen()): Partial<ProyectoGuardado> | null {
  try {
    const texto = a?.getItem(CLAVE_PROYECTO);
    if (!texto) return null;
    const p = JSON.parse(texto) as Partial<ProyectoGuardado>;
    if (typeof p !== 'object' || p === null) return null;
    if (p.lluvia !== null && p.lluvia !== undefined && !lluviaValida(p.lluvia)) p.lluvia = null;
    return p;
  } catch {
    return null;
  }
}

export function guardarProyecto(p: ProyectoGuardado, a: Almacen | null = almacen()): boolean {
  try {
    a?.setItem(CLAVE_PROYECTO, JSON.stringify(p));
    return !!a;
  } catch {
    return false;
  }
}

export function borrarProyecto(a: Almacen | null = almacen()): void {
  try {
    a?.removeItem(CLAVE_PROYECTO);
  } catch {
    /* sin almacenamiento: no hay nada que borrar */
  }
}
