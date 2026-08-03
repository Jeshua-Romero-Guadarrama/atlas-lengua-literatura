/* ============================================================
   Analizador
   ------------------------------------------------------------
   Punto de entrada del análisis. Coordina a los demás objetos:
   parte el texto en palabras, las etiqueta, separa la oración en
   proposiciones, analiza cada una y clasifica el conjunto.

   Se usa así:
       const analizador = new Analizador(lexico, indiceVerbal);
       const analisis = analizador.analizar("El niño come pan.");
   ============================================================ */

import { AnalizadorDeProposicion } from "./AnalizadorDeProposicion.js";
import { ClasificadorDeOracion } from "./ClasificadorDeOracion.js";
import { Etiquetador } from "./Etiquetador.js";
import { Nodo } from "./Nodo.js";
import { Tokenizador } from "./Palabra.js";

class Analisis {
  constructor({ texto, palabras, arbol, rasgos, proposiciones, avisos }) {
    this.texto = texto;
    this.palabras = palabras;
    this.arbol = arbol;
    this.rasgos = rasgos;
    this.proposiciones = proposiciones;
    this.avisos = avisos || [];
  }

  /* Palabras que se muestran, sin la segunda mitad de las contracciones */
  get palabrasVisibles() {
    return this.palabras.filter((p) => !p.seOculta);
  }

  get palabrasConContenido() {
    return this.palabras.filter((p) => !p.esSigno);
  }

  /* Clases de palabra presentes en la oración, para la leyenda */
  get clasesUsadas() {
    return [...new Set(this.palabras.map((p) => p.clase).filter((c) => c && c !== "signo"))];
  }

  rasgo(nombre) {
    const r = this.rasgos.find((x) => x.nombre === nombre);
    return r ? r.valor : null;
  }
}

export class Analizador {
  constructor(lexico, indiceVerbal) {
    this.lexico = lexico;
    this.indice = indiceVerbal;
    this.etiquetador = new Etiquetador(lexico, indiceVerbal);
  }

  analizar(texto) {
    const limpio = (texto || "").trim();
    if (!limpio) return null;

    const avisos = [];
    const original = this.etiquetador.etiquetar(Tokenizador.partir(limpio));

    // Las oraciones de relativo incrustadas se sacan antes de nada
    const relativas = this._localizarRelativas(original);
    const palabras = relativas.length ? Tokenizador.sinTramos(original, relativas) : original;

    const proposiciones = this._analizarProposiciones(palabras);
    this._analizarRelativas(original, relativas, proposiciones);

    const rasgos = new ClasificadorDeOracion(limpio, original, proposiciones).clasificar();
    const arbol = this._montarRaiz(limpio, proposiciones, rasgos);

    if (original.some((p) => p.analisis && p.analisis.supuesto)) {
      avisos.push("Alguna palabra no está en el vocabulario del atlas y se clasificó por su terminación. Conviene revisarla.");
    }

    return new Analisis({ texto: limpio, palabras: original, arbol, rasgos, proposiciones, avisos });
  }

  /* ------------------------------------------------------------
     Proposiciones
     ------------------------------------------------------------ */

  _analizarProposiciones(palabras) {
    const analizador = new AnalizadorDeProposicion(palabras, this.lexico);
    const trozos = this._partir(palabras);

    return trozos.map((tr, n) => {
      const arbol = analizador.analizar(tr.inicio, tr.fin);
      const clasificacion = n === 0
        ? { tipo: "Proposición principal", clase: "principal" }
        : Analizador._tipoDeProposicion(palabras[tr.inicio]);
      arbol.tipo = trozos.length > 1 ? clasificacion.tipo : "Oración simple";
      return { arbol, clase: clasificacion.clase, tipo: clasificacion.tipo, datos: arbol.datos };
    });
  }

