/* ============================================================
   Sintagma y LectorDeSintagmas
   ------------------------------------------------------------
   Agrupa las palabras en bloques. El lector recorre la oración
   desde una posición y devuelve el sintagma que empieza ahí, con
   su núcleo, su extensión y sus partes internas ya montadas como
   nodos del árbol.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { Lexico } from "./Lexico.js";
import { Nodo } from "./Nodo.js";
import { Tokenizador } from "./Palabra.js";

export class Sintagma {
  constructor({ tipo, texto, inicio, fin, nucleo, indiceNucleo, subtipo, hijos, termino }) {
    this.tipo = tipo;                 // SN, SV, SPrep, SAdj, SAdv
    this.texto = texto;
    this.inicio = inicio;
    this.fin = fin;
    this.nucleo = nucleo || null;
    this.indiceNucleo = indiceNucleo !== undefined ? indiceNucleo : null;
    this.subtipo = subtipo || null;
    this.hijos = hijos || [];
    this.termino = termino || null;   // solo en el sintagma preposicional
  }

  static get NOMBRES() {
    return {
      SN: "Sintagma nominal", SV: "Sintagma verbal", SPrep: "Sintagma preposicional",
      SAdj: "Sintagma adjetival", SAdv: "Sintagma adverbial"
    };
  }

  get nombre() { return Sintagma.NOMBRES[this.tipo] || this.tipo; }

  /* Convierte el sintagma en un nodo del árbol con la función dada */
  aNodo(funcion, pista) {
    return new Nodo({
      funcion, tipo: this.nombre, texto: this.texto, nucleo: this.nucleo,
      indice: this.inicio, pista, hijos: this.hijos
    });
  }

  get nucleoEnMinusculas() { return (this.nucleo || "").toLowerCase(); }
}

export class LectorDeSintagmas {
  constructor(palabras, lexico) {
    this.palabras = palabras;
    this.lexico = lexico;
  }

  _clase(i) {
    const p = this.palabras[i];
    return p ? p.clase : null;
  }

  _texto(desde, hasta) { return Tokenizador.texto(this.palabras, desde, hasta); }

  /* ------------------------------------------------------------
     Sintagma nominal
     ------------------------------------------------------------ */
  leerNominal(i, fin) {
    const inicio = i;
    const hijos = [];

    // Determinantes y cuantificadores
    while (i < fin && this._clase(i) === "determinante") {
      hijos.push(new Nodo({
        funcion: "Det", tipo: "Determinante " + (this.palabras[i].subtipo || ""),
        texto: this.palabras[i].texto, indice: i
      }));
      i++;
    }

    // Adjetivos antepuestos al núcleo
    while (i < fin && this._clase(i) === "adjetivo" && this._clase(i + 1) === "sustantivo") {
      hijos.push(new Nodo({
        funcion: "CN", tipo: "Sintagma adjetival", texto: this.palabras[i].texto,
        indice: i, pista: "Adjetivo antepuesto al núcleo."
      }));
      i++;
    }

    // Núcleo. Un infinitivo puede serlo siempre (el cantar de los pájaros),
    // y un participio solo cuando lleva determinante delante (los invitados).
    if (i >= fin) return null;
    const clase = this._clase(i);
    if (!["sustantivo", "pronombre", "adjetivo", "verbo"].includes(clase)) return null;
    let tipoNucleo = Texto.mayuscula(clase);
    if (clase === "verbo") {
      const subtipo = this.palabras[i].subtipo;
      const llevaDeterminante = hijos.some((h) => h.funcion === "Det");
      if (subtipo === "infinitivo") tipoNucleo = "Infinitivo sustantivado";
      else if (subtipo === "participio" && llevaDeterminante) tipoNucleo = "Participio sustantivado";
      else return null;
    }

    const nucleo = this.palabras[i];
    hijos.push(new Nodo({ funcion: "Núcleo", tipo: tipoNucleo, texto: nucleo.texto, indice: i }));
    i++;

    i = this._adjetivosPospuestos(i, fin, hijos);
    i = this._complementosDelNombre(i, fin, hijos);

    return new Sintagma({
      tipo: "SN", texto: this._texto(inicio, i), inicio, fin: i,
      nucleo: nucleo.texto, indiceNucleo: nucleo.i, hijos
    });
  }

