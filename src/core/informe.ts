/**
 * Contenido del informe: cuadro resumen del diseño y conclusiones automáticas.
 * Solo arma textos a partir de resultados ya calculados (no hace cálculos nuevos).
 */
import { MESES_LARGOS } from './lluvia';

export interface DatosDrenajeInforme {
  techoAncho: number;
  techoLargo: number;
  techoNombre: string;
  intensidadMmH: number;
  fuenteIntensidad: string;
  tipoCanal: string;
  lineasCanal: string;
  canalRevisado: string;
  capacidadCanalLs: number;
  caudalTramoLs: number;
  cumpleCanal: boolean;
  bajanteNombre: string;
  bajantesPorCanaleta: number;
  bajantesTotal: number;
  numeroCanaletas: number;
  longitudCanaletaM: number;
  pendientePct: number;
  material: string;
  canaletaEquivalente: string | null;
  rebalsaMmH: number;
  bajanteSaturaMmH: number;
  fallaPrimero: 'canal' | 'bajante';
}

export interface DatosTanqueInforme {
  volumenM3: number;
  criterio: 'cubre' | 'parcial';
  cobertura: number;
  areaTechoM2: number;
  origenArea: 'existente' | 'necesaria';
  tanque: string;
  cisterna: string;
  mesesLlenos: string;
}

export interface DatosInforme {
  nombreProyecto: string;
  edificio: string;
  coordenadas: string | null;
  lluvia: { anualMm: number; diasLluvia: number; anios: number; fuente: string } | null;
  techo: {
    material: string;
    ce: number;
    aguas: 1 | 2;
    descarteMm: number;
    umbralMm: number;
    existente: { ancho: number; largo: number; area: number } | null;
  };
  oferta: { netaAnualMm: number; eficiencia: number; mesesCaptados: boolean[]; m3NetosAnual: number | null } | null;
  demanda: { usuarios: number; litrosPorUsuarioDia: number; diasUso: number; m3Anual: number };
  areaNecesariaM2: number | null;
  drenaje: DatosDrenajeInforme | null;
  tanque?: DatosTanqueInforme | null;
}

export interface SeccionResumen {
  titulo: string;
  filas: [string, string][];
}

const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
const n2 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number) => `${Math.round(v * 100)} %`;

