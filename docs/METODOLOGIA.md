# Metodología de cálculo

Unidades: lluvia en mm (1 mm = 1 L/m²), áreas en m², volúmenes en m³.
Código: `src/core/techo.ts` · Pruebas: `tests/core/techo.test.ts`.

## 1. Demanda anual de la familia

V = personas × dotación (L/persona/día) × 365 / 1000

Dotaciones de referencia: 20 L/persona/día (acceso básico, OMS); 50 y 100 L/persona/día (referencias de Naciones Unidas).

## 2. Lluvia aprovechable

P_aprovechable = P_anual × Ce − n_eventos × d_ff

- **Ce**, coeficiente de escorrentía: lámina metálica 0.90; teja de barro 0.80; losa de concreto 0.80; paja 0.60.
- **n_eventos**: días con lluvia en el año (en la fase 1 se contarán los días con más de 1 mm en la serie diaria).
- **d_ff**: primer descarte (first flush), 1 mm por evento (1 L por m² de techo).

## 3. Área mínima de techo

A_min = 1000 × V / P_aprovechable

El área es la **proyección horizontal** del techo (vista en planta), no la superficie inclinada. Se redondea al m² entero superior.

## 4. Formas sugeridas

Para cada proporción largo:ancho de 1, 1.5 y 2 se calcula el ancho = √(A / proporción), se redondea hacia arriba a 0.5 m, y luego el largo = A / ancho, también redondeado hacia arriba a 0.5 m. Así cada opción cubre al menos el área mínima. La canaleta va en el lado largo.

## Ejemplo de verificación

5 personas × 50 L/día = 91.25 m³/año. Lluvia de 1,200 mm con 110 días de lluvia, lámina metálica, descarte de 1 mm:
P_aprovechable = 1,200 × 0.90 − 110 = 970 mm → A_min = 91,250 / 970 = 94.07 m² → **95 m²**.
Formas: 9.5 × 10.0 m (95.0 m²), 8.0 × 12.0 m (96.0 m²), 7.0 × 14.0 m (98.0 m²).
Con 20 L/persona/día: **38 m²**.

## Pendiente (fase 1)

- Área recomendada mediante simulación diaria del tanque con la confiabilidad objetivo (90 % por defecto).
- Lluvia obtenida automáticamente de la serie diaria del punto.
