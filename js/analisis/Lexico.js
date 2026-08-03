/* ============================================================
   Lexico
   ------------------------------------------------------------
   Envuelve el archivo data/lexico.json y responde las preguntas
   que le hace el etiquetador: a qué clase cerrada pertenece una
   palabra, si es un adjetivo o un sustantivo conocido, si un
   verbo exige cierta preposición, y si un sustantivo nombra un
   lugar, un momento o un ser animado.
   ============================================================ */

export class Lexico {
  constructor(datos = {}) {
    this.datos = datos;
    this.preposiciones = Lexico._conjunto(datos.preposiciones);
    this.interjecciones = Lexico._conjunto(datos.interjecciones);
    this.adjetivos = Lexico._conjunto(datos.adjetivos);
    this.sustantivos = Lexico._conjunto(datos.sustantivos);
    this.copulativos = Lexico._conjunto(datos.verbosCopulativos);
    this.verbosDeLengua = Lexico._conjunto(datos.verbosDeLengua);
    this.sustantivosDeTiempo = Lexico._conjunto(datos.sustantivosDeTiempo);
    this.sustantivosDeLugar = Lexico._conjunto(datos.sustantivosDeLugar);
    this.regimen = datos.regimenPreposicional || {};
    this.verbos = datos.verbos || [];

    this.grupos = {
      determinantes: Lexico._mapa(datos.determinantes),
      pronombres: Lexico._mapa(datos.pronombres),
      adverbios: Lexico._mapa(datos.adverbios),
      conjunciones: Lexico._mapa(datos.conjunciones)
    };
  }

  static _conjunto(lista) {
    return new Set((lista || []).map((p) => p.toLowerCase()));
  }

  static _mapa(objeto) {
    const salida = {};
    Object.keys(objeto || {}).forEach((k) => { salida[k] = Lexico._conjunto(objeto[k]); });
    return salida;
  }

  /* Todos los subtipos de un grupo a los que pertenece una palabra */
  subtiposDe(grupo, palabra) {
    const mapa = this.grupos[grupo] || {};
    return Object.keys(mapa).filter((k) => mapa[k].has(palabra));
  }

  esPreposicion(p) { return this.preposiciones.has(p); }
  esInterjeccion(p) { return this.interjecciones.has(p); }
  esAdjetivo(p) { return this.adjetivos.has(p); }
  esSustantivo(p) { return this.sustantivos.has(p); }
  esCopulativo(infinitivo) { return this.copulativos.has(infinitivo); }

  esTemporal(nucleo) { return this.sustantivosDeTiempo.has((nucleo || "").toLowerCase()); }
  esLocativo(nucleo) { return this.sustantivosDeLugar.has((nucleo || "").toLowerCase()); }

  /* Preposiciones que exige un verbo, como pensar en o confiar en */
  regimenDe(infinitivo) {
    return this.regimen[infinitivo] || [];
  }

  /* Nombres de seres vivos, que deciden si a introduce objeto o compañía */
  static get ANIMADOS() {
    return new Set(["hombre", "mujer", "niño", "niña", "persona", "gente", "amigo", "amiga",
      "padre", "madre", "hijo", "hija", "hermano", "hermana", "maestro", "maestra",
      "profesor", "profesora", "alumno", "alumna", "estudiante", "vecino", "compañero",
      "abuelo", "abuela", "tío", "tía", "primo", "prima", "perro", "gato", "señor",
      "señora", "chico", "chica", "muchacho", "muchacha", "doctor", "rey", "reina", "público"]);
  }

  esAnimado(nucleo) {
    if (!nucleo) return false;
    const n = nucleo.toLowerCase();
    const base = n.replace(/(es|s)$/, "");
    return [...Lexico.ANIMADOS].some((a) => n === a || base === a || n === a + "s" || n === a + "es");
  }

  /* Nombres de cualidad o de sentimiento, que con la preposición con
     dan circunstancial de modo y no de instrumento */
  esAbstracto(nucleo) {
    const n = (nucleo || "").toLowerCase();
    if (!n) return false;
    if (/(ción|sión|dad|tad|tud|umbre|eza|ez|ancia|encia|anza|ismo|ía|or)$/.test(n)) return true;
    return ["cuidado", "cariño", "gusto", "prisa", "calma", "miedo", "amor", "odio", "gracia",
      "fuerza", "empeño", "esmero", "respeto", "atención", "paciencia"].includes(n);
  }

  /* Nombres legibles de los subtipos que vienen en clave del archivo */
  static get NOMBRES_SUBTIPO() {
    return {
      articuloDeterminado: "artículo determinado",
      articuloIndeterminado: "artículo indeterminado",
      numeralCardinal: "numeral cardinal",
      numeralOrdinal: "numeral ordinal",
      numeralPartitivo: "numeral partitivo",
      numeralMultiplicativo: "numeral multiplicativo",
      personalTonico: "personal tónico",
      personalAtono: "personal átono",
      afirmacion: "afirmación",
      negacion: "negación"
    };
  }

  static nombreSubtipo(clave) {
    return Lexico.NOMBRES_SUBTIPO[clave] || clave;
  }

  /* Los adverbios interrogativos y relativos no nombran su propio
     significado: dónde pregunta por el lugar y cuándo por el tiempo */
  static get SEMANTICA_ADVERBIO() {
    return {
      "dónde": "lugar", "adónde": "lugar", donde: "lugar", adonde: "lugar",
      "cuándo": "tiempo", cuando: "tiempo", "cómo": "modo", como: "modo",
      "cuánto": "cantidad", cuanto: "cantidad", "cuán": "cantidad"
    };
  }
}
