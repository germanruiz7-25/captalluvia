/**
 * Presentación ejecutiva (PowerPoint, .pptx) de 10 diapositivas con los resultados principales del diseño.
 * Se genera en el navegador con pptxgenjs; las gráficas son nativas de PowerPoint (editables) y los
 * dibujos y el mapa se toman de la página como imágenes. Se carga solo al pedir la presentación.
 */
import PptxGenJS from 'pptxgenjs';
import type { DatosDrenajeInforme, DatosTanqueInforme } from '../core/informe';
import type { ResumenDemanda } from '../core/demanda';
import { mapaALienzo, medidasSvg, svgALienzo } from './rasterizar';

export interface DatosPresentacion {
  nombreArchivo: string;
  lugar: string;
  tipo: string;
  comunidad: string;
  municipio: string;
  departamento: string;
  pais: string;
  lat: number | null;
  lon: number | null;
  elaboradoPor: string;
  institucion: string;
  fecha: string;
  version: string;
  cita: string;
  logoUrl: string | null;
  lluvia: { mensualMm: number[]; anualMm: number; fuente: string; anios: number } | null;
  oferta: {
    pnMensualMm: number[];
    netaMensualMm: number[];
    mesesCaptados: boolean[];
    netaAnualMm: number;
    ce: number;
    efc: number;
    cc: number;
    umbralMm: number;
    mesesLavado: number[];
    lavadoMm: number;
  } | null;
  material: string;
  demanda: ResumenDemanda;
  techo: {
    existenteM2: number | null;
    necesariaM2: number | null;
    usadaM2: number | null;
    captadoAnualM3: number | null;
    /** Techo mínimo para solo llenar el tanque y recomendación (desde v0.9.0). */
    soloLlenarM2?: number | null;
    modulos?: number;
    recomendacion?: string | null;
  };
  drenaje: DatosDrenajeInforme | null;
  idf: { estacion: string; km: number; filas: { tr: number; i5: number }[] } | null;
  tanque: (DatosTanqueInforme & { llenadosPorMes?: number[] }) | null;
  conclusiones: string[];
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Paleta sobria: azul marino, azul agua, gris pizarra y un acento verde agua para lo positivo
const C = { marino: '0B2F52', azul: '0B63B6', claro: 'E3F0FA', gris: '5B6B7A', texto: '1F2A36', linea: 'C9D6E2', acento: '1B998B', blanco: 'FFFFFF' };
const F = 'Calibri';

const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
const n1 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n2 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctTexto = (p: number) =>
  p > 0.995 ? '> 99 %' : p >= 0.1 ? `${Math.round(p * 100)} %` : `${(p * 100).toLocaleString('es-GT', { maximumFractionDigits: 1 })} %`;

async function svgDataUrl(svg: SVGSVGElement | null): Promise<{ data: string; w: number; h: number } | null> {
  if (!svg) return null;
  try {
    const { w, h } = medidasSvg(svg);
    const c = await svgALienzo(svg, 3);
    return { data: c.toDataURL('image/png'), w, h };
  } catch {
    return null;
  }
}

async function imagenUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url);
    const b = await r.blob();
    return await new Promise((ok) => {
      const fr = new FileReader();
      fr.onload = () => ok(String(fr.result));
      fr.readAsDataURL(b);
    });
  } catch {
    return null;
  }
}

/** Ajusta una imagen dentro de un recuadro conservando su proporción. */
function encajar(w: number, h: number, caja: { x: number; y: number; w: number; h: number }) {
  const f = Math.min(caja.w / w, caja.h / h);
  const ww = w * f;
  const hh = h * f;
  return { x: caja.x + (caja.w - ww) / 2, y: caja.y + (caja.h - hh) / 2, w: ww, h: hh };
}

const GOTA_SVG =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="256" height="256"><path d="M16 3c5 7 9 12 9 17a9 9 0 0 1-18 0c0-5 4-10 9-17z" fill="#0b63b6"/><path d="M11 21a5 5 0 0 0 5 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  );

async function gotaPng(): Promise<string | null> {
  try {
    const img = new Image();
    await new Promise((ok, mal) => {
      img.onload = ok;
      img.onerror = mal;
      img.src = GOTA_SVG;
    });
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    c.getContext('2d')!.drawImage(img, 0, 0, 256, 256);
    return c.toDataURL('image/png');
  } catch {
    return null;
  }
}

