/**
 * Informe en Word (.docx) editable, generado en el navegador a partir del mismo contenido del
 * informe PDF: recorre la página con las mismas reglas de impresión (omite lo marcado
 * .no-imprimir, las notas de uso, botones y campos) y convierte títulos, párrafos, tablas,
 * gráficas y dibujos (SVG → PNG) y mapas a un documento de Word.
 *
 * Se carga solo cuando se pide el Word (import dinámico), para no hacer más pesada la app.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  HeadingLevel,
  LineRuleType,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IBorderOptions,
  type IParagraphOptions,
  type ParagraphChild,
} from 'docx';

type Bloque = Paragraph | Table;
interface Ctx {
  centrado?: boolean;
  tamano?: number; // medio-puntos
  enTabla?: boolean;
}
interface Trozo {
  texto: string;
  negrita?: boolean;
  cursiva?: boolean;
  salto?: boolean;
  enlace?: string;
  pequeno?: boolean;
}

const FUENTE = 'Calibri';
/** Ancho útil de la hoja carta con márgenes de 2 cm, en píxeles (96 ppp). */
const ANCHO_UTIL_PX = 660;
const BLOQUE = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'TABLE', 'UL', 'OL', 'DL', 'DIV', 'SECTION', 'FIGURE', 'IMG', 'DETAILS', 'FIELDSET',
  'FORM', 'ARTICLE', 'LEGEND', 'FIGCAPTION', 'DT', 'DD', 'LI', 'HR', 'MAIN', 'HEADER', 'FOOTER', 'NAV', 'BLOCKQUOTE', 'svg',
]);
const OMITIR = new Set(['SCRIPT', 'STYLE', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY', 'DIALOG', 'HEADER', 'NAV', 'FOOTER', 'NOSCRIPT', 'TEMPLATE']);

function oculto(el: Element): boolean {
  if (OMITIR.has(el.tagName)) return true;
  const c = el.classList;
  if (c.contains('no-imprimir') || c.contains('numero-paso') || c.contains('leaflet-container')) return true;
  if (el.tagName === 'P' && c.contains('nota') && !c.contains('informe')) return true;
  return false;
}

const PANTALLA_BLOQUE = new Set(['block', 'flex', 'grid', 'list-item', 'table', 'flow-root']);
/** Es bloque por su etiqueta o por cómo se muestra en pantalla (p. ej. un <span> con display:block). */
const esBloque = (n: Node) => {
  if (n.nodeType !== 1) return false;
  const el = n as Element;
  if (BLOQUE.has(el.tagName)) return true;
  return PANTALLA_BLOQUE.has(getComputedStyle(el).display);
};

// ---------- Imágenes ----------

const PROPIEDADES_SVG = [
  'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
  'opacity', 'font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'letter-spacing',
  'visibility', 'display',
];

function cargarImagen(src: string, cors = false): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const i = new Image();
    if (cors) i.crossOrigin = 'anonymous';
    i.onload = () => ok(i);
    i.onerror = () => mal(new Error('imagen'));
    i.src = src;
  });
}

async function lienzoAPng(c: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'));
  if (!blob) throw new Error('png');
  return new Uint8Array(await blob.arrayBuffer());
}

function medidasSvg(svg: SVGSVGElement): { w: number; h: number } {
  const vb = svg.viewBox?.baseVal;
  const aw = parseFloat(svg.getAttribute('width') ?? '');
  const ah = parseFloat(svg.getAttribute('height') ?? '');
  const w = vb && vb.width ? vb.width : aw || 300;
  const h = vb && vb.height ? vb.height : ah || 150;
  return { w, h };
}

