# Metodología de cálculo

Unidades: lluvia en mm (1 mm = 1 L/m²), áreas en m², volúmenes en m³.
Código: `src/core/` · Pruebas: `tests/core/`.

## 0. Lluvia del lugar (`lluvia.ts`, `openmeteo.ts`)

- Se descargan los últimos 20 años completos de lluvia diaria de Open-Meteo (reanálisis ERA5) para las coordenadas redondeadas a 2 decimales (~1 km).
- Para cada mes de cada año se suma la lluvia; un mes se acepta si tiene al menos 80 % de días con dato (los días faltantes se completan en proporción).
- La lluvia mensual es el promedio de los años válidos; la anual, la suma de los 12 promedios.
- Un día con 1 mm o más cuenta como día con lluvia (un evento de primer descarte).
- En el modo manual, los días con lluvia del año se reparten entre los meses en proporción a la lluvia de cada mes.

## 0.1 Lluvia neta y m³ (`oferta.ts`)

**Umbral de captación:** solo se capta en los meses con lluvia promedio igual o mayor a 40 mm (editable), criterio de la metodología SCALL del Colegio de Postgraduados, México, y su Centro Internacional de Demostración y Capacitación del Aprovechamiento del Agua de Lluvia (CIDECALLI) (Anaya Garduño, 2011). La lluvia de los meses más secos no se cuenta.

Para cada mes captado: neta = máx(0, P_mes × Ce − días_con_lluvia_mes × d_ff); los meses bajo el umbral aportan 0. La neta anual es la suma de los meses.
Resumen: lluvia bruta − lluvia de meses bajo el umbral − pérdida por Ce − primer descarte = lluvia neta.

**Equivalencia:** 1 mm de lluvia sobre 1 m² = 1 litro.
Con un área de techo A: m³ netos = neta (mm) × A / 1000.

## 0.2 Demanda (`demanda.ts`)

V = usuarios × litros por usuario al día × días de uso al año / 1000.
Días de uso: vivienda 365; escuela 180 (mínimo de días de clase en Guatemala; editable); institución 250 (editable).
La dotación puede elegirse de opciones sugeridas o definirse por usos (por ejemplo escuela: 2 L para beber + 1 L para lavado de manos y boca o cocina).

## 1. Demanda anual de la familia

V = personas × dotación (L/persona/día) × 365 / 1000

Dotaciones de referencia: 20 L/persona/día (acceso básico, OMS); 50 y 100 L/persona/día (referencias de Naciones Unidas).

## 2. Lluvia aprovechable

P_aprovechable = P_anual × Ce − n_eventos × d_ff  (desde v0.1.0 se calcula mes a mes, ver 0.1)

- **Ce**, coeficiente de escorrentía: lámina metálica 0.90; teja de barro 0.80; losa de concreto 0.80; paja 0.60.
- **n_eventos**: días con lluvia en el año (en la fase 1 se contarán los días con más de 1 mm en la serie diaria).
- **d_ff**: primer descarte (first flush), 1 mm por evento (1 L por m² de techo).

## 3. Área mínima de techo

A_min = 1000 × V / P_aprovechable

El área es la **proyección horizontal** del techo (vista en planta), no la superficie inclinada. Se redondea al m² entero superior.

## 4. Formas sugeridas

Para cada proporción largo:ancho de 1, 1.5 y 2 se calcula el ancho = √(A / proporción), se redondea hacia arriba a 0.5 m, y luego el largo = A / ancho, también redondeado hacia arriba a 0.5 m. Así cada opción cubre al menos el área mínima. La canaleta va en el lado largo.

## 5. Techo de una o dos aguas

- **Un agua:** una sola pendiente; toda el área drena a una canaleta en un lado largo.
- **Dos aguas:** la cumbrera corre por el centro, paralela al lado largo. El área en planta se divide en dos segmentos iguales (A/2 cada uno), cada segmento mide ancho/2 de la canaleta a la cumbrera y drena a su propia canaleta del mismo largo. Las dos bajantes llegan al mismo tanque.

El área total en planta es la misma en ambos casos; lo que cambia es cuántas canaletas y bajantes se necesitan y el caudal que recibe cada una (fase 2).

## 6. Canaletas y bajantes (`drenaje.ts`)

