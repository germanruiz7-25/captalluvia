<script lang="ts">
  import { areaMinimaM2, opcionesDeTecho, type ModuloMedido, type NumeroAguas } from '../core/techo';
  import type { ResumenOferta } from '../core/oferta';
  import type { ResumenDemanda } from '../core/demanda';
  import type { EvaluacionTecho } from '../core/techoTanque';
  import { MESES_LARGOS } from '../core/lluvia';
  import { listaMeses } from '../core/informe';
  import DibujoTecho from './DibujoTecho.svelte';

  let {
    oferta,
    demanda,
    aguas,
    modulosExistentes = [],
    evaluacion = null,
    areaNecesaria = null,
  }: {
    oferta: ResumenOferta | null;
    demanda: ResumenDemanda;
    aguas: NumeroAguas;
    modulosExistentes?: ModuloMedido[];
    evaluacion?: EvaluacionTecho | null;
    /** Techo ideal (o, sin periodo crítico, el del balance anual), m². */
    areaNecesaria?: number | null;
  } = $props();

  const existente = $derived(evaluacion?.existenteM2 ?? null);
  const consumoMes = $derived(demanda.m3Anual / 12);
  const nTemporada = $derived(evaluacion?.mesesTemporada.length ?? 0);
  const consumoTemporada = $derived(consumoMes * nTemporada);
  const pnTemporada = $derived(oferta && evaluacion ? evaluacion.mesesTemporada.reduce((t, m) => t + oferta.netaMensualMm[m], 0) : 0);
  const temporadaTexto = $derived.by(() => {
    const m = evaluacion?.mesesTemporada ?? [];
    if (!m.length) return '';
    if (m.length === 12) return 'todo el año';
    return `de ${MESES_LARGOS[m[0]].toLowerCase()} a ${MESES_LARGOS[m[m.length - 1]].toLowerCase()}`;
  });
  // Sin techo: medidas del techo ideal. Con techo que no alcanza: medidas del módulo que falta.
  const areaDibujo = $derived(
    existente === null ? areaNecesaria : evaluacion && evaluacion.faltaIdealM2 > 0 ? evaluacion.faltaIdealM2 : null,
  );
  const opciones = $derived(areaDibujo ? opcionesDeTecho(areaDibujo) : []);
  // Respaldo sin periodo crítico (0 días): balance anual
  const exactaAnual = $derived(oferta ? areaMinimaM2(demanda.m3Anual, oferta.netaAnualMm) : null);

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
  const textoExistente = $derived(
    existente === null
      ? ''
      : `${n1(existente)} m²${modulosExistentes.length > 1 ? ` (${modulosExistentes.length} módulos)` : ''}`,
  );
</script>

