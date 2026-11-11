/**
 * Lluvia de estaciones meteorológicas aportada por el usuario (segunda opción; la principal es la
 * serie satelital). Lee tablas de Excel o CSV con datos mensuales o diarios de una o varias
 * estaciones, con sus coordenadas, y calcula los promedios mensuales con control de calidad.
 *
 * Formatos (una fila por dato; el orden de columnas es libre, se reconocen por el encabezado):
 *   mensual: Estación | Latitud | Longitud | Año | Mes | Lluvia (mm)
 *   diario:  Estación | Latitud | Longitud | Fecha | Lluvia (mm)
 */
import { COBERTURA_MINIMA_MES, UMBRAL_DIA_LLUVIA_MM, type ResumenLluvia } from './lluvia';
import { distanciaKm } from './idf';

export type Celda = string | number | boolean | Date | null | undefined;
export type Calidad = 'buena' | 'regular' | 'insuficiente';

/** Años mínimos recomendados para un promedio climático confiable. */
export const ANIOS_RECOMENDADOS = 10;
export const ANIOS_MINIMOS = 5;
/** Distancias a partir de las cuales se advierte que la estación puede no representar el sitio (km). */
export const DISTANCIA_AVISO_KM = 25;
export const DISTANCIA_LEJOS_KM = 50;

export interface Estacion {
  nombre: string;
  lat: number;
  lon: number;
  tipo: 'diaria' | 'mensual';
  /** Promedio de cada mes (mm) con los años que tienen ese mes. */
  mensualMm: number[];
  /** Días con lluvia promedio de cada mes (solo con datos diarios). */
  diasLluviaMes: number[] | null;
  /** Años con dato en cada mes. */
  aniosPorMes: number[];
  /** Años con los 12 meses completos. */
  aniosCompletos: number;
  anioInicio: number;
  anioFin: number;
  anualMm: number;
  calidad: Calidad;
}

export interface LecturaEstaciones {
  estaciones: Estacion[];
  errores: string[];
  avisos: string[];
}

const MESES_TEXTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function normalizar(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

type Columna = 'estacion' | 'lat' | 'lon' | 'anio' | 'mes' | 'fecha' | 'mm';

const ALIAS: Record<Columna, string[]> = {
  estacion: ['estacion', 'nombre estacion', 'nombre', 'station'],
  lat: ['latitud', 'lat', 'latitude'],
  lon: ['longitud', 'lon', 'long', 'longitude'],
  anio: ['ano', 'anio', 'year'],
  mes: ['mes', 'month'],
  fecha: ['fecha', 'date', 'dia'],
  mm: ['lluvia', 'precipitacion', 'lluvia mm', 'precipitacion mm', 'mm', 'pp', 'prcp', 'rain', 'rainfall'],
};

/** Ubica las columnas a partir de la fila de encabezados. */
export function columnas(encabezado: Celda[]): Partial<Record<Columna, number>> {
  const r: Partial<Record<Columna, number>> = {};
  encabezado.forEach((c, i) => {
    const t = normalizar(String(c ?? ''));
    if (!t) return;
    for (const col of Object.keys(ALIAS) as Columna[]) {
      if (r[col] === undefined && ALIAS[col].some((a) => t === a || t.startsWith(a + ' '))) {
        r[col] = i;
        break;
      }
    }
  });
  return r;
}

export function numero(v: Celda): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'boolean' || v instanceof Date) return null;
  let t = String(v).trim().replace(/\s/g, '');
  if (!t || t === '-' || /^(nd|na|s\/d|sd|null)$/i.test(t)) return null;
  // 1.234,5 o 1,234.5 o 12,5
  if (t.includes(',') && t.includes('.')) t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  else if (t.includes(',')) t = t.replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function mesDe(v: Celda): number | null {
  const n = numero(v);
  if (n !== null) return Number.isInteger(n) && n >= 1 && n <= 12 ? n - 1 : null;
  const t = normalizar(String(v ?? '')).slice(0, 3);
  const i = MESES_TEXTO.indexOf(t);
  return i >= 0 ? i : null;
}

