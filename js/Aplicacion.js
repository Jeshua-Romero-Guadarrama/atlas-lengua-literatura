/* ============================================================
   Atlas de Lengua y Literatura
   Autor: Jeshua Romero Guadarrama
   ------------------------------------------------------------
   Aplicacion es el objeto que monta todo: carga los datos, crea
   el motor lingüístico, construye las vistas y los juegos, y
   conecta la navegación.

   Es el único archivo que conoce a todos los demás, y por eso es
   el sitio donde mirar para entender cómo encaja el conjunto.
   ============================================================ */

import { Analizador } from "./analisis/Analizador.js";
import { Lexico } from "./analisis/Lexico.js";
import { JuegoDeClases, JuegoDeSujetoYPredicado, JuegoDeTiemposVerbales } from "./juegos/JuegosDeGramatica.js";
import { JuegoDeFiguras, JuegoDeLiteratura } from "./juegos/JuegosDeLiteratura.js";
import { JuegoDeLaTilde, JuegoDeLetrasDudosas } from "./juegos/JuegosDeOrtografia.js";
import { Repositorio } from "./Repositorio.js";
import { Icono, Pantalla } from "./ui/Componentes.js";
import { Cromo } from "./ui/Cromo.js";
import { MenuLateral } from "./ui/MenuLateral.js";
import { Rutas } from "./ui/Rutas.js";
import { VistaAnalizador } from "./ui/VistaAnalizador.js";
import { VistaConjugador } from "./ui/VistaConjugador.js";
import { VistaJuegos } from "./ui/VistaJuegos.js";
import { VistaFiguras, VistaGlosario, VistaLiteratura, VistaNormas, VistaTemas } from "./ui/VistasDeContenido.js";
import { VistaTemario } from "./ui/VistaTemario.js";
import { Conjugador } from "./verbos/Conjugador.js";
import { IndiceVerbal } from "./verbos/IndiceVerbal.js";

class Navegacion {
  constructor(vistas) {
    this.vistas = vistas;
    // aria-selected solo tiene sentido dentro del patrón de pestañas, así que
    // aquí se completa la semántica, y contenedor, botones y vistas quedan
    // enlazados para que un lector de pantalla anuncie qué controla cada una.
    const pestanas = document.getElementById("pestanas");
    if (pestanas) pestanas.setAttribute("role", "tablist");
    document.querySelectorAll(".pestana").forEach((boton) => {
      const vista = document.getElementById("vista-" + boton.dataset.vista);
      boton.id = "pestana-" + boton.dataset.vista;
      boton.setAttribute("role", "tab");
      if (vista) {
        boton.setAttribute("aria-controls", vista.id);
        vista.setAttribute("role", "tabpanel");
        vista.setAttribute("aria-labelledby", boton.id);
      }
      boton.setAttribute("aria-selected", boton.classList.contains("activa") ? "true" : "false");
      // Solo el clic avisa a las rutas: el cambio programático de vista, como
      // el aterrizaje de arranque, no debe crear entradas en el historial.
      boton.addEventListener("click", () => {
        this.ir(boton.dataset.vista, boton);
        if (this.alNavegar) this.alNavegar(boton.dataset.vista);
      });
    });
  }

  ir(nombre, boton) {
    Navegacion.preactivar(nombre);
    Pantalla.desplazar(0);
    this._anunciar(nombre, boton);
  }

  /* Conmuta pestaña y vista sin anunciar nada ni tocar el desplazamiento.
     Es estática porque el arranque con enlace profundo la necesita antes de
     que exista la navegación: En ese momento no hay escuchas de clic ni
     gancho alNavegar, de modo que el cambio no puede reescribir el
     fragmento. Devuelve si pudo activar, porque una pestaña apagada por
     falta de datos no debe encenderse. */
  static preactivar(nombre) {
    const boton = document.querySelector(`.pestana[data-vista="${nombre}"]`);
    if (!boton || boton.classList.contains("oculta")) return false;
    document.querySelectorAll(".pestana").forEach((b) => {
      b.classList.remove("activa");
      b.setAttribute("aria-selected", "false");
    });
    boton.classList.add("activa");
    boton.setAttribute("aria-selected", "true");
    // Además de la clase se sincroniza el atributo hidden, porque es lo único
    // que saca a las vistas inactivas del árbol de accesibilidad: sin él un
    // lector de pantalla anuncia nueve regiones principales.
    document.querySelectorAll(".vista").forEach((v) => {
      v.classList.add("oculta");
      v.hidden = true;
    });
    const destino = document.getElementById("vista-" + nombre);
    if (destino) {
      destino.classList.remove("oculta");
      destino.hidden = false;
    }
    return true;
  }

