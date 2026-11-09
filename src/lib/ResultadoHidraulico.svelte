<script lang="ts">
  import type { AnalisisHidraulico } from '../core/analisisHidraulico';

  let {
    a,
    bajanteNombre,
    canalNombre,
    estacionNombre = null,
    tramoM,
    tramosTotales,
  }: {
    a: AnalisisHidraulico;
    bajanteNombre: string;
    canalNombre: string;
    estacionNombre?: string | null;
    tramoM: number;
    tramosTotales: number;
  } = $props();

  const n0 = (v: number) => (Number.isFinite(v) ? Math.round(v).toLocaleString('es-GT') : '—');
  const n1 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const n2 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lpm = (ls: number) => `${n0(ls * 60)} L/min`;

  const criticos = $derived(a.periodos.filter((p) => p.duracionCriticaMin !== null));
  const t100 = $derived(a.periodos.find((p) => p.tr === 100));
</script>

<div class="hidraulico">
<div class="bloque">
  <h3>Análisis hidráulico del canal y la bajante</h3>
  <p class="informe-texto">
    Cada tramo de canal ({n1(tramoM)} m) recibe el agua de {n1(a.areaTramoM2)} m² de techo y la descarga en una
    bajante de {bajanteNombre}; el techo tiene {tramosTotales} tramo{tramosTotales === 1 ? '' : 's'}. Con la intensidad de diseño
    de {n0(a.intensidadDisenoMmH)} mm/h, cada tramo recibe {n2(a.caudalDisenoLs)} L/s ({lpm(a.caudalDisenoLs)}).
  </p>
  <table class="tabla rejilla capacidades">
    <thead><tr><th>Elemento</th><th>Capacidad</th><th>Por minuto</th></tr></thead>
    <tbody>
      <tr><td>{canalNombre}, con borde libre de diseño (agua a 3/4 del lado bajo)</td><td>{n2(a.canalDisenoLs)} L/s</td><td>{lpm(a.canalDisenoLs)}</td></tr>
      <tr><td>{canalNombre}, lleno hasta el lado bajo (inicio del rebalse)</td><td>{n2(a.canalLlenoLs)} L/s</td><td>{lpm(a.canalLlenoLs)}</td></tr>
      <tr><td>Bajante de {bajanteNombre} (Wyly y Eaton, 1/3 de la sección)</td><td>{n2(a.bajanteLs)} L/s</td><td>{lpm(a.bajanteLs)}</td></tr>
      <tr class="total">
        <td>Capacidad máxima del tramo (controla {a.controla === 'canal' ? 'el canal' : 'la bajante'})</td>
        <td>{n2(a.sistemaLs)} L/s</td><td>{lpm(a.sistemaLs)}</td>
      </tr>
    </tbody>
  </table>
  <p class="informe-texto">
    El tramo trabaja con borde libre hasta <strong>{n0(a.intensidadDisenoLimiteMmH)} mm/h</strong> y rebalsa con
    intensidades mayores a <strong>{n0(a.intensidadLimiteMmH)} mm/h</strong>
    (con la lluvia de diseño se usa el {n0((a.caudalDisenoLs / a.sistemaLs) * 100)} % de la capacidad).
  </p>
</div>

  {#if a.periodos.length}
  <div class="bloque">
    <table class="tabla rejilla periodos">
      <thead>
        <tr>
          <th>Periodo de retorno</th><th>Intensidad 5 min</th><th>Caudal del tramo</th><th>Uso de la capacidad</th>
          <th>Aguaceros que rebalsan</th>
        </tr>
      </thead>
      <tbody>
        {#each a.periodos as p (p.tr)}
          <tr class:excede={p.duracionCriticaMin !== null}>
            <td>{p.tr} años</td>
            <td>{n0(p.i5MmH)} mm/h</td>
            <td>{n2(p.caudalLs)} L/s</td>
            <td>{n0(p.uso * 100)} %</td>
            <td>{p.duracionCriticaMin !== null ? `de hasta ${Math.floor(p.duracionCriticaMin)} min` : 'ninguno'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="informe-texto">
      {#if criticos.length === 0 && t100}
        Según la curva IDF de la estación {estacionNombre}, ningún aguacero de 5 minutos o más, hasta un periodo de retorno de
        100 años ({n0(t100.i5MmH)} mm/h), supera la capacidad del tramo: su capacidad máxima es {n1(1 / t100.uso)} veces el caudal
        de ese aguacero.
      {:else if criticos.length > 0}
        Según la curva IDF de la estación {estacionNombre}, a partir de un periodo de retorno de {criticos[0].tr} años los
        aguaceros de hasta {Math.floor(criticos[0].duracionCriticaMin ?? 0)} minutos superan la capacidad del tramo y el agua
        rebalsa durante ese lapso. Para evitarlo conviene agregar una bajante por canaleta, usar un canal de mayor sección
        o aumentar la pendiente.
      {/if}
    </p>
  </div>
  {/if}
</div>

<style>
  .hidraulico { margin-top: 1.25rem; }
  .capacidades td:not(:first-child), .capacidades th:not(:first-child),
  .periodos td, .periodos th { text-align: right; white-space: nowrap; }
  .capacidades td:first-child { white-space: normal; }
  .periodos td:first-child, .periodos th:first-child { text-align: left; }
  .periodos tr.excede td { color: #b42318; font-weight: 600; }
  .informe-texto { margin: 0.6rem 0; }
  .tabla { margin: 0.5rem 0; }
</style>
