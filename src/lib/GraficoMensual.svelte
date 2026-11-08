<script lang="ts">
  import { MESES } from '../core/lluvia';

  let {
    brutaMm,
    netaMm = null,
    umbralMm = null,
  }: { brutaMm: number[]; netaMm?: number[] | null; umbralMm?: number | null } = $props();

  // El ancho del dibujo es el ancho real en pantalla (1 unidad = 1 px):
  // así las letras miden siempre lo mismo, en teléfono o en computadora.
  let ancho = $state(480);
  const W = $derived(Math.min(640, Math.max(300, Math.round(ancho) || 480)));
  const angosto = $derived(W < 440);
  const H = $derived(angosto ? 220 : 250);
  const IZQ = 42;
  const DER = 8;
  const ARRIBA = 26;
  const ABAJO = 28;
  const anchoUtil = $derived(W - IZQ - DER);
  const altoUtil = $derived(H - ARRIBA - ABAJO);

  const maximo = $derived(Math.max(10, umbralMm ?? 0, ...brutaMm));
  const paso = $derived.by(() => {
    const crudo = maximo / 4;
    const base = 10 ** Math.floor(Math.log10(crudo));
    return [1, 2, 2.5, 5, 10].map((k) => k * base).find((k) => k >= crudo) ?? crudo;
  });
  const tope = $derived(Math.ceil(maximo / paso) * paso);
  const marcas = $derived(Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso));
  const Y = (v: number) => ARRIBA + altoUtil - (v / tope) * altoUtil;
  const columna = $derived(anchoUtil / 12);
  const barra = $derived(columna * 0.7);
  // Si las columnas son angostas, los valores se leen en la tabla y no sobre las barras.
  const mostrarValores = $derived(columna >= 30);
  const fmt = (v: number) => Math.round(v).toLocaleString('es-GT');
</script>

<div class="marco" bind:clientWidth={ancho}>
<svg viewBox="0 0 {W} {H}" role="img" aria-label="Lluvia promedio de cada mes en milímetros" class:angosto>
  {#each marcas as m (m)}
    <line x1={IZQ} x2={W - DER} y1={Y(m)} y2={Y(m)} class="rejilla" />
    <text x={IZQ - 6} y={Y(m) + 4} text-anchor="end" class="eje">{fmt(m)}</text>
  {/each}
  <text x={IZQ - 6} y={ARRIBA - 12} text-anchor="end" class="eje">mm</text>
  {#each brutaMm as v, i (i)}
    {@const x = IZQ + i * columna + (columna - barra) / 2}
    <rect {x} y={Y(v)} width={barra} height={Y(0) - Y(v)} rx="2" class="bruta" class:seco={umbralMm !== null && v < umbralMm} />
    {#if netaMm}
      <rect x={x + barra * 0.2} y={Y(netaMm[i])} width={barra * 0.6} height={Y(0) - Y(netaMm[i])} rx="1.5" class="neta" />
    {/if}
    {#if mostrarValores && v >= 0.5}
      <text x={x + barra / 2} y={Y(v) - 5} text-anchor="middle" class="valor">{fmt(v)}</text>
    {/if}
    <text x={x + barra / 2} y={H - 8} text-anchor="middle" class="eje">{angosto ? MESES[i][0] : MESES[i]}</text>
  {/each}
  {#if umbralMm !== null && umbralMm > 0}
    <line x1={IZQ} x2={W - DER} y1={Y(umbralMm)} y2={Y(umbralMm)} class="umbral" />
    <text x={IZQ - 6} y={Y(umbralMm) + 4} text-anchor="end" class="etiqueta-umbral">{fmt(umbralMm)}</text>
  {/if}
</svg>
</div>

<style>
  .marco { width: 100%; max-width: 40rem; }
  .angosto .eje { font-size: 12px; }
  svg { width: 100%; height: auto; display: block; }
  .rejilla { stroke: var(--borde); stroke-width: 1; }
  .bruta { fill: var(--acento-suave); stroke: var(--acento); stroke-width: 1; }
  .bruta.seco { fill: var(--fondo); stroke: var(--texto-suave); stroke-dasharray: 3 2; }
  .neta { fill: var(--acento); }
  .umbral { stroke: #c4320a; stroke-width: 1.5; stroke-dasharray: 6 4; }
  .etiqueta-umbral { font-size: 14px; font-weight: 700; fill: #c4320a; paint-order: stroke; stroke: var(--fondo-tarjeta); stroke-width: 4px; stroke-linejoin: round; }
  .eje { font-size: 14px; fill: var(--texto-suave); }
  .valor { font-size: 12.5px; fill: var(--texto); }
</style>
