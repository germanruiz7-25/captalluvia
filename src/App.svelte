<script lang="ts">
  import acerca from './config/acerca.json';
  import type { ResumenLluvia } from './core/lluvia';
  import { calcularOferta, UMBRAL_CAPTACION_MM } from './core/oferta';
  import { calcularDemanda, DOTACIONES, EDIFICIOS, USOS_INICIALES, litrosDeUsos, type TipoEdificio, type UsoAgua } from './core/demanda';
  import { COEFICIENTES_ESCORRENTIA, NOMBRES_TECHO, areaMinimaM2, opcionesDeTecho, type NumeroAguas, type TipoTecho } from './core/techo';
  import { onMount } from 'svelte';
  import { borrarProyecto, cargarProyecto, guardarProyecto } from './core/proyecto';
  import PasoUbicacion from './lib/PasoUbicacion.svelte';
  import PasoLluvia from './lib/PasoLluvia.svelte';
  import PasoTecho from './lib/PasoTecho.svelte';
  import PasoUsuarios from './lib/PasoUsuarios.svelte';
  import PasoResultados from './lib/PasoResultados.svelte';
  import PasoDrenaje from './lib/PasoDrenaje.svelte';
  import PasoTanque from './lib/PasoTanque.svelte';
  import Acerca from './lib/Acerca.svelte';
  import Fuentes from './lib/Fuentes.svelte';
  import UbicacionProyecto from './lib/UbicacionProyecto.svelte';
  import InformeResumen from './lib/InformeResumen.svelte';
  import { redondearCoordenada } from './core/openmeteo';
  import Registro from './lib/Registro.svelte';
  import { contar } from './core/visitas';
  import {
    URL_REGISTRO,
    borrarRegistroLocal,
    cargarRegistro,
    crearRegistro,
    encolarYEnviar,
    eventoBorrar,
    eventoInforme,
    eventoRegistro,
    guardarRegistro,
    type DatosRegistro,
  } from './core/registro';
  import type { DatosDrenajeInforme, DatosInforme, DatosTanqueInforme } from './core/informe';

  const version = __APP_VERSION__;
  const privacidad = `${acerca.repositorio}/blob/main/docs/PRIVACIDAD.md`;
  const descargoUrl = `${acerca.repositorio}/blob/main/docs/DESCARGO.md`;

  // ---------- Registro de uso (una vez por dispositivo) ----------
  let registro = $state(cargarRegistro());
  function registrar(d: DatosRegistro) {
    const r = crearRegistro(d, version);
    guardarRegistro(r);
    registro = r;
    void encolarYEnviar(URL_REGISTRO, eventoRegistro(r));
    contar('registro-nuevo', { titulo: 'Registro nuevo', evento: true });
    window.scrollTo({ top: 0 });
  }
  onMount(() => {
    // Reenvía lo que quedó pendiente (sin conexión) al abrir y al volver la conexión
    void encolarYEnviar(URL_REGISTRO, null);
    const alVolver = () => void encolarYEnviar(URL_REGISTRO, null);
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  });
  let confirmarBorrarRegistro = $state(false);
  let borrandoRegistro = $state(false);
  async function borrarMiRegistro() {
    if (!registro) return;
    borrandoRegistro = true;
    await encolarYEnviar(URL_REGISTRO, eventoBorrar(registro, version));
    borrarRegistroLocal();
    location.hash = '';
    location.reload();
  }

  // Proyecto: se guarda solo en este dispositivo (localStorage)
  const g = cargarProyecto();
  const edificioInicial = (g?.edificio && g.edificio in EDIFICIOS ? g.edificio : 'vivienda') as TipoEdificio;

  let nombreProyecto = $state(g?.nombreProyecto ?? '');
  let comunidad = $state(g?.comunidad ?? '');
  let elaboradoPor = $state(g?.elaboradoPor ?? '');
  let volumenTanque: number | null = $state(g?.volumenTanque ?? null);
  let institucionTecnico = $state(g?.institucionTecnico ?? '');
  let municipio = $state(g?.municipio ?? '');
  let departamento = $state(g?.departamento ?? '');
  let lat = $state(g?.lat ?? '');
  let lon = $state(g?.lon ?? '');
  let lluvia: ResumenLluvia | null = $state(g?.lluvia ?? null);

  let tipoTecho: TipoTecho = $state(
    (g?.tipoTecho && g.tipoTecho in COEFICIENTES_ESCORRENTIA ? g.tipoTecho : 'lamina_metalica') as TipoTecho,
  );
  let aguas: NumeroAguas = $state(g?.aguas === 1 ? 1 : 2);
  let descarteMm = $state(g?.descarteMm ?? 1);
  let umbralMm = $state(g?.umbralMm ?? UMBRAL_CAPTACION_MM);
  // Techo existente: ancho × largo en planta (m). El área sale del producto.
  let anchoTecho: number | null = $state(g?.anchoTecho ?? null);
  let largoTecho: number | null = $state(g?.largoTecho ?? null);
  const techoExistente = $derived(
    Number(anchoTecho) > 0 && Number(largoTecho) > 0
      ? {
          ancho: Math.min(Number(anchoTecho), Number(largoTecho)),
          largo: Math.max(Number(anchoTecho), Number(largoTecho)),
        }
      : null,
  );
  const areaDisponible = $derived(techoExistente ? Math.round(techoExistente.ancho * techoExistente.largo * 100) / 100 : null);

  let edificio: TipoEdificio = $state(edificioInicial);
  let usuarios = $state(g?.usuarios ?? 5);
  let dotacionId = $state(g?.dotacionId ?? DOTACIONES[edificioInicial][0].id);
  let usos: UsoAgua[] = $state(g?.usos ?? USOS_INICIALES[edificioInicial].map((u) => ({ ...u })));
  let diasUso = $state(g?.diasUso ?? EDIFICIOS[edificioInicial].diasUso);

  // ---------- Asistente por pasos ----------
  const PASOS = [
    { icono: '📍', nombre: 'Ubicación' },
    { icono: '🌧️', nombre: 'Lluvia' },
    { icono: '🏠', nombre: 'Techo' },
    { icono: '👥', nombre: 'Usuarios' },
    { icono: '📐', nombre: 'Área' },
    { icono: '🔽', nombre: 'Canaletas' },
    { icono: '🛢️', nombre: 'Tanque' },
    { icono: '📄', nombre: 'Informe' },
  ];
  const leerPasoDeUrl = () => {
    const m = /^#paso-(\d)$/.exec(location.hash);
    const n = m ? Number(m[1]) : 0;
    return n >= 1 && n <= PASOS.length ? n : null;
  };
  const pasoInicial = leerPasoDeUrl() ?? (g?.paso && g.paso >= 1 && g.paso <= PASOS.length ? g.paso : 1);
  let paso = $state(pasoInicial);

  // Pasos ya vistos (para marcar ✓ solo lo que la persona revisó)
  let visitados: number[] = $state(Array.from({ length: pasoInicial }, (_, i) => i + 1));

  function irAPaso(n: number) {
    paso = Math.min(PASOS.length, Math.max(1, n));
    if (!visitados.includes(paso)) visitados.push(paso);
    if (location.hash !== `#paso-${paso}`) history.pushState(null, '', `#paso-${paso}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Conteo de visitas por paso (GoatCounter, sin cookies); la pantalla de registro cuenta como /registro
  $effect(() => {
    if (registro) contar(`/paso-${paso}`, { titulo: `Paso ${paso} · ${PASOS[paso - 1].nombre}` });
    else contar('/registro', { titulo: 'Registro' });
  });

  let resumenDrenaje = $state('');
  let fuenteIntensidad = $state('');
  let datosDrenaje: DatosDrenajeInforme | null = $state(null);
  let datosTanque: DatosTanqueInforme | null = $state(null);
  let confirmarBorrado = $state(false);

  function borrarTodo() {
    borrarProyecto();
    location.hash = '';
    location.reload();
  }

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
  const areaNecesaria = $derived.by(() => {
    const exacta = oferta ? areaMinimaM2(demanda.m3Anual, oferta.netaAnualMm) : null;
    return exacta === null || demanda.m3Anual <= 0 ? null : Math.ceil(exacta - 1e-9);
  });
  const opcionesTecho = $derived(areaNecesaria === null ? [] : opcionesDeTecho(areaNecesaria));

  const listo = $derived(
    [
      lluvia !== null,
      lluvia !== null,
      oferta !== null,
      demanda.m3Anual > 0,
      areaNecesaria !== null,
      opcionesTecho.length > 0,
      datosTanque !== null,
      false,
    ].map((ok, i) => ok && visitados.includes(i + 1)),
  );

  // Guardar en el dispositivo cada vez que cambia algo.
  $effect(() => {
    guardarProyecto({
      paso, nombreProyecto, elaboradoPor, volumenTanque, institucionTecnico, comunidad, municipio, departamento, lat, lon, lluvia, tipoTecho, aguas,
      descarteMm: Number(descarteMm) || 0, umbralMm: Number(umbralMm) || 0, areaDisponible, anchoTecho, largoTecho,
      edificio, usuarios, dotacionId, usos: $state.snapshot(usos), diasUso,
    });
  });

  onMount(() => {
    const alCambiarUrl = () => {
      const n = leerPasoDeUrl();
      if (n) {
        paso = n;
        if (!visitados.includes(n)) visitados.push(n);
      }
    };
    // En el PDF se abren todos los detalles plegados y se vuelven a cerrar después.
    let abiertos: HTMLDetailsElement[] = [];
    const antes = () => {
      abiertos = [...document.querySelectorAll<HTMLDetailsElement>('details.detalle:not([open])')];
      abiertos.forEach((d) => (d.open = true));
    };
    const despues = () => abiertos.forEach((d) => (d.open = false));
    window.addEventListener('popstate', alCambiarUrl);
    window.addEventListener('beforeprint', antes);
    window.addEventListener('afterprint', despues);
    return () => {
      window.removeEventListener('popstate', alCambiarUrl);
      window.removeEventListener('beforeprint', antes);
      window.removeEventListener('afterprint', despues);
    };
  });

  const n0 = (v: number) => Math.round(v).toLocaleString('es-GT');
  const n1 = (v: number) => v.toLocaleString('es-GT', { maximumFractionDigits: 1 });

  const coordenadas = $derived(
    lat !== '' && lon !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))
      ? `${redondearCoordenada(Number(lat))}, ${redondearCoordenada(Number(lon))}`
      : null,
  );
  const datosInforme: DatosInforme = $derived({
    nombreProyecto,
    edificio: EDIFICIOS[edificio].nombre,
    coordenadas,
    lluvia: lluvia
      ? { anualMm: lluvia.anualMm, diasLluvia: lluvia.diasLluviaAnual, anios: lluvia.anios, fuente: lluvia.fuente }
      : null,
    techo: {
      material: NOMBRES_TECHO[tipoTecho],
      ce: COEFICIENTES_ESCORRENTIA[tipoTecho],
      aguas,
      descarteMm: Number(descarteMm) || 0,
      umbralMm: Number(umbralMm) || 0,
      existente: techoExistente && areaDisponible ? { ...techoExistente, area: areaDisponible } : null,
    },
    oferta: oferta
      ? { netaAnualMm: oferta.netaAnualMm, eficiencia: oferta.eficiencia, mesesCaptados: oferta.mesesCaptados, m3NetosAnual: oferta.m3NetosAnual }
      : null,
    demanda: {
      usuarios: demanda.usuarios,
      litrosPorUsuarioDia: demanda.litrosPorUsuarioDia,
      diasUso: demanda.diasUso,
      m3Anual: demanda.m3Anual,
    },
    areaNecesariaM2: areaNecesaria,
    drenaje: datosDrenaje,
    tanque: datosTanque,
  });
  const ubicacionTexto = $derived([comunidad, municipio, departamento].map((x) => x.trim()).filter(Boolean).join(', '));
  const logos: { archivo: string; nombre: string }[] = (acerca as { logos?: { archivo: string; nombre: string }[] }).logos ?? [];
  const base = import.meta.env.BASE_URL;

  const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });

  function descargarInforme() {
    const titulo = document.title;
    document.title = `Informe CaptaLluvia${nombreProyecto ? ' - ' + nombreProyecto : ''} - ${new Date().toISOString().slice(0, 10)}`;
    if (registro) {
      void encolarYEnviar(
        URL_REGISTRO,
        eventoInforme(registro, version, {
          departamento,
          municipio,
          infraestructura: EDIFICIOS[edificio].nombre,
          usuarios: demanda.usuarios,
          volumenM3: datosTanque?.volumenM3 ?? null,
        }),
      );
    }
    contar('informe-pdf', { titulo: 'Informe PDF descargado', evento: true });
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
  <button class="enlace" onclick={() => irAPaso(8)}>Acerca de</button>
</header>

<!-- Encabezado del informe (solo en el PDF) -->
{#if !registro}
<main>
  <Registro {privacidad} descargo={descargoUrl} onRegistrar={registrar} />
</main>
{:else}
<!-- Carátula e introducción (solo en el PDF) -->
<div class="solo-impresion caratula">
  <div class="logos">
    <div class="logo-app">
      <svg viewBox="0 0 32 32" width="48" height="48" aria-hidden="true">
        <path d="M16 3c5 7 9 12 9 17a9 9 0 0 1-18 0c0-5 4-10 9-17z" fill="#0b63b6" />
        <path d="M11 21a5 5 0 0 0 5 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>
      <span><strong>{acerca.nombre}</strong><br />{acerca.subtitulo}</span>
    </div>
    {#each logos as l (l.archivo)}
      <img src={`${base}${l.archivo}`} alt={l.nombre} />
    {/each}
  </div>

  <div class="caratula-centro">
    <p class="caratula-tipo">INFORME TÉCNICO</p>
    <h1>Proyecto: Diseño y cálculo de Sistema de Captación de Agua de Lluvia – SCALL</h1>
    <p class="caratula-lugar"><strong>Lugar:</strong> {nombreProyecto || `${EDIFICIOS[edificio].nombre} (sin nombre)`}</p>
    {#if ubicacionTexto}<p class="caratula-lugar"><strong>Ubicación:</strong> {ubicacionTexto}</p>{/if}
    {#if elaboradoPor}<p class="caratula-lugar"><strong>Elaborado por:</strong> {elaboradoPor}{institucionTecnico ? `, ${institucionTecnico}` : ''}</p>{/if}
  </div>

  <table class="ficha-informe">
    <tbody>
      <tr><td>Tipo de edificio</td><td>{EDIFICIOS[edificio].nombre} · {demanda.usuarios} usuarios</td></tr>
      <tr><td>Coordenadas aproximadas</td><td>{coordenadas ? `${coordenadas} (latitud, longitud; ~1 km)` : 'No indicadas (lluvia ingresada a mano)'}</td></tr>
      <tr><td>Fecha</td><td>{fecha}</td></tr>
      <tr><td>Herramienta</td><td>{acerca.nombre} v{version} {acerca.citaEnTexto.replace('{anio}', String(new Date().getFullYear()))}</td></tr>
      <tr><td>Autores de la herramienta</td><td>{acerca.autoresTexto} · {acerca.organizacion}</td></tr>
    </tbody>
  </table>
  <p class="caratula-descargo">{acerca.descargoCorto}</p>
</div>

<div class="solo-impresion">
  <section class="paso introduccion">
    <h2>Introducción</h2>
    <p>
      Este informe presenta el análisis preliminar (prefactibilidad) de un sistema de captación de agua de lluvia
      (SCALL) para {nombreProyecto || 'el proyecto'}{ubicacionTexto ? `, ubicado en ${ubicacionTexto}` : ''}:
      {EDIFICIOS[edificio].nombre.toLowerCase()} con {demanda.usuarios} usuarios. Con base en
      {lluvia && lluvia.anios > 0 ? `${lluvia.anios} años de registros diarios de lluvia (${lluvia.fuente})` : 'los datos de lluvia ingresados por el usuario'},
      se estima la lluvia aprovechable del techo, se compara con la demanda de agua y se dimensionan el área de techo,
      las canaletas, las bajantes y el tanque de almacenamiento. Al final se presentan el cuadro resumen del diseño,
      las conclusiones y la bibliografía consultada.
    </p>
  </section>
  <UbicacionProyecto
    {lat}
    {lon}
    lugar={nombreProyecto}
    {comunidad}
    {municipio}
    {departamento}
    infraestructura={EDIFICIOS[edificio].nombre}
    usuarios={demanda.usuarios}
  />
</div>

<nav class="avance no-imprimir" aria-label="Pasos">
  <ol>
    {#each PASOS as p, i (p.nombre)}
      <li>
        <button
          class:actual={paso === i + 1}
          class:hecho={listo[i] && paso !== i + 1}
          aria-current={paso === i + 1 ? 'step' : undefined}
          onclick={() => irAPaso(i + 1)}
        >
          <span class="circulo" aria-hidden="true">{listo[i] && paso !== i + 1 ? '✓' : p.icono}</span>
          <span class="etiqueta">{i + 1}. {p.nombre}</span>
        </button>
      </li>
    {/each}
  </ol>
  <div class="barra" aria-hidden="true"><div style="width: {((paso - 1) / (PASOS.length - 1)) * 100}%"></div></div>
</nav>

<main>
  <div class="pantalla no-imprimir" class:activa={paso === 1}>
    <PasoUbicacion bind:lluvia bind:lat bind:lon bind:nombreProyecto bind:comunidad bind:municipio bind:departamento onListo={() => irAPaso(2)} />
  </div>
  <div class="pantalla" class:activa={paso === 2}>
    <PasoLluvia {lluvia} {lat} {lon} {oferta} {tipoTecho} descarteMm={Number(descarteMm) || 0} />
  </div>
  <div class="pantalla" class:activa={paso === 3}>
    <PasoTecho {lluvia} {oferta} bind:tipoTecho bind:aguas bind:descarteMm bind:anchoTecho bind:largoTecho {areaDisponible} bind:umbralMm />
  </div>
  <div class="pantalla" class:activa={paso === 4}>
    <PasoUsuarios bind:edificio bind:usuarios bind:dotacionId bind:usos bind:diasUso {demanda} />
  </div>
  <div class="pantalla" class:activa={paso === 5}>
    <PasoResultados {oferta} {demanda} {aguas} {techoExistente} />
  </div>
  <div class="pantalla" class:activa={paso === 6}>
    <PasoDrenaje opciones={opcionesTecho} {techoExistente} {aguas} {tipoTecho} {lat} {lon} bind:resumen={resumenDrenaje} bind:fuenteIntensidad bind:datos={datosDrenaje} />
  </div>
  <div class="pantalla" class:activa={paso === 7}>
    <PasoTanque
      {lluvia}
      {oferta}
      demandaAnualM3={demanda.m3Anual}
      areaTechoM2={areaDisponible ?? areaNecesaria}
      origenArea={areaDisponible ? 'existente' : 'necesaria'}
      bind:datos={datosTanque}
      bind:volumenElegido={volumenTanque}
    />
  </div>
  <div class="pantalla" class:activa={paso === 8}>
    <section class="tarjeta paso no-imprimir">
      <p class="numero-paso">Paso 8 de 8</p>
      <h2>Resumen e informe</h2>
      {#if !oferta}
        <p class="nota">Completa al menos los pasos 1 y 2 para generar el informe.</p>
      {/if}
      <div class="resumen-final">
        <button class="ficha" onclick={() => irAPaso(2)}>
          <span class="icono">🌧️</span><span class="valor">{lluvia ? `${n0(lluvia.anualMm)} mm` : '—'}</span><span>lluvia al año</span>
        </button>
        <button class="ficha" onclick={() => irAPaso(3)}>
          <span class="icono">💧</span><span class="valor">{oferta ? `${n0(oferta.netaAnualMm)} L` : '—'}</span><span>netos por m² de techo al año</span>
        </button>
        <button class="ficha" onclick={() => irAPaso(4)}>
          <span class="icono">👥</span><span class="valor">{demanda.m3Anual > 0 ? `${n1(demanda.m3Anual)} m³` : '—'}</span><span>de agua al año ({EDIFICIOS[edificio].nombre.toLowerCase()})</span>
        </button>
        <button class="ficha" onclick={() => irAPaso(5)}>
          <span class="icono">🏠</span><span class="valor">{areaNecesaria !== null ? `${n0(areaNecesaria)} m²` : '—'}</span><span>de techo como mínimo</span>
        </button>
        <button class="ficha" onclick={() => irAPaso(7)}>
          <span class="icono">🛢️</span><span class="valor">{datosTanque ? `${datosTanque.volumenM3.toLocaleString('es-GT', { maximumFractionDigits: 1 })} m³` : '—'}</span><span>de tanque{datosTanque ? ` (${datosTanque.tanque})` : ''}</span>
        </button>
        <button class="ficha ancha" onclick={() => irAPaso(6)}>
          <span class="icono">🔽</span><span class="valor chico">{resumenDrenaje || '—'}</span><span>canaletas y bajantes</span>
        </button>
      </div>
      <div class="campos tecnico">
        <label>Elaborado por (técnico o personas que hacen el cálculo)
          <input bind:value={elaboradoPor} placeholder="Ej. Ing. Ana López, Téc. Juan Pérez" />
        </label>
        <label>Institución o cargo (opcional)
          <input bind:value={institucionTecnico} placeholder="Ej. COMRED de Masagua" />
        </label>
      </div>
      <div class="acciones">
        <button class="principal grande" onclick={descargarInforme} disabled={!oferta}>📄 Descargar informe en PDF</button>
      </div>
      <p class="nota">
        Se abrirá la ventana de impresión: elige "Guardar como PDF". El informe reúne todos los pasos, las fuentes
        de consulta y la nota "Acerca de CaptaLluvia".
      </p>
      <details class="detalle">
        <summary>Tus datos y tu registro</summary>
        <p class="nota">
          El proyecto (ubicación, techo, usuarios, tanque) se guarda solo en este navegador para que puedas continuar
          después; no se envía a ningún servidor. <a href={privacidad}>Política de privacidad</a>.
        </p>
        {#if !confirmarBorrado}
          <button class="secundario peligro" onclick={() => (confirmarBorrado = true)}>Borrar mis datos de este dispositivo</button>
        {:else}
          <p class="alerta">¿Seguro? Se borra el proyecto guardado y la app vuelve a empezar.</p>
          <div class="acciones">
            <button class="principal peligro-lleno" onclick={borrarTodo}>Sí, borrar todo</button>
            <button class="secundario" onclick={() => (confirmarBorrado = false)}>Cancelar</button>
          </div>
        {/if}
        {#if registro}
          <p class="nota registro-dato">
            Registrado como <strong>{registro.nombre}</strong> ({registro.correo}, {registro.organizacion}). Tu registro y
            los avisos de informes descargados se guardan en la hoja de registros de los autores.
          </p>
          {#if !confirmarBorrarRegistro}
            <button class="secundario peligro" onclick={() => (confirmarBorrarRegistro = true)}>Borrar mi registro</button>
          {:else}
            <p class="alerta">
              Se pedirá a la hoja de registros que borre tu registro y tus avisos de uso. Para volver a usar la app tendrás
              que registrarte de nuevo.
            </p>
            <div class="acciones">
              <button class="principal peligro-lleno" onclick={borrarMiRegistro} disabled={borrandoRegistro}>Sí, borrar mi registro</button>
              <button class="secundario" onclick={() => (confirmarBorrarRegistro = false)}>Cancelar</button>
            </div>
          {/if}
        {/if}
      </details>
    </section>
    <InformeResumen datos={datosInforme} />
    <Fuentes {lluvia} {lat} {lon} {edificio} umbralMm={Number(umbralMm) || 0} {fuenteIntensidad} />
    <Acerca />
  </div>

  <div class="navegacion no-imprimir">
    {#if paso > 1}
      <button class="secundario" onclick={() => irAPaso(paso - 1)}>← {PASOS[paso - 2].nombre}</button>
    {:else}
      <span></span>
    {/if}
    {#if paso < PASOS.length}
      <button class="principal" onclick={() => irAPaso(paso + 1)}>{PASOS[paso].nombre} →</button>
    {/if}
  </div>
</main>
{/if}

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
  .enlace { background: none; border: 0; color: var(--acento); text-decoration: underline; padding: 0; white-space: nowrap; }

  /* Barra de avance del asistente */
  .avance {
    position: sticky; top: 0; z-index: 10; background: var(--fondo);
    border-bottom: 1px solid var(--borde); padding: 0.5rem clamp(0.5rem, 3vw, 2rem) 0;
  }
  .avance ol { list-style: none; margin: 0 auto; padding: 0; display: flex; justify-content: space-between; max-width: 60rem; gap: 0.25rem; }
  .avance li { flex: 1 1 0; min-width: 0; }
  .avance button {
    width: 100%; background: none; border: 0; padding: 0.2rem 0; display: grid; justify-items: center; gap: 0.15rem;
    color: var(--texto-suave); font-size: 0.8rem;
  }
  .circulo {
    width: 2.3rem; height: 2.3rem; border-radius: 50%; display: grid; place-items: center; font-size: 1.1rem;
    background: var(--fondo-tarjeta); border: 2px solid var(--borde);
  }
  .avance button.hecho .circulo { border-color: var(--acento); color: var(--acento); font-weight: 700; }
  .avance button.actual .circulo { background: var(--acento); border-color: var(--acento); box-shadow: 0 0 0 4px var(--acento-suave); }
  .avance button.actual { color: var(--texto); font-weight: 700; }
  .etiqueta { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .barra { height: 3px; background: var(--borde); margin: 0.4rem auto 0; max-width: 60rem; }
  .barra div { height: 100%; background: var(--acento); transition: width 0.3s; }
  @media (max-width: 40rem) {
    .avance .etiqueta { display: none; }
    .avance button.actual .etiqueta { display: block; position: absolute; left: 0; right: 0; text-align: center; }
    .avance { padding-bottom: 1.4rem; position: sticky; }
    .avance ol { position: relative; }
    .avance li { position: static; }
    .avance button.actual .etiqueta { top: 2.7rem; }
    .circulo { width: 2rem; height: 2rem; font-size: 0.95rem; }
  }

  .pantalla { display: none; min-width: 0; }
  .pantalla.activa { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 1fr); }
  .navegacion { display: flex; justify-content: space-between; gap: 0.75rem; }
  .navegacion button { padding: 0.7rem 1.2rem; font-size: 1rem; }

  .resumen-final { display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); gap: 0.75rem; margin: 0.5rem 0 1rem; }
  .ficha {
    display: grid; justify-items: start; gap: 0.1rem; text-align: left; padding: 0.8rem 1rem;
    background: var(--fondo); border: 1px solid var(--borde); border-radius: 0.75rem; color: var(--texto-suave); font-size: 0.85rem;
  }
  .ficha:hover { border-color: var(--acento); }
  .ficha.ancha { grid-column: 1 / -1; }
  .ficha .icono { font-size: 1.4rem; }
  .ficha .valor { font-size: 1.6rem; font-weight: 700; color: var(--acento); line-height: 1.2; }
  .ficha .valor.chico { font-size: 1.15rem; }
  .peligro { color: var(--alerta); border-color: var(--alerta); }
  .peligro-lleno { background: var(--alerta); }

  @media print {
    .pantalla { display: block !important; }
    .pantalla > :global(* + *) { margin-top: 0.6rem; }
    .pantalla.no-imprimir { display: none !important; }
  }
  main { max-width: 60rem; margin: 0 auto; padding: 1.5rem clamp(1rem, 4vw, 2rem); display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
  footer { text-align: center; color: var(--texto-suave); font-size: 0.85rem; padding: 2rem 1rem; }
  @media print {
    .caratula { break-after: page; min-height: 23cm; display: flex !important; flex-direction: column; }
  }
  .caratula-centro { margin: auto 0; padding: 2cm 0; text-align: center; }
  .caratula-tipo { letter-spacing: 0.15em; font-weight: 700; margin: 0 0 0.5cm; }
  .caratula h1 { margin: 0 0 1cm; line-height: 1.3; }
  .caratula-lugar { margin: 0.2cm 0; }
  .caratula-descargo { margin-top: 0.4cm; font-style: italic; }
  .tecnico { margin: 0.5rem 0 0.75rem; }
  .logos { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; padding-bottom: 0.5rem; border-bottom: 2px solid var(--acento); margin-bottom: 0.75rem; }
  .logo-app { display: flex; align-items: center; gap: 0.5rem; margin-right: auto; font-size: 0.85rem; line-height: 1.25; }
  .logos img { max-height: 3.2rem; max-width: 10rem; object-fit: contain; }
  .ficha-informe { border-collapse: collapse; margin: 0.5rem auto 1rem; font-size: 0.85rem; }
  .ficha-informe td { padding: 0.15rem 0.75rem 0.15rem 0; vertical-align: top; }
  .ficha-informe td:first-child { color: var(--texto-suave); white-space: nowrap; }
  .introduccion p { text-align: justify; }
</style>
