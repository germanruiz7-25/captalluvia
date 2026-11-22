<script lang="ts">
  /**
   * App instalable (PWA): registra el service worker, avisa cuando hay una versión nueva o cuando la app ya
   * funciona sin internet, y ofrece instalarla en el teléfono o la computadora.
   */
  import { registerSW } from 'virtual:pwa-register';
  import { contar } from '../core/visitas';

  interface EventoInstalar extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const esIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
  const esAndroid = /Android/i.test(ua);
  const esMac = /Macintosh/.test(ua) && !esIos;
  const esFirefox = /Firefox|FxiOS/i.test(ua);
  const esSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|FxiOS|Android/i.test(ua);

  const enModoApp = () =>
    (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  let instalada = $state(enModoApp());
  let eventoInstalar: EventoInstalar | null = $state(null);
  let hayVersionNueva = $state(false);
  let listaSinInternet = $state(false);
  let enLinea = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
  let actualizarSW: ((recargar?: boolean) => Promise<void>) | null = null;
  let dialogo: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (import.meta.env.PROD) {
      actualizarSW = registerSW({
        onNeedRefresh() {
          hayVersionNueva = true;
        },
        onOfflineReady() {
          listaSinInternet = true;
          setTimeout(() => (listaSinInternet = false), 9000);
        },
        onRegisteredSW(_url, registro) {
          // Revisa cada hora si se publicó una versión nueva (la app puede quedar abierta días)
          if (registro) setInterval(() => void registro.update(), 60 * 60 * 1000);
        },
      });
    }
    const antes = (e: Event) => {
      e.preventDefault();
      eventoInstalar = e as EventoInstalar;
    };
    const tras = () => {
      instalada = true;
      eventoInstalar = null;
      contar('app-instalada', { titulo: 'App instalada', evento: true });
    };
    const red = () => (enLinea = navigator.onLine);
    window.addEventListener('beforeinstallprompt', antes);
    window.addEventListener('appinstalled', tras);
    window.addEventListener('online', red);
    window.addEventListener('offline', red);
    return () => {
      window.removeEventListener('beforeinstallprompt', antes);
      window.removeEventListener('appinstalled', tras);
      window.removeEventListener('online', red);
      window.removeEventListener('offline', red);
    };
  });

  async function instalar() {
    if (eventoInstalar) {
      const e = eventoInstalar;
      eventoInstalar = null;
      await e.prompt();
      const r = await e.userChoice;
      if (r.outcome === 'accepted') instalada = true;
      return;
    }
    dialogo?.showModal();
  }

  async function actualizar() {
    hayVersionNueva = false;
    await actualizarSW?.(true);
  }
</script>

