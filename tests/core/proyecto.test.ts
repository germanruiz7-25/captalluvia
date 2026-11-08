import { describe, expect, it } from 'vitest';
import { CLAVE_PROYECTO, borrarProyecto, cargarProyecto, guardarProyecto, type ProyectoGuardado } from '../../src/core/proyecto';

function memoria() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    m,
  };
}

const proyecto: ProyectoGuardado = {
  paso: 3,
  nombreProyecto: 'Escuela',
  lat: '14.31',
  lon: '-90.79',
  lluvia: {
    mensualMm: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    diasLluviaMes: Array(12).fill(5),
    anualMm: 78,
    diasLluviaAnual: 60,
    anios: 0,
    anioInicio: null,
    anioFin: null,
    mesesSinDatos: [],
    fuente: 'Datos ingresados a mano',
  },
  tipoTecho: 'lamina_metalica',
  aguas: 2,
  descarteMm: 1,
  umbralMm: 40,
  areaDisponible: null,
  edificio: 'escuela',
  usuarios: 150,
  dotacionId: 'personalizada',
  usos: [{ nombre: 'Beber', litros: 2 }],
  diasUso: 180,
};

describe('proyecto guardado en el dispositivo', () => {
  it('guarda y vuelve a leer', () => {
    const a = memoria();
    expect(guardarProyecto(proyecto, a)).toBe(true);
    expect(cargarProyecto(a)).toEqual(proyecto);
  });

  it('borra de verdad', () => {
    const a = memoria();
    guardarProyecto(proyecto, a);
    borrarProyecto(a);
    expect(a.m.has(CLAVE_PROYECTO)).toBe(false);
    expect(cargarProyecto(a)).toBeNull();
  });

  it('ignora datos dañados', () => {
    const a = memoria();
    a.setItem(CLAVE_PROYECTO, '{no es json');
    expect(cargarProyecto(a)).toBeNull();
    a.setItem(CLAVE_PROYECTO, JSON.stringify({ ...proyecto, lluvia: { mensualMm: [1] } }));
    expect(cargarProyecto(a)?.lluvia).toBeNull();
  });

  it('sin almacenamiento no falla', () => {
    expect(guardarProyecto(proyecto, null)).toBe(false);
    expect(cargarProyecto(null)).toBeNull();
    expect(() => borrarProyecto(null)).not.toThrow();
  });
});