/** Lista de meses en español: "mayo, junio y julio". */
export function listaMeses(indices: number[]): string {
  const nombres = indices.map((i) => MESES_LARGOS[i].toLowerCase());
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

const indicesDonde = (v: boolean[], valor: boolean) => v.flatMap((x, i) => (x === valor ? [i] : []));

export function cuadroResumen(d: DatosInforme): SeccionResumen[] {
  const s: SeccionResumen[] = [];
  s.push({
    titulo: 'Sitio y lluvia',
    filas: [
      ['Proyecto', d.nombreProyecto || '—'],
      ['Tipo de edificio', d.edificio],
      ['Ubicación (aprox.)', d.coordenadas ?? 'Datos de lluvia ingresados a mano'],
      ...(d.lluvia
        ? ([
            ['Lluvia promedio anual', `${n0(d.lluvia.anualMm)} mm (${n0(d.lluvia.diasLluvia)} días con lluvia)`],
            ['Fuente de la lluvia', d.lluvia.fuente],
          ] as [string, string][])
        : []),
      ...(d.oferta
        ? ([['Meses de captación (PN ≥ ' + n0(d.techo.umbralMm) + ' mm)', listaMeses(indicesDonde(d.oferta.mesesCaptados, true)) || 'ninguno']] as [
            string,
            string,
          ][])
        : []),
    ],
  });
  s.push({
    titulo: 'Techo y lluvia neta',
    filas: [
      ['Material y coeficiente de escorrentía', `${d.techo.material} (Ce ${d.techo.ce})`],
      ['Forma', d.techo.aguas === 2 ? 'Dos aguas' : 'Un agua'],
      ['Primer descarte', `${n1(d.techo.descarteMm)} mm por lluvia`],
      ...(d.oferta
        ? ([['Lluvia neta aprovechable', `${n0(d.oferta.netaAnualMm)} L por m² al año (${pct(d.oferta.eficiencia)} de la lluvia)`]] as [
            string,
            string,
          ][])
        : []),
      [
        'Techo existente',
        d.techo.existente
          ? `${n1(d.techo.existente.ancho)} × ${n1(d.techo.existente.largo)} m = ${n1(d.techo.existente.area)} m²`
          : 'No indicado',
      ],
      ...(d.oferta?.m3NetosAnual != null
        ? ([['Agua captable con el techo existente', `${n1(d.oferta.m3NetosAnual)} m³ al año`]] as [string, string][])
        : []),
    ],
  });
  s.push({
    titulo: 'Demanda',
    filas: [
      ['Usuarios', n0(d.demanda.usuarios)],
      ['Dotación', `${n1(d.demanda.litrosPorUsuarioDia)} L por usuario al día`],
      ['Días de uso al año', n0(d.demanda.diasUso)],
      ['Demanda anual', `${n1(d.demanda.m3Anual)} m³`],
      ...(d.areaNecesariaM2 !== null ? ([['Área de techo necesaria (mínima, en planta)', `${n0(d.areaNecesariaM2)} m²`]] as [string, string][]) : []),
      ...(d.oferta?.m3NetosAnual != null && d.demanda.m3Anual > 0
        ? ([['Cobertura de la demanda con el techo existente', pct(d.oferta.m3NetosAnual / d.demanda.m3Anual)]] as [string, string][])
        : []),
    ],
  });
  if (d.tanque) {
    const t = d.tanque;
    s.push({
      titulo: 'Tanque de almacenamiento',
      filas: [
        ['Techo usado para el cálculo', `${n1(t.areaTechoM2)} m² (${t.origenArea === 'existente' ? 'techo existente' : 'área mínima necesaria'})`],
        ['Volumen de almacenamiento', `${n1(t.volumenM3)} m³ (${n0(t.volumenM3 * 1000)} L)`],
        ['Cobertura de la demanda en el año', pct(t.cobertura)],
        ['Opción 1: tanques de polietileno', t.tanque],
        ['Opción 2: cisterna de block (medidas interiores)', t.cisterna],
      ],
    });
  }
  if (d.drenaje) {
    const r = d.drenaje;
    s.push({
      titulo: 'Canaletas y bajantes',
      filas: [
        ['Techo drenado', `${r.techoNombre}: ${n1(r.techoAncho)} × ${n1(r.techoLargo)} m`],
        ['Intensidad de diseño', `${n0(r.intensidadMmH)} mm/h (${r.fuenteIntensidad})`],
        ['Canal sugerido', `${r.tipoCanal}: ${r.lineasCanal}`],
        ['Canaletas', `${r.numeroCanaletas} × ${n1(r.longitudCanaletaM / r.numeroCanaletas)} m de ${r.material}, pendiente ${n1(r.pendientePct)} %`],
        ['Bajantes', `${r.bajantesTotal} de ${r.bajanteNombre} (${r.bajantesPorCanaleta} por canaleta)`],
        ['Caudal por tramo / capacidad del canal', `${n2(r.caudalTramoLs)} / ${n2(r.capacidadCanalLs)} L/s (${r.canalRevisado}) — ${r.cumpleCanal ? 'cumple' : 'no cumple'}`],
        ...(r.canaletaEquivalente ? ([['Sección mínima equivalente', `Canaleta semicircular de ${r.canaletaEquivalente}`]] as [string, string][]) : []),
        ['Rebalsa con aguaceros de', `más de ${n0(r.rebalsaMmH)} mm/h (la bajante se satura desde ${n0(r.bajanteSaturaMmH)} mm/h)`],
      ],
    });
  }
  return s;
}

export function conclusiones(d: DatosInforme): string[] {
  const c: string[] = [];
  if (d.lluvia && d.oferta) {
    const captados = indicesDonde(d.oferta.mesesCaptados, true);
    const secos = indicesDonde(d.oferta.mesesCaptados, false);
    c.push(
      `El sitio recibe en promedio ${n0(d.lluvia.anualMm)} mm de lluvia al año. Con el techo indicado se aprovechan ` +
        `${n0(d.oferta.netaAnualMm)} litros por m² al año (${pct(d.oferta.eficiencia)}), captando en ${captados.length} ` +
        `mes${captados.length === 1 ? '' : 'es'}${captados.length ? ` (${listaMeses(captados)})` : ''}.`,
    );
    if (secos.length > 0 && captados.length > 0) {
      c.push(
        `Durante ${secos.length} mes${secos.length === 1 ? '' : 'es'} (${listaMeses(secos)}) no se capta lluvia: el agua de la época ` +
          'lluviosa debe guardarse en un tanque para cubrir la época seca. El volumen del tanque se dimensiona con la ' +
          'simulación mes a mes (próxima versión de CaptaLluvia).',
      );
    }
  }
  if (d.demanda.m3Anual > 0 && d.areaNecesariaM2 !== null) {
    if (d.techo.existente && d.oferta?.m3NetosAnual != null) {
      const cob = d.oferta.m3NetosAnual / d.demanda.m3Anual;
      if (cob >= 1) {
        c.push(
          `El techo existente de ${n1(d.techo.existente.area)} m² capta ${n1(d.oferta.m3NetosAnual)} m³ netos al año, ` +
            `${pct(cob)} de la demanda anual de ${n1(d.demanda.m3Anual)} m³: el techo alcanza (se necesitan al menos ${n0(d.areaNecesariaM2)} m²).`,
        );
      } else {
        const falta = Math.max(0, Math.ceil(d.areaNecesariaM2 - d.techo.existente.area));
        c.push(
          `El techo existente de ${n1(d.techo.existente.area)} m² cubre ${pct(cob)} de la demanda anual de ` +
            `${n1(d.demanda.m3Anual)} m³. Para cubrirla toda se necesitan al menos ${n0(d.areaNecesariaM2)} m² ` +
            `(faltan ${n0(falta)} m²), o bien reducir los litros por usuario o los días de uso.`,
        );
      }
    } else {
      c.push(
        `Para cubrir la demanda de ${n1(d.demanda.m3Anual)} m³ al año (${n0(d.demanda.usuarios)} usuarios, ` +
          `${n1(d.demanda.litrosPorUsuarioDia)} L por día, ${n0(d.demanda.diasUso)} días) se necesitan al menos ` +
          `${n0(d.areaNecesariaM2)} m² de techo medidos en planta.`,
      );
    }
  }
  if (d.tanque) {
    const t = d.tanque;
    c.push(
      `Se requiere un almacenamiento de ${n1(t.volumenM3)} m³ (${n0(t.volumenM3 * 1000)} litros)` +
        (t.criterio === 'cubre'
          ? ' para cubrir la demanda durante todo el año'
          : `, con el que se cubre ${pct(t.cobertura)} de la demanda anual porque el techo no capta lo suficiente`) +
        `. Puede resolverse con ${t.tanque} o con una cisterna de block de ${t.cisterna}.`,
    );
  }
  if (d.drenaje) {
    const r = d.drenaje;
    c.push(
      `Para una lluvia de diseño de ${n0(r.intensidadMmH)} mm/h se sugiere ${r.tipoCanal.toLowerCase()} con ` +
        `${r.bajantesTotal} bajante${r.bajantesTotal === 1 ? '' : 's'} de ${r.bajanteNombre} ` +
        `(${r.bajantesPorCanaleta} por canaleta) y pendiente de ${n1(r.pendientePct)} %.`,
    );
    if (r.cumpleCanal && r.rebalsaMmH > r.intensidadMmH) {
      c.push(
        `El canal trabaja dentro del diseño; rebalsaría con aguaceros de más de ${n0(r.rebalsaMmH)} mm/h. ` +
          `Si la lluvia fuera más intensa, fallaría primero ${r.fallaPrimero === 'canal' ? 'el canal' : 'la bajante'}.`,
      );
    } else {
      c.push(
        `Atención: con ${n0(r.intensidadMmH)} mm/h el canal revisado no alcanza. Conviene aumentar la sección, la ` +
          'pendiente o el número de bajantes.',
      );
    }
  }
  c.push(
    'Estos resultados son de prefactibilidad: las medidas son mínimas y el diseño final debe revisarlo un profesional, ' +
      'confirmando materiales y medidas con el distribuidor.',
  );
  return c;
}
