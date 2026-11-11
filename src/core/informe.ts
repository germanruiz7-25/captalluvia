/**
 * Contenido del informe: cuadro resumen del diseño y conclusiones automáticas.
 * Solo arma textos a partir de resultados ya calculados (no hace cálculos nuevos).
 */
import { MESES_LARGOS } from './lluvia';
import type { EvaluacionTecho } from './techoTanque';

export interface ModuloDrenajeInforme {
  nombre: string;
  ancho: number;
  largo: number;
  tipoCanal: string;
  bajantes: number;
  bajantesPorCanaleta: number;
  bajanteNombre: string;
  canaletaM: number;
}

export interface DatosDrenajeInforme {
  /** Techo por módulos (desde v0.9.0): canaletas y bajantes de cada uno. */
  modulos?: ModuloDrenajeInforme[];
  /** Largo de canaleta que atiende cada bajante (m) y qué decide el número de bajantes. */
  tramoM?: number;
  motivoBajantes?: 'caudal' | 'largo';
  tramoMaximoM?: number;
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
  /** Capacidad máxima de cada tramo (la menor entre canal lleno y bajante), L/s. */
  capacidadSistemaLs?: number;
  /** Primer periodo de retorno (años) cuyos aguaceros cortos rebalsan el tramo y su duración crítica (min). */
  periodoCritico?: { tr: number; minutos: number } | null;
  /** Estación IDF con la que se revisó el tramo; null si no hubo curva. */
  estacionIdf?: string | null;
}

export interface DatosTanqueInforme {
  /** Volumen elegido para el diseño (m³). */
  volumenM3: number;
  /** Volumen calculado por el balance (m³). */
  volumenNecesarioM3?: number;
  /** Barriles de 55 galones equivalentes al volumen elegido. */
  barriles?: number;
  criterio: 'cubre' | 'parcial';
  cobertura: number;
  areaTechoM2: number;
  origenArea: 'existente' | 'necesaria';
  tanque: string;
  cisterna: string;
  mesesLlenos: string;
  /** Días que garantiza el tanque en la época seca y volumen calculado para ellos (desde v0.8.0). */
  diasCriticos?: number;
  /** Veces que se llena el tanque elegido con la lluvia del año. */
  llenadosAnual?: number;
  /** Capacidad del tanque elegido (L). */
  capacidadTanqueL?: number;
  /** Veces que se llena el tanque con la lluvia de cada mes. */
  llenadosPorMes?: number[];
}

