<script lang="ts">
  import {
    calcularTecho,
    COEFICIENTES_ESCORRENTIA,
    NOMBRES_TECHO,
    type TipoTecho,
  } from '../core/techo';
  import DibujoTecho from './DibujoTecho.svelte';

  let personas = $state(5);
  let litros = $state(50);
  let lluviaAnual = $state(1200);
  let diasLluvia = $state(110);
  let tipoTecho: TipoTecho = $state('lamina_metalica');

  const r = $derived(
    calcularTecho({
      personas,
      litrosPorPersonaDia: litros,
      lluviaAnualMm: lluviaAnual,
      diasConLluvia: diasLluvia,
      tipoTecho,
    }),
  );

  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
  const tipos = Object.keys(COEFICIENTES_ESCORRENTIA) as TipoTecho[];
</script>

<section class="tarjeta">
  <h2>¿Cuánto techo necesita la familia?</h2>
  <p class="nota">
    Prototipo de la fase 0. Por ahora la lluvia se escribe a mano; en la fase 1 se obtendrá sola
    con la ubicación de la vivienda.
  </p>

  <div class="campos">
    <label>Personas en la vivienda
      <input type="number" min="1" max="50" bind:value={personas} />
    </label>
    <label>Litros por persona al día
      <select bind:value={litros}>
        <option value={20}>20 L — acceso básico (OMS)</option>
        <option value={50}>50 L — referencia ONU</option>
        <option value={100}>100 L — referencia ONU óptima</option>
      </select>
    </label>
    <label>Lluvia anual del lugar (mm)
      <input type="number" min="0" step="10" bind:value={lluviaAnual} />
    </label>
    <label>Días con lluvia al año
      <input type="number" min="0" max="366" bind:value={diasLluvia} />
    </label>
    <label>Material del techo
      <select bind:value={tipoTecho}>
        {#each tipos as t (t)}
          <option value={t}>{NOMBRES_TECHO[t]} (Ce {COEFICIENTES_ESCORRENTIA[t]})</option>
        {/each}
      </select>
    </label>
  </div>

  {#if r.areaMinimaM2 === null}
    <p class="alerta">Con estos datos no queda lluvia aprovechable. Revisa la lluvia anual o los días con lluvia.</p>
  {:else}
    <div class="resultado">
      <p class="cifra">{r.areaMinimaM2} m²</p>
      <p>
        Área mínima de techo, medida en planta (vista desde arriba). Cálculo exacto:
        {n1(r.areaMinimaExactaM2 ?? 0)} m² para {n1(r.demandaM3)} m³ al año con
        {n1(r.lluviaAprovechableMm)} mm de lluvia aprovechable.
      </p>
    </div>
    <DibujoTecho opciones={r.opciones} />
    <p class="nota">
      El área recomendada, que asegura agua también en la época seca con el tanque elegido, se
      calculará con la simulación diaria en la fase 1.
    </p>
  {/if}
</section>

<style>
  .campos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 0.75rem 1rem;
    margin: 1rem 0;
  }
  label { display: grid; gap: 0.25rem; font-size: 0.9rem; color: var(--texto-suave); }
  input, select {
    font: inherit; color: var(--texto); padding: 0.5rem 0.6rem;
    border: 1px solid var(--borde); border-radius: 0.5rem; background: var(--fondo);
  }
  .resultado { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.5rem; }
  .resultado p { margin: 0; flex: 1 1 18rem; }
  .cifra { font-size: 2.5rem; font-weight: 700; color: var(--acento); flex: 0 0 auto !important; }
  .alerta { color: #b42318; }
</style>
