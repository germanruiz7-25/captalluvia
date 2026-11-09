<script lang="ts">
  import MapaEstatico from './MapaEstatico.svelte';
  import { CLAVES_COMPILADAS, capaInicial, capasDisponibles } from '../core/capasMapa';
  import { atribucionTexto } from '../core/mapaEstatico';

  let {
    lat,
    lon,
    lugar,
    comunidad,
    municipio,
    departamento,
    infraestructura,
    usuarios,
  }: {
    lat: string;
    lon: string;
    lugar: string;
    comunidad: string;
    municipio: string;
    departamento: string;
    infraestructura: string;
    usuarios: number;
  } = $props();

  const capas = capasDisponibles(CLAVES_COMPILADAS);
  const calles = capas[0];
  const detalle = capaInicial(capas, null); // satélite si hay clave; si no, calles

  const la = $derived(Number(lat));
  const lo = $derived(Number(lon));
  const hayPunto = $derived(lat !== '' && lon !== '' && Number.isFinite(la) && Number.isFinite(lo));
  const coord = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
  const o = (v: string) => v.trim() || '—';
  const atribuciones = [...new Set([calles, detalle].map((c) => atribucionTexto(c.atribucion)))].join(' · ');
</script>

<section class="paso ubicacion-proyecto">
  <h2>Ubicación y generalidades del proyecto</h2>
  {#if hayPunto}
    <div class="mapas">
      <MapaEstatico lat={la} lon={lo} zoom={7} capa={calles} ancho={240} alto={300} titulo="Figura 1. Macrolocalización" />
      <MapaEstatico lat={la} lon={lo} zoom={17} capa={detalle} ancho={440} alto={300} titulo="Figura 2. Microlocalización (punto marcado en el mapa)" />
    </div>
    <p class="atribucion">Mapas: {atribuciones}.</p>
  {/if}
  <table class="tabla rejilla generalidades">
    <tbody>
      <tr><th scope="row">Proyecto (lugar)</th><td>{o(lugar)}</td></tr>
      <tr><th scope="row">Comunidad</th><td>{o(comunidad)}</td></tr>
      <tr><th scope="row">Municipio</th><td>{o(municipio)}</td></tr>
      <tr><th scope="row">Departamento</th><td>{o(departamento)}</td></tr>
      <tr><th scope="row">Coordenadas (latitud, longitud)</th><td>{hayPunto ? `${coord(la)}, ${coord(lo)} (WGS 84)` : 'No indicadas'}</td></tr>
      <tr><th scope="row">Tipo de infraestructura</th><td>{infraestructura}</td></tr>
      <tr><th scope="row">Cantidad de usuarios</th><td>{usuarios.toLocaleString('es-GT')}</td></tr>
    </tbody>
  </table>
</section>

<style>
  .mapas { display: flex; gap: 14px; justify-content: center; align-items: flex-start; flex-wrap: wrap; break-inside: avoid; }
  .atribucion { font-size: 0.75rem; text-align: center; margin: 0.3rem 0 0.8rem; }
  .generalidades { max-width: 36rem; margin: 0 auto; }
  .generalidades th { text-align: left; font-weight: 600; width: 45%; }
</style>
