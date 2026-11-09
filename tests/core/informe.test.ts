import { describe, expect, it } from 'vitest';
import { conclusiones, cuadroResumen, listaMeses, type DatosInforme } from '../../src/core/informe';

const captados = [false, false, false, false, true, true, true, true, true, true, false, false];

const base: DatosInforme = {
  nombreProyecto: 'Escuela El Ejemplo',
  edificio: 'Escuela',
  coordenadas: '14.31, -90.79',
  lluvia: { anualMm: 1506, diasLluvia: 122, anios: 20, fuente: 'Open-Meteo (ERA5)' },
  techo: { material: 'Lámina metálica', ce: 0.9, aguas: 2, descarteMm: 1, umbralMm: 40, existente: null },
  oferta: { netaAnualMm: 1155, eficiencia: 0.767, mesesCaptados: captados, m3NetosAnual: null },
  demanda: { usuarios: 150, litrosPorUsuarioDia: 3, diasUso: 180, m3Anual: 81 },
  areaNecesariaM2: 71,
  drenaje: null,
};

describe('informe', () => {
  it('lista de meses en español', () => {
    expect(listaMeses([4, 5, 6])).toBe('mayo, junio y julio');
    expect(listaMeses([0])).toBe('enero');
    expect(listaMeses([])).toBe('');
  });

  it('sin techo existente: conclusión con los m² necesarios y la época seca', () => {
    const c = conclusiones(base);
    expect(c.some((t) => t.includes('se necesitan al menos 71 m²'))).toBe(true);
    expect(c.some((t) => t.includes('Durante 6 meses') && t.includes('tanque'))).toBe(true);
    expect(c[c.length - 1]).toContain('prefactibilidad');
  });

  it('con techo existente que no alcanza: cobertura y m² que faltan', () => {
    const d: DatosInforme = {
      ...base,
      techo: { ...base.techo, existente: { ancho: 6, largo: 10, area: 60 } },
      oferta: { ...base.oferta!, m3NetosAnual: 69.3 },
    };
    const c = conclusiones(d).join(' ');
    expect(c).toContain('cubre 86 %');
    expect(c).toContain('faltan 11 m²');
    const filas = cuadroResumen(d).flatMap((s) => s.filas);
    expect(filas).toContainEqual(['Techo existente', '6 × 10 m = 60 m²']);
    expect(filas).toContainEqual(['Cobertura de la demanda con el techo existente', '86 %']);
  });

  it('con drenaje: sugerencia, límite de rebalse y qué falla primero', () => {
    const d: DatosInforme = {
      ...base,
      drenaje: {
        techoAncho: 7,
        techoLargo: 10.5,
        techoNombre: 'Rectangular',
        intensidadMmH: 234,
        fuenteIntensidad: 'INSIVUMEH e ICC (2025)',
        tipoCanal: 'Canal tipo colonial',
        lineasCanal: 'Canal Colonial (Amanco Wavin)',
        canalRevisado: 'Canal Colonial (Amanco Wavin)',
        capacidadCanalLs: 4.07,
        caudalTramoLs: 2.15,
        cumpleCanal: true,
        bajanteNombre: '3"',
        bajantesPorCanaleta: 1,
        bajantesTotal: 2,
        numeroCanaletas: 2,
        longitudCanaletaM: 21,
        pendientePct: 0.5,
        material: 'PVC',
        canaletaEquivalente: '5" (12.5 cm)',
        rebalsaMmH: 637,
        bajanteSaturaMmH: 696,
        fallaPrimero: 'canal',
        capacidadSistemaLs: 3.2,
        periodoCritico: { tr: 25, minutos: 12 },
        estacionIdf: 'Retalhuleu',
      },
    };
    const c = conclusiones(d).join(' ');
    expect(c).toContain('2 bajantes de 3"');
    expect(c).toContain('hasta 637 mm/h');
    expect(c).toContain('rebalsa primero el canal');
    expect(c).toContain('192 L/min');
    expect(c).toContain('hasta 12 minutos con periodo de retorno de 25 años');
    const secciones = cuadroResumen(d);
    expect(secciones.map((s) => s.titulo)).toEqual(['Sitio y lluvia', 'Techo y lluvia neta', 'Demanda', 'Canaletas y bajantes']);
    const canal = secciones[3].filas;
    expect(canal).toContainEqual(['Canaletas', '2 × 10.5 m de PVC, pendiente 0.5 %']);
  });

  it('avisa si el canal no alcanza', () => {
    const d: DatosInforme = {
      ...base,
      drenaje: {
        ...({} as never),
        techoAncho: 7, techoLargo: 10.5, techoNombre: 'x', intensidadMmH: 700, fuenteIntensidad: 'a mano',
        tipoCanal: 'Canal tipo colonial', lineasCanal: '', canalRevisado: '', capacidadCanalLs: 4, caudalTramoLs: 6,
        cumpleCanal: false, bajanteNombre: '3"', bajantesPorCanaleta: 1, bajantesTotal: 2, numeroCanaletas: 2,
        longitudCanaletaM: 21, pendientePct: 0.5, material: 'PVC', canaletaEquivalente: null, rebalsaMmH: 637,
        bajanteSaturaMmH: 696, fallaPrimero: 'canal',
      },
    };
    expect(conclusiones(d).join(' ')).toContain('Atención');
  });
});

describe('informe con tanque', () => {
  it('agrega la sección y la conclusión del tanque', () => {
    const d: DatosInforme = {
      ...base,
      tanque: {
        volumenM3: 36,
        criterio: 'cubre',
        cobertura: 1,
        areaTechoM2: 71,
        origenArea: 'necesaria',
        tanque: '4 tanques de 10,000 L',
        cisterna: '4.90 × 4.90 m, alto útil 1.50 m (+ 0.30 m de borde libre) = 36.0 m³',
        mesesLlenos: '',
      },
    };
    const sec = cuadroResumen(d).find((s) => s.titulo === 'Tanque de almacenamiento')!;
    expect(sec.filas).toContainEqual(['Volumen de almacenamiento elegido', '36 m³ (36,000 L)']);
    expect(conclusiones(d).join(' ')).toContain('Se adopta un almacenamiento de 36 m³');
    expect(conclusiones(d).join(' ')).toContain('4 tanques de 10,000 L');
  });
});
