/* ============================================================
   ModelosVerbales
   ------------------------------------------------------------
   Las tablas fijas del sistema verbal español: los nombres de
   los tiempos, las personas y las terminaciones regulares de
   las tres conjugaciones. No contiene lógica, solo datos.
   ============================================================ */

class Tiempo {
  constructor({ id, modo, nombre, alias, compuesto }) {
    this.id = id;
    this.modo = modo;
    this.nombre = nombre;
    this.alias = alias;                 // nomenclatura de Bello, la usada en México
    this.compuesto = compuesto || null; // tiempo de haber del que se forma
  }

  get esCompuesto() { return Boolean(this.compuesto); }

  get nombreLargo() {
    return `${this.nombre} de ${this.modo.toLowerCase()}`;
  }

  get nombreConAlias() {
    return `${this.nombre} (${this.alias})`;
  }
}

export class ModelosVerbales {
  static get PERSONAS() {
    return ["yo", "tú", "él, ella, usted", "nosotros, nosotras",
      "vosotros, vosotras", "ellos, ellas, ustedes"];
  }

  static get PERSONAS_CORTAS() {
    return ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];
  }

  static get PERSONAS_IMPERATIVO() {
    return ["", "tú", "usted", "nosotros", "vosotros", "ustedes"];
  }

  static get PERSONAS_DESCRITAS() {
    return ["primera persona del singular", "segunda persona del singular",
      "tercera persona del singular", "primera persona del plural",
      "segunda persona del plural", "tercera persona del plural"];
  }

  /* Los dieciocho tiempos, con su nombre académico y el de Bello */
  static get TIEMPOS() {
    if (!ModelosVerbales._tiempos) {
      ModelosVerbales._tiempos = [
        { id: "presenteIndicativo", modo: "Indicativo", nombre: "Presente", alias: "presente" },
        { id: "copreterito", modo: "Indicativo", nombre: "Pretérito imperfecto", alias: "copretérito" },
        { id: "preterito", modo: "Indicativo", nombre: "Pretérito perfecto simple", alias: "pretérito" },
        { id: "futuro", modo: "Indicativo", nombre: "Futuro simple", alias: "futuro" },
        { id: "pospreterito", modo: "Indicativo", nombre: "Condicional simple", alias: "pospretérito" },
        { id: "antepresente", modo: "Indicativo", nombre: "Pretérito perfecto compuesto", alias: "antepresente", compuesto: "presenteIndicativo" },
        { id: "antecopreterito", modo: "Indicativo", nombre: "Pretérito pluscuamperfecto", alias: "antecopretérito", compuesto: "copreterito" },
        { id: "antepreterito", modo: "Indicativo", nombre: "Pretérito anterior", alias: "antepretérito", compuesto: "preterito" },
        { id: "antefuturo", modo: "Indicativo", nombre: "Futuro compuesto", alias: "antefuturo", compuesto: "futuro" },
        { id: "antepospreterito", modo: "Indicativo", nombre: "Condicional compuesto", alias: "antepospretérito", compuesto: "pospreterito" },

        { id: "presenteSubjuntivo", modo: "Subjuntivo", nombre: "Presente", alias: "presente" },
        { id: "preteritoSubjuntivoRa", modo: "Subjuntivo", nombre: "Pretérito imperfecto en ra", alias: "pretérito" },
        { id: "preteritoSubjuntivoSe", modo: "Subjuntivo", nombre: "Pretérito imperfecto en se", alias: "pretérito" },
        { id: "futuroSubjuntivo", modo: "Subjuntivo", nombre: "Futuro simple", alias: "futuro, hoy en desuso" },
        { id: "antepresenteSubjuntivo", modo: "Subjuntivo", nombre: "Pretérito perfecto compuesto", alias: "antepresente", compuesto: "presenteSubjuntivo" },
        { id: "antepreteritoSubjuntivo", modo: "Subjuntivo", nombre: "Pretérito pluscuamperfecto", alias: "antepretérito", compuesto: "preteritoSubjuntivoRa" },

        { id: "imperativoAfirmativo", modo: "Imperativo", nombre: "Afirmativo", alias: "mandato" },
        { id: "imperativoNegativo", modo: "Imperativo", nombre: "Negativo", alias: "prohibición" }
      ].map((t) => new Tiempo(t));
    }
    return ModelosVerbales._tiempos;
  }

  static tiempo(id) {
    if (!ModelosVerbales._porId) {
      ModelosVerbales._porId = {};
      ModelosVerbales.TIEMPOS.forEach((t) => { ModelosVerbales._porId[t.id] = t; });
    }
    return ModelosVerbales._porId[id] || null;
  }

  static tiemposDelModo(modo) {
    return ModelosVerbales.TIEMPOS.filter((t) => t.modo === modo);
  }

  static get MODOS() { return ["Indicativo", "Subjuntivo", "Imperativo"]; }

  /* Terminaciones regulares de las tres conjugaciones */
  static get TERMINACIONES() {
    return {
      ar: {
        presenteIndicativo: ["o", "as", "a", "amos", "áis", "an"],
        copreterito: ["aba", "abas", "aba", "ábamos", "abais", "aban"],
        preterito: ["é", "aste", "ó", "amos", "asteis", "aron"],
        presenteSubjuntivo: ["e", "es", "e", "emos", "éis", "en"],
        preteritoSubjuntivoRa: ["ara", "aras", "ara", "áramos", "arais", "aran"],
        preteritoSubjuntivoSe: ["ase", "ases", "ase", "ásemos", "aseis", "asen"],
        futuroSubjuntivo: ["are", "ares", "are", "áremos", "areis", "aren"],
        gerundio: "ando", participio: "ado", imperativoTu: "a", imperativoVosotros: "ad"
      },
      er: {
        presenteIndicativo: ["o", "es", "e", "emos", "éis", "en"],
        copreterito: ["ía", "ías", "ía", "íamos", "íais", "ían"],
        preterito: ["í", "iste", "ió", "imos", "isteis", "ieron"],
        presenteSubjuntivo: ["a", "as", "a", "amos", "áis", "an"],
        preteritoSubjuntivoRa: ["iera", "ieras", "iera", "iéramos", "ierais", "ieran"],
        preteritoSubjuntivoSe: ["iese", "ieses", "iese", "iésemos", "ieseis", "iesen"],
        futuroSubjuntivo: ["iere", "ieres", "iere", "iéremos", "iereis", "ieren"],
        gerundio: "iendo", participio: "ido", imperativoTu: "e", imperativoVosotros: "ed"
      },
      ir: {
        presenteIndicativo: ["o", "es", "e", "imos", "ís", "en"],
        copreterito: ["ía", "ías", "ía", "íamos", "íais", "ían"],
        preterito: ["í", "iste", "ió", "imos", "isteis", "ieron"],
        presenteSubjuntivo: ["a", "as", "a", "amos", "áis", "an"],
        preteritoSubjuntivoRa: ["iera", "ieras", "iera", "iéramos", "ierais", "ieran"],
        preteritoSubjuntivoSe: ["iese", "ieses", "iese", "iésemos", "ieseis", "iesen"],
        futuroSubjuntivo: ["iere", "ieres", "iere", "iéremos", "iereis", "ieren"],
        gerundio: "iendo", participio: "ido", imperativoTu: "e", imperativoVosotros: "id"
      }
    };
  }

  static get FUTURO() { return ["é", "ás", "á", "emos", "éis", "án"]; }
  static get POSPRETERITO() { return ["ía", "ías", "ía", "íamos", "íais", "ían"]; }

  /* Terminaciones del pretérito fuerte, iguales en las tres conjugaciones */
  static get PRETERITO_FUERTE() { return ["e", "iste", "o", "imos", "isteis", "ieron"]; }

  /* Formas de haber, que sirven para todos los tiempos compuestos */
  static get HABER() {
    return {
      presenteIndicativo: ["he", "has", "ha", "hemos", "habéis", "han"],
      copreterito: ["había", "habías", "había", "habíamos", "habíais", "habían"],
      preterito: ["hube", "hubiste", "hubo", "hubimos", "hubisteis", "hubieron"],
      futuro: ["habré", "habrás", "habrá", "habremos", "habréis", "habrán"],
      pospreterito: ["habría", "habrías", "habría", "habríamos", "habríais", "habrían"],
      presenteSubjuntivo: ["haya", "hayas", "haya", "hayamos", "hayáis", "hayan"],
      preteritoSubjuntivoRa: ["hubiera", "hubieras", "hubiera", "hubiéramos", "hubierais", "hubieran"]
    };
  }

  static get PRONOMBRES_REFLEXIVOS() { return ["me", "te", "se", "nos", "os", "se"]; }

  /* Verbos en iar y en uar cuya vocal se acentúa en las formas fuertes */
  static get HIATO_IAR() {
    return new Set(["enviar", "confiar", "guiar", "variar", "ampliar", "criar", "desviar",
      "espiar", "esquiar", "fiar", "liar", "resfriar", "vaciar", "averiar", "aliar", "rociar",
      "chirriar", "piar", "contrariar", "enfriar", "fotografiar", "telegrafiar", "malcriar", "extasiar"]);
  }

  static get HIATO_UAR() {
    return new Set(["continuar", "actuar", "situar", "evaluar", "graduar", "acentuar",
      "insinuar", "efectuar", "habituar", "atenuar", "perpetuar", "valuar", "puntuar",
      "exceptuar", "devaluar", "individuar"]);
  }

  /* Verbos en cer y en cir que no toman zc en la primera persona */
  static get SIN_ZC() {
    return new Set(["cocer", "escocer", "recocer", "hacer", "decir", "mecer", "vencer",
      "convencer", "ejercer", "torcer", "retorcer", "esparcir", "zurcir", "fruncir",
      "uncir", "resarcir"]);
  }
}
