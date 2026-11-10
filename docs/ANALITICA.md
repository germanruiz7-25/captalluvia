# Analítica de uso: GoatCounter y tablero en Looker Studio

CaptaLluvia mide su uso de dos formas que se complementan, sin cookies ni avisos de consentimiento:

| Qué | Herramienta | Qué responde |
| --- | --- | --- |
| **Visitas** | [GoatCounter](https://www.goatcounter.com) | ¿Cuántas personas abren la app, desde qué país, con qué dispositivo y hasta qué paso llegan? |
| **Uso real** | Hoja de registros + [Looker Studio](https://lookerstudio.google.com) | ¿Quién se registró, de qué institución y país, cuántos informes se hicieron, dónde y de qué tipo? |

## 1. GoatCounter (visitas)

La app cuenta, sin cookies ni identificadores:

- una **vista por paso** (`/registro`, `/paso-1` … `/paso-8`): permite ver cuántas personas llegan a cada paso;
- dos **eventos**: `registro-nuevo` e `informe-pdf` (informe descargado).

No se envían datos del proyecto ni de la persona. GoatCounter calcula el país a partir de la conexión y
no guarda la dirección IP. Si el navegador tiene activado "No rastrear", no se cuenta nada.
No se carga ningún script externo: se usa el "píxel" de GoatCounter (una imagen invisible).

### Crear la cuenta

1. Entra a [goatcounter.com/signup](https://www.goatcounter.com/signup).
2. **Code:** `captalluvia` (o el que esté libre; será `captalluvia.goatcounter.com`).
3. Correo y contraseña de la cuenta del proyecto. Crea la cuenta y confirma el correo.
4. En **Settings** de GoatCounter, opcional: zona horaria America/Guatemala.

### Conectar la app

1. GitHub → **Settings → Secrets and variables → Actions → Variables → New repository variable**.
2. Nombre: `VITE_GOATCOUNTER_CODE`. Valor: solo el código, por ejemplo `captalluvia`.
3. Publica una versión (Release) o vuelve a correr **Actions → Publicar en GitHub Pages**.
4. Abre la app publicada y, unos minutos después, revisa el tablero en `https://captalluvia.goatcounter.com`.

El servicio es gratuito para uso público razonable; si CaptaLluvia crece mucho se puede instalar
GoatCounter en un servidor propio (es software libre).

## 2. Tablero de registros en Looker Studio

Requiere que la hoja de registros ya esté funcionando ([REGISTRO.md](REGISTRO.md)) y tenga al menos una
fila en cada pestaña (haz un registro y descarga un informe de prueba).

### Conectar la hoja

1. Entra a [lookerstudio.google.com](https://lookerstudio.google.com) con la misma cuenta de Google de la hoja.
2. **Crear → Informe → Hojas de cálculo de Google** → elige **CaptaLluvia – Registros** → pestaña
   **Registros** → deja marcado "Usar la primera fila como encabezados" → **Añadir**.
3. **Añadir datos** → otra vez la misma hoja, pestaña **Informes** → **Añadir**.

### Gráficos sugeridos

Página "Registros" (fuente: Registros):

- **Cuadro de resultados:** recuento de *ID instalación* (personas registradas).
- **Serie temporal:** dimensión *Fecha* (por semana o mes), métrica recuento.
- **Barras:** *País*; otra con *Uso*; otra con *Departamento* (filtro País = Guatemala).
- **Tabla:** *Institución u organización*, recuento.
- **Mapa geográfico:** dimensión *País* (tipo de campo: País).

Página "Informes" (fuente: Informes):

- **Cuadros de resultados:** recuento (informes descargados), suma de *Usuarios* (personas que se
  beneficiarían) y suma de *Volumen tanque (m³)*.
- **Barras:** *Departamento*; otra con *Infraestructura* (vivienda, escuela, institución).
- **Tabla:** *Departamento*, *Municipio*, recuento, suma de *Usuarios*.
- **Serie temporal:** informes por mes.

Informes por institución: **Recurso → Gestionar combinaciones → Añadir combinación** de Informes y
Registros con la clave *ID instalación*; luego una tabla con *Institución u organización* y recuento.

### Compartir y actualizar

- **Compartir** → agrega correos (solo lectura) o crea un enlace. Los datos personales (nombre, correo)
  solo deben verlos los autores: para un tablero público, quita esas columnas de los gráficos.
- Looker Studio actualiza los datos cada 15 minutos por defecto (**Recurso → Gestionar fuentes de datos
  → Editar → Actualización de datos**).
