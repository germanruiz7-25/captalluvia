<script lang="ts">
  let { anualMm = null }: { anualMm?: number | null } = $props();
  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  // Cara superior del metro cuadrado en perspectiva (isométrica)
  const izq = [40, 132], arr = [150, 92], der = [260, 132], aba = [150, 172];
  const capa = 9; // grosor dibujado de la lámina de agua (exagerado para que se vea)
  const p = (pts: number[][], dy = 0) => pts.map(([x, y]) => `${x},${y + dy}`).join(' ');

  // En pantallas angostas el pichel va debajo del metro cuadrado, para que el texto no se achique.
  let ancho = $state(520);
  const angosto = $derived(ancho > 0 && ancho < 440);
</script>

<figure class="ilustracion" bind:clientWidth={ancho}>
  <svg viewBox={angosto ? '0 0 310 440' : '0 0 520 250'} role="img" aria-label="Un milímetro de lluvia sobre un metro cuadrado de techo equivale a un litro de agua, como un pichel lleno">
    <defs>
      <clipPath id="cuerpo-pichel">
        <path d="M392 84 L448 84 L452 96 Q470 122 466 182 Q464 204 440 204 L400 204 Q376 204 374 182 Q370 122 388 96 Z" />
      </clipPath>
      <marker id="flecha-litro" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0 0L10 5L0 10z" class="flecha" />
      </marker>
    </defs>

    <!-- 1 m² de techo con una lámina de 1 mm de agua -->
    <g transform={angosto ? 'translate(5 -10)' : ''}>
    <polygon points={p([izq, aba, [aba[0], aba[1] + 10], [izq[0], izq[1] + 10]])} class="lado" />
    <polygon points={p([aba, der, [der[0], der[1] + 10], [aba[0], aba[1] + 10]])} class="lado oscuro" />
    <polygon points={p([izq, arr, der, aba])} class="techo" />
    <polygon points={p([izq, aba, [aba[0], aba[1] - capa], [izq[0], izq[1] - capa]])} class="agua-lado" />
    <polygon points={p([aba, der, [der[0], der[1] - capa], [aba[0], aba[1] - capa]])} class="agua-lado oscuro" />
    <polygon points={p([izq, arr, der, aba], -capa)} class="agua" />
    <text x="150" y="128" text-anchor="middle" class="grande">1 m²</text>
    <text x="78" y="172" text-anchor="middle" class="medida" transform="rotate(20 78 172)">1 m</text>
    <text x="222" y="172" text-anchor="middle" class="medida" transform="rotate(-20 222 172)">1 m</text>
    <line x1="232" y1="70" x2="214" y2="112" class="guia" />
    <text x={angosto ? 112 : 160} y="58" class="texto">capa de 1 mm de lluvia</text>
    </g>

    <!-- igual a -->
    {#if angosto}
      <line x1="155" y1="200" x2="155" y2="246" class="linea-flecha" marker-end="url(#flecha-litro)" />
      <text x="180" y="230" class="grande">=</text>
    {:else}
      <line x1="286" y1="138" x2="356" y2="138" class="linea-flecha" marker-end="url(#flecha-litro)" />
      <text x="320" y="126" text-anchor="middle" class="grande">=</text>
    {/if}

    <!-- Pichel con 1 litro -->
    <g transform={angosto ? 'translate(-268 178)' : ''}>
    <rect x="368" y="128" width="104" height="80" clip-path="url(#cuerpo-pichel)" class="agua" />
    <path d="M392 84 L448 84 L452 96 Q470 122 466 182 Q464 204 440 204 L400 204 Q376 204 374 182 Q370 122 388 96 Z" class="pichel" />
    <path d="M392 84 L378 74 L396 78" class="pichel" />
    <path d="M462 106 Q496 110 494 142 Q492 170 466 174" class="asa" />
    <text x="420" y="176" text-anchor="middle" class="grande blanco">1 L</text>
    <text x="420" y="232" text-anchor="middle" class="texto">1 litro de agua</text>
    </g>
  </svg>
  <figcaption>
    <strong>1 mm de lluvia sobre 1 m² de techo = 1 litro de agua.</strong>
    {#if anualMm}
      Aquí caen {n0(anualMm)} mm al año: cada m² de techo recibe {n0(anualMm)} litros.
    {/if}
  </figcaption>
</figure>

<style>
  .ilustracion { margin: 0.5rem 0 1rem; }
  svg { width: 100%; max-width: 32rem; height: auto; display: block; }
  figcaption { margin-top: 0.25rem; }
  .techo { fill: #d9dee3; stroke: var(--texto-suave); stroke-width: 1.5; }
  .lado { fill: #b8c0c8; stroke: var(--texto-suave); stroke-width: 1; }
  .lado.oscuro { fill: #9aa4ae; }
  .agua { fill: #4fa8e8; fill-opacity: 0.75; }
  .agua-lado { fill: #2b86c8; fill-opacity: 0.8; }
  .agua-lado.oscuro { fill: #1f6fa8; }
  .pichel { fill: none; stroke: var(--texto); stroke-width: 2.5; stroke-linejoin: round; }
  .asa { fill: none; stroke: var(--texto); stroke-width: 6; stroke-linecap: round; }
  .guia { stroke: var(--texto-suave); stroke-width: 1; }
  .linea-flecha { stroke: var(--texto-suave); stroke-width: 2; }
  .flecha { fill: var(--texto-suave); }
  .grande { font-size: 22px; font-weight: 700; fill: var(--texto); }
  .blanco { fill: #fff; }
  .texto { font-size: 16px; fill: var(--texto); }
  .medida { font-size: 15px; fill: var(--texto-suave); }
</style>
