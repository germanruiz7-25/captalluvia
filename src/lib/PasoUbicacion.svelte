<script lang="ts">
  import { MESES_LARGOS, resumirMensualManual, type ResumenLluvia } from '../core/lluvia';
  import { consultarLluviaOpenMeteo } from '../core/openmeteo';
  import Mapa from './Mapa.svelte';

  let {
    lluvia = $bindable(null),
    lat = $bindable(''),
    lon = $bindable(''),
    nombreProyecto = $bindable(''),
    onListo,
  }: {
    lluvia: ResumenLluvia | null;
    lat: string;
    lon: string;
    nombreProyecto: string;
    onListo: () => void;
  } = $props();

  let modo: 'mapa' | 'manual' = $state('mapa');
  let consultando = $state(false);
  let error = $state('');

  // Valores de ejemplo para el modo manual (reemplazarlos por datos del lugar).
  let manualMm = $state([5, 5, 10, 40, 150, 250, 200, 200, 280, 220, 60, 10]);
  let manualDias = $state(120);

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

  function usarManual() {
    lluvia = resumirMensualManual(manualMm, manualDias);
    onListo();
  }
</script>

<section class="tarjeta paso">
  <p class="numero-paso">Paso 1 de 7</p>
  <h2>¿Dónde está la vivienda o el edificio?</h2>

  <div class="no-imprimir">
    <label class="proyecto-campo">Nombre del proyecto o lugar (opcional, aparece en el informe)
      <input placeholder="Ej. Escuela Oficial Rural Mixta, aldea …" bind:value={nombreProyecto} />
    </label>

    <div class="pestanas" role="tablist">
      <button role="tab" aria-selected={modo === 'mapa'} class:activa={modo === 'mapa'} onclick={() => (modo = 'mapa')}>
        🗺️ Marcar en el mapa
      </button>
      <button role="tab" aria-selected={modo === 'manual'} class:activa={modo === 'manual'} onclick={() => (modo = 'manual')}>
        ✍️ Tengo datos de lluvia
      </button>
    </div>

    {#if modo === 'mapa'}
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
      <div class="acciones">
        <button class="principal grande" onclick={consultar} disabled={consultando || lat === '' || lon === ''}>
          {consultando ? 'Consultando 20 años de lluvia…' : 'Ver la lluvia de este lugar →'}
        </button>
      </div>
      <p class="nota">
        Se consultan 20 años de lluvia diaria de registros satelitales (Open-Meteo, reanálisis ERA5) en un punto
        redondeado a ~1 km. El punto exacto de la vivienda se queda en este dispositivo.
      </p>
    {:else}
      <p class="nota">
        Escribe la lluvia promedio de cada mes en milímetros (por ejemplo, de una estación cercana). Los valores
        que aparecen son solo un ejemplo.
      </p>
      <div class="meses">
        {#each MESES_LARGOS as mes, i (mes)}
          <label>{mes}
            <input type="number" min="0" step="1" bind:value={manualMm[i]} />
          </label>
        {/each}
        <label>Días con lluvia al año
          <input type="number" min="0" max="366" bind:value={manualDias} />
        </label>
      </div>
      <div class="acciones">
        <button class="principal grande" onclick={usarManual}>Usar estos datos →</button>
      </div>
    {/if}

    {#if error}<p class="alerta" role="alert">{error}</p>{/if}
  </div>
</section>

<style>
  .proyecto-campo { margin-bottom: 1rem; }
  .meses { display: grid; grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr)); gap: 0.5rem 0.75rem; margin: 0.75rem 0; }
</style>
