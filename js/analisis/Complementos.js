/* ============================================================
   Complementos
   ------------------------------------------------------------
   Decide qué función cumple cada sintagma que sigue al verbo.
   Concentra aquí las reglas que distinguen un complemento
   directo de un indirecto, un circunstancial de un complemento
   de régimen y un atributo de un predicativo.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";

export class Complementos {
  constructor(lexico) {
    this.lexico = lexico;
  }

  /* Función de un sintagma preposicional detrás del verbo */
  funcionDeSintagmaPreposicional(sintagma, contexto) {
    const prep = sintagma.nucleo.toLowerCase();
    const nucleoTermino = sintagma.termino ? sintagma.termino.nucleoEnMinusculas : "";
    const animado = this._animado(nucleoTermino, sintagma);

    if (contexto.pasiva && prep === "por") {
      return {
        funcion: "C. agente",
        pista: "En la voz pasiva, por más sintagma nominal señala quien realiza la acción."
      };
    }
    if (contexto.regimen.includes(prep)) {
      return {
        funcion: "C. de régimen",
        pista: `El verbo ${contexto.lema} exige la preposición ${prep}, de modo que este complemento es de régimen.`
      };
    }
    if (prep === "a" && !contexto.hayCD && animado) {
      return {
        funcion: "CD",
        pista: "El complemento directo de persona lleva la preposición a, y se puede sustituir por lo o la."
      };
    }
    if (prep === "a") {
      return { funcion: "CI", pista: "Se puede sustituir por le o les, así que es complemento indirecto." };
    }
    if (prep === "para") {
      return animado
        ? { funcion: "CI", pista: "Se puede sustituir por le o les, así que es complemento indirecto." }
        : { funcion: "CC de finalidad", pista: "Indica para qué se hace la acción." };
    }
    return this.circunstancial(prep, nucleoTermino, sintagma);
  }

  /* Clasifica un circunstancial preposicional por su preposición y su núcleo */
  circunstancial(prep, nucleo, sintagma) {
    const temporal = this.lexico.esTemporal(nucleo);
    const locativo = this.lexico.esLocativo(nucleo);

    if (prep === "con") {
      if (this._animado(nucleo, sintagma)) {
        return { funcion: "CC de compañía", pista: "Con más un ser animado dice con quién se realiza la acción." };
      }
      if (this.lexico.esAbstracto(nucleo)) {
        return { funcion: "CC de modo", pista: "Con más un nombre abstracto dice de qué manera se realiza la acción." };
      }
      return { funcion: "CC de instrumento", pista: "Con más un objeto dice con qué se realiza la acción." };
    }
    if (prep === "por" && locativo) {
      return { funcion: "CC de lugar", pista: "Por más un sustantivo de lugar señala el recorrido de la acción." };
    }
    if (prep === "en") {
      return temporal
        ? { funcion: "CC de tiempo", pista: "En más una expresión de tiempo dice cuándo ocurre la acción." }
        : { funcion: "CC de lugar", pista: "En más un sustantivo de lugar dice dónde ocurre la acción." };
    }
    if (prep === "hasta" || prep === "desde") {
      return temporal
        ? { funcion: "CC de tiempo", pista: prep === "hasta" ? "Marca el final de un periodo." : "Marca el comienzo de un periodo." }
        : { funcion: "CC de lugar", pista: prep === "hasta" ? "Marca el punto de llegada." : "Marca el punto de partida." };
    }

    const tabla = Complementos.TABLA_PREPOSICIONES[prep];
    if (tabla) return { funcion: tabla[0], pista: tabla[1] };
    return { funcion: "CC", pista: "Complemento circunstancial: añade una circunstancia a la acción." };
  }

  static get TABLA_PREPOSICIONES() {
    return {
      sobre: ["CC de lugar", "Señala la posición en la que ocurre la acción."],
      bajo: ["CC de lugar", "Señala la posición en la que ocurre la acción."],
      hacia: ["CC de lugar", "Señala la dirección del movimiento."],
      entre: ["CC de lugar", "Sitúa la acción entre dos puntos."],
      tras: ["CC de lugar", "Sitúa la acción detrás de algo o después de algo."],
      durante: ["CC de tiempo", "Dice cuánto dura la acción."],
      sin: ["CC de modo", "Dice de qué manera, por ausencia, se realiza la acción."],
      por: ["CC de causa", "Por más un sustantivo suele decir por qué ocurre la acción."],
      "según": ["CC de modo", "Dice conforme a qué se realiza la acción."],
      contra: ["CC de lugar", "Señala la dirección o el destinatario de la acción."],
      ante: ["CC de lugar", "Sitúa la acción delante de algo."],
      de: ["CC de lugar", "De más un sustantivo suele señalar el origen o la procedencia."]
    };
  }

  _animado(nucleo, sintagma) {
    if (this.lexico.esAnimado(nucleo)) return true;
    // Un nombre propio detrás de la preposición suele designar a una persona
    return Boolean(sintagma && sintagma.termino && /^[A-ZÁÉÍÓÚÑ]/.test(sintagma.termino.nucleo || ""));
  }

  /* Verbos que colocan el sujeto detrás con toda naturalidad */
  static get SUJETO_POSPUESTO() {
    return new Set(["llegar", "venir", "existir", "faltar", "quedar", "ocurrir", "suceder",
      "aparecer", "surgir", "entrar", "salir", "morir", "nacer", "gustar", "encantar",
      "doler", "interesar", "importar", "bastar", "sobrar", "caber", "acabar", "empezar",
      "comenzar", "terminar", "crecer", "subir", "bajar", "caer", "correr", "sonar", "brillar"]);
  }

  static admiteSujetoPospuesto(infinitivo, copulativo) {
    return copulativo || Complementos.SUJETO_POSPUESTO.has(infinitivo);
  }

  /* Concordancia entre un verbo en tercera persona y un candidato a sujeto */
  static concuerda(persona, nucleo) {
    if (persona !== 2 && persona !== 5) return false;
    const plural = Texto.numeroDe(nucleo || "") === "plural";
    return persona === 5 ? plural : !plural;
  }

  /* Verbos que no admiten sujeto de ninguna clase */
  static get IMPERSONALES() {
    return new Set(["llover", "nevar", "granizar", "tronar", "amanecer", "atardecer",
      "anochecer", "relampaguear"]);
  }

  esImpersonal(infinitivo, palabras, indiceVerbo, sujeto) {
    if (Complementos.IMPERSONALES.has(infinitivo)) return true;

    // Haber existencial: hay muchos libros, había gente
    if (infinitivo === "haber" && !sujeto) {
      const sig = palabras[indiceVerbo + 1];
      if (sig && sig.clase !== "verbo") return true;
    }
    // Hacer con expresiones de clima o de tiempo: hace frío, hace dos años
    if (infinitivo === "hacer" && !sujeto && palabras[indiceVerbo].analisis.persona === 2) {
      const sig = palabras[indiceVerbo + 1];
      if (sig && ["frío", "calor", "viento", "sol", "años", "días", "meses", "tiempo"].includes(sig.min)) {
        return true;
      }
    }
    return false;
  }
}
