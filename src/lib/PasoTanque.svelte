<script lang="ts">
  import { MESES, MESES_LARGOS, type ResumenLluvia } from '../core/lluvia';
  import type { ResumenOferta } from '../core/oferta';
  import type { ResumenDemanda } from '../core/demanda';
  import {
    FUENTE_TANQUES,
    TANQUES_POLIETILENO,
    barrilesEquivalentes,
    llenadosDelTanque,
    simularTanque,
    sugerirCisterna,
    tanqueComercial,
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
    demanda,
    areaTechoM2,
    origenArea,
    datos = $bindable(null),
    volumenElegido = $bindable(null),
  }: {
    lluvia: ResumenLluvia | null;
    oferta: ResumenOferta | null;
    demanda: ResumenDemanda;
    areaTechoM2: number | null;
    origenArea: 'existente' | 'necesaria';
    datos?: DatosTanqueInforme | null;
    /** Volumen que el diseñador decide usar (m³); vacío = el del periodo crítico. */
    volumenElegido?: number | null;
  } = $props();

  let capacidadElegida = $state<number | 'auto'>('auto');
  let altoUtil = $state(1.5);
  let largoPropio: number | null = $state(null);
  let anchoPropio: number | null = $state(null);

  /** Agua captada cada mes (m³) = PN del mes × área de techo ÷ 1000. */
  const ofertaM3 = $derived(oferta && areaTechoM2 ? oferta.netaMensualMm.map((mm) => (mm * areaTechoM2) / 1000) : []);
  const listo = $derived(ofertaM3.length === 12 && demanda.m3Critico > 0);
  const vCritico = $derived(demanda.m3Critico);
  const vUsado = $derived(Number(volumenElegido) > 0 ? Number(volumenElegido) : vCritico);
  const barriles = $derived(barrilesEquivalentes(vUsado));

  const comercial = $derived(tanqueComercial(vUsado));
  const tanque = $derived(
    capacidadElegida === 'auto' ? comercial.tanque : (TANQUES_POLIETILENO.find((t) => t.capacidadL === capacidadElegida) ?? comercial.tanque),
  );
  const cantidad = $derived(capacidadElegida === 'auto' ? comercial.cantidad : tanquesNecesarios(vUsado, tanque.capacidadL));
  /** Capacidad instalada (m³): la que se llena con la lluvia. */
  const capacidadM3 = $derived((cantidad * tanque.capacidadL) / 1000);

  const captadoAnual = $derived(ofertaM3.reduce((t, x) => t + x, 0));
  const llenados = $derived(listo && oferta ? llenadosDelTanque(ofertaM3, capacidadM3, oferta.mesesCaptados) : null);
  // Balance del año con el tanque instalado y el consumo mensual promedio (demanda anual ÷ 12)
  const balance = $derived(listo ? simularTanque(ofertaM3, Array(12).fill(demanda.m3Anual / 12), capacidadM3) : []);
  const mesesDeReserva = $derived(demanda.m3Mensual > 0 ? capacidadM3 / demanda.m3Mensual : 0);

  const sugerida = $derived(listo ? sugerirCisterna(vUsado, Number(altoUtil) || 1.5) : null);
  const cisterna = $derived.by(() => {
    if (!sugerida) return null;
    const l = Number(largoPropio) || sugerida.largoM;
    const a = Number(anchoPropio) || sugerida.anchoM;
    const h = Number(altoUtil) || sugerida.altoUtilM;
    return { largoM: l, anchoM: a, altoUtilM: h, bordeLibreM: 0.3, volumenM3: volumenCisternaM3(l, a, h) };
  });

  const maxNivel = $derived(Math.max(capacidadM3, ...balance.map((m) => m.nivelM3), 0.001));
  let anchoContenedor = $state(600);
  // Si el contenedor está oculto (otra pantalla o al imprimir) mide 0: se usa el ancho de impresión
  const anchoGrafico = $derived(anchoContenedor >= 300 ? Math.min(anchoContenedor, 680) : 680);
  const G = { izq: 44, der: 10, arriba: 14, abajo: 34, alto: 200 };
  const paso = $derived((anchoGrafico - G.izq - G.der) / 12);
  const yDe = (v: number) => G.arriba + (1 - v / maxNivel) * (G.alto - G.arriba - G.abajo);
  const maxLlenado = $derived(Math.max(1, ...(llenados?.porMes ?? [1])));

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const n2 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lt = (l: number) => `${l.toLocaleString('es-GT')} L`;

  $effect(() => {
    if (!listo || !cisterna || !areaTechoM2 || !llenados) {
      datos = null;
      return;
    }
    const llenos = llenados.porMes.map((n, i) => ({ i, n })).filter((x) => x.n >= 1);
    datos = {
      volumenM3: vUsado,
      volumenNecesarioM3: vCritico,
      barriles,
      criterio: captadoAnual + 1e-9 >= demanda.m3Anual ? 'cubre' : 'parcial',
      cobertura: demanda.m3Anual > 0 ? Math.min(1, captadoAnual / demanda.m3Anual) : 0,
      areaTechoM2,
      origenArea,
      tanque: `${cantidad} tanque${cantidad === 1 ? '' : 's'} de ${lt(tanque.capacidadL)}`,
      cisterna: `${n2(cisterna.largoM)} × ${n2(cisterna.anchoM)} m, alto útil ${n2(cisterna.altoUtilM)} m (+ ${n2(cisterna.bordeLibreM)} m de borde libre) = ${n1(cisterna.volumenM3)} m³`,
      mesesLlenos: llenos.map((x) => `${MESES_LARGOS[x.i].toLowerCase()} ${n1(x.n)}`).join(', '),
      diasCriticos: demanda.diasCriticos,
      llenadosAnual: llenados.anual,
      capacidadTanqueL: cantidad * tanque.capacidadL,
    };
  });