1. **Caudal de diseño (método racional):** Q [L/s] = C × i [mm/h] × A [m²] / 3600. C es el coeficiente del material del techo; i es la intensidad de diseño (150 mm/h por defecto, editable; usar la curva IDF local para 5 minutos y periodo de retorno de 5 a 10 años). En techo de dos aguas cada canaleta recibe la mitad del caudal.
2. **Bajantes (Wyly y Eaton, 1961):** Q [L/s] = K × r^(5/3) × D^(8/3), D = diámetro interior en mm, r = 1/3 de llenado, K = 27.8 × 0.0630902 / 25.4^(8/3) ≈ 3.14×10⁻⁴. Con esa capacidad se calcula cuántos m² de techo evacua cada diámetro y cuántas bajantes necesita cada canaleta: n = ⌈Q_canaleta / Q_bajante⌉. Diámetros interiores aproximados de PVC: 2" = 54 mm, 3" = 82 mm, 4" = 107 mm, 6" = 158 mm.
3. **Sugerencia de bajante:** el diámetro más pequeño desde 3" (mínimo práctico) que resuelve con 1 o 2 bajantes por canaleta.
4. **Canaleta (Manning):** Q = (1/n) × A × R^(2/3) × S^(1/2) para sección semicircular llenando hasta 3/4 del radio (25 % de borde libre). n = 0.011 (PVC) o 0.013 (lámina galvanizada); S = pendiente (0.5 % por defecto). Cada tramo entre bajantes lleva Q_canaleta / n_bajantes. Se sugiere la canaleta comercial más pequeña (4", 5", 6", 8") que cumple.

Todas son **dimensiones mínimas**; el diseñador decide si las adopta o las aumenta.

## Ejemplo de verificación

5 personas × 50 L/día = 91.25 m³/año. Lluvia de 1,200 mm con 110 días de lluvia, lámina metálica, descarte de 1 mm:
P_aprovechable = 1,200 × 0.90 − 110 = 970 mm → A_min = 91,250 / 970 = 94.07 m² → **95 m²**.
Formas: 9.5 × 10.0 m (95.0 m²), 8.0 × 12.0 m (96.0 m²), 7.0 × 14.0 m (98.0 m²).
Con 20 L/persona/día: **38 m²**.
En dos aguas, el techo de 9.5 × 10.0 m queda en dos segmentos de 4.75 × 10.0 m (47.5 m² cada uno).

## Pendiente (fase 1)

- Área recomendada mediante simulación diaria del tanque con la confiabilidad objetivo (90 % por defecto).
- Lluvia obtenida automáticamente de la serie diaria del punto.

## Referencias

- Anaya Garduño, M. (2011). *Captación del agua de lluvia. Solución caída del cielo* (1.ª ed.). Colegio de Postgraduados; Universidad Autónoma Chapingo. ISBN 9786077150176. Umbral de 40 mm de PN: pp. 56–57, fig. 4.7.
- Anaya-Garduño, M., Pérez-Hernández, A. y Luque-Delgadillo, A. (2021). Sistemas de captación del agua de lluvia (SCALL) para diversos usos. *Agro-Divulgación*, 1(0). https://doi.org/10.54767/ad.v1i1.3
- Chow, V. T. (1959). *Open-channel hydraulics*. Nueva York: McGraw-Hill.
- Wyly, R. S. y Eaton, H. N. (1961). *Capacities of plumbing stacks in buildings* (BMS Report 158). Washington: National Bureau of Standards.
- OPS/CEPIS (2004). *Guía de diseño para captación del agua de lluvia* (OPS/CEPIS/04.122). Lima: Organización Panamericana de la Salud.
- Hersbach, H. et al. (2020). The ERA5 global reanalysis. *Quarterly Journal of the Royal Meteorological Society*, 146(730), 1999–2049. https://doi.org/10.1002/qj.3803
- Open-Meteo.com, Historical Weather API (datos CC BY 4.0). https://open-meteo.com
- Howard, G. y Bartram, J. (2003). *Domestic water quantity, service level and health*. Ginebra: OMS.
- Asamblea General de las Naciones Unidas (2010). Resolución A/RES/64/292, El derecho humano al agua y el saneamiento.
- Ministerio de Educación de Guatemala: mínimo de 180 días de clase por ciclo escolar.
