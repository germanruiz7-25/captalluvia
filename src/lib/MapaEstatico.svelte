<script lang="ts">
  import type { CapaMapa } from '../core/capasMapa';
  import { barraEscala, teselasMapa } from '../core/mapaEstatico';

  let {
    lat,
    lon,
    zoom,
    capa,
    ancho,
    alto,
    titulo,
  }: { lat: number; lon: number; zoom: number; capa: CapaMapa; ancho: number; alto: number; titulo: string } = $props();

  const z = $derived(Math.min(zoom, capa.maxZoom));
  const teselas = $derived(
    teselasMapa({ lat, lon, zoom: z, ancho, alto, url: capa.url, tileSize: capa.tileSize, zoomOffset: capa.zoomOffset }),
  );
  const escala = $derived(barraEscala(lat, z, ancho * 0.28));
</script>

<figure class="mapa-estatico" style="width: {ancho}px">
  <div class="lienzo" style="width: {ancho}px; height: {alto}px" role="img" aria-label={titulo}>
    {#each teselas as t (t.url)}
      <img src={t.url} alt="" style="left: {t.izquierda}px; top: {t.arriba}px; width: {t.lado}px; height: {t.lado}px" />
    {/each}
    <svg class="capa" viewBox="0 0 {ancho} {alto}" width={ancho} height={alto} aria-hidden="true">
      <!-- Marcador del proyecto -->
      <g transform="translate({ancho / 2} {alto / 2})">
        <circle r="16" fill="none" stroke="#fff" stroke-width="2" opacity="0.9" />
        <path d="M0 0 C-9 -12 -11 -17 -11 -22 A11 11 0 1 1 11 -22 C11 -17 9 -12 0 0Z" fill="#d92d20" stroke="#fff" stroke-width="2" />
        <circle cy="-22" r="4" fill="#fff" />
      </g>
      <!-- Norte -->
      <g transform="translate({ancho - 28} 30)">
        <circle r="20" fill="#fff" opacity="0.85" />
        <text y="-5" text-anchor="middle" font-size="11" font-weight="700" fill="#000">N</text>
        <path d="M0 -3 L6 14 L0 10 L-6 14Z" fill="#000" />
      </g>
      <!-- Escala -->
      <g transform="translate(12 {alto - 16})">
        <rect x="-6" y="-16" width={escala.px + 12} height="24" fill="#fff" opacity="0.85" rx="3" />
        <rect x="0" y="0" width={escala.px / 2} height="4" fill="#000" />
        <rect x={escala.px / 2} y="0" width={escala.px / 2} height="4" fill="#fff" stroke="#000" stroke-width="0.8" />
        <text x={escala.px / 2} y="-4" text-anchor="middle" font-size="10" fill="#000">{escala.texto}</text>
      </g>
    </svg>
  </div>
  <figcaption>{titulo}</figcaption>
</figure>

<style>
  .mapa-estatico { margin: 0; max-width: 100%; }
  .lienzo { position: relative; overflow: hidden; border: 1px solid #000; background: #dde6ee; max-width: 100%; }
  .lienzo img { position: absolute; max-width: none; display: block; }
  .capa { position: absolute; inset: 0; }
  figcaption { font-size: 0.85rem; text-align: center; margin-top: 0.25rem; }
</style>
