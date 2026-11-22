# Instalar CaptaLluvia en tus dispositivos

CaptaLluvia es una **app web instalable (PWA)**: se instala desde el navegador, sin tienda de aplicaciones y sin costo. Una vez instalada:

- tiene su ícono de gota en la pantalla de inicio, el escritorio o el Dock;
- se abre en su propia ventana, sin la barra del navegador;
- funciona **sin internet** (ver abajo qué necesita conexión);
- se actualiza sola: cuando se publica una versión nueva, aparece el aviso "Hay una versión nueva de CaptaLluvia" con el botón **Actualizar**. El proyecto guardado no se pierde.

Dirección: https://germanruiz7-25.github.io/captalluvia/

En la app, el botón **📲 Instalar app** (arriba a la derecha) instala directamente en Android, Windows, Mac y Chromebook con Chrome o Edge, y en los demás casos muestra los pasos.

## Android (Chrome, Edge o Samsung Internet)

1. Abre la dirección en Chrome.
2. Toca **📲 Instalar app** en CaptaLluvia, o el menú **⋮** → **Instalar app** (o **Agregar a la pantalla principal**).
3. Confirma con **Instalar**.

## iPhone y iPad (Safari, Chrome o Edge)

Apple no permite el botón de instalar automático; se hace desde el menú Compartir:

1. Abre la dirección en **Safari**.
2. Toca **Compartir** (el cuadro con la flecha ⬆️; en iOS 26 puede estar dentro del menú **···**).
3. Toca **Agregar a inicio**.
4. Deja activado **Abrir como app web** y toca **Agregar**.

## Computadora con Windows, Mac, Linux o Chromebook (Chrome o Edge)

1. Abre la dirección en Chrome o Edge.
2. Pulsa **📲 Instalar app** en CaptaLluvia, o el ícono de instalar (una pantalla con una flecha) al final de la barra de direcciones.
3. Confirma con **Instalar**. Queda en el menú Inicio, el Launchpad o la lista de apps.

En **Safari para Mac** (macOS Sonoma o más reciente): menú **Archivo** → **Agregar al Dock**.
**Firefox para computadora** no instala apps web; usa Chrome o Edge.

## Uso sin internet (trabajo de campo)

| Funciona sin internet | Necesita internet |
| --- | --- |
| Abrir la app y todos los pasos de cálculo (techo, usuarios, canaletas, tanque) | Consultar la lluvia satelital de un lugar nuevo |
| La lluvia de los lugares ya consultados en ese dispositivo (se usa la más cercana, a menos de 15 km) | El mapa satelital (el mapa de calles ya visto sí queda guardado) |
| Coordenadas escritas a mano y el GPS del teléfono ("Mi ubicación") | Buscar un lugar por nombre y "Completar con el punto del mapa" |
| Estaciones del ICC, curvas IDF y archivos Excel/CSV de estaciones | Enviar el registro y los avisos de uso (quedan en cola y se envían al volver la señal) |
| Informe PDF, informe Word, resumen de 2 hojas y presentación | |

**Antes de salir a campo:** abre la app con internet, marca cada comunidad que vas a visitar y toca **Ver la lluvia de este lugar**. La lluvia queda guardada en el dispositivo (hasta 40 lugares) y en el paso 1 se ve la lista en **Usar la app sin internet**. Ya en campo, sin señal, marca la vivienda con el GPS o las coordenadas: la app usa la lluvia guardada más cercana y lo indica en la fuente del informe.

## Para los administradores del repositorio

- La PWA se arma con [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox). La configuración está en `vite.config.ts`: manifiesto, íconos (`public/iconos/`) y caché.
- Toda la app (incluidos los módulos del Word y de la presentación) queda guardada en el dispositivo. Las teselas de OpenStreetMap ya vistas se guardan (máximo 400, 30 días), como permite su política. Las imágenes satelitales de Esri, Mapbox y MapTiler no se guardan para usarlas sin conexión: sus condiciones no lo permiten sin licencia.
- La lluvia guardada vive en `localStorage` (`captalluvia.lluvias.v1`, `src/core/lluviaGuardada.ts`).
- No hay que configurar nada en GitHub: GitHub Pages sirve con HTTPS, que es lo único que exige una PWA. Al publicar un Release, las apps instaladas ven el aviso de versión nueva la próxima vez que se abren (o en menos de una hora si están abiertas).
- Si algún día se cambia la dirección (por ejemplo a captalluvia.org), las apps instaladas desde la dirección anterior hay que volver a instalarlas desde la nueva.
