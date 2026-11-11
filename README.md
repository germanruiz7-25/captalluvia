# CaptaLluvia

**Diseño de sistemas de cosecha de agua de lluvia (SCALL) para viviendas.**

CaptaLluvia es una herramienta web gratuita para ubicar una vivienda, analizar la lluvia histórica del lugar y dimensionar un sistema de cosecha de agua de lluvia: área de techo, canaletas, tubería, tanque, tratamiento y presupuesto. Funciona en cualquier parte del mundo; las primeras pruebas de campo se hacen en Guatemala.

- **Sitio:** https://captalluvia.org (mientras se conecta el dominio: https://germanruiz7-25.github.io/captalluvia/)
- **Autores:** Alfaro, German & Fuentes, Francisco
- **Organización:** Programa de Gestión de Riesgo de Desastres (GdR), Instituto Privado de Investigación sobre Cambio Climático (ICC)
- **Contacto:** galfaro@icc.org.gt

## Estado

Versión **0.6.0**. Al primer uso la app pide un **registro** (nombre, correo, institución, uso y lugar) que llega a una hoja de Google de los autores; ver [docs/REGISTRO.md](docs/REGISTRO.md). La app es un **asistente en 8 pasos**, una pantalla a la vez, con barra de avance y resultados preliminares: (1) ubicar la vivienda en un mapa (OpenStreetMap: tocar el techo, buscar el municipio o usar el GPS) o escribir datos de lluvia; (2) lluvia del lugar (20 años de Open-Meteo); (3) techo (medidas ancho × largo del techo existente, opcional), coeficiente de escorrentía, primer descarte y lluvia neta; (4) usuarios de vivienda, escuela o institución; (5) m² de techo necesarios con dibujo; (6) canaletas y bajantes por método racional, con la intensidad de diseño tomada de la curva IDF de la estación más cercana (INSIVUMEH e ICC, 2025) y un **simulador** de lluvia intensa, con el canal de PVC del mercado nacional (colonial o alto caudal) y dibujos; (7) tanque de almacenamiento: balance mes a mes, tanques tipo tinaco o cisterna de block; (8) resumen e **informe técnico en PDF** con carátula, con introducción, cuadro resumen del diseño, conclusiones y bibliografía. El proyecto se guarda solo en el dispositivo y se puede borrar, igual que el registro.

> **Descargo de responsabilidad:** CaptaLluvia es una herramienta de apoyo para el prediseño; no sustituye la revisión de un profesional. El diseño definitivo, la construcción y la operación son responsabilidad de quien los realiza. Texto completo en [docs/DESCARGO.md](docs/DESCARGO.md).

La hoja de ruta completa está en [docs/HOJA-DE-RUTA.md](docs/HOJA-DE-RUTA.md).

## Cómo usarla en tu computadora

Requiere [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install        # instala dependencias
npm run dev        # abre la app en http://localhost:5173
npm test           # corre las pruebas del motor de cálculo
npm run build      # genera el sitio en la carpeta dist/
```

## Estructura

```
src/core/      motor de cálculo puro (sin interfaz), con pruebas en tests/
src/lib/       componentes de la interfaz
src/config/    acerca.json: autor, organización, objetivo y licencia (se muestran en la app y en los PDF)
docs/          privacidad, registro, publicación, hoja de ruta y metodología
herramientas/  código de Google Apps Script que recibe los registros
.github/       integración continua, despliegue a GitHub Pages y plantillas de reportes
```

## Cómo citar

> Alfaro, G., & Fuentes, F. (2026). *CaptaLluvia* (versión 0.4.0) [Software]. Programa de Gestión de Riesgo de Desastres, Instituto Privado de Investigación sobre Cambio Climático. https://germanruiz7-25.github.io/captalluvia/
>
> En el texto: (Alfaro & Fuentes, 2026).

GitHub también ofrece la cita en el botón **"Cite this repository"** (archivo `CITATION.cff`).

## Licencia

- **Código:** [PolyForm Noncommercial 1.0.0](LICENSE). Puedes usar, estudiar, adaptar y compartir CaptaLluvia **para fines no comerciales**. Instituciones de gobierno, educativas, de investigación pública, de seguridad pública, ambientales y organizaciones benéficas pueden usarla libremente. **No se permite venderla ni usarla con fines comerciales.**
- **Documentación y manuales:** [CC BY-NC-SA 4.0](docs/LICENCIA-DOCUMENTACION.md).
- Al compartir el código debes incluir el archivo `LICENSE` con sus líneas "Required Notice".

¿Quieres un permiso distinto? Escribe a galfaro@icc.org.gt.

## Contribuir

Las sugerencias y mejoras son bienvenidas. Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de enviar cambios.

## Fuentes de datos y privacidad

- Atribución de las fuentes de datos: [ATTRIBUTION.md](ATTRIBUTION.md)
- Política de privacidad: [docs/PRIVACIDAD.md](docs/PRIVACIDAD.md)
- Registro de uso (Google Sheets): [docs/REGISTRO.md](docs/REGISTRO.md)
- Analítica sin cookies (GoatCounter) y tablero en Looker Studio: [docs/ANALITICA.md](docs/ANALITICA.md)

## Inteligencia artificial

CaptaLluvia no usa inteligencia artificial para calcular: los resultados salen de fórmulas documentadas y probadas. El código se desarrolla con asistencia de IA y revisión humana.

## Aviso

Los resultados son estimaciones para prefactibilidad y no reemplazan el diseño firmado por un profesional. El agua para consumo humano requiere análisis de laboratorio.
