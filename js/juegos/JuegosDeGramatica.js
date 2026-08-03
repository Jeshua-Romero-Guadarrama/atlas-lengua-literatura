/* ============================================================
   Juegos de gramática y de sintaxis
   ------------------------------------------------------------
   Los dos primeros usan ejercicios resueltos a mano, para que
   nunca den por mala una respuesta correcta. El de tiempos
   verbales se genera con el conjugador, así que sus preguntas no
   se acaban nunca.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { ModelosVerbales } from "../verbos/ModelosVerbales.js";
import { Juego } from "./Juego.js";
import { PreguntaDeOpciones, PreguntaDePalabras, PreguntaEscrita } from "./Pregunta.js";

export class JuegoDeClases extends Juego {
  static get CLASES() {
    return ["sustantivo", "verbo", "adjetivo", "determinante", "pronombre",
      "adverbio", "preposición", "conjunción", "interjección"];
  }

  constructor(ejercicios) {
    super({
      id: "clases", nombre: "Caza la clase de palabra", icono: "arbol", insignia: "Gramática",
      descripcion: "Señala el sustantivo, el verbo o el adverbio dentro de una oración, y di qué clase es cada palabra."
    });
    this.ejercicios = ejercicios || [];
  }

  generar(cuantas) {
    if (!this.ejercicios.length) return [];
    const preguntas = [];
    const fuente = Texto.mezclar(this.ejercicios);
    let i = 0;

    while (preguntas.length < cuantas && i < fuente.length * 3) {
      const ej = fuente[i % fuente.length];
      i++;
      const pregunta = preguntas.length % 2 === 0
        ? this._senalaLaPalabra(ej)
        : this._queClaseEs(ej);
      if (pregunta && Juego.sinRepetir(preguntas, pregunta)) preguntas.push(pregunta);
    }
    return preguntas.slice(0, cuantas);
  }

  /* Modo uno: dada una clase, hay que hacer clic en una palabra que la cumpla */
  _senalaLaPalabra(ej) {
    const palabras = ej.palabras || [];
    const presentes = [...new Set(palabras.map((p) => p.clase))]
      .filter((c) => JuegoDeClases.CLASES.includes(c));
    if (!presentes.length) return null;

    const objetivo = Texto.alAzar(presentes);
    const solucion = palabras.map((p, k) => (p.clase === objetivo ? k : -1)).filter((k) => k >= 0);
    const ejemplos = palabras.filter((p) => p.clase === objetivo).map((p) => `"${p.texto}"`).join(", ");

    return new PreguntaDePalabras({
      clave: ej.oracion + "|" + objetivo,
      instruccion: "Haz clic en la palabra que pide la pregunta",
      enunciado: `¿Cuál de estas palabras es un <span class="juego-destacado">${Texto.escapar(objetivo)}</span>?`,
      palabras, solucion,
      explicacion: `En "${ej.oracion}" son ${objetivo} ${ejemplos}.`
    });
  }

  /* Modo dos: dada una palabra, hay que elegir su clase */
  _queClaseEs(ej) {
    const palabras = ej.palabras || [];
    const objetivo = Texto.alAzar(palabras);
    if (!objetivo || !JuegoDeClases.CLASES.includes(objetivo.clase)) return null;

    const distractores = Texto.mezclar(JuegoDeClases.CLASES.filter((c) => c !== objetivo.clase)).slice(0, 3);
    return new PreguntaDeOpciones({
      clave: ej.oracion + "|" + objetivo.texto,
      instruccion: "Elige la clase de palabra correcta",
      enunciado: `En "${Texto.escapar(ej.oracion)}", ¿qué clase de palabra es <span class="juego-destacado">${Texto.escapar(objetivo.texto)}</span>?`,
      opciones: Texto.mezclar([objetivo.clase, ...distractores]),
      correcta: objetivo.clase,
      explicacion: objetivo.pista || `"${objetivo.texto}" funciona aquí como ${objetivo.clase}.`
    });
  }
}

