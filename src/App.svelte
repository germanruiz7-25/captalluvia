<script lang="ts">
  import acerca from './config/acerca.json';
  import CalculadoraTecho from './lib/CalculadoraTecho.svelte';
  import Acerca from './lib/Acerca.svelte';

  const version = __APP_VERSION__;
  const privacidad = `${acerca.repositorio}/blob/main/docs/PRIVACIDAD.md`;
</script>

<header>
  <div class="marca">
    <svg viewBox="0 0 32 32" width="36" height="36" aria-hidden="true">
      <path d="M16 3c5 7 9 12 9 17a9 9 0 0 1-18 0c0-5 4-10 9-17z" fill="var(--acento)" />
      <path d="M11 21a5 5 0 0 0 5 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" />
    </svg>
    <div>
      <h1>{acerca.nombre}</h1>
      <p>{acerca.subtitulo}</p>
    </div>
  </div>
  <a href="#acerca">Acerca de</a>
</header>

<main>
  <CalculadoraTecho />
  <Acerca />
</main>

<footer>
  {acerca.nombre} v{version} · {acerca.autor} · ICC ·
  <a href={privacidad}>Privacidad</a> ·
  <a href={acerca.licenciaUrl}>Licencia no comercial</a>
</footer>

<style>
  header {
    display: flex; justify-content: space-between; align-items: center; gap: 1rem;
    padding: 1rem clamp(1rem, 4vw, 2rem); border-bottom: 1px solid var(--borde);
  }
  .marca { display: flex; gap: 0.75rem; align-items: center; }
  h1 { margin: 0; font-size: 1.5rem; }
  .marca p { margin: 0; color: var(--texto-suave); font-size: 0.9rem; }
  header > a { white-space: nowrap; }
  main { max-width: 60rem; margin: 0 auto; padding: 1.5rem clamp(1rem, 4vw, 2rem); display: grid; gap: 1.5rem; }
  footer { text-align: center; color: var(--texto-suave); font-size: 0.85rem; padding: 2rem 1rem; }
</style>
