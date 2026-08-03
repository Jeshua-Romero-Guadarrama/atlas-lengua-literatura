/* ============================================================
   Nodo
   ------------------------------------------------------------
   Cada caja del árbol sintáctico. Guarda la función que cumple,
   el tipo de sintagma que es, su texto, su núcleo y la pista que
   explica por qué se le asignó esa función.

   Sabe además qué clase de color le corresponde al pintarlo, de
   modo que la vista no tiene que decidir nada.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";

export class Nodo {
  constructor({ funcion, tipo, texto, nucleo, indice, pista, hijos }) {
    this.funcion = funcion || "";
    this.tipo = tipo || "";
    this.texto = texto || "";
    this.nucleo = nucleo || null;
    this.indice = indice !== undefined ? indice : null;
    this.pista = pista || "";
    this.hijos = hijos || [];
  }

  agregar(nodo) {
    if (nodo) this.hijos.push(nodo);
    return this;
  }

  get tieneHijos() { return this.hijos.length > 0; }

  /* Ordena los hijos por su posición en la oración */
  ordenarHijos() {
    this.hijos.sort((a, b) => (a.indice === null ? 0 : a.indice) - (b.indice === null ? 0 : b.indice));
    return this;
  }

  /* Clase de color según la función sintáctica */
  get claseDeColor() {
    const f = Texto.normalizar(this.funcion);
    if (f.startsWith("oracion") || f.startsWith("proposicion")) return "f-oracion";
    if (f === "sujeto") return "f-sujeto";
    if (f === "predicado") return "f-predicado";
    if (f === "nucleo") return "f-nucleo";
    if (f === "cd" || f === "cd o ci") return "f-cd";
    if (f === "ci") return "f-ci";
    if (f.startsWith("cc")) return "f-cc";
    if (f === "atributo") return "f-atributo";
    if (f.includes("regimen")) return "f-creg";
    if (f.includes("agente")) return "f-cagente";
    if (f.includes("predicativo")) return "f-cpred";
    if (f === "nexo" || f === "enlace") return "f-nexo";
    return "f-otro";
  }

  /* Recorre el árbol entero, incluido este nodo */
  *recorrer() {
    yield this;
    for (const hijo of this.hijos) yield* hijo.recorrer();
  }

  /* Busca el primer nodo con una función dada */
  buscar(funcion) {
    for (const nodo of this.recorrer()) {
      if (nodo.funcion === funcion) return nodo;
    }
    return null;
  }

  /* Versión llana para inspeccionarlo desde una prueba */
  aTexto(nivel = 0) {
    const sangria = "  ".repeat(nivel);
    let salida = `${sangria}· ${this.funcion} <${this.tipo}> "${this.texto}"\n`;
    this.hijos.forEach((h) => { salida += h.aTexto(nivel + 1); });
    return salida;
  }
}
