/* ============================================================
   Vista y VistaDeColeccion
   ------------------------------------------------------------
   Vista es la clase base de cada pestaña. VistaDeColeccion añade
   lo que comparten el temario, las figuras, las normas y las
   corrientes: buscador, filtros, tarjetas, paginación y modal de
   detalle. Cada vista concreta solo declara en qué se diferencia.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { Chips, Mensajes, Paginador, Pantalla } from "./Componentes.js";
import { Modal } from "./Modal.js";

export class Vista {
  constructor(nombre) {
    this.nombre = nombre;
    this.contenedor = document.getElementById("vista-" + nombre);
  }

  mostrar() { if (this.contenedor) this.contenedor.classList.remove("oculta"); }
  ocultar() { if (this.contenedor) this.contenedor.classList.add("oculta"); }

  /* Convierte una tarjeta en un control operable con teclado: entra al orden
     de tabulación, se anuncia como botón y responde a Enter y a espacio con
     preventDefault, para que el espacio no desplace la página. */
  static hacerAccionable(elemento, accion) {
    elemento.tabIndex = 0;
    elemento.setAttribute("role", "button");
    elemento.addEventListener("click", accion);
    elemento.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      accion();
    });
  }

  /* Cada vista concreta implementa lo suyo */
  iniciar() {}
  pintar() {}
}

export class VistaDeColeccion extends Vista {
  /* config declara los identificadores del documento y los textos.
     Las subclases la completan en su constructor. */
  constructor(nombre, config) {
    super(nombre);
    this.config = config;
    this.datos = [];
    this.filtros = {};
    // Grupos de chips vivos, que el botón de limpiar devuelve a su estado inicial.
    this.chips = [];
    // Aviso de apertura por interacción directa, que usan las rutas para
    // escribir la dirección sin que restaurarla produzca un ciclo.
    this.alAbrir = null;
    this.paginador = config.idPaginacion
      ? new Paginador(config.idPaginacion, config.porPagina || 24, () => this._irArriba())
      : null;
    this.modal = config.idModal ? new Modal(config.idModal) : null;
  }

  cargar(datos) {
    this.datos = datos || [];
    return this;
  }

  iniciar() {
    const campo = document.getElementById(this.config.idBusqueda);
    if (campo) {
      campo.addEventListener("input", () => {
        if (this.paginador) this.paginador.reiniciar();
        this.pintar();
      });
    }
    (this.config.filtros || []).forEach((f) => {
      this.filtros[f.campo] = f.todos;
      // Cada opción lleva su recuento calculado sobre la colección completa,
      // porque saber cuántos elementos esperan detrás de un chip ayuda a
      // decidir si vale la pena pulsarlo.
      const opciones = [
        { valor: f.todos, cuenta: this.datos.length },
        ...Chips.valoresDe(this.datos, f.campo).map((v) => ({
          valor: v,
          cuenta: this.datos.filter((d) => d && d[f.campo] === v).length
        }))
      ];
      this.chips.push(new Chips(f.idContenedor, opciones, (valor) => {
        this.filtros[f.campo] = valor;
        if (this.paginador) this.paginador.reiniciar();
        this.pintar();
      }));
    });
  }

  get consulta() {
    const campo = document.getElementById(this.config.idBusqueda);
    return campo ? campo.value : "";
  }

  /* Marcado de un texto de tarjeta con las coincidencias de la consulta
     realzadas, para que el ojo encuentre por qué apareció ese resultado */
  destacar(texto) {
    return Texto.marcar(texto, this.consulta);
  }

  /* Devuelve el buscador y los chips a su estado inicial y repinta una sola
     vez. Existe porque el estado vacío ofrece un botón de salida rápida, y
     ese botón no debe repintar la vista una vez por cada chip que restablece. */
  limpiar() {
    const campo = document.getElementById(this.config.idBusqueda);
    if (campo) campo.value = "";
    (this.config.filtros || []).forEach((f) => { this.filtros[f.campo] = f.todos; });
    this.chips.forEach((grupo) => grupo.reiniciar());
    if (this.paginador) this.paginador.reiniciar();
    this.pintar();
    // El foco pasa al buscador limpio, que es donde continúa la tarea de
    // quien no encontró nada.
    if (campo) campo.focus();
  }

  /* ---------- Enlace con las rutas ---------- */

  /* Abre el elemento cuyo código llega en la dirección del navegador.
     Resuelve el código contra la colección y reutiliza abrir, que es el
     mismo camino que recorre un clic en la tarjeta. */
  abrirPorCodigo(codigo) {
    const item = this.datos.find((d) => d && d.codigo === codigo);
    if (!item) return false;
    this.abrir(item);
    return true;
  }

  /* Cierra la ficha abierta si la hay, que es lo que piden las rutas cuando
     la dirección pierde el código */
  cerrar() {
    if (this.modal && this.modal.abierta) this.modal.cerrar();
  }

  /* Aplica los filtros de chips y la búsqueda de texto */
  filtrar() {
    const consulta = this.consulta;
    return this.datos.filter((item) => {
      for (const f of this.config.filtros || []) {
        if (this.filtros[f.campo] !== f.todos && item[f.campo] !== this.filtros[f.campo]) return false;
      }
      if (!consulta) return true;
      return Texto.contieneTodas(this.textoBuscable(item), consulta);
    });
  }

  pintar() {
    const contenedor = document.getElementById(this.config.idLista);
    if (!contenedor) return;
    const lista = this.filtrar();

    const contador = document.getElementById(this.config.idContador);
    if (contador) {
      contador.textContent = Mensajes.contador(lista.length, this.config.singular, this.config.plural);
    }

    if (!lista.length) {
      // El estado vacío ofrece la salida más corta, que es volver a ver todo
      // con un solo gesto. El botón vive dentro de la caja de sin resultados
      // para heredar su columna completa en la rejilla.
      contenedor.innerHTML = Mensajes.sinResultados(this.config.vacio, true);
      contenedor.querySelector(".boton-limpiar").addEventListener("click", () => this.limpiar());
      if (this.paginador) this.paginador.pintar({ paginas: 1, items: [], inicio: 0, total: 0 });
      return;
    }

    const pagina = this.paginador ? this.paginador.trozo(lista) : { items: lista };
    contenedor.innerHTML = "";
    pagina.items.forEach((item) => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "tarjeta-texto " + this.claseDeTarjeta(item);
      tarjeta.innerHTML = this.marcadoDeTarjeta(item);
      // La apertura por clic avisa a las rutas, a diferencia de
      // abrirPorCodigo, que restaura una dirección ya escrita.
      Vista.hacerAccionable(tarjeta, () => {
        this.abrir(item);
        if (this.alAbrir) this.alAbrir(item);
      });
      contenedor.appendChild(tarjeta);
    });
    if (this.paginador) this.paginador.pintar(pagina);
  }

  _irArriba() {
    this.pintar();
    if (!this.contenedor) return;
    const arriba = this.contenedor.getBoundingClientRect().top + window.scrollY - 80;
    Pantalla.desplazar(Math.max(0, arriba));
  }

  /* Las subclases redefinen estos tres métodos */
  textoBuscable(item) { return JSON.stringify(item); }
  claseDeTarjeta() { return ""; }
  marcadoDeTarjeta(item) { return `<h3>${Texto.escapar(item.nombre || item.titulo || "")}</h3>`; }
  abrir() {}
}
