<script lang="ts">
  // Cisterna de block y cemento en perspectiva, con medidas interiores. Letras de tamaño fijo.
  let {
    largoM,
    anchoM,
    altoUtilM,
    bordeLibreM = 0.3,
  }: { largoM: number; anchoM: number; altoUtilM: number; bordeLibreM?: number } = $props();

  const fmt = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Escala para caber en un marco de 320 × 230
  const altoTotal = $derived(altoUtilM + bordeLibreM);
  const k = $derived(Math.min(170 / Math.max(0.1, largoM + anchoM * 0.5), 120 / Math.max(0.1, altoTotal)));
  const L = $derived(largoM * k);
  const P = $derived(anchoM * k * 0.5); // profundidad en perspectiva
  const Hh = $derived(altoTotal * k);
  const Hu = $derived(altoUtilM * k);
  const X0 = 46;
  const Y0 = 196; // esquina inferior izquierda del frente
  const dx = $derived(P * 0.87);
  const dy = $derived(P * 0.5);

  // Hiladas de block en el frente (cada 0.20 m)
  const hiladas = $derived(Math.max(1, Math.round(altoTotal / 0.2)));
</script>

<figure class="cisterna">
  <svg viewBox="0 0 330 240" role="img"
    aria-label="Cisterna de block: largo {fmt(largoM)} m, ancho {fmt(anchoM)} m, alto útil {fmt(altoUtilM)} m">
    <!-- cara superior (abierta, se ve el agua) -->
    <path d="M{X0} {Y0 - Hh} l{dx} {-dy} h{L} l{-dx} {dy} Z" class="tapa" />
    <!-- cara lateral -->
    <path d="M{X0 + L} {Y0} l{dx} {-dy} v{-Hh} l{-dx} {dy} Z" class="lado" />
    <!-- frente -->
    <rect x={X0} y={Y0 - Hh} width={L} height={Hh} class="frente" />
    {#each Array(hiladas) as _, i (i)}
      {@const y = Y0 - (i + 1) * (Hh / hiladas)}
      <line x1={X0} y1={y} x2={X0 + L} y2={y} class="junta" />
      {#each Array(Math.max(1, Math.round(largoM / 0.4))) as __, j (j)}
        {@const paso = L / Math.max(1, Math.round(largoM / 0.4))}
        <line x1={X0 + j * paso + (i % 2 ? paso / 2 : 0)} y1={y} x2={X0 + j * paso + (i % 2 ? paso / 2 : 0)} y2={y + Hh / hiladas} class="junta" />
      {/each}
    {/each}
    <!-- nivel del agua (línea punteada en el frente) -->
    <line x1={X0} y1={Y0 - Hu} x2={X0 + L} y2={Y0 - Hu} class="nivel" />
    <rect x={X0 + L / 2 - 66} y={Y0 - Hu + 4} width="132" height="16" rx="3" class="fondo-txt" />
    <text x={X0 + L / 2} y={Y0 - Hu + 16} text-anchor="middle" class="agua-txt">nivel máximo del agua</text>

    <!-- cotas -->
    <path d="M{X0} {Y0 + 10}v8M{X0} {Y0 + 14}H{X0 + L}M{X0 + L} {Y0 + 10}v8" class="cota" />
    <text x={X0 + L / 2} y={Y0 + 32} text-anchor="middle" class="medida">largo {fmt(largoM)} m</text>
    <path d="M{X0 + L + 8} {Y0 + 4}l{dx} {-dy}" class="cota" />
    <text x={X0 + L + dx / 2 + 14} y={Y0 - dy / 2 + 12} class="medida">ancho {fmt(anchoM)} m</text>
    <path d="M{X0 - 10} {Y0}h-8M{X0 - 14} {Y0}V{Y0 - Hu}M{X0 - 18} {Y0 - Hu}h8" class="cota" />
    <text x={X0 - 22} y={Y0 - Hu / 2} text-anchor="middle" class="medida" transform="rotate(-90 {X0 - 22} {Y0 - Hu / 2})">alto útil {fmt(altoUtilM)} m</text>
    <text x={X0} y={Y0 - Hh - dy - 8} class="nota">+ {fmt(bordeLibreM)} m de borde libre sobre el agua</text>
  </svg>
  <figcaption>Medidas interiores. Muros de block con repello impermeabilizante, losa de fondo y tapadera (esquema).</figcaption>
</figure>

<style>
  .cisterna { margin: 0.5rem 0; }
  svg { width: 100%; max-width: 26rem; height: auto; display: block; }
  .frente { fill: #d9d4cc; stroke: #5d5a55; stroke-width: 1.5; }
  .lado { fill: #c6c0b6; stroke: #5d5a55; stroke-width: 1.5; }
  .tapa { fill: #9cc9ea; stroke: #5d5a55; stroke-width: 1.5; }
  .junta { stroke: #a39d93; stroke-width: 0.8; }
  .nivel { stroke: #0b63b6; stroke-width: 2; stroke-dasharray: 6 4; }
  .fondo-txt { fill: #fff; opacity: 0.85; }
  .agua-txt { font-size: 12px; fill: #0b63b6; font-weight: 600; }
  .cota { fill: none; stroke: #44515e; stroke-width: 1; }
  .medida { font-size: 13px; fill: #0b2f52; }
  .nota { font-size: 12px; fill: #44515e; }
  figcaption { font-size: 0.85rem; color: var(--texto-suave); }
</style>
