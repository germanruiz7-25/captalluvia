# Cambios

Todas las versiones de CaptaLluvia se registran aquí. Numeración: [versionado semántico](https://semver.org/lang/es/).

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
