<script lang="ts">
  import { MESES_LARGOS, type ResumenLluvia } from '../core/lluvia';
  import {
    ANIOS_MINIMOS,
    ANIOS_RECOMENDADOS,
    DISTANCIA_AVISO_KM,
    DISTANCIA_LEJOS_KM,
    calidadPorAnios,
    combinarEstaciones,
    estacionManual,
    leerCsv,
    leerEstaciones,
    numero,
    type Calidad,
    type Celda,
    type Estacion,
    type MetodoCombinacion,
  } from '../core/estaciones';
  import { distanciaKm } from '../core/idf';

  let { lat, lon, onUsar }: { lat: string; lon: string; onUsar: (l: ResumenLluvia) => void } = $props();

  const base = import.meta.env.BASE_URL;
  const sitio = $derived(
    lat !== '' && lon !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) ? { lat: Number(lat), lon: Number(lon) } : null,
  );
  const f1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const ETIQUETA: Record<Calidad, string> = {
    buena: `🟢 ${ANIOS_RECOMENDADOS} años o más`,
    regular: `🟡 ${ANIOS_MINIMOS} a ${ANIOS_RECOMENDADOS - 1} años: usar con cuidado`,
    insuficiente: `🔴 menos de ${ANIOS_MINIMOS} años: no recomendado`,
  };

  let via: 'archivo' | 'manual' = $state('archivo');

  // ---------- Archivo ----------
  let archivo = $state('');
  let leyendo = $state(false);
  let estaciones: Estacion[] = $state([]);
  let errores: string[] = $state([]);
  let avisos: string[] = $state([]);
  let elegidas: boolean[] = $state([]);
  let metodo: MetodoCombinacion = $state('idw');
  let diasArchivo = $state(120);

  async function cargar(ev: Event) {
    const f = (ev.currentTarget as HTMLInputElement).files?.[0];
    if (!f) return;
    archivo = f.name;
    leyendo = true;
    errores = [];
    avisos = [];
    estaciones = [];
    try {
      let filas: Celda[][];
      if (/\.(csv|txt)$/i.test(f.name)) filas = leerCsv(await f.text());
      else if (/\.xlsx$/i.test(f.name)) {
        const { readSheet } = await import('read-excel-file/browser');
        filas = (await readSheet(f)) as Celda[][];
      } else throw new Error('Usa un archivo de Excel (.xlsx) o CSV. Si tu archivo es .xls, ábrelo en Excel y guárdalo como .xlsx.');
      const r = leerEstaciones(filas);
      estaciones = r.estaciones;
      errores = r.errores;
      avisos = r.avisos;
      elegidas = r.estaciones.map(() => true);
    } catch (e) {
      errores = [e instanceof Error ? e.message : 'No se pudo leer el archivo.'];
    } finally {
      leyendo = false;
    }
  }

  const distancias = $derived(estaciones.map((e) => (sitio ? distanciaKm(sitio.lat, sitio.lon, e.lat, e.lon) : null)));
  const seleccion = $derived(estaciones.filter((_, i) => elegidas[i]));
  const faltanDias = $derived(seleccion.some((e) => !e.diasLluviaMes));

  function usarArchivo() {
    if (!sitio || !seleccion.length) return;
    onUsar(combinarEstaciones(seleccion, sitio, metodo, faltanDias ? diasArchivo : null));
  }

  // ---------- A mano ----------
  let nombreEst = $state('');
  let latEst = $state('');
  let lonEst = $state('');
  let aniosEst: number | '' = $state('');
  // Valores de ejemplo (reemplazarlos por los de la estación)
  let manualMm = $state([5, 5, 10, 40, 150, 250, 200, 200, 280, 220, 60, 10]);
  let manualDias = $state(120);

  const latN = $derived(numero(latEst));
  const lonN = $derived(numero(lonEst));
  const coordOk = $derived(latN !== null && lonN !== null && Math.abs(latN) <= 90 && Math.abs(lonN) <= 180);
  const distManual = $derived(sitio && coordOk ? distanciaKm(sitio.lat, sitio.lon, latN!, lonN!) : null);
  const calidadManual = $derived(aniosEst === '' ? null : calidadPorAnios(Number(aniosEst)));
  const manualOk = $derived(!!sitio && nombreEst.trim().length > 1 && coordOk && aniosEst !== '' && Number(aniosEst) >= 1);

  function usarManual() {
    if (!manualOk || !sitio) return;
    onUsar(estacionManual({ nombre: nombreEst, lat: latN!, lon: lonN!, anios: Number(aniosEst) }, manualMm, manualDias, sitio));
  }

  function avisoDistancia(d: number | null): string {
    if (d === null) return '';
    if (d > DISTANCIA_LEJOS_KM) return '🔴 lejos del proyecto';
    if (d > DISTANCIA_AVISO_KM) return '🟡 algo lejos';
    return '';
  }
