/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// BASE_PATH:
//   '/captalluvia/' mientras la app se sirve en germanruiz7-25.github.io/captalluvia
//   '/'             cuando se conecte el dominio captalluvia.org
// Se define como variable del repositorio en GitHub (Settings → Variables).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    svelte(),
    // App instalable (PWA) y uso sin internet: ver docs/INSTALAR.md
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'iconos/apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'CaptaLluvia: diseño de cosecha de agua de lluvia',
        short_name: 'CaptaLluvia',
        description:
          'Herramienta gratuita para diseñar sistemas de cosecha de agua de lluvia (SCALL): lluvia satelital, techo, canaletas, tanque e informe.',
        lang: 'es',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#0b63b6',
        categories: ['utilities', 'education', 'productivity'],
        icons: [
          { src: 'iconos/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'iconos/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Toda la app queda guardada en el dispositivo, incluidos el informe Word y la presentación
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,xlsx,csv}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Solo las teselas de OpenStreetMap que ya se vieron (su política permite la caché del navegador,
            // no la descarga masiva). Las imágenes satelitales comerciales no se guardan.
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'teselas-osm',
              expiration: { maxEntries: 400, maxAgeSeconds: 30 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