{#if !instalada}
  <button class="instalar" onclick={instalar} title="Instala CaptaLluvia en este dispositivo para abrirla como app y usarla sin internet">
    📲 <span class="texto">Instalar app</span>
  </button>
{/if}

<dialog bind:this={dialogo} class="dialogo-instalar" aria-labelledby="titulo-instalar">
  <h2 id="titulo-instalar">Instalar CaptaLluvia</h2>
  <p>
    Queda como una app más, con su ícono de gota, se abre sin la barra del navegador y funciona sin internet (con la
    lluvia que ya consultaste). Es gratis y no pasa por ninguna tienda de aplicaciones.
  </p>
  {#if esIos}
    <ol>
      <li>Abre esta página en <strong>Safari</strong> (o en Chrome o Edge).</li>
      <li>Toca el botón <strong>Compartir</strong> (el cuadro con una flecha hacia arriba ⬆️). En Safari puede estar en el menú <strong>···</strong>.</li>
      <li>Baja en la lista y toca <strong>Agregar a inicio</strong>.</li>
      <li>Deja activado <strong>Abrir como app web</strong> y toca <strong>Agregar</strong>.</li>
    </ol>
  {:else if esAndroid}
    <ol>
      <li>Abre esta página en <strong>Chrome</strong> (también sirven Edge, Samsung Internet o Firefox).</li>
      <li>Toca el menú <strong>⋮</strong> (arriba a la derecha).</li>
      <li>Toca <strong>Instalar app</strong> o <strong>Agregar a la pantalla principal</strong> y confirma.</li>
    </ol>
  {:else if esSafari && esMac}
    <ol>
      <li>En Safari, abre el menú <strong>Archivo</strong>.</li>
      <li>Elige <strong>Agregar al Dock</strong> y confirma.</li>
    </ol>
  {:else if esFirefox}
    <p>Firefox para computadora no instala apps web. Abre esta página en <strong>Chrome</strong> o <strong>Edge</strong> y vuelve a tocar "Instalar app".</p>
  {:else}
    <ol>
      <li>En <strong>Chrome</strong> o <strong>Edge</strong>, busca el ícono de instalar (una pantalla con una flecha) al final de la barra de direcciones.</li>
      <li>Si no aparece: menú <strong>⋮</strong> → <strong>Transmitir, guardar y compartir</strong> → <strong>Instalar página como app</strong> (en Edge: <strong>···</strong> → <strong>Aplicaciones</strong> → <strong>Instalar este sitio como una aplicación</strong>).</li>
      <li>Confirma con <strong>Instalar</strong>.</li>
    </ol>
  {/if}
  <p class="nota">
    Tu proyecto y tu registro siguen guardados en este dispositivo. Para quitar la app, bórrala como cualquier otra
    (mantén presionado el ícono) o desde la configuración del navegador.
  </p>
  <form method="dialog"><button class="principal">Entendido</button></form>
</dialog>

<div class="avisos-app no-imprimir" aria-live="polite">
  {#if hayVersionNueva}
    <div class="aviso-app">
      <span>🔄 Hay una versión nueva de CaptaLluvia.</span>
      <button class="principal" onclick={actualizar}>Actualizar</button>
      <button class="secundario" onclick={() => (hayVersionNueva = false)}>Después</button>
    </div>
  {/if}
  {#if listaSinInternet}
    <div class="aviso-app">
      <span>✅ CaptaLluvia quedó guardada en este dispositivo: ya funciona sin internet.</span>
      <button class="secundario" onclick={() => (listaSinInternet = false)}>Cerrar</button>
    </div>
  {/if}
  {#if !enLinea}
    <div class="aviso-app sin-red">
      <span>📴 Sin conexión. Puedes seguir calculando; la lluvia satelital y el mapa necesitan internet (se usa la lluvia guardada).</span>
    </div>
  {/if}
</div>

<style>
  .instalar { white-space: nowrap; background: var(--acento-suave, #e3f0fa); color: var(--acento, #0b63b6); border: 1px solid currentColor; border-radius: 999px; padding: 0.35rem 0.8rem; font: inherit; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
  .instalar:hover { background: #fff; }
  @media (max-width: 380px) { .instalar .texto { display: none; } }
  .dialogo-instalar { max-width: 34rem; border: none; border-radius: 1rem; padding: 1.25rem 1.5rem; }
  .dialogo-instalar::backdrop { background: rgb(0 0 0 / 0.4); }
  .dialogo-instalar h2 { margin-top: 0; }
  .dialogo-instalar li { margin-bottom: 0.4rem; }
  .avisos-app { position: fixed; left: 50%; bottom: 1rem; transform: translateX(-50%); z-index: 1000; display: grid; gap: 0.5rem; width: min(36rem, calc(100% - 1.5rem)); }
  .aviso-app { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; background: #fff; border: 1px solid var(--borde); border-left: 4px solid var(--acento); border-radius: 0.75rem; box-shadow: 0 6px 24px rgb(0 0 0 / 0.15); padding: 0.6rem 0.9rem; }
  .aviso-app span { flex: 1 1 14rem; }
  .aviso-app.sin-red { border-left-color: #f79009; font-size: 0.9rem; }
  @media print { .avisos-app, .instalar, .dialogo-instalar { display: none !important; } }
</style>
