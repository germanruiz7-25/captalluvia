/**
 * CaptaLluvia: receptor de registros y avisos de uso (Google Apps Script).
 *
 * Se pega en el editor de Apps Script de una hoja de cálculo de Google (Extensiones → Apps Script)
 * y se implementa como "Aplicación web". Pasos completos en docs/REGISTRO.md.
 *
 * Recibe tres tipos de evento que envía la app (JSON en el cuerpo del POST):
 *  - registro: datos del formulario de primer uso → hoja "Registros" + correo de aviso.
 *  - informe:  aviso al descargar un informe (departamento, municipio, infraestructura,
 *              usuarios, volumen del tanque; nunca coordenadas) → hoja "Informes".
 *  - borrar:   la persona pidió borrar su registro → se eliminan sus filas en ambas hojas.
 */

/** Correo que recibe el aviso de cada registro nuevo (y de cada borrado). */
const CORREO_AVISO = 'galfaro@icc.org.gt';

const HOJAS = {
  registro: {
    nombre: 'Registros',
    columnas: ['Fecha', 'ID instalación', 'Nombre', 'Correo', 'Institución u organización', 'Uso', 'País', 'Departamento', 'Municipio', 'Versión app', 'Política'],
    valores: (ev) => [ev.datos.nombre, ev.datos.correo, ev.datos.organizacion, ev.datos.rol, ev.datos.pais, ev.datos.departamento, ev.datos.municipio, ev.version, ev.datos.politica],
  },
  informe: {
    nombre: 'Informes',
    columnas: ['Fecha', 'ID instalación', 'Departamento', 'Municipio', 'Infraestructura', 'Usuarios', 'Volumen tanque (m³)', 'Versión app', 'Formato'],
    valores: (ev) => [ev.datos.departamento, ev.datos.municipio, ev.datos.infraestructura, ev.datos.usuarios, ev.datos.volumenM3, ev.version, ev.datos.formato || 'pdf'],
  },
};

function doPost(e) {
  const candado = LockService.getScriptLock();
  candado.waitLock(15000);
  try {
    const ev = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!ev || typeof ev.id !== 'string' || ev.id.length < 8 || ev.id.length > 64) return respuesta('dato no válido');
    ev.datos = ev.datos || {};
    const libro = SpreadsheetApp.getActiveSpreadsheet();

    if (ev.tipo === 'registro' || ev.tipo === 'informe') {
      const h = HOJAS[ev.tipo];
      const hoja = hojaCon(libro, h.nombre, h.columnas);
      const fecha = new Date(ev.fecha);
      hoja.appendRow([isNaN(fecha) ? new Date() : fecha, ev.id].concat(h.valores(ev).map(limpio)));
      if (ev.tipo === 'registro') avisar(ev);
      return respuesta('ok');
    }

    if (ev.tipo === 'borrar') {
      let filas = 0;
      Object.keys(HOJAS).forEach((k) => {
        const hoja = libro.getSheetByName(HOJAS[k].nombre);
        if (hoja) filas += borrarFilas(hoja, ev.id);
      });
      MailApp.sendEmail(CORREO_AVISO, 'CaptaLluvia: registro borrado', `Se borraron ${filas} filas de la instalación ${ev.id} a pedido de la persona usuaria.`);
      return respuesta('ok');
    }
    return respuesta('tipo desconocido');
  } catch (err) {
    return respuesta('error');
  } finally {
    candado.releaseLock();
  }
}

/** Para comprobar en el navegador que la aplicación web está activa. */
function doGet() {
  return respuesta('CaptaLluvia: registro activo');
}

function hojaCon(libro, nombre, columnas) {
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(columnas);
    hoja.getRange(1, 1, 1, columnas.length).setFontWeight('bold').setBackground('#e3f0fa');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function borrarFilas(hoja, id) {
  const ids = hoja.getRange(1, 2, Math.max(hoja.getLastRow(), 1), 1).getValues();
  let n = 0;
  for (let i = ids.length - 1; i >= 1; i--) {
    if (ids[i][0] === id) {
      hoja.deleteRow(i + 1);
      n++;
    }
  }
  return n;
}

/** Texto corto y sin fórmulas (evita que una celda empiece con =, +, - o @). */
function limpio(v) {
  if (typeof v === 'number') return v;
  let t = String(v == null ? '' : v).slice(0, 150);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

function avisar(ev) {
  const d = ev.datos;
  const lugar = [d.municipio, d.departamento, d.pais].filter(String).join(', ');
  MailApp.sendEmail(
    CORREO_AVISO,
    `CaptaLluvia: nuevo registro de ${limpio(d.nombre)}`,
    [
      `Nombre: ${d.nombre}`,
      `Correo: ${d.correo}`,
      `Institución u organización: ${d.organizacion}`,
      `Uso: ${d.rol}`,
      `Lugar: ${lugar}`,
      `Versión de la app: ${ev.version}`,
      '',
      `Hoja de registros: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`,
    ].join('\n'),
  );
}

function respuesta(texto) {
  return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.TEXT);
}