<section class="tarjeta paso">
  <p class="numero-paso">Paso 5 de 8</p>
  <h2>Área de techo ideal</h2>

  {#if !oferta}
    <p class="nota">Completa el paso 1 para ver los resultados.</p>
  {:else if demanda.m3Anual <= 0}
    <p class="nota">Indica los usuarios y los litros por día en el paso 4.</p>
  {:else if areaNecesaria === null}
    <p class="alerta">Con esta lluvia no queda lluvia neta aprovechable; no es posible dimensionar el techo.</p>
  {:else if evaluacion && evaluacion.idealM2 !== null && evaluacion.soloLlenarM2 !== null}
    <div class="destacado">
      <span class="cifra">{n0(evaluacion.idealM2)} m²</span>
      <span>
        de <strong>techo ideal</strong> (medido en planta): cubre el consumo durante la temporada de lluvia
        ({temporadaTexto}) y llena al 100 % el tanque de {n1(demanda.m3Critico)} m³ para los
        {n0(demanda.diasCriticos)} días críticos de la época seca{existente === null && evaluacion.mesLleno !== null ? ` (se llena en ${MESES_LARGOS[evaluacion.mesLleno].toLowerCase()})` : ''}.
      </span>
    </div>

    <div class="tabla-desplazable">
      <table class="rejilla">
        <thead><tr><th>Agua que debe captar el techo en la temporada</th><th>Volumen</th></tr></thead>
        <tbody>
          <tr><td>Consumo mientras llueve ({nTemporada} meses × {n1(consumoMes)} m³)</td><td>{n1(consumoTemporada)} m³</td></tr>
          <tr><td>Tanque lleno al 100 % ({n0(demanda.diasCriticos)} días críticos)</td><td>{n1(demanda.m3Critico)} m³</td></tr>
          <tr class="total"><td>Total</td><td>{n1(consumoTemporada + demanda.m3Critico)} m³</td></tr>
        </tbody>
      </table>
    </div>
    <div class="tabla-desplazable">
      <table class="rejilla">
        <thead><tr><th>Techo</th><th>m² en planta</th></tr></thead>
        <tbody>
          <tr class="sugerida"><td><strong>Ideal</strong>: consumo de la temporada + tanque lleno</td><td><strong>{n0(evaluacion.idealM2)} m²</strong></td></tr>
          <tr><td>Mínimo para solo llenar el tanque, sin usar el agua mientras llueve</td><td>{n0(evaluacion.soloLlenarM2)} m²</td></tr>
          {#if existente !== null}
            <tr><td>Techo existente{modulosExistentes.length > 1 ? ` (${modulosExistentes.length} módulos)` : ''}</td><td>{n1(existente)} m²</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
    <p class="nota informe">
      Cada m² de techo capta {n0(pnTemporada)} L en la temporada (suma de la PN de los meses de captación). El techo
      ideal se calcula mes a mes, con el tanque vacío al inicio de la temporada: la lluvia de cada mes cubre primero el
      consumo y el excedente entra al tanque, hasta llenarlo; el agua que no cabe se rebalsa. Por eso no es
      exactamente {n1(consumoTemporada + demanda.m3Critico)} m³ ÷ {n0(pnTemporada)} L/m²: depende de cómo se reparte la
      lluvia en los meses.
    </p>

    {#if evaluacion.estado === 'ideal'}
      <p class="ok">
        ✅ El techo existente de {textoExistente} alcanza: cubre el consumo durante la temporada de lluvia y llena el
        tanque{evaluacion.mesLleno !== null ? ` en ${MESES_LARGOS[evaluacion.mesLleno].toLowerCase()}` : ''} para la época seca.
      </p>
    {:else if evaluacion.estado === 'soloLlenar'}
      <div class="aviso">
        <p>
          ⚠️ El techo existente de {textoExistente} alcanza para <strong>llenar el tanque</strong>, pero no para cubrir
          también el consumo de la temporada de lluvia. Faltan <strong>{n0(evaluacion.faltaIdealM2)} m²</strong> para el
          techo ideal.
        </p>
        <p>
          <strong>Recomendación:</strong> durante la época lluviosa no uses el agua del tanque
          {#if evaluacion.litrosDiaPosibles && evaluacion.litrosDiaPosibles >= 1}
            o limita el consumo a unos {n0(evaluacion.litrosDiaPosibles)} L por día
            ({n0((evaluacion.litrosDiaPosibles / evaluacion.litrosDiaDemanda) * 100)} % de la demanda)
          {/if}
          para que se llene, a menos que se agreguen {n0(evaluacion.faltaIdealM2)} m² de techo de captación.
        </p>
      </div>
    {:else if evaluacion.estado === 'insuficiente'}
      <div class="alerta-caja">
        <p>
          ❌ El techo existente de {textoExistente} no llena el tanque ni sin usar el agua mientras llueve: llega al
          {n0(evaluacion.fraccionLlenado * 100)} % de los {n1(demanda.m3Critico)} m³.
        </p>
        <p>
          Faltan <strong>{n0(evaluacion.faltaLlenarM2)} m²</strong> para llenarlo (sin usarlo en la temporada) y
          <strong>{n0(evaluacion.faltaIdealM2)} m²</strong> para el techo ideal. Otra opción: reducir los días críticos o los
          litros por usuario en el paso 4.
        </p>
      </div>
    {/if}

    {#if evaluacion.mesesProteger.length && evaluacion.estado !== 'insuficiente'}
      <p class="nota proteger">
        💧 Ya con el tanque lleno, en {listaMeses(evaluacion.mesesProteger)} la lluvia no cubre todo el consumo: usa en
        esos meses el agua que llueve y no saques del tanque, para conservar completa la reserva de los
        {n0(demanda.diasCriticos)} días críticos.
      </p>
    {/if}

    {#if opciones.length}
<div class="bloque">
      <h3>{existente === null ? 'Medidas sugeridas del techo ideal' : `Medidas sugeridas para el módulo que falta (${n0(areaDibujo ?? 0)} m²)`}</h3>
      <DibujoTecho {opciones} {aguas} />
</div>
    {/if}
  {:else}
    <!-- Sin periodo crítico (0 días): balance anual -->
    <div class="destacado">
      <span class="cifra">{n0(areaNecesaria)} m²</span>
      <span>
        de techo como mínimo (medido en planta) para captar los {n1(demanda.m3Anual)} m³ que se necesitan al año
        con {n0(oferta.netaAnualMm)} mm de lluvia neta. Cálculo exacto: {n1(exactaAnual ?? 0)} m².
      </span>
    </div>
<div class="bloque">
    <h3>Medidas sugeridas del techo</h3>
    <DibujoTecho opciones={opcionesDeTecho(areaNecesaria)} {aguas} />
</div>
  {/if}
</section>

<style>
  h3 { font-size: 1rem; margin: 1.25rem 0 0.5rem; }
  .ok { color: #067647; font-weight: 600; }
  .proteger { border-left: 3px solid var(--acento); padding-left: 0.6rem; }
  .aviso, .alerta-caja { border-radius: 0.75rem; padding: 0.25rem 1rem; margin: 1rem 0; }
  .aviso { background: #fffaeb; border: 1px solid #fec84b; }
  .alerta-caja { background: #fef3f2; border: 1px solid #fda29b; }
  .rejilla .total td { font-weight: 700; }
  .rejilla td:last-child { text-align: right; white-space: nowrap; }
  .tabla-desplazable { overflow-x: auto; }
  .rejilla .sugerida td { background: var(--acento-suave); }
</style>
