<script lang="ts">
  import { conclusiones, cuadroResumen, type DatosInforme } from '../core/informe';

  let { datos }: { datos: DatosInforme } = $props();

  const secciones = $derived(cuadroResumen(datos));
  const textos = $derived(conclusiones(datos));
</script>

<section class="tarjeta paso informe-resumen salto-impresion">
  <h2>Cuadro resumen del diseño</h2>
  <table class="tabla resumen">
    {#each secciones as s (s.titulo)}
      <tbody>
        <tr class="titulo-seccion"><th colspan="2">{s.titulo}</th></tr>
        {#each s.filas as [etiqueta, valor] (etiqueta)}
          <tr><td>{etiqueta}</td><td>{valor}</td></tr>
        {/each}
      </tbody>
    {/each}
  </table>
</section>

<section class="tarjeta paso informe-conclusiones salto-impresion">
  <h2>Conclusiones y recomendaciones</h2>
  <ol>
    {#each textos as t (t)}
      <li>{t}</li>
    {/each}
  </ol>
</section>

<style>
  .resumen { width: 100%; }
  .resumen td { text-align: left; vertical-align: top; white-space: normal; }
  .resumen td:first-child { width: 42%; color: var(--texto-suave); }
  .titulo-seccion th {
    text-align: left; background: var(--acento-suave); color: var(--texto); padding: 0.4rem 0.6rem;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  ol { padding-left: 1.25rem; display: grid; gap: 0.5rem; }
  @media print {
    .resumen { font-size: 0.85rem; }
    .resumen tbody { break-inside: avoid; }
  }
</style>
