<script lang="ts">
  /**
   * Resumen ejecutivo de 2 hojas: hoja 1, tablero con los datos generales y los resultados principales;
   * hoja 2, cuadro resumen del diseño. Gota y logotipo del ICC arriba, cita de la herramienta al pie.
   * Se imprime solo (PDF) o se convierte a Word con el mismo contenido.
   */
  import { cuadroResumen, type DatosInforme } from '../core/informe';
  import type { ResumenLluvia } from '../core/lluvia';
  import type { ResumenOferta } from '../core/oferta';
  import type { ResumenDemanda } from '../core/demanda';
  import GraficoMensual from './GraficoMensual.svelte';
  import MapaEstatico from './MapaEstatico.svelte';
  import { CLAVES_COMPILADAS, capaInicial, capasDisponibles } from '../core/capasMapa';

  let {
    datos,
    lugar,
    tipo,
    elaboradoPor,
    institucion,
    ubicacion,
    lat,
    lon,
    fecha,
    lluvia,
    oferta,
    demanda,
    cita,
    nombreApp,
    subtitulo,
    logos,
    base,
  }: {
    datos: DatosInforme;
    lugar: string;
    tipo: string;
    elaboradoPor: string;
    institucion: string;
    ubicacion: string;
    lat: string;
    lon: string;
    fecha: string;
    lluvia: ResumenLluvia | null;
    oferta: ResumenOferta | null;
    demanda: ResumenDemanda;
    cita: string;
    nombreApp: string;
    subtitulo: string;
    logos: { archivo: string; nombre: string }[];
    base: string;
  } = $props();

  const capa = capaInicial(capasDisponibles(CLAVES_COMPILADAS), null);
  const la = $derived(Number(lat));
  const lo = $derived(Number(lon));
  const hayPunto = $derived(lat !== '' && lon !== '' && Number.isFinite(la) && Number.isFinite(lo));
  const secciones = $derived(cuadroResumen(datos));
  const t = $derived(datos.tanque ?? null);
  const dr = $derived(datos.drenaje ?? null);

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const c5 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
  const area = $derived(t?.areaTechoM2 ?? datos.areaNecesariaM2 ?? null);
  const captadoM3 = $derived(oferta && area ? (oferta.netaAnualMm * area) / 1000 : null);
</script>

