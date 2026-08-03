/* ============================================================
   GrupoVerbal
   ------------------------------------------------------------
   Localiza el núcleo del predicado y decide qué palabras forman
   con él una sola pieza: los pronombres átonos que lo preceden,
   el auxiliar haber de los tiempos compuestos, el ser de la voz
   pasiva y los auxiliares de las perífrasis.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { ModelosVerbales } from "../verbos/ModelosVerbales.js";
import { Nodo } from "./Nodo.js";
import { Tokenizador } from "./Palabra.js";

export class GrupoVerbal {
  static get AUXILIARES_MODALES() {
    return new Set(["poder", "deber", "querer", "soler", "necesitar", "tener"]);
  }

  static get AUXILIARES_ASPECTUALES() {
    return new Set(["ir", "acabar", "empezar", "comenzar", "seguir", "continuar", "volver",
      "dejar", "llegar", "echar", "estar", "andar", "venir", "quedar", "ponerse"]);
  }

  constructor(palabras, indiceVerbo, lexico) {
    this.palabras = palabras;
    this.lexico = lexico;
    this.indiceVerbo = indiceVerbo;
    this.info = palabras[indiceVerbo].analisis;
    this.lema = this.info.infinitivo;
    this.tiempoCompuesto = false;
    this.pasiva = false;
    this.perifrasis = null;

    this.inicio = this._buscarInicio();
    this.fin = this._buscarFin();
    this.copulativo = this.lexico.esCopulativo(this.info.infinitivo) && !this.perifrasis && !this.pasiva;
  }

  /* Los pronombres átonos que van pegados delante forman parte del grupo */
  _buscarInicio() {
    let i = this.indiceVerbo;
    while (i - 1 >= 0 && this.palabras[i - 1].analisis && this.palabras[i - 1].analisis.esAtono) i--;
    return i;
  }

  _buscarFin() {
    let fin = this.indiceVerbo + 1;
    const siguiente = this.palabras[fin];
    const esParticipio = siguiente && siguiente.analisis && siguiente.analisis.esParticipio;

    if (this.lema === "haber" && esParticipio) {
      this.tiempoCompuesto = true;
      this.lema = siguiente.analisis.infinitivo || this.lema;
      return fin + 1;
    }
    if (this.lema === "ser" && esParticipio) {
      this.pasiva = true;
      this.lema = siguiente.analisis.infinitivo || this.lema;
      return fin + 1;
    }
    return this._buscarPerifrasis(fin);
  }

  /* Perífrasis: auxiliar más infinitivo o gerundio, a veces con nexo */
  _buscarPerifrasis(fin) {
    let k = fin;
    let nexo = "";
    const enlace = this.palabras[k];
    if (enlace && ["a", "de", "que"].includes(enlace.min)) {
      const tras = this.palabras[k + 1];
      if (tras && tras.analisis && (tras.analisis.esInfinitivo || tras.analisis.esGerundio)) {
        nexo = enlace.texto;
        k++;
      }
    }
    const principal = this.palabras[k];
    if (!principal || !principal.analisis) return fin;
    if (!principal.analisis.esInfinitivo && !principal.analisis.esGerundio) return fin;

    const aux = this.info.infinitivo;
    const esModal = GrupoVerbal.AUXILIARES_MODALES.has(aux);
    const esAspectual = GrupoVerbal.AUXILIARES_ASPECTUALES.has(aux);
    if (!esModal && !esAspectual) return fin;

    this.perifrasis = {
      auxiliar: this.palabras[this.indiceVerbo].texto,
      nexo,
      principal: principal.texto,
      tipo: esModal ? "modal" : "aspectual"
    };
    this.lema = principal.analisis.infinitivo || this.lema;
    return k + 1;
  }

  get texto() { return Tokenizador.texto(this.palabras, this.inicio, this.fin); }

  get tipoDeNucleo() {
    if (this.perifrasis) return `Perífrasis verbal ${this.perifrasis.tipo}`;
    if (this.tiempoCompuesto) return "Verbo en tiempo compuesto";
    return "Verbo";
  }

  /* Los pronombres átonos que hay dentro del grupo, con su función */
  get cliticos() {
    const salida = [];
    for (let k = this.inicio; k < this.fin; k++) {
      const p = this.palabras[k];
      if (!p.analisis || !p.analisis.esAtono) continue;
      salida.push(new Nodo(Object.assign(
        { tipo: "Pronombre átono", texto: p.texto, indice: p.i },
        GrupoVerbal._funcionDelClitico(p.min)
      )));
    }
    return salida;
  }

  static _funcionDelClitico(w) {
    if (["le", "les"].includes(w)) {
      return { funcion: "CI", pista: "El pronombre le o les hace de complemento indirecto." };
    }
    if (["me", "te", "nos", "os"].includes(w)) {
      return { funcion: "CD o CI", pista: "Según el verbo puede ser complemento directo o indirecto." };
    }
    if (w === "se") {
      return { funcion: "Pronominal", pista: "Puede marcar reflexividad, reciprocidad, pasiva refleja o impersonalidad." };
    }
    return { funcion: "CD", pista: "El pronombre lo, la, los o las hace de complemento directo." };
  }

  /* Explicación del núcleo verbal, para la pista del árbol */
  describir() {
    const partes = [];
    if (this.info.infinitivo) partes.push(`Verbo ${this.lema || this.info.infinitivo}`);
    if (this.info.esVerboConjugado && this.info.tiempo) {
      const t = ModelosVerbales.tiempo(this.info.tiempo);
      if (t) partes.push(t.nombreLargo.toLowerCase());
      const persona = ModelosVerbales.PERSONAS_DESCRITAS[this.info.persona];
      if (persona) partes.push(persona);
    }
    if (this.tiempoCompuesto) partes.push("es un tiempo compuesto, formado por haber más participio");
    if (this.pasiva) partes.push("está en voz pasiva, formada por ser más participio");
    if (this.perifrasis) partes.push(`forma una perífrasis ${this.perifrasis.tipo} con ${this.perifrasis.principal}`);
    return Texto.mayuscula(partes.join(", ")) + ".";
  }
}
