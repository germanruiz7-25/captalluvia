<script lang="ts">
  import {
    DIAS_MES,
    DOTACIONES,
    EDIFICIOS,
    USOS_INICIALES,
    litrosDeUsos,
    type ResumenDemanda,
    type TipoEdificio,
    type UsoAgua,
  } from '../core/demanda';

  let {
    edificio = $bindable(),
    usuarios = $bindable(),
    dotacionId = $bindable(),
    usos = $bindable(),
    diasUso = $bindable(),
    diasCriticos = $bindable(),
    demanda,
  }: {
    edificio: TipoEdificio;
    usuarios: number;
    dotacionId: string;
    usos: UsoAgua[];
    diasUso: number;
    diasCriticos: number;
    demanda: ResumenDemanda;
  } = $props();

  function cambiarEdificio(t: TipoEdificio) {
    edificio = t;
    diasUso = EDIFICIOS[t].diasUso;
    diasCriticos = EDIFICIOS[t].diasCriticos;
    dotacionId = DOTACIONES[t][0].id;
    usos = USOS_INICIALES[t].map((u) => ({ ...u }));
  }

  const agregarUso = () => (usos = [...usos, { nombre: '', litros: 0 }]);
  const quitarUso = (i: number) => (usos = usos.filter((_, j) => j !== i));

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
  const n2 = (v: number) => v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const opciones = $derived(DOTACIONES[edificio]);
</script>

