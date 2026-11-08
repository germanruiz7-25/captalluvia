/**
 * Mapas base para ubicar la vivienda. OpenStreetMap siempre está disponible (no usa clave).
 * Las imágenes satelitales aparecen solo si su clave se configuró al compilar
 * (variables de GitHub VITE_ESRI_KEY, VITE_MAPBOX_TOKEN y VITE_MAPTILER_KEY).
 * Las claves de mapas web quedan visibles en el navegador: deben restringirse al dominio
 * del sitio en el panel de cada proveedor.
 */
import { ATRIBUCION_OSM, TESELAS_OSM } from './geocodificacion';

export type IdCapa = 'osm' | 'esri' | 'mapbox' | 'maptiler';

export interface CapaMapa {
  id: IdCapa;
  nombre: string;
  /** Nombre corto para el botón. */
  corto: string;
  url: string;
  atribucion: string;
  maxZoom: number;
  /** Tamaño del cuadro en píxeles y ajuste de zoom (512 px con zoomOffset -1). */
  tileSize?: number;
  zoomOffset?: number;
  satelite: boolean;
}

export interface ClavesMapa {
  esri?: string;
  mapbox?: string;
  maptiler?: string;
}

const limpia = (v: string | undefined) => (v ?? '').trim();

export function capasDisponibles(claves: ClavesMapa): CapaMapa[] {
  const capas: CapaMapa[] = [
    { id: 'osm', nombre: 'Calles (OpenStreetMap)', corto: 'Calles', url: TESELAS_OSM, atribucion: ATRIBUCION_OSM, maxZoom: 19, satelite: false },
  ];
  const esri = limpia(claves.esri);
  if (esri) {
    capas.push({
      id: 'esri',
      nombre: 'Satélite (Esri)',
      corto: 'Esri',
      url: `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${encodeURIComponent(esri)}`,
      atribucion: 'Powered by <a href="https://www.esri.com">Esri</a> | Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 19,
      satelite: true,
    });
  }
  const mapbox = limpia(claves.mapbox);
  if (mapbox) {
    capas.push({
      id: 'mapbox',
      nombre: 'Satélite (Mapbox)',
      corto: 'Mapbox',
      url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}?access_token=${encodeURIComponent(mapbox)}`,
      atribucion:
        '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <a href="https://www.mapbox.com/map-feedback/">Mejorar este mapa</a>',
      maxZoom: 20,
      tileSize: 512,
      zoomOffset: -1,
      satelite: true,
    });
  }
  const maptiler = limpia(claves.maptiler);
  if (maptiler) {
    capas.push({
      id: 'maptiler',
      nombre: 'Satélite (MapTiler)',
      corto: 'MapTiler',
      url: `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.jpg?key=${encodeURIComponent(maptiler)}`,
      atribucion:
        '<a href="https://www.maptiler.com/copyright/">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright">© colaboradores de OpenStreetMap</a>',
      maxZoom: 20,
      satelite: true,
    });
  }
  return capas;
}

/** Capa inicial: la primera satelital disponible (para ver el techo); si no hay, OpenStreetMap. */
export function capaInicial(capas: CapaMapa[], guardada?: string | null): CapaMapa {
  return capas.find((c) => c.id === guardada) ?? capas.find((c) => c.satelite) ?? capas[0];
}

export const CLAVES_COMPILADAS: ClavesMapa = {
  esri: import.meta.env.VITE_ESRI_KEY,
  mapbox: import.meta.env.VITE_MAPBOX_TOKEN,
  maptiler: import.meta.env.VITE_MAPTILER_KEY,
};