/** Dibuja un SVG de la página (con sus estilos calculados) en un lienzo. */
async function svgALienzo(svg: SVGSVGElement, escala = 2): Promise<HTMLCanvasElement> {
  const { w, h } = medidasSvg(svg);
  const copia = svg.cloneNode(true) as SVGSVGElement;
  const orig = [svg, ...svg.querySelectorAll('*')];
  const dest = [copia, ...copia.querySelectorAll('*')];
  orig.forEach((o, i) => {
    const cs = getComputedStyle(o);
    const d = dest[i] as SVGElement;
    const estilo = PROPIEDADES_SVG.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
    d.setAttribute('style', estilo + (i === 0 ? ';display:inline' : ''));
  });
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copia.setAttribute('width', String(w));
  copia.setAttribute('height', String(h));
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copia));
  const img = await cargarImagen(url);
  const c = document.createElement('canvas');
  c.width = Math.round(w * escala);
  c.height = Math.round(h * escala);
  const g = c.getContext('2d')!;
  g.scale(escala, escala);
  g.drawImage(img, 0, 0, w, h);
  return c;
}

function imagen(data: Uint8Array, w: number, h: number, maxAncho = ANCHO_UTIL_PX): ImageRun {
  const f = Math.min(1, maxAncho / w);
  return new ImageRun({ type: 'png', data, transformation: { width: Math.round(w * f), height: Math.round(h * f) } });
}

async function imagenSvg(svg: SVGSVGElement, maxAncho?: number): Promise<ImageRun | null> {
  try {
    const { w, h } = medidasSvg(svg);
    const c = await svgALienzo(svg);
    return imagen(await lienzoAPng(c), w, h, maxAncho);
  } catch {
    return null;
  }
}

async function imagenImg(el: HTMLImageElement, maxAncho: number, maxAlto = 9999): Promise<ImageRun | null> {
  try {
    const img = await cargarImagen(el.src);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    const f = Math.min(1, maxAncho / img.naturalWidth, maxAlto / img.naturalHeight);
    return imagen(await lienzoAPng(c), img.naturalWidth * f, img.naturalHeight * f, maxAncho);
  } catch {
    return null;
  }
}

/** Mapa estático: teselas (con permiso CORS del proveedor) + capa SVG de marcador, norte y escala. */
async function imagenMapa(fig: Element): Promise<ImageRun | null> {
  const lienzo = fig.querySelector<HTMLElement>('.lienzo');
  if (!lienzo) return null;
  const w = parseFloat(lienzo.style.width);
  const h = parseFloat(lienzo.style.height);
  const esc = 2;
  const c = document.createElement('canvas');
  c.width = w * esc;
  c.height = h * esc;
  const g = c.getContext('2d')!;
  g.scale(esc, esc);
  g.fillStyle = '#dde6ee';
  g.fillRect(0, 0, w, h);
  try {
    for (const t of lienzo.querySelectorAll<HTMLImageElement>('img')) {
      const img = await cargarImagen(t.src, true);
      g.drawImage(img, parseFloat(t.style.left), parseFloat(t.style.top), parseFloat(t.style.width), parseFloat(t.style.height));
    }
    const capa = lienzo.querySelector<SVGSVGElement>('svg');
    if (capa) g.drawImage(await svgALienzo(capa, 1), 0, 0, w, h);
    g.strokeStyle = '#000';
    g.strokeRect(0.5, 0.5, w - 1, h - 1);
    return imagen(await lienzoAPng(c), w, h);
  } catch {
    return null; // el proveedor de mapas no permite copiar la imagen
  }
}

// ---------- Texto ----------

function trozos(n: Node, f: Omit<Trozo, 'texto'> = {}, salida: Trozo[] = []): Trozo[] {
  if (n.nodeType === 3) {
    const t = (n.textContent ?? '').replace(/\s+/g, ' ');
    if (t) salida.push({ texto: t, ...f });
    return salida;
  }
  if (n.nodeType !== 1) return salida;
  const el = n as Element;
  if (oculto(el) || el.tagName === 'svg' || el.tagName === 'IMG') return salida;
  if (el.tagName === 'BR') {
    salida.push({ texto: '', salto: true, ...f });
    return salida;
  }
  if (salida.length && PANTALLA_BLOQUE.has(getComputedStyle(el).display)) salida.push({ texto: '', salto: true });
  const g = { ...f };
  if (el.tagName === 'STRONG' || el.tagName === 'B' || el.tagName === 'TH') g.negrita = true;
  if (el.tagName === 'EM' || el.tagName === 'I') g.cursiva = true;
  if (el.tagName === 'SMALL') g.pequeno = true;
  if (el.tagName === 'A' && (el as HTMLAnchorElement).href.startsWith('http')) g.enlace = (el as HTMLAnchorElement).href;
  el.childNodes.forEach((h) => trozos(h, g, salida));
  return salida;
}