/** Fecha → [año, mes0, día]. Acepta Date, serie de Excel, AAAA-MM-DD y DD/MM/AAAA. */
export function fechaDe(v: Celda): [number, number, number] | null {
  if (v instanceof Date && !isNaN(v.getTime())) return [v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()];
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
  }
  const t = String(v ?? '').trim();
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return valida(+m[1], +m[2] - 1, +m[3]);
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) return valida(+m[3], +m[2] - 1, +m[1]);
  return null;
}

function valida(a: number, m: number, d: number): [number, number, number] | null {
  return a > 1800 && a < 2200 && m >= 0 && m < 12 && d >= 1 && d <= diasDelMes(a, m) ? [a, m, d] : null;
}

function diasDelMes(anio: number, mes0: number): number {
  return new Date(Date.UTC(anio, mes0 + 1, 0)).getUTCDate();
}

export function calidadPorAnios(n: number): Calidad {
  return n >= ANIOS_RECOMENDADOS ? 'buena' : n >= ANIOS_MINIMOS ? 'regular' : 'insuficiente';
}

interface Acumulado {
  nombre: string;
  lat: number | null;
  lon: number | null;
  tipo: 'diaria' | 'mensual';
  /** clave anio-mes → total del mes (mensual) o suma/días válidos/días con lluvia (diaria) */
  meses: Map<string, { anio: number; mes: number; mm: number; validos: number; dias: number }>;
}

/** Lee una tabla (primera fila con encabezados) de una o varias estaciones. */
export function leerEstaciones(filas: Celda[][]): LecturaEstaciones {
  const errores: string[] = [];
  const avisos: string[] = [];
  const iEnc = filas.findIndex((f) => {
    const c = columnas(f);
    return c.mm !== undefined && (c.fecha !== undefined || (c.anio !== undefined && c.mes !== undefined));
  });
  if (iEnc < 0) {
    return {
      estaciones: [],
      errores: [
        'No se encontraron los encabezados. Usa la plantilla: Estación, Latitud, Longitud, Año, Mes y Lluvia (mm) para datos mensuales, o Estación, Latitud, Longitud, Fecha y Lluvia (mm) para datos diarios.',
      ],
      avisos,
    };
  }
  const c = columnas(filas[iEnc]);
  const diaria = c.fecha !== undefined;
  if (c.lat === undefined || c.lon === undefined) errores.push('Faltan las columnas Latitud y Longitud de la estación.');

  const porEstacion = new Map<string, Acumulado>();
  let ignoradas = 0;
  let negativas = 0;
  for (const f of filas.slice(iEnc + 1)) {
    if (!f || f.every((x) => x === null || x === undefined || x === '')) continue;
    const nombre = c.estacion !== undefined ? String(f[c.estacion] ?? '').trim() || 'Estación' : 'Estación';
    const acc =
      porEstacion.get(nombre) ??
      ({ nombre, lat: null, lon: null, tipo: diaria ? 'diaria' : 'mensual', meses: new Map() } satisfies Acumulado);
    porEstacion.set(nombre, acc);
    if (acc.lat === null && c.lat !== undefined) acc.lat = numero(f[c.lat]);
    if (acc.lon === null && c.lon !== undefined) acc.lon = numero(f[c.lon]);

    let anio: number, mes: number;
    if (diaria) {
      const d = fechaDe(f[c.fecha!]);
      if (!d) {
        ignoradas++;
        continue;
      }
      [anio, mes] = d;
    } else {
      const a = numero(f[c.anio!]);
      const m = mesDe(f[c.mes!]);
      if (a === null || m === null || a < 1800 || a > 2200) {
        ignoradas++;
        continue;
      }
      anio = Math.round(a);
      mes = m;
    }
    const v = numero(f[c.mm!]);
    const clave = `${anio}-${mes}`;
    const m = acc.meses.get(clave) ?? { anio, mes, mm: 0, validos: 0, dias: 0 };
    if (v !== null && v >= 0) {
      m.mm += v;
      m.validos += 1;
      if (v >= UMBRAL_DIA_LLUVIA_MM) m.dias += 1;
    } else if (v !== null) negativas++;
    acc.meses.set(clave, m);
  }
  if (ignoradas) avisos.push(`Se ignoraron ${ignoradas} filas sin ${diaria ? 'fecha' : 'año o mes'} válido.`);
  if (negativas) avisos.push(`Se ignoraron ${negativas} valores negativos (se tomaron como dato faltante).`);

  const estaciones: Estacion[] = [];
  for (const acc of porEstacion.values()) {
    if (acc.lat === null || acc.lon === null || Math.abs(acc.lat) > 90 || Math.abs(acc.lon) > 180) {
      errores.push(`La estación "${acc.nombre}" no tiene latitud y longitud válidas (grados decimales, p. ej. 14.31 y -90.79).`);
      continue;
    }
    const e = resumirEstacion(acc);
    if (!e) {
      errores.push(`La estación "${acc.nombre}" no tiene meses con datos suficientes.`);
      continue;
    }
    estaciones.push(e);
  }
  if (!estaciones.length && !errores.length) errores.push('El archivo no tiene datos de lluvia.');
  return { estaciones, errores, avisos };
}

