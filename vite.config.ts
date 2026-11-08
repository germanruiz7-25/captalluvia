/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// BASE_PATH:
//   '/captalluvia/' mientras la app se sirve en germanruiz7-25.github.io/captalluvia
//   '/'             cuando se conecte el dominio captalluvia.org
// Se define como variable del repositorio en GitHub (Settings → Variables).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
