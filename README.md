# CaptaLluvia

**Diseño de sistemas de cosecha de agua de lluvia (SCALL) para viviendas.**

CaptaLluvia es una herramienta web gratuita para ubicar una vivienda, analizar la lluvia histórica del lugar y dimensionar un sistema de cosecha de agua de lluvia: área de techo, canaletas, tubería, tanque, tratamiento y presupuesto. Funciona en cualquier parte del mundo; las primeras pruebas de campo se hacen en Guatemala.

- **Sitio:** https://captalluvia.org (mientras se conecta el dominio: https://germanruiz7-25.github.io/captalluvia/)
- **Autor:** Alfaro, G.
- **Organización:** Programa de Gestión de Riesgo de Desastres (GdR), Instituto Privado de Investigación sobre Cambio Climático (ICC)
- **Contacto:** galfaro@icc.org.gt

## Estado

Versión **0.0.1 — fase 0 (preparación)**. Incluye la estructura del proyecto, la licencia, la integración continua y un primer cálculo: el **área mínima de techo** que necesita una familia, con tres formas sugeridas de ancho × largo.

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
docs/          privacidad, publicación, hoja de ruta y metodología
.github/       integración continua, despliegue a GitHub Pages y plantillas de reportes
```

## Cómo citar

> Alfaro, G. (2026). *CaptaLluvia v0.0.1*. Programa de Gestión de Riesgo de Desastres, ICC. https://captalluvia.org

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

## Inteligencia artificial

CaptaLluvia no usa inteligencia artificial para calcular: los resultados salen de fórmulas documentadas y probadas. El código se desarrolla con asistencia de IA y revisión humana.

## Aviso

Los resultados son estimaciones para prefactibilidad y no reemplazan el diseño firmado por un profesional. El agua para consumo humano requiere análisis de laboratorio.
