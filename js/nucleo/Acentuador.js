/* ============================================================
   Acentuador
   ------------------------------------------------------------
   Decide en qué sílaba recae el acento de una palabra y si esa
   sílaba debe llevar tilde escrita. Contempla la tilde por
   hiato, que manda sobre la regla general.

   El resultado se devuelve como un objeto Acento, que es el que
   consultan la ficha de acentuación y el juego de la tilde.
   ============================================================ */

import { Silabeador } from "./Silabeador.js";
import { Texto } from "./Texto.js";

class Acento {
  constructor(datos) {
    Object.assign(this, datos);
  }

  /* Sílabas con la tilde quitada, para plantear el ejercicio */
  get silabasSinTilde() {
    return this.silabas.map(Texto.sinTildes);
  }

  get palabraSinTilde() {
    return Texto.sinTildes(this.palabra);
  }

  /* Frase completa que explica la decisión */
  get explicacion() {
    return `${Texto.mayuscula(this.palabra)} se separa en ${this.silabasSinTilde.join(" - ")} ` +
      `y es ${this.tipo}. ${this.motivo}`;
  }
}

export class Acentuador {
  static get NOMBRE_TIPO() {
    return { 1: "aguda", 2: "grave o llana", 3: "esdrújula", 4: "sobresdrújula" };
  }

  /* La condición que gobierna la regla de agudas y llanas */
  static terminaEnVocalNoS(palabra) {
    const ultima = Texto.sinTildes(palabra.toLowerCase()).slice(-1);
    return "aeiou".includes(ultima) || ultima === "n" || ultima === "s";
  }

  /* Índice de la sílaba tónica. Si hay tilde escrita, esa manda */
  static indiceTonica(silabas, palabra) {
    const conTilde = silabas.findIndex((s) => /[áéíóú]/.test(s));
    if (conTilde !== -1) return conTilde;
    if (silabas.length === 1) return 0;
    return Acentuador.terminaEnVocalNoS(palabra) ? silabas.length - 2 : silabas.length - 1;
  }

  /* ¿La sílaba tónica contiene una vocal cerrada en hiato?
     Si es así, la tilde es obligatoria sea cual sea la regla general
     (día, país, baúl, oír, reímos). */
  static hayHiatoAcentual(silabas, indice) {
    const silaba = silabas[indice];
    if (/[íú]/.test(silaba)) return true;

    const sinTilde = Texto.sinTildes(silaba);
    const nucleo = sinTilde.split("").filter(Silabeador.esVocal).join("");
    if (nucleo.length !== 1 || !"iu".includes(nucleo)) return false;

    const anterior = silabas[indice - 1] ? Texto.sinTildes(silabas[indice - 1]) : "";
    const siguiente = silabas[indice + 1] ? Texto.sinTildes(silabas[indice + 1]) : "";
    const vecinaAntes = anterior.split("").filter(Silabeador.esVocal).pop() || "";
    const vecinaDespues = siguiente.split("").filter(Silabeador.esVocal)[0] || "";
    const pegadoAntes = anterior && Silabeador.esVocal(anterior.slice(-1)) && Silabeador.esVocal(sinTilde[0]);
    const pegadoDespues = siguiente && Silabeador.esVocal(sinTilde.slice(-1)) && Silabeador.esVocal(siguiente[0]);

    return (pegadoAntes && Silabeador.esAbierta(vecinaAntes)) ||
           (pegadoDespues && Silabeador.esAbierta(vecinaDespues));
  }

  /* Analiza una palabra y devuelve su objeto Acento */
  static analizar(palabra) {
    const limpia = (palabra || "").trim();
    const silabas = Silabeador.separar(limpia);
    if (!silabas.length) return null;

    const indice = Acentuador.indiceTonica(silabas, limpia);
    const desdeElFinal = silabas.length - indice;
    const tipo = Acentuador.NOMBRE_TIPO[Math.min(desdeElFinal, 4)] || "sobresdrújula";
    const terminacion = Acentuador.terminaEnVocalNoS(limpia);
    const { debe, motivo } = Acentuador._decidir(silabas, indice, desdeElFinal, terminacion);

    return new Acento({
      palabra: limpia,
      silabas,
      indiceTonica: indice,
      posicionDesdeFinal: desdeElFinal,
      tipo,
      llevaTilde: /[áéíóú]/.test(limpia.toLowerCase()),
      debeLlevarTilde: debe,
      terminaEnVocalNoS: terminacion,
      motivo
    });
  }

  static _decidir(silabas, indice, desdeElFinal, terminacion) {
    if (Acentuador.hayHiatoAcentual(silabas, indice)) {
      return {
        debe: true,
        motivo: "La vocal cerrada tónica está junto a una abierta y forma un hiato, así que se acentúa aunque la regla general dijera otra cosa."
      };
    }
    if (desdeElFinal >= 3) {
      return { debe: true, motivo: "Todas las esdrújulas y las sobresdrújulas se acentúan, sin excepción." };
    }
    if (desdeElFinal === 1) {
      if (silabas.length === 1) {
        return { debe: false, motivo: "Es monosílaba, y las monosílabas no se acentúan salvo por tilde diacrítica." };
      }
      return terminacion
        ? { debe: true, motivo: "Es aguda y termina en vocal, en n o en s, de modo que lleva tilde." }
        : { debe: false, motivo: "Es aguda pero no termina en vocal, en n ni en s, así que no lleva tilde." };
    }
    return terminacion
      ? { debe: false, motivo: "Es grave o llana y termina en vocal, en n o en s, así que no lleva tilde." }
      : { debe: true, motivo: "Es grave o llana y no termina en vocal, en n ni en s, de modo que lleva tilde." };
  }

  /* Añade la tilde a una forma aguda que la necesita (manten pasa a mantén) */
  static acentuarAguda(forma) {
    const silabas = Silabeador.separar(forma);
    if (silabas.length < 2) return forma;
    if (/[áéíóú]/.test(forma)) return forma;
    if (!Acentuador.terminaEnVocalNoS(forma)) return forma;
    const ultima = silabas[silabas.length - 1];
    const cambiada = ultima.replace(/[aeiou](?=[^aeiou]*$)/,
      (v) => ({ a: "á", e: "é", i: "í", o: "ó", u: "ú" }[v]));
    return forma.slice(0, forma.length - ultima.length) + cambiada;
  }
}
