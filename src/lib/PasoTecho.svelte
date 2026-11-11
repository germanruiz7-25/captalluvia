<script lang="ts">
  import { COEFICIENTES_ESCORRENTIA, NOMBRES_TECHO, type NumeroAguas, type TipoTecho } from '../core/techo';
  import type { ResumenOferta } from '../core/oferta';
  import GraficoMensual from './GraficoMensual.svelte';
  import { MESES, MESES_LARGOS, type ResumenLluvia } from '../core/lluvia';

  let {
    lluvia,
    oferta,
    tipoTecho = $bindable(),
    aguas = $bindable(),
    anchoTecho = $bindable(),
    largoTecho = $bindable(),
    areaDisponible = null,
    umbralMm = $bindable(),
  }: {
    lluvia: ResumenLluvia | null;
    oferta: ResumenOferta | null;
    tipoTecho: TipoTecho;
    aguas: NumeroAguas;
    anchoTecho: number | null;
    largoTecho: number | null;
    areaDisponible?: number | null;
    umbralMm: number;
  } = $props();

  /** Meses de las primeras lluvias (primer descarte por temporada), p. ej. "Ene–Abr". */
  const mesesLavadoTexto = $derived.by(() => {
    const m = oferta?.mesesLavado ?? [];
    if (!m.length) return '';
    return m.length === 1 ? MESES[m[0]] : `${MESES[m[0]]}–${MESES[m[m.length - 1]]}`;
  });
  /** Otros meses sin captar (fin de temporada, canícula). */
  const otrosSecos = $derived(
    lluvia && oferta
      ? oferta.mesesCaptados.flatMap((c, i) => (!c && !oferta.mesesLavado.includes(i) && lluvia.mensualMm[i] > 0 ? [MESES[i]] : []))
      : [],
  );

  const tipos = Object.keys(COEFICIENTES_ESCORRENTIA) as TipoTecho[];
  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
</script>

<section class="tarjeta paso salto-impresion">
  <p class="numero-paso">Paso 3 de 8</p>
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
    <label>Captar desde (mm de PN al mes)
      <input type="number" min="0" max="300" step="5" bind:value={umbralMm} />
    </label>
  </div>

  <fieldset class="existente no-imprimir">
    <legend>¿Ya hay un techo? Escribe sus medidas (opcional)</legend>
    <div class="medidas">
      <label>Ancho (m)
        <input type="number" min="0" step="0.1" placeholder="Ej. 6" bind:value={anchoTecho} />
      </label>
      <span class="por" aria-hidden="true">×</span>
      <label>Largo (m)
        <input type="number" min="0" step="0.1" placeholder="Ej. 10" bind:value={largoTecho} />
      </label>
      <span class="por" aria-hidden="true">=</span>
      <output class="area-resultado" aria-live="polite">{areaDisponible ? `${n1(areaDisponible)} m²` : '— m²'}</output>
    </div>
    <p class="nota">
      Mide el techo en planta (visto desde arriba), sin contar la inclinación. Si es de dos aguas, el largo es el
      lado donde van las canaletas. Si no hay techo todavía, deja esto vacío: la app sugiere los m² que hacen falta.
    </p>
  </fieldset>

  <p class="solo-impresion">
    Techo de {NOMBRES_TECHO[tipoTecho].toLowerCase()} (Ce {COEFICIENTES_ESCORRENTIA[tipoTecho]}),
    {aguas === 2 ? 'dos aguas' : 'un agua'}, captación en meses con {n0(umbralMm)} mm o más de precipitación neta{#if oferta?.mesesLavado.length}; primer descarte con las primeras lluvias de la temporada ({mesesLavadoTexto}){/if}{#if areaDisponible}, techo existente de {n1(Number(anchoTecho))} × {n1(Number(largoTecho))} m = {n1(areaDisponible)} m²{/if}.
  </p>

  {#if !lluvia || !oferta}
    <p class="nota">Completa el paso 1 para ver la lluvia neta.</p>
  {:else}
<div class="bloque">
    <div class="destacado">
      <span class="cifra">{n0(oferta.netaAnualMm)} L</span>
      <span>
        netos al año por cada m² de techo: {Math.round(oferta.eficiencia * 100)} % de la lluvia que cae
        ({n0(oferta.brutaAnualMm)} mm).
      </span>
    </div>
    <table class="cascada">
      <tbody>
        <tr><td>Lluvia que cae al año</td><td>{n0(oferta.brutaAnualMm)} mm</td></tr>
        {#if oferta.mesesLavado.length}
          <tr><td>− Primer descarte: primeras lluvias de la temporada ({mesesLavadoTexto}), lavan techo, canaletas y tanque</td><td>−{n0(oferta.lavadoMm)} mm</td></tr>
        {/if}
        {#if oferta.perdidaMesesSecosMm - oferta.lavadoMm > 0.5}
          <tr><td>− {oferta.mesesLavado.length ? 'Otros meses' : 'Meses'} con PN menor a {n0(oferta.umbralMm)} mm, no se captan{otrosSecos.length ? ` (${otrosSecos.join(', ')})` : ''}</td><td>−{n0(oferta.perdidaMesesSecosMm - oferta.lavadoMm)} mm</td></tr>
        {/if}
        <tr><td>− Pérdida por el material del techo (Ce {COEFICIENTES_ESCORRENTIA[tipoTecho]}, {NOMBRES_TECHO[tipoTecho].toLowerCase()})</td><td>−{n0(oferta.perdidaEscorrentiaMm)} mm</td></tr>
        <tr class="total"><td>Lluvia neta aprovechable</td><td>{n0(oferta.netaAnualMm)} mm</td></tr>
      </tbody>
    </table>
    <p class="nota informe">
      {#if oferta.mesesLavado.length}
        Primer descarte por temporada: la captación empieza en
        {oferta.inicioCaptacion !== null ? MESES_LARGOS[oferta.inicioCaptacion].toLowerCase() : 'la temporada de lluvia'}, el primer mes con
        {n0(oferta.umbralMm)} mm o más de precipitación neta. Las lluvias de los meses anteriores ({mesesLavadoTexto},
        {n0(oferta.lavadoMm)} mm) se dejan correr para lavar el techo, las canaletas y el tanque, y no se captan.
      {:else}
        Todos los meses superan {n0(oferta.umbralMm)} mm de precipitación neta: para lavar el sistema, deja correr la
        primera lluvia después de cada periodo sin lluvia antes de conectar la bajante al tanque.
      {/if}
    </p>
</div>

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

    <!-- La misma gráfica ya sale en el paso 2 del informe: aquí no se imprime. -->
    <details class="detalle no-imprimir">
    <summary>Ver la gráfica mes a mes</summary>
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
    </details>
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
  .existente { border: 1px solid var(--borde); border-radius: 0.75rem; padding: 0.5rem 1rem 0.25rem; margin: 1rem 0; background: var(--fondo); }
  .existente legend { font-weight: 600; padding: 0 0.3rem; }
  .medidas { display: flex; align-items: flex-end; gap: 0.5rem; flex-wrap: wrap; }
  .medidas label { flex: 1 1 6rem; max-width: 9rem; }
  .por { font-size: 1.3rem; padding-bottom: 0.45rem; color: var(--texto-suave); }
  .area-resultado { font-size: 1.5rem; font-weight: 700; color: var(--acento); padding-bottom: 0.2rem; white-space: nowrap; }
</style>
