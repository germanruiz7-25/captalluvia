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
  elaboradoPor?: string;
  volumenTanque?: number | null;
  institucionTecnico?: string;
  comunidad?: string;
  municipio?: string;
  departamento?: string;
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
  /** Módulos del techo existente, medidas en planta (m) (desde v0.9.0). */
  modulos?: { ancho: number | null; largo: number | null }[];
  edificio: string;
  usuarios: number;
  dotacionId: string;
  usos: { nombre: string; litros: number }[];
  diasUso: number;
  /** Días de consumo a garantizar con el tanque en la época seca (desde v0.8.0). */
  diasCriticos?: number;
  /** País del proyecto (desde v0.8.0). */
  pais?: string;
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

function validarProyecto(texto: string): Partial<ProyectoGuardado> | null {
  try {
    const p = JSON.parse(texto) as Partial<ProyectoGuardado>;
    if (typeof p !== 'object' || p === null || Array.isArray(p)) return null;
    if (p.lluvia !== null && p.lluvia !== undefined && !lluviaValida(p.lluvia)) p.lluvia = null;
    if (p.modulos !== undefined) {
      p.modulos = Array.isArray(p.modulos) ? p.modulos.filter((m) => !!m && typeof m === 'object') : undefined;
    }
    return p;
  } catch {
    return null;
  }
}

/** Lee el proyecto guardado; devuelve null si no hay o si está dañado. */
export function cargarProyecto(a: Almacen | null = almacen()): Partial<ProyectoGuardado> | null {
  try {
    const texto = a?.getItem(CLAVE_PROYECTO);
    return texto ? validarProyecto(texto) : null;
  } catch {
    return null;
  }
}

// ---------- Archivo del proyecto (guardar y abrir en otro momento o dispositivo) ----------

export const FORMATO_ARCHIVO = 'captalluvia-proyecto';
export const EXTENSION_ARCHIVO = '.captalluvia.json';

/** Contenido del archivo que se descarga: el proyecto con una cabecera de formato y versión. */
export function textoArchivoProyecto(p: ProyectoGuardado, version: string, ahora = new Date()): string {
  return JSON.stringify({ formato: FORMATO_ARCHIVO, version, guardado: ahora.toISOString(), proyecto: p }, null, 2);
}

/** Nombre sugerido del archivo, a partir del lugar y la fecha. */
export function nombreArchivoProyecto(nombre: string, ahora = new Date()): string {
  const base =
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'proyecto';
  return `CaptaLluvia-${base}-${ahora.toISOString().slice(0, 10)}${EXTENSION_ARCHIVO}`;
}

/** Lee un archivo de proyecto; lanza un error con mensaje claro si no es válido. */
export function leerArchivoProyecto(texto: string): Partial<ProyectoGuardado> {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no es un proyecto de CaptaLluvia (no se pudo leer).');
  }
  const d = datos as { formato?: string; proyecto?: unknown };
  if (!d || d.formato !== FORMATO_ARCHIVO || typeof d.proyecto !== 'object') {
    throw new Error('El archivo no es un proyecto de CaptaLluvia.');
  }
  const p = validarProyecto(JSON.stringify(d.proyecto));
  if (!p) throw new Error('El proyecto del archivo está dañado.');
  return p;
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
