<script lang="ts">
  import { MESES, MESES_LARGOS, type ResumenLluvia } from '../core/lluvia';
  import type { ResumenOferta } from '../core/oferta';
  import {
    FUENTE_TANQUES,
    TANQUES_POLIETILENO,
    barrilesEquivalentes,
    calcularTanque,
    sugerirCisterna,
    tanqueSugerido,
    tanquesNecesarios,
    volumenCisternaM3,
  } from '../core/tanque';
  import DibujoTinaco from './DibujoTinaco.svelte';
  import DibujoCisterna from './DibujoCisterna.svelte';
  import DibujoBarriles from './DibujoBarriles.svelte';
  import type { DatosTanqueInforme } from '../core/informe';


  let {
    lluvia,
    oferta,
    demandaAnualM3,
    areaTechoM2,
    origenArea,
    datos = $bindable(null),
    volumenElegido = $bindable(null),
  }: {
    lluvia: ResumenLluvia | null;
    oferta: ResumenOferta | null;
    demandaAnualM3: number;
    areaTechoM2: number | null;
    origenArea: 'existente' | 'necesaria';
    datos?: DatosTanqueInforme | null;
    /** Volumen que el diseñador decide usar (m³); vacío = el calculado. */
    volumenElegido?: number | null;
  } = $props();

  let capacidadElegida = $state<number | 'auto'>('auto');
  let altoUtil = $state(1.5);
  let largoPropio: number | null = $state(null);
  let anchoPropio: number | null = $state(null);

  const ofertaM3 = $derived(
    oferta && areaTechoM2 ? oferta.netaMensualMm.map((mm) => (mm * areaTechoM2) / 1000) : [],
  );
  const demandaM3 = $derived(Array(12).fill(demandaAnualM3 / 12) as number[]);
  const base = $derived(ofertaM3.length === 12 && demandaAnualM3 > 0 ? calcularTanque(ofertaM3, demandaM3) : null);
  const vUsado = $derived(base ? (Number(volumenElegido) > 0 ? Number(volumenElegido) : base.volumenM3) : 0);
  const r = $derived(base ? calcularTanque(ofertaM3, demandaM3, vUsado) : null);
  const barriles = $derived(barrilesEquivalentes(vUsado));

  const tanque = $derived(
    r
      ? capacidadElegida === 'auto'
        ? tanqueSugerido(vUsado)
        : (TANQUES_POLIETILENO.find((t) => t.capacidadL === capacidadElegida) ?? tanqueSugerido(vUsado))
      : null,
  );
  const cantidad = $derived(r && tanque ? tanquesNecesarios(vUsado, tanque.capacidadL) : 0);

  const sugerida = $derived(r ? sugerirCisterna(vUsado, Number(altoUtil) || 1.5) : null);
  const cisterna = $derived.by(() => {
    if (!sugerida) return null;
    const l = Number(largoPropio) || sugerida.largoM;
    const a = Number(anchoPropio) || sugerida.anchoM;
    const h = Number(altoUtil) || sugerida.altoUtilM;
    return { largoM: l, anchoM: a, altoUtilM: h, bordeLibreM: 0.3, volumenM3: volumenCisternaM3(l, a, h) };
  });

  const maxNivel = $derived(r ? Math.max(vUsado, ...r.meses.map((m) => m.nivelM3), 0.001) : 1);
  let anchoContenedor = $state(600);
  // Ancho máximo del dibujo: así las letras no se achican al imprimir
  // Si el contenedor está oculto (otra pantalla o al imprimir) mide 0: se usa el ancho de impresión
  const anchoGrafico = $derived(anchoContenedor >= 300 ? Math.min(anchoContenedor, 680) : 680);
  const G = { izq: 44, der: 10, arriba: 14, abajo: 34, alto: 200 };
  const paso = $derived((anchoGrafico - G.izq - G.der) / 12);
  const yDe = (v: number) => G.arriba + (1 - v / maxNivel) * (G.alto - G.arriba - G.abajo);

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const n2 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  $effect(() => {
    if (!r || !tanque || !cisterna || !areaTechoM2) {
      datos = null;
      return;
    }
    const llenos = ofertaM3.map((q, i) => ({ i, n: (q * 1000) / tanque.capacidadL })).filter((x) => x.n >= 1);
    datos = {
      volumenM3: vUsado,
      volumenNecesarioM3: r.volumenM3,
      barriles,
      criterio: r.criterio,
      cobertura: r.cobertura,
      areaTechoM2,
      origenArea,
      tanque: `${cantidad} tanque${cantidad === 1 ? '' : 's'} de ${tanque.capacidadL.toLocaleString('es-GT')} L`,
      cisterna: `${n2(cisterna.largoM)} × ${n2(cisterna.anchoM)} m, alto útil ${n2(cisterna.altoUtilM)} m (+ ${n2(cisterna.bordeLibreM)} m de borde libre) = ${n1(cisterna.volumenM3)} m³`,
      mesesLlenos: llenos.map((x) => `${MESES_LARGOS[x.i].toLowerCase()} ${n1(x.n)}`).join(', '),
    };
  });
