<script lang="ts">
  // Dos cortes esquemáticos de tamaño fijo (las letras no cambian con el tamaño del techo):
  // la canaleta semicircular sugerida y el tubo PVC de la bajante sugerida.
  let {
    canaletaNombre,
    canaletaMm,
    tipoCanal,
    pendientePct,
    bajanteNombre,
    exteriorMm,
    interiorMm,
  }: {
    canaletaNombre: string;
    canaletaMm: number;
    tipoCanal: string;
    pendientePct: number;
    bajanteNombre: string;
    exteriorMm: number;
    interiorMm: number;
  } = $props();

  const fmt = (v: number, d = 1) =>
    v.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: d });

  // Canaleta: semicírculo de radio R, agua hasta 3/4 del radio.
  const R = 100;
  const CX = 150;
  const BORDE = 46; // y del borde superior
  const yAgua = BORDE + R - 0.75 * R;
  const mitadAgua = Math.sqrt(R * R - (0.25 * R) ** 2);

  // Tubo: corte circular. El agua baja pegada a la pared (anillo de 1/3 de la sección).
  const RE = 66;
  const TX = 82;
  const TY = 98;
  const ri = $derived(RE * Math.min(0.97, interiorMm / exteriorMm));
  const rAire = $derived(ri * Math.sqrt(2 / 3));
</script>

<div class="dibujos">
  <figure>
    <figcaption><strong>Canaleta: {canaletaNombre}</strong><span>{tipoCanal}, corte transversal</span></figcaption>
    <svg viewBox="0 0 300 236" role="img"
      aria-label="Corte de canaleta semicircular de {fmt(canaletaMm / 10)} centímetros, con agua hasta tres cuartos del radio">
      <!-- cota del ancho -->
      <path d="M{CX - R} {BORDE - 22}v10M{CX - R} {BORDE - 17}H{CX + R}M{CX + R} {BORDE - 22}v10" class="cota" />
      <text x={CX} y={BORDE - 27} text-anchor="middle" class="medida">Ø {fmt(canaletaMm / 10)} cm ({canaletaNombre.split(' ')[0]})</text>
      <!-- agua -->
      <path d="M{CX - mitadAgua} {yAgua}A{R} {R} 0 0 0 {CX + mitadAgua} {yAgua}Z" class="agua" />
      <!-- pared de la canaleta -->
      <path d="M{CX - R} {BORDE}A{R} {R} 0 0 0 {CX + R} {BORDE}" class="pared" />
      <!-- borde libre y tirante -->
      <path d="M{CX + R + 10} {BORDE}h8M{CX + R + 14} {BORDE}V{yAgua}M{CX + R + 10} {yAgua}h8M{CX + R + 14} {yAgua}V{BORDE + R}M{CX + R + 10} {BORDE + R}h8" class="cota" />
      <text x={CX} y={yAgua - 6} text-anchor="middle" class="nota-svg">borde libre 25 %</text>
      <text x={CX} y={BORDE + R - 26} text-anchor="middle" class="etiqueta-agua">agua: 3/4 del radio</text>
      <text x={CX} y={BORDE + R + 34} text-anchor="middle" class="medida">Pendiente {fmt(pendientePct, 2)} %</text>
      <text x={CX} y={BORDE + R + 54} text-anchor="middle" class="nota-svg">= {fmt(pendientePct * 10, 1)} mm de caída por metro</text>
    </svg>
  </figure>

  <figure>
    <figcaption><strong>Bajante: tubo PVC de {bajanteNombre}</strong><span>corte transversal</span></figcaption>
    <svg viewBox="0 0 300 236" role="img"
      aria-label="Corte de tubo PVC de {bajanteNombre}, diámetro exterior {fmt(exteriorMm)} milímetros, interior {fmt(interiorMm, 0)} milímetros">
      <circle cx={TX} cy={TY} r={RE} class="tubo" />
      <circle cx={TX} cy={TY} r={ri} class="agua" />
      <circle cx={TX} cy={TY} r={rAire} class="aire" />
      <text x={TX} y={TY + 5} text-anchor="middle" class="nota-svg">aire</text>
      <!-- cota del diámetro exterior -->
      <path d="M{TX - RE} {TY + RE + 12}v10M{TX - RE} {TY + RE + 17}H{TX + RE}M{TX + RE} {TY + RE + 12}v10" class="cota" />
      <text x={TX} y={TY + RE + 36} text-anchor="middle" class="medida">Ø ext. {fmt(exteriorMm)} mm</text>
      <!-- etiquetas a la derecha -->
      <text x="166" y="58" class="medida">{bajanteNombre} nominal</text>
      <text x="166" y="84" class="medida">Ø int. ≈ {fmt(interiorMm, 0)} mm</text>
      <line x1={TX + ri * 0.8} y1={TY - ri * 0.62} x2="162" y2="80" class="guia" />
      <text x="166" y="118" class="etiqueta-agua">agua pegada</text>
      <text x="166" y="134" class="etiqueta-agua">a la pared:</text>
      <text x="166" y="150" class="etiqueta-agua">1/3 de la sección</text>
      <line x1={TX + (ri + rAire) / 2} y1={TY + 4} x2="162" y2="130" class="guia" />
    </svg>
  </figure>
</div>
<p class="leyenda">
  Dibujos esquemáticos, sin escala. La canaleta comercial puede tener otra forma (colonial o de alto caudal), pero
  su sección útil no debe ser menor que la del semicírculo indicado.
</p>

<style>
  .dibujos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1rem;
    margin-top: 0.75rem;
  }
  figure { margin: 0; }
  figcaption { display: grid; margin-bottom: 0.25rem; }
  figcaption span { color: var(--texto-suave); font-size: 0.9rem; }
  svg { width: 100%; max-width: 22rem; height: auto; display: block; }
  .pared { fill: none; stroke: var(--texto); stroke-width: 5; stroke-linecap: round; }
  .agua { fill: #9cc9ea; }
  .aire { fill: var(--fondo); }
  .tubo { fill: #e9edf1; stroke: var(--texto); stroke-width: 2; }
  .cota { fill: none; stroke: var(--texto-suave); stroke-width: 1; }
  .guia { stroke: var(--texto-suave); stroke-width: 1; }
  .medida { font-size: 15px; fill: var(--texto); }
  .nota-svg { font-size: 13px; fill: var(--texto-suave); }
  .etiqueta-agua { font-size: 13px; fill: var(--acento); font-weight: 600; }
  .leyenda { color: var(--texto-suave); font-size: 0.85rem; }
</style>
