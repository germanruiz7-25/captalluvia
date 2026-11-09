<script lang="ts">
  // Un solo barril con el agua en celeste y, adentro, cuántos barriles de 55 galones equivale el volumen.
  let { barriles, volumenM3 }: { barriles: number; volumenM3: number } = $props();

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
</script>

<figure class="barril">
  <svg viewBox="0 0 340 190" role="img" aria-label="{n1(volumenM3)} metros cúbicos equivalen a {n0(barriles)} barriles de 55 galones">
    <text x="78" y="102" text-anchor="middle" class="volumen">{n1(volumenM3)} m³</text>
    <text x="160" y="104" text-anchor="middle" class="igual">=</text>
    <g transform="translate(196, 10)">
      <!-- cuerpo -->
      <path d="M8 14 Q4 85 8 156 Q60 172 112 156 Q116 85 112 14 Q60 -2 8 14 Z" class="cuerpo" />
      <!-- agua atenuada -->
      <path d="M7 40 Q60 52 113 40 Q116 98 112 156 Q60 172 8 156 Q4 98 7 40 Z" class="agua" />
      <!-- aros -->
      <path d="M6 52 Q60 64 114 52" class="aro" />
      <path d="M6 134 Q60 146 114 134" class="aro" />
      <!-- tapa -->
      <ellipse cx="60" cy="14" rx="52" ry="10" class="tapa" />
      <ellipse cx="82" cy="13" rx="6" ry="2.5" class="tapon" />
      <text x="60" y="96" text-anchor="middle" class="cantidad">{n0(barriles)}</text>
      <text x="60" y="117" text-anchor="middle" class="unidad">barriles</text>
    </g>
  </svg>
  <figcaption>Barril de 55 galones (208 L). {n1(volumenM3)} m³ = {n0(volumenM3 * 1000)} L ≈ {n1(barriles)} barriles.</figcaption>
</figure>

<style>
  .barril { margin: 0.5rem 0; }
  svg { width: 100%; max-width: 21rem; height: auto; display: block; }
  .cuerpo { fill: #eef5fb; stroke: #0b63b6; stroke-width: 3; }
  .agua { fill: #9fd3f5; opacity: 0.75; }
  .aro { fill: none; stroke: #0b63b6; stroke-width: 2.5; opacity: 0.7; }
  .tapa { fill: #d6e7f5; stroke: #0b63b6; stroke-width: 3; }
  .tapon { fill: #0b63b6; }
  .cantidad { font-size: 38px; font-weight: 700; fill: #0b2f52; }
  .unidad { font-size: 16px; font-weight: 600; fill: #0b2f52; }
  .volumen { font-size: 30px; font-weight: 700; fill: #0b63b6; }
  .igual { font-size: 34px; font-weight: 700; fill: #44515e; }
  figcaption { font-size: 0.85rem; color: var(--texto-suave); }
</style>