</script>

<section class="tarjeta paso salto-impresion">
  <p class="numero-paso">Paso 7 de 8</p>
  <h2>Tanque de almacenamiento</h2>

  {#if !lluvia || !oferta}
    <p class="nota">Completa los pasos 1 a 3 para calcular el tanque.</p>
  {:else if demanda.m3Critico <= 0}
    <p class="nota">Indica los usuarios, los litros por día y los días a garantizar en el paso 4.</p>
  {:else if !listo || !areaTechoM2 || !llenados}
    <p class="nota">No hay lluvia neta aprovechable para calcular el tanque.</p>
  {:else}
<div class="bloque">
    <div class="destacado">
      <span class="cifra">{n1(vCritico)} m³</span>
      <span>
        de almacenamiento ({n0(vCritico * 1000)} L) para garantizar <strong>{n0(demanda.diasCriticos)} días</strong> de consumo
        en los meses más secos del año: {n0(demanda.usuarios)} usuarios × {n1(demanda.litrosPorUsuarioDia)} L ×
        {n0(demanda.diasCriticos)} días ÷ 1000 (= Dj {n2(demanda.m3Mensual)} m³/mes × {n2(demanda.mesesCriticos)} meses).
      </span>
    </div>
    {#if !llenados.alcanzaParaLlenar}
      <p class="alerta">
        Con {n1(areaTechoM2)} m² de techo se captan {n1(llenados.captadoTemporadaM3)} m³ en la temporada de lluvia: no
        alcanza para llenar un tanque de {n1(capacidadM3)} m³. Hace falta más techo (paso 5) o garantizar menos días.
      </p>
    {/if}

    <h3>Volumen adoptado para el tanque</h3>
    <div class="campos no-imprimir">
      <label>Volumen del tanque (m³)
        <input type="number" min="0.5" step="0.5" placeholder={n1(vCritico)} bind:value={volumenElegido} />
      </label>
    </div>
    <div class="destacado">
      <span class="cifra">{n1(vUsado)} m³</span>
      <span>
        = {n0(vUsado * 1000)} litros = <strong>{n1(barriles)} barriles</strong> de 55 galones (208 L).
        {#if Number(volumenElegido) > 0}
          Calculado para el periodo crítico: {n1(vCritico)} m³.
        {:else}
          Es el volumen del periodo crítico; puedes escribir otro (por ejemplo, 10 m³).
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
          <option value="auto">Sugerida ({comercial.cantidad > 1 ? `${comercial.cantidad} × ` : ''}{lt(comercial.tanque.capacidadL)})</option>
          {#each TANQUES_POLIETILENO as t (t.capacidadL)}
            <option value={t.capacidadL}>{lt(t.capacidadL)}</option>
          {/each}
        </select>
      </label>
    </div>
    <p>
      {#if cantidad === 1}
        Tanque comercial sugerido: <strong>1 tanque de {lt(tanque.capacidadL)}</strong> ({n1(capacidadM3)} m³), que guarda los
        {n1(vUsado)} m³ necesarios.
      {:else}
        Se necesitan <strong>{cantidad} tanques de {lt(tanque.capacidadL)}</strong> ({n1(capacidadM3)} m³ en total).
      {/if}
      Con el tanque lleno hay agua para {n1(mesesDeReserva)} meses de consumo (Dj = {n2(demanda.m3Mensual)} m³/mes).
    </p>
    <DibujoTinaco capacidadL={tanque.capacidadL} diametroM={tanque.diametroM} alturaM={tanque.alturaM} {cantidad} />
    {#if !tanque.diametroM}
      <p class="nota informe">Las medidas de los tanques de {lt(tanque.capacidadL)} varían por fabricante: confírmalas con el proveedor.</p>
    {/if}
</div>

<div class="bloque">
    <h3>¿Cuántas veces se llena el tanque con la lluvia de cada mes?</h3>
    <div class="tabla-desplazable">
      <table class="rejilla llenados">
        <thead>
          <tr>
            <th>Mes</th>
            <th>Lluvia P (mm)</th>
            <th>PN (mm)</th>
            <th>Agua captada (m³)</th>
            <th>Llenados del tanque de {n1(capacidadM3)} m³</th>
          </tr>
        </thead>
        <tbody>
          {#each ofertaM3 as q, i (i)}
            {@const n = llenados.porMes[i]}
            <tr class:seco={!oferta.mesesCaptados[i]}>
              <td>{MESES_LARGOS[i]}</td>
              <td>{n0(lluvia.mensualMm[i])}</td>
              <td>{n0(oferta.netaMensualMm[i])}</td>
              <td>{n1(q)}</td>
              <td class="celda-llenado">
                <span class="barrita" style="width: {Math.min(100, (n / maxLlenado) * 100)}%" class:lleno={n >= 1}></span>
                <span class="valor">{oferta.mesesCaptados[i] ? (n >= 1 ? `${n1(n)} veces` : `${Math.round(n * 100)} %`) : 'época seca'}</span>
              </td>
            </tr>
          {/each}
          <tr class="total">
            <td>Año</td>
            <td>{n0(lluvia.anualMm)}</td>
            <td>{n0(oferta.netaAnualMm)}</td>
            <td>{n1(captadoAnual)}</td>
            <td><strong>{n1(llenados.anual)} veces</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="nota informe explicacion">
      <strong>Lectura de la tabla.</strong> El número de llenados del mes es N<sub>j</sub> = V<sub>c,j</sub> ÷ V<sub>t</sub>,
      donde V<sub>c,j</sub> = PN<sub>j</sub> × A ÷ 1000 es el volumen captado en el mes j con {n1(areaTechoM2)} m² de techo y
      V<sub>t</sub> = {n1(capacidadM3)} m³ la capacidad instalada. N<sub>j</sub> ≥ 1 indica que la lluvia del mes llena el
      tanque al menos una vez: el excedente puede consumirse en el mismo mes o se pierde por rebose; un porcentaje indica
      llenado parcial. La suma anual, N = {n1(llenados.anual)}, expresa el agua captable del año ({n1(captadoAnual)} m³) en
      tanques llenos. Operación recomendada: usar el agua durante la temporada de lluvia y asegurar que el tanque quede
      lleno al terminar {llenados.ultimoMesCaptacion !== null ? MESES_LARGOS[llenados.ultimoMesCaptacion].toLowerCase() : 'la temporada'},
      para cubrir los {n0(demanda.diasCriticos)} días críticos de la época seca.
    </p>
</div>

<div class="bloque">
    <h3>Agua en el tanque al final de cada mes</h3>
    <div class="grafico" bind:clientWidth={anchoContenedor}>
      <svg viewBox="0 0 {anchoGrafico} {G.alto}" width={anchoGrafico} height={G.alto} role="img"
        aria-label="Agua guardada en el tanque al final de cada mes">
        {#each [0, 0.5, 1] as f (f)}
          <line x1={G.izq} x2={anchoGrafico - G.der} y1={yDe(maxNivel * f)} y2={yDe(maxNivel * f)} class="rejilla-g" />
          <text x={G.izq - 6} y={yDe(maxNivel * f) + 4} text-anchor="end" class="eje">{n1(maxNivel * f)}</text>
        {/each}
        <text x="4" y="10" class="eje">m³</text>
        {#each balance as m, i (i)}
          {@const x = G.izq + i * paso}
          <rect x={x + paso * 0.15} y={yDe(m.nivelM3)} width={paso * 0.7} height={Math.max(0, yDe(0) - yDe(m.nivelM3))}
            class="barra" class:vacia={m.faltanteM3 > 0} />
          <text x={x + paso / 2} y={G.alto - G.abajo + 16} text-anchor="middle" class="eje">{MESES[i].slice(0, anchoGrafico < 480 ? 1 : 3)}</text>
        {/each}
        <line x1={G.izq} x2={anchoGrafico - G.der} y1={yDe(capacidadM3)} y2={yDe(capacidadM3)} class="capacidad" />
      </svg>
    </div>
    <p class="leyenda-tanque">
      <span><span class="cuadro azul"></span> agua guardada</span>
      <span><span class="cuadro rojo"></span> mes en que el tanque se vacía</span>
      <span><span class="linea"></span> capacidad del tanque ({n1(capacidadM3)} m³)</span>
    </p>
    <p class="nota informe">
      Simulación con el consumo promedio de {n2(demanda.m3Anual / 12)} m³ al mes (demanda anual ÷ 12): el tanque se llena
      en la temporada de lluvia y se vacía durante la época seca.
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
        Volumen de almacenamiento = usuarios × dotación × días críticos ÷ 1000, es decir, la demanda mensual Dj
        (usuarios × dotación × 30.4 días ÷ 1000) por los meses críticos que se quieren garantizar en la época seca.
        Tanque comercial: el más pequeño que guarda ese volumen en una sola unidad. Agua captada por mes = PN × área de
        techo ÷ 1000. Medidas de tanques: {FUENTE_TANQUES}
      </p>
    </details>
  {/if}
</section>

<style>
  h3 { margin-top: 1.25rem; }
  .llenados td, .llenados th { text-align: right; }
  .llenados td:first-child, .llenados th:first-child { text-align: left; }
  .llenados tr.seco td { color: var(--texto-suave); }
  .llenados tr.total td { font-weight: 700; border-top: 2px solid var(--texto); }
  .celda-llenado { position: relative; min-width: 9rem; }
  .barrita { position: absolute; left: 0; top: 15%; height: 70%; background: #b9dcf5; z-index: 0; }
  .barrita.lleno { background: #7fbbe8; }
  .celda-llenado .valor { position: relative; z-index: 1; font-variant-numeric: tabular-nums; }
  .explicacion { text-align: justify; }
  .grafico { width: 100%; min-width: 0; }
  .grafico svg { display: block; }
  .rejilla-g { stroke: var(--borde); }
  .eje { font-size: 13px; fill: var(--texto-suave); }
  .barra { fill: #0b63b6; }
  .barra.vacia { fill: #c4320a; }
  .capacidad { stroke: #0b2f52; stroke-dasharray: 6 4; stroke-width: 1.5; }
  .leyenda-tanque { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--texto-suave); }
  .cuadro { display: inline-block; width: 0.8rem; height: 0.8rem; vertical-align: middle; }
  .cuadro.azul { background: #0b63b6; }
  .cuadro.rojo { background: #c4320a; }
  .linea { display: inline-block; width: 1.4rem; border-top: 2px dashed #0b2f52; vertical-align: middle; }
  @media print { .grafico svg { max-width: 100%; height: auto; margin: 0 auto; } .barrita { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
