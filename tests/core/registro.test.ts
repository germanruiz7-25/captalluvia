import { describe, expect, it } from 'vitest';
import {
  CLAVE_COLA,
  cargarRegistro,
  crearRegistro,
  encolarYEnviar,
  eventoBorrar,
  eventoInforme,
  eventoRegistro,
  guardarRegistro,
  leerCola,
  validarRegistro,
  type DatosRegistro,
  type Evento,
} from '../../src/core/registro';

function memoria() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    m,
  };
}

const datos: DatosRegistro = {
  nombre: '  Ana   López ',
  correo: 'Ana@Ejemplo.org',
  organizacion: 'COMRED Masagua',
  rol: 'Técnico o técnica de campo',
  pais: 'Guatemala',
  departamento: 'Escuintla',
  municipio: 'Masagua',
  aceptaPolitica: true,
};

describe('registro', () => {
  it('valida campos obligatorios, correo y aceptación', () => {
    expect(validarRegistro(datos)).toEqual({});
    const e = validarRegistro({ ...datos, nombre: 'A', correo: 'ana@', organizacion: '', rol: '', pais: '', aceptaPolitica: false });
    expect(Object.keys(e).sort()).toEqual(['aceptaPolitica', 'correo', 'nombre', 'organizacion', 'pais', 'rol']);
    // departamento y municipio son opcionales
    expect(validarRegistro({ ...datos, departamento: '', municipio: '' })).toEqual({});
  });

  it('crea, guarda y carga el registro con texto limpio', () => {
    const a = memoria();
    const r = crearRegistro(datos, '0.5.0', new Date('2026-11-09T00:00:00Z'));
    expect(r.nombre).toBe('Ana López');
    expect(r.correo).toBe('ana@ejemplo.org');
    expect(r.id.length).toBeGreaterThan(8);
    guardarRegistro(r, a);
    expect(cargarRegistro(a)?.id).toBe(r.id);
    expect(cargarRegistro(memoria())).toBeNull();
  });

  it('el evento de informe no lleva coordenadas ni datos personales', () => {
    const r = crearRegistro(datos, '0.5.0');
    const e = eventoInforme(r, '0.5.0', { departamento: 'Escuintla', municipio: 'Masagua', infraestructura: 'Escuela', usuarios: 150, volumenM3: 10.04 });
    expect(e.tipo).toBe('informe');
    expect(e.datos).toEqual({ departamento: 'Escuintla', municipio: 'Masagua', infraestructura: 'Escuela', usuarios: 150, volumenM3: 10 });
    expect(JSON.stringify(e)).not.toMatch(/correo|nombre|lat|lon/);
    expect(eventoRegistro(r).datos.correo).toBe('ana@ejemplo.org');
  });

  it('envía la cola y guarda lo que falla para reintentar', async () => {
    const a = memoria();
    const r = crearRegistro(datos, '0.5.0');
    const enviados: Evento[] = [];
    let fallar = true;
    const enviar = async (_u: string, e: Evento) => {
      if (fallar) throw new Error('sin conexión');
      enviados.push(e);
    };
    expect(await encolarYEnviar('https://x', eventoRegistro(r), enviar, a)).toBe(1);
    expect(leerCola(a)).toHaveLength(1);
    fallar = false;
    expect(await encolarYEnviar('https://x', null, enviar, a)).toBe(0);
    expect(enviados.map((e) => e.tipo)).toEqual(['registro']);
    expect(a.m.has(CLAVE_COLA)).toBe(false);
  });

  it('sin dirección configurada todo queda en cola; borrar anula lo pendiente', async () => {
    const a = memoria();
    const r = crearRegistro(datos, '0.5.0');
    await encolarYEnviar(undefined, eventoRegistro(r), undefined, a);
    await encolarYEnviar(undefined, eventoInforme(r, '0.5.0', { departamento: '', municipio: '', infraestructura: 'Vivienda', usuarios: 5 }), undefined, a);
    expect(leerCola(a)).toHaveLength(2);
    await encolarYEnviar(undefined, eventoBorrar(r, '0.5.0'), undefined, a);
    expect(leerCola(a).map((e) => e.tipo)).toEqual(['borrar']);
  });
});
