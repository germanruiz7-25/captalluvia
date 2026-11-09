<script lang="ts">
  // Tanque de polietileno tipo tinaco (dibujo genérico, sin marca). Letras de tamaño fijo.
  let {
    capacidadL,
    diametroM = null,
    alturaM = null,
    cantidad = 1,
  }: { capacidadL: number; diametroM?: number | null; alturaM?: number | null; cantidad?: number } = $props();

  const MAX = 6;
  const dibujados = $derived(Math.min(Math.max(1, cantidad), MAX));
  const W = 74; // ancho de cada tanque en el dibujo
  const H = 96;
  const SEP = 14;
  const ancho = $derived(dibujados * W + (dibujados - 1) * SEP + (cantidad > MAX ? 70 : 0) + 20);
  const fmt = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 2 });
</script>

<figure class="tinacos">
  <svg viewBox="0 0 {ancho} 170" style="max-width: {ancho}px" role="img"
    aria-label="{cantidad} tanque{cantidad > 1 ? 's' : ''} de {capacidadL.toLocaleString('es-GT')} litros">
    {#each Array(dibujados) as _, i (i)}
      {@const x = 10 + i * (W + SEP)}
      <g transform="translate({x}, 22)">
        <!-- cuerpo -->
        <path d="M4 22 Q4 10 {W / 2} 6 Q{W - 4} 10 {W - 4} 22 V{H - 6} Q{W - 4} {H} {W / 2} {H} Q4 {H} 4 {H - 6} Z" class="cuerpo" />
        <!-- agua -->
        <path d="M4 {H * 0.45} H{W - 4} V{H - 6} Q{W - 4} {H} {W / 2} {H} Q4 {H} 4 {H - 6} Z" class="agua" />
        <!-- anillos -->
        {#each [0.35, 0.55, 0.75] as f (f)}
          <line x1="4" y1={H * f} x2={W - 4} y2={H * f} class="anillo" />
        {/each}
        <!-- tapa -->
        <rect x={W / 2 - 14} y="0" width="28" height="8" rx="3" class="tapa" />
        <!-- base -->
        <rect x="0" y={H + 2} width={W} height="6" rx="2" class="base" />
      </g>
    {/each}
    {#if cantidad > MAX}
      <text x={10 + MAX * (W + SEP) + 4} y="80" class="mas">× {cantidad}</text>
    {/if}
    <text x="10" y="146" class="etiqueta">{cantidad} × {capacidadL.toLocaleString('es-GT')} L</text>
    {#if diametroM && alturaM}
      <text x="10" y="164" class="medida">Ø {fmt(diametroM)} m × alto {fmt(alturaM)} m (cada uno)</text>
    {/if}
  </svg>
</figure>

<style>
  .tinacos { margin: 0.5rem 0; overflow-x: auto; }
  svg { width: 100%; height: auto; display: block; }
  .cuerpo { fill: #e8eef4; stroke: #0b63b6; stroke-width: 2; }
  .agua { fill: #9cc9ea; opacity: 0.85; }
  .anillo { stroke: #0b63b6; stroke-width: 1; opacity: 0.5; }
  .tapa { fill: #0b63b6; }
  .base { fill: #8a9aa8; }
  .etiqueta { font-size: 15px; font-weight: 700; fill: #0b2f52; }
  .medida { font-size: 13px; fill: #44515e; }
  .mas { font-size: 20px; font-weight: 700; fill: #0b63b6; }
</style>
