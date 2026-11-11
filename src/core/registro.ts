/**
 * Registro de personas usuarias y eventos de uso.
 *
 * - El registro se pide una sola vez por dispositivo y se guarda en el navegador.
 * - Los envíos van a una aplicación web de Google Apps Script (variable VITE_REGISTRO_URL al
 *   compilar) que anota una fila en una hoja de Google y avisa por correo al responsable.
 * - Si no hay conexión, los envíos quedan en cola y se reintentan al volver a abrir la app
 *   o al recuperar la conexión.
 * - Nunca se envían coordenadas, datos de la familia ni datos del techo: ver docs/PRIVACIDAD.md.
 */

export const CLAVE_REGISTRO = 'captalluvia.registro.v1';
export const CLAVE_COLA = 'captalluvia.envios.v1';
/** Versión de la política que acepta la persona al registrarse. */
export const VERSION_POLITICA = '1.0';

export const ROLES = [
  'Técnico o técnica de campo',
  'Ingeniería o arquitectura',
  'Docente o investigación',
  'Estudiante',
  'Municipalidad o gobierno',
  'ONG o cooperación',
  'Familia o particular',
  'Otro',
] as const;

export interface DatosRegistro {
  nombre: string;
  correo: string;
  organizacion: string;
  rol: string;
  pais: string;
  departamento: string;
  municipio: string;
  aceptaPolitica: boolean;
}

export interface Registro extends DatosRegistro {
  /** Identificador aleatorio de esta instalación (no identifica a la persona por sí solo). */
  id: string;
  fecha: string;
  version: string;
  politica: string;
}

export type TipoEvento = 'registro' | 'informe' | 'borrar';

export interface Evento {
  tipo: TipoEvento;
  id: string;
  fecha: string;
  version: string;
  datos: Record<string, string | number>;
}

