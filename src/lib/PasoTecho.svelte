<script lang="ts">
  import { COEFICIENTES_ESCORRENTIA, NOMBRES_TECHO, type ModuloMedido, type ModuloTecho, type NumeroAguas, type TipoTecho } from '../core/techo';
  import type { ResumenOferta } from '../core/oferta';
  import GraficoMensual from './GraficoMensual.svelte';
  import { MESES, MESES_LARGOS, type ResumenLluvia } from '../core/lluvia';

  let {
    lluvia,
    oferta,
    tipoTecho = $bindable(),
    aguas = $bindable(),
    modulos = $bindable(),
    modulosExistentes = [],
    areaDisponible = null,
    umbralMm = $bindable(),
  }: {
    lluvia: ResumenLluvia | null;
    oferta: ResumenOferta | null;
    tipoTecho: TipoTecho;
    aguas: NumeroAguas;
    modulos: ModuloTecho[];
    modulosExistentes?: ModuloMedido[];
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

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
  const areaModulo = (m: ModuloTecho) => (Number(m.ancho) > 0 && Number(m.largo) > 0 ? Number(m.ancho) * Number(m.largo) : null);
  function agregarModulo() {
    modulos.push({ ancho: null, largo: null });
  }
  function quitarModulo(i: number) {
    if (modulos.length > 1) modulos.splice(i, 1);
    else modulos[0] = { ancho: null, largo: null };
  }
  const textoModulos = $derived(
    modulosExistentes.length > 1
      ? `${modulosExistentes.length} módulos (${modulosExistentes.map((m) => `${n1(m.ancho)} × ${n1(m.largo)} m`).join(' + ')}) = ${n1(areaDisponible ?? 0)} m²`
      : modulosExistentes.length === 1
        ? `${n1(modulosExistentes[0].ancho)} × ${n1(modulosExistentes[0].largo)} m = ${n1(modulosExistentes[0].area)} m²`
        : '',
  );

  const tipos = Object.keys(COEFICIENTES_ESCORRENTIA) as TipoTecho[];
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
    {#each modulos as m, i (i)}
      {@const a = areaModulo(m)}
      <div class="medidas">
        {#if modulos.length > 1}<span class="nombre-modulo">Módulo {i + 1}</span>{/if}
        <label>Ancho (m)
          <input type="number" min="0" step="0.1" placeholder="Ej. 6" bind:value={m.ancho} />
        </label>
        <span class="por" aria-hidden="true">×</span>
        <label>Largo (m)
          <input type="number" min="0" step="0.1" placeholder="Ej. 10" bind:value={m.largo} />
        </label>
        <span class="por" aria-hidden="true">=</span>
        <output class="area-resultado" class:chica={modulos.length > 1} aria-live="polite">{a ? `${n1(a)} m²` : '— m²'}</output>
        {#if modulos.length > 1 || m.ancho || m.largo}
          <button type="button" class="quitar" onclick={() => quitarModulo(i)} aria-label="Quitar el módulo {i + 1}" title="Quitar">✕</button>
        {/if}
      </div>
    {/each}
    <div class="acciones-modulos">
      <button type="button" class="secundario" onclick={agregarModulo}>➕ Agregar otro módulo de techo</button>
      {#if modulos.length > 1}
        <span class="total-modulos">Techo disponible: <strong>{areaDisponible ? `${n1(areaDisponible)} m²` : '— m²'}</strong>
          {#if modulosExistentes.length}({modulosExistentes.length} módulo{modulosExistentes.length === 1 ? '' : 's'}){/if}</span>
      {/if}
    </div>
    <p class="nota">
      Mide cada techo en planta (visto desde arriba), sin contar la inclinación. Si es de dos aguas, el largo es el
      lado donde van las canaletas. Si el agua se capta de varios techos (módulos) que llegan al mismo tanque, agrega
      uno por uno: la app suma los m². Si no hay techo todavía, deja esto vacío: la app sugiere los m² ideales.
    </p>
  </fieldset>

  <p class="solo-impresion">
    Techo de {NOMBRES_TECHO[tipoTecho].toLowerCase()} (Ce {COEFICIENTES_ESCORRENTIA[tipoTecho]}, coeficiente de captación Ce × 0.85),
    {aguas === 2 ? 'dos aguas' : 'un agua'}, captación en la temporada de lluvia{#if oferta?.mesesLavado.length}; en la época seca ({mesesLavadoTexto}, menos de {n0(umbralMm)} mm de precipitación neta al mes) no se capta y sus lluvias lavan el sistema{/if}{#if areaDisponible}, techo existente de {textoModulos}{/if}.
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
          <tr><td>− Época seca ({mesesLavadoTexto}): no se capta; sus lluvias lavan techo, canaletas y tanque (primer descarte)</td><td>−{n0(oferta.lavadoMm)} mm</td></tr>
        {/if}
        {#if oferta.perdidaMesesSecosMm - oferta.lavadoMm > 0.5}
          <tr><td>− {oferta.mesesLavado.length ? 'Otros meses' : 'Meses'} con PN menor a {n0(oferta.umbralMm)} mm, no se captan{otrosSecos.length ? ` (${otrosSecos.join(', ')})` : ''}</td><td>−{n0(oferta.perdidaMesesSecosMm - oferta.lavadoMm)} mm</td></tr>
        {/if}
        <tr><td>− Pérdida por el material del techo (Ce {oferta.ce}, {NOMBRES_TECHO[tipoTecho].toLowerCase()})</td><td>−{n0(oferta.perdidaEscorrentiaMm)} mm</td></tr>
        <tr><td>− Pérdida en la conducción: salpicadura, rebalse y fugas (eficiencia de captación Efc {Math.round(oferta.efc * 100)} %)</td><td>−{n0(oferta.perdidaEficienciaMm)} mm</td></tr>
        <tr class="total"><td>Lluvia neta aprovechable</td><td>{n0(oferta.netaAnualMm)} mm</td></tr>
      </tbody>
    </table>
    <p class="nota informe formula">
      Precipitación neta de cada mes: <strong>PN = P × Cc</strong>, con el coeficiente de captación
      <strong>Cc = Ce × Efc = {oferta.ce} × {oferta.efc} = {oferta.cc.toLocaleString('es-GT', { maximumFractionDigits: 3 })}</strong>.
      Ce es el coeficiente de escorrentía del material del techo (de 0 a 0.9 según su rugosidad y absorción) y Efc la
      eficiencia de captación de lluvia (85 %).
    </p>
    <p class="nota informe">
      {#if oferta.mesesLavado.length}
        Se capta de {oferta.inicioCaptacion !== null ? MESES_LARGOS[oferta.inicioCaptacion].toLowerCase() : ''} a
        {MESES_LARGOS[(oferta.mesesLavado[0] + 11) % 12].toLowerCase()} (temporada de lluvia), incluidos los meses de
        la temporada que bajen de {n0(oferta.umbralMm)} mm, como la canícula. En la época seca ({mesesLavadoTexto},
        meses seguidos con menos de {n0(oferta.umbralMm)} mm de precipitación neta) no se capta: esas lluvias,
        {n0(oferta.lavadoMm)} mm, se dejan correr para lavar el techo, las canaletas y el tanque (primer descarte).
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
          netos al año con el techo existente de {n1(oferta.areaM2 ?? 0)} m²{modulosExistentes.length > 1 ? ` (${modulosExistentes.length} módulos)` : ''}
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
  .area-resultado.chica { font-size: 1.15rem; }
  .nombre-modulo { flex: 0 0 100%; font-weight: 600; font-size: 0.9rem; color: var(--texto-suave); margin-top: 0.4rem; }
  .quitar { background: none; border: 1px solid var(--borde); border-radius: 50%; width: 2rem; height: 2rem; padding: 0; color: var(--texto-suave); cursor: pointer; margin-bottom: 0.3rem; }
  .quitar:hover { color: #b42318; border-color: #b42318; }
  .acciones-modulos { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; margin: 0.75rem 0 0.25rem; }
  .total-modulos { font-size: 1rem; }
  .total-modulos strong { color: var(--acento); font-size: 1.2rem; }
  .area-resultado { font-size: 1.5rem; font-weight: 700; color: var(--acento); padding-bottom: 0.2rem; white-space: nowrap; }
</style>
