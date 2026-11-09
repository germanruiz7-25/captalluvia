<script lang="ts">
  import acerca from '../config/acerca.json';

  const version = __APP_VERSION__;
  const cita = acerca.citaPlantilla
    .replace('{anio}', String(new Date().getFullYear()))
    .replace('{version}', version);
</script>

<section class="tarjeta" id="acerca">
  <h2>Acerca de {acerca.nombre}</h2>
  <dl>
    <dt>Nombre</dt><dd>{acerca.nombre} — {acerca.subtitulo}</dd>
    <dt>Versión</dt><dd>v{version}</dd>
    <dt>Autores</dt><dd>{acerca.autores.join(' y ')}</dd>
    <dt>Organización</dt><dd>{acerca.organizacion}</dd>
    <dt>Objetivo</dt><dd>{acerca.objetivo}</dd>
    <dt>Código y licencia</dt>
    <dd>
      <a href={acerca.repositorio}>{acerca.repositorio.replace('https://', '')}</a> ·
      <a href={acerca.licenciaUrl}>{acerca.licencia}</a>
    </dd>
    <dt>Contacto</dt><dd><a href="mailto:{acerca.contacto}">{acerca.contacto}</a></dd>
    <dt>Fuentes de datos</dt><dd>{acerca.fuentesDatos}</dd>
    <dt>Cómo citar (APA 7)</dt><dd>{cita}<br />En el texto: {acerca.citaEnTexto.replace('{anio}', String(new Date().getFullYear()))}</dd>
    <dt>Inteligencia artificial</dt><dd>{acerca.avisoIA}</dd>
    <dt>Aviso</dt><dd>{acerca.aviso}</dd>
  </dl>
</section>

<section class="tarjeta paso descargo" id="descargo">
  <h2>Descargo de responsabilidad</h2>
  {#each acerca.descargo as parrafo (parrafo)}
    <p>{parrafo}</p>
  {/each}
</section>

<style>
  dl { display: grid; grid-template-columns: minmax(8rem, max-content) 1fr; gap: 0.4rem 1rem; margin: 0; }
  dt { font-weight: 600; color: var(--texto-suave); }
  dd { margin: 0; }
  .descargo p { text-align: justify; }
  @media (max-width: 36rem) {
    dl { grid-template-columns: 1fr; }
    dd { margin-bottom: 0.5rem; }
  }
</style>
