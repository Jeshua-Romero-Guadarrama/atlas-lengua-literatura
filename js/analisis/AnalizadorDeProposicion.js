/* ============================================================
   AnalizadorDeProposicion
   ------------------------------------------------------------
   Analiza un tramo de la oración que contiene un solo verbo
   conjugado: localiza el sujeto, arma el predicado y reparte las
   funciones entre los complementos.

   Devuelve un Nodo con todo el árbol de esa proposición, y deja
   en la propiedad datos lo que la clasificación necesita saber.
   ============================================================ */

import { Complementos } from "./Complementos.js";
import { GrupoVerbal } from "./GrupoVerbal.js";
import { LectorDeSintagmas, Sintagma } from "./LectorDeSintagmas.js";
import { Nodo } from "./Nodo.js";
import { Tokenizador } from "./Palabra.js";

export class AnalizadorDeProposicion {
  constructor(palabras, lexico) {
    this.palabras = palabras;
    this.lexico = lexico;
    this.lector = new LectorDeSintagmas(palabras, lexico);
    this.complementos = new Complementos(lexico);
  }

  analizar(inicio, fin) {
    const contexto = this._prepararContexto(inicio, fin);
    if (!contexto) {
      return new Nodo({
        funcion: "Oración", tipo: "Enunciado sin verbo",
        texto: Tokenizador.texto(this.palabras, inicio, fin),
        pista: "No se reconoció ningún verbo conjugado, así que puede tratarse de una frase nominal."
      });
    }
    return this._montarArbol(contexto);
  }

  /* ------------------------------------------------------------
     Preparación: núcleo verbal, sujeto y complementos
     ------------------------------------------------------------ */

  _prepararContexto(inicio, fin) {
    let i = inicio;
    const nexo = this._nexoInicial(i);
    if (nexo && nexo.clase === "conjunción") i++;

    const indiceVerbo = this._buscarVerbo(i, fin);
    if (indiceVerbo === -1) return null;

    const grupo = new GrupoVerbal(this.palabras, indiceVerbo, this.lexico);
    const estado = {
      inicio, fin, nexo, grupo,
      sujeto: null, sujetoPospuesto: false, atributo: null,
      hayCD: grupo.cliticos.some((c) => c.funcion === "CD"),
      adelantados: [], complementos: grupo.cliticos.slice(),
      regimen: this.lexico.regimenDe(grupo.info.infinitivo).concat(this.lexico.regimenDe(grupo.lema))
    };

    this._buscarSujeto(estado, Math.max(i, inicio));
    estado.impersonal = this.complementos.esImpersonal(
      grupo.info.infinitivo, this.palabras, indiceVerbo, estado.sujeto);

    // El pronombre relativo puede ser el sujeto de su propia proposición
    if (!estado.sujeto && nexo && nexo.analisis && nexo.analisis.esRelativo && nexo.clase === "pronombre") {
      estado.sujeto = new Sintagma({
        tipo: "SN", texto: nexo.texto, inicio: nexo.i, fin: nexo.i + 1, nucleo: nexo.texto,
        hijos: [new Nodo({ funcion: "Núcleo", tipo: "Pronombre relativo", texto: nexo.texto, indice: nexo.i })]
      });
    }

    this._repartirComplementos(estado);
    return estado;
  }

  _nexoInicial(i) {
    const p = this.palabras[i];
    if (!p || !p.analisis) return null;
    if (p.clase === "conjunción" || p.analisis.esRelativo) return p;
    return null;
  }

  _buscarVerbo(desde, fin) {
    let primero = -1;
    for (let k = desde; k < fin; k++) {
      if (this.palabras[k].clase !== "verbo") continue;
      if (this.palabras[k].analisis.esVerboConjugado) return k;
      if (primero === -1) primero = k;
    }
    return primero;
  }

