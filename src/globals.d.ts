/** Versión de la app, tomada de package.json al compilar. */
declare const __APP_VERSION__: string;

/** Claves de mapas satelitales (opcionales), definidas como variables del repositorio al compilar. */
interface ImportMetaEnv {
  readonly VITE_ESRI_KEY?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_MAPTILER_KEY?: string;
  /** Dirección de la aplicación web de Google Apps Script que recibe los registros. */
  readonly VITE_REGISTRO_URL?: string;
  /** Código del sitio en GoatCounter (conteo de visitas sin cookies). */
  readonly VITE_GOATCOUNTER_CODE?: string;
}