  /* Anuncia el cambio de vista en la región de estado y sincroniza el título
     del documento, que es lo que se lee en la pestaña del navegador y lo
     primero que dice un lector de pantalla al volver a ella. */
  _anunciar(nombre, boton) {
    const rotulo = boton ? boton.textContent.trim() : nombre;
    Pantalla.anunciar(rotulo);
    document.title = `${rotulo} · Atlas de Lengua y Literatura`;
  }

  /* Oculta la pestaña de una sección que se quedó sin contenido */
  ocultarSiVacia(nombre, lista) {
    const boton = document.querySelector(`.pestana[data-vista="${nombre}"]`);
    if (boton) boton.classList.toggle("oculta", lista.length === 0);
  }
}

export class Aplicacion {
  constructor() {
    this.repositorio = new Repositorio();
    this.vistas = {};
  }

  async iniciar() {
    // El fragmento se atiende antes de descargar nada: Con conexión lenta,
    // un enlace profundo como #/temario dejaría en pantalla la pestaña de
    // arranque durante toda la carga y parecería que el enlace no funciona.
    // Aquí solo se conmuta la pestaña; la ficha o la consulta del fragmento,
    // el anuncio y el título llegan al final, cuando los datos ya están.
    const anticipo = this._anticiparRuta();
    await this.repositorio.cargar();
    this._montarMotor();
    this._montarVistas();
    this._montarJuegos();
    this._conectar();
    this._pintarTodo();
    if (anticipo) this._rematarAnticipo(anticipo);
    // Las rutas se montan al final, porque restaurar una dirección con
    // código necesita las vistas ya pintadas y las pestañas vacías ocultas.
    this.rutas.montar();
  }

  /* Activa de inmediato la pestaña que nombra el fragmento, sin esperar a los
     datos. En este punto la navegación aún no existe y ningún gancho
     alNavegar está conectado (se conectan en _conectar), así que el cambio no
     puede reescribir el fragmento ni crear historial. Se guarda la pestaña de
     arranque para poder volver a ella si la sección pedida llega vacía. */
  _anticiparRuta() {
    const { ruta } = Rutas.leer();
    if (!ruta) return null;
    const activa = document.querySelector(".pestana.activa");
    const arranque = activa ? activa.dataset.vista : null;
    if (ruta === arranque) return null;
    if (!Navegacion.preactivar(ruta)) return null;
    return { ruta, arranque };
  }

  /* Cierra la preactivación cuando los datos ya están. Si la sección pedida
     llegó vacía, su pestaña acaba de apagarse y el aplicar() final va a
     ignorar la dirección: Se devuelve la vista a la pestaña de arranque, en
     silencio, igual que en un arranque sin fragmento. Si sigue encendida y
     activa se emite aquí, una sola vez, el anuncio y el título que la
     preactivación calló a propósito; y si otra pestaña tomó el mando durante
     la carga, como el aterrizaje en el temario con el motor apagado, el
     aplicar() final ya anuncia al pulsar la pestaña. */
  _rematarAnticipo({ ruta, arranque }) {
    const pestana = document.querySelector(`.pestana[data-vista="${ruta}"]`);
    if (!pestana) return;
    if (pestana.classList.contains("oculta")) {
      if (arranque) Navegacion.preactivar(arranque);
      return;
    }
    if (pestana.classList.contains("activa")) this.navegacion._anunciar(ruta, pestana);
  }

  /* El motor lingüístico se enciende antes que cualquier vista que lo use */
  _montarMotor() {
    // Sin estos datos el motor no falla: responde mal en silencio (árboles
    // sin clases cerradas, todo verbo tratado como regular). Por eso se
    // comprueban aquí las claves que leen Lexico y RasgosVerbales, y si
    // faltan se apagan las pestañas del analizador y del conjugador.
    const lex = this.repositorio.lexico;
    const verbos = this.repositorio.verbos;
    const llena = (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v) && Object.keys(v).length > 0);
    this.motorListo =
      ["determinantes", "pronombres", "preposiciones", "conjunciones", "adverbios", "verbos"]
        .every((k) => llena(lex[k])) && llena(verbos.irregulares);