  /* Lo que aparece delante del verbo y no es el sujeto son complementos
     adelantados, algo muy común en español: "Ayer llovió mucho". */
  _buscarSujeto(estado, desde) {
    const hasta = estado.grupo.inicio;
    let j = desde;
    while (j < hasta) {
      if (this.palabras[j].clase === "signo") { j++; continue; }

      const adverbial = this.lector.leerAdverbial(j, hasta);
      if (adverbial) {
        const clase = this.lector.claseDeAdverbio(adverbial);
        estado.adelantados.push(adverbial.aNodo("CC de " + clase,
          "Complemento circunstancial colocado delante del verbo."));
        j = adverbial.fin;
        continue;
      }

      if (this.palabras[j].clase === "preposición") {
        const sp = this.lector.leerPreposicional(j, hasta);
        if (sp) {
          const cc = this.complementos.circunstancial(
            this.palabras[j].min, sp.termino ? sp.termino.nucleoEnMinusculas : "", sp);
          estado.adelantados.push(sp.aNodo(cc.funcion, cc.pista));
          j = sp.fin;
          continue;
        }
      }

      const sn = this.lector.leerNominal(j, hasta);
      if (sn) { estado.sujeto = sn; return; }
      j++;
    }
  }

  _repartirComplementos(estado) {
    const { grupo, fin } = estado;
    let k = grupo.fin;

    while (k < fin) {
      const p = this.palabras[k];
      if (!p || p.clase === "signo") { k++; continue; }
      if (p.clase === "conjunción" || (p.analisis && p.analisis.esRelativo)) break;

      if (p.clase === "preposición") { k = this._tomarPreposicional(estado, k); continue; }

      // Un adverbio seguido de adjetivo forma un sintagma adjetival:
      // en "es muy inteligente", muy pertenece al atributo
      if (p.clase === "adverbio" && this.palabras[k + 1] && this.palabras[k + 1].clase === "adjetivo") {
        const nuevo = this._tomarAdjetival(estado, k);
        if (nuevo !== k) { k = nuevo; continue; }
      }
      if (p.clase === "adverbio") { const nuevo = this._tomarAdverbial(estado, k); if (nuevo !== k) { k = nuevo; continue; } }
      if (p.clase === "adjetivo") { const nuevo = this._tomarAdjetival(estado, k); if (nuevo !== k) { k = nuevo; continue; } }

      const nuevo = this._tomarNominal(estado, k);
      if (nuevo !== k) { k = nuevo; continue; }
      k++;
    }
  }

  _tomarPreposicional(estado, k) {
    const sp = this.lector.leerPreposicional(k, estado.fin);
    if (!sp) return k + 1;
    const { funcion, pista } = this.complementos.funcionDeSintagmaPreposicional(sp, {
      pasiva: estado.grupo.pasiva, regimen: estado.regimen,
      hayCD: estado.hayCD, lema: estado.grupo.lema
    });
    if (funcion === "CD") estado.hayCD = true;
    estado.complementos.push(sp.aNodo(funcion, pista));
    return sp.fin;
  }

  _tomarAdverbial(estado, k) {
    const sa = this.lector.leerAdverbial(k, estado.fin);
    if (!sa) return k;
    const clase = this.lector.claseDeAdverbio(sa);
    estado.complementos.push(sa.aNodo("CC de " + clase,
      "El adverbio responde a la pregunta de " + clase + "."));
    return sa.fin;
  }

  _tomarAdjetival(estado, k) {
    if (!estado.grupo.copulativo && estado.hayCD) return k;
    const sadj = this.lector.leerAdjetival(k, estado.fin);
    if (!sadj) return k;

    if (estado.grupo.copulativo && !estado.atributo) {
      estado.atributo = sadj;
      estado.complementos.push(sadj.aNodo("Atributo",
        "Va con un verbo copulativo, concuerda con el sujeto y se sustituye por lo."));
    } else {
      estado.complementos.push(sadj.aNodo("C. predicativo",
        "Adjetivo que concuerda con el sujeto y a la vez modifica al verbo."));
    }
    return sadj.fin;
  }

