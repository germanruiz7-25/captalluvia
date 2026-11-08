<script lang="ts">
  import type { OpcionTecho } from '../core/techo';

  let { opciones }: { opciones: OpcionTecho[] } = $props();

  // Todas las formas usan la misma escala y el mismo marco, para que se comparen a simple vista.
  const PX_POR_M = 16;
  const MARGEN = 16;
  const ESPACIO_COTAS = 56;

  const marco = $derived.by(() => {
    const largoMax = Math.max(1, ...opciones.map((o) => o.largo));
    const anchoMax = Math.max(1, ...opciones.map((o) => o.ancho));
    return {
      w: largoMax * PX_POR_M + MARGEN * 2 + ESPACIO_COTAS,
      h: anchoMax * PX_POR_M + MARGEN * 2 + 40,
    };
  });

  const fmt = (v: number) =>
    v.toLocaleString('es-GT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
</script>

<div class="opciones">
  {#each opciones as o (o.forma)}
    {@const w = o.largo * PX_POR_M}
    {@const h = o.ancho * PX_POR_M}
    {@const x = MARGEN}
    {@const y = MARGEN}
    <figure>
      <figcaption>{o.nombre}: {fmt(o.ancho)} × {fmt(o.largo)} m</figcaption>
      <svg
        viewBox="0 0 {marco.w} {marco.h}"
        role="img"
        aria-label="Techo {o.nombre.toLowerCase()} de {fmt(o.ancho)} por {fmt(o.largo)} metros, {fmt(o.area)} metros cuadrados"
      >
        <rect {x} {y} width={w} height={h} rx="2" class="techo" />
        <text x={x + w / 2} y={y + h / 2 + 5} text-anchor="middle" class="area">{fmt(o.area)} m²</text>
        <line x1={x} x2={x + w} y1={y + h} y2={y + h} class="canaleta" />
        <circle cx={x + w} cy={y + h} r="5" class="bajante" />
        <path d="M{x} {y + h + 12}v8M{x} {y + h + 16}H{x + w}M{x + w} {y + h + 12}v8" class="cota" />
        <text x={x + w / 2} y={y + h + 36} text-anchor="middle" class="medida">{fmt(o.largo)} m</text>
        <path d="M{x + w + 12} {y}h8M{x + w + 16} {y}V{y + h}M{x + w + 12} {y + h}h8" class="cota" />
        <text x={x + w + 24} y={y + h / 2 + 4} class="medida">{fmt(o.ancho)} m</text>
      </svg>
    </figure>
  {/each}
</div>
<p class="leyenda">
  <span class="muestra-canaleta"></span> Canaleta en el lado largo
  <span class="muestra-bajante"></span> Bajante hacia el first flush y el tanque
</p>

<style>
  .opciones {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 1rem;
  }
  figure { margin: 0; }
  figcaption { font-weight: 600; margin-bottom: 0.25rem; }
  svg { width: 100%; height: auto; display: block; }
  .techo { fill: var(--acento-suave); stroke: var(--borde); stroke-width: 1.5; }
  .canaleta { stroke: var(--acento); stroke-width: 4; }
  .bajante { fill: var(--acento); }
  .cota { fill: none; stroke: var(--texto-suave); stroke-width: 1; }
  .area { font-size: 15px; font-weight: 600; fill: var(--texto); }
  .medida { font-size: 13px; fill: var(--texto); }
  .leyenda { color: var(--texto-suave); font-size: 0.85rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 0.5rem; }
  .muestra-canaleta { display: inline-block; width: 1.5rem; height: 4px; background: var(--acento); margin-left: 0.25rem; }
  .muestra-bajante { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--acento); margin-left: 1rem; }
</style>