<section class="tarjeta paso">
  <p class="numero-paso">Paso 4 de 8</p>
  <h2>Usuarios y consumo</h2>

  <div class="no-imprimir">
    <div class="pestanas" role="tablist">
      {#each Object.entries(EDIFICIOS) as [id, e] (id)}
        <button role="tab" aria-selected={edificio === id} class:activa={edificio === id} onclick={() => cambiarEdificio(id as TipoEdificio)}>
          {e.nombre}
        </button>
      {/each}
    </div>

    <div class="campos">
      <label>{EDIFICIOS[edificio].usuarios}
        <input type="number" min="1" max="10000" bind:value={usuarios} />
      </label>
      <label>Litros por usuario al día
        <select bind:value={dotacionId}>
          {#each opciones as d (d.id)}
            <option value={d.id}>{d.nombre}</option>
          {/each}
          <option value="personalizada">Personalizada (definir por usos)</option>
        </select>
      </label>
      <label>Días de uso al año
        <input type="number" min="1" max="366" bind:value={diasUso} />
      </label>
    </div>
    <p class="nota informe">{EDIFICIOS[edificio].notaDias}
      {#if dotacionId !== 'personalizada'}{opciones.find((d) => d.id === dotacionId)?.descripcion}{/if}
    </p>

    {#if dotacionId === 'personalizada'}
      <div class="usos">
        <p class="nota">Escribe cuántos litros por usuario al día quieres proveer para cada uso.</p>
        {#each usos as u, i (i)}
          <div class="uso">
            <input aria-label="Uso" placeholder="Uso (ej. beber)" bind:value={u.nombre} />
            <input aria-label="Litros" type="number" min="0" step="0.5" bind:value={u.litros} />
            <span>L</span>
            <button class="quitar" aria-label="Quitar {u.nombre || 'uso'}" onclick={() => quitarUso(i)}>✕</button>
          </div>
        {/each}
        <button class="secundario" onclick={agregarUso}>+ Agregar uso</button>
        <p><strong>Total: {n1(litrosDeUsos(usos))} L por usuario al día</strong></p>
      </div>
    {/if}
  </div>

  <div class="bloque">
    <table class="rejilla demanda-tabla">
      <thead>
        <tr><th>Demanda</th><th>Fórmula</th><th>m³</th><th>Litros</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Diaria</td>
          <td>{n0(demanda.usuarios)} usuarios × {n1(demanda.litrosPorUsuarioDia)} L</td>
          <td>{n2(demanda.litrosDia / 1000)}</td><td>{n0(demanda.litrosDia)}</td>
        </tr>
        <tr>
          <td><strong>Mensual (Dj)</strong></td>
          <td>{n0(demanda.usuarios)} × {n1(demanda.litrosPorUsuarioDia)} L × {DIAS_MES} días ÷ 1000</td>
          <td><strong>{n2(demanda.m3Mensual)}</strong></td><td>{n0(demanda.m3Mensual * 1000)}</td>
        </tr>
        <tr>
          <td><strong>Anual</strong></td>
          <td>
            {#if demanda.diasUso >= 365}Dj × 12 meses{:else}{n0(demanda.usuarios)} × {n1(demanda.litrosPorUsuarioDia)} L × {n0(demanda.diasUso)} días de uso ÷ 1000{/if}
          </td>
          <td><strong>{n1(demanda.m3Anual)}</strong></td><td>{n0(demanda.m3Anual * 1000)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>Meses críticos que debe cubrir el tanque</h3>
  <p class="nota informe">
    En la época seca (casi siempre marzo y abril, según la región) es cuando menos agua hay. Como guardar el agua de
    todo el año requiere volúmenes muy grandes, el tanque se dimensiona para garantizar el consumo de esos meses
    críticos.
  </p>
  <div class="campos no-imprimir">
    <label>Días de consumo a garantizar en la época seca
      <input type="number" min="1" max="366" step="1" bind:value={diasCriticos} />
    </label>
    <div class="atajos" role="group" aria-label="Meses a garantizar">
      {#each [1, 2, 3, 4, 6] as m (m)}
        <button class="secundario" class:activo={Math.round(diasCriticos) === Math.round(m * DIAS_MES)} onclick={() => (diasCriticos = Math.round(m * DIAS_MES))}>
          {m} {m === 1 ? 'mes' : 'meses'}
        </button>
      {/each}
    </div>
  </div>
  <p class="nota">{EDIFICIOS[edificio].notaCriticos}</p>
  <div class="destacado">
    <span class="cifra">{n1(demanda.m3Critico)} m³</span>
    <span>
      a almacenar ({n0(demanda.m3Critico * 1000)} L) para {n0(demanda.diasCriticos)} días
      ({n1(demanda.mesesCriticos)} {demanda.mesesCriticos >= 0.95 && demanda.mesesCriticos < 1.05 ? 'mes' : 'meses'}) de consumo:
      {n0(demanda.usuarios)} × {n1(demanda.litrosPorUsuarioDia)} L × {n0(demanda.diasCriticos)} días ÷ 1000
      = Dj × {n2(demanda.mesesCriticos)} meses. Con este volumen se dimensiona el tanque (paso 7).
    </span>
  </div>
  {#if dotacionId === 'personalizada' && usos.length}
    <p class="nota solo-impresion">
      Dotación por usos: {usos.filter((u) => u.litros > 0).map((u) => `${u.nombre || 'otro'} ${n1(u.litros)} L`).join(' + ')}.
    </p>
  {/if}
</section>

<style>
  .demanda-tabla td:nth-child(n + 3), .demanda-tabla th:nth-child(n + 3) { text-align: right; white-space: nowrap; }
  .atajos { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: flex-end; }
  .atajos button { padding: 0.4rem 0.75rem; font-size: 0.9rem; }
  .atajos button.activo { background: var(--acento-suave); border-color: var(--acento); color: var(--acento); font-weight: 600; }
  h3 { margin-top: 1.25rem; }
  .usos { display: grid; gap: 0.5rem; margin: 0.5rem 0 1rem; }
  .uso { display: grid; grid-template-columns: 1fr 5.5rem auto auto; gap: 0.5rem; align-items: center; }
  .quitar { background: none; border: 1px solid var(--borde); border-radius: 0.5rem; padding: 0.4rem 0.6rem; color: var(--texto-suave); cursor: pointer; }
</style>
