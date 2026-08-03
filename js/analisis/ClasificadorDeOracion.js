/* ============================================================
   ClasificadorDeOracion
   ------------------------------------------------------------
   Dice qué tipo de oración es, que en un examen se responde
   siempre con varios criterios a la vez: la actitud del
   hablante, la estructura, la naturaleza del predicado, la voz,
   la transitividad y el sujeto.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";

class Rasgo {
  constructor(nombre, valor) {
    this.nombre = nombre;
    this.valor = valor;
  }
}

export class ClasificadorDeOracion {
  constructor(texto, palabras, proposiciones) {
    this.texto = (texto || "").trim();
    this.palabras = palabras;
    this.proposiciones = proposiciones;
    this.principal = proposiciones.length ? proposiciones[0].datos : null;
  }

  clasificar() {
    const rasgos = [
      new Rasgo("Por la actitud del hablante", this.actitud()),
      new Rasgo("Por su estructura", this.estructura())
    ];
    if (!this.principal) return rasgos;

    rasgos.push(new Rasgo("Por el predicado", this.predicado()));
    if (!this.principal.grupo.copulativo) {
      rasgos.push(new Rasgo("Por la voz", this.principal.grupo.pasiva ? "Pasiva" : "Activa"));
      rasgos.push(new Rasgo("Por el complemento directo", this.principal.hayCD ? "Transitiva" : "Intransitiva"));
    }
    rasgos.push(new Rasgo("Por el sujeto", this.sujeto()));

    const pronominal = this.pronominal();
    if (pronominal) rasgos.push(new Rasgo("Con pronombre", pronominal));
    return rasgos;
  }

  actitud() {
    if (this.principal && this.principal.grupo.info.modo === "Imperativo") return "Exhortativa o imperativa";
    if (this.palabras.some((p) => p.min === "ojalá")) return "Desiderativa";
    if (this.palabras.some((p) => ["quizá", "quizás", "acaso", "probablemente", "posiblemente"].includes(p.min))) {
      return "Dubitativa";
    }
    if (/[¿?]/.test(this.texto)) return "Interrogativa";
    if (/[¡!]/.test(this.texto)) return "Exclamativa";
    return "Enunciativa";
  }

  estructura() {
    if (this.proposiciones.length <= 1) return "Oración simple";
    const clases = this.proposiciones.slice(1).map((p) => p.clase);
    if (clases.every((c) => c === "coordinada")) return "Oración compuesta por coordinación";
    if (clases.some((c) => c === "subordinada")) return "Oración compuesta por subordinación";
    return "Oración compuesta";
  }

  predicado() {
    return this.principal.grupo.copulativo
      ? "Predicado nominal (atributiva)"
      : "Predicado verbal (predicativa)";
  }

  sujeto() {
    if (this.principal.impersonal) return "Impersonal (sin sujeto)";
    if (!this.principal.sujeto) return "Sujeto omitido o elíptico";
    return this.principal.grupo.pasiva ? "Sujeto paciente" : "Sujeto expreso";
  }

  pronominal() {
    if (this.principal.grupo.copulativo) return null;
    const hay = this.palabras.some((p) =>
      p.clase === "pronombre" && ["se", "me", "te", "nos", "os"].includes(p.min));
    if (!hay) return null;
    const sujeto = this.principal.sujeto;
    const plural = sujeto && Texto.numeroDe(sujeto.nucleo || "") === "plural";
    return plural ? "Puede ser reflexiva o recíproca" : "Reflexiva o pronominal";
  }
}
