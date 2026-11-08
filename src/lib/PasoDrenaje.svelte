<script lang="ts">
  import DibujosDrenaje from './DibujosDrenaje.svelte';
  import {
    BAJANTE_MINIMA_PRACTICA,
    CANAL_ALTO_CAUDAL_WAVIN,
    CANALES_MERCADO,
    evaluarCanalRectangular,
    EQUIVALENTE_MAX_COLONIAL_MM,
    MATERIALES_CANALETA,
    NOMBRES_TIPO_CANAL,
    disenarDrenaje,
    type MaterialCanaleta,
  } from '../core/drenaje';
  import { COEFICIENTES_ESCORRENTIA, type NumeroAguas, type OpcionTecho, type TipoTecho } from '../core/techo';

  let {
    opciones,
    aguas,
    tipoTecho,
  }: { opciones: OpcionTecho[]; aguas: NumeroAguas; tipoTecho: TipoTecho } = $props();

  // Parámetros de diseño (editables por el diseñador)
  let techoElegido = $state('rectangular');
  let largoPropio: number | null = $state(null);
  let anchoPropio: number | null = $state(null);
  let intensidad = $state(150);
  let pendientePct = $state(0.5);
  let material: MaterialCanaleta = $state('pvc');
  // Opción 2: canal rectangular (por defecto, el Canal Alto Caudal de Amanco Wavin)
  let anchoRect = $state(CANAL_ALTO_CAUDAL_WAVIN.anchoMm);
  let altoFrente = $state(CANAL_ALTO_CAUDAL_WAVIN.altoFrenteMm);
  let altoPosterior = $state(CANAL_ALTO_CAUDAL_WAVIN.altoPosteriorMm);
  const esWavin = $derived(
    Number(anchoRect) === CANAL_ALTO_CAUDAL_WAVIN.anchoMm &&
      Number(altoFrente) === CANAL_ALTO_CAUDAL_WAVIN.altoFrenteMm &&
      Number(altoPosterior) === CANAL_ALTO_CAUDAL_WAVIN.altoPosteriorMm,
  );
  const nombreRect = $derived(esWavin ? CANAL_ALTO_CAUDAL_WAVIN.nombre : 'Medidas propias');

  const techo = $derived.by(() => {
    if (techoElegido === 'propio') {
      const l = Number(largoPropio) || 0;
      const a = Number(anchoPropio) || 0;
      return l > 0 && a > 0 ? { largo: Math.max(l, a), ancho: Math.min(l, a), nombre: 'Medidas propias' } : null;
    }
    const o = opciones.find((x) => x.forma === techoElegido) ?? opciones[1] ?? opciones[0];
    return o ? { largo: o.largo, ancho: o.ancho, nombre: o.nombre } : null;
  });

  const ce = $derived(COEFICIENTES_ESCORRENTIA[tipoTecho]);
  const r = $derived(
    techo
      ? disenarDrenaje({
          areaM2: techo.largo * techo.ancho,
          largoM: techo.largo,
          aguas,
          c: ce,
          intensidadMmH: Number(intensidad) || 0,
          pendientePct: Number(pendientePct) || 0,
          material,
        })
      : null,
  );
  const b = $derived(r ? r.bajantes[r.bajanteSugerida] : null);
  const c = $derived(r && r.canaletaSugerida >= 0 ? r.canaletas[r.canaletaSugerida] : null);
  const rect = $derived(
    r
      ? evaluarCanalRectangular(
          { anchoMm: Number(anchoRect) || 0, altoFrenteMm: Number(altoFrente) || 0 },
          r.caudalPorTramoLs,
          Number(pendientePct) || 0,
          material,
          ce,
          Number(intensidad) || 0,
        )
      : null,
  );

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const n2 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<section class="tarjeta paso">
  <p class="numero-paso">Paso 5 de 5</p>
  <h2>Canaletas y bajantes</h2>

  {#if opciones.length === 0}
    <p class="nota">Completa los pasos anteriores para dimensionar canaletas y bajantes.</p>
  {:else}
    <div class="campos no-imprimir">
      <label>Techo a drenar
        <select bind:value={techoElegido}>
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
      <label>Intensidad de lluvia de diseño (mm/h)
        <input type="number" min="10" max="400" step="5" bind:value={intensidad} />
      </label>
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
    <p class="nota no-imprimir">
      La intensidad de diseño debe tomarse de la curva intensidad-duración-frecuencia (IDF) de la estación más
      cercana (INSIVUMEH en Guatemala), para una lluvia de 5 minutos y un periodo de retorno de 5 a 10 años.
      150 mm/h es solo un valor de partida.
    </p>

    {#if !techo || !r || !b}
      <p class="nota">Escribe el largo y el ancho del techo.</p>
    {:else}
      <p class="solo-impresion">
        Parámetros: techo {techo.nombre.toLowerCase()} de {n1(techo.ancho)} × {n1(techo.largo)} m, intensidad de diseño
        {n0(Number(intensidad))} mm/h, C = {ce}, canaleta de {MATERIALES_CANALETA[material].nombre} con
        pendiente de {n1(Number(pendientePct))} %.
      </p>

      <table class="cascada">
        <tbody>
          <tr><td>Techo a drenar ({techo.nombre.toLowerCase()})</td><td>{n1(techo.ancho)} × {n1(techo.largo)} m = {n1(techo.ancho * techo.largo)} m²</td></tr>
          <tr><td>Canaletas ({aguas === 2 ? 'una por cada agua' : 'un agua'})</td><td>{r.numeroCanaletas} × {n1(techo.largo)} m = {n1(r.longitudTotalCanaletaM)} m</td></tr>
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
          un tramo de {n1(r.tramoM)} m.
          {#if c}
            La sección útil del canal no debe ser menor que una canaleta semicircular de {c.nombre} con pendiente de
            {n1(Number(pendientePct))} %.
          {:else}
            Ni la canaleta semicircular más grande de la lista alcanza: agrega más bajantes o aumenta la pendiente.
          {/if}
        </span>
      </div>
      <p class="nota">
        Son dimensiones mínimas: el diseñador decide si las toma como base o las aumenta (por ejemplo, por hojas,
        granizo o mantenimiento). Verifica existencias y medidas con el distribuidor.
      </p>

      {#if c}
        <DibujosDrenaje
          canaletaNombre={c.nombre}
          canaletaMm={c.diametroMm}
          rect={{ nombre: nombreRect, anchoMm: Number(anchoRect) || 0, altoFrenteMm: Number(altoFrente) || 0, altoPosteriorMm: Number(altoPosterior) || 0 }}
          pendientePct={Number(pendientePct)}
          bajanteNombre={b.nombre}
          exteriorMm={b.exteriorMm}
          interiorMm={b.interiorMm}
        />
      {/if}

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
      <p class="nota">
        Criterio: se sugiere canal tipo colonial cuando bastan 1 o 2 bajantes de 3" por canaleta y la sección
        equivalente no pasa de 5" ({EQUIVALENTE_MAX_COLONIAL_MM / 10} cm); si no, canal de
        alto caudal con bajantes de 4". Los fabricantes indican soportes cada 40 a 50 cm y una pendiente mínima de 0.2 %.
      </p>

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
      <p class="nota">
        Cálculo con una lluvia de {n0(Number(intensidad))} mm/h y C = {ce}; fabricante según las tablas de Durman y Amanco
        Wavin. «Por canaleta» usa el valor más exigente de los dos. Diámetros menores a {BAJANTE_MINIMA_PRACTICA} (en gris) se
        tapan con facilidad y no se sugieren como mínimo.
      </p>

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
      <p class="nota">
        Capacidad con la ecuación de Manning, llenando la canaleta hasta 3/4 de su radio (25 % de borde libre).
        Reparte las bajantes a lo largo de la canaleta para que cada una reciba un tramo igual.
      </p>

      <h3>Opción 2 · canal rectangular: {nombreRect}</h3>
      <div class="campos no-imprimir">
        <label>Fondo o ancho (mm)
          <input type="number" min="50" max="400" step="0.1" bind:value={anchoRect} />
        </label>
        <label>Alto del frente, lado bajo (mm)
          <input type="number" min="30" max="300" step="0.1" bind:value={altoFrente} />
        </label>
        <label>Alto del lado de la pared (mm)
          <input type="number" min="30" max="300" step="0.1" bind:value={altoPosterior} />
        </label>
      </div>
      {#if rect}
        <table class="cascada">
          <tbody>
            <tr><td>Sección</td><td>{n1(Number(anchoRect))} × {n1(Number(altoFrente))} mm (pared {n1(Number(altoPosterior))} mm)</td></tr>
            <tr><td>Tirante de diseño (3/4 del frente)</td><td>{n1(rect.tiranteMm)} mm</td></tr>
            <tr><td>Capacidad (Manning, {MATERIALES_CANALETA[material].nombre}, {n1(Number(pendientePct))} %)</td><td>{n2(rect.capacidadLs)} L/s</td></tr>
            <tr><td>m² de techo que sirve cada tramo</td><td>{n0(rect.areaPorTramoM2)} m²</td></tr>
            <tr class="total"><td>Caudal del tramo: {n2(r.caudalPorTramoLs)} L/s</td><td>{rect.cumple ? 'Cumple' : 'No cumple'}</td></tr>
          </tbody>
        </table>
        <p class="nota">
          Medidas por defecto del Canal Alto Caudal de Amanco Wavin (ficha técnica). Puedes escribir las de otro canal
          rectangular. El agua se limita a 3/4 del frente, que es el lado más bajo (25 % de borde libre).
        </p>
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
  .tabla.mercado td.largos { white-space: nowrap; }
</style>
