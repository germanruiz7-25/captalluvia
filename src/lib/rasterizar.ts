/**
 * Rasterización de dibujos de la página (SVG con sus estilos calculados), imágenes y mapas estáticos a
 * lienzos y PNG. La usan el informe en Word y la presentación.
 */
const PROPIEDADES_SVG = [
  'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
  'opacity', 'font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'letter-spacing',
  'visibility', 'display',
];

export function cargarImagen(src: string, cors = false): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const i = new Image();
    if (cors) i.crossOrigin = 'anonymous';
    i.onload = () => ok(i);
    i.onerror = () => mal(new Error('imagen'));
    i.src = src;
  });
}

export async function lienzoAPng(c: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'));
  if (!blob) throw new Error('png');
  return new Uint8Array(await blob.arrayBuffer());
}

export function medidasSvg(svg: SVGSVGElement): { w: number; h: number } {
  const vb = svg.viewBox?.baseVal;
  const aw = parseFloat(svg.getAttribute('width') ?? '');
  const ah = parseFloat(svg.getAttribute('height') ?? '');
  const w = vb && vb.width ? vb.width : aw || 300;
  const h = vb && vb.height ? vb.height : ah || 150;
  return { w, h };
}

/** Tamaño con que se ve el dibujo en el PDF: el ancho del atributo (si es en px) o el de su viewBox. */
export function tamanoVisible(svg: SVGSVGElement): { w: number; h: number } {
  const { w, h } = medidasSvg(svg);
  const attr = svg.getAttribute('width') ?? '';
  const aw = /^\d+(\.\d+)?(px)?$/.test(attr) ? parseFloat(attr) : NaN;
  const mw = getComputedStyle(svg).maxWidth;
  const maxCss = mw.endsWith('px') ? parseFloat(mw) : NaN;
  let ancho = Number.isFinite(aw) ? aw : w;
  if (Number.isFinite(maxCss) && maxCss > 0) ancho = Math.min(ancho, maxCss);
  return { w: ancho, h: (ancho * h) / w };
}

/** Dibuja un SVG de la página (con sus estilos calculados) en un lienzo. */
export async function svgALienzo(svg: SVGSVGElement, escala = 2): Promise<HTMLCanvasElement> {
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


/** Mapa estático (.mapa-estatico): teselas con permiso CORS del proveedor + capa SVG de marcador, norte y escala. */
export async function mapaALienzo(fig: Element, esc = 2): Promise<HTMLCanvasElement | null> {
  const lienzo = fig.querySelector<HTMLElement>('.lienzo');
  if (!lienzo) return null;
  const w = parseFloat(lienzo.style.width);
  const h = parseFloat(lienzo.style.height);
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
    c.toDataURL(); // falla aquí si el proveedor no permite copiar la imagen (CORS)
    return c;
  } catch {
    return null;
  }
}
