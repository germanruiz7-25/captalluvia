# Registro de uso con Google Sheets

CaptaLluvia pide un registro **una sola vez por dispositivo** (nombre, correo, institución, uso, país,
departamento y municipio) y avisa cada vez que se descarga un informe. Los datos llegan a una hoja de
cálculo de Google mediante una pequeña aplicación de **Google Apps Script**, que además envía un correo
por cada registro nuevo.

Qué se guarda y por qué: ver [PRIVACIDAD.md](PRIVACIDAD.md). Nunca se envían coordenadas ni mapas.

## 1. Crear la hoja

1. Entra a [sheets.google.com](https://sheets.google.com) con la cuenta de Google que administrará los
   registros (puede ser una cuenta del proyecto, por ejemplo `captalluvia.registros@gmail.com`).
2. Crea una hoja en blanco y llámala **CaptaLluvia – Registros**. No hace falta crear columnas:
   las pestañas **Registros** e **Informes** se crean solas con el primer envío.

## 2. Pegar el código

1. En la hoja: **Extensiones → Apps Script**.
2. Borra lo que aparece en `Código.gs` y pega todo el contenido de
   [`herramientas/registro/Codigo.gs`](../herramientas/registro/Codigo.gs).
3. Revisa la línea `const CORREO_AVISO = 'galfaro@icc.org.gt';` (correo que recibe los avisos).
4. Guarda (icono de disco). Nombre del proyecto: **CaptaLluvia registro**.

## 3. Publicar como aplicación web

1. Botón azul **Implementar → Nueva implementación**.
2. En el engranaje de "Seleccionar tipo", elige **Aplicación web**.
3. Descripción: `v1`. **Ejecutar como: Yo**. **Quién tiene acceso: Cualquier usuario**.
4. **Implementar**. Google pedirá permisos: **Autorizar acceso** → elige tu cuenta →
   "Google no verificó esta app" → **Configuración avanzada → Ir a CaptaLluvia registro (no seguro)** →
   **Permitir**. (Es tu propio código; los permisos son para escribir en tu hoja y enviar correos).
5. Copia la **URL de la aplicación web** (termina en `/exec`).
6. Prueba: abre esa URL en el navegador; debe decir `CaptaLluvia: registro activo`.

## 4. Conectar la app

1. En GitHub: **Settings → Secrets and variables → Actions → pestaña Variables → New repository variable**.
2. Nombre: `VITE_REGISTRO_URL`. Valor: la URL `/exec` copiada. **Add variable**.
3. Publica una versión nueva (Release) o, en **Actions → Publicar en GitHub Pages → Run workflow**,
   vuelve a publicar la actual.

La URL no es secreta: queda visible en el sitio. El código solo acepta los tres tipos de envío de la
app, limita el largo de cada dato y evita fórmulas en las celdas.

## 5. Cambiar el código después

**Desde la versión 0.6.0** la pestaña "Informes" tiene la columna **Formato** (PDF o Word). Si tu hoja ya
existía, escribe `Formato` en la celda **I1** de "Informes" y actualiza el código con el `Codigo.gs` nuevo
(pasos de abajo). Si no lo actualizas, todo sigue funcionando; solo no se anota el formato.


Si editas `Codigo.gs`, usa **Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión →
Implementar**. Así la URL no cambia y no hay que tocar GitHub.

## Qué llega a la hoja

| Pestaña | Una fila por | Columnas |
| --- | --- | --- |
| Registros | persona registrada (por dispositivo) | fecha, ID de instalación, nombre, correo, institución, uso, país, departamento, municipio, versión, política |
| Informes | informe descargado (PDF o Word) | fecha, ID de instalación, departamento, municipio, infraestructura, usuarios, volumen del tanque, versión, formato |

Con el **ID de instalación** se cruzan ambas pestañas (por ejemplo, informes por institución con una
tabla dinámica). Si una persona pide borrar su registro desde la app (paso 8 → "Tus datos y tu
registro"), se eliminan sus filas en las dos pestañas y llega un correo de aviso. Las solicitudes por
correo se atienden borrando a mano las filas de ese ID o correo.

## Límites

- Gmail permite unos 100 correos al día desde Apps Script (1,500 con Google Workspace): suficiente para
  los avisos de registros nuevos. Los informes no envían correo.
- Sin internet, la app guarda los envíos y los manda al volver la conexión.
- El registro se puede saltar borrando los datos del navegador: es un registro de uso, no un candado.
