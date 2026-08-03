/* ============================================================
   Juegos de ortografía
   ------------------------------------------------------------
   El reto de la tilde se genera con el acentuador, de modo que
   sus preguntas son infinitas y siempre traen la explicación de
   la regla. El de letras dudosas usa pares escritos a mano.
   ============================================================ */

import { Acentuador } from "../nucleo/Acentuador.js";
import { Silabeador } from "../nucleo/Silabeador.js";
import { Texto } from "../nucleo/Texto.js";
import { Juego } from "./Juego.js";
import { PreguntaDeOpciones, PreguntaDeSilabas } from "./Pregunta.js";

export class JuegoDeLaTilde extends Juego {
  constructor(palabras) {
    super({
      id: "tilde", nombre: "Reto de la tilde", icono: "ortografia", insignia: "Ortografía",
      descripcion: "La palabra aparece sin tilde. Decide si la lleva y en qué sílaba. Preguntas infinitas."
    });
    this.banco = palabras || [];
  }

  generar(cuantas) {
    if (!this.banco.length) return [];
    const preguntas = [];
    let intentos = 0;

    while (preguntas.length < cuantas && intentos < cuantas * 40) {
      intentos++;
      const palabra = Texto.alAzar(this.banco);
      const acento = Acentuador.analizar(palabra);
      if (!acento || acento.silabas.length < 2) continue;

      const pregunta = new PreguntaDeSilabas({
        clave: palabra,
        palabra,
        instruccion: "Decide si la palabra lleva tilde y, si la lleva, en qué sílaba",
        enunciado: `<span class="juego-destacado">${Texto.escapar(acento.palabraSinTilde)}</span>`,
        silabas: acento.silabasSinTilde,
        correcta: acento.debeLlevarTilde ? acento.indiceTonica : -1,
        explicacion: acento.explicacion
      });
      if (!Juego.sinRepetir(preguntas, pregunta)) continue;

      // Se mantiene un reparto sano entre palabras con tilde y sin ella
      const conTilde = preguntas.filter((p) => p.correcta !== -1).length;
      const sinTilde = preguntas.length - conTilde;
      if (acento.debeLlevarTilde && conTilde > sinTilde + 1) continue;
      if (!acento.debeLlevarTilde && sinTilde > conTilde + 1) continue;

      preguntas.push(pregunta);
    }
    return preguntas;
  }

  /* Reúne el banco de palabras: las del archivo de ejercicios y, si hacen
     falta más, las del vocabulario general */
  static bancoDesde(ejercicios, lexico) {
    const propias = (ejercicios || []).map((x) => (typeof x === "string" ? x : x.palabra));
    if (propias.length >= 40) return propias;
    const extra = [].concat(lexico.sustantivos || [], lexico.adjetivos || [], lexico.verbos || [])
      .filter((p) => p.length > 3 && Silabeador.separar(p).length >= 2);
    return propias.concat(extra);
  }
}

export class JuegoDeLetrasDudosas extends Juego {
  constructor(pares) {
    super({
      id: "ortografia", nombre: "Ortografía dudosa", icono: "check", insignia: "Ortografía",
      descripcion: "B y v, s y c y z, g y j, h, ll y y. Elige la escritura correcta y aprende la regla."
    });
    this.pares = pares || [];
  }

  generar(cuantas) {
    if (!this.pares.length) return [];
    return Texto.mezclar(this.pares).slice(0, cuantas).map((ej) => new PreguntaDeOpciones({
      clave: ej.correcta,
      instruccion: "Elige la palabra bien escrita",
      enunciado: ej.contexto
        ? Texto.escapar(ej.contexto).replace("___", '<span class="juego-destacado">___</span>')
        : "¿Cuál de las dos está bien escrita?",
      opciones: Texto.mezclar([ej.correcta, ej.incorrecta]),
      correcta: ej.correcta,
      explicacion: ej.regla || ""
    }));
  }
}
