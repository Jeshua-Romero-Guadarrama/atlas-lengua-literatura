/* ============================================================
   Juegos de literatura
   ------------------------------------------------------------
   Los dos se alimentan del contenido del atlas, así que crecen
   solos a medida que se añaden figuras y corrientes.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { Juego } from "./Juego.js";
import { PreguntaDeOpciones } from "./Pregunta.js";

export class JuegoDeFiguras extends Juego {
  constructor(figuras) {
    super({
      id: "figuras", nombre: "Caza la figura retórica", icono: "figuras", insignia: "Literatura",
      descripcion: "Un verso o una frase, y hay que decir qué recurso literario se está usando."
    });
    this.figuras = (figuras || []).filter((f) => (f.ejemplos || []).length || f.ejemplo);
  }

  generar(cuantas) {
    if (this.figuras.length < 4) return [];
    return Texto.mezclar(this.figuras).slice(0, cuantas).map((f) => {
      const ejemplos = (f.ejemplos || []).length ? f.ejemplos : [f.ejemplo];
      return new PreguntaDeOpciones({
        clave: f.nombre,
        instruccion: "Identifica la figura retórica",
        enunciado: Texto.escapar(Texto.alAzar(ejemplos)),
        verso: true,
        opciones: Texto.mezclar([f.nombre, ...this._distractores(f)]),
        correcta: f.nombre,
        explicacion: `${f.nombre}: ${f.comoSeReconoce || f.queEs || ""}`
      });
    });
  }

  /* Los distractores se buscan primero entre las figuras del mismo tipo,
     que son las que de verdad cuesta separar */
  _distractores(f) {
    const mismoTipo = this.figuras.filter((o) => o.nombre !== f.nombre && o.tipo === f.tipo);
    const otras = this.figuras.filter((o) => o.nombre !== f.nombre && o.tipo !== f.tipo);
    return [...Texto.mezclar(mismoTipo), ...Texto.mezclar(otras)].slice(0, 3).map((o) => o.nombre);
  }
}

export class JuegoDeLiteratura extends Juego {
  constructor(movimientos) {
    super({
      id: "literatura", nombre: "Literatura relámpago", icono: "literatura", insignia: "Literatura",
      descripcion: "Obras, autores y corrientes. Tres formas de preguntar lo mismo para que no se aprenda de memoria."
    });
    this.movimientos = (movimientos || []).filter((m) => (m.autores || []).length);
  }

  generar(cuantas) {
    if (this.movimientos.length < 4) return [];
    const preguntas = [];
    let intentos = 0;

    while (preguntas.length < cuantas && intentos < cuantas * 15) {
      intentos++;
      const mov = Texto.alAzar(this.movimientos);
      const autor = Texto.alAzar(mov.autores);
      const forma = Math.floor(Math.random() * 3);

      let pregunta = null;
      if (forma === 0) pregunta = this._quienEscribio(mov, autor);
      else if (forma === 1) pregunta = this._aQueCorriente(mov, autor);
      else pregunta = this._deQueCorrienteEsEsteRasgo(mov);

      if (pregunta && Juego.sinRepetir(preguntas, pregunta)) preguntas.push(pregunta);
    }
    return preguntas;
  }

  _otrasCorrientes(mov) {
    return Texto.mezclar(this.movimientos.filter((m) => m.nombre !== mov.nombre))
      .slice(0, 3).map((m) => m.nombre);
  }

  _quienEscribio(mov, autor) {
    if (!(autor.obras || []).length) return null;
    const obra = Texto.alAzar(autor.obras);
    const otros = Texto.mezclar(this.movimientos.flatMap((m) => m.autores)
      .filter((a) => a.nombre !== autor.nombre)).slice(0, 3).map((a) => a.nombre);
    if (otros.length < 3) return null;

    return new PreguntaDeOpciones({
      clave: obra,
      instruccion: "Relaciona la obra con su autor",
      enunciado: `¿Quién escribió <span class="juego-destacado">${Texto.escapar(obra)}</span>?`,
      opciones: Texto.mezclar([autor.nombre, ...otros]),
      correcta: autor.nombre,
      explicacion: `${obra} es de ${autor.nombre}, del ${mov.nombre} (${mov.periodo}).`
    });
  }

  _aQueCorriente(mov, autor) {
    return new PreguntaDeOpciones({
      clave: autor.nombre,
      instruccion: "Sitúa al autor en su corriente",
      enunciado: `¿A qué corriente pertenece <span class="juego-destacado">${Texto.escapar(autor.nombre)}</span>?`,
      opciones: Texto.mezclar([mov.nombre, ...this._otrasCorrientes(mov)]),
      correcta: mov.nombre,
      explicacion: `${autor.nombre} pertenece al ${mov.nombre}, que se sitúa en ${mov.periodo}.`
    });
  }

  _deQueCorrienteEsEsteRasgo(mov) {
    if (!(mov.rasgos || []).length) return null;
    const rasgo = Texto.alAzar(mov.rasgos);
    return new PreguntaDeOpciones({
      clave: rasgo,
      instruccion: "Reconoce la corriente por su rasgo",
      enunciado: `¿De qué corriente es propio esto?<br><span class="juego-destacado">${Texto.escapar(rasgo)}</span>`,
      opciones: Texto.mezclar([mov.nombre, ...this._otrasCorrientes(mov)]),
      correcta: mov.nombre,
      explicacion: `Es un rasgo del ${mov.nombre} (${mov.periodo}). ${mov.comoReconocerlo || ""}`
    });
  }
}