export async function generarPresentacion(d: DatosPresentacion): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 in
  pptx.author = d.elaboradoPor || 'CaptaLluvia';
  pptx.company = 'CaptaLluvia';
  pptx.title = `SCALL – ${d.lugar}`;
  pptx.theme = { headFontFace: F, bodyFontFace: F };

  const gota = await gotaPng();
  const logo = await imagenUrl(d.logoUrl);
  const ubic = [d.comunidad, d.municipio, d.departamento, d.pais].map((x) => x.trim()).filter(Boolean).join(', ');
  const coord = d.lat !== null && d.lon !== null ? `${d.lat.toFixed(5)}, ${d.lon.toFixed(5)}` : '—';

  // Imágenes de la página
  const mapaFig = document.querySelectorAll('.ubicacion-proyecto .mapa-estatico')[1] ?? document.querySelector('.ubicacion-proyecto .mapa-estatico');
  const mapaCanvas = mapaFig ? await mapaALienzo(mapaFig, 3) : null;
  const mapa = mapaCanvas ? { data: mapaCanvas.toDataURL('image/png'), w: mapaCanvas.width / 3, h: mapaCanvas.height / 3 } : null;
  const atribucionMapa = document.querySelector('.ubicacion-proyecto .atribucion')?.textContent?.trim() ?? '';
  const cortes = [...document.querySelectorAll<SVGSVGElement>('svg[aria-label^="Corte de"]')];
  const corteCanal = await svgDataUrl(cortes.find((s) => !/semicircular|tubo/i.test(s.getAttribute('aria-label') ?? '')) ?? cortes.find((s) => /canaleta/i.test(s.getAttribute('aria-label') ?? '')) ?? null);
  const corteTubo = await svgDataUrl(cortes.find((s) => /tubo/i.test(s.getAttribute('aria-label') ?? '')) ?? null);
  const tinaco = await svgDataUrl(document.querySelector<SVGSVGElement>('figure.tinacos svg'));
  const barril = await svgDataUrl(document.querySelector<SVGSVGElement>('figure.barril svg'));
  const cisterna = await svgDataUrl(document.querySelector<SVGSVGElement>('figure.cisterna svg'));

  const total = 10;
  let numero = 0;

  /** Diapositiva con título, línea de acento, logos pequeños y pie con el número. */
  function diapositiva(titulo: string, subtitulo?: string) {
    numero++;
    const s = pptx.addSlide();
    s.background = { color: C.blanco };
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: C.azul }, line: { color: C.azul } });
    s.addText(titulo, { x: 0.55, y: 0.3, w: 10.6, h: 0.65, fontFace: F, fontSize: 28, bold: true, color: C.marino, margin: 0 });
    if (subtitulo) s.addText(subtitulo, { x: 0.55, y: 0.92, w: 10.6, h: 0.4, fontFace: F, fontSize: 14, color: C.gris, margin: 0 });
    s.addShape(pptx.ShapeType.line, { x: 0.55, y: 1.38, w: 12.2, h: 0, line: { color: C.linea, width: 1 } });
    if (logo) s.addImage({ data: logo, x: 11.45, y: 0.3, w: 1.4, h: 0.61 });
    if (gota) s.addImage({ data: gota, x: 0.55, y: 7.0, w: 0.28, h: 0.28 });
    s.addText(`CaptaLluvia · ${d.lugar}`, { x: 0.9, y: 6.98, w: 9, h: 0.32, fontFace: F, fontSize: 10, color: C.gris, margin: 0 });
    s.addText(`${numero} / ${total}`, { x: 11.8, y: 6.98, w: 1.0, h: 0.32, fontFace: F, fontSize: 10, color: C.gris, align: 'right', margin: 0 });
    return s;
  }

  /** Tarjeta de cifra (valor grande y etiqueta). */
  function tarjeta(s: PptxGenJS.Slide, x: number, y: number, w: number, valor: string, etiqueta: string, color = C.azul) {
    s.addShape(pptx.ShapeType.rect, { x, y, w, h: 1.25, fill: { color: 'F4F8FC' }, line: { color: C.linea, width: 0.75 } });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h: 1.25, fill: { color }, line: { color } });
    s.addText(valor, { x: x + 0.2, y: y + 0.1, w: w - 0.3, h: 0.62, fontFace: F, fontSize: 24, bold: true, color: C.marino, margin: 0, fit: 'shrink' });
    s.addText(etiqueta, { x: x + 0.2, y: y + 0.72, w: w - 0.3, h: 0.45, fontFace: F, fontSize: 12, color: C.gris, margin: 0, valign: 'top' });
  }

  function parrafos(s: PptxGenJS.Slide, textos: string[], caja: { x: number; y: number; w: number; h: number }, tam = 15, vinetas = true) {
    s.addText(
      textos.map((t) => ({ text: t, options: { bullet: vinetas ? { indent: 16 } : undefined, paraSpaceAfter: 8, breakLine: true } })),
      { ...caja, fontFace: F, fontSize: tam, color: C.texto, valign: 'top', margin: 0.05 },
    );
  }

  const tablaOpc = (x: number, y: number, w: number, colW: number[]) => ({
    x,
    y,
    w,
    colW,
    fontFace: F,
    fontSize: 12,
    color: C.texto,
    border: { type: 'solid' as const, pt: 0.75, color: C.linea },
    margin: 0.05,
    valign: 'middle' as const,
  });
  const cab = (t: string) => ({ text: t, options: { bold: true, fill: { color: C.claro }, color: C.marino, align: 'center' as const } });

  // 1. Portada -----------------------------------------------------------------------------------
  {
    numero++;
    const s = pptx.addSlide();
    s.background = { color: C.blanco };
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 4.35, fill: { color: C.marino }, line: { color: C.marino } });
    if (gota) s.addImage({ data: gota, x: 0.7, y: 0.55, w: 0.62, h: 0.62 });
    s.addText('CaptaLluvia · Diseño de sistemas de cosecha de agua de lluvia', { x: 1.45, y: 0.6, w: 9, h: 0.5, fontFace: F, fontSize: 14, color: 'BFD6EA', margin: 0 });
    s.addText('Sistema de Captación de Agua de Lluvia (SCALL)', { x: 0.7, y: 1.55, w: 11.9, h: 0.6, fontFace: F, fontSize: 20, color: 'BFD6EA', margin: 0 });
    s.addText(d.lugar, { x: 0.7, y: 2.15, w: 11.9, h: 1.1, fontFace: F, fontSize: 40, bold: true, color: C.blanco, margin: 0, fit: 'shrink' });
    s.addText(`${d.tipo} · ${n0(d.demanda.usuarios)} usuarios`, { x: 0.7, y: 3.3, w: 11.9, h: 0.5, fontFace: F, fontSize: 18, color: C.blanco, margin: 0 });
    if (logo) {
      s.addShape(pptx.ShapeType.roundRect, { x: 10.55, y: 4.75, w: 2.25, h: 1.15, fill: { color: C.blanco }, line: { color: C.linea }, rectRadius: 0.08 });
      s.addImage({ data: logo, x: 10.7, y: 4.85, w: 1.95, h: 0.85 });
    }
    const filas: [string, string][] = [
      ['Ubicación', ubic || '—'],
      ['Coordenadas (lat, lon)', coord],
      ['Elaborado por', `${d.elaboradoPor || '—'}${d.institucion ? ` · ${d.institucion}` : ''}`],
      ['Fecha de diseño', d.fecha],
    ];
    s.addTable(
      filas.map(([a, b]) => [
        { text: a, options: { bold: true, color: C.marino } },
        { text: b, options: { color: C.texto } },
      ]),
      { x: 0.7, y: 4.7, w: 9.4, colW: [2.6, 6.8], fontFace: F, fontSize: 15, border: { type: 'none' }, margin: 0.04 },
    );
    s.addText(`Generado con CaptaLluvia v${d.version}`, { x: 0.7, y: 6.95, w: 8, h: 0.3, fontFace: F, fontSize: 10, color: C.gris, margin: 0 });
  }

  // 2. Introducción -------------------------------------------------------------------------------
  {
    const s = diapositiva('Introducción', 'Agua de lluvia para garantizar el abastecimiento en la época seca');
    const lluviaTxt = d.lluvia ? `${n0(d.lluvia.anualMm)} mm de lluvia al año` : 'la lluvia del lugar';
    parrafos(
      s,
      [
        `El proyecto propone captar, conducir y almacenar el agua de lluvia del techo de ${d.lugar} para ${n0(d.demanda.usuarios)} usuarios.`,
        `Con ${lluviaTxt} y un coeficiente de captación de ${d.oferta ? d.oferta.cc.toFixed(3) : '—'}, el techo puede aportar ${d.techo.captadoAnualM3 !== null ? `${n1(d.techo.captadoAnualM3)} m³` : 'agua'} al año.`,
        `El tanque se dimensiona para garantizar ${n0(d.demanda.diasCriticos)} días de consumo en los meses más secos, cuando el agua es más escasa.`,
        'El diseño integra lluvia satelital o de estaciones, curvas IDF para canaletas y bajantes, y un balance mensual del tanque.',
      ],
      { x: 0.6, y: 1.65, w: 7.3, h: 4.8 },
      17,
    );
    tarjeta(s, 8.4, 1.75, 4.4, `${n0(d.demanda.usuarios)}`, 'usuarios atendidos');
    tarjeta(s, 8.4, 3.2, 4.4, d.techo.captadoAnualM3 !== null ? `${n1(d.techo.captadoAnualM3)} m³` : '—', 'agua captable al año', C.acento);
    tarjeta(s, 8.4, 4.65, 4.4, d.tanque ? `${n1(d.tanque.volumenM3)} m³` : '—', `almacenamiento para ${n0(d.demanda.diasCriticos)} días de época seca`);
  }

  // 3. Localización -------------------------------------------------------------------------------
  {
    const s = diapositiva('Localización del proyecto', ubic || undefined);
    const caja = { x: 0.6, y: 1.6, w: 7.6, h: 5.15 };
    if (mapa) {
      const r = encajar(mapa.w, mapa.h, caja);
      s.addImage({ data: mapa.data, ...r });
    } else {
      s.addShape(pptx.ShapeType.rect, { ...caja, fill: { color: 'F4F8FC' }, line: { color: C.linea } });
      s.addText('Mapa no disponible: ver la sección 2 del informe en PDF', { ...caja, align: 'center', valign: 'middle', fontFace: F, fontSize: 14, color: C.gris });
    }
    const filas: [string, string][] = [
      ['Lugar', d.lugar],
      ['Tipo', d.tipo],
      ['Comunidad', d.comunidad || '—'],
      ['Municipio', d.municipio || '—'],
      ['Departamento', d.departamento || '—'],
      ['País', d.pais || '—'],
      ['Coordenadas', `${coord} (WGS 84)`],
    ];
    s.addTable(
      filas.map(([a, b]) => [{ text: a, options: { bold: true, color: C.marino } }, { text: b }]),
      { ...tablaOpc(8.55, 1.7, 4.25, [1.45, 2.8]), fontSize: 13 },
    );
    s.addText(`Punto marcado por quien elaboró el diseño. Imagen: ${atribucionMapa.replace(/^Mapas:\s*/, '') || 'proveedor de mapas'}.`, {
      x: 8.55, y: 5.75, w: 4.25, h: 0.9, fontFace: F, fontSize: 10, color: C.gris, valign: 'top', margin: 0,
    });
  }

  // 4. Precipitación neta ----------------------------------------------------------------------------
  if (d.lluvia && d.oferta) {
    const o = d.oferta;
    const s = diapositiva('Lluvia y precipitación neta (PN)', `PN = P × Cc · Cc = Ce × Efc = ${o.ce} × ${o.efc} = ${o.cc.toFixed(3)} (${d.material.toLowerCase()})`);
    s.addChart(
      pptx.ChartType.bar,
      [
        { name: 'Precipitación promedio P (mm)', labels: MESES, values: d.lluvia.mensualMm.map((x) => Math.round(x)) },
        { name: 'Precipitación neta PN (mm)', labels: MESES, values: o.pnMensualMm.map((x) => Math.round(x)) },
      ],
      {
        x: 0.6, y: 1.55, w: 8.2, h: 3.75, barDir: 'col', barGrouping: 'clustered', chartColors: ['9CC3E6', C.azul],
        showLegend: true, legendPos: 'b', legendFontFace: F, legendFontSize: 11, catAxisLabelFontFace: F, catAxisLabelFontSize: 11,
        valAxisLabelFontFace: F, valAxisLabelFontSize: 10, valGridLine: { color: 'E5EBF1', size: 0.5 }, showValAxisTitle: true,
        valAxisTitle: 'mm', valAxisTitleFontSize: 11, barGapWidthPct: 60,
      },
    );
    tarjeta(s, 9.15, 1.6, 3.65, `${n0(d.lluvia.anualMm)} mm`, 'lluvia promedio al año');
    tarjeta(s, 9.15, 3.0, 3.65, `${n0(o.netaAnualMm)} mm`, 'PN aprovechable al año (L/m²)', C.acento);
    s.addText(
      `Época seca (sin captar; sus lluvias lavan el sistema): ${o.mesesLavado.length ? `${MESES[o.mesesLavado[0]]}–${MESES[o.mesesLavado[o.mesesLavado.length - 1]]}, ${n0(o.lavadoMm)} mm` : 'no hay meses bajo el umbral'}.`,
      { x: 9.15, y: 4.4, w: 3.65, h: 0.9, fontFace: F, fontSize: 12, color: C.texto, valign: 'top', margin: 0 },
    );
    const fila = (nombre: string, v: number[]) => [{ text: nombre, options: { bold: true, color: C.marino } }, ...v.map((x) => ({ text: n0(x), options: { align: 'center' as const } }))];
    s.addTable(
      [[cab('mm'), ...MESES.map(cab)], fila('P', d.lluvia.mensualMm), fila('PN', o.pnMensualMm)],
      { ...tablaOpc(0.6, 5.5, 12.2, [1.4, ...Array(12).fill(0.9)]), fontSize: 11 },
    );
    s.addText(`Fuente: ${d.lluvia.fuente}${d.lluvia.anios ? ` · ${d.lluvia.anios} años de registro` : ''}.`, {
      x: 0.6, y: 6.62, w: 12.2, h: 0.3, fontFace: F, fontSize: 9, color: C.gris, margin: 0,
    });
  } else diapositiva('Lluvia y precipitación neta (PN)', 'Sin datos de lluvia');

  // 5. Demanda -----------------------------------------------------------------------------------
  {
    const dm = d.demanda;
    const s = diapositiva('Demanda de agua', `${n0(dm.usuarios)} usuarios × ${n1(dm.litrosPorUsuarioDia)} L por día`);
    tarjeta(s, 0.6, 1.65, 3.9, `${n2(dm.m3Mensual)} m³`, 'demanda mensual (Dj)');
    tarjeta(s, 4.7, 1.65, 3.9, `${n1(dm.m3Anual)} m³`, `demanda anual (${n0(dm.diasUso)} días de uso)`);
    tarjeta(s, 8.8, 1.65, 4.0, `${n1(dm.m3Critico)} m³`, `${n0(dm.diasCriticos)} días críticos a garantizar`, C.acento);
    const filasDemanda: string[][] = [
      ['Diaria', `${n0(dm.usuarios)} × ${n1(dm.litrosPorUsuarioDia)} L`, n2(dm.litrosDia / 1000), n0(dm.litrosDia)],
      ['Mensual (Dj)', `${n0(dm.usuarios)} × ${n1(dm.litrosPorUsuarioDia)} L × 30.4 días ÷ 1000`, n2(dm.m3Mensual), n0(dm.m3Mensual * 1000)],
      ['Anual', `${n0(dm.usuarios)} × ${n1(dm.litrosPorUsuarioDia)} L × ${n0(dm.diasUso)} días ÷ 1000`, n1(dm.m3Anual), n0(dm.m3Anual * 1000)],
      ['Periodo crítico', `${n0(dm.usuarios)} × ${n1(dm.litrosPorUsuarioDia)} L × ${n0(dm.diasCriticos)} días ÷ 1000 (${n1(dm.mesesCriticos)} meses)`, n1(dm.m3Critico), n0(dm.m3Critico * 1000)],
    ];
    s.addTable(
      [
        [cab('Demanda'), cab('Cálculo'), cab('m³'), cab('Litros')],
        ...filasDemanda.map((f) => f.map((t, j) => ({ text: t, options: { align: (j >= 2 ? 'right' : 'left') as 'right' | 'left', bold: j === 0 } }))),
      ],
      { ...tablaOpc(0.6, 3.25, 12.2, [2.2, 6.6, 1.5, 1.9]), fontSize: 13 },
    );
    s.addText(
      'El tanque se dimensiona para los meses críticos de la época seca (casi siempre marzo y abril), porque almacenar la demanda de todo el año requeriría volúmenes muy grandes.',
      { x: 0.6, y: 5.75, w: 12.2, h: 0.8, fontFace: F, fontSize: 14, color: C.texto, italic: true, margin: 0 },
    );
  }

  // 6. Techo -------------------------------------------------------------------------------------
  {
    const t = d.techo;
    const s = diapositiva('Techo de captación', `${d.material} · Ce ${d.oferta?.ce ?? '—'} · coeficiente de captación ${d.oferta ? d.oferta.cc.toFixed(3) : '—'}`);
    const ideal = t.soloLlenarM2 != null;
    tarjeta(s, 0.6, 1.65, 3.9, t.necesariaM2 !== null ? `${n0(t.necesariaM2)} m²` : '—', ideal ? 'techo ideal: consumo de la temporada + tanque lleno' : 'techo necesario para la demanda anual');
    tarjeta(s, 4.7, 1.65, 3.9, t.existenteM2 !== null ? `${n1(t.existenteM2)} m²` : 'no indicado', t.modulos && t.modulos > 1 ? `techo existente (${t.modulos} módulos)` : 'techo existente');
    tarjeta(s, 8.8, 1.65, 4.0, t.captadoAnualM3 !== null ? `${n1(t.captadoAnualM3)} m³` : '—', 'agua captable al año', C.acento);
    let rec: string;
    if (t.recomendacion) rec = t.recomendacion;
    else if (t.existenteM2 !== null && t.necesariaM2 !== null) {
      rec =
        t.existenteM2 + 1e-9 >= t.necesariaM2
          ? `El techo existente (${n1(t.existenteM2)} m²) es suficiente: supera los ${n0(t.necesariaM2)} m² necesarios para cubrir la demanda anual.`
          : `El techo existente (${n1(t.existenteM2)} m²) no alcanza: faltan ${n0(t.necesariaM2 - t.existenteM2)} m² para cubrir la demanda anual de ${n1(d.demanda.m3Anual)} m³. Puede ampliarse el techo o priorizar el consumo de la época seca.`;
    } else if (t.necesariaM2 !== null) {
      rec = `Se recomienda un techo de al menos ${n0(t.necesariaM2)} m² medidos en planta para cubrir la demanda anual de ${n1(d.demanda.m3Anual)} m³.`;
    } else rec = 'Indica los datos del techo para obtener la recomendación.';
    parrafos(
      s,
      [
        rec,
        `Lluvia neta aprovechable: ${d.oferta ? n0(d.oferta.netaAnualMm) : '—'} litros por cada m² de techo al año.` +
          (t.soloLlenarM2 != null ? ` Techo mínimo para solo llenar el tanque: ${n0(t.soloLlenarM2)} m².` : ''),
        'Material: superficies lisas e impermeables (lámina, lona) escurren más que las porosas (teja, palma) o las cubiertas vegetales.',
        'Mantenimiento: limpiar techo y canaletas antes de la temporada de lluvia; las primeras lluvias se dejan correr para lavar el sistema.',
      ],
      { x: 0.6, y: 3.3, w: 12.2, h: 3.4 },
      16,
    );
  }

  // 7. Canaletas, bajantes e IDF ------------------------------------------------------------------
  {
    const r = d.drenaje;
    const s = diapositiva('Canaletas y bajantes', r ? `${r.tipoCanal} · ${r.bajantesTotal} bajante${r.bajantesTotal === 1 ? '' : 's'} de ${r.bajanteNombre}` : 'Sin datos de drenaje');
    if (r) {
      const filas: [string, string][] = [
        ['Canal recomendado', `${r.tipoCanal}: ${r.lineasCanal}`],
        r.modulos && r.modulos.length > 1
          ? ['Canaletas', `${n1(r.longitudCanaletaM)} m en ${r.modulos.length} módulos, pendiente ${n1(r.pendientePct)} %`]
          : ['Canaletas', `${r.numeroCanaletas} × ${n1(r.longitudCanaletaM / r.numeroCanaletas)} m, pendiente ${n1(r.pendientePct)} %`],
        r.modulos && r.modulos.length > 1
          ? ['Bajantes', `${r.bajantesTotal} en total (${r.modulos.map((m) => `${m.nombre.toLowerCase()}: ${m.bajantes}`).join('; ')})`]
          : ['Bajantes', `${r.bajantesTotal} de ${r.bajanteNombre} (${r.bajantesPorCanaleta} por canaleta${r.tramoM ? `, una cada ${n1(r.tramoM)} m` : ''})`],
        ['Lluvia de diseño', `${n0(r.intensidadMmH)} mm/h (aguacero de 5 min)`],
        ['Capacidad por tramo', r.capacidadSistemaLs ? `${n2(r.capacidadSistemaLs)} L/s = ${n0(r.capacidadSistemaLs * 60)} L/min` : `${n2(r.capacidadCanalLs)} L/s`],
        ['Soporta sin rebalsar', `hasta ${n0(Math.min(r.rebalsaMmH, r.bajanteSaturaMmH))} mm/h`],
      ];
      s.addTable(
        filas.map(([a, b]) => [{ text: a, options: { bold: true, color: C.marino } }, { text: b }]),
        { ...tablaOpc(0.6, 1.6, 6.3, [2.1, 4.2]), fontSize: 12 },
      );
      const cajaCanal = { x: 0.6, y: 4.75, w: 3.1, h: 1.95 };
      const cajaTubo = { x: 3.8, y: 4.75, w: 3.1, h: 1.95 };
      if (corteCanal) s.addImage({ data: corteCanal.data, ...encajar(corteCanal.w, corteCanal.h, cajaCanal) });
      if (corteTubo) s.addImage({ data: corteTubo.data, ...encajar(corteTubo.w, corteTubo.h, cajaTubo) });
    }
    if (d.idf) {
      s.addText(`Curva IDF: estación ${d.idf.estacion} (a ${n1(d.idf.km)} km) · aguacero de 5 minutos`, {
        x: 7.25, y: 1.6, w: 5.55, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: C.marino, margin: 0,
      });
      const capacidad = r ? Math.min(r.rebalsaMmH, r.bajanteSaturaMmH) : Infinity;
      s.addTable(
        [
          [cab('Periodo de retorno'), cab('Intensidad 5 min'), cab('Prob. en 1 año'), cab('Prob. en 10 años'), cab('¿Rebalsa?')],
          ...d.idf.filas.map((f) => {
            const p1 = 1 / f.tr;
            const p10 = 1 - Math.pow(1 - p1, 10);
            const rebalsa = f.i5 > capacidad;
            return [
              { text: `${f.tr} años`, options: { bold: true } },
              { text: `${n0(f.i5)} mm/h`, options: { align: 'right' as const } },
              { text: pctTexto(p1), options: { align: 'right' as const } },
              { text: pctTexto(p10), options: { align: 'right' as const } },
              { text: rebalsa ? 'Sí' : 'No', options: { align: 'center' as const, color: rebalsa ? 'B42318' : C.acento, bold: true } },
            ];
          }),
        ],
        { ...tablaOpc(7.25, 2.05, 5.55, [1.25, 1.2, 1.0, 1.1, 1.0]), fontSize: 11 },
      );
      s.addText(
        'La probabilidad de que en un año cualquiera ocurra un aguacero igual o mayor es 1/T (T = periodo de retorno). En n años: 1 − (1 − 1/T)ⁿ. Por ejemplo, el de 50 años tiene 2 % cada año y 18 % en 10 años.',
        { x: 7.25, y: 4.75, w: 5.55, h: 1.6, fontFace: F, fontSize: 12, color: C.texto, valign: 'top', margin: 0 },
      );
      s.addText('Fuente: INSIVUMEH e ICC (2025), curvas IDF de Guatemala.', { x: 7.25, y: 6.4, w: 5.55, h: 0.3, fontFace: F, fontSize: 9, color: C.gris, margin: 0 });
    } else {
      s.addText('Sin curva IDF cercana: la intensidad de diseño se indicó a mano.', { x: 7.25, y: 1.6, w: 5.55, h: 0.6, fontFace: F, fontSize: 13, color: C.gris, margin: 0 });
    }
  }

  // 8. Tanque ------------------------------------------------------------------------------------
  {
    const t = d.tanque;
    const s = diapositiva('Tanque de almacenamiento', t ? `${n1(t.volumenM3)} m³ para garantizar ${n0(d.demanda.diasCriticos)} días de consumo en la época seca` : 'Sin datos del tanque');
    if (t) {
      tarjeta(s, 0.6, 1.65, 3.9, `${n1(t.volumenM3)} m³`, `${n0(t.volumenM3 * 1000)} litros de almacenamiento`);
      tarjeta(s, 4.7, 1.65, 3.9, t.tanque.replace(/^1 tanque de /, ''), 'tanque de polietileno sugerido', C.acento);
      tarjeta(s, 8.8, 1.65, 4.0, t.barriles ? `${n0(t.barriles)} barriles` : '—', 'equivalencia en barriles de 55 galones (208 L)');
      if (tinaco) s.addImage({ data: tinaco.data, ...encajar(tinaco.w, tinaco.h, { x: 0.6, y: 3.15, w: 3.6, h: 2.6 }) });
      if (barril) s.addImage({ data: barril.data, ...encajar(barril.w, barril.h, { x: 4.4, y: 3.15, w: 3.9, h: 2.6 }) });
      if (cisterna) s.addImage({ data: cisterna.data, ...encajar(cisterna.w, cisterna.h, { x: 8.6, y: 3.05, w: 4.2, h: 2.8 }) });
      s.addText(
        [
          { text: 'Alternativa con materiales convencionales: ', options: { bold: true } },
          { text: `cisterna de block y cemento de ${t.cisterna} (medidas interiores), con repello impermeabilizante, losa de fondo y tapadera.` },
        ],
        { x: 0.6, y: 5.95, w: 12.2, h: 0.8, fontFace: F, fontSize: 14, color: C.texto, margin: 0 },
      );
    }
  }

  // 9. Llenados del tanque -------------------------------------------------------------------------
  {
    const t = d.tanque;
    const s = diapositiva('¿Cuántas veces se llena el tanque?', t?.capacidadTanqueL ? `Con la lluvia de cada mes y ${t ? n1(t.areaTechoM2) : '—'} m² de techo · tanque de ${n0(t.capacidadTanqueL)} L` : undefined);
    if (t?.llenadosPorMes) {
      s.addChart(
        pptx.ChartType.bar,
        [{ name: 'Llenados del tanque', labels: MESES, values: t.llenadosPorMes.map((x) => Math.round(x * 100) / 100) }],
        {
          x: 0.6, y: 1.55, w: 8.3, h: 4.6, barDir: 'col', chartColors: [C.azul], showLegend: false, showValue: true,
          dataLabelFontSize: 10, dataLabelFormatCode: '0.0', dataLabelPosition: 'outEnd', catAxisLabelFontFace: F, catAxisLabelFontSize: 11,
          valAxisLabelFontSize: 10, valGridLine: { color: 'E5EBF1', size: 0.5 }, showValAxisTitle: true, valAxisTitle: 'veces', barGapWidthPct: 50,
        },
      );
      tarjeta(s, 9.2, 1.65, 3.6, `${n1(t.llenadosAnual ?? 0)} veces`, 'se llena el tanque con la lluvia del año', C.acento);
      parrafos(
        s,
        [
          'Un valor de 1 o más indica que la lluvia del mes llena el tanque completo; menos de 1, un llenado parcial.',
          'En la temporada de lluvia el agua puede usarse a diario.',
          'Clave: que el tanque quede lleno al terminar la temporada para cubrir los meses críticos.',
        ],
        { x: 9.2, y: 3.1, w: 3.6, h: 3.4 },
        13,
      );
    }
  }

  // 10. Conclusiones y fuente ---------------------------------------------------------------------
  {
    const s = diapositiva('Conclusiones');
    parrafos(s, d.conclusiones.slice(0, 6), { x: 0.6, y: 1.6, w: 12.2, h: 4.2 }, 14);
    s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 5.95, w: 12.2, h: 0.85, fill: { color: C.claro }, line: { color: C.claro } });
    s.addText(
      [
        { text: 'Fuente: ', options: { bold: true, color: C.marino } },
        { text: d.cita },
      ],
      { x: 0.75, y: 6.0, w: 11.9, h: 0.75, fontFace: F, fontSize: 11, color: C.texto, valign: 'middle', margin: 0 },
    );
  }

  await pptx.writeFile({ fileName: d.nombreArchivo });
}
