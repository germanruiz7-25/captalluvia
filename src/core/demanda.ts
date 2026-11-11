/**
 * Demanda de agua según el tipo de edificio, el número de usuarios y la dotación diaria.
 */

export type TipoEdificio = 'vivienda' | 'escuela' | 'institucion';

export interface DatosEdificio {
  nombre: string;
  usuarios: string;
  /** Días de uso al año por defecto (editable). */
  diasUso: number;
  notaDias: string;
  /** Días de consumo a garantizar con el tanque en la época seca (periodo crítico), por defecto. */
  diasCriticos: number;
  notaCriticos: string;
}

export const EDIFICIOS: Record<TipoEdificio, DatosEdificio> = {
  vivienda: {
    nombre: 'Vivienda',
    usuarios: 'Habitantes',
    diasUso: 365,
    notaDias: 'Uso todo el año.',
    diasCriticos: 60,
    notaCriticos: 'Dos meses (60 días) de los más secos del año, por ejemplo marzo y abril.',
  },
  escuela: {
    nombre: 'Escuela',
    usuarios: 'Alumnos, docentes y personal',
    diasUso: 180,
    notaDias: 'Guatemala establece un mínimo de 180 días de clase al año. Ajusta según tu calendario.',
    diasCriticos: 40,
    notaCriticos: 'Unos 40 días de clase de los meses más secos (por ejemplo marzo y abril).',
  },
  institucion: {
    nombre: 'Institución u otro',
    usuarios: 'Usuarios diarios',
    diasUso: 250,
    notaDias: 'Días hábiles aproximados; ajústalos a tu caso.',
    diasCriticos: 44,
    notaCriticos: 'Unos 44 días hábiles de los dos meses más secos.',
  },
};

export interface UsoAgua {
  nombre: string;
  litros: number;
}

export interface Dotacion {
  id: string;
  nombre: string;
  /** Litros por usuario al día; para "personalizada" se suma de `usos`. */
  litros: number;
  descripcion: string;
}

/** Opciones de dotación sugeridas por tipo de edificio. Siempre existe además la personalizada. */
export const DOTACIONES: Record<TipoEdificio, Dotacion[]> = {
  vivienda: [
    { id: 'oms-basica', nombre: '20 L — acceso básico (OMS)', litros: 20, descripcion: 'Beber, cocinar e higiene básica.' },
    { id: 'onu-50', nombre: '50 L — referencia ONU', litros: 50, descripcion: 'Necesidades personales y domésticas.' },
    { id: 'onu-100', nombre: '100 L — referencia ONU óptima', litros: 100, descripcion: 'Incluye lavado de ropa y limpieza.' },
  ],
  escuela: [
    { id: 'escuela-3', nombre: '3 L — beber y lavado de manos', litros: 3, descripcion: '2 L para beber + 1 L para lavado de manos y boca o cocina.' },
  ],
  institucion: [
    { id: 'inst-3', nombre: '3 L — beber y lavado de manos', litros: 3, descripcion: '2 L para beber + 1 L para lavado de manos.' },
    { id: 'inst-20', nombre: '20 L — incluye sanitarios', litros: 20, descripcion: 'Con descarga de sanitarios y limpieza.' },
  ],
};

/** Usos con los que arranca la dotación personalizada, según el tipo de edificio. */
export const USOS_INICIALES: Record<TipoEdificio, UsoAgua[]> = {
  // Valores de ejemplo dentro de los rangos de la Norma Esfera; el usuario los edita.
  vivienda: [
    { nombre: 'Beber', litros: 3 },
    { nombre: 'Cocinar', litros: 5 },
    { nombre: 'Higiene personal', litros: 6 },
  ],
  escuela: [
    { nombre: 'Beber', litros: 2 },
    { nombre: 'Lavado de manos y boca / cocina', litros: 1 },
  ],
  institucion: [
    { nombre: 'Beber', litros: 2 },
    { nombre: 'Lavado de manos', litros: 1 },
  ],
};

export function litrosDeUsos(usos: UsoAgua[]): number {
  return usos.reduce((t, u) => t + Math.max(0, Number(u.litros) || 0), 0);
}

/** Días promedio de un mes (365 ÷ 12). */
export const DIAS_MES = 30.4;

export interface ResumenDemanda {
  usuarios: number;
  litrosPorUsuarioDia: number;
  diasUso: number;
  litrosDia: number;
  /** Demanda mensual Dj = usuarios × L/día × 30.4 días ÷ 1000 (m³/mes). */
  m3Mensual: number;
  /** Demanda anual = usuarios × L/día × días de uso ÷ 1000 (con 365 días ≈ Dj × 12). */
  m3Anual: number;
  /** Días de consumo a garantizar con el tanque en la época seca. */
  diasCriticos: number;
  /** Meses equivalentes (días críticos ÷ 30.4). */
  mesesCriticos: number;
  /** Volumen a almacenar = usuarios × L/día × días críticos ÷ 1000 (m³). */
  m3Critico: number;
}

export function calcularDemanda(usuarios: number, litrosPorUsuarioDia: number, diasUso: number, diasCriticos = 60): ResumenDemanda {
  const u = Math.max(0, Number(usuarios) || 0);
  const l = Math.max(0, Number(litrosPorUsuarioDia) || 0);
  const d = Math.min(366, Math.max(0, Number(diasUso) || 0));
  const dc = Math.min(366, Math.max(0, Number(diasCriticos) || 0));
  return {
    usuarios: u,
    litrosPorUsuarioDia: l,
    diasUso: d,
    litrosDia: u * l,
    m3Mensual: (u * l * DIAS_MES) / 1000,
    m3Anual: (u * l * d) / 1000,
    diasCriticos: dc,
    mesesCriticos: dc / DIAS_MES,
    m3Critico: (u * l * dc) / 1000,
  };
}
