<script lang="ts">
  import { MESES_LARGOS, type ResumenLluvia } from '../core/lluvia';
  import { ATRIBUCION_OPEN_METEO, redondearCoordenada } from '../core/openmeteo';
  import GraficoMensual from './GraficoMensual.svelte';
  import IlustracionLitro from './IlustracionLitro.svelte';
  import type { ResumenOferta } from '../core/oferta';
  import { COEFICIENTES_ESCORRENTIA, NOMBRES_TECHO, type TipoTecho } from '../core/techo';

  let {
    lluvia,
    lat,
    lon,
    oferta = null,
    tipoTecho,
  }: {
    lluvia: ResumenLluvia | null;
    lat: string;
    lon: string;
    oferta?: ResumenOferta | null;
    tipoTecho: TipoTecho;
  } = $props();

  const umbralMm = $derived(oferta?.umbralMm ?? 0);
  const mesesCaptables = $derived(
    oferta ? oferta.mesesCaptados.flatMap((c, i) => (c ? [MESES_LARGOS[i]] : [])) : [],
  );

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
</script>

<section class="tarjeta paso salto-impresion">
  <p class="numero-paso">Paso 2 de 8</p>
  <h2>Lluvia del lugar</h2>

  {#if !lluvia}
    <p class="nota">Primero marca la vivienda en el mapa o escribe tus datos de lluvia (paso 1).</p>
  {/if}
  {#if lluvia}
    <div class="resumen">
      <div class="cifras">
        <div><span class="cifra">{n0(lluvia.anualMm)} mm</span><span>lluvia promedio al año</span></div>
        <div><span class="cifra">{n0(lluvia.diasLluviaAnual)}</span><span>días con lluvia al año</span></div>
        <div><span class="cifra">{n0(lluvia.anualMm)} L</span><span>caen al año sobre cada m² de techo</span></div>
      </div>
      <div class="no-imprimir"><IlustracionLitro anualMm={lluvia.anualMm} /></div>
<div class="bloque">
      <h3>Precipitación promedio mensual y precipitación neta (PN) a cosechar (mm)</h3>
      <GraficoMensual
        brutaMm={lluvia.mensualMm}
        netaMm={oferta?.pnMensualMm ?? null}
        captados={oferta?.mesesCaptados ?? null}
        umbralMm={umbralMm || null}
      />
      <p class="leyenda-grafico">
        <span class="item"><span class="muestra bruta"></span> Precipitación promedio</span>
        <span class="item"><span class="muestra neta"></span> PN a cosechar</span>
        {#if umbralMm > 0}
          <span class="item"><span class="muestra gris"></span> PN de un mes que no se capta</span>
          <span class="item"><span class="linea-umbral"></span> {umbralMm} mm de PN: límite de la época seca</span>
        {/if}
      </p>
      <p class="nota informe">
        PN = precipitación × Cc, con el coeficiente de captación Cc = Ce × Efc del techo del paso 3
        ({NOMBRES_TECHO[tipoTecho].toLowerCase()}: {COEFICIENTES_ESCORRENTIA[tipoTecho]} × 0.85 =
        {(COEFICIENTES_ESCORRENTIA[tipoTecho] * 0.85).toLocaleString('es-GT', { maximumFractionDigits: 3 })}). Las lluvias de la época seca (meses seguidos con PN menor a
        {umbralMm} mm) no se captan: lavan el sistema (primer descarte por temporada).
      </p>
</div>
      {#if umbralMm > 0}
        <p class="recomendacion">
          Recomendación: captar la lluvia durante la temporada de lluvia y no en la época seca (los meses seguidos con
          menos de {umbralMm} mm de precipitación neta, bajo la línea roja punteada).
          {#if mesesCaptables.length}
            En este lugar se capta en: {mesesCaptables.join(', ')} ({mesesCaptables.length} meses).
          {:else}
            En este lugar ningún mes alcanza {umbralMm} mm de PN.
          {/if}
          Las lluvias de la época seca no se cuentan: lavan el sistema.
        </p>
      {/if}
      <details class="detalle">
        <summary>Ver los datos mes a mes y la fuente</summary>
      <table class="tabla-meses">
        <thead><tr><th>Mes</th>{#each MESES_LARGOS as m (m)}<th>{m.slice(0, 3)}</th>{/each}<th>Año</th></tr></thead>
        <tbody>
          <tr><td>Precipitación (mm)</td>{#each lluvia.mensualMm as v, i (i)}<td>{n0(v)}</td>{/each}<td><strong>{n0(lluvia.anualMm)}</strong></td></tr>
          {#if oferta}
            <tr class="fila-pn"><td>PN (mm)</td>{#each oferta.pnMensualMm as v, i (i)}<td class:captado={oferta.mesesCaptados[i]}>{n0(v)}</td>{/each}<td><strong>{n0(oferta.netaAnualMm)}</strong></td></tr>
          {/if}
        </tbody>
      </table>
      {#if lluvia.estaciones?.length}
        <div class="bloque">
          <table class="rejilla estaciones-usadas">
            <thead>
              <tr><th>Estación</th><th>Latitud</th><th>Longitud</th><th>Distancia al proyecto</th><th>Periodo</th><th>Años con dato</th>{#if lluvia.estaciones.length > 1}<th>Peso</th>{/if}</tr>
            </thead>
            <tbody>
              {#each lluvia.estaciones as e (e.nombre)}
                <tr>
                  <td>{e.nombre}</td><td>{e.lat.toFixed(4)}</td><td>{e.lon.toFixed(4)}</td>
                  <td>{Number.isFinite(e.distanciaKm) ? `${e.distanciaKm.toLocaleString('es-GT', { maximumFractionDigits: 1 })} km` : '—'}</td>
                  <td>{e.anioInicio ? `${e.anioInicio}–${e.anioFin}` : '—'}</td><td>{e.anios}</td>
                  {#if lluvia.estaciones.length > 1}<td>{Math.round(e.peso * 100)} %</td>{/if}
                </tr>
              {/each}
            </tbody>
          </table>
          <p class="nota informe">Fuente: {lluvia.fuente}.</p>
          {#if lluvia.anios < 10}
            <p class="nota informe">
              El registro tiene {lluvia.anios} años, menos de los 10 recomendados para un promedio climático: los
              resultados deben tomarse con precaución y conviene contrastarlos con el registro satelital.
            </p>
          {/if}
        </div>
      {:else}
      <p class="nota informe">
        Fuente: {lluvia.fuente}{#if lluvia.anios}, promedio de {lluvia.anios} años ({lluvia.anioInicio}–{lluvia.anioFin}){/if}.
        {#if lluvia.fuente.includes('Open-Meteo')}{ATRIBUCION_OPEN_METEO}.{/if}
        {#if lat && lon && lluvia.anios}Punto consultado: {redondearCoordenada(Number(lat))}, {redondearCoordenada(Number(lon))}.{/if}
      </p>
      {/if}
      {#if lluvia.mesesSinDatos.length}
        <p class="alerta">Sin datos suficientes en: {lluvia.mesesSinDatos.map((m) => MESES_LARGOS[m]).join(', ')} (se tomaron como 0 mm).</p>
      {/if}
      </details>
    </div>
  {/if}
</section>

<style>
  .resumen { margin-top: 1rem; }
  h3 { font-size: 1rem; margin: 1rem 0 0.25rem; }
  .leyenda-grafico { display: flex; gap: 0.4rem 1rem; flex-wrap: wrap; align-items: center; font-size: 0.85rem; color: var(--texto-suave); margin: 0.25rem 0; }
  .item { display: inline-flex; align-items: center; gap: 0.3rem; }
  .muestra { display: inline-block; width: 0.9rem; height: 0.9rem; border-radius: 2px; }
  .muestra.bruta { background: var(--acento-suave); border: 1px solid var(--acento); }
  .muestra.neta { background: var(--acento); }
  .muestra.gris { background: var(--texto-suave); opacity: 0.45; }
  .linea-umbral { display: inline-block; width: 1.5rem; border-top: 2px dashed #c4320a; }
  .recomendacion { border-left: 4px solid #c4320a; padding: 0.4rem 0.75rem; background: var(--fondo); border-radius: 0.25rem; }
  .tabla-meses { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-top: 0.75rem; display: block; overflow-x: auto; }
  .tabla-meses th, .tabla-meses td { padding: 0.25rem 0.35rem; text-align: right; border-bottom: 1px solid var(--borde); }
  .tabla-meses th:first-child, .tabla-meses td:first-child { text-align: left; white-space: nowrap; }
  .fila-pn td { color: var(--texto-suave); }
  .fila-pn td.captado { color: var(--acento); font-weight: 700; }
</style>
