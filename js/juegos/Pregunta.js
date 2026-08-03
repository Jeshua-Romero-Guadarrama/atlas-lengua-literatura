/* ============================================================
   Pregunta y sus tipos
   ------------------------------------------------------------
   Cada tipo de pregunta sabe tres cosas: cómo se dibuja, cómo se
   conecta a los clics del estudiante y cómo se corrige. Así los
   juegos solo tienen que generar preguntas, sin ocuparse de la
   interfaz, y añadir un tipo nuevo no obliga a tocar nada más.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";

class Pregunta {
  constructor({ instruccion, enunciado, explicacion, clave }) {
    this.instruccion = instruccion || "";
    this.enunciado = enunciado || "";
    this.explicacion = explicacion || "";
    this.clave = clave || enunciado;      // sirve para no repetir preguntas
    this.respondida = false;
  }

  /* Marcado del cuerpo de la pregunta */
  pintar() { return ""; }

  /* Conecta los controles. alResponder recibe (acierto, mensajeExtra) */
  conectar(alResponder) {}

  /* Encabezado común a todos los tipos */
  encabezado(claseExtra) {
    return `<p class="juego-instruccion">${Texto.escapar(this.instruccion)}</p>
            <div class="juego-enunciado ${claseExtra || ""}">${this.enunciado}</div>`;
  }
}

/* ------------------------------------------------------------
   Elegir entre varias opciones
   ------------------------------------------------------------ */
export class PreguntaDeOpciones extends Pregunta {
  constructor(datos) {
    super(datos);
    this.opciones = datos.opciones;
    this.correcta = datos.correcta;
    this.verso = Boolean(datos.verso);
  }

  pintar() {
    return this.encabezado(this.verso ? "verso" : "") + `
      <div class="opciones-rejilla" id="opciones-juego">
        ${this.opciones.map((o) => `<button class="opcion-btn" data-v="${Texto.atributo(o)}">${Texto.escapar(o)}</button>`).join("")}
      </div>`;
  }

  conectar(alResponder) {
    document.querySelectorAll("#opciones-juego .opcion-btn").forEach((b) => {
      b.addEventListener("click", () => {
        if (this.respondida) return;
        this.respondida = true;
        const acierto = b.dataset.v === this.correcta;
        document.querySelectorAll("#opciones-juego .opcion-btn").forEach((o) => {
          o.disabled = true;
          if (o.dataset.v === this.correcta) o.classList.add("correcta");
        });
        if (!acierto) b.classList.add("incorrecta");
        alResponder(acierto);
      });
    });
  }
}

/* ------------------------------------------------------------
   Señalar una palabra dentro de una oración
   ------------------------------------------------------------ */
export class PreguntaDePalabras extends Pregunta {
  constructor(datos) {
    super(datos);
    this.palabras = datos.palabras;
    this.solucion = datos.solucion;       // índices que se dan por buenos
  }

  pintar() {
    return this.encabezado() + `
      <div class="juego-enunciado" style="margin-top:.7rem">
        <div class="palabras-elegibles" id="palabras-juego">
          ${this.palabras.map((w, k) => `<button class="palabra-btn" data-k="${k}">${Texto.escapar(w.texto)}</button>`).join("")}
        </div>
      </div>`;
  }

  conectar(alResponder) {
    document.querySelectorAll("#palabras-juego .palabra-btn").forEach((b) => {
      b.addEventListener("click", () => {
        if (this.respondida) return;
        this.respondida = true;
        const elegido = Number(b.dataset.k);
        const acierto = this.solucion.includes(elegido);
        document.querySelectorAll("#palabras-juego .palabra-btn").forEach((o) => {
          o.disabled = true;
          if (this.solucion.includes(Number(o.dataset.k))) o.classList.add("resuelta", "acertada");
        });
        if (!acierto) b.classList.add("fallada");
        alResponder(acierto);
      });
    });
  }
}

/* ------------------------------------------------------------
   Escribir la respuesta
   ------------------------------------------------------------ */
export class PreguntaEscrita extends Pregunta {
  constructor(datos) {
    super(datos);
    this.correcta = datos.correcta;
  }

  pintar() {
    return this.encabezado() + `
      <div class="respuesta-fila">
        <input type="text" id="respuesta-juego" class="respuesta-entrada" autocomplete="off"
               spellcheck="false" placeholder="Escribe aquí tu respuesta">
        <button id="comprobar-juego" class="boton-primario">Comprobar</button>
      </div>`;
  }

  conectar(alResponder) {
    const campo = document.getElementById("respuesta-juego");
    const boton = document.getElementById("comprobar-juego");

    const comprobar = () => {
      if (this.respondida) return;
      const dado = campo.value.trim().toLowerCase();
      if (!dado) return;
      this.respondida = true;

      const esperado = this.correcta.toLowerCase();
      const acierto = dado === esperado;
      // Fallar solo la tilde merece un aviso, no un error a secas
      const soloTilde = !acierto && Texto.normalizar(dado) === Texto.normalizar(esperado);

      campo.classList.add(acierto ? "correcta" : "incorrecta");
      campo.disabled = true;
      boton.disabled = true;
      alResponder(acierto, soloTilde
        ? `Casi: la forma es correcta pero le falla la tilde. Se escribe ${this.correcta}.`
        : null);
    };

    boton.addEventListener("click", comprobar);
    campo.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); comprobar(); } });
    campo.focus();
  }

  get respuestaCorrecta() { return this.correcta; }
}

/* ------------------------------------------------------------
   Señalar una sílaba, o decir que no lleva tilde
   ------------------------------------------------------------ */
export class PreguntaDeSilabas extends Pregunta {
  constructor(datos) {
    super(datos);
    this.silabas = datos.silabas;
    this.correcta = datos.correcta;       // índice de la sílaba, o -1
    this.palabra = datos.palabra;
  }

  pintar() {
    return `<p class="juego-instruccion">${Texto.escapar(this.instruccion)}</p>
      <div class="juego-enunciado" style="text-align:center">${this.enunciado}</div>
      <div class="juego-enunciado" style="margin-top:.7rem">
        <div class="silabas" id="silabas-juego">
          ${this.silabas.map((s, k) => `<button class="silaba-btn" data-k="${k}">${Texto.escapar(s)}</button>`).join("")}
        </div>
      </div>
      <div class="opciones-rejilla">
        <button class="opcion-btn" data-k="-1" id="sin-tilde">Esta palabra no lleva tilde</button>
      </div>`;
  }

  conectar(alResponder) {
    // Si el botón no está, el marcado de pintar() no llegó al documento
    // y no hay nada que conectar: mejor salir que fallar a mitad de juego
    const sinTilde = document.getElementById("sin-tilde");
    if (!sinTilde) return;

    const marcar = (elegido, boton) => {
      if (this.respondida) return;
      this.respondida = true;
      const acierto = elegido === this.correcta;

      document.querySelectorAll("#silabas-juego .silaba-btn").forEach((o) => {
        o.disabled = true;
        if (Number(o.dataset.k) === this.correcta) o.classList.add("correcta");
      });
      sinTilde.disabled = true;
      if (this.correcta === -1) sinTilde.classList.add("correcta");
      if (!acierto) boton.classList.add("incorrecta");
      alResponder(acierto);
    };

    document.querySelectorAll("#silabas-juego .silaba-btn").forEach((b) => {
      b.addEventListener("click", () => marcar(Number(b.dataset.k), b));
    });
    sinTilde.addEventListener("click", (e) => marcar(-1, e.currentTarget));
  }
}
