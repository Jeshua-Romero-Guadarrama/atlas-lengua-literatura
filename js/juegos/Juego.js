/* ============================================================
   Juego y Partida
   ------------------------------------------------------------
   Juego es la clase base de los siete juegos: guarda su nombre y
   su icono, y sabe generar preguntas. Partida lleva la cuenta de
   los aciertos, la racha y los fallos de una ronda.
   ============================================================ */

export class Juego {
  constructor({ id, nombre, descripcion, icono, insignia }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.icono = icono;
    this.insignia = insignia;
  }

  /* Las subclases devuelven un arreglo de objetos Pregunta */
  generar(cuantas) { return []; }

  /* Un juego está disponible si tiene con qué generar al menos una pregunta */
  get disponible() {
    try { return this.generar(1).length > 0; } catch (e) { return false; }
  }

  /* Ayuda para no repetir preguntas dentro de una misma ronda */
  static sinRepetir(preguntas, nueva) {
    return !preguntas.some((p) => p.clave === nueva.clave);
  }
}

export class Partida {
  static get PREGUNTAS() { return 10; }

  constructor(juego) {
    this.juego = juego;
    this.preguntas = juego.generar(Partida.PREGUNTAS);
    this.indice = 0;
    this.aciertos = 0;
    this.racha = 0;
    this.mejorRacha = 0;
    this.fallos = [];
  }

  get valida() { return this.preguntas.length > 0; }
  get total() { return this.preguntas.length; }
  get actual() { return this.preguntas[this.indice]; }
  get numero() { return this.indice + 1; }
  get terminada() { return this.indice >= this.total; }
  get avance() { return (this.indice / this.total) * 100; }
  get avanceTrasResponder() { return ((this.indice + 1) / this.total) * 100; }
  get porcentaje() { return Math.round((this.aciertos / this.total) * 100); }
  get hayMasPreguntas() { return this.indice + 1 < this.total; }

  registrar(acierto) {
    if (acierto) {
      this.aciertos++;
      this.racha++;
      this.mejorRacha = Math.max(this.mejorRacha, this.racha);
    } else {
      this.racha = 0;
      this.fallos.push(this.actual);
    }
  }

  avanzar() { this.indice++; }

  get mensajeFinal() {
    const pct = this.porcentaje;
    if (pct === 100) return "Perfecto. Dominas este tema.";
    if (pct >= 80) return "Muy bien. Solo faltan los detalles.";
    if (pct >= 60) return "Bien encaminado. Repasa lo que falló y vuelve a intentarlo.";
    return "Toca repasar el temario antes de volver. No pasa nada, para eso está.";
  }

  get fraseDeRacha() {
    const n = this.mejorRacha;
    return `Tu mejor racha fue de ${n} ${n === 1 ? "acierto" : "aciertos"} seguidos.`;
  }
}