  _adjetivosPospuestos(i, fin, hijos) {
    while (i < fin) {
      const clase = this._clase(i);
      const adverbioMasAdjetivo = clase === "adverbio" && this._clase(i + 1) === "adjetivo";
      if (clase !== "adjetivo" && !adverbioMasAdjetivo) break;
      if (adverbioMasAdjetivo) {
        const desde = i;
        i += 2;
        hijos.push(new Nodo({
          funcion: "CN", tipo: "Sintagma adjetival", texto: this._texto(desde, i), indice: desde
        }));
      } else {
        hijos.push(new Nodo({
          funcion: "CN", tipo: "Sintagma adjetival", texto: this.palabras[i].texto,
          indice: i, pista: "Adjetivo que califica al núcleo."
        }));
        i++;
      }
    }
    return i;
  }

  /* Complemento del nombre: la casa de mi abuela. Solo se absorbe con
     de o sin, porque las demás preposiciones casi siempre pertenecen al
     verbo (en "dio un libro a su amiga", "a su amiga" es del verbo). */
  _complementosDelNombre(i, fin, hijos) {
    while (i < fin && this._clase(i) === "preposición" && ["de", "sin"].includes(this.palabras[i].min)) {
      const sub = this.leerPreposicional(i, fin);
      if (!sub) break;
      hijos.push(new Nodo({
        funcion: "CN", tipo: "Sintagma preposicional", texto: sub.texto,
        indice: i, hijos: sub.hijos, pista: "Complemento del nombre: precisa al núcleo."
      }));
      i = sub.fin;
    }
    return i;
  }

  /* ------------------------------------------------------------
     Sintagma preposicional
     ------------------------------------------------------------ */
  leerPreposicional(i, fin) {
    const inicio = i;
    const prep = this.palabras[i];
    const hijos = [new Nodo({ funcion: "Enlace", tipo: "Preposición", texto: prep.texto, indice: i })];
    i++;

    let termino = this.leerNominal(i, fin);
    if (!termino) {
      if (i < fin && this._clase(i) === "adverbio") {
        termino = new Sintagma({ tipo: "SAdv", texto: this.palabras[i].texto, inicio: i, fin: i + 1, nucleo: this.palabras[i].texto });
      } else if (i < fin && this._clase(i) === "verbo") {
        termino = new Sintagma({ tipo: "SV", texto: this.palabras[i].texto, inicio: i, fin: i + 1, nucleo: this.palabras[i].texto });
      } else {
        return null;
      }
    }

    hijos.push(new Nodo({
      funcion: "Término", tipo: termino.nombre, texto: termino.texto,
      indice: termino.inicio, nucleo: termino.nucleo, hijos: termino.hijos
    }));

    return new Sintagma({
      tipo: "SPrep", texto: this._texto(inicio, termino.fin), inicio, fin: termino.fin,
      nucleo: prep.texto, hijos, termino
    });
  }

  /* ------------------------------------------------------------
     Sintagma adverbial y adjetival
     ------------------------------------------------------------ */
  leerAdverbial(i, fin) {
    const inicio = i;
    const hijos = [];
    while (i < fin && this._clase(i) === "adverbio" && this._clase(i + 1) === "adverbio") {
      hijos.push(new Nodo({ funcion: "CAdv", tipo: "Adverbio", texto: this.palabras[i].texto, indice: i }));
      i++;
    }
    if (i >= fin || this._clase(i) !== "adverbio") return null;

    const nucleo = this.palabras[i];
    hijos.push(new Nodo({
      funcion: "Núcleo", tipo: "Adverbio " + (nucleo.subtipo || ""), texto: nucleo.texto, indice: i
    }));
    i++;

    return new Sintagma({
      tipo: "SAdv", texto: this._texto(inicio, i), inicio, fin: i,
      nucleo: nucleo.texto, indiceNucleo: nucleo.i, subtipo: nucleo.subtipo, hijos
    });
  }

  leerAdjetival(i, fin) {
    const inicio = i;
    const hijos = [];
    while (i < fin && this._clase(i) === "adverbio") {
      hijos.push(new Nodo({ funcion: "CAdj", tipo: "Adverbio", texto: this.palabras[i].texto, indice: i }));
      i++;
    }
    if (i >= fin || this._clase(i) !== "adjetivo") return null;

    const nucleo = this.palabras[i];
    hijos.push(new Nodo({ funcion: "Núcleo", tipo: "Adjetivo", texto: nucleo.texto, indice: i }));
    i++;

    return new Sintagma({
      tipo: "SAdj", texto: this._texto(inicio, i), inicio, fin: i,
      nucleo: nucleo.texto, indiceNucleo: nucleo.i, hijos
    });
  }

  /* El circunstancial que corresponde a un sintagma adverbial */
  claseDeAdverbio(sintagma) {
    const palabra = sintagma.nucleoEnMinusculas;
    if (Lexico.SEMANTICA_ADVERBIO[palabra]) return Lexico.SEMANTICA_ADVERBIO[palabra];
    return (sintagma.subtipo || "").replace(/^de /, "") || "modo";
  }
}