  _tomarNominal(estado, k) {
    const sn = this.lector.leerNominal(k, estado.fin);
    if (!sn) return k;

    // Sujeto pospuesto: "¿Dónde están mis cuadernos?", "Me gustan los libros".
    // Solo con verbos que lo admiten y con concordancia, para no confundirlo
    // con el objeto directo.
    const admite = Complementos.admiteSujetoPospuesto(estado.grupo.info.infinitivo, estado.grupo.copulativo);
    if (!estado.sujeto && !estado.impersonal && admite &&
        Complementos.concuerda(estado.grupo.info.persona, sn.nucleo)) {
      estado.sujeto = sn;
      estado.sujetoPospuesto = true;
      return sn.fin;
    }

    if (estado.grupo.copulativo && !estado.atributo) {
      estado.atributo = sn;
      estado.complementos.push(sn.aNodo("Atributo",
        "Va con un verbo copulativo y se puede sustituir por lo."));
    } else if (!estado.hayCD && !this.lexico.esTemporal(sn.nucleo)) {
      estado.hayCD = true;
      estado.complementos.push(sn.aNodo("CD",
        "Va sin preposición detrás del verbo y se puede sustituir por lo, la, los o las."));
    } else {
      estado.complementos.push(sn.aNodo("CC de tiempo",
        "El sintagma nominal de sentido temporal funciona como circunstancial."));
    }
    return sn.fin;
  }

  /* ------------------------------------------------------------
     Montaje del árbol
     ------------------------------------------------------------ */

  _montarArbol(estado) {
    const raiz = new Nodo({
      funcion: "Oración", tipo: "",
      texto: Tokenizador.texto(this.palabras, estado.inicio, estado.fin)
    });

    if (estado.nexo && estado.nexo.clase === "conjunción") {
      raiz.agregar(new Nodo({
        funcion: "Nexo", tipo: "Conjunción " + (estado.nexo.subtipo || ""),
        texto: estado.nexo.texto, indice: estado.nexo.i
      }));
    }

    raiz.agregar(this._nodoSujeto(estado));
    raiz.agregar(this._nodoPredicado(estado));
    raiz.datos = estado;
    return raiz;
  }

  _nodoSujeto(estado) {
    if (estado.impersonal) {
      return new Nodo({
        funcion: "Sujeto", tipo: "Sin sujeto", texto: "(oración impersonal)",
        pista: "El verbo no admite sujeto: la acción no se atribuye a nadie."
      });
    }
    if (estado.sujeto) {
      const pista = estado.grupo.pasiva
        ? "En la voz pasiva el sujeto recibe la acción, no la realiza: es el sujeto paciente."
        : estado.sujetoPospuesto
          ? "Va detrás del verbo, pero concuerda con él en número y persona, así que es el sujeto."
          : "Concuerda en número y persona con el verbo. Si se cambia a plural, el verbo también cambia.";
      return estado.sujeto.aNodo("Sujeto", pista);
    }
    const pronombres = ["yo", "tú", "él o ella", "nosotros", "vosotros", "ellos o ellas"];
    const persona = estado.grupo.info.persona;
    return new Nodo({
      funcion: "Sujeto", tipo: "Sujeto omitido o elíptico",
      texto: persona >= 0 ? `(${pronombres[persona]})` : "(omitido)",
      pista: "No aparece escrito, pero la terminación del verbo dice cuál es."
    });
  }

  _nodoPredicado(estado) {
    const nucleo = new Nodo({
      funcion: "Núcleo", tipo: estado.grupo.tipoDeNucleo,
      texto: estado.grupo.texto, indice: estado.grupo.inicio,
      pista: estado.grupo.describir()
    });

    const hijos = [nucleo].concat(estado.adelantados, estado.complementos);
    const desde = Math.min(estado.grupo.inicio, ...estado.adelantados.map((a) => a.indice));

    const predicado = new Nodo({
      funcion: "Predicado",
      tipo: estado.grupo.copulativo ? "Predicado nominal" : "Predicado verbal",
      texto: Tokenizador.texto(this.palabras, desde, estado.fin),
      hijos,
      pista: estado.grupo.copulativo
        ? "El verbo es copulativo y apenas une el sujeto con el atributo, que es lo que de verdad informa."
        : "Todo lo que se dice del sujeto, con el verbo como núcleo."
    });
    return predicado.ordenarHijos();
  }
}