</script>

<section class="tarjeta paso salto-impresion">
  <p class="numero-paso">Paso 7 de 8</p>
  <h2>Tanque de almacenamiento</h2>

  {#if !lluvia || !oferta}
    <p class="nota">Completa los pasos 1 a 3 para calcular el tanque.</p>
  {:else if demandaAnualM3 <= 0}
    <p class="nota">Indica los usuarios y los litros por día en el paso 4.</p>
  {:else if !r || !areaTechoM2}
    <p class="nota">No hay lluvia neta aprovechable para calcular el tanque.</p>
  {:else}
    <div class="destacado">
      <span class="cifra">{n1(r.volumenM3)} m³</span>
      <span>
        de almacenamiento calculado ({n0(r.volumenM3 * 1000)} litros) para
        {r.criterio === 'cubre'
          ? 'cubrir la demanda todo el año, guardando agua de la época de lluvias para la época seca'
          : 'guardar todo el excedente de la época de lluvias'}.
        Techo de {n1(areaTechoM2)} m² ({origenArea === 'existente' ? 'techo existente' : 'área mínima necesaria del paso 5'}),
        demanda de {n1(demandaAnualM3)} m³ al año ({n1(demandaAnualM3 / 12)} m³ al mes).
      </span>
    </div>
    {#if r.criterio === 'parcial'}
      <p class="alerta">
        El techo capta {n1(r.ofertaAnualM3)} m³ al año, menos que la demanda ({n1(r.demandaAnualM3)} m³): aun con el
        volumen calculado se cubre {Math.round((base?.cobertura ?? 0) * 100)} % del año. Para cubrirlo todo hace falta más techo (paso 5) o menos consumo.
      </p>
    {/if}

<div class="bloque">
    <h3>Volumen adoptado para el tanque</h3>
    <div class="campos no-imprimir">
      <label>Volumen del tanque (m³)
        <input type="number" min="0.5" step="0.5" placeholder={n1(r.volumenM3)} bind:value={volumenElegido} />
      </label>
    </div>
    <div class="destacado">
      <span class="cifra">{n1(vUsado)} m³</span>
      <span>
        = {n0(vUsado * 1000)} litros = <strong>{n1(barriles)} barriles</strong> de 55 galones (208 L).
        {#if Number(volumenElegido) > 0}
          Calculado por el balance: {n1(r.volumenM3)} m³.
          {#if r.cobertura < 0.999}Con este volumen se cubre {Math.round(r.cobertura * 100)} % de la demanda del año.{/if}
        {:else}
          Es el volumen calculado; puedes escribir otro (por ejemplo, 10 m³).
        {/if}
      </span>
    </div>
    <DibujoBarriles {barriles} volumenM3={vUsado} />
</div>

<div class="bloque">
    <h3>Opción 1: tanques de polietileno (tipo tinaco)</h3>
    <div class="campos no-imprimir">
      <label>Capacidad de cada tanque
        <select bind:value={capacidadElegida}>
          <option value="auto">Sugerida ({tanqueSugerido(vUsado).capacidadL.toLocaleString('es-GT')} L)</option>
          {#each TANQUES_POLIETILENO as t (t.capacidadL)}
            <option value={t.capacidadL}>{t.capacidadL.toLocaleString('es-GT')} L</option>
          {/each}
        </select>
      </label>
    </div>
    {#if tanque}
      <p>
        Se necesitan <strong>{cantidad} tanque{cantidad === 1 ? '' : 's'} de {tanque.capacidadL.toLocaleString('es-GT')} L</strong>
        ({n1((cantidad * tanque.capacidadL) / 1000)} m³ en total).
      </p>
      <DibujoTinaco capacidadL={tanque.capacidadL} diametroM={tanque.diametroM} alturaM={tanque.alturaM} {cantidad} />
      {#if !tanque.diametroM}
        <p class="nota informe">Las medidas de los tanques de {tanque.capacidadL.toLocaleString('es-GT')} L varían por fabricante: confírmalas con el proveedor.</p>
      {/if}
    {/if}

</div>
<div class="bloque">
    <h3>Lluvia captada mes a mes</h3>
    <p class="nota">
      Cuántos tanques de {tanque?.capacidadL.toLocaleString('es-GT')} L se llenarían cada mes con el agua captada, y cuánta
      agua queda guardada al final del mes usando el volumen calculado.
    </p>
    <div class="tabla-desplazable">
      <table class="tabla mensual-tanque">
        <thead>
          <tr>
            <th>Mes</th>
            <th class="extra">Lluvia (mm)</th>
            <th class="extra">PN (mm)</th>
            <th>Captado (m³)</th>
            <th>Tanques de {tanque?.capacidadL.toLocaleString('es-GT')} L</th>
            <th class="extra">Demanda (m³)</th>
            <th>En el tanque (m³)</th>
          </tr>
        </thead>
        <tbody>
          {#each r.meses as m, i (i)}
            <tr class:seco={!oferta.mesesCaptados[i]}>
              <td>{MESES_LARGOS[i]}</td>
              <td class="extra">{n0(lluvia.mensualMm[i])}</td>
              <td class="extra">{n0(oferta.netaMensualMm[i])}</td>
              <td>{n1(m.captadoM3)}</td>
              <td>{tanque ? n1((m.captadoM3 * 1000) / tanque.capacidadL) : '—'}</td>
              <td class="extra">{n1(m.demandaM3)}</td>
              <td>{n1(m.nivelM3)}</td>
            </tr>
          {/each}
          <tr class="total">
            <td>Año</td>
            <td class="extra">{n0(lluvia.anualMm)}</td>
            <td class="extra">{n0(oferta.netaAnualMm)}</td>
            <td>{n1(r.ofertaAnualM3)}</td>
            <td>{tanque ? n1((r.ofertaAnualM3 * 1000) / tanque.capacidadL) : '—'}</td>
            <td class="extra">{n1(r.demandaAnualM3)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

</div>
<div class="bloque">
    <h3>Agua en el tanque al final de cada mes</h3>
    <div class="grafico" bind:clientWidth={anchoContenedor}>
      <svg viewBox="0 0 {anchoGrafico} {G.alto}" width={anchoGrafico} height={G.alto} role="img"
        aria-label="Agua guardada en el tanque al final de cada mes">
        {#each [0, 0.5, 1] as f (f)}
          <line x1={G.izq} x2={anchoGrafico - G.der} y1={yDe(maxNivel * f)} y2={yDe(maxNivel * f)} class="rejilla" />
          <text x={G.izq - 6} y={yDe(maxNivel * f) + 4} text-anchor="end" class="eje">{n1(maxNivel * f)}</text>
        {/each}
        <text x="4" y="10" class="eje">m³</text>
        {#each r.meses as m, i (i)}
          {@const x = G.izq + i * paso}
          <rect x={x + paso * 0.15} y={yDe(m.nivelM3)} width={paso * 0.7} height={Math.max(0, yDe(0) - yDe(m.nivelM3))}
            class="barra" class:vacia={m.faltanteM3 > 0} />
          <text x={x + paso / 2} y={G.alto - G.abajo + 16} text-anchor="middle" class="eje">{MESES[i].slice(0, anchoGrafico < 480 ? 1 : 3)}</text>
        {/each}
        <line x1={G.izq} x2={anchoGrafico - G.der} y1={yDe(vUsado)} y2={yDe(vUsado)} class="capacidad" />
      </svg>
    </div>
    <p class="leyenda-tanque">
      <span><span class="cuadro azul"></span> agua guardada</span>
      <span><span class="linea"></span> capacidad del tanque ({n1(vUsado)} m³)</span>
    </p>
</div>

<div class="bloque">
    <h3>Opción 2: cisterna de block y cemento</h3>
    <div class="campos no-imprimir">
      <label>Alto útil del agua (m)
        <input type="number" min="0.5" max="4" step="0.1" bind:value={altoUtil} />
      </label>
      <label>Largo interior (m)
        <input type="number" min="0.5" step="0.1" placeholder={sugerida ? n1(sugerida.largoM) : ''} bind:value={largoPropio} />
      </label>
      <label>Ancho interior (m)
        <input type="number" min="0.5" step="0.1" placeholder={sugerida ? n1(sugerida.anchoM) : ''} bind:value={anchoPropio} />
      </label>
    </div>
    {#if cisterna}
      <p>
        Cisterna de <strong>{n2(cisterna.largoM)} × {n2(cisterna.anchoM)} m</strong> con
        <strong>{n2(cisterna.altoUtilM)} m</strong> de alto útil: <strong>{n1(cisterna.volumenM3)} m³</strong>
        ({n0(cisterna.volumenM3 * 1000)} L). Se agregan {n2(cisterna.bordeLibreM)} m de borde libre: alto interior total
        {n2(cisterna.altoUtilM + cisterna.bordeLibreM)} m.
        {#if cisterna.volumenM3 + 1e-9 < vUsado}
          <span class="alerta">Es menor que los {n1(vUsado)} m³ elegidos.</span>
        {/if}
      </p>
      <DibujoCisterna largoM={cisterna.largoM} anchoM={cisterna.anchoM} altoUtilM={cisterna.altoUtilM} bordeLibreM={cisterna.bordeLibreM} />
    {/if}
</div>

    <details class="detalle">
      <summary>Ver cómo se calculó el tanque</summary>
      <p class="nota informe">
        Agua captada por mes = PN del mes × área del techo. Demanda mensual = demanda anual ÷ 12. El volumen sale del
        método del pico secuente (diferencias acumuladas de Rippl): se acumula lo que falta mes a mes y el mayor
        faltante acumulado es el agua que hay que tener guardada al empezar la época seca. Se simulan dos años y se
        muestra el segundo, ya estable. Medidas de tanques: {FUENTE_TANQUES}
      </p>
    </details>
  {/if}
</section>

<style>
  h3 { margin-top: 1.25rem; }
  .mensual-tanque td, .mensual-tanque th { text-align: right; }
  .mensual-tanque td:first-child, .mensual-tanque th:first-child { text-align: left; }
  .mensual-tanque tr.seco td { color: var(--texto-suave); }
  .mensual-tanque tr.total td { font-weight: 700; border-top: 2px solid var(--texto); }
  .grafico { width: 100%; min-width: 0; }
  .grafico svg { display: block; }
  .rejilla { stroke: var(--borde); }
  .eje { font-size: 13px; fill: var(--texto-suave); }
  .barra { fill: #0b63b6; }
  .barra.vacia { fill: #c4320a; }
  .capacidad { stroke: #0b2f52; stroke-dasharray: 6 4; stroke-width: 1.5; }
  .leyenda-tanque { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--texto-suave); }
  .cuadro { display: inline-block; width: 0.8rem; height: 0.8rem; vertical-align: middle; }
  .cuadro.azul { background: #0b63b6; }
  .linea { display: inline-block; width: 1.4rem; border-top: 2px dashed #0b2f52; vertical-align: middle; }
  @media (max-width: 36rem) { .extra { display: none; } }
  @media print { .extra { display: table-cell !important; } .grafico svg { max-width: 100%; height: auto; margin: 0 auto; } }
</style>
