<script lang="ts">
  import { areaMinimaM2, opcionesDeTecho, type NumeroAguas } from '../core/techo';
  import type { ResumenOferta } from '../core/oferta';
  import type { ResumenDemanda } from '../core/demanda';
  import DibujoTecho from './DibujoTecho.svelte';

  let {
    oferta,
    demanda,
    aguas,
  }: {
    oferta: ResumenOferta | null;
    demanda: ResumenDemanda;
    aguas: NumeroAguas;
  } = $props();

  const exacta = $derived(oferta ? areaMinimaM2(demanda.m3Anual, oferta.netaAnualMm) : null);
  const area = $derived(exacta === null ? null : Math.ceil(exacta - 1e-9));
  const opciones = $derived(area === null ? [] : opcionesDeTecho(area));
  const cobertura = $derived(
    oferta?.m3NetosAnual != null && demanda.m3Anual > 0 ? oferta.m3NetosAnual / demanda.m3Anual : null,
  );

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
</script>

<section class="tarjeta paso">
  <p class="numero-paso">Paso 4 de 5</p>
  <h2>Área de techo necesaria</h2>

  {#if !oferta}
    <p class="nota">Completa el paso 1 para ver los resultados.</p>
  {:else if demanda.m3Anual <= 0}
    <p class="nota">Indica los usuarios y los litros por día en el paso 3.</p>
  {:else if area === null}
    <p class="alerta">Con esta lluvia no queda lluvia neta aprovechable; no es posible dimensionar el techo.</p>
  {:else}
    <div class="destacado">
      <span class="cifra">{area.toLocaleString('es-GT')} m²</span>
      <span>
        de techo como mínimo (medido en planta) para captar los {n1(demanda.m3Anual)} m³ que se necesitan al año
        con {n0(oferta.netaAnualMm)} mm de lluvia neta. Cálculo exacto: {n1(exacta ?? 0)} m².
      </span>
    </div>

    {#if cobertura !== null && oferta.areaM2 !== null && oferta.m3NetosAnual !== null}
      <p class:alerta={cobertura < 1} class:ok={cobertura >= 1}>
        {#if cobertura >= 1}
          El techo existente de {n0(oferta.areaM2)} m² alcanza: capta {n1(oferta.m3NetosAnual)} m³ netos al año,
          {Math.round(cobertura * 100)} % de lo que se necesita.
        {:else}
          El techo existente de {n0(oferta.areaM2)} m² cubre {Math.round(cobertura * 100)} % de la demanda anual
          ({n1(oferta.m3NetosAnual)} de {n1(demanda.m3Anual)} m³). Faltan {n0(area - oferta.areaM2)} m² de techo,
          o reducir los litros por usuario.
        {/if}
      </p>
    {/if}

    <h3>Medidas sugeridas del techo</h3>
    <DibujoTecho {opciones} {aguas} />

    <p class="nota">
      Este es el balance anual: el agua que cae en la época de lluvia debe guardarse para la época seca.
      En la siguiente versión se agregan la simulación mes a mes del tanque, el área recomendada para la
      época seca, el tanque comercial, los materiales y el presupuesto.
    </p>
  {/if}
</section>

<style>
  h3 { font-size: 1rem; margin: 1.25rem 0 0.5rem; }
  .ok { color: #067647; font-weight: 600; }
  .alerta { font-weight: 600; }
</style>