  /* Corta la oración cuando aparece un nexo que abre otra proposición */
  _partir(palabras) {
    const esConjugado = (p) => p.clase === "verbo" && p.analisis.esVerboConjugado;
    const cortes = [];

    palabras.forEach((p, i) => {
      if (i === 0 || !p.analisis) return;
      const esNexo = p.clase === "conjunción" || p.analisis.esRelativo;
      if (!esNexo) return;
      const hayVerboDespues = palabras.slice(i + 1).some(esConjugado);
      const hayVerboAntes = palabras.slice(0, i).some(esConjugado);
      if (hayVerboDespues && hayVerboAntes) cortes.push(i);
    });

    if (!cortes.length) return [{ inicio: 0, fin: palabras.length }];
    const trozos = [];
    let desde = 0;
    cortes.forEach((c) => { trozos.push({ inicio: desde, fin: c }); desde = c; });
    trozos.push({ inicio: desde, fin: palabras.length });
    return trozos;
  }

  static _tipoDeProposicion(nexo) {
    if (!nexo || !nexo.analisis) return { tipo: "Proposición principal", clase: "principal" };
    const a = nexo.analisis;
    if (a.clase === "pronombre" && a.subtipo === "relativo") {
      return { tipo: "Proposición subordinada adjetiva o de relativo", clase: "subordinada" };
    }
    if (a.clase === "adverbio" && a.subtipo === "de relativo") {
      return { tipo: "Proposición subordinada adverbial", clase: "subordinada" };
    }
    const sub = a.subtipo || "";
    if (["copulativa", "disyuntiva", "adversativa", "distributiva", "explicativa", "ilativa"].includes(sub)) {
      return { tipo: "Proposición coordinada " + sub, clase: "coordinada" };
    }
    if (sub === "completiva") return { tipo: "Proposición subordinada sustantiva", clase: "subordinada" };
    return { tipo: "Proposición subordinada adverbial " + sub, clase: "subordinada" };
  }

  /* ------------------------------------------------------------
     Oraciones de relativo incrustadas
     ------------------------------------------------------------
     En "Los alumnos que estudian aprueban el examen" la relativa
     queda dentro del sujeto. Se extrae y la principal se analiza
     sin ella, que es lo que se hace al analizar a mano.
     ------------------------------------------------------------ */

  _localizarRelativas(palabras) {
    const esConjugado = (p) => p.clase === "verbo" && p.analisis.esVerboConjugado;
    const relativas = [];

    for (let r = 1; r < palabras.length; r++) {
      const p = palabras[r];
      if (!p.analisis || !p.analisis.esRelativo) continue;
      if (relativas.some((x) => r >= x.inicio && r < x.fin)) continue;

      let verbo = -1;
      for (let k = r + 1; k < palabras.length; k++) { if (esConjugado(palabras[k])) { verbo = k; break; } }
      if (verbo === -1) continue;

      let cierre = palabras.length;
      for (let k = verbo + 1; k < palabras.length; k++) {
        if (palabras[k].texto === "," || esConjugado(palabras[k])) { cierre = k; break; }
      }
      // Si llega al final, la parte el separador normal de proposiciones
      if (cierre === palabras.length) continue;
      relativas.push({ inicio: r, fin: cierre });
    }
    return relativas;
  }

  _analizarRelativas(original, relativas, proposiciones) {
    relativas.forEach((rel) => {
      const trozo = Tokenizador.tramo(original, rel.inicio, rel.fin);
      const analizador = new AnalizadorDeProposicion(trozo, this.lexico);
      const arbol = analizador.analizar(0, trozo.length);
      arbol.tipo = "Proposición subordinada adjetiva o de relativo";
      proposiciones.push({ arbol, clase: "subordinada", tipo: arbol.tipo, datos: arbol.datos, relativa: true });
    });
  }

  _montarRaiz(texto, proposiciones, rasgos) {
    if (proposiciones.length === 1) return proposiciones[0].arbol;
    const estructura = rasgos.find((r) => r.nombre === "Por su estructura");
    const raiz = new Nodo({ funcion: "Oración", tipo: estructura ? estructura.valor : "", texto });
    proposiciones.forEach((p, n) => {
      const copia = new Nodo({
        funcion: n === 0 ? "Proposición 1" : "Proposición " + (n + 1),
        tipo: p.tipo, texto: p.arbol.texto, pista: p.arbol.pista, hijos: p.arbol.hijos
      });
      raiz.agregar(copia);
    });
    return raiz;
  }
}