function limpiar(ts: Trozo[]): Trozo[] {
  const r = ts.filter((t) => t.texto || t.salto);
  while (r.length && !r[0].salto && !r[0].texto.trim()) r.shift();
  while (r.length && !r.at(-1)!.salto && !r.at(-1)!.texto.trim()) r.pop();
  if (r.length && !r[0].salto) r[0] = { ...r[0], texto: r[0].texto.replace(/^\s+/, '') };
  if (r.length && !r.at(-1)!.salto) r[r.length - 1] = { ...r.at(-1)!, texto: r.at(-1)!.texto.replace(/\s+$/, '') };
  return r;
}

function corridas(ts: Trozo[], ctx: Ctx, extra: { negrita?: boolean } = {}): ParagraphChild[] {
  return limpiar(ts).map((t) => {
    const run = new TextRun({
      text: t.texto,
      break: t.salto ? 1 : undefined,
      bold: t.negrita || extra.negrita,
      italics: t.cursiva,
      size: t.pequeno ? Math.round((ctx.tamano ?? 24) * 0.85) : ctx.tamano,
      color: t.enlace ? '0B63B6' : undefined,
      underline: t.enlace ? {} : undefined,
    });
    return t.enlace ? new ExternalHyperlink({ link: t.enlace, children: [run] }) : run;
  });
}

// ---------- Conversión ----------

const BORDE: IBorderOptions = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
const SIN_BORDE: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

class Conversor {
  bloques: Bloque[] = [];
  seccion = 0;
  salto = false;

  private parrafo(hijos: ParagraphChild[], ctx: Ctx, opc: Partial<IParagraphOptions> = {}) {
    const { spacing, ...resto } = opc;
    const p = new Paragraph({
      children: hijos,
      alignment: ctx.centrado ? AlignmentType.CENTER : undefined,
      spacing: { after: ctx.enTabla ? 0 : 120, line: 264, lineRule: LineRuleType.AUTO, ...(spacing ?? {}) },
      pageBreakBefore: this.salto && !ctx.enTabla ? true : undefined,
      ...resto,
    });
    if (!ctx.enTabla) this.salto = false;
    this.bloques.push(p);
  }

  private agregar(b: Bloque, ctx: Ctx) {
    if (this.salto && !ctx.enTabla) {
      this.bloques.push(new Paragraph({ children: [], pageBreakBefore: true }));
      this.salto = false;
    }
    this.bloques.push(b);
  }

  async contenido(el: Element, ctx: Ctx): Promise<Bloque[]> {
    const previo = this.bloques;
    this.bloques = [];
    await this.hijos(el, ctx);
    const r = this.bloques;
    this.bloques = previo;
    return r;
  }

