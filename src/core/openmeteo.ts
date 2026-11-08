/**
 * Consulta de lluvia histórica en Open-Meteo (reanálisis ERA5), gratuita para uso no comercial.
 * Datos bajo licencia CC BY 4.0: la app debe mostrar "Datos de lluvia: Open-Meteo.com".
 * https://open-meteo.com/en/docs/historical-weather-api
 */
import { resumirSerieDiaria, type ResumenLluvia } from './lluvia';

export const ATRIBUCION_OPEN_METEO = 'Datos de lluvia: Open-Meteo.com (reanálisis ERA5), CC BY 4.0';

/** Años completos que se promedian. */
export const ANIOS_POR_DEFECTO = 20;

/** Redondea a 2 decimales (~1 km): suficiente para la rejilla de lluvia y protege la ubicación exacta. */
export function redondearCoordenada(v: number): number {
  return Math.round(v * 100) / 100;
}

export function validarCoordenadas(lat: number, lon: number): string | null {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return 'La latitud debe estar entre -90 y 90.';
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return 'La longitud debe estar entre -180 y 180.';
  return null;
}

/** Periodo de los últimos `anios` años completos (termina el 31 de diciembre del año pasado). */
export function periodoConsulta(hoy = new Date(), anios = ANIOS_POR_DEFECTO) {
  const fin = hoy.getFullYear() - 1;
  return { inicio: `${fin - anios + 1}-01-01`, fin: `${fin}-12-31` };
}

export function urlOpenMeteo(lat: number, lon: number, periodo = periodoConsulta()): string {
  const p = new URLSearchParams({
    latitude: String(redondearCoordenada(lat)),
    longitude: String(redondearCoordenada(lon)),
    start_date: periodo.inicio,
    end_date: periodo.fin,
    daily: 'precipitation_sum',
    timezone: 'auto',
  });
  return `https://archive-api.open-meteo.com/v1/archive?${p}`;
}

interface RespuestaOpenMeteo {
  daily?: { time?: unknown; precipitation_sum?: unknown };
  error?: boolean;
  reason?: string;
}

/** Valida la respuesta de Open-Meteo y extrae la serie diaria. */
export function leerRespuestaOpenMeteo(json: unknown): { fechas: string[]; valores: (number | null)[] } {
  const r = json as RespuestaOpenMeteo;
  if (r?.error) throw new Error(`Open-Meteo respondió con un error: ${r.reason ?? 'sin detalle'}`);
  const fechas = r?.daily?.time;
  const valores = r?.daily?.precipitation_sum;
  if (!Array.isArray(fechas) || !Array.isArray(valores) || fechas.length !== valores.length || fechas.length === 0) {
    throw new Error('La respuesta de Open-Meteo no trae la serie diaria de lluvia esperada.');
  }
  return {
    fechas: fechas.map(String),
    valores: valores.map((v) => (typeof v === 'number' ? v : null)),
  };
}

/** Descarga 20 años de lluvia diaria para el punto y devuelve el resumen mensual/anual. */
export async function consultarLluviaOpenMeteo(
  lat: number,
  lon: number,
  fetchFn: typeof fetch = fetch,
): Promise<ResumenLluvia> {
  const error = validarCoordenadas(lat, lon);
  if (error) throw new Error(error);
  const resp = await fetchFn(urlOpenMeteo(lat, lon));
  if (!resp.ok) {
    throw new Error(
      resp.status === 429
        ? 'Se alcanzó el límite diario de consultas gratuitas de Open-Meteo. Intenta más tarde.'
        : `No se pudo consultar Open-Meteo (código ${resp.status}).`,
    );
  }
  const { fechas, valores } = leerRespuestaOpenMeteo(await resp.json());
  return resumirSerieDiaria(fechas, valores, 'Open-Meteo (reanálisis ERA5)');
}