</script>

<div class="estaciones">
  <p class="nota">
    Usa esta opción si tienes registros de una o varias estaciones meteorológicas cercanas (INSIVUMEH, municipalidad,
    finca, ONG, etc.). Lo recomendable es contar con <strong>{ANIOS_RECOMENDADOS} años o más</strong> de registro; con
    menos años el promedio puede no representar bien el clima del lugar y afectar el tamaño del tanque. Las
    coordenadas de cada estación son obligatorias.
  </p>

  <div class="subpestanas" role="tablist">
    <button role="tab" aria-selected={via === 'archivo'} class:activa={via === 'archivo'} onclick={() => (via = 'archivo')}>📄 Cargar archivo (Excel o CSV)</button>
    <button role="tab" aria-selected={via === 'manual'} class:activa={via === 'manual'} onclick={() => (via = 'manual')}>✍️ Escribir promedios</button>
  </div>

  {#if !sitio}
    <p class="alerta">Primero marca el proyecto en el mapa (o escribe sus coordenadas): se usa para medir la distancia a cada estación.</p>
  {/if}

  {#if via === 'archivo'}
    <p>
      Descarga una plantilla, copia tus datos (una fila por dato) y cárgala:
      <a href="{base}plantillas/lluvia-mensual.xlsx" download>datos mensuales (.xlsx)</a> ·
      <a href="{base}plantillas/lluvia-diaria.xlsx" download>datos diarios (.xlsx)</a> ·
      <a href="{base}plantillas/lluvia-mensual.csv" download>mensual (.csv)</a> ·
      <a href="{base}plantillas/lluvia-diaria.csv" download>diaria (.csv)</a>
    </p>
    <p class="nota">
      Columnas: Estación, Latitud, Longitud, Año, Mes y Lluvia (mm) para datos mensuales; o Estación, Latitud,
      Longitud, Fecha y Lluvia (mm) para datos diarios. Puede haber varias estaciones en el mismo archivo. El archivo
      se lee en este dispositivo; no se envía a ningún servidor.
    </p>
    <label class="cargar">
      <span class="secundario boton">📂 {archivo ? 'Cambiar archivo' : 'Elegir archivo'}</span>
      <input type="file" accept=".xlsx,.csv,.txt" onchange={cargar} />
      {#if archivo}<span class="nombre-archivo">{leyendo ? 'Leyendo…' : archivo}</span>{/if}
    </label>

    {#each errores as e (e)}<p class="alerta">{e}</p>{/each}
    {#each avisos as a (a)}<p class="nota">{a}</p>{/each}

    {#if estaciones.length}
      <div class="tabla-desplazable">
        <table class="rejilla tabla-est">
          <thead>
            <tr>
              <th>Usar</th><th>Estación</th><th>Coordenadas</th><th>Distancia</th><th>Periodo</th>
              <th>Años con dato*</th><th>Lluvia anual</th>
            </tr>
          </thead>
          <tbody>
            {#each estaciones as e, i (e.nombre)}
              <tr class:apagada={!elegidas[i]}>
                <td class="centro"><input type="checkbox" bind:checked={elegidas[i]} aria-label="Usar {e.nombre}" /></td>
                <td>{e.nombre}<br /><small>datos {e.tipo === 'diaria' ? 'diarios' : 'mensuales'}</small></td>
                <td>{e.lat.toFixed(4)}, {e.lon.toFixed(4)}</td>
                <td>{distancias[i] !== null ? `${f1(distancias[i]!)} km` : '—'}<br /><small>{avisoDistancia(distancias[i])}</small></td>
                <td>{e.anioInicio}–{e.anioFin}</td>
                <td>{Math.min(...e.aniosPorMes)} ({e.aniosCompletos} completos)<br /><small>{ETIQUETA[e.calidad]}</small></td>
                <td>{n0(e.anualMm)} mm</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="nota">* Años con dato en el mes que menos tiene; "completos" son los años con los 12 meses.</p>

      {#if seleccion.length > 1}
        <fieldset class="metodo">
          <legend>¿Cómo combinar las {seleccion.length} estaciones?</legend>
          <label><input type="radio" bind:group={metodo} value="idw" /> Promedio ponderado por distancia (recomendado): pesa más la estación más cercana al proyecto.</label>
          <label><input type="radio" bind:group={metodo} value="simple" /> Promedio simple: todas pesan igual.</label>
        </fieldset>
      {/if}
      {#if faltanDias}
        <label class="dias">Días con lluvia al año (los datos mensuales no los traen)
          <input type="number" min="0" max="366" bind:value={diasArchivo} />
        </label>
      {/if}
      <div class="acciones">
        <button class="principal grande" onclick={usarArchivo} disabled={!sitio || !seleccion.length}>Usar {seleccion.length === 1 ? 'esta estación' : 'estas estaciones'} →</button>
      </div>
    {/if}
  {:else}
    <p>
      Escribe la lluvia promedio histórica de cada mes, en milímetros, de una estación cercana, y los años de registro
      con que se calculó. Los valores que aparecen son solo un ejemplo.
    </p>
    <div class="campos">
      <label>Nombre de la estación *<input bind:value={nombreEst} placeholder="Ej. INSIVUMEH Escuintla" /></label>
      <label>Latitud de la estación *<input inputmode="decimal" bind:value={latEst} placeholder="14.2995" /></label>
      <label>Longitud de la estación *<input inputmode="decimal" bind:value={lonEst} placeholder="-90.7854" /></label>
      <label>Años de registro usados *<input type="number" min="1" max="200" bind:value={aniosEst} placeholder="Ej. 15" /></label>
    </div>
    {#if latEst && lonEst && !coordOk}<p class="alerta">Escribe las coordenadas en grados decimales (ej. 14.2995 y -90.7854).</p>{/if}
    {#if distManual !== null}<p class="nota">La estación está a {f1(distManual)} km del proyecto. {avisoDistancia(distManual)}</p>{/if}
    {#if calidadManual}<p class="nota">{ETIQUETA[calidadManual]}</p>{/if}
    <div class="meses">
      {#each MESES_LARGOS as mes, i (mes)}
        <label>{mes}<input type="number" min="0" step="1" bind:value={manualMm[i]} /></label>
      {/each}
      <label>Días con lluvia al año<input type="number" min="0" max="366" bind:value={manualDias} /></label>
    </div>
    <div class="acciones">
      <button class="principal grande" onclick={usarManual} disabled={!manualOk}>Usar estos datos →</button>
    </div>
    {#if !manualOk}<p class="nota">* Completa el nombre, las coordenadas y los años de registro de la estación.</p>{/if}
  {/if}
</div>

<style>
  .subpestanas { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0; }
  .subpestanas button {
    border: 1px solid var(--borde); background: var(--fondo); border-radius: 999px; padding: 0.4rem 0.9rem; font-size: 0.9rem;
  }
  .subpestanas button.activa { background: var(--acento-suave); border-color: var(--acento); color: var(--acento); font-weight: 600; }
  .cargar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin: 0.5rem 0 0.75rem; }
  .cargar input[type='file'] { position: absolute; width: 1px; height: 1px; opacity: 0; }
  .cargar .boton { display: inline-block; cursor: pointer; padding: 0.55rem 1rem; border-radius: 0.5rem; border: 1px solid var(--acento); color: var(--acento); }
  .cargar:focus-within .boton { outline: 2px solid var(--acento); outline-offset: 2px; }
  .nombre-archivo { font-size: 0.9rem; color: var(--texto-suave); }
  .tabla-est { font-size: 0.9rem; }
  .tabla-est small { color: var(--texto-suave); }
  .tabla-est tr.apagada td { opacity: 0.5; }
  .centro { text-align: center; }
  .metodo { border: 1px solid var(--borde); border-radius: 0.5rem; padding: 0.5rem 0.9rem; margin: 0.75rem 0; }
  .metodo label { display: flex; gap: 0.5rem; align-items: flex-start; margin: 0.3rem 0; color: var(--texto); }
  .metodo input { width: auto; margin-top: 0.25rem; }
  .dias { max-width: 22rem; margin: 0.5rem 0; }
  .meses { display: grid; grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr)); gap: 0.5rem 0.75rem; margin: 0.75rem 0; }
</style>
