<script lang="ts">
  import {
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
    demanda,
  }: {
    edificio: TipoEdificio;
    usuarios: number;
    dotacionId: string;
    usos: UsoAgua[];
    diasUso: number;
    demanda: ResumenDemanda;
  } = $props();

  function cambiarEdificio(t: TipoEdificio) {
    edificio = t;
    diasUso = EDIFICIOS[t].diasUso;
    dotacionId = DOTACIONES[t][0].id;
    usos = USOS_INICIALES[t].map((u) => ({ ...u }));
  }

  const agregarUso = () => (usos = [...usos, { nombre: '', litros: 0 }]);
  const quitarUso = (i: number) => (usos = usos.filter((_, j) => j !== i));

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });
  const opciones = $derived(DOTACIONES[edificio]);
</script>

<section class="tarjeta paso">
  <p class="numero-paso">Paso 3 de 4</p>
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
    <p class="nota">{EDIFICIOS[edificio].notaDias}
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

  <div class="destacado">
    <span class="cifra">{n1(demanda.m3Anual)} m³</span>
    <span>
      de agua al año para {n0(demanda.usuarios)} {EDIFICIOS[edificio].usuarios.toLowerCase()}
      × {n1(demanda.litrosPorUsuarioDia)} L/día × {n0(demanda.diasUso)} días
      ({n0(demanda.litrosDia)} L por día de uso).
    </span>
  </div>
  {#if dotacionId === 'personalizada' && usos.length}
    <p class="nota solo-impresion">
      Dotación por usos: {usos.filter((u) => u.litros > 0).map((u) => `${u.nombre || 'otro'} ${n1(u.litros)} L`).join(' + ')}.
    </p>
  {/if}
</section>

<style>
  .usos { display: grid; gap: 0.5rem; margin: 0.5rem 0 1rem; }
  .uso { display: grid; grid-template-columns: 1fr 5.5rem auto auto; gap: 0.5rem; align-items: center; }
  .quitar { background: none; border: 1px solid var(--borde); border-radius: 0.5rem; padding: 0.4rem 0.6rem; color: var(--texto-suave); cursor: pointer; }
</style>
