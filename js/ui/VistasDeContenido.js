/* ============================================================
   Vistas de contenido
   ------------------------------------------------------------
   Las demás pestañas que muestran material del atlas: figuras
   retóricas, normas de ortografía, corrientes literarias,
   glosario y temas de estudio.

   Las cuatro primeras heredan de VistaDeColeccion y solo
   declaran en qué se diferencian. El glosario y los temas tienen
   una forma propia y heredan directamente de Vista.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { Mensajes, Paginador } from "./Componentes.js";
import { Modal } from "./Modal.js";
import { Vista, VistaDeColeccion } from "./Vista.js";

export class VistaFiguras extends VistaDeColeccion {
  constructor() {
    super("figuras", {
      idBusqueda: "busqueda-figuras", idLista: "lista-figuras", idContador: "contador-figuras",
      idPaginacion: "pag-figuras", idModal: "modal-figura", porPagina: 24,
      singular: "figura encontrada", plural: "figuras encontradas",
      vacio: "No encontré esa figura.<br>Prueba con otra palabra o quita los filtros.",
      filtros: [{ campo: "tipo", todos: "Todos", idContenedor: "filtros-figuras-tipo" }]
    });
  }

  textoBuscable(f) {
    return [f.nombre, f.tipo, f.queEs, f.comoSeReconoce, f.comoRecordarla,
      (f.ejemplos || []).join(" "), (f.etiquetas || []).join(" ")].join(" ");
  }

  claseDeTarjeta() { return "sis-literatura"; }

  marcadoDeTarjeta(f) {
    return `
      <div class="insignias"><span class="insignia modalidad mod-literatura">${Texto.escapar(f.tipo)}</span></div>
      <h3>${this.destacar(f.nombre)}</h3>
      <p>${this.destacar(Texto.recortar(f.queEs, 130))}</p>`;
  }

  abrir(f) {
    const m = this.modal;
    m.html("figura-insignias", `<span class="insignia modalidad mod-literatura">${Texto.escapar(f.tipo)}</span>`);
    document.getElementById("figura-nombre").textContent = f.nombre;
    document.getElementById("figura-quees").textContent = f.queEs || "";
    document.getElementById("figura-reconoce").textContent = f.comoSeReconoce || "";
    document.getElementById("figura-recordar").textContent = f.comoRecordarla || "";

    const ejemplos = (f.ejemplos || []).length ? f.ejemplos : (f.ejemplo ? [f.ejemplo] : []);
    m.lista("figura-ejemplos-seccion", "figura-ejemplos", ejemplos, "lista-ejemplos");

    const confunde = f.seConfundeCon || [];
    m.html("figura-confunde", confunde.map((c) =>
      `<tr><td>${Texto.escapar(c.figura)}</td><td>${Texto.escapar(c.comoDistinguir)}</td></tr>`).join(""));
    m.mostrarSeccion("figura-confunde-seccion", confunde.length > 0);
    m.abrir();
  }
}

export class VistaNormas extends VistaDeColeccion {
  constructor() {
    super("ortografia", {
      idBusqueda: "busqueda-normas", idLista: "lista-normas", idContador: "contador-normas",
      idPaginacion: "pag-ortografia", idModal: "modal-norma", porPagina: 24,
      singular: "norma encontrada", plural: "normas encontradas",
      vacio: "No encontré esa norma.<br>Prueba con otra palabra o quita los filtros.",
      filtros: [{ campo: "tipo", todos: "Todos", idContenedor: "filtros-normas-tipo" }]
    });
  }

  textoBuscable(n) {
    return [n.nombre, n.tipo, n.paraQue, n.comoAplicarla, n.excepciones,
      (n.reglas || []).map((r) => `${r.regla} ${r.cuando} ${r.ejemplos}`).join(" "),
      (n.etiquetas || []).join(" ")].join(" ");
  }

  claseDeTarjeta() { return "sis-ortografia"; }

  marcadoDeTarjeta(n) {
    return `
      <div class="insignias">
        <span class="insignia modalidad mod-ortografia">${Texto.escapar(n.tipo)}</span>
        <span class="insignia nivel">${(n.reglas || []).length} reglas</span>
      </div>
      <h3>${this.destacar(n.nombre)}</h3>
      <p>${this.destacar(Texto.recortar(n.paraQue, 130))}</p>`;
  }

  abrir(n) {
    const m = this.modal;
    m.html("norma-insignias", `<span class="insignia modalidad mod-ortografia">${Texto.escapar(n.tipo)}</span>`);
    document.getElementById("norma-nombre").textContent = n.nombre;
    document.getElementById("norma-paraque").textContent = n.paraQue || "";
    document.getElementById("norma-aplicar").textContent = n.comoAplicarla || "";
    m.texto("norma-excepciones-seccion", "norma-excepciones", n.excepciones);
    m.html("norma-reglas", (n.reglas || []).map((r) =>
      `<tr><td>${Texto.escapar(r.regla)}</td><td>${Texto.escapar(r.cuando)}</td><td>${Texto.resaltar(r.ejemplos || "")}</td></tr>`).join(""));
    m.abrir();
  }
}

export class VistaLiteratura extends VistaDeColeccion {
  constructor() {
    super("literatura", {
      idBusqueda: "busqueda-movimientos", idLista: "lista-movimientos",
      idContador: "contador-movimientos", idModal: "modal-movimiento",
      singular: "corriente encontrada", plural: "corrientes encontradas",
      vacio: "No encontré esa corriente.<br>Prueba con otra palabra o quita el filtro.",
      filtros: [{ campo: "ambito", todos: "Todos", idContenedor: "filtros-movimientos-ambito" }]
    });
  }

  textoBuscable(m) {
    return [m.nombre, m.periodo, m.ambito, m.contexto, m.comoReconocerlo, m.obraClave,
      (m.rasgos || []).join(" "),
      (m.autores || []).map((a) => `${a.nombre} ${(a.obras || []).join(" ")} ${a.aporte || ""}`).join(" "),
      (m.etiquetas || []).join(" ")].join(" ");
  }

  claseDeTarjeta() { return "sis-literatura"; }

  marcadoDeTarjeta(mv) {
    return `
      <div class="insignias">
        <span class="insignia modalidad mod-literatura">${Texto.escapar(mv.periodo)}</span>
        <span class="insignia">${Texto.escapar(mv.ambito)}</span>
      </div>
      <h3>${this.destacar(mv.nombre)}</h3>
      <p>${this.destacar(Texto.recortar(mv.contexto, 130))}</p>`;
  }

  abrir(mv) {
    const m = this.modal;
    m.html("mov-insignias",
      `<span class="insignia modalidad mod-literatura">${Texto.escapar(mv.periodo)}</span>
       <span class="insignia">${Texto.escapar(mv.ambito)}</span>`);
    document.getElementById("mov-nombre").textContent = mv.nombre;
    document.getElementById("mov-contexto").textContent = mv.contexto || "";
    document.getElementById("mov-reconocer").textContent = mv.comoReconocerlo || "";
    m.lista("mov-rasgos-seccion", "mov-rasgos", mv.rasgos);
    m.lista("mov-generos-seccion", "mov-generos", mv.generos);

    const autores = mv.autores || [];
    m.html("mov-autores", autores.map((a) => `
      <div class="autor">
        <h4>${Texto.escapar(a.nombre)}</h4>
        ${(a.obras || []).length ? `<p class="obras">${a.obras.map(Texto.escapar).join(" · ")}</p>` : ""}
        ${a.aporte ? `<p>${Texto.escapar(a.aporte)}</p>` : ""}
      </div>`).join(""));
    m.mostrarSeccion("mov-autores-seccion", autores.length > 0);
    m.abrir();
  }
}

export class VistaGlosario extends Vista {
  constructor() {
    super("glosario");
    this.terminos = [];
    this.paginador = new Paginador("pag-glosario", 30, () => this.pintar());
  }

  cargar(terminos) { this.terminos = terminos || []; return this; }

  iniciar() {
    const campo = document.getElementById("busqueda-glosario");
    if (campo) campo.addEventListener("input", () => { this.paginador.reiniciar(); this.pintar(); });
  }

  pintar() {
    const lista = document.getElementById("lista-glosario");
    if (!lista) return;
    const campo = document.getElementById("busqueda-glosario");
    const consulta = campo ? campo.value : "";
    const encontrados = this.terminos.filter((t) =>
      !consulta || Texto.contieneTodas(`${t.termino} ${t.definicion} ${t.categoria || ""}`, consulta));

    // El contador dice cuántos términos quedan tras la búsqueda y, por ser una
    // región viva, se lo dice también a quien no ve la rejilla cambiar.
    const contador = document.getElementById("contador-glosario");
    if (contador) {
      contador.textContent = Mensajes.contador(encontrados.length, "término encontrado", "términos encontrados");
    }

    if (!encontrados.length) {
      // El glosario no tiene chips, pero la salida rápida del estado vacío
      // también le sirve: un solo gesto borra la búsqueda y devuelve el foco.
      lista.innerHTML = Mensajes.sinResultados("No encontré ese término.", true);
      lista.querySelector(".boton-limpiar").addEventListener("click", () => {
        if (campo) campo.value = "";
        this.paginador.reiniciar();
        this.pintar();
        if (campo) campo.focus();
      });
      this.paginador.pintar({ paginas: 1, items: [], inicio: 0, total: 0 });
      return;
    }
    const pagina = this.paginador.trozo(encontrados);
    lista.innerHTML = pagina.items.map((t) => `
      <div class="termino">
        ${t.categoria ? `<span class="insignia categoria">${Texto.escapar(t.categoria)}</span>` : ""}
        <h3>${Texto.marcar(t.termino, consulta)}</h3>
        <p>${Texto.marcar(t.definicion, consulta)}</p>
      </div>`).join("");
    this.paginador.pintar(pagina);
  }
}

export class VistaTemas extends Vista {
  constructor() {
    super("temas");
    this.temas = [];
    this.modal = new Modal("modal-tema");
    // Aviso de apertura por interacción directa, para que las rutas escriban
    // la dirección del tema sin producir un ciclo al restaurarla.
    this.alAbrir = null;
  }

  cargar(temas) { this.temas = temas || []; return this; }

  /* Abre el tema cuyo código llega en la dirección del navegador */
  abrirPorCodigo(codigo) {
    const tema = this.temas.find((t) => t && t.codigo === codigo);
    if (!tema) return false;
    this.abrir(tema);
    return true;
  }

  /* Cierra el artículo abierto, que es lo que piden las rutas cuando la
     dirección pierde el código */
  cerrar() {
    if (this.modal && this.modal.abierta) this.modal.cerrar();
  }

  pintar() {
    const contenedor = document.getElementById("lista-temas");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    this.temas.forEach((tema) => {
      const t = document.createElement("article");
      t.className = "tema-tarjeta";
      t.innerHTML = `
        <span class="insignia">${Texto.escapar(tema.area)}</span>
        <h3>${Texto.escapar(tema.titulo)}</h3>
        <p>${Texto.escapar(tema.resumen)}</p>
        <p class="tema-meta">${(tema.secciones || []).length} secciones · ${(tema.puntosClave || []).length} puntos clave</p>`;
      // La apertura por clic avisa a las rutas, a diferencia de
      // abrirPorCodigo, que restaura una dirección ya escrita.
      Vista.hacerAccionable(t, () => {
        this.abrir(tema);
        if (this.alAbrir) this.alAbrir(tema);
      });
      contenedor.appendChild(t);
    });
  }

  abrir(tema) {
    document.getElementById("tema-area").textContent = tema.area || "";
    document.getElementById("tema-titulo").textContent = tema.titulo;
    document.getElementById("tema-resumen").textContent = tema.resumen;
    this.modal.html("tema-secciones", (tema.secciones || []).map((s) => `
      <section class="tema-seccion"><h3>${Texto.escapar(s.encabezado)}</h3>
      ${s.parrafos.map((p) => `<p>${Texto.resaltar(p)}</p>`).join("")}</section>`).join(""));
    this.modal.html("tema-puntos", (tema.puntosClave || []).map((p) => `<li>${Texto.resaltar(p)}</li>`).join(""));
    this.modal.abrir();
  }
}
