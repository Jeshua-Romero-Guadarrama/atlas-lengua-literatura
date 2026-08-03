/* ============================================================
   VistaJuegos
   ------------------------------------------------------------
   Pinta el menú de juegos y conduce la partida: dibuja cada
   pregunta pidiéndosela a ella misma, recoge la respuesta,
   muestra la retroalimentación y cierra con el resultado.
   ============================================================ */

import { Partida } from "../juegos/Juego.js";
import { Texto } from "../nucleo/Texto.js";
import { Icono, Pantalla } from "./Componentes.js";
import { Vista } from "./Vista.js";

export class VistaJuegos extends Vista {
  constructor(juegos) {
    super("juegos");
    this.juegos = juegos || [];
    this.partida = null;
  }

  iniciar() {
    // Atajos de teclado: los números eligen opción y Enter avanza.
    // Se ignoran mientras se escribe, para no estorbar al juego de verbos.
    document.addEventListener("keydown", (e) => {
      if (!this.partida) return;
      if (this.contenedor.classList.contains("oculta")) return;
      const escribiendo = document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);

      if (e.key === "Enter" && !escribiendo) {
        const siguiente = document.getElementById("siguiente-juego");
        if (siguiente) { e.preventDefault(); siguiente.click(); }
        return;
      }
      if (escribiendo) return;

      const numero = Number(e.key);
      if (!Number.isInteger(numero) || numero < 1 || numero > 9) return;
      const opciones = this.panel.querySelectorAll(".opcion-btn:not(:disabled), .silaba-btn:not(:disabled)");
      const elegida = opciones[numero - 1];
      if (elegida) { e.preventDefault(); elegida.click(); }
    });
  }

  get menu() { return document.getElementById("juegos-menu"); }
  get encabezado() { return document.getElementById("juegos-encabezado"); }
  get panel() { return document.getElementById("juego-activo"); }

  pintar() { this._pintarMenu(); }

  _pintarMenu() {
    if (!this.menu) return;
    this.menu.innerHTML = "";
    this.juegos.forEach((juego) => {
      const disponible = juego.disponible;
      const tarjeta = document.createElement("article");
      tarjeta.className = "juego-tarjeta";
      tarjeta.innerHTML = `
        <div class="juego-icono">${Icono.de(juego.icono)}</div>
        <h3>${Texto.escapar(juego.nombre)}</h3>
        <p>${Texto.escapar(juego.descripcion)}</p>
        <span class="insignia">${Texto.escapar(juego.insignia)}</span>
        ${disponible ? "" : '<span class="insignia">Pendiente de contenido</span>'}`;
      if (disponible) {
        Vista.hacerAccionable(tarjeta, () => this.empezar(juego));
      } else {
        // El juego sin contenido se atenúa por clase, se anuncia deshabilitado
        // y queda fuera del orden de tabulación: no hay nada que activar.
        tarjeta.classList.add("no-disponible");
        tarjeta.setAttribute("aria-disabled", "true");
      }
      this.menu.appendChild(tarjeta);
    });
  }

  volverAlMenu() {
    this.partida = null;
    this.menu.classList.remove("oculta");
    this.encabezado.classList.remove("oculta");
    this.panel.classList.add("oculta");
    this.panel.innerHTML = "";
    Pantalla.desplazar(0);
  }

  empezar(juego) {
    const partida = new Partida(juego);
    if (!partida.valida) return;
    this.partida = partida;
    this.menu.classList.add("oculta");
    this.encabezado.classList.add("oculta");
    this.panel.classList.remove("oculta");
    this._pintarPregunta();
  }

  /* ------------------------------------------------------------
     Pregunta
     ------------------------------------------------------------ */

  _pintarPregunta() {
    const pregunta = this.partida.actual;
    // La región viva es solo el bloque de retroalimentación: nace vacía con la
    // pregunta y el lector de pantalla anuncia únicamente la corrección, no el
    // enunciado entero en cada cambio.
    this.panel.innerHTML = `
      <div class="juego-panel">
        ${this._cabecera(this.partida.avance)}
        ${pregunta.pintar()}
        <div id="retro-juego" aria-live="polite"></div>
        <div class="juego-pie">
          <button id="salir-juego" class="boton-secundario">${Icono.de("atras")} Volver a los juegos</button>
        </div>
      </div>`;

    pregunta.conectar((acierto, mensajeExtra) => this._responder(acierto, mensajeExtra));
    document.getElementById("salir-juego").addEventListener("click", () => this.volverAlMenu());
  }

  _cabecera(avance) {
    const p = this.partida;
    return `
      <div class="juego-cabecera">
        <h2>${Texto.escapar(p.juego.nombre)}</h2>
        <div class="juego-marcadores">${this._marcadores()}</div>
      </div>
      <div class="juego-barra"><div class="juego-barra-relleno" style="width:${avance}%"></div></div>`;
  }

  _marcadores() {
    const p = this.partida;
    return `
      <span class="marcador">${Icono.de("diana")} <strong>${p.aciertos}</strong> / ${p.total}</span>
      <span class="marcador ${p.racha >= 3 ? "racha-viva" : ""}">${Icono.de("racha")} racha <strong>${p.racha}</strong></span>
      <span class="marcador">${p.numero} de ${p.total}</span>`;
  }

  _responder(acierto, mensajeExtra) {
    const pregunta = this.partida.actual;
    this.partida.registrar(acierto);
    this._refrescarCabecera();

    const clase = acierto ? "bien" : (mensajeExtra ? "aviso" : "mal");
    const titulo = acierto
      ? `${Icono.de("check")} <span><strong>Correcto.</strong> `
      : `${Icono.de("equis")} <span><strong>No era esa.</strong> `;
    const correccion = (!acierto && !mensajeExtra && pregunta.respuestaCorrecta)
      ? `La respuesta correcta es <strong>${Texto.escapar(pregunta.respuestaCorrecta)}</strong>. ` : "";

    document.getElementById("retro-juego").innerHTML = `
      <div class="juego-retro ${clase}">
        ${titulo}${correccion}${Texto.escapar(mensajeExtra || pregunta.explicacion)}</span>
      </div>
      <div class="juego-pie">
        <button id="siguiente-juego" class="boton-primario">
          ${this.partida.hayMasPreguntas ? "Siguiente" : "Ver resultado"}
        </button>
      </div>`;

    const siguiente = document.getElementById("siguiente-juego");
    siguiente.addEventListener("click", () => this._siguiente());
    // Las opciones quedan deshabilitadas al responder y el foco moriría en un
    // botón apagado, de modo que se lleva al siguiente paso del recorrido.
    siguiente.focus();
  }

  _refrescarCabecera() {
    const marcadores = this.panel.querySelector(".juego-marcadores");
    if (marcadores) marcadores.innerHTML = this._marcadores();
    const barra = this.panel.querySelector(".juego-barra-relleno");
    if (barra) barra.style.width = this.partida.avanceTrasResponder + "%";
  }

  _siguiente() {
    this.partida.avanzar();
    if (this.partida.terminada) this._pintarFinal();
    else this._pintarPregunta();
  }

  /* ------------------------------------------------------------
     Resultado
     ------------------------------------------------------------ */

  _pintarFinal() {
    const p = this.partida;
    const repaso = p.fallos.length ? `
      <div class="repaso-fallos">
        <h3>Lo que conviene repasar</h3>
        <ul>${p.fallos.map((f) => `<li>${Texto.escapar(f.explicacion)}</li>`).join("")}</ul>
      </div>` : "";

    this.panel.innerHTML = `
      <div class="juego-panel">
        <div class="juego-final">
          <div class="medalla">${Icono.de("medalla")}</div>
          <h2>${Texto.escapar(p.juego.nombre)}</h2>
          <p class="puntaje">${p.aciertos} de ${p.total}</p>
          <p>${Texto.escapar(p.mensajeFinal)} ${Texto.escapar(p.fraseDeRacha)}</p>
          ${repaso}
          <div class="juego-pie" style="justify-content:center">
            <button id="repetir-juego" class="boton-primario">Jugar otra vez</button>
            <button id="salir-juego" class="boton-secundario">${Icono.de("atras")} Volver a los juegos</button>
          </div>
        </div>
      </div>`;

    const juego = p.juego;
    const repetir = document.getElementById("repetir-juego");
    repetir.addEventListener("click", () => this.empezar(juego));
    document.getElementById("salir-juego").addEventListener("click", () => this.volverAlMenu());
    // El botón que tenía el foco desapareció con la última pregunta, así que el
    // recorrido continúa en la primera acción de la pantalla final.
    repetir.focus();
  }
}
