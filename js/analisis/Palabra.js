/* ============================================================
   Palabra, Lectura y Tokenizador
   ------------------------------------------------------------
   Palabra es cada pieza de la oración. Lectura es cada análisis
   posible de esa pieza, con un peso que indica lo probable que
   resulta. El tokenizador parte el texto en palabras y desdobla
   las contracciones del y al.
   ============================================================ */

import { ModelosVerbales } from "../verbos/ModelosVerbales.js";

export class Lectura {
  constructor(clase, datos = {}, peso = 1) {
    this.clase = clase;
    this.peso = peso;
    this.subtipo = datos.subtipo || null;
    this.infinitivo = datos.infinitivo || null;
    this.tiempo = datos.tiempo || null;
    this.persona = datos.persona !== undefined ? datos.persona : null;
    this.modo = datos.modo || null;
    this.aproximado = Boolean(datos.aproximado);
    this.supuesto = Boolean(datos.supuesto);
    this.genero = null;
    this.numero = null;
  }

  get esVerboConjugado() { return this.clase === "verbo" && this.subtipo === "conjugado"; }
  get esInfinitivo() { return this.clase === "verbo" && this.subtipo === "infinitivo"; }
  get esGerundio() { return this.clase === "verbo" && this.subtipo === "gerundio"; }
  get esParticipio() { return this.clase === "verbo" && this.subtipo === "participio"; }
  get esAtono() { return this.clase === "pronombre" && this.subtipo === "personal átono"; }
  get esRelativo() {
    return (this.clase === "pronombre" && this.subtipo === "relativo") ||
           (this.clase === "adverbio" && this.subtipo === "de relativo");
  }

  /* Rasgos legibles, para la tabla morfológica */
  get rasgos() {
    const partes = [];
    if (this.clase === "verbo") {
      if (this.infinitivo) partes.push(`infinitivo ${this.infinitivo}`);
      if (this.esVerboConjugado && this.tiempo) {
        const t = ModelosVerbales.tiempo(this.tiempo);
        if (t) partes.push(t.nombreLargo.toLowerCase());
        const p = ModelosVerbales.PERSONAS_DESCRITAS[this.persona];
        if (p) partes.push(p);
      }
    } else if (["sustantivo", "adjetivo", "determinante", "pronombre"].includes(this.clase)) {
      if (this.genero && this.genero !== "ambiguo") partes.push(this.genero);
      if (this.numero) partes.push(this.numero);
    }
    return partes.join(", ");
  }
}

class Palabra {
  constructor({ texto, original, contraida, parte, indice }) {
    this.texto = texto;
    this.original = original || texto;
    this.contraida = Boolean(contraida);
    this.parte = parte || 0;
    this.i = indice;
    this.min = texto.toLowerCase();
    this.esSigno = !/[a-záéíóúüñ\d]/i.test(texto);
    this.esNumero = /^\d+$/.test(texto);
    this.mayuscula = /^[A-ZÁÉÍÓÚÜÑ]/.test(texto);
    this.lecturas = [];
    this.analisis = null;      // la lectura elegida
  }

  get clase() { return this.analisis ? this.analisis.clase : null; }
  get subtipo() { return this.analisis ? this.analisis.subtipo : null; }

  esClase(...clases) { return clases.includes(this.clase); }

  puede(clase) { return this.lecturas.some((l) => l.clase === clase); }

  lecturasDe(clase) { return this.lecturas.filter((l) => l.clase === clase); }

  /* La lectura de más peso, que es la que gana cuando no hay regla */
  mejorLectura(lista) {
    const candidatas = lista || this.lecturas;
    if (!candidatas.length) return null;
    return candidatas.slice().sort((a, b) => b.peso - a.peso)[0];
  }

  /* Texto que se muestra: las contracciones se enseñan enteras */
  get visible() {
    return this.contraida && this.parte === 1 ? this.original : this.texto;
  }

  get seOculta() { return this.contraida && this.parte === 2; }

  /* Copia con otro índice, para analizar un tramo por separado */
  copiarCon(indice) {
    const copia = Object.create(Palabra.prototype);
    Object.assign(copia, this, { i: indice });
    return copia;
  }
}

export class Tokenizador {
  static get CONTRACCIONES() {
    return { del: ["de", "el"], al: ["a", "el"] };
  }

  static get PATRON() {
    return /[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+|\d+|[^\sa-záéíóúüñA-ZÁÉÍÓÚÜÑ\d]/g;
  }

  static partir(texto) {
    const bruto = (texto || "").match(Tokenizador.PATRON) || [];
    const piezas = [];
    bruto.forEach((t) => {
      const min = t.toLowerCase();
      const contraccion = Tokenizador.CONTRACCIONES[min];
      if (contraccion) {
        piezas.push({ texto: contraccion[0], original: t, contraida: true, parte: 1 });
        piezas.push({ texto: contraccion[1], original: t, contraida: true, parte: 2 });
      } else {
        piezas.push({ texto: t, original: t });
      }
    });
    return piezas.map((p, i) => new Palabra(Object.assign({ indice: i }, p)));
  }

  /* Reconstruye el texto de un tramo de palabras */
  static texto(palabras, desde, hasta) {
    const trozo = palabras.slice(desde, hasta);
    let salida = "";
    trozo.forEach((p, k) => {
      if (p.seOculta) return;
      const texto = p.visible;
      if (k === 0 || p.esSigno) salida += texto;
      else salida += " " + texto;
    });
    // Los signos de apertura y de cierre no forman parte del sintagma
    return salida.trim().replace(/[.,;:!?»)]+$/, "").replace(/^[¡¿«(]+/, "").trim();
  }

  /* Copia un tramo con los índices renumerados desde cero */
  static tramo(palabras, desde, hasta) {
    return palabras.slice(desde, hasta).map((p, i) => p.copiarCon(i));
  }

  /* Copia todas las palabras dejando fuera unos tramos */
  static sinTramos(palabras, tramos) {
    const fuera = new Set();
    tramos.forEach((t) => { for (let k = t.inicio; k < t.fin; k++) fuera.add(k); });
    return palabras.filter((p, i) => !fuera.has(i)).map((p, i) => p.copiarCon(i));
  }
}
