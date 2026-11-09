/**
 * Mapa estático para el informe: arma el mosaico de teselas (Web Mercator) que cubre un recuadro
 * de ancho × alto píxeles centrado en el punto. Se dibuja con <img> comunes, que se imprimen
 * sin depender de Leaflet.
 */

export interface Tesela {
  url: string;
  /** Posición de la esquina superior izquierda dentro del recuadro (px). */
  izquierda: number;
  arriba: number;
  /** Tamaño en pantalla (px). */
  lado: number;
}

export interface OpcionesMapaEstatico {
  lat: number;
  lon: number;
  zoom: number;
  ancho: number;
  alto: number;
  /** Plantilla con {z}, {x}, {y} (y {s} opcional). */
  url: string;
  tileSize?: number;
  zoomOffset?: number;
}

/** Píxel del mundo (Web Mercator) para un zoom con teselas de 256 px. */
export function pixelMundo(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const escala = 256 * Math.pow(2, zoom);
  const sen = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * escala,
    y: (0.5 - Math.log((1 + sen) / (1 - sen)) / (4 * Math.PI)) * escala,
  };
}

export function teselasMapa(o: OpcionesMapaEstatico): Tesela[] {
  const lado = o.tileSize ?? 256;
  const zReq = o.zoom + (o.zoomOffset ?? 0);
  const n = Math.pow(2, zReq);
  // Con teselas de 512 px y zoomOffset −1 la escala del mundo es la misma que con 256 px al zoom pedido
  const c = pixelMundo(o.lat, o.lon, o.zoom);
  const x0 = c.x - o.ancho / 2;
  const y0 = c.y - o.alto / 2;
  const tx0 = Math.floor(x0 / lado);
  const ty0 = Math.floor(y0 / lado);
  const tx1 = Math.floor((x0 + o.ancho - 1) / lado);
  const ty1 = Math.floor((y0 + o.alto - 1) / lado);
  const r: Tesela[] = [];
  for (let ty = ty0; ty <= ty1; ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = tx0; tx <= tx1; tx++) {
      const x = ((tx % n) + n) % n;
      r.push({
        url: o.url.replace('{s}', 'a').replace('{z}', String(zReq)).replace('{x}', String(x)).replace('{y}', String(ty)),
        izquierda: Math.round(tx * lado - x0),
        arriba: Math.round(ty * lado - y0),
        lado,
      });
    }
  }
  return r;
}

/** Metros por píxel en la latitud dada. */
export function metrosPorPixel(lat: number, zoom: number): number {
  return (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (256 * Math.pow(2, zoom));
}

/** Barra de escala "redonda" (1, 2 o 5 × 10^k m) que mida como máximo maxPx. */
export function barraEscala(lat: number, zoom: number, maxPx: number): { metros: number; px: number; texto: string } {
  const mpp = metrosPorPixel(lat, zoom);
  const bruto = mpp * maxPx;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const metros = [5, 2, 1].map((f) => f * pot).find((m) => m <= bruto) ?? pot;
  return { metros, px: Math.round(metros / mpp), texto: metros >= 1000 ? `${metros / 1000} km` : `${metros} m` };
}

/** Quita las etiquetas HTML de una atribución. */
export function atribucionTexto(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&copy;/g, '©')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
