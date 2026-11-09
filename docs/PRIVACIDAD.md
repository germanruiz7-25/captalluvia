# Política de privacidad de CaptaLluvia

**Versión:** borrador 0.2 — 8 de noviembre de 2026
**Responsable:** G. Alfaro — galfaro@icc.org.gt
**Aplica a:** https://captalluvia.org y a la app instalada (PWA)

> Borrador de la fase 0. Se revisará antes de activar el registro de organizaciones (fase 1).
> Se redactó para cumplir el estándar más exigente (RGPD europeo), porque la app puede usarse en cualquier país.

## 1. Resumen

- Tus proyectos (ubicación, techo, número de personas, precios) **se guardan solo en tu dispositivo**.
- Para medir el impacto, la app pide **una sola vez** un registro de tu organización.
- No vendemos ni compartimos datos con fines comerciales. CaptaLluvia es gratuita y no tiene anuncios.
- Puedes **borrar todos tus datos** en cualquier momento (paso 7 → "Tus datos en este dispositivo").

## 2. Qué datos se recopilan

| Dato | Dónde se guarda | Para qué |
| --- | --- | --- |
| Proyecto en curso: punto marcado en el mapa, lluvia, techo, usuarios y consumo | Solo en tu dispositivo (almacenamiento del navegador, `localStorage`) | Continuar el proyecto después y hacer el informe PDF |
| Mapa de ubicación del informe (punto exacto marcado y coordenadas) | Se dibuja en tu dispositivo con teselas del proveedor de mapas; queda dentro del PDF que generas | Ubicar el proyecto en el informe. Si compartes el PDF, compartes esa ubicación |
| Archivos Excel/CSV de lluvia que importes y claves de APIs de estaciones | Solo en tu dispositivo | Usar tus propios datos de lluvia |
| Registro de la organización: nombre, tipo, país, departamento, aceptación de esta política | Servidor (Cloudflare D1) | Saber qué organizaciones usan la app y desde dónde (impacto) |
| Correo electrónico (opcional) | Servidor (Cloudflare D1) | Avisarte de versiones nuevas |
| Identificador aleatorio de instalación | Tu dispositivo y servidor | Contar instalaciones, diseños e informes por organización sin pedir nombres de personas |
| Eventos de uso: apertura, diseño completado, PDF descargado, errores; país de la conexión | Servidor (Cloudflare D1) | Medir el uso y corregir errores |

**No se recopila:** nombre de la persona, coordenadas exactas de la vivienda, dirección IP (no se guarda), datos de pago ni datos de la familia.
Las coordenadas que se envían a los servicios de lluvia se redondean a ~1 km.

## 3. Inteligencia artificial

CaptaLluvia **no usa inteligencia artificial** para calcular: los resultados salen de fórmulas documentadas en `docs/`. El código se desarrolla con asistencia de IA y revisión humana. Si en el futuro se agrega una función con IA, la app lo avisará antes de usarla.

## 4. Terceros que reciben datos

| Tercero | Qué recibe | Para qué |
| --- | --- | --- |
| GitHub Pages (GitHub, Inc.) | Datos técnicos de la conexión al descargar la app | Alojar el sitio |
| Cloudflare (Workers y D1) | Registro de la organización, eventos de uso y consultas a estaciones | Base de datos y puente de estaciones |
| Open-Meteo, NASA POWER, Climate Hazards Center | Coordenadas redondeadas | Obtener la lluvia histórica |
| OpenStreetMap (servidores de teselas) | La zona del mapa que estás viendo (como cualquier mapa en línea) y datos técnicos de la conexión | Mostrar el mapa para ubicar la vivienda |
| Nominatim (OpenStreetMap) | El texto que escribes en "Buscar" y, solo si pulsas "Completar con el punto del mapa", el punto redondeado a ~100 m | Encontrar el lugar y completar comunidad, municipio y departamento |
| Esri, Mapbox o MapTiler (solo si eliges su mapa satelital) | La zona del mapa que estás viendo y datos técnicos de la conexión | Mostrar la imagen satelital |
| APIs de estaciones que tú conectes | Lo que exija cada API (por ejemplo tu clave) | Traer datos de tus estaciones |

No se usan fuentes tipográficas externas (como Google Fonts), CDN externos ni servicios de publicidad.

## 5. Tus derechos

- **Borrar todo:** el botón "Borrar mis datos de este dispositivo" (paso 7) elimina el proyecto guardado en el navegador. Cuando exista el registro de organizaciones, el mismo botón también borrará tu registro y tus eventos en el servidor.
- **Consultar o corregir:** escribe a galfaro@icc.org.gt.
- **Retirar el correo:** cada aviso incluye cómo darte de baja.

## 6. Conservación

El registro de la organización y los eventos de uso se conservan mientras la instalación esté activa y hasta 3 años después del último uso; después se eliminan o se anonimizan para estadísticas generales.

## 7. Cambios

Cada cambio de esta política se publica en este archivo con su fecha y se registra en el historial de GitHub.
