# Política de privacidad de CaptaLluvia

**Versión:** 1.0 — 9 de noviembre de 2026
**Responsable:** G. Alfaro, Programa de Gestión de Riesgo de Desastres, Instituto Privado de Investigación sobre Cambio Climático (ICC) — galfaro@icc.org.gt
**Aplica a:** https://germanruiz7-25.github.io/captalluvia/ (y captalluvia.org cuando se active) y a la app instalada (PWA)

> Se redactó para cumplir el estándar más exigente (RGPD europeo), porque la app puede usarse en cualquier país.
> Pendiente: revisión legal por el ICC.

## 1. Resumen

- Tus proyectos (ubicación, techo, número de personas, tanque) **se guardan solo en tu dispositivo**.
- Para saber quién usa la app y medir su impacto, la app pide **una sola vez** un registro con tu nombre, correo,
  institución, uso, país, departamento y municipio. Esos datos se envían a los autores.
- Cada vez que descargas un informe se envía un aviso con datos generales del proyecto (departamento, municipio,
  tipo de infraestructura, usuarios y volumen del tanque). **Nunca coordenadas ni mapas.**
- No vendemos ni compartimos datos con fines comerciales. CaptaLluvia es gratuita y no tiene anuncios.
- Puedes **borrar tu proyecto y tu registro** en cualquier momento (paso 8 → "Tus datos y tu registro").

## 2. Qué datos se recopilan

| Dato | Dónde se guarda | Para qué |
| --- | --- | --- |
| Proyecto en curso: punto marcado en el mapa, lluvia, techo, usuarios y consumo | Solo en tu dispositivo (almacenamiento del navegador, `localStorage`) | Continuar el proyecto después y hacer el informe PDF |
| Mapa de ubicación del informe (punto exacto marcado y coordenadas) | Se dibuja en tu dispositivo con teselas del proveedor de mapas; queda dentro del PDF que generas | Ubicar el proyecto en el informe. Si compartes el PDF, compartes esa ubicación |
| Archivos Excel/CSV de lluvia que importes y claves de APIs de estaciones | Solo en tu dispositivo | Usar tus propios datos de lluvia |
| Registro: nombre y apellido, correo, institución u organización, uso que le darás (rol), país, departamento y municipio (estos dos opcionales), fecha, versión de la app y de esta política | Tu dispositivo y la hoja de registros de los autores (Google Sheets) | Saber quién usa la app y desde dónde, contactarte por temas de la app y reportar su impacto |
| Identificador aleatorio de instalación | Tu dispositivo y la hoja de registros | Relacionar tu registro con los informes descargados y poder borrarlos a tu pedido |
| Aviso de informe descargado: fecha, departamento, municipio, tipo de infraestructura, número de usuarios, volumen del tanque, versión | Hoja de registros de los autores (Google Sheets) | Medir cuántos diseños se hacen, de qué tipo y dónde |

**No se envía:** coordenadas ni mapas del proyecto, nombre del lugar o de la escuela, datos del techo o de la familia, datos de pago. Tu dirección IP la ve Google al recibir el envío (como en cualquier conexión), pero no se guarda en la hoja.
**Base:** tu consentimiento al registrarte. Sin registro no se puede usar la app; si no estás de acuerdo, no la uses.
Las coordenadas que se envían a los servicios de lluvia se redondean a ~1 km.

## 3. Inteligencia artificial

CaptaLluvia **no usa inteligencia artificial** para calcular: los resultados salen de fórmulas documentadas en `docs/`. El código se desarrolla con asistencia de IA y revisión humana. Si en el futuro se agrega una función con IA, la app lo avisará antes de usarla.

## 4. Terceros que reciben datos

| Tercero | Qué recibe | Para qué |
| --- | --- | --- |
| GitHub Pages (GitHub, Inc.) | Datos técnicos de la conexión al descargar la app | Alojar el sitio |
| Google (Apps Script, Hojas de cálculo y Gmail) | Tu registro y los avisos de informes descargados | Guardar los registros en la hoja de los autores y enviarles un correo por cada registro nuevo |
| Open-Meteo, NASA POWER, Climate Hazards Center | Coordenadas redondeadas | Obtener la lluvia histórica |
| OpenStreetMap (servidores de teselas) | La zona del mapa que estás viendo (como cualquier mapa en línea) y datos técnicos de la conexión | Mostrar el mapa para ubicar la vivienda |
| Nominatim (OpenStreetMap) | El texto que escribes en "Buscar" y, solo si pulsas "Completar con el punto del mapa", el punto redondeado a ~100 m | Encontrar el lugar y completar comunidad, municipio y departamento |
| Esri, Mapbox o MapTiler (solo si eliges su mapa satelital) | La zona del mapa que estás viendo y datos técnicos de la conexión | Mostrar la imagen satelital |
| APIs de estaciones que tú conectes | Lo que exija cada API (por ejemplo tu clave) | Traer datos de tus estaciones |

No se usan fuentes tipográficas externas (como Google Fonts), CDN externos ni servicios de publicidad.

## 5. Tus derechos

- **Borrar tu proyecto:** paso 8 → "Tus datos y tu registro" → "Borrar mis datos de este dispositivo".
- **Borrar tu registro:** paso 8 → "Borrar mi registro". Se eliminan tu registro y tus avisos de informes de la hoja de los autores (si no hay conexión, la solicitud se envía al recuperarla). También puedes pedirlo por correo.
- **Consultar o corregir:** escribe a galfaro@icc.org.gt.

## 6. Conservación

El registro y los avisos de informes se conservan hasta 3 años después del último uso; después se eliminan o se anonimizan (se quitan nombre y correo) para estadísticas generales. Solo los autores tienen acceso a la hoja.

## 7. Cambios

Cada cambio de esta política se publica en este archivo con su fecha y se registra en el historial de GitHub.