function resumirEstacion(acc: Acumulado): Estacion | null {
  const totales: number[][] = Array.from({ length: 12 }, () => []);
  const dias: number[][] = Array.from({ length: 12 }, () => []);
  const mesesPorAnio = new Map<number, number>();
  for (const m of acc.meses.values()) {
    let total: number, nd: number;
    if (acc.tipo === 'diaria') {
      const dm = diasDelMes(m.anio, m.mes);
      if (m.validos < COBERTURA_MINIMA_MES * dm) continue;
      const factor = dm / m.validos;
      total = m.mm * factor;
      nd = m.dias * factor;
    } else {
      if (m.validos === 0) continue;
      total = m.mm; // si hay filas repetidas del mismo mes se suman
      nd = 0;
    }
    totales[m.mes].push(total);
    dias[m.mes].push(nd);
    mesesPorAnio.set(m.anio, (mesesPorAnio.get(m.anio) ?? 0) + 1);
  }
  const anios = [...mesesPorAnio.keys()].sort((a, b) => a - b);
  if (!anios.length) return null;
  const prom = (xs: number[]) => (xs.length ? xs.reduce((t, x) => t + x, 0) / xs.length : 0);
  const mensualMm = totales.map(prom);
  const aniosPorMes = totales.map((xs) => xs.length);
  const aniosCompletos = [...mesesPorAnio.values()].filter((n) => n === 12).length;
  return {
    nombre: acc.nombre,
    lat: acc.lat!,
    lon: acc.lon!,
    tipo: acc.tipo,
    mensualMm,
    diasLluviaMes: acc.tipo === 'diaria' ? dias.map(prom) : null,
    aniosPorMes,
    aniosCompletos,
    anioInicio: anios[0],
    anioFin: anios.at(-1)!,
    anualMm: mensualMm.reduce((t, x) => t + x, 0),
    calidad: calidadPorAnios(Math.min(...aniosPorMes)),
  };
}

// ---------- Combinar estaciones ----------

export type MetodoCombinacion = 'idw' | 'simple';

export interface UsoEstacion {
  nombre: string;
  lat: number;
  lon: number;
  distanciaKm: number;
  anios: number;
  anioInicio: number | null;
  anioFin: number | null;
  peso: number;
}

/** Pesos por inverso de la distancia al cuadrado (IDW); una estación a menos de 0.5 km pesa como si estuviera a 0.5 km. */
export function pesos(distancias: number[], metodo: MetodoCombinacion): number[] {
  const w = metodo === 'idw' ? distancias.map((d) => 1 / Math.max(d, 0.5) ** 2) : distancias.map(() => 1);
  const s = w.reduce((t, x) => t + x, 0);
  return w.map((x) => x / s);
}

/**
 * Combina una o varias estaciones en el resumen de lluvia del sitio.
 * @param diasLluviaAnual días con lluvia al año, obligatorio si alguna estación es mensual
 */
