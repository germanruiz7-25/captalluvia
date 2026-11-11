<script lang="ts">
  import { segmentosDelTecho, type NumeroAguas, type OpcionTecho } from '../core/techo';

  let { opciones, aguas = 1 }: { opciones: OpcionTecho[]; aguas?: NumeroAguas } = $props();

  // Marco fijo para cada dibujo: el techo se escala para caber, pero las letras
  // conservan siempre el mismo tamaño, sea un techo de 20 m² o una escuela de 1,000 m².
  const ANCHO_MARCO = 300;
  const ALTO_MARCO = 240; // alto máximo; cada dibujo usa solo el que necesita
  const IZQ = 12;
  const DER = 92; // espacio para la cota del ancho (hasta "100.25 m")
  const ARRIBA = 18;
  const ABAJO = 50; // espacio para la cota del largo

  // Misma escala para las tres formas, para compararlas a simple vista.
  const escala = $derived.by(() => {
    if (opciones.length === 0) return 1;
    const largoMax = Math.max(...opciones.map((o) => o.largo));
    const anchoMax = Math.max(...opciones.map((o) => o.ancho));
    return Math.min(
      (ANCHO_MARCO - IZQ - DER) / largoMax,
      (ALTO_MARCO - ARRIBA - ABAJO) / anchoMax,
    );
  });

  const fmt = (v: number) =>
    v.toLocaleString('es-GT', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
</script>

<div class="opciones">
  {#each opciones as o (o.forma)}
    {@const s = escala}
    {@const w = o.largo * s}
    {@const h = o.ancho * s}
    {@const x = IZQ}
    {@const y = ARRIBA}
    {@const segs = segmentosDelTecho(o, aguas)}
    <figure>
      <figcaption>
        <strong>{o.nombre}: {fmt(o.ancho)} × {fmt(o.largo)} m</strong>
        <span>
          {fmt(o.area)} m²{aguas === 2 ? ` = 2 aguas de ${fmt(segs[0].area)} m²` : ''}
        </span>
      </figcaption>
      <svg
        viewBox="0 0 {ANCHO_MARCO} {ARRIBA + h + ABAJO}"
        role="img"
        aria-label="Techo {o.nombre.toLowerCase()} de {fmt(o.ancho)} por {fmt(o.largo)} metros, {aguas === 2 ? 'de dos aguas, ' : ''}{fmt(o.area)} metros cuadrados"
      >
        <rect {x} {y} width={w} height={h} rx="2" class="techo" />

        {#if aguas === 2}
          <!-- Cumbrera al centro, a lo largo del lado largo -->
          <line x1={x} x2={x + w} y1={y + h / 2} y2={y + h / 2} class="cumbrera" />
          <text x={x + w / 2} y={y + h / 4 - 2} text-anchor="middle" class="etiqueta">Agua 1</text>
          <text x={x + w / 2} y={y + h / 4 + 17} text-anchor="middle" class="area">{fmt(segs[0].area)} m²</text>
          <text x={x + w / 2} y={y + (3 * h) / 4 - 2} text-anchor="middle" class="etiqueta">Agua 2</text>
          <text x={x + w / 2} y={y + (3 * h) / 4 + 17} text-anchor="middle" class="area">{fmt(segs[1].area)} m²</text>
          <!-- Una canaleta y una bajante por cada agua -->
          <line x1={x} x2={x + w} y1={y} y2={y} class="canaleta" />
          <circle cx={x + w} cy={y} r="5" class="bajante" />
          <!-- Cota de cada agua (de la canaleta a la cumbrera) -->
          <path d="M{x + w + 12} {y}h8M{x + w + 16} {y}V{y + h}M{x + w + 12} {y + h / 2}h8M{x + w + 12} {y + h}h8" class="cota" />
          <text x={x + w + 24} y={y + h / 4 + 4} class="medida">{fmt(segs[0].ancho)} m</text>
          <text x={x + w + 24} y={y + (3 * h) / 4 + 4} class="medida">{fmt(segs[1].ancho)} m</text>
        {:else}
          <text x={x + w / 2} y={y + h / 2 + 5} text-anchor="middle" class="area">{fmt(o.area)} m²</text>
          <path d="M{x + w + 12} {y}h8M{x + w + 16} {y}V{y + h}M{x + w + 12} {y + h}h8" class="cota" />
          <text x={x + w + 24} y={y + h / 2 + 4} class="medida">{fmt(o.ancho)} m</text>
        {/if}

        <line x1={x} x2={x + w} y1={y + h} y2={y + h} class="canaleta" />
        <circle cx={x + w} cy={y + h} r="5" class="bajante" />
        <path d="M{x} {y + h + 12}v8M{x} {y + h + 16}H{x + w}M{x + w} {y + h + 12}v8" class="cota" />
        <text x={x + w / 2} y={y + h + 38} text-anchor="middle" class="medida">{fmt(o.largo)} m</text>
      </svg>
    </figure>
  {/each}
</div>
<p class="leyenda">
  <span class="item"><span class="muestra-canaleta"></span>{aguas === 2 ? 'Una canaleta en cada lado largo' : 'Canaleta en el lado largo'}</span>
  <span class="item"><span class="muestra-bajante"></span>Bajante hacia el tanque</span>
  {#if aguas === 2}
    <span class="item"><span class="muestra-cumbrera"></span>Cumbrera (parte más alta del techo)</span>
  {/if}
</p>

<style>
  .opciones {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1rem;
  }
  figure { margin: 0; }
  figcaption { display: grid; margin-bottom: 0.25rem; }
  figcaption span { color: var(--texto-suave); font-size: 0.9rem; }
  svg { width: 100%; max-width: 22rem; height: auto; display: block; }
  .techo { fill: var(--acento-suave); stroke: var(--borde); stroke-width: 1.5; }
  .cumbrera { stroke: var(--texto-suave); stroke-width: 1.5; stroke-dasharray: 6 4; }
  .canaleta { stroke: var(--acento); stroke-width: 4; }
  .bajante { fill: var(--acento); }
  .cota { fill: none; stroke: var(--texto-suave); stroke-width: 1; }
  .area { font-size: 17px; font-weight: 600; fill: var(--texto); }
  .etiqueta { font-size: 14px; fill: var(--texto-suave); }
  .medida { font-size: 15px; fill: var(--texto); }
  .leyenda { color: var(--texto-suave); font-size: 0.85rem; display: flex; flex-wrap: wrap; gap: 0.4rem 1.25rem; }
  .item { display: inline-flex; align-items: center; gap: 0.5rem; }
  .muestra-canaleta { display: inline-block; width: 1.5rem; height: 4px; background: var(--acento); }
  .muestra-bajante { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--acento); }
  .muestra-cumbrera { display: inline-block; width: 1.5rem; border-top: 2px dashed var(--texto-suave); }
</style>
