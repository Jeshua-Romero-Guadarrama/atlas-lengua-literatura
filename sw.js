/*
 * Service worker del atlas, que deja la aplicación utilizable sin conexión.
 * Dos estrategias según lo que se pide: Las lecturas de datos van con caché
 * primero y revalidación en segundo plano, es decir, la copia guardada
 * responde al instante y en paralelo la red refresca la caché para la próxima
 * visita. Una corrección puede tardar así una visita en verse, y aquí es
 * aceptable porque el contenido es educativo y estable, mientras que esperar
 * la descarga completa en cada visita se nota siempre. Todo lo demás va con
 * caché primero, porque el armazón está versionado y no cambia entre
 * publicaciones.
 * El precacheado cubre solo el armazón, es decir, el documento, las hojas,
 * los scripts y el manifiesto. Los datos de data/*.json no se precargan: se
 * guardan al pedirse, con lo que la primera visita sin red ya los tiene.
 * El nombre de la caché lleva la versión: al publicar cambios se sube el
 * número, el service worker nuevo instala su caché y el paso de activación
 * borra las anteriores. El procedimiento está documentado en el README.
 * Todas las rutas son relativas al propio archivo, porque el sitio vive en un
 * subdirectorio de GitHub Pages y una ruta absoluta apuntaría fuera del ámbito.
 */

const CACHE = "atlas-len-v6";

// El armazón completo sin datos: lo justo para que la aplicación arranque sin red.
// Los módulos de js/ se listan uno a uno porque el navegador los pide por separado al resolver el grafo de importaciones.
const ARMAZON = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/1-base.css",
  "css/2-cabecera.css",
  "css/3-contenido.css",
  "css/4-tarjetas.css",
  "css/5-modales.css",
  "css/6-secciones.css",
  "css/7-interfaz.css",
  "css/colorimetria.css",
  "css/8-impresion.css",
  "js/main.js",
  "js/nucleo/Texto.js",
  "js/nucleo/Silabeador.js",
  "js/nucleo/Acentuador.js",
  "js/verbos/ModelosVerbales.js",
  "js/verbos/RasgosVerbales.js",
  "js/verbos/Ortografia.js",
  "js/verbos/Conjugacion.js",
  "js/verbos/Conjugador.js",
  "js/verbos/IndiceVerbal.js",
  "js/analisis/Lexico.js",
  "js/analisis/Palabra.js",
  "js/analisis/Etiquetador.js",
  "js/analisis/Nodo.js",
  "js/analisis/LectorDeSintagmas.js",
  "js/analisis/GrupoVerbal.js",
  "js/analisis/Complementos.js",
  "js/analisis/AnalizadorDeProposicion.js",
  "js/analisis/ClasificadorDeOracion.js",
  "js/analisis/Analizador.js",
  "js/juegos/Pregunta.js",
  "js/juegos/Juego.js",
  "js/juegos/JuegosDeGramatica.js",
  "js/juegos/JuegosDeOrtografia.js",
  "js/juegos/JuegosDeLiteratura.js",
  "js/ui/Componentes.js",
  "js/ui/Modal.js",
  "js/ui/Cromo.js",
  "js/ui/Vista.js",
  "js/ui/VistaTemario.js",
  "js/ui/VistasDeContenido.js",
  "js/ui/VistaAnalizador.js",
  "js/ui/VistaConjugador.js",
  "js/ui/VistaJuegos.js",
  "js/ui/MenuLateral.js",
  "js/ui/Rutas.js",
  "js/Repositorio.js",
  "js/Aplicacion.js"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARMAZON)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  // Al activarse la versión nueva se borran las cachés de las anteriores, que
  // ya nadie va a leer y solo ocupan espacio.
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Caché primero con revalidación en segundo plano: La copia guardada responde
// al instante y en paralelo se pide a la red y se guarda su respuesta para la
// próxima visita. Sin copia guardada se espera a la red y se guarda.
function cacheConRevalidacion(evento, peticion) {
  const desdeRed = fetch(peticion).then((respuesta) => {
    const copia = respuesta.clone();
    caches.open(CACHE).then((cache) => cache.put(peticion, copia));
    return respuesta;
  });
  return caches.match(peticion).then((guardada) => {
    if (guardada) {
      // waitUntil deja terminar la revalidación aunque el service worker se
      // fuera a dormir tras responder; el catch evita que un corte de red
      // marque el evento como fallido cuando ya se respondió con la copia.
      evento.waitUntil(desdeRed.catch(() => {}));
      return guardada;
    }
    return desdeRed;
  });
}

// Caché primero: el armazón instalado responde al instante y lo que no esté
// guardado se pide a la red y queda para la próxima vez.
function cachePrimero(peticion) {
  return caches.match(peticion).then((guardada) => {
    if (guardada) return guardada;
    return fetch(peticion).then((respuesta) => {
      const copia = respuesta.clone();
      caches.open(CACHE).then((cache) => cache.put(peticion, copia));
      return respuesta;
    });
  });
}

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  /*
   * Las lecturas de datos que hace el propio código llegan sin destino de
   * documento ni de recurso, y abarcan tanto los archivos de data como las
   * consultas a la API cuando hay servidor. Van con caché primero y
   * revalidación en segundo plano: La copia guardada evita esperar la
   * descarga en cada visita y la red refresca la caché, con lo que una
   * corrección llega como mucho una visita después, un retraso aceptable
   * para contenido educativo estable.
   */
  if (peticion.destination === "") {
    evento.respondWith(cacheConRevalidacion(evento, peticion));
    return;
  }

  // Una navegación sin red cae al documento precacheado, que sabe
  // reconstruir cualquier vista a partir del fragmento de la dirección.
  if (peticion.mode === "navigate") {
    evento.respondWith(cachePrimero(peticion).catch(() => caches.match("index.html")));
    return;
  }

  evento.respondWith(cachePrimero(peticion));
});
