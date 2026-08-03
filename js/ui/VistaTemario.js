/* ============================================================
   VistaTemario
   ------------------------------------------------------------
   La pestaña del temario, que es la más rica de las cinco.
   Además de la rejilla de tarjetas, su modal muestra subclases,
   una tabla de apoyo y el enlace al tema de estudio relacionado.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { VistaDeColeccion } from "./Vista.js";

export class VistaTemario extends VistaDeColeccion {
  constructor(temas) {
    super("temario", {
      idBusqueda: "campo-busqueda", idLista: "lista-fichas", idContador: "contador-resultados",
      idPaginacion: "pag-temario", idModal: "modal-ficha", porPagina: 24,
      singular: "ficha encontrada", plural: "fichas encontradas",
      vacio: "No encontré nada con esa búsqueda.<br>Prueba con otra palabra o quita los filtros.",
      filtros: [
        { campo: "area", todos: "Todas", idContenedor: "filtros-area" },
        { campo: "nivel", todos: "Todos", idContenedor: "filtros-nivel" }
      ]
    });
    this.temas = temas;
    // Ficha mostrada en la ventana, que es el punto de partida de la
    // navegación anterior y siguiente.
    this.abierta = null;
  }

  /* Además del ciclo heredado, esta vista conecta los botones de anterior y
     siguiente de su ventana, que recorren la lista filtrada en pantalla */
  iniciar() {
    super.iniciar();
    const anterior = document.getElementById("ficha-anterior");
    const siguiente = document.getElementById("ficha-siguiente");
    if (anterior) anterior.addEventListener("click", () => this.mover(-1));
    if (siguiente) siguiente.addEventListener("click", () => this.mover(1));
    // Las flechas solo actúan con la ventana abierta, que es cuando no
    // compiten con ningún otro uso del teclado.
    document.addEventListener("keydown", (e) => {
      if (!this.modal || !this.modal.abierta) return;
      if (e.key === "ArrowLeft") this.mover(-1);
      else if (e.key === "ArrowRight") this.mover(1);
    });
  }

  /* Pasa a la ficha vecina de la lista filtrada, y avisa a las rutas porque
     el salto equivale a abrirla desde su tarjeta */
  mover(paso) {
    const lista = this.filtrar();
    const indice = lista.findIndex((f) => this.abierta && f.codigo === this.abierta.codigo);
    if (indice === -1) return;
    const destino = lista[indice + paso];
    if (!destino) return;
    this.abrir(destino);
    if (this.alAbrir) this.alAbrir(destino);
  }

  /* Ajusta los dos botones a la posición de la ficha dentro de la lista
     filtrada. El nombre accesible dice a qué ficha lleva cada botón, porque
     "siguiente" a secas obliga a saltar a ciegas. */
  _actualizarNavegacion(f) {
    const lista = this.filtrar();
    const indice = lista.findIndex((otra) => otra.codigo === f.codigo);
    const rotular = (id, destino, texto) => {
      const boton = document.getElementById(id);
      if (!boton) return;
      // Si el botón se apaga con el foco encima, el foco pasa al cierre para
      // no caer fuera de la ventana.
      if (!destino && document.activeElement === boton) {
        const cierre = this.modal.elemento && this.modal.elemento.querySelector(".cerrar");
        if (cierre) cierre.focus();
      }
      boton.disabled = !destino;
      const nombre = destino ? `${texto}: ${destino.titulo}` : texto;
      boton.setAttribute("aria-label", nombre);
      boton.title = nombre;
    };
    // Una ficha abierta por dirección puede no estar en la lista filtrada, y
    // en ese caso no hay vecinas que ofrecer.
    rotular("ficha-anterior", indice > 0 ? lista[indice - 1] : null, "Ficha anterior");
    rotular("ficha-siguiente", indice !== -1 ? lista[indice + 1] : null, "Ficha siguiente");
  }

  /* Color de insignia según el área de estudio */
  static claseArea(area) {
    const m = {
      "gramatica": "mod-gramatica", "sintaxis": "mod-sintaxis", "ortografia": "mod-ortografia",
      "literatura": "mod-literatura", "lexico y semantica": "mod-lexico",
      "expresion y redaccion": "mod-gramatica", "comprension lectora": "mod-literatura",
      "comunicacion": "mod-sintaxis"
    };
    return m[Texto.normalizar(area)] || "";
  }

  /* La clase de dificultad va sin acentos (dom-basico y no básico) para
     que el dato con tilde no tenga que coincidir letra a letra con el CSS */
  static claseDificultad(dificultad) {
    return dificultad ? "dom-" + Texto.normalizar(dificultad) : "";
  }

  textoBuscable(f) {
    return [f.titulo, f.area, f.nivel, f.categoria, f.definicion, f.explicacion, f.perla,
      (f.ejemplos || []).join(" "),
      (f.subclases || []).map((s) => `${s.nombre} ${s.descripcion} ${(s.ejemplos || []).join(" ")}`).join(" "),
      (f.comoReconocerlo || []).join(" "), (f.etiquetas || []).join(" ")].join(" ");
  }

  claseDeTarjeta(f) { return "sis-" + Texto.normalizar(f.area).replace(/[^a-z]+/g, "-"); }

  marcadoDeTarjeta(f) {
    return `
      <div class="insignias">
        <span class="insignia modalidad ${VistaTemario.claseArea(f.area)}">${Texto.escapar(f.area)}</span>
        <span class="insignia">${Texto.escapar(f.categoria || f.nivel || "")}</span>
        <span class="insignia nivel ${VistaTemario.claseDificultad(f.dificultad)}">${Texto.escapar(f.dificultad || "")}</span>
      </div>
      <h3>${this.destacar(f.titulo)}</h3>
      <p>${this.destacar(Texto.recortar(f.definicion, 130))}</p>`;
  }

  abrir(f) {
    this.abierta = f;
    this._actualizarNavegacion(f);
    const m = this.modal;
    m.html("ficha-insignias",
      `<span class="insignia modalidad ${VistaTemario.claseArea(f.area)}">${Texto.escapar(f.area)}</span>
       <span class="insignia">${Texto.escapar(f.categoria || "")}</span>
       <span class="insignia">${Texto.escapar(f.nivel || "")}</span>
       <span class="insignia nivel ${VistaTemario.claseDificultad(f.dificultad)}">${Texto.escapar(f.dificultad || "")}</span>`);
    document.getElementById("ficha-titulo").textContent = f.titulo;
    document.getElementById("ficha-definicion").textContent = f.definicion || "";

    m.texto("ficha-explicacion-seccion", "ficha-explicacion", f.explicacion);
    m.texto("ficha-perla-seccion", "ficha-perla", f.perla);
    m.lista("ficha-ejemplos-seccion", "ficha-ejemplos", f.ejemplos, "lista-ejemplos");
    m.lista("ficha-reconocer-seccion", "ficha-reconocer", f.comoReconocerlo);
    m.lista("ficha-errores-seccion", "ficha-errores", f.errores);

    const subclases = f.subclases || [];
    m.html("ficha-subclases", subclases.map((s) => `
      <div class="subclase">
        <h4>${Texto.escapar(s.nombre)}</h4>
        <p>${Texto.escapar(s.descripcion || "")}</p>
        ${(s.ejemplos || []).length ? `<p class="ejemplo-inline">${s.ejemplos.map(Texto.resaltar).join(" · ")}</p>` : ""}
      </div>`).join(""));
    m.mostrarSeccion("ficha-subclases-seccion", subclases.length > 0);

    this._pintarTabla(f.tabla);
    this._enlaceAlTema(f);
    m.abrir();
  }

  _pintarTabla(tabla) {
    const hay = tabla && tabla.columnas && tabla.filas;
    if (hay) {
      document.getElementById("ficha-tabla-titulo").textContent = tabla.titulo || "Resumen";
      this.modal.html("ficha-tabla-cabecera", tabla.columnas.map((c) => `<th>${Texto.escapar(c)}</th>`).join(""));
      this.modal.html("ficha-tabla-cuerpo",
        tabla.filas.map((f) => `<tr>${f.map((c) => `<td>${Texto.resaltar(c)}</td>`).join("")}</tr>`).join(""));
    }
    this.modal.mostrarSeccion("ficha-tabla-seccion", Boolean(hay));
  }

  _enlaceAlTema(f) {
    const tema = (this.temas || []).find((t) => t.codigo === f.temaRelacionado);
    if (tema) {
      const boton = document.getElementById("ficha-tema-boton");
      boton.textContent = `Leer: ${tema.titulo}`;
      boton.onclick = () => { this.modal.cerrar(); if (this.alAbrirTema) this.alAbrirTema(tema); };
    }
    this.modal.mostrarSeccion("ficha-tema-seccion", Boolean(tema));
  }
}
