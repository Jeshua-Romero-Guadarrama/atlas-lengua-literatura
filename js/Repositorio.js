/* ============================================================
   Repositorio
   ------------------------------------------------------------
   Único punto por el que entran los datos. Pide cada colección a
   la API y, si no hay servidor, cae a los archivos de la carpeta
   data. Así el resto de la aplicación no sabe ni le importa de
   dónde vienen las cosas.
   ============================================================ */

export class Repositorio {
  /* Colecciones de contenido, con su ruta en la API y su archivo */
  static get COLECCIONES() {
    return ["fichas", "figuras", "normas", "movimientos", "glosario", "temas", "ejercicios"];
  }

  /* Archivos que alimentan el motor lingüístico y no son contenido */
  static get MOTOR() { return ["lexico", "verbos"]; }

  constructor() {
    this.contenido = {};
    this.motor = {};
    this.origen = "archivos locales";
  }

  async cargar() {
    const peticiones = Repositorio.COLECCIONES.map((n) => this._pedir(`/api/${n}`, `data/${n}.json`));
    const delMotor = Repositorio.MOTOR.map((n) => this._pedir(null, `data/${n}.json`));
    const estado = fetch("/api/estado").then((r) => r.json()).catch(() => null);

    const [datos, motor, info] = await Promise.all([
      Promise.all(peticiones), Promise.all(delMotor), estado
    ]);

    Repositorio.COLECCIONES.forEach((n, i) => { this.contenido[n] = datos[i] || []; });
    Repositorio.MOTOR.forEach((n, i) => { this.motor[n] = Repositorio._objeto(motor[i]); });
    if (info && info.origen === "mongodb") this.origen = "MongoDB";
    return this;
  }

  async _pedir(url, respaldo) {
    if (url) {
      try {
        const r = await fetch(url);
        if (r.ok) return await r.json();
      } catch (e) { /* se intenta con el archivo */ }
    }
    try {
      const r = await fetch(respaldo);
      if (r.ok) return await r.json();
    } catch (e) { /* la colección se queda vacía */ }
    return [];
  }

  /* Algunas colecciones son un solo objeto guardado dentro de un arreglo,
     porque MongoDB necesita documentos y no valores sueltos */
  static _objeto(dato) {
    if (Array.isArray(dato)) return dato[0] || {};
    return dato || {};
  }

  get fichas() { return this.contenido.fichas || []; }
  get figuras() { return this.contenido.figuras || []; }
  get normas() { return this.contenido.normas || []; }
  get movimientos() { return this.contenido.movimientos || []; }
  get glosario() { return this.contenido.glosario || []; }
  get temas() { return this.contenido.temas || []; }
  get ejercicios() { return Repositorio._objeto(this.contenido.ejercicios); }
  get lexico() { return this.motor.lexico || {}; }
  get verbos() { return this.motor.verbos || {}; }

  /* Resumen para el pie de página */
  get resumen() {
    return `${this.fichas.length} fichas · ${this.figuras.length} figuras · ` +
      `${this.normas.length} normas · ${this.movimientos.length} corrientes · ` +
      `${this.glosario.length} términos · ${this.temas.length} temas · datos desde ${this.origen}`;
  }

  /* Cifras de la portada */
  get metricas() {
    const areas = new Set(this.fichas.map((f) => f.area)).size;
    return [
      ["temario", this.fichas.length, "fichas"],
      ["nivel", areas, "áreas"],
      ["figuras", this.figuras.length, "figuras"],
      ["ortografia", this.normas.length, "normas"],
      ["literatura", this.movimientos.length, "corrientes"],
      ["glosario", this.glosario.length, "términos"]
    ].filter((m) => m[1] > 0);
  }
}