{#snippet encabezado()}
  <div class="enc logos">
    <div class="app logo-app">
      <svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true">
        <path d="M16 3c5 7 9 12 9 17a9 9 0 0 1-18 0c0-5 4-10 9-17z" fill="#0b63b6" />
        <path d="M11 21a5 5 0 0 0 5 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>
      <span><strong>{nombreApp}</strong><br />{subtitulo}</span>
    </div>
    {#each logos as l (l.archivo)}
      <img src={`${base}${l.archivo}`} alt={l.nombre} />
    {/each}
  </div>
{/snippet}

{#snippet pie(n: number)}
  <p class="pie-hoja"><strong>Fuente:</strong> {cita} · Hoja {n} de 2</p>
{/snippet}

<div class="resumen-ejecutivo" aria-hidden="true">
  <section class="hoja">
    {@render encabezado()}
    <p class="tipo-doc">Resumen del diseño · Sistema de Captación de Agua de Lluvia (SCALL)</p>
    <h1 class="lugar">{lugar}</h1>
    <p class="sub">{tipo} · {n0(demanda.usuarios)} usuarios · Elaborado por {elaboradoPor || '—'}{institucion ? ` (${institucion})` : ''}</p>

    <div class="generales lado-a-lado">
      <table class="ficha">
        <tbody>
          <tr><th>Ubicación</th><td>{ubicacion || '—'}</td></tr>
          <tr><th>Coordenadas</th><td>{hayPunto ? `${c5(la)}, ${c5(lo)}` : '—'}</td></tr>
          <tr><th>Tipo de infraestructura</th><td>{tipo}</td></tr>
          <tr><th>Usuarios y dotación</th><td>{n0(demanda.usuarios)} × {n1(demanda.litrosPorUsuarioDia)} L/día</td></tr>
          <tr><th>Fecha de diseño</th><td>{fecha}</td></tr>
          <tr><th>Fuente de la lluvia</th><td>{lluvia ? lluvia.fuente : '—'}</td></tr>
        </tbody>
      </table>
      {#if hayPunto}
        <div class="mapa"><MapaEstatico lat={la} lon={lo} zoom={17} {capa} ancho={260} alto={190} titulo="Ubicación del proyecto" /></div>
      {/if}
    </div>

    <div class="kpis">
      <div class="kpi"><span class="v cifra">{lluvia ? n0(lluvia.anualMm) : '—'} mm</span><span class="e">lluvia promedio al año</span></div>
      <div class="kpi"><span class="v cifra">{oferta ? n0(oferta.netaAnualMm) : '—'} mm</span><span class="e">precipitación neta (PN = P × {oferta ? oferta.cc.toFixed(3) : 'Cc'})</span></div>
      <div class="kpi"><span class="v cifra">{area ? n0(area) : '—'} m²</span><span class="e">{t?.origenArea === 'existente' ? `techo existente${datos.criterioTecho?.idealM2 ? `; ideal ${n0(datos.criterioTecho.idealM2)} m²` : ''}` : datos.criterioTecho ? 'techo ideal (consumo + tanque lleno)' : 'techo necesario'}</span></div>
    </div>
    <div class="kpis">
      <div class="kpi"><span class="v cifra">{captadoM3 !== null ? n1(captadoM3) : '—'} m³</span><span class="e">agua captable al año</span></div>
      <div class="kpi"><span class="v cifra">{n1(demanda.m3Mensual)} m³</span><span class="e">demanda mensual (Dj); {n1(demanda.m3Anual)} m³ al año</span></div>
      <div class="kpi"><span class="v cifra">{t ? n1(t.volumenM3) : '—'} m³</span><span class="e">tanque para {n0(demanda.diasCriticos)} días de época seca</span></div>
    </div>
    <div class="kpis">
      <div class="kpi"><span class="v cifra">{t ? t.tanque.replace(/^1 tanque de /, '') : '—'}</span><span class="e">tanque comercial{t?.barriles ? ` (${n0(t.barriles)} barriles de 55 gal)` : ''}</span></div>
      <div class="kpi"><span class="v cifra">{t?.llenadosAnual !== undefined ? `${n1(t.llenadosAnual)} veces` : '—'}</span><span class="e">se llena el tanque con la lluvia del año</span></div>
      <div class="kpi"><span class="v cifra">{dr ? dr.bajanteNombre : '—'}</span><span class="e">{dr ? `${dr.tipoCanal.toLowerCase()}, ${dr.bajantesTotal} bajante${dr.bajantesTotal === 1 ? '' : 's'}` : 'canaletas y bajantes'}</span></div>
    </div>

    {#if lluvia && oferta}
      <div class="grafica">
        <p class="titulo-grafica">Precipitación promedio y precipitación neta (PN) por mes, mm</p>
        <GraficoMensual brutaMm={lluvia.mensualMm} netaMm={oferta.pnMensualMm} captados={oferta.mesesCaptados} umbralMm={oferta.umbralMm || null} />
      </div>
    {/if}
    {@render pie(1)}
  </section>

  <section class="hoja salto-impresion">
    {@render encabezado()}
    <h2 class="titulo-cuadro">Cuadro resumen del diseño</h2>
    <div class="columnas">
      {#each secciones as s (s.titulo)}
        <table class="cuadro">
          <tbody>
            <tr class="sec"><th colspan="2">{s.titulo}</th></tr>
            {#each s.filas as [etiqueta, valor] (etiqueta)}
              <tr><td>{etiqueta}</td><td>{valor}</td></tr>
            {/each}
          </tbody>
        </table>
      {/each}
    </div>
    <p class="aviso">Herramienta de apoyo para prediseño: no sustituye la revisión de un profesional.</p>
    {@render pie(2)}
  </section>
</div>

<style>
  .resumen-ejecutivo { display: none; font-family: Calibri, Carlito, 'Segoe UI', sans-serif; color: #000; }
  .hoja { display: flex; flex-direction: column; height: 246mm; box-sizing: border-box; padding: 0 2mm; overflow: hidden; }
  .enc { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0b63b6; padding-bottom: 6px; margin-bottom: 10px; }
  .app { display: flex; gap: 8px; align-items: center; font-size: 10pt !important; line-height: 1.2; }
  .app span, .app strong, .pie-hoja strong { font-size: inherit !important; }
  .enc img { height: 46px; width: auto; }
  .tipo-doc { text-align: center; letter-spacing: 0.08em; text-transform: uppercase; font-size: 9.5pt !important; font-weight: 700; margin: 4mm 0 1mm; color: #0b2f52; }
  .lugar { text-align: center; font-size: 18pt !important; margin: 0 0 1mm; }
  .sub { text-align: center; font-size: 11pt !important; margin: 0 0 4mm; }
  .generales { display: flex; gap: 6mm; justify-content: center; align-items: flex-start; margin-bottom: 4mm; }
  .ficha { border-collapse: collapse; font-size: 10pt !important; width: 100%; max-width: 110mm; }
  .ficha th { text-align: left; font-weight: 600; padding: 1.2mm 3mm 1.2mm 0; vertical-align: top; white-space: nowrap; }
  .ficha td { padding: 1.2mm 0; border-bottom: 1px solid #ddd; }
  .mapa :global(figcaption) { font-size: 8pt !important; }
  .kpis { display: flex; gap: 3mm; justify-content: center; margin-bottom: 3mm; }
  .kpi {
    flex: 1 1 0; border: 1px solid #b9cfe4; border-left: 4px solid #0b63b6; border-radius: 2mm; padding: 2mm 3mm;
    display: flex; flex-direction: column; text-align: center; background: #f3f8fc;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .kpi .v { font-size: 14pt !important; font-weight: 700; color: #0b2f52 !important; }
  .kpi .e { font-size: 9pt !important; }
  .grafica { margin-top: 2mm; text-align: center; }
  .titulo-grafica { font-size: 10pt !important; font-weight: 600; margin: 0 0 1mm; }
  .grafica :global(svg) { max-width: 110mm; max-height: 72mm; height: auto; }
  .titulo-cuadro { text-align: center; font-size: 15pt !important; margin: 2mm 0 3mm; }
  .columnas { column-count: 2; column-gap: 6mm; }
  .cuadro { width: 100%; border-collapse: collapse; margin: 0 0 3mm; break-inside: avoid; }
  .cuadro td { padding: 0.5mm 1.2mm; border-bottom: 1px solid #ddd; vertical-align: top; font-size: 8.5pt !important; line-height: 1.2; }
  .cuadro td:first-child { width: 42%; font-weight: 600; }
  .cuadro .sec th {
    text-align: left; background: #e3f0fa; padding: 1mm 1.2mm; font-size: 9pt !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .aviso { font-size: 8.5pt !important; font-style: italic; margin-top: 2mm; }
  .pie-hoja { margin-top: auto; border-top: 1px solid #999; padding-top: 2mm; font-size: 8pt !important; text-align: center; }
</style>
