/* ============================================================
   Etiquetador
   ------------------------------------------------------------
   Decide qué clase de palabra es cada pieza de la oración. Lo
   hace en dos fases: primero reúne todas las lecturas posibles
   con su peso, y después aplica reglas de contexto para quedarse
   con una sola.

   Las reglas están ordenadas de la más segura a la más general,
   y cada una explica en un comentario qué caso resuelve.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { Lexico } from "./Lexico.js";
import { Lectura } from "./Palabra.js";

export class Etiquetador {
  constructor(lexico, indiceVerbal) {
    this.lexico = lexico;
    this.indice = indiceVerbal;
  }

  /* Terminaciones que delatan un adjetivo */
  static get SUFIJO_ADJETIVO() {
    return /(oso|osa|osos|osas|able|ables|ible|ibles|ivo|iva|ivos|ivas|ante|antes|ente|entes|iente|ientes|al|ales|il|iles|udo|uda|udos|udas|ino|ina|inos|inas|ico|ica|icos|icas|eño|eña|eños|eñas|ense|enses|iego|iega|izo|iza|izos|izas|erno|erna)$/;
  }

  /* Terminaciones que delatan un sustantivo */
  static get SUFIJO_SUSTANTIVO() {
    return /(ción|ciones|sión|siones|dad|dades|tad|tades|tud|tudes|umbre|umbres|ez|eces|eza|ezas|miento|mientos|aje|ajes|ura|uras|ismo|ismos|ista|istas|ancia|ancias|encia|encias|anza|anzas|ero|era|eros|eras|dor|dora|dores|doras|tor|tora|itis|logía|grafía|nomía)$/;
  }

  static get CUANTIFICADORES() {
    return ["mucho", "mucha", "muchos", "muchas", "poco", "poca", "pocos", "pocas",
      "bastante", "bastantes", "demasiado", "demasiada", "demasiados", "demasiadas",
      "tanto", "tanta", "tantos", "tantas", "todo", "toda", "todos", "todas",
      "más", "menos", "algo", "nada", "medio"];
  }

  static get ATONOS() {
    return new Set(["la", "lo", "los", "las", "le", "les", "me", "te", "se", "nos", "os"]);
  }

  /* ------------------------------------------------------------
     Fase 1: todas las lecturas posibles de una palabra
     ------------------------------------------------------------ */

  lecturas(palabra) {
    const w = palabra.min;
    const salida = [];
    const anade = (clase, datos, peso) => salida.push(new Lectura(clase, datos, peso));

    if (palabra.esSigno) { anade("signo", { subtipo: "puntuación" }, 10); return salida; }
    if (palabra.esNumero) { anade("determinante", { subtipo: "numeral cardinal" }, 10); return salida; }

    // Clases cerradas
    if (this.lexico.esPreposicion(w)) anade("preposición", { subtipo: "propia" }, 6);
    this.lexico.subtiposDe("conjunciones", w).forEach((s) => anade("conjunción", { subtipo: s }, 4));
    this.lexico.subtiposDe("determinantes", w).forEach((s) => anade("determinante", { subtipo: Lexico.nombreSubtipo(s) }, 5));
    this.lexico.subtiposDe("pronombres", w).forEach((s) => anade("pronombre", { subtipo: Lexico.nombreSubtipo(s) }, 5));
    this.lexico.subtiposDe("adverbios", w).forEach((s) => anade("adverbio", { subtipo: "de " + Lexico.nombreSubtipo(s) }, 4));
    if (this.lexico.esInterjeccion(w)) anade("interjección", {}, 3);

    // Adverbios formados con el sufijo mente
    if (/mente$/.test(w) && w.length > 6) anade("adverbio", { subtipo: "de modo" }, 7);

    // Verbo. Las formas reconocidas solo por su terminación pesan poco,
    // porque hay sustantivos que acaban igual (poesía frente a comía).
    this.indice.reconocer(w).forEach((v) => {
      anade("verbo", {
        subtipo: v.esNoPersonal ? v.tiempo : "conjugado",
        infinitivo: v.infinitivo, tiempo: v.tiempo, persona: v.persona,
        modo: v.modo, aproximado: v.aproximado
      }, v.aproximado ? 2 : (v.esNoPersonal ? 5 : 6));
    });

    // Clases abiertas
    if (this.lexico.esAdjetivo(w)) anade("adjetivo", { subtipo: "calificativo" }, 5);
    if (this.lexico.esSustantivo(w)) anade("sustantivo", { subtipo: "común" }, 5);

    if (!salida.some((l) => l.clase === "adjetivo") && Etiquetador.SUFIJO_ADJETIVO.test(w)) {
      anade("adjetivo", { subtipo: "calificativo" }, 3);
    }
    if (!salida.some((l) => l.clase === "sustantivo") && Etiquetador.SUFIJO_SUSTANTIVO.test(w)) {
      anade("sustantivo", { subtipo: "común" }, 4);
    }

    // Una palabra con mayúscula que no pertenece a ninguna clase cerrada
    // ni figura en el vocabulario es un nombre propio
    const cerrada = salida.some((l) => ["determinante", "pronombre", "preposición",
      "conjunción", "adverbio", "interjección"].includes(l.clase));
    const contenido = salida.some((l) => ["sustantivo", "adjetivo"].includes(l.clase) ||
      (l.clase === "verbo" && !l.aproximado));
    if (palabra.mayuscula && !cerrada && !contenido) anade("sustantivo", { subtipo: "propio" }, 8);

    if (!salida.length) anade("sustantivo", { subtipo: "común", supuesto: true }, 1);
    return salida;
  }

  /* ------------------------------------------------------------
     Fase 2: elegir una lectura por palabra
     ------------------------------------------------------------ */

  etiquetar(palabras) {
    palabras.forEach((p) => {
      p.lecturas = this.lecturas(p);
      p.analisis = p.lecturas.length === 1 ? p.lecturas[0] : null;
    });

    palabras.forEach((p, i) => {
      if (!p.analisis) p.analisis = this._resolver(p, i, palabras);
    });

    this._rescatarVerbo(palabras);
    this._anadirConcordancia(palabras);
    return palabras;
  }

  _resolver(p, i, palabras) {
    const reglas = [
      this._reglaAtonos, this._reglaCuantificadores, this._reglaDeterminanteOPronombre,
      this._reglaQue, this._reglaComo, this._reglaPreposicion,
      this._reglaSustantivoOVerbo, this._reglaSustantivoOAdjetivo
    ];
    for (const regla of reglas) {
      const elegida = regla.call(this, p, i, palabras);
      if (elegida) return elegida;
    }
    return p.mejorLectura();
  }

  /* Artículo o pronombre átono: la casa frente a la veo */
  _reglaAtonos(p, i, palabras) {
    const w = p.min;
    if (!Etiquetador.ATONOS.has(w)) return null;

    if (["me", "te", "se", "nos", "os", "le", "les"].includes(w) && p.puede("pronombre")) {
      return p.mejorLectura(p.lecturasDe("pronombre"));
    }
    if (p.puede("determinante") && p.puede("pronombre")) {
      const sig = palabras[i + 1];
      const sigueVerbo = sig && !sig.esSigno &&
        this.lecturas(sig).some((l) => l.esVerboConjugado);
      return p.mejorLectura(p.lecturasDe(sigueVerbo ? "pronombre" : "determinante"));
    }
    return null;
  }

  /* Cuantificadores: mucho ruido, come mucho, muy bueno.
     Va antes que la regla general porque casi todos son a la vez
     determinante, pronombre y adverbio. */
  _reglaCuantificadores(p, i, palabras) {
    if (!Etiquetador.CUANTIFICADORES.includes(p.min)) return null;
    const ant = palabras[i - 1];
    const sig = palabras[i + 1];
    const antVerbo = ant && ant.clase === "verbo";
    const sigLecturas = sig && !sig.esSigno ? this.lecturas(sig) : [];
    const sigueNombre = sigLecturas.some((l) => l.clase === "sustantivo");
    const sigueModificable = sigLecturas.some((l) => ["adjetivo", "adverbio"].includes(l.clase));
    const sigueDeterminante = sigLecturas.some((l) => l.clase === "determinante" &&
      /artículo|posesivo|demostrativo/.test(l.subtipo || ""));

    if (antVerbo && p.puede("adverbio") && !sigueNombre && !sigueDeterminante) {
      return p.mejorLectura(p.lecturasDe("adverbio"));
    }
    if ((sigueNombre || sigueDeterminante) && p.puede("determinante")) {
      return p.mejorLectura(p.lecturasDe("determinante"));
    }
    if (sigueModificable && p.puede("adverbio")) return p.mejorLectura(p.lecturasDe("adverbio"));
    if (p.puede("pronombre")) return p.mejorLectura(p.lecturasDe("pronombre"));
    return p.mejorLectura();
  }

  /* Determinante frente a pronombre: este libro frente a este es mío */
  _reglaDeterminanteOPronombre(p, i, palabras) {
    if (!(p.puede("determinante") && p.puede("pronombre"))) return null;
    const sig = palabras[i + 1];
    const sigueNombre = sig && !sig.esSigno &&
      this.lecturas(sig).some((l) => ["sustantivo", "adjetivo"].includes(l.clase));
    return p.mejorLectura(p.lecturasDe(sigueNombre ? "determinante" : "pronombre"));
  }

  /* que: relativo, comparativo o conjunción completiva */
  _reglaQue(p, i, palabras) {
    if (p.min !== "que") return null;
    const ant = palabras[i - 1];
    const comparativo = ant && ["más", "menos", "tan", "tanto", "igual",
      "mayor", "menor", "mejor", "peor"].includes(ant.min);
    if (comparativo) return new Lectura("conjunción", { subtipo: "comparativa" }, 6);
    if (ant && ant.esClase("sustantivo", "pronombre")) {
      return new Lectura("pronombre", { subtipo: "relativo" }, 6);
    }
    return new Lectura("conjunción", { subtipo: "completiva" }, 6);
  }

  /* como: puede ser el verbo comer */
  _reglaComo(p, i, palabras) {
    if (p.min !== "como") return null;
    const ant = palabras[i - 1];
    const hayOtroVerbo = palabras.some((o, j) => j !== i && o.clase === "verbo");
    if ((ant && ant.min === "yo") || !hayOtroVerbo) {
      return new Lectura("verbo", {
        subtipo: "conjugado", infinitivo: "comer",
        tiempo: "presenteIndicativo", persona: 0, modo: "Indicativo"
      }, 6);
    }
    return p.mejorLectura(p.lecturasDe("conjunción")) || new Lectura("adverbio", { subtipo: "de modo" }, 4);
  }

  /* Preposición frente a otra lectura: bajo la mesa frente a un tono bajo */
  _reglaPreposicion(p, i, palabras) {
    if (!p.puede("preposición") || p.lecturas.length === 1) return null;
    const ant = palabras[i - 1];
    const sig = palabras[i + 1];
    const sigueSintagma = sig && !sig.esSigno && this.lecturas(sig).some((l) =>
      ["determinante", "sustantivo", "pronombre", "adjetivo"].includes(l.clase) || l.esInfinitivo);
    if (sigueSintagma && !(ant && ant.clase === "determinante")) {
      return p.mejorLectura(p.lecturasDe("preposición"));
    }
    return null;
  }

  /* Sustantivo frente a verbo: la casa frente a él canta */
  _reglaSustantivoOVerbo(p, i, palabras) {
    if (!(p.puede("verbo") && (p.puede("sustantivo") || p.puede("adjetivo")))) return null;
    const ant = palabras[i - 1];
    const sig = palabras[i + 1];
    const infinitivo = p.lecturas.find((l) => l.esInfinitivo);

    // Detrás de una preposición, un infinitivo es un infinitivo (vamos a estudiar)
    if (ant && ant.clase === "preposición" && infinitivo) return infinitivo;

    if (ant && ant.esClase("determinante", "preposición", "adjetivo")) {
      return p.mejorLectura(p.lecturasDe("sustantivo")) || p.mejorLectura(p.lecturasDe("adjetivo"));
    }
    // Detrás de un verbo conjugado no viene otro verbo conjugado:
    // en "la casa está limpia", limpia es adjetivo
    if (ant && ant.analisis && ant.analisis.esVerboConjugado && p.puede("adjetivo")) {
      return p.mejorLectura(p.lecturasDe("adjetivo"));
    }
    const sigueNombre = sig && !sig.esSigno && this.lecturas(sig).some((l) => l.clase === "sustantivo");
    if (sigueNombre && p.puede("adjetivo")) return p.mejorLectura(p.lecturasDe("adjetivo"));

    // Gana la lectura de más peso: un verbo reconocido pesa más que un
    // sustantivo, y un sustantivo del vocabulario más que un verbo supuesto
    return p.mejorLectura();
  }

  /* Sustantivo frente a adjetivo */
  _reglaSustantivoOAdjetivo(p, i, palabras) {
    if (!(p.puede("sustantivo") && p.puede("adjetivo"))) return null;
    const ant = palabras[i - 1];
    const sig = palabras[i + 1];
    if (ant && ant.clase === "sustantivo") return p.mejorLectura(p.lecturasDe("adjetivo"));
    if (ant && ant.clase === "determinante") {
      const sigueNombre = sig && !sig.esSigno && this.lecturas(sig).some((l) => l.clase === "sustantivo");
      return p.mejorLectura(p.lecturasDe(sigueNombre ? "adjetivo" : "sustantivo"));
    }
    return p.mejorLectura(p.lecturasDe("sustantivo"));
  }

  /* Si la oración se quedó sin verbo, se rescata el mejor candidato */
  _rescatarVerbo(palabras) {
    if (palabras.some((p) => p.clase === "verbo")) return;
    const candidata = palabras.find((p) => p.puede("verbo"));
    if (candidata) candidata.analisis = candidata.mejorLectura(candidata.lecturasDe("verbo"));
  }

  _anadirConcordancia(palabras) {
    palabras.forEach((p) => {
      if (!p.analisis) p.analisis = new Lectura("sustantivo", { subtipo: "común" }, 1);
      if (["sustantivo", "adjetivo", "determinante", "pronombre"].includes(p.analisis.clase)) {
        p.analisis.numero = Texto.numeroDe(p.min);
        p.analisis.genero = Texto.generoDe(p.min);
      }
    });
  }
}
