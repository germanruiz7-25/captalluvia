# Hoja de ruta de CaptaLluvia

Duraciones estimadas para una persona a medio tiempo (~26 semanas hasta la v1.0).

| Fase | Semanas | Entregables | Versión |
| --- | --- | --- | --- |
| 0 · Preparación | 1–2 | Repositorio, licencia, integración continua, política de privacidad, nota "Acerca de", dominio captalluvia.org, calculadora de área de techo | v0.0.1 ✅ |
| 1 · Calculadora base | 3–8 | Ubicación por coordenadas, GPS y mapa (mapa OpenStreetMap ✅ v0.3.0; satélite pendiente); lluvia de Open-Meteo; oferta vs. demanda; área de techo; tanque y gráfico de simulación; registro obligatorio de organizaciones | v0.1 |
| 2 · Diseño completo | 9–14 | Canaletas, bajantes, tratamiento, ROI, croquis SVG; informe PDF con BOM y presupuesto; perfil de país Guatemala | v0.5 |
| 3 · Datos y campo | 15–20 | Importar Excel/CSV; conectores de estaciones (RedMet del ICC primero); modo sin conexión; CHIRPS por municipio; mantenimiento con recordatorios | — |
| 4 · Piloto Guatemala | 21–26 | Chiquimula, Quetzaltenango y Escuintla; 10–20 viviendas; validación con estaciones INSIVUMEH; ajustes | v1.0 |
| 5 · Expansión global | después | Inglés, nuevos perfiles de país, mejoras propuestas en Issues | — |

## Decisiones tomadas

- Nombre: **CaptaLluvia**; dominio **captalluvia.org**; repositorio `germanruiz7-25/captalluvia`.
- Licencia: PolyForm Noncommercial 1.0.0 (código) y CC BY-NC-SA 4.0 (documentación). Titular: G. Alfaro.
- ✅ (v0.5.0) Registro obligatorio al primer uso y aviso de informes descargados en una hoja de Google mediante Apps Script (sin analítica de terceros). Ver `docs/REGISTRO.md`.
- Confiabilidad del tanque: 90 % de días abastecidos por defecto (80 o 95 % editable).
- Idioma: español en v1.0; inglés en la fase 5.
- Estaciones: RedMet del ICC e importación Excel/CSV (INSIVUMEH) primero; Meteostat después.