export class JuegoDeSujetoYPredicado extends Juego {
  constructor(ejercicios) {
    super({
      id: "sujeto", nombre: "Sujeto y predicado", icono: "temario", insignia: "Sintaxis",
      descripcion: "Marca en qué palabra termina el sujeto y empieza el predicado. La base de todo el análisis sintáctico."
    });
    this.ejercicios = ejercicios || [];
  }

  generar(cuantas) {
    if (!this.ejercicios.length) return [];
    return Texto.mezclar(this.ejercicios).slice(0, cuantas).map((ej) => {
      const palabras = (ej.palabras || []).map((p) => (typeof p === "string" ? { texto: p } : p));
      const textos = palabras.map((p) => p.texto);
      const sujeto = textos.slice(0, ej.inicioPredicado).join(" ");
      return new PreguntaDePalabras({
        clave: ej.oracion,
        instruccion: "Marca dónde empieza el predicado",
        enunciado: 'Haz clic en la <span class="juego-destacado">primera palabra del predicado</span>.',
        palabras,
        solucion: [ej.inicioPredicado],
        explicacion: ej.explicacion ||
          `El sujeto es "${sujeto}" y el predicado empieza en "${textos[ej.inicioPredicado]}".`
      });
    });
  }
}

export class JuegoDeTiemposVerbales extends Juego {
  static get VERBOS() {
    return ["hablar", "comer", "vivir", "tener", "hacer", "poder", "decir", "ir", "ver", "dar",
      "saber", "querer", "llegar", "poner", "venir", "salir", "volver", "conocer", "sentir",
      "pedir", "dormir", "jugar", "empezar", "pensar", "contar", "leer", "escribir", "buscar",
      "traer", "caer", "oír", "construir", "seguir", "morir", "andar", "estar", "ser", "cerrar",
      "perder", "entender", "recordar", "encontrar", "mostrar", "aprender", "comprar", "vender"];
  }

  static get TIEMPOS() {
    return ["presenteIndicativo", "copreterito", "preterito", "futuro", "pospreterito",
      "presenteSubjuntivo", "preteritoSubjuntivoRa", "antepresente"];
  }

  constructor(conjugador) {
    super({
      id: "tiempos", nombre: "Tiempos verbales", icono: "conjugador", insignia: "Gramática",
      descripcion: "Se da un verbo, un tiempo y una persona, y hay que escribir la forma exacta. Preguntas infinitas."
    });
    this.conjugador = conjugador;
  }

  generar(cuantas) {
    const preguntas = [];
    let intentos = 0;

    while (preguntas.length < cuantas && intentos < cuantas * 15) {
      intentos++;
      const c = this.conjugador.conjugar(Texto.alAzar(JuegoDeTiemposVerbales.VERBOS));
      if (!c) continue;

      const idTiempo = Texto.alAzar(JuegoDeTiemposVerbales.TIEMPOS);
      const persona = Math.floor(Math.random() * 6);
      if (persona === 4) continue;                    // vosotros no se usa en México

      const forma = c.forma(idTiempo, persona);
      if (!forma) continue;

      const tiempo = ModelosVerbales.tiempo(idTiempo);
      const pregunta = new PreguntaEscrita({
        clave: c.infinitivo + "|" + idTiempo + "|" + persona,
        instruccion: "Escribe la forma verbal que corresponde",
        enunciado:
          `Verbo <span class="juego-destacado">${Texto.escapar(c.infinitivo)}</span><br>` +
          `${Texto.escapar(tiempo.nombre)} de ${Texto.escapar(tiempo.modo.toLowerCase())} <small>(${Texto.escapar(tiempo.alias)})</small><br>` +
          `Persona: <span class="juego-destacado">${Texto.escapar(ModelosVerbales.PERSONAS[persona])}</span>`,
        correcta: forma,
        explicacion: `${Texto.mayuscula(c.infinitivo)}: ${c.irregularidad}`
      });
      if (Juego.sinRepetir(preguntas, pregunta)) preguntas.push(pregunta);
    }
    return preguntas;
  }
}