    this.conjugador = new Conjugador(verbos);
    this.lexico = new Lexico(lex);
    this.indiceVerbal = new IndiceVerbal(this.conjugador).construir(this.lexico.verbos);
    this.analizador = new Analizador(this.lexico, this.indiceVerbal);
  }

  _montarVistas() {
    const r = this.repositorio;
    this.vistas.temario = new VistaTemario(r.temas).cargar(r.fichas);
    this.vistas.figuras = new VistaFiguras().cargar(r.figuras);
    this.vistas.ortografia = new VistaNormas().cargar(r.normas);
    this.vistas.literatura = new VistaLiteratura().cargar(r.movimientos);
    this.vistas.glosario = new VistaGlosario().cargar(r.glosario);
    this.vistas.temas = new VistaTemas().cargar(r.temas);
    this.vistas.analizador = new VistaAnalizador(this.analizador);
    this.vistas.conjugador = new VistaConjugador(this.conjugador);

    // Desde una ficha se puede saltar al tema de estudio relacionado. El
    // salto cuenta como abrir el tema por interacción, así que también se
    // avisa a las rutas.
    this.vistas.temario.alAbrirTema = (tema) => {
      this.vistas.temas.abrir(tema);
      if (this.vistas.temas.alAbrir) this.vistas.temas.alAbrir(tema);
    };
  }

  _montarJuegos() {
    const ej = this.repositorio.ejercicios;
    const juegos = [
      new JuegoDeClases(ej.analisis),
      new JuegoDeSujetoYPredicado(ej.sujetoPredicado),
      new JuegoDeTiemposVerbales(this.conjugador),
      new JuegoDeLaTilde(JuegoDeLaTilde.bancoDesde(ej.acentuacion, this.repositorio.lexico)),
      new JuegoDeLetrasDudosas(ej.ortografia),
      new JuegoDeFiguras(this.repositorio.figuras),
      new JuegoDeLiteratura(this.repositorio.movimientos)
    ];
    this.vistas.juegos = new VistaJuegos(juegos);
  }

  _conectar() {
    this.navegacion = new Navegacion(this.vistas);
    this._conectarRutas();
    Cromo.iniciar();
    // Menú lateral: Retira la cabecera durante la lectura y ofrece las mismas pestañas en un panel.
    this.menuLateral = new MenuLateral();
    Object.values(this.vistas).forEach((v) => v.iniciar());

    // La tecla de escape cierra cualquier modal abierto
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      Object.values(this.vistas).forEach((v) => { if (v.modal) v.modal.cerrar(); });
    });

    const r = this.repositorio;
    this.navegacion.ocultarSiVacia("figuras", r.figuras);
    this.navegacion.ocultarSiVacia("ortografia", r.normas);
    this.navegacion.ocultarSiVacia("literatura", r.movimientos);
    this.navegacion.ocultarSiVacia("temas", r.temas);
    this.navegacion.ocultarSiVacia("glosario", r.glosario);

    // Un motor incompleto se trata como una sección sin contenido. El
    // temario es la pestaña de inicio, así que normalmente no hay nada que
    // conmutar; el salto solo actúa si un enlace profundo dejó activa una
    // de las pestañas apagadas.
    const motor = this.motorListo ? [true] : [];
    this.navegacion.ocultarSiVacia("analizador", motor);
    this.navegacion.ocultarSiVacia("conjugador", motor);
    if (!this.motorListo) {
      // Si el temario ya quedó activo por la preactivación del arranque, no
      // hay nada que conmutar y volver a ir() duplicaría el anuncio.
      const temario = document.querySelector('.pestana[data-vista="temario"]');
      if (temario && !temario.classList.contains("activa")) this.navegacion.ir("temario", temario);
    }
  }

  /* Las claves del mapa son los nombres públicos de las rutas, que coinciden
     con los data-vista de las pestañas; la carpeta estática figuras-retoricas
     enlaza a la ruta corta figuras. Cada vista avisa a las rutas al abrir por
     interacción directa, y su ventana devuelve el fragmento a la pestaña al
     cerrarse. */
  _conectarRutas() {
    this.rutas = new Rutas(this.vistas);
    this.navegacion.alNavegar = (nombre) => this.rutas.escribir(nombre);
    ["temario", "figuras", "ortografia", "literatura", "temas"].forEach((nombre) => {
      const vista = this.vistas[nombre];
      vista.alAbrir = (item) => this.rutas.escribir(nombre, item.codigo);
      if (vista.modal) vista.modal.alCerrar = () => this.rutas.escribir(nombre);
    });
    // Las herramientas escriben su consulta, que es la parte más compartible
    // del atlas: una oración analizada o un verbo conjugado viajan en el enlace.
    this.vistas.analizador.alAnalizar = (frase) => this.rutas.escribirConsulta("analizador", "frase", frase);
    this.vistas.conjugador.alConjugar = (verbo) => this.rutas.escribirConsulta("conjugador", "verbo", verbo);
  }

  _pintarTodo() {
    Object.values(this.vistas).forEach((v) => v.pintar());
    this._pintarMetricas();
    const estado = document.getElementById("estado-origen");
    if (estado) {
      estado.textContent = this.repositorio.resumen + (this.motorListo ? "" :
        " · el analizador y el conjugador están apagados porque faltan datos en lexico.json o verbos.json");
    }
  }

  _pintarMetricas() {
    const caja = document.getElementById("metricas");
    if (!caja) return;
    caja.innerHTML = this.repositorio.metricas
      .map((m) => `<span class="metrica">${Icono.de(m[0])} <strong>${m[1]}</strong> ${m[2]}</span>`)
      .join("");
  }
}