  async nodo(el: Element, ctx: Ctx): Promise<void> {
    if (oculto(el)) return;
    if (el.classList.contains('salto-impresion') && this.bloques.length) this.salto = true;
    const tag = el.tagName;

    if (el.classList.contains('logos')) return this.logos(el, ctx);
    if (el.classList.contains('mapa-estatico')) {
      const img = await imagenMapa(el);
      if (img) this.parrafo([img], { ...ctx, centrado: true }, { spacing: { after: 40 } });
      const cap = el.querySelector('figcaption');
      if (cap) this.parrafo(corridas(trozos(cap), { ...ctx, tamano: 20 }), { ...ctx, centrado: true });
      return;
    }
    if (el.classList.contains('caratula')) {
      await this.hijos(el, { ...ctx, centrado: true });
      this.salto = true;
      return;
    }

    switch (tag) {
      case 'H1':
      case 'H2': {
        let ts = trozos(el);
        if (tag === 'H2' && el.parentElement?.classList.contains('paso')) ts = [{ texto: `${++this.seccion}. ` }, ...ts];
        const enCaratula = !!el.closest('.caratula');
        this.parrafo(corridas(ts, { ...ctx, tamano: enCaratula ? 40 : undefined }), ctx, {
          heading: enCaratula ? undefined : HeadingLevel.HEADING_1,
          keepNext: true,
          spacing: { before: enCaratula ? 240 : 240, after: 120 },
        });
        return;
      }
      case 'H3':
      case 'H4':
      case 'H5':
      case 'LEGEND':
        this.parrafo(corridas(trozos(el), ctx), ctx, { heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 200, after: 100 } });
        return;
      case 'P':
      case 'FIGCAPTION':
      case 'DT':
      case 'DD':
      case 'LABEL': {
        // Un párrafo puede traer dibujos (SVG) dentro
        const svgs = [...el.querySelectorAll('svg')].filter((s) => !s.closest('.no-imprimir'));
        const ts = corridas(trozos(el), ctx, { negrita: tag === 'DT' });
        if (ts.length) this.parrafo(ts, el.classList.contains('caratula-tipo') || tag === 'FIGCAPTION' ? { ...ctx, centrado: true } : ctx);
        for (const s of svgs) {
          const img = await imagenSvg(s);
          if (img) this.parrafo([img], { ...ctx, centrado: true });
        }
        return;
      }
      case 'UL':
      case 'OL': {
        let i = 0;
        for (const li of el.children) {
          if (li.tagName !== 'LI' || oculto(li)) continue;
          i++;
          const ts = corridas(trozos(li), ctx);
          if (tag === 'UL') this.parrafo(ts, ctx, { bullet: { level: 0 } });
          else this.parrafo([new TextRun({ text: `${i}. `, size: ctx.tamano }), ...ts], ctx, { indent: { left: 360, hanging: 360 } });
        }
        return;
      }
      case 'TABLE':
        return this.tabla(el as HTMLTableElement, ctx);
      case 'DL':
        return this.listaDefiniciones(el, ctx);
      case 'IMG': {
        const img = await imagenImg(el as HTMLImageElement, 200, 90);
        if (img) this.parrafo([img], ctx);
        return;
      }
      case 'svg': {
        const img = await imagenSvg(el as unknown as SVGSVGElement);
        if (img) this.parrafo([img], { ...ctx, centrado: true });
        return;
      }
      case 'HR':
        return;
      default:
        return this.hijos(el, ctx);
    }
  }

  /** Contenedor: agrupa el texto suelto en párrafos y procesa los bloques. */
  async hijos(el: Element, ctx: Ctx): Promise<void> {
    let sueltos: Node[] = [];
    const vaciar = () => {
      if (!sueltos.length) return;
      const ts: Trozo[] = [];
      sueltos.forEach((n) => trozos(n, {}, ts));
      const runs = corridas(ts, ctx);
      if (runs.length) this.parrafo(runs, ctx);
      sueltos = [];
    };
    for (const n of el.childNodes) {
      if (esBloque(n)) {
        vaciar();
        await this.nodo(n as Element, ctx);
      } else if (n.nodeType === 1 && (n as Element).querySelector?.('svg, table, p, div') && !oculto(n as Element)) {
        vaciar();
        await this.hijos(n as Element, ctx);
      } else sueltos.push(n);
    }
    vaciar();
  }

  private async tabla(t: HTMLTableElement, ctx: Ctx) {
    const sinBordes = t.classList.contains('ficha-informe');
    const filas: TableRow[] = [];
    for (const tr of t.rows) {
      if (oculto(tr)) continue;
      const enCabeza = tr.parentElement?.tagName === 'THEAD';
      const celdas: TableCell[] = [];
      for (const td of tr.cells) {
        if (oculto(td)) continue;
        const hijosCelda = await this.contenido(td, { ...ctx, enTabla: true, tamano: 20, centrado: false });
        const esTh = td.tagName === 'TH';
        celdas.push(
          new TableCell({
            children: hijosCelda.length ? hijosCelda : [new Paragraph('')],
            columnSpan: td.colSpan > 1 ? td.colSpan : undefined,
            shading: (enCabeza || (esTh && !sinBordes)) && !sinBordes ? { type: ShadingType.CLEAR, color: 'auto', fill: 'E3F0FA' } : undefined,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
          }),
        );
      }
      if (celdas.length) filas.push(new TableRow({ children: celdas, tableHeader: enCabeza, cantSplit: true }));
    }
    if (!filas.length) return;
    const b = sinBordes ? SIN_BORDE : BORDE;
    this.agregar(
      new Table({
        rows: filas,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b },
      }),
      ctx,
    );
    this.bloques.push(new Paragraph({ children: [], spacing: { after: 80 } }));
  }

  private async listaDefiniciones(dl: Element, ctx: Ctx) {
    const filas: TableRow[] = [];
    let dt: Element | null = null;
    for (const h of dl.children) {
      if (h.tagName === 'DT') dt = h;
      else if (h.tagName === 'DD' && dt) {
        const dd = await this.contenido(h, { ...ctx, enTabla: true });
        filas.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: corridas(trozos(dt), ctx, { negrita: true }) })], width: { size: 28, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: dd.length ? dd : [new Paragraph('')], width: { size: 72, type: WidthType.PERCENTAGE } }),
            ],
          }),
        );
        dt = null;
      }
    }
    if (filas.length)
      this.agregar(
        new Table({
          rows: filas,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE },
        }),
        ctx,
      );
  }

  /** Fila de logotipos de la carátula: CaptaLluvia a la izquierda, organizaciones a la derecha. */
  private async logos(el: Element, ctx: Ctx) {
    const app = el.querySelector('.logo-app');
    const izq: ParagraphChild[] = [];
    const gota = app?.querySelector('svg');
    if (gota) {
      const i = await imagenSvg(gota as SVGSVGElement, 40);
      if (i) izq.push(i, new TextRun({ text: '  ' }));
    }
    if (app) izq.push(...corridas(trozos(app), { tamano: 18 }));
    const der: ParagraphChild[] = [];
    for (const img of el.querySelectorAll<HTMLImageElement>(':scope > img')) {
      const i = await imagenImg(img, 160, 64);
      if (i) der.push(i);
    }
    const nb = { top: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE };
    this.agregar(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: izq })], borders: { ...nb, bottom: { style: BorderStyle.SINGLE, size: 12, color: '0B63B6' } } }),
              new TableCell({
                children: [new Paragraph({ children: der, alignment: AlignmentType.RIGHT })],
                borders: { ...nb, bottom: { style: BorderStyle.SINGLE, size: 12, color: '0B63B6' } },
              }),
            ],
          }),
        ],
      }),
      ctx,
    );
  }
}

/** Genera el informe en Word a partir de lo que está en la página. */
export async function generarInformeWord(opciones: { titulo: string; cita: string; autor: string }): Promise<Blob> {
  const c = new Conversor();
  const raiz = document.querySelector('#app') ?? document.body;
  await c.hijos(raiz, {});

  const pie = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Si modifica este documento, conserve la referencia: ', italics: true, size: 16 }),
          new TextRun({ text: opciones.cita, size: 16 }),
        ],
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES], size: 16 })] }),
    ],
  });

  const doc = new Document({
    creator: opciones.autor,
    title: opciones.titulo,
    description: 'Informe técnico generado con CaptaLluvia',
    styles: {
      default: { document: { run: { font: FUENTE, size: 24, color: '000000' }, paragraph: { spacing: { line: 264, lineRule: LineRuleType.AUTO } } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 32, bold: true, color: '000000' } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 28, bold: true, color: '000000' } },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        footers: { default: pie },
        children: c.bloques,
      },
    ],
  });
  return Packer.toBlob(doc);
}