type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function almacen(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Devuelve los errores por campo (vacío si todo está bien). */
export function validarRegistro(d: DatosRegistro): Partial<Record<keyof DatosRegistro, string>> {
  const e: Partial<Record<keyof DatosRegistro, string>> = {};
  if (d.nombre.trim().length < 3) e.nombre = 'Escribe tu nombre y apellido.';
  if (!CORREO.test(d.correo.trim())) e.correo = 'Escribe un correo válido.';
  if (d.organizacion.trim().length < 2) e.organizacion = 'Escribe tu institución u organización (o "Particular").';
  if (!d.rol) e.rol = 'Elige una opción.';
  if (d.pais.trim().length < 2) e.pais = 'Escribe el país.';
  if (!d.aceptaPolitica) e.aceptaPolitica = 'Para usar la app debes aceptar la política de privacidad y el descargo.';
  return e;
}

export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Recorta y limita cada texto (evita filas enormes en la hoja). */
function limpiar(v: string, max = 120): string {
  return v.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function crearRegistro(d: DatosRegistro, version: string, ahora = new Date()): Registro {
  return {
    nombre: limpiar(d.nombre),
    correo: limpiar(d.correo).toLowerCase(),
    organizacion: limpiar(d.organizacion),
    rol: d.rol,
    pais: limpiar(d.pais, 60),
    departamento: limpiar(d.departamento, 60),
    municipio: limpiar(d.municipio, 60),
    aceptaPolitica: true,
    id: nuevoId(),
    fecha: ahora.toISOString(),
    version,
    politica: VERSION_POLITICA,
  };
}

export function cargarRegistro(a: Almacen | null = almacen()): Registro | null {
  try {
    const t = a?.getItem(CLAVE_REGISTRO);
    if (!t) return null;
    const r = JSON.parse(t) as Registro;
    return r && typeof r.id === 'string' && r.aceptaPolitica ? r : null;
  } catch {
    return null;
  }
}

export function guardarRegistro(r: Registro, a: Almacen | null = almacen()): void {
  try {
    a?.setItem(CLAVE_REGISTRO, JSON.stringify(r));
  } catch {
    /* sin almacenamiento: la app sigue funcionando */
  }
}

/** Quita el registro de este dispositivo (la cola de envíos pendientes se conserva). */
export function borrarRegistroLocal(a: Almacen | null = almacen()): void {
  try {
    a?.removeItem(CLAVE_REGISTRO);
  } catch {
    /* nada */
  }
}

export function eventoRegistro(r: Registro): Evento {
  return {
    tipo: 'registro',
    id: r.id,
    fecha: r.fecha,
    version: r.version,
    datos: {
      nombre: r.nombre,
      correo: r.correo,
      organizacion: r.organizacion,
      rol: r.rol,
      pais: r.pais,
      departamento: r.departamento,
      municipio: r.municipio,
      politica: r.politica,
    },
  };
}

/** Evento al descargar un informe: solo datos generales del proyecto (sin coordenadas). */
export function eventoInforme(
  r: Registro,
  version: string,
  p: {
    pais?: string;
    departamento: string;
    municipio: string;
    infraestructura: string;
    usuarios: number;
    volumenM3?: number | null;
    formato?: 'pdf' | 'word';
  },
  ahora = new Date(),
): Evento {
  return {
    tipo: 'informe',
    id: r.id,
    fecha: ahora.toISOString(),
    version,
    datos: {
      departamento: limpiar(p.departamento, 60),
      municipio: limpiar(p.municipio, 60),
      infraestructura: p.infraestructura,
      usuarios: Math.round(p.usuarios),
      volumenM3: p.volumenM3 != null ? Math.round(p.volumenM3 * 10) / 10 : '',
      formato: p.formato ?? 'pdf',
    },
  };
}

export function eventoBorrar(r: Registro, version: string, ahora = new Date()): Evento {
  return { tipo: 'borrar', id: r.id, fecha: ahora.toISOString(), version, datos: {} };
}

// ---------- Cola de envíos ----------

export function leerCola(a: Almacen | null = almacen()): Evento[] {
  try {
    const t = a?.getItem(CLAVE_COLA);
    const c = t ? (JSON.parse(t) as Evento[]) : [];
    return Array.isArray(c) ? c : [];
  } catch {
    return [];
  }
}

function escribirCola(c: Evento[], a: Almacen | null): void {
  try {
    if (c.length) a?.setItem(CLAVE_COLA, JSON.stringify(c.slice(-50)));
    else a?.removeItem(CLAVE_COLA);
  } catch {
    /* nada */
  }
}

export type Enviar = (url: string, e: Evento) => Promise<void>;

/**
 * Envío a Apps Script. Se manda como text/plain para evitar la consulta previa de CORS;
 * con mode 'no-cors' la respuesta no se puede leer: si fetch no falla, se da por enviado.
 */
export const enviarFetch: Enviar = async (url, e) => {
  await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(e) });
};

/** Agrega el evento a la cola y envía todo lo pendiente. Devuelve cuántos quedaron sin enviar. */
export async function encolarYEnviar(
  url: string | undefined,
  e: Evento | null,
  enviar: Enviar = enviarFetch,
  a: Almacen | null = almacen(),
): Promise<number> {
  let cola = leerCola(a);
  if (e) {
    // Un "borrar" anula lo que estaba pendiente de esa instalación
    if (e.tipo === 'borrar') cola = cola.filter((x) => x.id !== e.id);
    cola.push(e);
  }
  if (!url) {
    escribirCola(cola, a);
    return cola.length;
  }
  const pendientes: Evento[] = [];
  for (const ev of cola) {
    try {
      await enviar(url, ev);
    } catch {
      pendientes.push(ev);
    }
  }
  escribirCola(pendientes, a);
  return pendientes.length;
}

export const URL_REGISTRO: string | undefined = (import.meta.env.VITE_REGISTRO_URL ?? '').trim() || undefined;
