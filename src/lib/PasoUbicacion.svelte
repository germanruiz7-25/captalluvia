<script lang="ts">
  import type { ResumenLluvia } from '../core/lluvia';
  import LluviaEstaciones from './LluviaEstaciones.svelte';
  import { consultarLluviaOpenMeteo } from '../core/openmeteo';
  import { esErrorDeConexion, guardarLluvia, leerLluvias, lluviaCercana } from '../core/lluviaGuardada';
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
    pais = $bindable(''),
    onListo,
  }: {
    lluvia: ResumenLluvia | null;
    lat: string;
    lon: string;
    nombreProyecto: string;
    comunidad: string;
    municipio: string;
    departamento: string;
    pais?: string;
    onListo: () => void;
  } = $props();

  let fuente: 'satelite' | 'estaciones' = $state('satelite');
  let consultando = $state(false);
  let error = $state('');

  // Lluvia guardada en el dispositivo para trabajar sin internet
  let guardadas = $state(leerLluvias());
  let enLinea = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
  $effect(() => {
    const actualizar = () => (enLinea = navigator.onLine);
    window.addEventListener('online', actualizar);
    window.addEventListener('offline', actualizar);
    return () => {
      window.removeEventListener('online', actualizar);
      window.removeEventListener('offline', actualizar);
    };
  });
  const cercana = $derived(
    lat !== '' && lon !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))
      ? lluviaCercana(Number(lat), Number(lon), guardadas)
      : null,
  );
  const nombreLugar = () => [comunidad, municipio, departamento].filter((x) => x && x.trim()).join(', ') || nombreProyecto.trim();
  const fechaCorta = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  function usarGuardada(): boolean {
    const c = cercana;
    if (!c) return false;
    const donde = c.lugar ? ` de ${c.lugar}` : '';
    lluvia = {
      ...c.lluvia,
      fuente: `${c.lluvia.fuente}; consulta guardada en el dispositivo${donde} (${fechaCorta(c.fecha)}, a ${c.distanciaKm.toFixed(1)} km)`,
    };
    onListo();
    return true;
  }

  async function consultar() {
    error = '';
    consultando = true;
    try {
      lluvia = await consultarLluviaOpenMeteo(Number(lat), Number(lon));
      guardadas = guardarLluvia({ lat: Number(lat), lon: Number(lon), fecha: new Date().toISOString(), lugar: nombreLugar() || undefined, lluvia });
      onListo();
    } catch (e) {
      if (esErrorDeConexion(e) && usarGuardada()) return;
      error = esErrorDeConexion(e)
        ? 'No hay conexión a internet y no hay lluvia guardada a menos de 15 km de este punto. Consulta la lluvia de ' +
          'la zona cuando tengas señal (queda guardada en el dispositivo) o usa "Datos de estaciones".'
        : e instanceof Error
          ? e.message
          : 'No se pudo consultar la lluvia.';
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
        if (d.pais) pais = d.pais;
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
        <label>País
          <input bind:value={pais} placeholder="Ej. Guatemala" />
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
      {#if !enLinea}
        <p class="aviso-sin-red" role="status">
          📴 Sin conexión.
          {#if cercana}
            Se usará la lluvia guardada{cercana.lugar ? ` de ${cercana.lugar}` : ''}, a {cercana.distanciaKm.toFixed(1)} km de este punto.
          {:else if guardadas.length}
            Hay lluvia guardada de {guardadas.length} lugar{guardadas.length === 1 ? '' : 'es'}, pero ninguno a menos de 15 km de este punto.
          {:else}
            Todavía no hay lluvia guardada en este dispositivo.
          {/if}
        </p>
      {/if}
      <details class="detalle sin-internet">
        <summary>Usar la app sin internet (trabajo de campo){guardadas.length ? ` · ${guardadas.length} lugar${guardadas.length === 1 ? '' : 'es'} guardado${guardadas.length === 1 ? '' : 's'}` : ''}</summary>
        <p class="nota">
          Cada vez que consultas la lluvia con internet, queda guardada en este dispositivo. Sin señal, la app usa la
          lluvia guardada más cercana si está a menos de 15 km (los datos satelitales tienen celdas de 9 a 28 km). Antes de
          salir a campo, abre la app con internet, marca cada comunidad en el mapa y toca "Ver la lluvia de este lugar".
          Sin conexión funcionan las coordenadas y el GPS; el mapa satelital necesita internet.
        </p>
        {#if guardadas.length}
          <ul class="lista-guardadas">
            {#each guardadas.slice(0, 8) as g (g.fecha + g.lat + g.lon)}
              <li>{g.lugar || `${g.lat.toFixed(3)}, ${g.lon.toFixed(3)}`}: {Math.round(g.lluvia.anualMm).toLocaleString('es-GT')} mm al año ({fechaCorta(g.fecha)})</li>
            {/each}
          </ul>
          {#if guardadas.length > 8}<p class="nota">… y {guardadas.length - 8} más.</p>{/if}
        {/if}
      </details>
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
  .aviso-sin-red { background: #fffaeb; border: 1px solid #fec84b; border-radius: 0.6rem; padding: 0.5rem 0.8rem; }
  .sin-internet { margin-top: 0.75rem; }
  .lista-guardadas { margin: 0.25rem 0 0.5rem; padding-left: 1.2rem; font-size: 0.9rem; }
</style>