export interface DatosInforme {
  nombreProyecto: string;
  edificio: string;
  coordenadas: string | null;
  lluvia: { anualMm: number; diasLluvia: number; anios: number; fuente: string } | null;
  techo: {
    material: string;
    ce: number;
    /** Eficiencia de captación (Efc); si falta, solo se muestra Ce. */
    efc?: number;
    aguas: 1 | 2;
    descarteMm: number;
    /** Primer descarte por temporada: meses (0–11) de las primeras lluvias que lavan el sistema. */
    lavado?: { meses: number[]; mm: number } | null;
    umbralMm: number;
    existente: { ancho: number; largo: number; area: number; modulos?: { nombre: string; ancho: number; largo: number; area: number }[] } | null;
  };
  oferta: { netaAnualMm: number; eficiencia: number; mesesCaptados: boolean[]; m3NetosAnual: number | null } | null;
  demanda: {
    usuarios: number;
    litrosPorUsuarioDia: number;
    diasUso: number;
    m3Anual: number;
    /** Demanda mensual Dj (m³/mes) y periodo crítico a garantizar (desde v0.8.0). */
    m3Mensual?: number;
    diasCriticos?: number;
    m3Critico?: number;
  };
  /** Techo ideal (consumo de la temporada + tanque lleno) o, sin periodo crítico, el del balance anual. */
  areaNecesariaM2: number | null;
  /** Techo ideal, mínimo para llenar el tanque y evaluación del existente (desde v0.9.0). */
  criterioTecho?: EvaluacionTecho | null;
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

/** "6 × 10 m = 60 m²" o, por módulos, "2 módulos: 6 × 10 m + 4 × 5 m = 80 m²". */
export function textoTechoExistente(e: DatosInforme['techo']['existente']): string {
  if (!e) return 'No indicado';
  if (e.modulos && e.modulos.length > 1) {
    return `${e.modulos.length} módulos: ${e.modulos.map((m) => `${n1(m.ancho)} × ${n1(m.largo)} m`).join(' + ')} = ${n1(e.area)} m²`;
  }
  return `${n1(e.ancho)} × ${n1(e.largo)} m = ${n1(e.area)} m²`;
}

/** Temporada de lluvia en texto: "de mayo a octubre". */
function textoTemporada(meses: number[]): string {
  if (!meses.length) return '';
  if (meses.length === 12) return 'todo el año';
  return `de ${MESES_LARGOS[meses[0]].toLowerCase()} a ${MESES_LARGOS[meses[meses.length - 1]].toLowerCase()}`;
}

const indicesDonde = (v: boolean[], valor: boolean) => v.flatMap((x, i) => (x === valor ? [i] : []));

const ESTADO_TECHO = {
  ideal: 'alcanza: cubre el consumo de la temporada y llena el tanque',
  soloLlenar: 'solo alcanza para llenar el tanque: no usar el agua mientras llueve',
  insuficiente: 'no alcanza para llenar el tanque',
} as const;

function filasTecho(d: DatosInforme): [string, string][] {
  const e = d.criterioTecho;
  if (e && e.idealM2 !== null && e.soloLlenarM2 !== null) {
    const f: [string, string][] = [
      ['Techo ideal (consumo de la temporada de lluvia + tanque lleno)', `${n0(e.idealM2)} m² en planta`],
      ['Techo mínimo para solo llenar el tanque', `${n0(e.soloLlenarM2)} m² (sin usar el agua mientras llueve)`],
    ];
    if (e.estado) {
      f.push(['Evaluación del techo existente', ESTADO_TECHO[e.estado]]);
      if (e.faltaIdealM2 > 0) {
        f.push([
          'Techo que falta',
          e.estado === 'insuficiente'
            ? `${n0(e.faltaLlenarM2)} m² para llenar el tanque; ${n0(e.faltaIdealM2)} m² para el ideal`
            : `${n0(e.faltaIdealM2)} m² para el ideal`,
        ]);
      }
    }
    return f;
  }
  const f: [string, string][] = [];
  if (d.areaNecesariaM2 !== null) f.push(['Área de techo necesaria (mínima, en planta)', `${n0(d.areaNecesariaM2)} m²`]);
  if (d.oferta?.m3NetosAnual != null && d.demanda.m3Anual > 0) {
    f.push(['Cobertura de la demanda con el techo existente', pct(d.oferta.m3NetosAnual / d.demanda.m3Anual)]);
  }
  return f;
}

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
        ? ([['Meses de captación (temporada de lluvia)', listaMeses(indicesDonde(d.oferta.mesesCaptados, true)) || 'ninguno']] as [
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
      ...(d.techo.efc
        ? ([[
            'Coeficiente de captación (Cc = Ce × Efc)',
            `${d.techo.ce} × ${d.techo.efc} = ${(d.techo.ce * d.techo.efc).toLocaleString('es-GT', { maximumFractionDigits: 3 })} (eficiencia de captación ${Math.round(d.techo.efc * 100)} %)`,
          ]] as [string, string][])
        : []),
      ['Forma', d.techo.aguas === 2 ? 'Dos aguas' : 'Un agua'],
      [
        'Primer descarte',
        d.techo.lavado && d.techo.lavado.meses.length
          ? `lluvias de la época seca (${listaMeses(d.techo.lavado.meses)}, ${n0(d.techo.lavado.mm)} mm): no se captan y lavan el sistema`
          : d.techo.descarteMm > 0
            ? `${n1(d.techo.descarteMm)} mm por lluvia`
            : 'primera lluvia después de cada periodo seco (sin captar)',
      ],
      ...(d.oferta
        ? ([['Lluvia neta aprovechable', `${n0(d.oferta.netaAnualMm)} L por m² al año (${pct(d.oferta.eficiencia)} de la lluvia)`]] as [
            string,
            string,
          ][])
        : []),
      ['Techo existente', textoTechoExistente(d.techo.existente)],
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
      ...(d.demanda.m3Mensual !== undefined
        ? ([['Demanda mensual (Dj = usuarios × dotación × 30.4 días)', `${n1(d.demanda.m3Mensual)} m³ (${n0(d.demanda.m3Mensual * 1000)} L)`]] as [string, string][])
        : []),
      ['Días de uso al año', n0(d.demanda.diasUso)],
      ['Demanda anual', `${n1(d.demanda.m3Anual)} m³ (${n0(d.demanda.m3Anual * 1000)} L)`],
      ...(d.demanda.diasCriticos && d.demanda.m3Critico !== undefined
        ? ([[
            'Periodo crítico a garantizar (época seca)',
            `${n0(d.demanda.diasCriticos)} días (${n1(d.demanda.diasCriticos / 30.4)} meses): ${n1(d.demanda.m3Critico)} m³`,
          ]] as [string, string][])
        : []),
      ...filasTecho(d),
    ],
  });
  if (d.tanque) {
    const t = d.tanque;
    s.push({
      titulo: 'Tanque de almacenamiento',
      filas: [
        ['Techo usado para el cálculo', `${n1(t.areaTechoM2)} m² (${t.origenArea === 'existente' ? 'techo existente' : d.criterioTecho ? 'techo ideal' : 'área mínima necesaria'})`],
        ...(t.volumenNecesarioM3 !== undefined && Math.abs(t.volumenNecesarioM3 - t.volumenM3) > 0.05
          ? ([[t.diasCriticos ? 'Volumen calculado para el periodo crítico' : 'Volumen calculado por el balance', `${n1(t.volumenNecesarioM3)} m³`]] as [string, string][])
          : []),
        ...(t.diasCriticos
          ? ([['Criterio', `garantizar ${n0(t.diasCriticos)} días de consumo en la época seca`]] as [string, string][])
          : []),
        ['Volumen de almacenamiento elegido', `${n1(t.volumenM3)} m³ (${n0(t.volumenM3 * 1000)} L)`],
        ...(t.barriles ? ([['Equivale a', `${n1(t.barriles)} barriles de 55 galones (208 L)`]] as [string, string][]) : []),
        ...(t.diasCriticos ? [] : ([['Cobertura de la demanda en el año', pct(t.cobertura)]] as [string, string][])),
        ['Opción 1: tanques de polietileno', t.tanque],
        ['Opción 2: cisterna de block (medidas interiores)', t.cisterna],
        ...(t.llenadosAnual !== undefined && t.capacidadTanqueL
          ? ([[
              'Llenados del tanque con la lluvia del año',
              `${n1(t.llenadosAnual)} veces el tanque de ${n0(t.capacidadTanqueL)} L${t.mesesLlenos ? ` (meses con uno o más llenados: ${t.mesesLlenos})` : ''}`,
            ]] as [string, string][])
          : []),
      ],
    });
  }
  if (d.drenaje) {
    const r = d.drenaje;
    s.push({
      titulo: 'Canaletas y bajantes',
      filas: [
        ...(r.modulos && r.modulos.length > 1
          ? r.modulos.map(
              (m) =>
                [
                  m.nombre,
                  `${n1(m.ancho)} × ${n1(m.largo)} m: ${n1(m.canaletaM)} m de canaleta, ${m.bajantes} bajante${m.bajantes === 1 ? '' : 's'} de ${m.bajanteNombre} (${m.tipoCanal.toLowerCase()})`,
                ] as [string, string],
            )
          : ([['Techo drenado', `${r.techoNombre}: ${n1(r.techoAncho)} × ${n1(r.techoLargo)} m`]] as [string, string][])),
        ['Intensidad de diseño', `${n0(r.intensidadMmH)} mm/h (${r.fuenteIntensidad})`],
        ['Canal sugerido', `${r.tipoCanal}: ${r.lineasCanal}`],
        r.modulos && r.modulos.length > 1
          ? ['Canaletas', `${n1(r.longitudCanaletaM)} m en total de ${r.material}, pendiente ${n1(r.pendientePct)} %`]
          : ['Canaletas', `${r.numeroCanaletas} × ${n1(r.longitudCanaletaM / r.numeroCanaletas)} m de ${r.material}, pendiente ${n1(r.pendientePct)} %`],
        [
          'Bajantes',
          r.modulos && r.modulos.length > 1
            ? `${r.bajantesTotal} en total, conectadas a la entrada del tanque`
            : `${r.bajantesTotal} de ${r.bajanteNombre} (${r.bajantesPorCanaleta} por canaleta${r.tramoM ? `, una cada ${n1(r.tramoM)} m` : ''})` +
              (r.motivoBajantes === 'largo' ? `: las pide el largo del techo (máximo ${n0(r.tramoMaximoM ?? 12)} m de canal por bajante)` : ''),
        ],
        ['Caudal por tramo / capacidad del canal', `${n2(r.caudalTramoLs)} / ${n2(r.capacidadCanalLs)} L/s (${r.canalRevisado}) — ${r.cumpleCanal ? 'cumple' : 'no cumple'}`],
        ...(r.canaletaEquivalente ? ([['Sección mínima equivalente', `Canaleta semicircular de ${r.canaletaEquivalente}`]] as [string, string][]) : []),
        ...(r.capacidadSistemaLs
          ? ([[
              'Capacidad máxima por tramo',
              `${n2(r.capacidadSistemaLs)} L/s (${n0(r.capacidadSistemaLs * 60)} L/min); controla ${r.fallaPrimero === 'canal' ? 'el canal' : 'la bajante'}`,
            ]] as [string, string][])
          : []),
        ['Intensidad que soporta', `hasta ${n0(Math.min(r.rebalsaMmH, r.bajanteSaturaMmH))} mm/h sin rebalsar`],
        ...(r.estacionIdf
          ? ([[
              'Aguaceros que rebalsan (curva IDF)',
              r.periodoCritico
                ? `desde T = ${r.periodoCritico.tr} años, de hasta ${n0(r.periodoCritico.minutos)} min`
                : 'ninguno hasta T = 100 años',
            ]] as [string, string][])
          : []),
      ],
    });
  }
  return s;
}

