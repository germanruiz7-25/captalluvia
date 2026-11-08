<script lang="ts">
  import { MESES_LARGOS, resumirMensualManual, type ResumenLluvia } from '../core/lluvia';
  import { ATRIBUCION_OPEN_METEO, consultarLluviaOpenMeteo, redondearCoordenada } from '../core/openmeteo';
  import GraficoMensual from './GraficoMensual.svelte';

  let {
    lluvia = $bindable(null),
    lat = $bindable(''),
    lon = $bindable(''),
  }: { lluvia: ResumenLluvia | null; lat: string; lon: string } = $props();

  let modo: 'coordenadas' | 'manual' = $state('coordenadas');
  let consultando = $state(false);
  let error = $state('');

  // Valores de ejemplo para el modo manual (reemplazarlos por datos del lugar).
  let manualMm = $state([5, 5, 10, 40, 150, 250, 200, 200, 280, 220, 60, 10]);
  let manualDias = $state(120);

  function usarGps() {
    error = '';
    if (!('geolocation' in navigator)) {
      error = 'Este dispositivo no permite obtener la ubicación.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lat = String(redondearCoordenada(pos.coords.latitude));
        lon = String(redondearCoordenada(pos.coords.longitude));
      },
      () => (error = 'No se pudo obtener la ubicación. Revisa el permiso de ubicación del navegador.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function consultar() {
    error = '';
    consultando = true;
    try {
      lluvia = await consultarLluviaOpenMeteo(Number(lat), Number(lon));
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo consultar la lluvia.';
    } finally {
      consultando = false;
    }
  }

  function usarManual() {
    lluvia = resumirMensualManual(manualMm, manualDias);
  }

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
</script>

<section class="tarjeta paso">
  <p class="numero-paso">Paso 1 de 4</p>
  <h2>Lluvia del lugar</h2>

  <div class="no-imprimir">
    <div class="pestanas" role="tablist">
      <button role="tab" aria-selected={modo === 'coordenadas'} class:activa={modo === 'coordenadas'} onclick={() => (modo = 'coordenadas')}>
        Por ubicación (satélite)
      </button>
      <button role="tab" aria-selected={modo === 'manual'} class:activa={modo === 'manual'} onclick={() => (modo = 'manual')}>
        Ingresar a mano
      </button>
    </div>

    {#if modo === 'coordenadas'}
      <p class="nota">
        Escribe las coordenadas del inmueble o usa el GPS del teléfono. Se consultan los últimos 20 años de
        lluvia diaria. En la siguiente versión también podrás marcar el punto en un mapa satelital.
      </p>
      <div class="campos">
        <label>Latitud
          <input inputmode="decimal" placeholder="14.31" bind:value={lat} />
        </label>
        <label>Longitud
          <input inputmode="decimal" placeholder="-90.79" bind:value={lon} />
        </label>
      </div>
      <div class="acciones">
        <button class="secundario" onclick={usarGps}>Usar mi ubicación (GPS)</button>
        <button class="principal" onclick={consultar} disabled={consultando || lat === '' || lon === ''}>
          {consultando ? 'Consultando 20 años…' : 'Estimar la lluvia'}
        </button>
      </div>
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
        <button class="principal" onclick={usarManual}>Usar estos datos</button>
      </div>
    {/if}

    {#if error}<p class="alerta" role="alert">{error}</p>{/if}
  </div>

  {#if lluvia}
    <div class="resumen">
      <div class="cifras">
        <div><span class="cifra">{n0(lluvia.anualMm)} mm</span><span>lluvia promedio al año</span></div>
        <div><span class="cifra">{n0(lluvia.diasLluviaAnual)}</span><span>días con lluvia al año</span></div>
        <div><span class="cifra">{n0(lluvia.anualMm)} L</span><span>caen al año sobre cada m² de techo</span></div>
      </div>
      <GraficoMensual brutaMm={lluvia.mensualMm} />
      <table class="tabla-meses">
        <thead><tr><th>Mes</th>{#each MESES_LARGOS as m (m)}<th>{m.slice(0, 3)}</th>{/each}<th>Año</th></tr></thead>
        <tbody><tr><td>mm</td>{#each lluvia.mensualMm as v, i (i)}<td>{n0(v)}</td>{/each}<td><strong>{n0(lluvia.anualMm)}</strong></td></tr></tbody>
      </table>
      <p class="nota">
        Fuente: {lluvia.fuente}{#if lluvia.anios}, promedio de {lluvia.anios} años ({lluvia.anioInicio}–{lluvia.anioFin}){/if}.
        {#if lluvia.fuente.includes('Open-Meteo')}{ATRIBUCION_OPEN_METEO}.{/if}
        {#if lat && lon && lluvia.anios}Punto consultado: {redondearCoordenada(Number(lat))}, {redondearCoordenada(Number(lon))}.{/if}
      </p>
      {#if lluvia.mesesSinDatos.length}
        <p class="alerta">Sin datos suficientes en: {lluvia.mesesSinDatos.map((m) => MESES_LARGOS[m]).join(', ')} (se tomaron como 0 mm).</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .pestanas { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
  .meses { display: grid; grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr)); gap: 0.5rem 0.75rem; margin: 0.75rem 0; }
  .resumen { margin-top: 1rem; }
  .tabla-meses { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-top: 0.75rem; display: block; overflow-x: auto; }
  .tabla-meses th, .tabla-meses td { padding: 0.25rem 0.35rem; text-align: right; border-bottom: 1px solid var(--borde); }
  .tabla-meses th:first-child, .tabla-meses td:first-child { text-align: left; }
</style>
