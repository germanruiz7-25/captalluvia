<script lang="ts">
  import { MESES } from '../core/lluvia';

  let {
    brutaMm,
    netaMm = null,
  }: { brutaMm: number[]; netaMm?: number[] | null } = $props();

  // Marco fijo: las letras conservan su tamaño en cualquier pantalla.
  const W = 480;
  const H = 250;
  const IZQ = 42;
  const DER = 12;
  const ARRIBA = 26;
  const ABAJO = 28;
  const anchoUtil = W - IZQ - DER;
  const altoUtil = H - ARRIBA - ABAJO;

  const maximo = $derived(Math.max(10, ...brutaMm));
  const paso = $derived.by(() => {
    const crudo = maximo / 4;
    const base = 10 ** Math.floor(Math.log10(crudo));
    return [1, 2, 2.5, 5, 10].map((k) => k * base).find((k) => k >= crudo) ?? crudo;
  });
  const tope = $derived(Math.ceil(maximo / paso) * paso);
  const marcas = $derived(Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso));
  const Y = (v: number) => ARRIBA + altoUtil - (v / tope) * altoUtil;
  const columna = anchoUtil / 12;
  const barra = columna * 0.7;
  const fmt = (v: number) => Math.round(v).toLocaleString('es-GT');
</script>

<svg viewBox="0 0 {W} {H}" role="img" aria-label="Lluvia promedio de cada mes en milímetros">
  {#each marcas as m (m)}
    <line x1={IZQ} x2={W - DER} y1={Y(m)} y2={Y(m)} class="rejilla" />
    <text x={IZQ - 6} y={Y(m) + 4} text-anchor="end" class="eje">{fmt(m)}</text>
  {/each}
  <text x={IZQ - 6} y={ARRIBA - 12} text-anchor="end" class="eje">mm</text>
  {#each brutaMm as v, i (i)}
    {@const x = IZQ + i * columna + (columna - barra) / 2}
    <rect {x} y={Y(v)} width={barra} height={Y(0) - Y(v)} rx="2" class="bruta" />
    {#if netaMm}
      <rect x={x + barra * 0.2} y={Y(netaMm[i])} width={barra * 0.6} height={Y(0) - Y(netaMm[i])} rx="1.5" class="neta" />
    {/if}
    {#if v >= 0.5}
      <text x={x + barra / 2} y={Y(v) - 5} text-anchor="middle" class="valor">{fmt(v)}</text>
    {/if}
    <text x={x + barra / 2} y={H - 8} text-anchor="middle" class="eje">{MESES[i]}</text>
  {/each}
</svg>

<style>
  svg { width: 100%; max-width: 36rem; height: auto; display: block; }
  .rejilla { stroke: var(--borde); stroke-width: 1; }
  .bruta { fill: var(--acento-suave); stroke: var(--acento); stroke-width: 1; }
  .neta { fill: var(--acento); }
  .eje { font-size: 14px; fill: var(--texto-suave); }
  .valor { font-size: 12.5px; fill: var(--texto); }
</style>
