<script lang="ts">
  import DibujosDrenaje from './DibujosDrenaje.svelte';
  import SimuladorLluvia from './SimuladorLluvia.svelte';
  import ResultadoHidraulico from './ResultadoHidraulico.svelte';
  import { analizarTramo } from '../core/analisisHidraulico';
  import {
    DURACION_DISENO_MIN,
    DISTANCIA_MAX_KM,
    FUENTE_IDF_BARDALES,
    FUENTE_IDF_ICC,
    PERIODOS_RETORNO,
    PERIODO_DISENO,
    estacionMasCercana,
    intensidadEstacion,
    type PeriodoRetorno,
  } from '../core/idf';
  import type { DatosDrenajeInforme } from '../core/informe';
  import {
    BAJANTE_MINIMA_PRACTICA,
    CANALES_MERCADO,
    SECCIONES_COMERCIALES,
    evaluarCanalRectangular,
    limitesSimulacion,
    MATERIALES_CANALETA,
    NOMBRES_TIPO_CANAL,
    disenarDrenaje,
    type MaterialCanaleta,
  } from '../core/drenaje';
  import { COEFICIENTES_ESCORRENTIA, type ModuloMedido, type NumeroAguas, type OpcionTecho, type TipoTecho } from '../core/techo';

  let {
    opciones,
    aguas,
    tipoTecho,
    modulosExistentes = [],
    lat = '',
    lon = '',
    resumen = $bindable(''),
    fuenteIntensidad = $bindable(''),
    datos = $bindable(null),
  }: {
    opciones: OpcionTecho[];
    aguas: NumeroAguas;
    tipoTecho: TipoTecho;
    modulosExistentes?: ModuloMedido[];
    lat?: string;
    lon?: string;
    resumen?: string;
    fuenteIntensidad?: string;
    datos?: DatosDrenajeInforme | null;
  } = $props();

  // Parámetros de diseño (editables por el diseñador)
  // 'auto' = el techo existente si se escribieron sus medidas; si no, la forma rectangular sugerida
  let techoElegido = $state('auto');
  let largoPropio: number | null = $state(null);
  let anchoPropio: number | null = $state(null);
  // Intensidad de diseño: de la curva IDF de la estación más cercana o escrita a mano
  let intensidadManual = $state(150);
  let periodo: PeriodoRetorno = $state(PERIODO_DISENO);
  const cercana = $derived(lat !== '' && lon !== '' ? estacionMasCercana(Number(lat), Number(lon)) : null);
  let origen = $state<'auto' | 'estacion' | 'manual'>('auto');
  const usarEstacion = $derived(cercana !== null && (origen === 'estacion' || (origen === 'auto' && cercana.util)));
  const intensidad = $derived(
    usarEstacion && cercana ? Math.round(intensidadEstacion(cercana.estacion, periodo, DURACION_DISENO_MIN)) : Number(intensidadManual) || 0,
  );
  $effect(() => {
    fuenteIntensidad =
      usarEstacion && cercana
        ? `${FUENTE_IDF_ICC.corta}, estación ${cercana.estacion.nombre}, ${DURACION_DISENO_MIN} min, T = ${periodo} años`
        : 'Escrita por el usuario';
  });
  let pendientePct = $state(0.5);
  let material: MaterialCanaleta = $state('pvc');
  // Opción 2: canal comercial (colonial o alto caudal) o medidas propias
  let canalElegido: 'sugerido' | 'colonial' | 'alto' | 'propio' = $state('sugerido');
  let anchoPropio2: number | null = $state(null);
  let altoBajoPropio: number | null = $state(null);
  let altoAltoPropio: number | null = $state(null);

  const varios = $derived(modulosExistentes.length > 1);
  const areaExistente = $derived(modulosExistentes.reduce((t, m) => t + m.area, 0));
  /** Techos a drenar: los módulos existentes, o un solo techo (sugerido o con medidas propias). */
  const techos = $derived.by((): { largo: number; ancho: number; nombre: string }[] => {
    if ((techoElegido === 'auto' || techoElegido === 'existente') && modulosExistentes.length) {
      return modulosExistentes.map((m) => ({ largo: m.largo, ancho: m.ancho, nombre: varios ? m.nombre : 'Techo existente' }));
    }
    if (techoElegido === 'propio') {
      const l = Number(largoPropio) || 0;
      const a = Number(anchoPropio) || 0;
      return l > 0 && a > 0 ? [{ largo: Math.max(l, a), ancho: Math.min(l, a), nombre: 'Medidas propias' }] : [];
    }
    const o = opciones.find((x) => x.forma === techoElegido) ?? opciones[1] ?? opciones[0];
    return o ? [{ largo: o.largo, ancho: o.ancho, nombre: o.nombre }] : [];
  });

  const ce = $derived(COEFICIENTES_ESCORRENTIA[tipoTecho]);
  const resultados = $derived(
    techos.map((t) =>
      disenarDrenaje({
        areaM2: t.largo * t.ancho,
        largoM: t.largo,
        aguas,
        c: ce,
        intensidadMmH: Number(intensidad) || 0,
        pendientePct: Number(pendientePct) || 0,
        material,
      }),
    ),
  );
  /** Módulo que se detalla: el de más caudal por tramo (el más exigente para el canal). */
  const iDetalle = $derived(
    resultados.reduce((m, x, i) => (x.caudalPorTramoLs > resultados[m].caudalPorTramoLs ? i : m), 0),
  );
  const techo = $derived(techos[iDetalle] ?? null);
  const r = $derived(resultados[iDetalle] ?? null);
  const totalBajantes = $derived(resultados.reduce((t, x) => t + x.bajantes[x.bajanteSugerida].total, 0));
  const totalCanaletaM = $derived(resultados.reduce((t, x) => t + x.longitudTotalCanaletaM, 0));
  const b = $derived(r ? r.bajantes[r.bajanteSugerida] : null);
  const c = $derived(r && r.canaletaSugerida >= 0 ? r.canaletas[r.canaletaSugerida] : null);
  const seccion = $derived.by(() => {
    if (!r) return null;
    if (canalElegido === 'propio') {
      return {
        nombre: 'Medidas propias',
        anchoMm: Number(anchoPropio2) || 0,
        altoBajoMm: Number(altoBajoPropio) || 0,
        altoAltoMm: Math.max(Number(altoAltoPropio) || 0, Number(altoBajoPropio) || 0),
        perfil: 'recto' as const,
      };
    }
    return SECCIONES_COMERCIALES[canalElegido === 'sugerido' ? r.tipoCanal : canalElegido];
  });
  const rect = $derived(
    r && seccion
      ? evaluarCanalRectangular(seccion, r.caudalPorTramoLs, Number(pendientePct) || 0, material, ce, Number(intensidad) || 0)
      : null,
  );

  // Entrada del simulador y datos para el cuadro resumen del informe
  const entradaSim = $derived(
    r && b && techo && seccion && seccion.anchoMm > 0 && seccion.altoBajoMm > 0
      ? {
          areaTramoM2: (techo.largo * techo.ancho) / r.numeroCanaletas / b.porCanaleta,
          c: ce,
          seccion,
          pendientePct: Number(pendientePct) || 0,
          material,
          capacidadBajanteLs: b.capacidadLs,
        }
      : null,
  );
  const analisis = $derived(
    entradaSim ? analizarTramo(entradaSim, Number(intensidad) || 0, usarEstacion && cercana ? cercana.estacion : null) : null,
  );
  $effect(() => {
    if (!r || !b || !techo || !seccion || !rect || !entradaSim || !analisis) {
      datos = null;
      return;
    }
    const lim = limitesSimulacion(entradaSim);
    datos = {
      modulos: techos.length > 1
        ? techos.map((t, i) => {
            const x = resultados[i];
            const bx = x.bajantes[x.bajanteSugerida];
            return {
              nombre: t.nombre,
              ancho: t.ancho,
              largo: t.largo,
              tipoCanal: NOMBRES_TIPO_CANAL[x.tipoCanal],
              bajantes: bx.total,
              bajantesPorCanaleta: bx.porCanaleta,
              bajanteNombre: bx.nombre,
              canaletaM: x.longitudTotalCanaletaM,
            };
          })
        : undefined,
      tramoM: r.tramoM,
      motivoBajantes: r.motivoBajantes,
      tramoMaximoM: r.tramoMaximoM,
      techoAncho: techo.ancho,
      techoLargo: techo.largo,
      techoNombre: techo.nombre,
      intensidadMmH: intensidad,
      fuenteIntensidad,
      tipoCanal: NOMBRES_TIPO_CANAL[r.tipoCanal],
      lineasCanal: r.lineasSugeridas.map((l) => `${l.marca}: ${l.modelo}`).join('; '),
      canalRevisado: seccion.nombre,
      capacidadCanalLs: rect.capacidadLs,
      caudalTramoLs: r.caudalPorTramoLs,
      cumpleCanal: rect.cumple,
      bajanteNombre: b.nombre,
      bajantesPorCanaleta: b.porCanaleta,
      bajantesTotal: techos.length > 1 ? totalBajantes : b.total,
      numeroCanaletas: r.numeroCanaletas,
      longitudCanaletaM: techos.length > 1 ? totalCanaletaM : r.longitudTotalCanaletaM,
      pendientePct: Number(pendientePct) || 0,
      material: MATERIALES_CANALETA[material].nombre,
      canaletaEquivalente: c ? c.nombre : null,
      rebalsaMmH: lim.canalRebalsaMmH,
      bajanteSaturaMmH: lim.bajanteMmH,
      fallaPrimero: lim.fallaPrimero,
      capacidadSistemaLs: analisis.sistemaLs,
      periodoCritico: (() => {
        const p = analisis.periodos.find((x) => x.duracionCriticaMin !== null);
        return p ? { tr: p.tr, minutos: Math.floor(p.duracionCriticaMin ?? 0) } : null;
      })(),
      estacionIdf: usarEstacion && cercana ? cercana.estacion.nombre : null,
    };
  });

  $effect(() => {
    const total = techos.length > 1 ? totalBajantes : (b?.total ?? 0);
    resumen = r && b ? `${NOMBRES_TIPO_CANAL[r.tipoCanal]} · ${total} bajante${total > 1 ? 's' : ''} de ${b.nombre}` : '';
  });

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const n2 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<section class="tarjeta paso">
  <p class="numero-paso">Paso 6 de 8</p>
  <h2>Canaletas y bajantes</h2>

  {#if opciones.length === 0 && !modulosExistentes.length}
    <p class="nota">Completa los pasos anteriores para dimensionar canaletas y bajantes.</p>
  {:else}
    <div class="campos no-imprimir">
      <label>Techo a drenar
        <select bind:value={techoElegido}>
          {#if varios}
            <option value="auto">Techo existente: {modulosExistentes.length} módulos, {n1(areaExistente)} m²</option>
          {:else if modulosExistentes.length}
            <option value="auto">Techo existente: {n1(modulosExistentes[0].ancho)} × {n1(modulosExistentes[0].largo)} m</option>
          {:else}
            <option value="auto">Sugerido (rectangular)</option>
          {/if}
          {#each opciones as o (o.forma)}
            <option value={o.forma}>{o.nombre}: {n1(o.ancho)} × {n1(o.largo)} m</option>
          {/each}
          <option value="propio">Medidas propias</option>
        </select>
      </label>
      {#if techoElegido === 'propio'}
        <label>Largo del techo (m), lado de la canaleta
          <input type="number" min="1" step="0.5" bind:value={largoPropio} />
        </label>
        <label>Ancho del techo (m)
          <input type="number" min="1" step="0.5" bind:value={anchoPropio} />
        </label>
      {/if}
      <label>Pendiente de la canaleta (%)
        <input type="number" min="0.1" max="5" step="0.1" bind:value={pendientePct} />
      </label>
      <label>Material de la canaleta
        <select bind:value={material}>
          {#each Object.entries(MATERIALES_CANALETA) as [id, m] (id)}
            <option value={id}>{m.nombre} (n = {m.n})</option>
          {/each}
        </select>
      </label>
    </div>
    <div class="intensidad-caja">
      <h3>¿Qué tan fuerte llueve aquí?</h3>
      <p class="nota informe">
        La canaleta se calcula para un aguacero corto e intenso ({DURACION_DISENO_MIN} minutos), no para la lluvia
        promedio. Ese dato sale de la curva intensidad-duración-frecuencia (IDF).
      </p>
      <div class="campos no-imprimir">
        <label>De dónde sale la intensidad
          <select bind:value={origen}>
            <option value="auto">Automático</option>
            <option value="estacion" disabled={!cercana}>Estación con curva IDF más cercana</option>
            <option value="manual">Escribirla yo</option>
          </select>
        </label>
        {#if usarEstacion}
          <label>Periodo de retorno (cada cuántos años)
            <select bind:value={periodo}>
              {#each PERIODOS_RETORNO as tr (tr)}
                <option value={tr}>{tr} años{tr === PERIODO_DISENO ? ' (sugerido)' : ''}</option>
              {/each}
            </select>
          </label>
        {:else}
          <label>Intensidad de lluvia de diseño (mm/h)
            <input type="number" min="10" max="500" step="5" bind:value={intensidadManual} />
          </label>
        {/if}
      </div>
      {#if usarEstacion && cercana}
        <div class="destacado">
          <span class="cifra">{n0(intensidad)} mm/h</span>
          <span>
            Estación <strong>{cercana.estacion.nombre}</strong> ({cercana.estacion.municipio}, {cercana.estacion.departamento}),
            a {n0(cercana.km)} km: aguacero de {DURACION_DISENO_MIN} minutos que se repite cada {periodo} años.
            Fuente: {FUENTE_IDF_ICC.corta}.
          </span>
        </div>
        {#if !cercana.util}
          <p class="alerta">
            La estación está a más de {DISTANCIA_MAX_KM} km: úsala solo como referencia y, si puedes, escribe el dato de
            tu punto.
          </p>
        {/if}
      {:else}
        <p class="nota informe">
          {#if cercana && !cercana.util}
            Las curvas IDF incluidas son de la vertiente del Pacífico (22 estaciones) y la más cercana,
            {cercana.estacion.nombre}, está a {n0(cercana.km)} km.
          {:else if !cercana}
            Marca la vivienda en el mapa (paso 1) para buscar la estación con curva IDF más cercana.
          {/if}
          <span class="no-imprimir">
            Puedes consultar la curva IDF de tu punto en la
            <a href={FUENTE_IDF_BARDALES.url} target="_blank" rel="noopener">app IDF Guatemala de Walter Bardales</a>
            {#if lat && lon}(escribe allí {lat}, {lon}){/if}: busca la línea de {PERIODO_DISENO} años en {DURACION_DISENO_MIN} minutos y
            escribe ese valor aquí.
          </span>
          Valor usado: {n0(intensidad)} mm/h.
        </p>
      {/if}
    </div>

    {#if !techo || !r || !b}
      <p class="nota">Escribe el largo y el ancho del techo.</p>
    {:else}
      <p class="solo-impresion">
        Parámetros: {techos.length > 1 ? `techo existente de ${techos.length} módulos; se detalla el ${techo.nombre.toLowerCase()},` : techo.nombre === 'Techo existente' ? 'techo existente' : `techo ${techo.nombre.toLowerCase()}`} de {n1(techo.ancho)} × {n1(techo.largo)} m, intensidad de diseño
        {n0(Number(intensidad))} mm/h, C = {ce}, canaleta de {MATERIALES_CANALETA[material].nombre} con
        pendiente de {n1(Number(pendientePct))} %.
      </p>

      {#if techos.length > 1}
<div class="bloque">
        <h3>Canaletas y bajantes por módulo</h3>
        <div class="tabla-desplazable">
          <table class="rejilla modulos">
            <thead>
              <tr><th>Módulo</th><th>Medidas</th><th>Canaletas</th><th>Bajantes</th><th class="extra">Canal sugerido</th></tr>
            </thead>
            <tbody>
              {#each techos as t, i (t.nombre)}
                {@const x = resultados[i]}
                {@const bx = x.bajantes[x.bajanteSugerida]}
                <tr class:detallado={i === iDetalle}>
                  <td>{t.nombre}{i === iDetalle ? ' *' : ''}</td>
                  <td>{n1(t.ancho)} × {n1(t.largo)} m = {n1(t.ancho * t.largo)} m²</td>
                  <td>{x.numeroCanaletas} × {n1(t.largo)} m</td>
                  <td>{bx.total} de {bx.nombre} ({bx.porCanaleta} por canaleta, una cada {n1(x.tramoM)} m{x.motivoBajantes === 'largo' ? '; por el largo' : ''})</td>
                  <td class="extra">{NOMBRES_TIPO_CANAL[x.tipoCanal]}</td>
                </tr>
              {/each}
              <tr class="total">
                <td>Total</td>
                <td>{n1(areaExistente)} m²</td>
                <td>{n1(totalCanaletaM)} m</td>
                <td>{totalBajantes} bajantes</td>
                <td class="extra"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="nota informe">
          Cada módulo lleva sus propias canaletas y bajantes, y todas las bajantes se conectan a la tubería de entrada al
          tanque. Ninguna bajante recibe más de {n0(r.tramoMaximoM)} m de canal. * Abajo se detalla el {techo.nombre.toLowerCase()}, el de más caudal por tramo (el más exigente).
        </p>
</div>
      {/if}

      <table class="cascada">
        <tbody>
          <tr><td>Techo a drenar ({techo.nombre.toLowerCase()})</td><td>{n1(techo.ancho)} × {n1(techo.largo)} m = {n1(techo.ancho * techo.largo)} m²</td></tr>
          <tr><td>Canaletas{techos.length > 1 ? ` del ${techo.nombre.toLowerCase()}` : ''} ({aguas === 2 ? 'una por cada agua' : 'un agua'})</td><td>{r.numeroCanaletas} × {n1(techo.largo)} m = {n1(r.longitudTotalCanaletaM)} m</td></tr>
          <tr><td>Caudal de diseño total, Q = C × i × A / 3600</td><td>{n2(r.caudalTotalLs)} L/s</td></tr>
          <tr class="total"><td>Caudal por canaleta ({n1(r.areaPorCanaletaM2)} m² de techo cada una)</td><td>{n2(r.caudalPorCanaletaLs)} L/s</td></tr>
        </tbody>
      </table>

      <div class="destacado">
        <span class="cifra">{b.total} × {b.nombre}</span>
        <span>
          <strong>Sugerencia mínima: {NOMBRES_TIPO_CANAL[r.tipoCanal].toLowerCase()}</strong>
          ({r.lineasSugeridas.map((l) => `${l.modelo} de ${l.marca}`).join(' o ')}), con {b.porCanaleta}
          bajante{b.porCanaleta > 1 ? 's' : ''} de {b.nombre} por canaleta ({b.total} en total); cada bajante atiende
          un tramo de {n1(r.tramoM)} m con {n2(r.caudalPorTramoLs)} L/s. El {r.seccionComercial.nombre} lleva
          {n2(r.capacidadComercialLs)} L/s con pendiente de {n1(Number(pendientePct))} %.
          {#if c}
            Equivale como mínimo a una canaleta semicircular de {c.nombre}.
          {/if}
        </span>
      </div>
      <p class="nota informe bajantes-motivo">
        <strong>¿Cuántas bajantes?</strong>
        {#if r.motivoBajantes === 'largo'}
          La canaleta mide {n1(techo.largo)} m: por el largo, no por el caudal, lleva {b.porCanaleta} bajantes, una cada
          {n1(r.tramoM)} m (como máximo una cada {n0(r.tramoMaximoM)} m de canal). Con tramos más largos el desnivel por la
          pendiente se acumula y el canal se carga y se tapa al final del tramo.
        {:else if b.porCanaleta > 1}
          El caudal de cada canaleta ({n2(r.caudalPorCanaletaLs)} L/s) pide {b.porCanaleta} bajantes de {b.nombre}, una cada
          {n1(r.tramoM)} m; el largo pediría {r.bajantesPorLargo} (una cada {n0(r.tramoMaximoM)} m como máximo).
        {:else}
          Con {n1(techo.largo)} m de canaleta basta una bajante por canaleta: el caudal lo permite y el tramo no pasa de
          {n0(r.tramoMaximoM)} m.
        {/if}
        Reparte las bajantes para que cada una reciba un tramo igual de canal.
      </p>
      <p class="nota informe">
        Son dimensiones mínimas: el diseñador decide si las toma como base o las aumenta (por ejemplo, por hojas,
        granizo o mantenimiento). Verifica existencias y medidas con el distribuidor.
      </p>

      {#if c}
        <DibujosDrenaje
          canaletaNombre={c.nombre}
          canaletaMm={c.diametroMm}
          rect={seccion && seccion.anchoMm > 0 && seccion.altoBajoMm > 0 ? seccion : null}
          pendientePct={Number(pendientePct)}
          bajanteNombre={b.nombre}
          exteriorMm={b.exteriorMm}
          interiorMm={b.interiorMm}
        />
      {/if}

      <details class="detalle">
        <summary>Ver los canales de PVC del mercado de Guatemala</summary>
<div class="bloque">
      <h3>Canales de PVC en el mercado de Guatemala</h3>
      <div class="tabla-desplazable">
        <table class="tabla mercado">
          <thead>
            <tr><th>Tipo</th><th>Marca y modelo</th><th class="extra">Largos</th><th>Bajantes</th></tr>
          </thead>
          <tbody>
            {#each CANALES_MERCADO as l (l.marca + l.modelo)}
              <tr class:sugerida={l.tipo === r.tipoCanal}>
                <td>{l.tipo === 'colonial' ? 'Colonial' : 'Alto caudal'}{l.tipo === r.tipoCanal ? ' ✓' : ''}</td>
                <td>{l.marca}: {l.modelo}</td>
                <td class="extra largos">{l.largosM.join(', ')} m</td>
                <td>{l.bajantes}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
</div>
      <p class="nota informe">
        Criterio: se sugiere canal tipo colonial cuando bastan 1 o 2 bajantes de 3" por canaleta y la sección del Canal
        Colonial (100 × 90 mm útiles) lleva el caudal de cada tramo; si no, canal de alto caudal con bajantes de 4"
        (se agregan bajantes si hace falta). Se usan las medidas de Amanco Wavin; si eliges Durman, verifica que su
        sección sea igual o mayor. Los fabricantes indican soportes cada 40 a 50 cm y una pendiente mínima de 0.2 %.
      </p>
      </details>

      {#if seccion && analisis && r && b}
        <ResultadoHidraulico
          a={analisis}
          bajanteNombre={b.nombre}
          canalNombre={seccion.nombre}
          estacionNombre={usarEstacion && cercana ? cercana.estacion.nombre : null}
          tramoM={r.tramoM}
          tramosTotales={b.total}
        />
      {/if}

      {#if seccion && entradaSim}
        <SimuladorLluvia
          entrada={entradaSim}
          nombreCanal={seccion.nombre}
          altoAltoMm={seccion.altoAltoMm}
          intensidadDiseno={intensidad}
          estacion={usarEstacion && cercana ? cercana.estacion : null}
        />
      {/if}

      <details class="detalle">
        <summary>Ver cómo se calcularon las bajantes y la canaleta</summary>
<div class="bloque">
      <h3>Bajantes: m² de techo que evacua cada diámetro</h3>
      <div class="tabla-desplazable">
        <table class="tabla">
          <thead>
            <tr><th>Diámetro</th><th class="extra">Ø interior aprox.</th><th class="extra">Capacidad</th><th>m² c/u cálculo</th><th>m² c/u fabricante</th><th>Por canaleta</th><th class="extra">Total</th></tr>
          </thead>
          <tbody>
            {#each r.bajantes as x, i (x.nombre)}
              <tr class:sugerida={i === r.bajanteSugerida} class:tenue={!x.practica}>
                <td>{x.nombre}{i === r.bajanteSugerida ? ' ✓' : ''}</td>
                <td class="extra">{x.interiorMm} mm</td>
                <td class="extra">{n2(x.capacidadLs)} L/s</td>
                <td>{n0(x.areaQueEvacuaM2)} m²</td>
                <td>{x.areaFabricanteM2 ? `${x.areaFabricanteM2} m²` : '—'}</td>
                <td>{x.porCanaleta}</td>
                <td class="extra">{x.total}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="nota informe">
        Cálculo con una lluvia de {n0(Number(intensidad))} mm/h y C = {ce}; fabricante según las tablas de Durman y Amanco
        Wavin. «Por canaleta» usa el valor más exigente de los dos. Diámetros menores a {BAJANTE_MINIMA_PRACTICA} (en gris) se
        tapan con facilidad y no se sugieren como mínimo.
      </p>
</div>

<div class="bloque">
      <h3>Opción 1 · canaleta semicircular: tramo de {n1(r.tramoM)} m con {n2(r.caudalPorTramoLs)} L/s</h3>
      <div class="tabla-desplazable">
        <table class="tabla">
          <thead>
            <tr><th>Canaleta</th><th>Capacidad</th><th>m² que sirve c/tramo</th><th>¿Cumple?</th></tr>
          </thead>
          <tbody>
            {#each r.canaletas as x, i (x.nombre)}
              <tr class:sugerida={i === r.canaletaSugerida}>
                <td>{x.nombre}{i === r.canaletaSugerida ? ' ✓' : ''}</td>
                <td>{n2(x.capacidadLs)} L/s</td>
                <td>{n0(x.areaPorTramoM2)} m²</td>
                <td>{x.cumple ? 'Sí' : 'No'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="nota informe">
        Capacidad con la ecuación de Manning, llenando la canaleta hasta 3/4 de su radio (25 % de borde libre).
        Reparte las bajantes a lo largo de la canaleta para que cada una reciba un tramo igual.
      </p>
</div>
      </details>

      <h3>Opción 2 · canal comercial: {seccion?.nombre}</h3>
      <div class="campos no-imprimir">
        <label>Canal a revisar
          <select bind:value={canalElegido}>
            <option value="sugerido">Sugerido: {SECCIONES_COMERCIALES[r.tipoCanal].nombre}</option>
            <option value="colonial">{SECCIONES_COMERCIALES.colonial.nombre}</option>
            <option value="alto">{SECCIONES_COMERCIALES.alto.nombre}</option>
            <option value="propio">Medidas propias</option>
          </select>
        </label>
        {#if canalElegido === 'propio'}
          <label>Fondo del canal (mm)
            <input type="number" min="50" max="400" step="0.1" bind:value={anchoPropio2} />
          </label>
          <label>Alto del lado más bajo (mm)
            <input type="number" min="30" max="300" step="0.1" bind:value={altoBajoPropio} />
          </label>
          <label>Alto del lado más alto (mm)
            <input type="number" min="30" max="300" step="0.1" bind:value={altoAltoPropio} />
          </label>
        {/if}
      </div>
      {#if rect && seccion && seccion.anchoMm > 0 && seccion.altoBajoMm > 0}
        <table class="cascada">
          <tbody>
            <tr><td>Sección: fondo × lado bajo (lado alto)</td><td>{n1(seccion.anchoMm)} × {n1(seccion.altoBajoMm)} mm ({n1(seccion.altoAltoMm)} mm)</td></tr>
            <tr><td>Tirante de diseño (3/4 del lado bajo)</td><td>{n1(rect.tiranteMm)} mm</td></tr>
            <tr><td>Capacidad (Manning, {MATERIALES_CANALETA[material].nombre}, {n1(Number(pendientePct))} %)</td><td>{n2(rect.capacidadLs)} L/s</td></tr>
            <tr><td>m² de techo que sirve cada tramo</td><td>{n0(rect.areaPorTramoM2)} m²</td></tr>
            <tr class="total"><td>Caudal del tramo: {n2(r.caudalPorTramoLs)} L/s</td><td>{rect.cumple ? 'Cumple' : 'No cumple'}</td></tr>
          </tbody>
        </table>
        <p class="nota informe">
          Medidas de las fichas técnicas de Amanco Wavin. El canal se calcula como un rectángulo y el agua se limita a
          3/4 del lado más bajo (25 % de borde libre). En el canal colonial, la curva decorativa da un poco más de área,
          así que el resultado queda del lado seguro.
        </p>
      {:else if canalElegido === 'propio'}
        <p class="nota">Escribe el fondo y las alturas del canal.</p>
      {/if}
    {/if}
  {/if}
</section>

<style>
  h3 { font-size: 1rem; margin: 1.25rem 0 0.4rem; }
  .cascada { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
  .cascada td { padding: 0.45rem 0.25rem; border-bottom: 1px solid var(--borde); vertical-align: top; }
  .cascada td:last-child { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .cascada .total td { font-weight: 700; border-bottom: 2px solid var(--texto); }
  .tabla-desplazable { overflow-x: auto; }
  .rejilla.modulos .total td { font-weight: 700; }
  .rejilla.modulos .detallado td { background: var(--acento-suave); }
  .bajantes-motivo { border-left: 3px solid var(--acento); padding-left: 0.6rem; }
  .tabla { width: 100%; border-collapse: collapse; font-size: 0.9rem; font-variant-numeric: tabular-nums; }
  .tabla th, .tabla td { padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--borde); text-align: right; }
  .tabla td { white-space: nowrap; }
  @media (max-width: 36rem) {
    .tabla .extra { display: none; }
    .tabla th, .tabla td { padding: 0.35rem 0.3rem; }
    .cascada { font-size: 0.9rem; }
  }
  .tabla th { color: var(--texto-suave); font-weight: 600; font-size: 0.8rem; }
  .tabla th:first-child, .tabla td:first-child { text-align: left; white-space: nowrap; }
  .tabla tr.sugerida td { background: var(--acento-suave); font-weight: 700; }
  .tabla tr.tenue td { color: var(--texto-suave); }
  .destacado .cifra { white-space: nowrap; }
  .tabla.mercado td { white-space: normal; text-align: left; }
  .tabla.mercado th { text-align: left; }
  .intensidad-caja { border: 1px solid var(--borde); border-radius: 0.75rem; padding: 0.25rem 1rem 0.75rem; margin: 1rem 0; background: var(--fondo); }
  .intensidad-caja h3 { margin-top: 0.75rem; }
  .tabla.mercado td.largos { white-space: nowrap; }
</style>
