# Cambios

Todas las versiones de CaptaLluvia se registran aquí. Numeración: [versionado semántico](https://semver.org/lang/es/).

## [0.5.0] — 2026-11-09 — Registro de uso

### Agregado
- **Registro obligatorio al primer uso:** nombre, correo, institución u organización, uso (rol), país, departamento y municipio, con aceptación de la política de privacidad y del descargo. Se pide una vez por dispositivo y explica qué se envía y a quién.
- **Hoja de registros en Google Sheets** mediante Google Apps Script (`herramientas/registro/Codigo.gs`): pestaña "Registros", correo de aviso al responsable por cada registro nuevo y pestaña "Informes" con un aviso por cada informe descargado (departamento, municipio, infraestructura, usuarios y volumen del tanque; nunca coordenadas). Pasos de instalación en `docs/REGISTRO.md`; la dirección se configura con la variable `VITE_REGISTRO_URL`.
- Envíos sin conexión: quedan en cola y se mandan al volver la conexión.
- **Borrar mi registro** (paso 8): pide a la hoja que elimine el registro y los avisos de esa instalación.
- 5 pruebas nuevas (112 en total).

### Cambiado
- Política de privacidad 1.0: nuevos datos recopilados, Google como tercero, base de consentimiento, borrado y conservación.

## [0.4.0] — 2026-11-08 — Curvas IDF, simulador, tanque e informe técnico

### Agregado
- **Paso 7 · Tanque de almacenamiento:** balance mes a mes (agua captada con el techo existente o el área mínima, demanda mensual) y volumen por el método del pico secuente (Rippl). Tabla mensual con lluvia, PN, m³ captados, **cuántos tanques se llenan cada mes** y agua guardada al final del mes; gráfica del nivel del tanque.
- **Volumen que se decide usar** (por ejemplo, 10 m³): la simulación, los tanques y la cisterna se recalculan; se muestra su equivalencia en **barriles de 55 galones (208 L)** con el dibujo de un barril con agua celeste y el número de unidades adentro (por ejemplo, 15 m³ = 72 barriles). El volumen elegido se guarda con el proyecto.
- **Opción 1: tanques de polietileno tipo tinaco** (450 a 10,000 L, medidas de 450 a 2,500 L de Rotoplas Centroamérica) con número de tanques y dibujo.
- **Opción 2: cisterna de block y cemento:** medidas interiores sugeridas (base cuadrada, alto útil editable, 0.30 m de borde libre) o escritas por el usuario (largo × ancho × alto → m³), con dibujo en perspectiva.
- **Carátula del informe:** logotipo del ICC, "Informe técnico. Proyecto: Diseño y cálculo de Sistema de Captación de Agua de Lluvia – SCALL", lugar (institución, escuela o vivienda) y ubicación (comunidad, municipio, departamento).
- Paso 1: campos de comunidad, municipio y departamento, con botón para completarlos desde el punto del mapa (Nominatim, punto redondeado a ~100 m).
- **Diagramación del informe:** títulos, tablas, gráficas y dibujos se mantienen juntos en la misma hoja; figuras centradas; gráfica del tanque con letras legibles al imprimir.
- **Formato del informe:** Calibri, texto en negro, títulos 16 pt, subtítulos 14 pt y texto 12 pt; gráficas y dibujos en azul.
- **Autores:** Alfaro, German & Fuentes, Francisco; cita en formato APA 7: Alfaro, G., & Fuentes, F. (2026).
- **Elaborado por:** nombre del técnico o responsables del cálculo e institución, en la carátula.
- **Descargo de responsabilidad** de los autores y del ICC (docs/DESCARGO.md): en Acerca de, en el paso 8, en la carátula (versión corta) y al final del informe.
- **Informe PDF renovado:** encabezado con logotipos (CaptaLluvia y, opcionalmente, los de la organización en `public/logos/`), ficha del proyecto, **introducción**, secciones numeradas, **cuadro resumen del diseño** (sitio y lluvia, techo, demanda, canaletas y bajantes), **conclusiones y recomendaciones** automáticas y **bibliografía**.
- El cuadro resumen y las conclusiones también se ven en el paso 7.
- **Techo existente por ancho × largo:** el paso 3 pide las medidas en planta y calcula los m²; el paso 5 compara con los m² necesarios y el paso 6 drena ese techo por defecto.
- **Intensidad de diseño desde curvas IDF:** la app busca la estación más cercana al punto marcado entre las 22 estaciones de *Curvas de intensidad, duración y frecuencia (IDF) para la vertiente del Pacífico de Guatemala* (INSIVUMEH e ICC, 2025) y calcula I = A / (D + B)^n para un aguacero de 5 minutos y el periodo de retorno elegido (10 años sugerido). Si la estación está a más de 25 km, se pide escribir el dato.
- Enlace a la app **IDF Guatemala (Sherman) de Walter Bardales** en Google Earth Engine para consultar la curva del punto y escribir el valor; citada en las fuentes.
- **Simulador "¿qué pasa si llueve más fuerte?":** barra de intensidad con marcas de los periodos de retorno de la estación, dibujo del canal con el nivel del agua (dentro del diseño, al límite o rebalsa), uso de la bajante y las intensidades a las que el canal rebalsa y la bajante se satura; indica qué falla primero.
- **Tabla de aguaceros cortos** de la estación (5 a 60 minutos × 2 a 100 años) coloreada según cómo responde el canal.
- **Análisis hidráulico del canal y la bajante** (pantalla e informe): capacidad del canal con borde libre y lleno, capacidad de la bajante y capacidad máxima del tramo en L/s y **L/min**, elemento que controla, intensidad máxima que soporta y, con la curva IDF, por periodo de retorno (2 a 100 años): intensidad de 5 min, caudal, % de la capacidad y **duración de los aguaceros que rebalsan** (D* = (A/i)^(1/n) − B).
- 46 pruebas nuevas (107 en total).

- **Sección 2 del informe · Ubicación y generalidades del proyecto:** mapas de macrolocalización y microlocalización con el punto marcado en el paso 1, norte y barra de escala; tabla con lugar, comunidad, municipio, departamento, coordenadas, tipo de infraestructura y cantidad de usuarios.

### Cambiado
- Tablas del análisis hidráulico y de generalidades con líneas (cuadrícula).
- Distribución del informe: "Lluvia del lugar", "Techo y lluvia neta", "Tanque de almacenamiento", "Cuadro resumen", "Conclusiones" (seguidas de la bibliografía) y "Acerca de CaptaLluvia" con el descargo empiezan en hoja nueva; los canales de PVC del mercado y el análisis hidráulico siguen de forma continua; la ilustración "1 mm = 1 L" ya no se imprime.
- Mapas de ubicación con imagen satelital cuando hay una clave de mapas configurada (OpenStreetMap como respaldo).
- El informe deja solo la información técnica que justifica el diseño: se ocultan las instrucciones y explicaciones de uso de la app y el simulador interactivo (se reemplaza por el análisis hidráulico).
- Cuadro resumen y conclusiones con la capacidad por tramo en L/min, la intensidad que soporta y los aguaceros que rebalsan según la curva IDF.

## [0.3.0] — 2026-11-08 — Asistente por pasos y mapa

### Agregado
- **Selector de mapa:** Calles (OpenStreetMap, siempre disponible) y satélite de Esri, Mapbox o MapTiler cuando su clave está configurada (variables del repositorio `VITE_ESRI_KEY`, `VITE_MAPBOX_TOKEN`, `VITE_MAPTILER_KEY`). La app abre en satélite si hay alguno y recuerda la elección.
- **Mapa para ubicar la vivienda** (OpenStreetMap con Leaflet): se toca el techo para marcarla, el marcador se puede arrastrar, se busca el municipio o la aldea (Nominatim) y se puede usar el GPS. Las coordenadas también se pueden escribir.
- **Asistente en 7 pasos:** Ubicación → Lluvia → Techo → Usuarios → Área → Canaletas → Informe. Una pantalla a la vez, con barra de avance (iconos y ✓ en los pasos revisados), botones Anterior/Siguiente y el botón Atrás del navegador.
- **Resumen final** con fichas de los resultados principales y el botón del informe PDF.
- El proyecto **se guarda en el dispositivo** para continuar después, y el paso 7 permite **borrar los datos**.

### Cambiado
- Los detalles del cálculo (tablas mes a mes, bajantes, canaletas, canales del mercado) quedan plegados en "Ver…" para no saturar la pantalla; en el PDF se muestran completos.
- El techo muestra primero los litros netos por m² en grande.
- Política de privacidad (borrador 0.2) y atribuciones: OpenStreetMap, Nominatim y Leaflet; almacenamiento local.
- 13 pruebas nuevas (70 en total).

## [0.2.0] — 2026-11-08 — Canaletas y bajantes

### Agregado
- **Paso 5 · Canaletas y bajantes:** caudal de diseño por el **método racional** (Q = C·i·A/3600), con intensidad de diseño, pendiente y material de la canaleta editables.
- **Bajantes:** capacidad de cada diámetro (2", 3", 4", 6") con la ecuación de Wyly y Eaton, **m² de techo que evacua cada bajante** y número de bajantes por canaleta. Sugerencia mínima: el diámetro más pequeño desde 3" que resuelve con 1 o 2 bajantes por canaleta.
- **Canaletas semicirculares** (4", 5", 6", 8"): capacidad con Manning y 25 % de borde libre, comparada con el caudal de cada tramo entre bajantes; se sugiere la menor que cumple.
- **Canales del mercado de Guatemala:** tabla con los canales de PVC tipo colonial (Amanco Wavin Canal Colonial; Durman Estilo Clásico y Estilo Tradicional) y de alto caudal (Amanco Wavin Canal Alto Caudal; Durman MaxiCanal), con largos y bajantes compatibles. La app sugiere cuál usar.
- El número de bajantes se compara con las tablas de los fabricantes (2" = 20 m², 3" = 60 m², 4" = 120 m² por bajante) y se usa el valor más exigente.
- **Opción 2 · canal comercial:** revisión con Manning del Canal Colonial (fondo 100 mm, lados de 90 y 130 mm) y del Canal Alto Caudal (fondo 151.2 mm, lados de 90.72 y 136.08 mm) de Amanco Wavin, o de un canal con medidas propias; el agua se limita a 3/4 del lado más bajo.
- La sugerencia colonial o alto caudal se decide con la capacidad real de esas secciones; con alto caudal se agregan bajantes de 4" si el canal no alcanza.
- **Dibujos** del corte del canal comercial (colonial o alto caudal), del corte de la canaleta (agua a 3/4 del radio, borde libre, pendiente) y del tubo PVC de la bajante (Ø exterior, Ø interior, agua pegada a la pared).
- Se puede elegir una de las tres formas de techo sugeridas o escribir medidas propias.
- Fuentes y metodología: método racional, Chow (1959), Wyly y Eaton (1961).
- 17 pruebas nuevas (57 en total).

### Cambiado
- El flujo pasa a 5 pasos; el botón del informe PDF queda al final, después de canaletas y bajantes.

## [0.1.1] — 2026-11-07 — Precipitación neta (PN) y umbral de 40 mm de PN

### Cambiado
- El umbral de captación se compara con la **precipitación neta (PN)** de cada mes (precipitación × Ce − primer descarte), no con la lluvia que cae: se captan los meses con PN ≥ 40 mm (Anaya Garduño, 2011, pp. 56–57, fig. 4.7).
- Las gráficas muestran la PN a cosechar como barra dentro de la precipitación promedio y una fila "PN" con los valores debajo de los meses; la línea punteada de 40 mm se lee sobre la PN. Los meses que no se captan aparecen en gris.
- La tabla mensual del paso 1 incluye la fila de PN.
- Cita completa del criterio en Fuentes de consulta: 1.ª ed., Colegio de Postgraduados y Universidad Autónoma Chapingo, pp. 56–57, fig. 4.7.

### Nota
- La etiqueta v0.1.0 quedó apuntando al código anterior (se creó antes de fusionar el PR #10); el sitio se publicó después desde main. v0.1.1 es la primera etiqueta que incluye el flujo por pasos.

## [0.1.0] — 2026-11-07 — Flujo por pasos e informe PDF

### Agregado
- **Paso 1 · Lluvia del lugar:** estimación por coordenadas o GPS con 20 años de lluvia diaria de Open-Meteo (reanálisis ERA5), o ingreso manual de la lluvia mensual. Muestra lluvia anual, promedios mensuales (gráfico y tabla), días con lluvia y litros que caen por m² de techo.
- **Paso 2 · Techo y lluvia neta:** material del techo (Ce), forma (uno o dos aguas), primer descarte y área de techo existente opcional. Resumen paso a paso de lluvia bruta → pérdida por Ce → primer descarte → lluvia neta, gráfico mensual bruta vs. neta y m³ netos al año del techo existente.
- **Paso 3 · Usuarios y consumo:** vivienda, escuela o institución; número de usuarios; litros por usuario con opciones sugeridas (escuela: 2 L para beber + 1 L para lavado = 3 L) o **dotación personalizada por usos**; días de uso al año (escuela: 180 días de clase).
- **Paso 4 · Resultados:** m² de techo necesarios, comparación con el techo existente (% de la demanda cubierta) y medidas sugeridas con dibujo.
- **Informe PDF** desde el navegador (Guardar como PDF), con encabezado, nombre del proyecto, resultados de los cuatro pasos, **fuentes de consulta** y la nota "Acerca de CaptaLluvia".
- **Umbral de captación:** solo se capta en los meses con 40 mm o más de lluvia (editable), según la metodología SCALL del Colegio de Postgraduados (Anaya Garduño, 2011). Línea roja de referencia en las gráficas, meses secos marcados y su lluvia descontada en el resumen de lluvia neta.
- **Dibujo "1 mm sobre 1 m² = 1 litro"** con un pichel, para explicar la equivalencia.
- **Fuentes de consulta** (datos de lluvia, ERA5, metodología SCALL del Colegio de Postgraduados/CIDECALLI, OPS/CEPIS, OMS, ONU, MINEDUC) en pantalla y en el informe.
- Las gráficas y el dibujo del litro se adaptan al ancho real de la pantalla para que el texto conserve su tamaño en el teléfono.
- Motor de cálculo: `lluvia.ts`, `openmeteo.ts`, `oferta.ts`, `demanda.ts`; 37 pruebas automáticas.

### Cambiado
- La calculadora única se reemplazó por el flujo de cuatro pasos.
- Las coordenadas se redondean a ~1 km antes de consultar la lluvia (privacidad).

## [0.0.2] — 2026-11-07

### Agregado
- Opción de **techo de dos aguas** (cumbrera al centro): el área se divide en dos segmentos iguales, cada uno con su canaleta, bajante y cota. Es la opción predeterminada por ser la más común a nivel comunitario.
- La calculadora acepta hasta 5,000 personas (viviendas o escuelas) y muestra el área con separador de miles.

### Corregido
- Las letras y cotas de los dibujos mantienen siempre el mismo tamaño, sin importar el área del techo (antes se volvían diminutas con áreas grandes, por ejemplo en escuelas).
- La leyenda ya no separa cada símbolo de su texto en el teléfono.

## [0.0.1] — 2026-11-07 — Fase 0: preparación

### Agregado
- Estructura del proyecto (Vite + TypeScript + Svelte), sin fuentes ni librerías externas en tiempo de ejecución.
- Motor de cálculo `src/core/techo.ts`: demanda anual, lluvia aprovechable (escorrentía y primer descarte), área mínima de techo y tres formas sugeridas de ancho × largo redondeadas a 0.5 m. 15 pruebas automáticas.
- Primera pantalla: calculadora de área de techo con dibujo a escala y sección "Acerca de CaptaLluvia".
- Licencia PolyForm Noncommercial 1.0.0 (código) y CC BY-NC-SA 4.0 (documentación).
- Integración continua (pruebas, revisión de tipos y compilación) y despliegue a GitHub Pages al publicar una versión.
- Borrador de la política de privacidad, guía de contribución, atribución de fuentes y archivo de cita.
