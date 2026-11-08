# Política de privacidad de CaptaLluvia

**Versión:** borrador 0.1 — 7 de noviembre de 2026
**Responsable:** G. Alfaro — galfaro@icc.org.gt
**Aplica a:** https://captalluvia.org y a la app instalada (PWA)

> Borrador de la fase 0. Se revisará antes de activar el registro de organizaciones (fase 1).
> Se redactó para cumplir el estándar más exigente (RGPD europeo), porque la app puede usarse en cualquier país.

## 1. Resumen

- Tus proyectos (ubicación, techo, número de personas, precios) **se guardan solo en tu dispositivo**.
- Para medir el impacto, la app pide **una sola vez** un registro de tu organización.
- No vendemos ni compartimos datos con fines comerciales. CaptaLluvia es gratuita y no tiene anuncios.
- Puedes **borrar todos tus datos** en cualquier momento desde Ajustes.

## 2. Qué datos se recopilan

| Dato | Dónde se guarda | Para qué |
| --- | --- | --- |
| Proyectos: ubicación, medidas del techo, número de personas, consumo, precios | Solo en tu dispositivo (IndexedDB) | Hacer los cálculos y el informe PDF |
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
| Esri y OpenStreetMap (Nominatim) | Zona del mapa visible o texto de búsqueda | Mostrar el mapa y buscar direcciones |
| APIs de estaciones que tú conectes | Lo que exija cada API (por ejemplo tu clave) | Traer datos de tus estaciones |

No se usan fuentes tipográficas externas (como Google Fonts), CDN externos ni servicios de publicidad.

## 5. Tus derechos

- **Borrar todo:** el botón "Borrar todos mis datos" elimina los proyectos y archivos del dispositivo **y** tu registro y eventos en el servidor.
- **Consultar o corregir:** escribe a galfaro@icc.org.gt.
- **Retirar el correo:** cada aviso incluye cómo darte de baja.

## 6. Conservación

El registro de la organización y los eventos de uso se conservan mientras la instalación esté activa y hasta 3 años después del último uso; después se eliminan o se anonimizan para estadísticas generales.

## 7. Cambios

Cada cambio de esta política se publica en este archivo con su fecha y se registra en el historial de GitHub.
