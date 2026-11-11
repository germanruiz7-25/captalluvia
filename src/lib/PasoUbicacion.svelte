<script lang="ts">
  import type { ResumenLluvia } from '../core/lluvia';
  import LluviaEstaciones from './LluviaEstaciones.svelte';
  import { consultarLluviaOpenMeteo } from '../core/openmeteo';
  import Mapa from './Mapa.svelte';
  import { buscarDireccion } from '../core/geocodificacion';

  let {
    lluvia = $bindable(null),
    lat = $bindable(''),
    lon = $bindable(''),
    nombreProyecto = $bindable(''),
    comunidad = $bindable(''),
    municipio = $bindable(''),
    departamento = $bindable(''),
    onListo,
  }: {
    lluvia: ResumenLluvia | null;
    lat: string;
    lon: string;
    nombreProyecto: string;
    comunidad: string;
    municipio: string;
    departamento: string;
    onListo: () => void;
  } = $props();

  let fuente: 'satelite' | 'estaciones' = $state('satelite');
  let consultando = $state(false);
  let error = $state('');

  async function consultar() {
    error = '';
    consultando = true;
    try {
      lluvia = await consultarLluviaOpenMeteo(Number(lat), Number(lon));
      onListo();
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo consultar la lluvia.';
    } finally {
      consultando = false;
    }
  }

  let completando = $state(false);
  let avisoDireccion = $state('');
  async function completarDireccion() {
    avisoDireccion = '';
    completando = true;
    try {
      // Se envía el punto redondeado a 3 decimales (~100 m), no la ubicación exacta de la vivienda.
      const r3 = (v: string) => Math.round(Number(v) * 1000) / 1000;
      const d = await buscarDireccion(r3(lat), r3(lon));
      if (!d) avisoDireccion = 'No se encontró la dirección de este punto. Escríbela a mano.';
      else {
        if (d.comunidad) comunidad = d.comunidad;
        if (d.municipio) municipio = d.municipio;
        if (d.departamento) departamento = d.departamento;
        avisoDireccion = 'Revisa los datos: el mapa a veces da el nombre de la cabecera o de un barrio cercano.';
      }
    } catch (e) {
      avisoDireccion = e instanceof Error ? e.message : 'No se pudo obtener la dirección.';
    } finally {
      completando = false;
    }
  }

  function usarEstaciones(l: ResumenLluvia) {
    lluvia = l;
    onListo();
  }
</script>

{#snippet lugar()}
    <fieldset class="lugar">
      <legend>¿Dónde se ubica? (para la carátula del informe)</legend>
      <div class="campos">
        <label>Comunidad, aldea o caserío
          <input bind:value={comunidad} placeholder="Ej. Aldea El Rodeo" />
        </label>
        <label>Municipio
          <input bind:value={municipio} placeholder="Ej. Masagua" />
        </label>
        <label>Departamento
          <input bind:value={departamento} placeholder="Ej. Escuintla" />
        </label>
      </div>
      <button class="secundario" type="button" onclick={completarDireccion} disabled={completando || lat === '' || lon === ''}>
        {completando ? 'Buscando…' : '📍 Completar con el punto del mapa'}
      </button>
      {#if avisoDireccion}<p class="nota">{avisoDireccion}</p>{/if}
    </fieldset>
{/snippet}

<section class="tarjeta paso">
  <p class="numero-paso">Paso 1 de 8</p>
  <h2>¿Dónde está la vivienda o el edificio?</h2>

  <div class="no-imprimir">
    <label class="proyecto-campo">Lugar: institución, escuela o vivienda familiar (aparece en la carátula del informe)
      <input placeholder="Ej. Escuela Oficial Rural Mixta, aldea … / Vivienda de la familia …" bind:value={nombreProyecto} />
    </label>

    <Mapa bind:lat bind:lon />
    <details class="detalle">
      <summary>Escribir las coordenadas</summary>
      <div class="campos">
        <label>Latitud
          <input inputmode="decimal" placeholder="14.31" bind:value={lat} />
        </label>
        <label>Longitud
          <input inputmode="decimal" placeholder="-90.79" bind:value={lon} />
        </label>
      </div>
    </details>
    {@render lugar()}

    <h3 class="titulo-fuente">¿De dónde tomamos la lluvia?</h3>
    <div class="pestanas" role="tablist">
      <button role="tab" aria-selected={fuente === 'satelite'} class:activa={fuente === 'satelite'} onclick={() => (fuente = 'satelite')}>
        🛰️ Registro satelital (recomendado)
      </button>
      <button role="tab" aria-selected={fuente === 'estaciones'} class:activa={fuente === 'estaciones'} onclick={() => (fuente = 'estaciones')}>
        📊 Datos de estaciones
      </button>
    </div>

    {#if fuente === 'satelite'}
      <p class="nota">
        Se consultan 20 años de lluvia diaria de registros satelitales (Open-Meteo, reanálisis ERA5) en un punto
        redondeado a ~1 km. El punto exacto de la vivienda se queda en este dispositivo.
      </p>
      <div class="acciones">
        <button class="principal grande" onclick={consultar} disabled={consultando || lat === '' || lon === ''}>
          {consultando ? 'Consultando 20 años de lluvia…' : 'Ver la lluvia de este lugar →'}
        </button>
      </div>
    {:else}
      <LluviaEstaciones {lat} {lon} onUsar={usarEstaciones} />
    {/if}

    {#if error}<p class="alerta" role="alert">{error}</p>{/if}


  </div>
</section>

<style>
  .proyecto-campo { margin-bottom: 1rem; }
  .lugar { border: 1px solid var(--borde); border-radius: 0.75rem; padding: 0.5rem 1rem 0.9rem; margin-top: 1.25rem; background: var(--fondo); }
  .lugar legend { font-weight: 600; padding: 0 0.3rem; }
  .lugar .campos { margin-bottom: 0.75rem; }
  .titulo-fuente { margin: 1.5rem 0 0.25rem; }
</style>
