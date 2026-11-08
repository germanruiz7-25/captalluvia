<script lang="ts">
  import { onMount } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  import type { Map as MapaLeaflet, Marker, TileLayer } from 'leaflet';
  import { CLAVES_COMPILADAS, capaInicial, capasDisponibles, type CapaMapa } from '../core/capasMapa';
  import {
    VISTA_INICIAL,
    ZOOM_VIVIENDA,
    buscarLugar,
    coordenadaTexto,
    type LugarEncontrado,
  } from '../core/geocodificacion';

  let { lat = $bindable(''), lon = $bindable('') }: { lat: string; lon: string } = $props();

  let contenedor: HTMLDivElement;
  let mapa: MapaLeaflet | null = null;
  let marcador: Marker | null = null;
  let L: typeof import('leaflet') | null = null;
  let teselas: TileLayer | null = null;

  const CLAVE_CAPA = 'captalluvia.mapa';
  const capas = capasDisponibles(CLAVES_COMPILADAS);
  let capa: CapaMapa = $state(
    capaInicial(
      capas,
      (() => {
        try {
          return localStorage.getItem(CLAVE_CAPA);
        } catch {
          return null;
        }
      })(),
    ),
  );

  function ponerCapa(c: CapaMapa) {
    capa = c;
    try {
      localStorage.setItem(CLAVE_CAPA, c.id);
    } catch {
      /* sin almacenamiento */
    }
    if (!mapa || !L) return;
    teselas?.remove();
    teselas = L.tileLayer(c.url, {
      maxZoom: c.maxZoom,
      attribution: c.atribucion,
      ...(c.tileSize ? { tileSize: c.tileSize, zoomOffset: c.zoomOffset ?? 0 } : {}),
    }).addTo(mapa);
  }

  let texto = $state('');
  let buscando = $state(false);
  let resultados: LugarEncontrado[] = $state([]);
  let error = $state('');
  let ubicando = $state(false);

  const punto = $derived.by(() => {
    const a = Number(lat);
    const b = Number(lon);
    return lat !== '' && lon !== '' && Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180
      ? { lat: a, lon: b }
      : null;
  });

  function fijar(a: number, b: number) {
    lat = coordenadaTexto(a);
    lon = coordenadaTexto(b);
  }

  function colocarMarcador(a: number, b: number) {
    if (!mapa || !L) return;
    if (!marcador) {
      const icono = L.divIcon({
        className: 'pin-vivienda',
        html: '<svg viewBox="0 0 32 44" width="32" height="44" aria-hidden="true"><path d="M16 1C8 1 2 7 2 15c0 10 14 27 14 27s14-17 14-27C30 7 24 1 16 1z" fill="#c4320a" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5" fill="#fff"/></svg>',
        iconSize: [32, 44],
        iconAnchor: [16, 43],
      });
      marcador = L.marker([a, b], { icon: icono, draggable: true, keyboard: true, title: 'Vivienda' }).addTo(mapa);
      marcador.on('dragend', () => {
        const p = marcador!.getLatLng();
        fijar(p.lat, p.lng);
      });
    } else {
      marcador.setLatLng([a, b]);
    }
  }

  onMount(() => {
    let cancelado = false;
    let observador: ResizeObserver | null = null;
    import('leaflet').then((mod) => {
      if (cancelado) return;
      L = mod.default ?? mod;
      const inicio = punto ?? VISTA_INICIAL;
      mapa = L.map(contenedor, { zoomControl: true, attributionControl: true }).setView(
        [inicio.lat, inicio.lon],
        punto ? ZOOM_VIVIENDA - 1 : VISTA_INICIAL.zoom,
      );
      ponerCapa(capa);
      mapa.attributionControl.setPrefix(false);
      if (punto) colocarMarcador(punto.lat, punto.lon);
      mapa.on('click', (e) => fijar(e.latlng.lat, e.latlng.lng));
      // Si el mapa estaba oculto (otro paso del asistente), recalcula su tamaño al mostrarse.
      observador = new ResizeObserver(() => mapa?.invalidateSize());
      observador.observe(contenedor);
    });
    return () => {
      cancelado = true;
      observador?.disconnect();
      mapa?.remove();
      mapa = null;
      marcador = null;
    };
  });

  // Coordenadas escritas a mano, GPS o clic: mover el marcador.
  $effect(() => {
    const p = punto;
    if (p && mapa) {
      colocarMarcador(p.lat, p.lon);
      if (!mapa.getBounds().pad(-0.1).contains([p.lat, p.lon])) mapa.setView([p.lat, p.lon], Math.max(mapa.getZoom(), 15));
    }
  });

  async function buscar(e: Event) {
    e.preventDefault();
    error = '';
    resultados = [];
    buscando = true;
    try {
      resultados = await buscarLugar(texto);
      if (resultados.length === 0) error = 'No se encontró ese lugar. Prueba con el municipio y el departamento.';
      else if (resultados.length === 1) irA(resultados[0]);
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudo buscar.';
    } finally {
      buscando = false;
    }
  }

  function irA(r: LugarEncontrado) {
    mapa?.setView([r.lat, r.lon], 15);
    resultados = [];
  }

  function usarGps() {
    error = '';
    if (!('geolocation' in navigator)) {
      error = 'Este dispositivo no permite obtener la ubicación.';
      return;
    }
    ubicando = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        ubicando = false;
        fijar(pos.coords.latitude, pos.coords.longitude);
        mapa?.setView([pos.coords.latitude, pos.coords.longitude], ZOOM_VIVIENDA);
      },
      () => {
        ubicando = false;
        error = 'No se pudo obtener la ubicación. Revisa el permiso de ubicación del navegador.';
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
</script>

<div class="mapa-bloque">
  <form class="buscador" onsubmit={buscar}>
    <input
      type="search"
      placeholder="Busca tu municipio, aldea o dirección"
      aria-label="Buscar lugar"
      bind:value={texto}
    />
    <button class="secundario" type="submit" disabled={buscando || texto.trim().length < 3}>
      {buscando ? 'Buscando…' : 'Buscar'}
    </button>
    <button class="secundario" type="button" onclick={usarGps} disabled={ubicando}>
      {ubicando ? 'Ubicando…' : '📍 Mi ubicación'}
    </button>
  </form>

  {#if resultados.length > 1}
    <ul class="resultados">
      {#each resultados as r (r.nombre + r.lat)}
        <li><button type="button" onclick={() => irA(r)}>{r.nombre}</button></li>
      {/each}
    </ul>
  {/if}
  {#if error}<p class="alerta" role="alert">{error}</p>{/if}

  {#if capas.length > 1}
    <div class="capas" role="radiogroup" aria-label="Tipo de mapa">
      <span class="titulo-capas">Mapa:</span>
      {#each capas as c (c.id)}
        <button type="button" role="radio" title={c.nombre} aria-label={c.nombre} aria-checked={capa.id === c.id} class:activa={capa.id === c.id} onclick={() => ponerCapa(c)}>
          {c.satelite ? '🛰️' : '🗺️'} {c.corto}
        </button>
      {/each}
    </div>
  {/if}

  <div class="mapa" bind:this={contenedor} role="application" aria-label="Mapa: toca el techo de la vivienda para marcarla"></div>
  <p class="ayuda">
    {#if punto}
      ✓ Vivienda marcada en {lat}, {lon}. Puedes arrastrar el marcador para corregirla.
    {:else}
      Acerca el mapa y <strong>toca el techo de la vivienda</strong> para marcarla.
    {/if}
  </p>
</div>

<style>
  .mapa-bloque { display: grid; gap: 0.5rem; }
  .buscador { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .buscador input { flex: 1 1 14rem; }
  .mapa {
    height: clamp(18rem, 55vh, 30rem);
    border-radius: 0.75rem;
    border: 1px solid var(--borde);
    overflow: hidden;
    z-index: 0;
  }
  .resultados { list-style: none; margin: 0; padding: 0; border: 1px solid var(--borde); border-radius: 0.5rem; background: var(--fondo); }
  .resultados li + li { border-top: 1px solid var(--borde); }
  .resultados button { width: 100%; text-align: left; background: none; border: 0; padding: 0.55rem 0.75rem; color: var(--texto); }
  .resultados button:hover { background: var(--acento-suave); }
  .capas { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
  .titulo-capas { font-size: 0.85rem; color: var(--texto-suave); }
  .capas button {
    background: var(--fondo); border: 1px solid var(--borde); border-radius: 999px; padding: 0.3rem 0.75rem;
    font-size: 0.85rem; color: var(--texto);
  }
  .capas button.activa { background: var(--texto); border-color: var(--texto); color: var(--fondo); }
  .ayuda { margin: 0; font-size: 0.9rem; color: var(--texto-suave); }
  :global(.pin-vivienda) { background: none; border: 0; }
</style>
