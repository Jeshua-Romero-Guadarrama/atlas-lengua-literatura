/* ============================================================
   Rutas
   ------------------------------------------------------------
   Sincroniza la dirección del navegador con lo que se está
   viendo, usando el fragmento de la URL. El formato es #/figuras
   para una pestaña, #/figuras/metafora para una ficha concreta y
   #/analizador?frase=... para una consulta de las herramientas.

   Sirve para tres cosas que sin esto no se pueden hacer:
   compartir el enlace de una ficha o de un análisis, guardarlo
   en favoritos, y que el botón de atrás cierre la ficha en lugar
   de salir de la aplicación. La clase no conoce ninguna vista en
   concreto: recibe un mapa de nombre de ruta a vista y solo
   espera de cada una abrirPorCodigo(codigo), cerrar() y, en las
   herramientas, aplicarConsulta(parametros).
   ============================================================ */

export class Rutas {
  /* Las claves del mapa son los nombres públicos de las rutas, que en este
     atlas coinciden con los atributos data-vista de las pestañas. La carpeta
     de páginas estáticas figuras-retoricas enlaza a la ruta corta figuras. */
  constructor(vistas) {
    this.vistas = vistas;
    // Evita que al escribir la dirección se vuelva a interpretar. Se lleva
    // como contador porque cerrar una ficha para abrir otra escribe dos
    // fragmentos seguidos y cada uno trae su propio evento.
    this.propia = 0;
    // Evita que restaurar una dirección la reescriba y pierda el código o la
    // consulta por el camino.
    this.aplicando = false;
  }

  montar() {
    window.addEventListener("hashchange", () => {
      if (this.propia > 0) {
        this.propia--;
        return;
      }
      this.aplicar();
    });
    this.volcarConsulta();
    this.aplicar();
    return this;
  }

  /* Descompone el fragmento actual en ruta, código y consulta. La consulta
     se separa antes de decodificar, porque una frase codificada puede traer
     barras que romperían el corte por segmentos. */
  static leer() {
    const bruto = window.location.hash.replace(/^#\/?/, "").trim();
    if (!bruto) return { ruta: null, codigo: null, consulta: null };
    const [camino, parametros] = bruto.split("?");
    const [ruta, codigo] = camino.split("/").map((p) => decodeURIComponent(p || ""));
    let consulta = null;
    if (parametros) {
      try { consulta = new URLSearchParams(parametros); } catch (e) { consulta = null; }
    }
    return { ruta: ruta || null, codigo: codigo || null, consulta };
  }

  /* Lleva la aplicación al estado que describe la dirección actual */
  aplicar() {
    const { ruta, codigo, consulta } = Rutas.leer();
    if (!ruta || !(ruta in this.vistas)) return;
    const pestana = document.querySelector(`.pestana[data-vista="${ruta}"]`);
    // Una pestaña apagada por falta de datos no debe restaurarse: la
    // dirección se ignora y la aplicación queda en su vista de arranque.
    if (!pestana || pestana.classList.contains("oculta")) return;

    // Mientras se restaura, cualquier intento de escribir la dirección se
    // descarta, porque el clic en la pestaña también avisa a las rutas y
    // reescribiría el fragmento sin su código ni su consulta.
    this.aplicando = true;
    try {
      if (!pestana.classList.contains("activa")) pestana.click();
      const vista = this.vistas[ruta];
      if (!vista) return;
      if (consulta && typeof vista.aplicarConsulta === "function") {
        vista.aplicarConsulta(consulta);
        return;
      }
      if (!codigo) {
        // Sin código en la dirección no debe quedar ninguna ficha abierta,
        // que es lo que convierte el botón de atrás en un cerrar natural.
        if (typeof vista.cerrar === "function") vista.cerrar();
        return;
      }
      if (typeof vista.abrirPorCodigo === "function") vista.abrirPorCodigo(codigo);
    } finally {
      this.aplicando = false;
    }
  }

  /* Escribe la dirección sin provocar una nueva interpretación */
  escribir(ruta, codigo) {
    this._fijar("#/" + ruta + (codigo ? "/" + encodeURIComponent(codigo) : ""));
  }

  /* Dirección de una consulta de las herramientas, como
     #/analizador?frase=... o #/conjugador?verbo=... Es la parte más
     compartible del atlas: un profesor puede mandar una oración ya analizada. */
  escribirConsulta(ruta, clave, valor) {
    this._fijar("#/" + ruta + "?" + clave + "=" + encodeURIComponent(valor));
  }

  _fijar(destino) {
    if (this.aplicando) return;
    if (window.location.hash === destino) return;
    this.propia++;
    window.location.hash = destino;
  }

  /* Vuelca el parámetro q de la dirección en el buscador del temario. Es la
     mitad que faltaba del SearchAction declarado en el encabezado del
     documento: un buscador externo puede enlazar ?q=palabra y la página
     arranca en el temario con esa búsqueda hecha. */
  volcarConsulta() {
    let consulta = "";
    try {
      consulta = new URLSearchParams(window.location.search).get("q") || "";
    } catch (e) {
      return;
    }
    const campo = document.getElementById("campo-busqueda");
    if (!campo || !consulta.trim()) return;
    // El temario no es la pestaña de arranque, así que la búsqueda pedida
    // desde fuera lleva consigo el cambio de vista. El clic va con la guarda
    // puesta para no escribir el fragmento y pisar un enlace profundo que
    // hubiera llegado junto con la consulta.
    const pestana = document.querySelector('.pestana[data-vista="temario"]');
    if (pestana && !pestana.classList.contains("activa")) {
      this.aplicando = true;
      try { pestana.click(); } finally { this.aplicando = false; }
    }
    campo.value = consulta.trim();
    // El evento de entrada recorre el mismo camino que una tecla, con lo que
    // el contador y la paginación reaccionan solos.
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
