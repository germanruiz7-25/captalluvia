<script lang="ts">
  import { COEFICIENTES_ESCORRENTIA, NOMBRES_TECHO, type NumeroAguas, type TipoTecho } from '../core/techo';
  import type { ResumenOferta } from '../core/oferta';
  import GraficoMensual from './GraficoMensual.svelte';
  import { MESES, type ResumenLluvia } from '../core/lluvia';

  let {
    lluvia,
    oferta,
    tipoTecho = $bindable(),
    aguas = $bindable(),
    descarteMm = $bindable(),
    areaDisponible = $bindable(),
    umbralMm = $bindable(),
  }: {
    lluvia: ResumenLluvia | null;
    oferta: ResumenOferta | null;
    tipoTecho: TipoTecho;
    aguas: NumeroAguas;
    descarteMm: number;
    areaDisponible: number | null;
    umbralMm: number;
  } = $props();

  const mesesSecos = $derived(
    lluvia && oferta ? oferta.mesesCaptados.flatMap((c, i) => (!c && lluvia.mensualMm[i] > 0 ? [MESES[i]] : [])) : [],
  );

  const tipos = Object.keys(COEFICIENTES_ESCORRENTIA) as TipoTecho[];
  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
</script>

<section class="tarjeta paso">
  <p class="numero-paso">Paso 2 de 5</p>
  <h2>Techo y lluvia neta</h2>

  <div class="campos no-imprimir">
    <label>Material del techo
      <select bind:value={tipoTecho}>
        {#each tipos as t (t)}
          <option value={t}>{NOMBRES_TECHO[t]} (Ce {COEFICIENTES_ESCORRENTIA[t]})</option>
        {/each}
      </select>
    </label>
    <label>Forma del techo
      <select bind:value={aguas}>
        <option value={2}>Dos aguas (cumbrera al centro)</option>
        <option value={1}>Un agua (una sola pendiente)</option>
      </select>
    </label>
    <label>Primer descarte por lluvia (mm)
      <input type="number" min="0" max="5" step="0.5" bind:value={descarteMm} />
    </label>
    <label>Captar desde (mm de PN al mes)
      <input type="number" min="0" max="300" step="5" bind:value={umbralMm} />
    </label>
    <label>Área de techo existente (m², opcional)
      <input type="number" min="0" step="1" placeholder="Ej. 60" bind:value={areaDisponible} />
    </label>
  </div>

  <p class="solo-impresion">
    Techo de {NOMBRES_TECHO[tipoTecho].toLowerCase()} (Ce {COEFICIENTES_ESCORRENTIA[tipoTecho]}),
    {aguas === 2 ? 'dos aguas' : 'un agua'}, primer descarte de {n1(descarteMm)} mm por lluvia, captación en meses con {n0(umbralMm)} mm o más de precipitación neta{#if areaDisponible}, área existente {n0(areaDisponible)} m²{/if}.
  </p>

  {#if !lluvia || !oferta}
    <p class="nota">Completa el paso 1 para ver la lluvia neta.</p>
  {:else}
    <table class="cascada">
      <tbody>
        <tr><td>Lluvia que cae al año</td><td>{n0(oferta.brutaAnualMm)} mm</td></tr>
        <tr><td>− Meses con PN menor a {n0(oferta.umbralMm)} mm, no se captan{mesesSecos.length ? ` (${mesesSecos.join(', ')})` : ''}</td><td>−{n0(oferta.perdidaMesesSecosMm)} mm</td></tr>
        <tr><td>− Pérdida por el material del techo (Ce {COEFICIENTES_ESCORRENTIA[tipoTecho]}, {NOMBRES_TECHO[tipoTecho].toLowerCase()})</td><td>−{n0(oferta.perdidaEscorrentiaMm)} mm</td></tr>
        <tr><td>− Primer descarte ({n1(descarteMm)} mm por cada día con lluvia de los meses captados)</td><td>−{n0(oferta.perdidaDescarteMm)} mm</td></tr>
        <tr class="total"><td>Lluvia neta aprovechable</td><td>{n0(oferta.netaAnualMm)} mm</td></tr>
      </tbody>
    </table>
    <p>
      Cada m² de techo capta <strong>{n0(oferta.netaAnualMm)} litros netos al año</strong>
      ({Math.round(oferta.eficiencia * 100)} % de la lluvia que cae).
    </p>

    {#if oferta.m3NetosAnual !== null && oferta.m3BrutosAnual !== null}
      <div class="destacado">
        <span class="cifra">{n1(oferta.m3NetosAnual)} m³</span>
        <span>
          netos al año con el techo existente de {n0(oferta.areaM2 ?? 0)} m²
          (de {n1(oferta.m3BrutosAnual)} m³ de lluvia que caen sobre él).
          {#if aguas === 2}Cada agua aporta {n1(oferta.m3NetosAnual / 2)} m³.{/if}
        </span>
      </div>
    {:else}
      <p class="nota">Si ya existe un techo, escribe su área para ver cuántos m³ netos se pueden obtener al año.</p>
    {/if}

    <h3>Precipitación promedio y PN cosechada por mes (mm)</h3>
    <GraficoMensual brutaMm={lluvia.mensualMm} netaMm={oferta.pnMensualMm} captados={oferta.mesesCaptados} umbralMm={oferta.umbralMm || null} />
    <p class="leyenda-grafico">
      <span class="item"><span class="muestra bruta"></span> Precipitación promedio</span>
      <span class="item"><span class="muestra neta"></span> PN a cosechar</span>
      {#if oferta.umbralMm > 0}
        <span class="item"><span class="muestra gris"></span> PN de un mes que no se capta</span>
        <span class="item"><span class="linea-umbral"></span> {n0(oferta.umbralMm)} mm de PN: inicio de captación</span>
      {/if}
    </p>
  {/if}
</section>

<style>
  .cascada { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
  .cascada td { padding: 0.45rem 0.25rem; border-bottom: 1px solid var(--borde); vertical-align: top; }
  .cascada td:last-child { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .cascada .total td { font-weight: 700; border-bottom: 2px solid var(--texto); }
  h3 { font-size: 1rem; margin: 1.25rem 0 0.25rem; }
  .leyenda-grafico { display: flex; gap: 0.5rem 1rem; flex-wrap: wrap; align-items: center; font-size: 0.85rem; color: var(--texto-suave); }
  .muestra { display: inline-block; width: 0.9rem; height: 0.9rem; border-radius: 2px; }
  .muestra.bruta { background: var(--acento-suave); border: 1px solid var(--acento); }
  .muestra.neta { background: var(--acento); }
  .muestra.gris { background: var(--texto-suave); opacity: 0.45; }
  .item { display: inline-flex; align-items: center; gap: 0.3rem; }
  .linea-umbral { display: inline-block; width: 1.5rem; border-top: 2px dashed #c4320a; }
</style>
