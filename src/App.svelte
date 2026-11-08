<script lang="ts">
  import acerca from './config/acerca.json';
  import type { ResumenLluvia } from './core/lluvia';
  import { calcularOferta, UMBRAL_CAPTACION_MM } from './core/oferta';
  import { calcularDemanda, DOTACIONES, EDIFICIOS, USOS_INICIALES, litrosDeUsos, type TipoEdificio, type UsoAgua } from './core/demanda';
  import { COEFICIENTES_ESCORRENTIA, type NumeroAguas, type TipoTecho } from './core/techo';
  import PasoLluvia from './lib/PasoLluvia.svelte';
  import PasoTecho from './lib/PasoTecho.svelte';
  import PasoUsuarios from './lib/PasoUsuarios.svelte';
  import PasoResultados from './lib/PasoResultados.svelte';
  import Acerca from './lib/Acerca.svelte';
  import Fuentes from './lib/Fuentes.svelte';

  const version = __APP_VERSION__;
  const privacidad = `${acerca.repositorio}/blob/main/docs/PRIVACIDAD.md`;

  // Proyecto (solo vive en este dispositivo)
  let nombreProyecto = $state('');
  let lat = $state('');
  let lon = $state('');
  let lluvia: ResumenLluvia | null = $state(null);

  let tipoTecho: TipoTecho = $state('lamina_metalica');
  let aguas: NumeroAguas = $state(2);
  let descarteMm = $state(1);
  let umbralMm = $state(UMBRAL_CAPTACION_MM);
  let areaDisponible: number | null = $state(null);

  let edificio: TipoEdificio = $state('vivienda');
  let usuarios = $state(5);
  let dotacionId = $state(DOTACIONES.vivienda[0].id);
  let usos: UsoAgua[] = $state(USOS_INICIALES.vivienda.map((u) => ({ ...u })));
  let diasUso = $state(EDIFICIOS.vivienda.diasUso);

  const oferta = $derived(
    lluvia
      ? calcularOferta(lluvia, COEFICIENTES_ESCORRENTIA[tipoTecho], Number(descarteMm) || 0, areaDisponible, Number(umbralMm) || 0)
      : null,
  );
  const litrosPorUsuario = $derived(
    dotacionId === 'personalizada'
      ? litrosDeUsos(usos)
      : (DOTACIONES[edificio].find((d) => d.id === dotacionId)?.litros ?? 0),
  );
  const demanda = $derived(calcularDemanda(usuarios, litrosPorUsuario, diasUso));

  const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });

  function descargarInforme() {
    const titulo = document.title;
    document.title = `Informe CaptaLluvia${nombreProyecto ? ' - ' + nombreProyecto : ''} - ${new Date().toISOString().slice(0, 10)}`;
    window.print();
    document.title = titulo;
  }
</script>

<header class="no-imprimir">
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

<!-- Encabezado del informe (solo en el PDF) -->
<div class="solo-impresion encabezado-informe">
  <p class="marca-informe">{acerca.nombre} · {acerca.subtitulo}</p>
  <h1>Informe de diseño de cosecha de agua de lluvia</h1>
  {#if nombreProyecto}<p class="proyecto">{nombreProyecto}</p>{/if}
  <p>Fecha: {fecha} · {EDIFICIOS[edificio].nombre} · Versión de la app: v{version}</p>
</div>

<main>
  <section class="tarjeta no-imprimir">
    <label class="proyecto-campo">Nombre del proyecto o lugar (opcional, aparece en el informe)
      <input placeholder="Ej. Escuela Oficial Rural Mixta, aldea …" bind:value={nombreProyecto} />
    </label>
  </section>

  <PasoLluvia bind:lluvia bind:lat bind:lon umbralMm={Number(umbralMm) || 0} />
  <PasoTecho {lluvia} {oferta} bind:tipoTecho bind:aguas bind:descarteMm bind:areaDisponible bind:umbralMm />
  <PasoUsuarios bind:edificio bind:usuarios bind:dotacionId bind:usos bind:diasUso {demanda} />
  <PasoResultados {oferta} {demanda} {aguas} onInforme={descargarInforme} />
  <Fuentes {lluvia} {lat} {lon} {edificio} umbralMm={Number(umbralMm) || 0} />
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
  main { max-width: 60rem; margin: 0 auto; padding: 1.5rem clamp(1rem, 4vw, 2rem); display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
  footer { text-align: center; color: var(--texto-suave); font-size: 0.85rem; padding: 2rem 1rem; }
  .proyecto-campo { display: grid; gap: 0.35rem; color: var(--texto-suave); font-size: 0.9rem; }
  .encabezado-informe { padding: 0 0 0.5rem; border-bottom: 2px solid var(--acento); margin-bottom: 0.75rem; }
  .encabezado-informe h1 { font-size: 1.4rem; margin: 0.15rem 0; }
  .encabezado-informe p { margin: 0.1rem 0; }
  .marca-informe { color: var(--acento); font-weight: 700; }
  .proyecto { font-size: 1.1rem; font-weight: 600; }
</style>
