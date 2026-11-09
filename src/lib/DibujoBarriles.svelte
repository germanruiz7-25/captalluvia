<script lang="ts">
  // Barriles de 55 galones (208 L) que equivalen al volumen elegido. Hasta 100 se dibujan todos.
  let { barriles }: { barriles: number } = $props();

  const MAX = 100;
  const enteros = $derived(Math.floor(barriles + 1e-9));
  const fraccion = $derived(barriles - enteros);
  const dibujados = $derived(Math.min(MAX, enteros + (fraccion > 0.05 ? 1 : 0)));
  const porFila = 10;
  const W = 26;
  const H = 34;
  const filas = $derived(Math.max(1, Math.ceil(dibujados / porFila)));
  const alto = $derived(filas * (H + 8) + 6);
</script>

<figure class="barriles">
  <svg viewBox="0 0 {porFila * (W + 6) + 4} {alto}" role="img" aria-label="{barriles.toFixed(1)} barriles de 55 galones">
    {#each Array(dibujados) as _, i (i)}
      {@const x = 4 + (i % porFila) * (W + 6)}
      {@const y = 4 + Math.floor(i / porFila) * (H + 8)}
      {@const parcial = i === enteros && fraccion > 0.05}
      <g transform="translate({x}, {y})" class:parcial>
        <rect x="0" y="2" width={W} height={H - 4} rx="4" class="cuerpo" />
        <ellipse cx={W / 2} cy="3" rx={W / 2} ry="3" class="tapa" />
        <line x1="0" y1={H * 0.33} x2={W} y2={H * 0.33} class="aro" />
        <line x1="0" y1={H * 0.66} x2={W} y2={H * 0.66} class="aro" />
        {#if parcial}
          <rect x="0" y="2" width={W * (1 - fraccion)} height={H - 4} rx="4" class="vacio" transform="translate({W * fraccion}, 0)" />
        {/if}
      </g>
    {/each}
  </svg>
  {#if enteros + (fraccion > 0.05 ? 1 : 0) > MAX}
    <figcaption>Se dibujan {MAX} barriles de un total de {Math.ceil(barriles)}.</figcaption>
  {/if}
</figure>

<style>
  .barriles { margin: 0.5rem 0; }
  svg { width: 100%; max-width: 22rem; height: auto; display: block; }
  .cuerpo { fill: #0b63b6; }
  .tapa { fill: #4a90d0; }
  .aro { stroke: #9cc9ea; stroke-width: 1.5; }
  .vacio { fill: #e8eef4; }
  figcaption { font-size: 0.85rem; color: var(--texto-suave); }
</style>
