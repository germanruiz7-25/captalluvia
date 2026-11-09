<script lang="ts">
  import acerca from '../config/acerca.json';
  import { ROLES, validarRegistro, type DatosRegistro } from '../core/registro';

  let { privacidad, descargo, onRegistrar }: { privacidad: string; descargo: string; onRegistrar: (d: DatosRegistro) => void } =
    $props();

  let d: DatosRegistro = $state({
    nombre: '',
    correo: '',
    organizacion: '',
    rol: '',
    pais: 'Guatemala',
    departamento: '',
    municipio: '',
    aceptaPolitica: false,
  });
  let intentado = $state(false);
  const errores = $derived(validarRegistro(d));
  const valido = $derived(Object.keys(errores).length === 0);

  function enviar(ev: SubmitEvent) {
    ev.preventDefault();
    intentado = true;
    if (valido) onRegistrar($state.snapshot(d));
  }
</script>

<section class="tarjeta registro">
  <p class="numero-paso">Antes de empezar</p>
  <h2>Registro de uso de {acerca.nombre}</h2>
  <p>
    {acerca.nombre} es gratuita. Para saber quién la usa y dónde, y así mejorarla y reportar su impacto, pedimos este
    registro <strong>una sola vez</strong> en este dispositivo.
  </p>

  <form onsubmit={enviar} novalidate>
    <div class="campos">
      <label>Nombre y apellido *
        <input bind:value={d.nombre} autocomplete="name" aria-invalid={intentado && !!errores.nombre} />
        {#if intentado && errores.nombre}<span class="alerta">{errores.nombre}</span>{/if}
      </label>
      <label>Correo electrónico *
        <input type="email" bind:value={d.correo} autocomplete="email" inputmode="email" aria-invalid={intentado && !!errores.correo} />
        {#if intentado && errores.correo}<span class="alerta">{errores.correo}</span>{/if}
      </label>
      <label>Institución u organización *
        <input bind:value={d.organizacion} autocomplete="organization" placeholder="Ej. COMRED, municipalidad, universidad o Particular" aria-invalid={intentado && !!errores.organizacion} />
        {#if intentado && errores.organizacion}<span class="alerta">{errores.organizacion}</span>{/if}
      </label>
      <label>¿Cómo usarás la app? *
        <select bind:value={d.rol} aria-invalid={intentado && !!errores.rol}>
          <option value="" disabled>Elige una opción</option>
          {#each ROLES as r (r)}<option value={r}>{r}</option>{/each}
        </select>
        {#if intentado && errores.rol}<span class="alerta">{errores.rol}</span>{/if}
      </label>
      <label>País *
        <input bind:value={d.pais} autocomplete="country-name" aria-invalid={intentado && !!errores.pais} />
        {#if intentado && errores.pais}<span class="alerta">{errores.pais}</span>{/if}
      </label>
      <label>Departamento o estado
        <input bind:value={d.departamento} autocomplete="address-level1" />
      </label>
      <label>Municipio
        <input bind:value={d.municipio} autocomplete="address-level2" />
      </label>
    </div>

    <div class="aviso">
      <strong>Qué se envía y a quién.</strong> Los datos de este formulario se envían a los autores de {acerca.nombre}
      (Programa de Gestión de Riesgo de Desastres del ICC) y se guardan en una hoja de cálculo de Google. Cada vez que
      descargas un informe se envía además un aviso con el departamento, municipio, tipo de infraestructura, número de
      usuarios y volumen del tanque del proyecto. <strong>Nunca</strong> se envían coordenadas, mapas ni datos de la
      familia. La app también cuenta visitas por paso, sin cookies (GoatCounter). No vendemos ni compartimos estos datos. Puedes pedir que se borren desde el paso 8 o escribiendo a
      <a href="mailto:{acerca.contacto}">{acerca.contacto}</a>.
    </div>

    <label class="acepto">
      <input type="checkbox" bind:checked={d.aceptaPolitica} />
      <span>
        Acepto la <a href={privacidad} target="_blank" rel="noopener">política de privacidad</a> y el
        <a href={descargo} target="_blank" rel="noopener">descargo de responsabilidad</a>. *
      </span>
    </label>
    {#if intentado && errores.aceptaPolitica}<p class="alerta">{errores.aceptaPolitica}</p>{/if}

    <div class="acciones">
      <button class="principal grande" type="submit">Registrarme y empezar</button>
    </div>
    <p class="nota">* Obligatorio. Si no tienes internet, el registro se guarda y se envía cuando haya conexión.</p>
  </form>
</section>

<style>
  .registro { max-width: 46rem; margin: 0 auto; }
  .aviso {
    background: var(--acento-suave); border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.9rem; margin: 0.75rem 0;
  }
  .acepto { display: flex; gap: 0.6rem; align-items: flex-start; color: var(--texto); font-size: 0.95rem; }
  .acepto input { width: auto; margin-top: 0.2rem; }
  .alerta { font-size: 0.85rem; }
  [aria-invalid='true'] { border-color: var(--alerta); }
</style>
