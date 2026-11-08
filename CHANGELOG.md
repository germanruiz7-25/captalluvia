# Cambios

Todas las versiones de CaptaLluvia se registran aquí. Numeración: [versionado semántico](https://semver.org/lang/es/).

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
