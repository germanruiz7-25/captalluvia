# Cómo publicar CaptaLluvia en GitHub y conectar el dominio

## 1. Crear el repositorio

1. Entra a GitHub con la cuenta **germanruiz7-25**.
2. Botón **New repository**.
3. Nombre: `captalluvia`. Visibilidad: **Public** (GitHub Pages gratis solo funciona con repositorios públicos).
4. **No** marques "Add a README", ni licencia, ni .gitignore: ya vienen en este paquete.
5. **Create repository**.

## 2. Subir los archivos

**Opción A — desde el navegador (sin instalar nada):**
en la página del repositorio vacío, enlace **"uploading an existing file"**, arrastra todo el contenido de la carpeta `captalluvia/` (no la carpeta `node_modules` ni `dist` si existen) y pulsa **Commit changes**.
Si el navegador no sube la carpeta oculta `.github`, súbela aparte con **Add file → Create new file** y escribe la ruta (por ejemplo `.github/workflows/ci.yml`).

**Opción B — con Git:**

```bash
cd captalluvia
git init -b main
git add .
git commit -m "Fase 0: estructura inicial de CaptaLluvia"
git remote add origin https://github.com/germanruiz7-25/captalluvia.git
git push -u origin main
```

## 3. Activar GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. En **Source** elige **GitHub Actions**.
3. **Settings → Secrets and variables → Actions → Variables → New repository variable**:
   - Nombre: `BASE_PATH`
   - Valor: `/captalluvia/` (mientras no haya dominio propio)

## 4. Publicar la primera versión

1. Pestaña **Releases → Draft a new release**.
2. **Choose a tag**: escribe `v0.0.1` y créalo.
3. Título: `v0.0.1 — Fase 0`. Copia las notas de `CHANGELOG.md`.
4. **Publish release**. El flujo "Publicar en GitHub Pages" se ejecuta solo (pestaña **Actions**).
5. En 1–2 minutos la app queda en https://germanruiz7-25.github.io/captalluvia/

Cada versión nueva repite este paso con el número siguiente (v0.1.0, v0.2.0…), después de actualizar `package.json` y `CHANGELOG.md`.

## 5. Conectar el dominio captalluvia.org

1. Compra `captalluvia.org` en un registrador (por ejemplo Cloudflare Registrar, Namecheap o Porkbun). Confirma antes que esté disponible.
2. En la configuración DNS del dominio crea:

   | Tipo | Nombre | Valor |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | germanruiz7-25.github.io |

3. Recomendado: verifica el dominio en **tu perfil de GitHub → Settings → Pages → Add a domain**, para que nadie más pueda usarlo.
4. En el repositorio: **Settings → Pages → Custom domain** escribe `captalluvia.org`, guarda y, cuando aparezca disponible, marca **Enforce HTTPS**.
5. Cambia la variable `BASE_PATH` a `/` y publica una versión nueva.

Los cambios de DNS pueden tardar hasta 24 horas. Comprueba los valores vigentes en la guía oficial: https://docs.github.com/es/pages/configuring-a-custom-domain-for-your-github-pages-site


## Claves de mapas satelitales (opcional)

El mapa de calles de OpenStreetMap funciona sin clave. Para agregar satélite:

1. En cada proveedor crea una **clave de API** (no uses la contraseña de la cuenta):
   - **Esri** (ArcGIS Location Platform): *API keys → New API key*, con el privilegio *Basemaps* (incluye World Imagery).
   - **Mapbox**: *Tokens → Create a token* (token público `pk.…`) con el permiso *styles:tiles*.
   - **MapTiler**: *Account → Keys → New key*.
2. Restringe cada clave a tu sitio (`https://germanruiz7-25.github.io/*` y, cuando exista, `https://captalluvia.org/*`). Las claves de mapas web quedan visibles en el navegador; la restricción evita que otros las usen.
3. En GitHub: *Settings → Secrets and variables → Actions → Variables → New repository variable*:
   - `VITE_ESRI_KEY`
   - `VITE_MAPBOX_TOKEN`
   - `VITE_MAPTILER_KEY`
4. Publica un Release nuevo (o vuelve a ejecutar *Publicar en GitHub Pages*). Cada mapa aparece solo si su clave existe.
