/** Versión de la app, tomada de package.json al compilar. */
declare const __APP_VERSION__: string;

/** Claves de mapas satelitales (opcionales), definidas como variables del repositorio al compilar. */
interface ImportMetaEnv {
  readonly VITE_ESRI_KEY?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_MAPTILER_KEY?: string;
}
