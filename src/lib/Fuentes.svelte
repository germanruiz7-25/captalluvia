<script lang="ts">
  import type { ResumenLluvia } from '../core/lluvia';
  import type { TipoEdificio } from '../core/demanda';
  import { redondearCoordenada } from '../core/openmeteo';

  let {
    lluvia,
    lat,
    lon,
    edificio,
    umbralMm,
  }: {
    lluvia: ResumenLluvia | null;
    lat: string;
    lon: string;
    edificio: TipoEdificio;
    umbralMm: number;
  } = $props();

  const deOpenMeteo = $derived(!!lluvia && lluvia.fuente.includes('Open-Meteo'));
</script>

<section class="tarjeta" id="fuentes">
  <h2>Fuentes de consulta</h2>

  <h3>Datos de lluvia</h3>
  <ul>
    {#if !lluvia}
      <li>Aún no se han cargado datos de lluvia.</li>
    {:else if deOpenMeteo}
      <li>
        Lluvia diaria de <a href="https://open-meteo.com/">Open-Meteo.com</a>, Historical Weather API,
        {lluvia.anios} años ({lluvia.anioInicio}–{lluvia.anioFin}), punto {redondearCoordenada(Number(lat))},
        {redondearCoordenada(Number(lon))}. Datos bajo licencia CC BY 4.0. Consultado el
        {new Date().toLocaleDateString('es-GT')}.
      </li>
      <li>
        Modelo de origen: reanálisis ERA5 del Centro Europeo de Previsiones Meteorológicas a Plazo Medio (ECMWF),
        servicio Copernicus de Cambio Climático. Hersbach, H. et al. (2020). The ERA5 global reanalysis.
        <em>Quarterly Journal of the Royal Meteorological Society</em>, 146(730), 1999–2049.
        <a href="https://doi.org/10.1002/qj.3803">doi:10.1002/qj.3803</a>
      </li>
    {:else}
      <li>Lluvia mensual ingresada por el usuario (fuente indicada por quien elaboró el diseño).</li>
    {/if}
  </ul>

  <h3>Criterios y métodos</h3>
  <ul>
    <li>
      Método de oferta y demanda para captación de agua de lluvia en techos: OPS/CEPIS (2004).
      <em>Guía de diseño para captación del agua de lluvia</em> (OPS/CEPIS/04.122). Lima: Organización
      Panamericana de la Salud.
    </li>
    <li>
      Umbral de captación de {umbralMm} mm por mes y primer descarte por evento de lluvia: criterio técnico
      definido para CaptaLluvia (editable en la app).
    </li>
    <li>Coeficientes de escorrentía por material del techo: valores de referencia usuales, editables en la app.</li>
    <li>Equivalencia: 1 mm de lluvia sobre 1 m² de superficie = 1 litro de agua.</li>
    <li>
      Dotación básica de 20 L por persona al día: Howard, G. y Bartram, J. (2003). <em>Domestic water quantity,
      service level and health</em>. Ginebra: Organización Mundial de la Salud.
    </li>
    <li>
      Referencia de 50 a 100 L por persona al día: Naciones Unidas, derecho humano al agua y al saneamiento
      (Resolución A/RES/64/292 de la Asamblea General, 2010, y materiales de ONU-Agua).
    </li>
    {#if edificio === 'escuela'}
      <li>
        Días de uso en escuelas: mínimo de 180 días de clase al año establecido por el Ministerio de Educación de
        Guatemala.
      </li>
    {/if}
  </ul>
  <p class="nota">Las referencias completas y los cambios de metodología se publican en el repositorio del proyecto (docs/METODOLOGIA.md).</p>
</section>

<style>
  h3 { font-size: 1rem; margin: 0.75rem 0 0.25rem; }
  ul { margin: 0; padding-left: 1.2rem; display: grid; gap: 0.3rem; }
</style>
