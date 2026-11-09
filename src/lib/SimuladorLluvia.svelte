<script lang="ts">
  import { limitesSimulacion, simularIntensidad, type EntradaSimulacion, type EstadoCanal } from '../core/drenaje';
  import { DURACIONES_MIN, PERIODOS_RETORNO, intensidadEstacion, type EstacionIdf, type PeriodoRetorno } from '../core/idf';

  let {
    entrada,
    nombreCanal,
    altoAltoMm,
    intensidadDiseno,
    estacion = null,
  }: {
    entrada: EntradaSimulacion;
    nombreCanal: string;
    altoAltoMm: number;
    intensidadDiseno: number;
    estacion?: EstacionIdf | null;
  } = $props();

  let intensidad = $state(0);
  let tocado = $state(false);
  // Mientras la persona no mueva el deslizador, sigue a la intensidad de diseño.
  $effect(() => {
    if (!tocado) intensidad = Math.round(intensidadDiseno);
  });

  const limites = $derived(limitesSimulacion(entrada));
  const sim = $derived(simularIntensidad(entrada, intensidad));
  const marcas = $derived(
    estacion ? PERIODOS_RETORNO.map((tr) => ({ tr, i: intensidadEstacion(estacion!, tr, 5) })) : [],
  );
  const maximo = $derived(
    // La barra llega hasta donde el canal rebalsa o la bajante se satura (sin pasar de 800 mm/h)
    Math.ceil(
      Math.max(
        250,
        ...marcas.map((m) => m.i * 1.25),
        intensidadDiseno * 1.6,
        Math.min(800, Math.min(limites.canalRebalsaMmH, limites.bajanteMmH) * 1.15),
      ) / 50,
    ) * 50,
  );
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / maximo) * 100))}%`;

  const ESTADOS: Record<EstadoCanal, { texto: string; detalle: string; icono: string }> = {
    holgado: { texto: 'Trabaja bien', detalle: 'El agua queda dentro del diseño (hasta 3/4 del lado bajo).', icono: '✅' },
    borde: { texto: 'Al límite', detalle: 'El agua ya ocupa el borde libre: cualquier hoja o basura puede hacerlo rebalsar.', icono: '⚠️' },
    rebalsa: { texto: '¡Rebalsa!', detalle: 'El agua pasa por encima del lado bajo del canal.', icono: '⛔' },
  };
  const estado = $derived(sim.usoBajante > 1 && sim.estadoCanal === 'holgado' ? 'borde' : sim.estadoCanal);

  function estadoDe(i: number): EstadoCanal {
    const s = simularIntensidad(entrada, i);
    if (s.estadoCanal === 'rebalsa' || s.usoBajante > 1) return 'rebalsa';
    return s.estadoCanal;
  }

  function fijar(i: number) {
    tocado = true;
    intensidad = Math.round(i);
  }

  // Dibujo del canal (corte) con el nivel del agua
  const ANCHO = 150;
  const escala = $derived(120 / Math.max(1, altoAltoMm, entrada.seccion.altoBajoMm));
  const w = $derived(Math.min(ANCHO, entrada.seccion.anchoMm * escala));
  const hb = $derived(entrada.seccion.altoBajoMm * escala);
  const ha = $derived(altoAltoMm * escala);
  const agua = $derived(Math.min(1, sim.llenado) * hb);
  const X0 = 40;
  const Y0 = 150;

  const n0 = (v: number) => (Number.isFinite(v) ? Math.round(v).toLocaleString('es-GT') : '—');
  const n2 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<div class="simulador no-imprimir">
  <h3>🌧️ Simulador: ¿qué pasa si llueve más fuerte?</h3>
  <p class="nota">
    Mueve la barra para cambiar la intensidad de la lluvia. Se revisa un tramo del canal ({nombreCanal}) que recibe
    {n0(entrada.areaTramoM2)} m² de techo y su bajante.
  </p>

  <div class="control no-imprimir">
    <label for="intensidad-sim">Intensidad: <strong>{n0(intensidad)} mm/h</strong></label>
    <div class="pista">
      <div class="franja verde" style="left: 0; width: {pct(limites.canalDisenoMmH)}"></div>
      <div class="franja amarilla" style="left: {pct(limites.canalDisenoMmH)}; width: calc({pct(limites.canalRebalsaMmH)} - {pct(limites.canalDisenoMmH)})"></div>
      <div class="franja roja" style="left: {pct(limites.canalRebalsaMmH)}; right: 0"></div>
      {#each marcas as m (m.tr)}
        <button
          class="marca"
          class:sin-texto={m.tr !== 10 && m.tr !== 100}
          style="left: {pct(m.i)}"
          title="Aguacero de 5 min que se repite cada {m.tr} años: {n0(m.i)} mm/h"
          aria-label="Aguacero de 5 min cada {m.tr} años, {n0(m.i)} mm/h"
          onclick={() => fijar(m.i)}
        >
          {m.tr === 10 || m.tr === 100 ? `T${m.tr}` : ''}
        </button>
      {/each}
    </div>
    <input
      id="intensidad-sim"
      type="range"
      min="0"
      max={maximo}
      step="5"
      value={intensidad}
      oninput={(e) => fijar(Number((e.target as HTMLInputElement).value))}
    />
    {#if marcas.length}
      <p class="ayuda-marcas">Marcas: aguaceros de 5 min de la estación (T10 = cada 10 años, T100 = cada 100 años; las barritas son 2, 5, 25 y 50 años).</p>
    {/if}
    <div class="escala" aria-hidden="true"><span>0</span><span>{n0(maximo / 2)}</span><span>{n0(maximo)} mm/h</span></div>
    {#if tocado}
      <button class="enlace" onclick={() => ((tocado = false), (intensidad = Math.round(intensidadDiseno)))}>
        Volver a la intensidad de diseño ({n0(intensidadDiseno)} mm/h)
      </button>
    {/if}
  </div>

  <div class="resultado estado-{estado}">
    <svg viewBox="0 0 230 190" role="img" aria-label="Nivel del agua en el canal: {n0(Math.min(1, sim.llenado) * 100)} % del lado bajo">
      {#if sim.estadoCanal === 'rebalsa'}
        <path d="M{X0} {Y0 - hb}q-8 10 -14 40" class="derrame" />
      {/if}
      <rect x={X0} y={Y0 - agua} width={w} height={agua} class="agua" />
      <line x1={X0} y1={Y0 - 0.75 * hb} x2={X0 + w} y2={Y0 - 0.75 * hb} class="linea-diseno" />
      <path d="M{X0 + 6} {Y0 - hb + 6}V{Y0 - hb}H{X0}V{Y0}H{X0 + w}V{Y0 - ha}H{X0 + w - 6}V{Y0 - ha + 6}" class="pared" />
      <text x={X0 + w + 8} y={Y0 - 0.75 * hb + 4} class="mini">diseño</text>
      <text x={X0 + w / 2} y={Y0 + 22} text-anchor="middle" class="mini">{n0(Math.min(999, sim.llenado * 100))} % del lado bajo</text>
    </svg>
    <div class="sim-cifras">
      <p class="titulo-estado">{ESTADOS[estado].icono} {ESTADOS[estado].texto}</p>
      <p>{ESTADOS[estado].detalle}</p>
      <p>Caudal del tramo: <strong>{n2(sim.caudalTramoLs)} L/s</strong></p>
      <div class="medidor" aria-label="Uso de la bajante">
        <span>Bajante: {n0(sim.usoBajante * 100)} % de su capacidad</span>
        <div class="barra"><div class:lleno={sim.usoBajante > 1} style="width: {Math.min(100, sim.usoBajante * 100)}%"></div></div>
      </div>
    </div>
  </div>

  <ul class="limites">
    <li><span class="punto verde"></span> Dentro del diseño hasta <strong>{n0(limites.canalDisenoMmH)} mm/h</strong><span class="no-imprimir">{limites.canalDisenoMmH > maximo ? ' (más allá de la barra)' : ''}</span></li>
    <li><span class="punto roja"></span> El canal rebalsa desde <strong>{n0(limites.canalRebalsaMmH)} mm/h</strong><span class="no-imprimir">{limites.canalRebalsaMmH > maximo ? ' (más allá de la barra)' : ''}</span></li>
    <li><span class="punto azul"></span> La bajante se satura desde <strong>{n0(limites.bajanteMmH)} mm/h</strong></li>
    <li>
      Falla primero: <strong>{limites.fallaPrimero === 'canal' ? 'el canal' : 'la bajante'}</strong>
      {limites.fallaPrimero === 'bajante' ? '(conviene una bajante más grande o una más por canaleta)' : ''}
    </li>
  </ul>

  {#if estacion}
<div class="bloque">
    <h4>Aguaceros cortos en la estación {estacion.nombre}</h4>
    <p class="nota">
      Intensidad (mm/h) según la duración del aguacero y cada cuántos años se repite. El color indica cómo responde
      este canal. <span class="no-imprimir">Toca una casilla para verla en el simulador.</span>
    </p>
    <div class="tabla-desplazable">
      <table class="tabla matriz">
        <thead>
          <tr><th rowspan="2">Duración</th><th colspan={PERIODOS_RETORNO.length}>Se repite cada… (años)</th></tr>
          <tr>{#each PERIODOS_RETORNO as tr (tr)}<th>{tr}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each DURACIONES_MIN as d (d)}
            <tr>
              <td>{d} min</td>
              {#each PERIODOS_RETORNO as tr (tr)}
                {@const i = intensidadEstacion(estacion, tr as PeriodoRetorno, d)}
                <td class="celda estado-{estadoDe(i)}">
                  <button onclick={() => fijar(i)}>{n0(i)}</button>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="leyenda-matriz">
      <span><span class="punto verde"></span> trabaja bien</span>
      <span><span class="punto amarilla"></span> al límite</span>
      <span><span class="punto roja"></span> rebalsa o se satura la bajante</span>
    </p>
</div>
  {/if}
</div>

<style>
  .simulador { border-top: 1px solid var(--borde); margin-top: 1.25rem; padding-top: 0.5rem; }
  .control { display: grid; gap: 0.35rem; margin: 0.75rem 0; }
  .pista { position: relative; height: 1.9rem; margin: 0 0.5rem; }
  .franja { position: absolute; top: 1.2rem; height: 0.5rem; }
  .verde { background: #2e9e5b; }
  .amarilla { background: #e3a21a; }
  .roja { background: #c4320a; }
  .azul { background: var(--acento); }
  .marca.sin-texto { width: 0.45rem; height: 0.9rem; top: 0.2rem; padding: 0; border-radius: 0.2rem; background: var(--texto-suave); border: 0; }
  .marca {
    position: absolute; top: 0; transform: translateX(-50%); font-size: 0.7rem; padding: 0 0.25rem;
    border: 1px solid var(--borde); border-radius: 0.3rem; background: var(--fondo); color: var(--texto); line-height: 1.1rem;
  }
  input[type='range'] { width: 100%; accent-color: var(--acento); margin: 0; }
  .ayuda-marcas { margin: 0; font-size: 0.75rem; color: var(--texto-suave); }
  .escala { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--texto-suave); }
  .enlace { justify-self: start; background: none; border: 0; padding: 0; color: var(--acento); text-decoration: underline; font-size: 0.85rem; }
  .resultado {
    display: grid; grid-template-columns: minmax(0, 14rem) minmax(0, 1fr); gap: 1rem; align-items: center;
    border-radius: 0.75rem; padding: 0.75rem; border: 2px solid var(--borde); background: var(--fondo);
  }
  .resultado.estado-holgado { border-color: #2e9e5b; }
  .resultado.estado-borde { border-color: #e3a21a; }
  .resultado.estado-rebalsa { border-color: #c4320a; }
  @media (max-width: 30rem) { .resultado { grid-template-columns: 1fr; } }
  svg { width: 100%; max-width: 14rem; height: auto; }
  .agua { fill: #9cc9ea; transition: y 0.2s, height 0.2s; }
  .pared { fill: none; stroke: var(--texto); stroke-width: 4; stroke-linejoin: round; }
  .linea-diseno { stroke: #2e9e5b; stroke-dasharray: 4 3; stroke-width: 1.5; }
  .derrame { fill: none; stroke: #5aa7dd; stroke-width: 5; stroke-linecap: round; }
  .mini { font-size: 12px; fill: var(--texto-suave); }
  .sim-cifras p { margin: 0.2rem 0; }
  .titulo-estado { font-size: 1.3rem; font-weight: 700; }
  .medidor { display: grid; gap: 0.2rem; margin-top: 0.4rem; font-size: 0.85rem; }
  .medidor .barra { height: 0.55rem; background: var(--borde); border-radius: 1rem; overflow: hidden; }
  .medidor .barra div { height: 100%; background: var(--acento); }
  .medidor .barra div.lleno { background: #c4320a; }
  .limites { list-style: none; padding: 0; margin: 0.75rem 0; display: grid; gap: 0.25rem; font-size: 0.92rem; }
  .punto { display: inline-block; width: 0.7rem; height: 0.7rem; border-radius: 50%; vertical-align: middle; margin-right: 0.25rem; }
  .matriz td, .matriz th { text-align: center; }
  .matriz th { padding: 0.3rem 0.4rem; white-space: nowrap; }
  .matriz td { padding: 0; }
  .matriz td:first-child { white-space: nowrap; padding: 0 0.4rem; }
  .celda button { width: 100%; border: 0; background: none; padding: 0.3rem 0.2rem; font: inherit; color: inherit; }
  .celda.estado-holgado { background: #d8f0e1; }
  .celda.estado-borde { background: #fbecc6; }
  .celda.estado-rebalsa { background: #f7d3c8; }
  .leyenda-matriz { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.85rem; color: var(--texto-suave); }
  @media print {
    .resultado { break-inside: avoid; }
    .celda { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
