/* ============================================================
   Conjugacion
   ------------------------------------------------------------
   El resultado de conjugar un verbo. Guarda las formas ya
   calculadas y ofrece las consultas que necesitan la vista del
   conjugador, el analizador y el juego de tiempos verbales.
   ============================================================ */

import { ModelosVerbales } from "./ModelosVerbales.js";

export class Conjugacion {
  constructor(datos) {
    this.infinitivo = datos.infinitivo;
    this.raiz = datos.raiz;
    this.modelo = datos.modelo;                  // ar, er o ir
    this.pronominal = datos.pronominal;
    this.rasgos = datos.rasgos;
    this.ortografia = datos.ortografia;
    this.gerundio = datos.gerundio;
    this.participio = datos.participio;
    this.participiosDobles = datos.participiosDobles || null;
    this.irregularidad = datos.irregularidad;
    this.tiempos = datos.tiempos;                // { idTiempo: [seis formas] }
  }

  get conjugacion() {
    return { ar: "primera (verbos en ar)", er: "segunda (verbos en er)", ir: "tercera (verbos en ir)" }[this.modelo];
  }

  get esIrregular() {
    return this.rasgos.esIrregular || Boolean(this.ortografia.tipo) ||
      this.ortografia.uir || Boolean(this.ortografia.vocalDeHiato);
  }

  get verboBase() {
    const base = this.rasgos.verboBase;
    return base && base !== this.infinitivo.replace(/se$/, "") ? base : null;
  }

  get esImpersonal() { return this.rasgos.impersonal; }

  get infinitivoCompuesto() { return `haber ${this.participio}`; }
  get gerundioCompuesto() { return `habiendo ${this.participio}`; }

  /* Una forma concreta: conjugacion.forma("preterito", 2) */
  forma(idTiempo, persona) {
    const filas = this.tiempos[idTiempo];
    return filas ? filas[persona] : null;
  }

  /* Todas las formas de un tiempo, emparejadas con su persona */
  filasDe(idTiempo) {
    const tiempo = ModelosVerbales.tiempo(idTiempo);
    const personas = tiempo && tiempo.modo === "Imperativo"
      ? ModelosVerbales.PERSONAS_IMPERATIVO
      : ModelosVerbales.PERSONAS;
    return (this.tiempos[idTiempo] || [])
      .map((forma, i) => ({ persona: personas[i], forma }))
      .filter((f) => f.forma);
  }

  /* Las formas no personales, para la cabecera de la ficha */
  get formasNoPersonales() {
    return [
      { nombre: "Infinitivo", forma: this.infinitivo },
      { nombre: "Gerundio", forma: this.gerundio },
      { nombre: "Participio", forma: this.participiosDobles ? this.participiosDobles.join(" o ") : this.participio },
      { nombre: "Infinitivo compuesto", forma: this.infinitivoCompuesto },
      { nombre: "Gerundio compuesto", forma: this.gerundioCompuesto }
    ];
  }

  /* Recorre todas las formas simples, que es lo que indexa el buscador inverso */
  *formasSimples() {
    for (const tiempo of ModelosVerbales.TIEMPOS) {
      if (tiempo.esCompuesto || tiempo.id === "imperativoNegativo") continue;
      const filas = this.tiempos[tiempo.id] || [];
      for (let i = 0; i < filas.length; i++) {
        if (filas[i]) yield { forma: filas[i], tiempo: tiempo.id, persona: i, modo: tiempo.modo };
      }
    }
  }
}