export function combinarEstaciones(
  est: Estacion[],
  sitio: { lat: number; lon: number },
  metodo: MetodoCombinacion,
  diasLluviaAnual: number | null,
): ResumenLluvia {
  if (!est.length) throw new Error('Elige al menos una estación.');
  const d = est.map((e) => distanciaKm(sitio.lat, sitio.lon, e.lat, e.lon));
  const w = est.length === 1 ? [1] : pesos(d, metodo);
  const mensualMm = Array.from({ length: 12 }, (_, m) => est.reduce((t, e, i) => t + w[i] * e.mensualMm[m], 0));
  const anual = mensualMm.reduce((t, x) => t + x, 0);
  let diasLluviaMes: number[];
  if (est.every((e) => e.diasLluviaMes) && diasLluviaAnual === null) {
    diasLluviaMes = Array.from({ length: 12 }, (_, m) => est.reduce((t, e, i) => t + w[i] * e.diasLluviaMes![m], 0));
  } else {
    const dias = Math.max(0, diasLluviaAnual ?? 0);
    diasLluviaMes = mensualMm.map((x) => (anual > 0 ? (dias * x) / anual : 0));
  }
  const usos: UsoEstacion[] = est.map((e, i) => ({
    nombre: e.nombre,
    lat: e.lat,
    lon: e.lon,
    distanciaKm: d[i],
    anios: Math.min(...e.aniosPorMes),
    anioInicio: e.anioInicio,
    anioFin: e.anioFin,
    peso: w[i],
  }));
  return {
    mensualMm,
    diasLluviaMes,
    anualMm: anual,
    diasLluviaAnual: diasLluviaMes.reduce((t, x) => t + x, 0),
    anios: Math.min(...usos.map((u) => u.anios)),
    anioInicio: Math.min(...est.map((e) => e.anioInicio)),
    anioFin: Math.max(...est.map((e) => e.anioFin)),
    mesesSinDatos: mensualMm.flatMap((_, m) => (est.every((e) => e.aniosPorMes[m] === 0) ? [m] : [])),
    fuente: textoFuente(usos, metodo),
    estaciones: usos,
    metodo: est.length > 1 ? metodo : undefined,
  };
}

/** Estación escrita a mano: 12 promedios mensuales con sus coordenadas y años de registro. */
export function estacionManual(
  e: { nombre: string; lat: number; lon: number; anios: number },
  mensualMm: number[],
  diasLluviaAnual: number,
  sitio: { lat: number; lon: number } | null,
): ResumenLluvia {
  const mm = Array.from({ length: 12 }, (_, i) => Math.max(0, Number(mensualMm[i]) || 0));
  const anual = mm.reduce((t, x) => t + x, 0);
  const dias = Math.max(0, Number(diasLluviaAnual) || 0);
  const uso: UsoEstacion = {
    nombre: e.nombre.trim(),
    lat: e.lat,
    lon: e.lon,
    distanciaKm: sitio ? distanciaKm(sitio.lat, sitio.lon, e.lat, e.lon) : NaN,
    anios: Math.max(0, Math.round(e.anios)),
    anioInicio: null,
    anioFin: null,
    peso: 1,
  };
  return {
    mensualMm: mm,
    diasLluviaMes: mm.map((x) => (anual > 0 ? (dias * x) / anual : 0)),
    anualMm: anual,
    diasLluviaAnual: dias,
    anios: uso.anios,
    anioInicio: null,
    anioFin: null,
    mesesSinDatos: [],
    fuente: textoFuente([uso], 'simple', true),
    estaciones: [uso],
  };
}

const f1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });

export function textoFuente(usos: UsoEstacion[], metodo: MetodoCombinacion, manual = false): string {
  const una = (u: UsoEstacion) =>
    `${u.nombre} (${u.anios} años${u.anioInicio ? `, ${u.anioInicio}–${u.anioFin}` : ''}${Number.isFinite(u.distanciaKm) ? `, a ${f1(u.distanciaKm)} km` : ''})`;
  if (usos.length === 1) return `Estación ${una(usos[0])}, ${manual ? 'promedios mensuales ingresados por el usuario' : 'datos aportados por el usuario'}`;
  return `Estaciones ${usos.map(una).join('; ')}, datos aportados por el usuario; ${metodo === 'idw' ? 'promedio ponderado por el inverso de la distancia al cuadrado' : 'promedio simple'}`;
}

// ---------- CSV ----------

/** Lee un CSV (separador coma, punto y coma o tabulación; comillas dobles). */
export function leerCsv(texto: string): string[][] {
  const t = texto.replace(/^﻿/, '');
  const primera = t.split(/\r?\n/, 1)[0] ?? '';
  const sep = [';', '\t', ','].map((s) => [s, primera.split(s).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let comillas = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (comillas) {
      if (ch === '"' && t[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (ch === '"') comillas = false;
      else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) {
      fila.push(campo);
      campo = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else campo += ch;
  }
  if (campo !== '' || fila.length) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas;
}