/** Conclusión sobre el techo: ideal, mínimo para llenar el tanque y evaluación del existente. */
export function recomendacionTecho(d: DatosInforme): string | null {
  const c: string[] = [];
  const e = d.criterioTecho;
  if (d.demanda.m3Anual > 0 && e && e.idealM2 !== null && e.soloLlenarM2 !== null) {
    const temporada = textoTemporada(e.mesesTemporada);
    const v = d.demanda.m3Critico ?? 0;
    const dias = d.demanda.diasCriticos ?? 0;
    const proteger =
      e.mesesProteger?.length && e.estado !== 'insuficiente'
        ? ` Ya con el tanque lleno, en ${listaMeses(e.mesesProteger)} la lluvia no cubre todo el consumo: en esos meses ` +
          'conviene usar solo el agua que llueve y no sacar del tanque, para conservar la reserva de los días críticos.'
        : '';
    const existente = e.existenteM2 !== null ? `${n1(e.existenteM2)} m²${d.techo.existente?.modulos && d.techo.existente.modulos.length > 1 ? ` (${d.techo.existente.modulos.length} módulos)` : ''}` : '';
    if (e.estado === 'ideal') {
      c.push(
        `El techo existente de ${existente} alcanza: cubre el consumo durante la temporada de lluvia (${temporada}) y llena ` +
          `al 100 % el tanque de ${n1(v)} m³ para los ${n0(dias)} días críticos (el techo ideal es de ${n0(e.idealM2)} m²).` +
          proteger,
      );
    } else if (e.estado === 'soloLlenar') {
      const limite =
        e.litrosDiaPosibles && e.litrosDiaPosibles >= 1 ? `, o limitarla a unos ${n0(e.litrosDiaPosibles)} litros por día,` : '';
      c.push(
        `El techo existente de ${existente} alcanza para llenar el tanque de ${n1(v)} m³, pero no para cubrir también el ` +
          `consumo de la temporada de lluvia: el techo ideal es de ${n0(e.idealM2)} m² (faltan ${n0(e.faltaIdealM2)} m²). ` +
          `Se recomienda no usar el agua del tanque durante la época lluviosa${limite} para garantizar que se llene, a menos ` +
          `que se agreguen ${n0(e.faltaIdealM2)} m² de techo de captación.`,
      );
    } else if (e.estado === 'insuficiente') {
      c.push(
        `El techo existente de ${existente} no alcanza para llenar el tanque de ${n1(v)} m³ ni sin usar el agua mientras ` +
          `llueve: llega al ${pct(e.fraccionLlenado)} de su volumen. Faltan ${n0(e.faltaLlenarM2)} m² para llenarlo ` +
          `(techo mínimo de ${n0(e.soloLlenarM2)} m²) y ${n0(e.faltaIdealM2)} m² para el techo ideal de ${n0(e.idealM2)} m², ` +
          'que además cubre el consumo de la temporada. Otra opción es reducir los días críticos o la dotación.',
      );
    } else {
      c.push(
        `Se sugiere un techo ideal de ${n0(e.idealM2)} m² medidos en planta: cubre el consumo de ${n0(d.demanda.usuarios)} ` +
          `usuarios durante la temporada de lluvia (${temporada}) y llena al 100 % el tanque de ${n1(v)} m³ para ` +
          `los ${n0(dias)} días críticos${e.mesLleno != null ? ` (se llena en ${MESES_LARGOS[e.mesLleno].toLowerCase()})` : ''}. ` +
          `Con ${n0(e.soloLlenarM2)} m² solo se llenaría el tanque, sin usar el agua mientras llueve.` +
          proteger,
      );
    }
  } else if (d.demanda.m3Anual > 0 && d.areaNecesariaM2 !== null) {
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
  return c[0] ?? null;
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
          'lluviosa debe guardarse en un tanque para cubrir la época seca' +
          (d.tanque ? ' (ver la sección del tanque de almacenamiento).' : '.'),
      );
    }
  }
  const e = d.criterioTecho;
  const rt = recomendacionTecho(d);
  if (rt) c.push(rt);
  if (d.tanque) {
    const t = d.tanque;
    c.push(
      `Se adopta un almacenamiento de ${n1(t.volumenM3)} m³ (${n0(t.volumenM3 * 1000)} litros` +
        (t.barriles ? `, equivalente a ${n0(t.barriles)} barriles de 55 galones)` : ')') +
        (t.diasCriticos
          ? ` para garantizar ${n0(t.diasCriticos)} días de consumo en los meses más secos del año`
          : t.criterio === 'cubre'
            ? ' para cubrir la demanda durante todo el año'
            : `, con el que se cubre ${pct(t.cobertura)} de la demanda anual porque el techo no capta lo suficiente`) +
        `. Puede resolverse con ${t.tanque} o con una cisterna de block de ${t.cisterna}.`,
    );
    if (t.llenadosAnual !== undefined && t.capacidadTanqueL) {
      c.push(
        `Con la lluvia promedio y ${n1(t.areaTechoM2)} m² de techo, el agua captada en el año equivale a llenar ` +
          `${n1(t.llenadosAnual)} veces el tanque de ${n0(t.capacidadTanqueL)} L. ` +
          (e?.estado === 'soloLlenar' || e?.estado === 'insuficiente'
            ? 'Lo importante es que el tanque quede lleno al terminar la temporada para cubrir la época seca.'
            : 'Durante la temporada de lluvia el agua puede usarse a diario; lo importante es que el tanque quede lleno al ' +
              'terminar la temporada para cubrir la época seca.'),
      );
    }
  }
  if (d.drenaje) {
    const r = d.drenaje;
    if (r.modulos && r.modulos.length > 1) {
      c.push(
        `Para una lluvia de diseño de ${n0(r.intensidadMmH)} mm/h, el techo de ${r.modulos.length} módulos lleva ` +
          `${n1(r.longitudCanaletaM)} m de canaleta y ${r.bajantesTotal} bajantes en total (` +
          r.modulos.map((m) => `${m.nombre.toLowerCase()}: ${m.bajantes} de ${m.bajanteNombre}`).join('; ') +
          `), con pendiente de ${n1(r.pendientePct)} %. Todas las bajantes se conectan a la tubería de entrada al tanque.`,
      );
    } else {
      c.push(
        `Para una lluvia de diseño de ${n0(r.intensidadMmH)} mm/h se sugiere ${r.tipoCanal.toLowerCase()} con ` +
          `${r.bajantesTotal} bajante${r.bajantesTotal === 1 ? '' : 's'} de ${r.bajanteNombre} ` +
          `(${r.bajantesPorCanaleta} por canaleta${r.tramoM ? `, una cada ${n1(r.tramoM)} m` : ''}) y pendiente de ${n1(r.pendientePct)} %.` +
          (r.motivoBajantes === 'largo'
            ? ` El número de bajantes lo decide el largo de la canaleta: se coloca como máximo una cada ${n0(r.tramoMaximoM ?? 12)} m de canal.`
            : ''),
      );
    }
    const limite = Math.min(r.rebalsaMmH, r.bajanteSaturaMmH);
    if (r.cumpleCanal && limite > r.intensidadMmH) {
      const cap = r.capacidadSistemaLs ? ` (${n0(r.capacidadSistemaLs * 60)} L/min por tramo)` : '';
      let idf = '';
      if (r.estacionIdf) {
        idf = r.periodoCritico
          ? ` Según la curva IDF de ${r.estacionIdf}, los aguaceros de hasta ${n0(r.periodoCritico.minutos)} minutos con periodo de retorno de ${r.periodoCritico.tr} años o más superan esa capacidad.`
          : ` Según la curva IDF de ${r.estacionIdf}, ningún aguacero de 5 minutos o más hasta un periodo de retorno de 100 años la supera.`;
      }
      c.push(
        `Cada tramo de canal y su bajante evacuan hasta ${n2(r.capacidadSistemaLs ?? r.capacidadCanalLs)} L/s${cap} y soportan ` +
          `lluvias de hasta ${n0(limite)} mm/h; con más intensidad rebalsa primero ${r.fallaPrimero === 'canal' ? 'el canal' : 'la bajante'}.` +
          idf,
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
