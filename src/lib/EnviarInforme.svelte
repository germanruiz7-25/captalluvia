<script lang="ts">
  /**
   * Enviar el informe por correo desde la cuenta de la propia persona (nada sale de los servidores
   * de CaptaLluvia ni de la cuenta de los autores):
   *  - "Compartir": menú de compartir del dispositivo con el Word adjunto (celulares y algunos equipos).
   *  - "Abrir mi correo": descarga el Word y abre el programa de correo con destinatarios, asunto y
   *    mensaje escritos; la persona adjunta el archivo descargado.
   */
  let {
    generarWord,
    nombreArchivo,
    asuntoInicial,
    mensajeInicial,
    onEnviado,
  }: {
    generarWord: () => Promise<Blob>;
    nombreArchivo: string;
    asuntoInicial: string;
    mensajeInicial: string;
    onEnviado?: (via: 'compartir' | 'correo') => void;
  } = $props();

  let para = $state('');
  let asunto = $state('');
  let mensaje = $state('');
  let trabajando = $state(false);
  let aviso = $state('');
  let error = $state('');

  $effect(() => {
    if (!asunto) asunto = asuntoInicial;
    if (!mensaje) mensaje = mensajeInicial;
  });

  const CORREO = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
  const lista = $derived(
    para
      .split(/[,;\s]+/)
      .map((x) => x.trim())
      .filter(Boolean),
  );
  const invalidos = $derived(lista.filter((x) => !CORREO.test(x)));

  const puedeCompartirArchivos = (() => {
    try {
      const f = new File(['x'], 'prueba.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [f] });
    } catch {
      return false;
    }
  })();

  async function archivo(): Promise<File> {
    const blob = await generarWord();
    return new File([blob], nombreArchivo, { type: blob.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  async function compartir() {
    error = '';
    aviso = '';
    trabajando = true;
    try {
      const f = await archivo();
      if (lista.length && navigator.clipboard) await navigator.clipboard.writeText(lista.join(', ')).catch(() => {});
      await navigator.share({ files: [f], title: asunto, text: mensaje });
      aviso = lista.length ? 'Los correos se copiaron: pégalos como destinatarios en la app de correo que elegiste.' : '';
      onEnviado?.('compartir');
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) error = 'No se pudo compartir. Usa "Abrir mi correo".';
    } finally {
      trabajando = false;
    }
  }

  async function abrirCorreo() {
    error = '';
    aviso = '';
    trabajando = true;
    try {
      const f = await archivo();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(f);
      a.download = f.name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      const q = new URLSearchParams({ subject: asunto, body: `${mensaje}\n\n(Adjunto: ${f.name})` });
      const url = `mailto:${lista.map(encodeURIComponent).join(',')}?${q.toString().replace(/\+/g, '%20')}`;
      window.location.href = url;
      aviso = `Se descargó "${f.name}" y se abrió tu programa de correo. Adjunta ese archivo (o el PDF) antes de enviar.`;
      onEnviado?.('correo');
    } catch {
      error = 'No se pudo preparar el informe.';
    } finally {
      trabajando = false;
    }
  }
</script>

<div class="enviar">
  <h3>✉️ Enviar el informe por correo</h3>
  <p class="nota">
    El correo sale de <strong>tu propia cuenta</strong> (tu app o página de correo); CaptaLluvia no envía correos ni guarda
    el informe.
  </p>
  <div class="campos">
    <label class="ancho">Para (uno o varios correos, separados por coma)
      <input type="email" multiple bind:value={para} placeholder="ana@ejemplo.org, cocode@ejemplo.org" inputmode="email" />
    </label>
    {#if invalidos.length}<p class="alerta">Revisa: {invalidos.join(', ')}</p>{/if}
    <label class="ancho">Asunto<input bind:value={asunto} /></label>
    <label class="ancho">Mensaje<textarea rows="5" bind:value={mensaje}></textarea></label>
  </div>
  <div class="acciones">
    {#if puedeCompartirArchivos}
      <button class="principal" onclick={compartir} disabled={trabajando}>📤 Compartir con el informe adjunto (Word)</button>
    {/if}
    <button class={puedeCompartirArchivos ? 'secundario' : 'principal'} onclick={abrirCorreo} disabled={trabajando || invalidos.length > 0}>
      ✉️ Descargar el Word y abrir mi correo
    </button>
  </div>
  {#if trabajando}<p class="nota">Preparando el informe…</p>{/if}
  {#if aviso}<p class="nota">{aviso}</p>{/if}
  {#if error}<p class="alerta">{error}</p>{/if}
  <p class="nota">
    Para enviar el PDF: descárgalo con "Descargar informe en PDF" y adjúntalo en el correo. Si el correo no se abre, copia
    el mensaje y escríbelo desde tu cuenta.
  </p>
</div>

<style>
  .enviar { border: 1px solid var(--borde); border-radius: 0.75rem; padding: 0.4rem 1rem 0.8rem; margin: 1rem 0; }
  .enviar h3 { margin: 0.5rem 0 0.25rem; }
  .ancho { grid-column: 1 / -1; }
  textarea { width: 100%; font: inherit; padding: 0.5rem; border: 1px solid var(--borde); border-radius: 0.5rem; resize: vertical; }
</style>
