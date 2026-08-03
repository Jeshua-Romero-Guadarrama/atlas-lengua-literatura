/* ============================================================
   IndiceVerbal
   ------------------------------------------------------------
   Buscador inverso: dada una palabra escrita, dice de qué verbo,
   tiempo y persona podría ser. Lo usa el analizador para
   etiquetar las formas verbales de una oración.

   Cuando la palabra no está indexada, se acepta solo si su
   terminación es inequívocamente verbal, y esa lectura se marca
   como aproximada para que pese menos en la desambiguación.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { ModelosVerbales } from "./ModelosVerbales.js";

class LecturaVerbal {
  constructor({ infinitivo, tiempo, persona, modo, aproximado }) {
    this.infinitivo = infinitivo || null;
    this.tiempo = tiempo;
    this.persona = persona;
    this.modo = modo;
    this.aproximado = Boolean(aproximado);
  }

  get esNoPersonal() {
    return ["infinitivo", "gerundio", "participio"].includes(this.tiempo);
  }

  get nombreDelTiempo() {
    if (this.esNoPersonal) return Texto.mayuscula(this.tiempo);
    const t = ModelosVerbales.tiempo(this.tiempo);
    return t ? t.nombreLargo : this.tiempo;
  }

  get nombreDeLaPersona() {
    return ModelosVerbales.PERSONAS_DESCRITAS[this.persona] || "";
  }
}

export class IndiceVerbal {
  constructor(conjugador) {
    this.conjugador = conjugador;
    this.mapa = new Map();
  }

  /* Terminaciones que solo pueden pertenecer a un verbo */
  static get TERMINACIONES_SEGURAS() {
    return [
      { re: /(aba|abas|ábamos|abais|aban)$/, tiempo: "copreterito" },
      { re: /(ía|ías|íamos|íais|ían)$/, tiempo: "copreterito" },
      { re: /(aste|asteis|aron)$/, tiempo: "preterito" },
      { re: /(iste|isteis|ieron)$/, tiempo: "preterito" },
      { re: /(aré|arás|ará|aremos|aréis|arán)$/, tiempo: "futuro" },
      { re: /(eré|erás|erá|eremos|eréis|erán|iré|irás|irá|iremos|iréis|irán)$/, tiempo: "futuro" },
      { re: /(aría|arías|aríamos|aríais|arían)$/, tiempo: "pospreterito" },
      { re: /(ería|erías|eríamos|erían|iría|irías|iríamos|irían)$/, tiempo: "pospreterito" },
      { re: /(ando)$/, tiempo: "gerundio" },
      { re: /(iendo|yendo)$/, tiempo: "gerundio" },
      { re: /(ara|aras|áramos|arais|aran|ase|ases|ásemos|aseis|asen)$/, tiempo: "preteritoSubjuntivoRa" },
      { re: /(iera|ieras|iéramos|ierais|ieran|iese|ieses|iésemos|ieseis|iesen)$/, tiempo: "preteritoSubjuntivoRa" },
      { re: /(amos|emos|imos)$/, tiempo: "presenteIndicativo" },
      { re: /(áis|éis|ís)$/, tiempo: "presenteIndicativo" }
    ];
  }

  /* Construye el índice a partir de una lista de infinitivos */
  construir(infinitivos) {
    this.mapa.clear();
    const lista = [...new Set([...(infinitivos || []), ...this.conjugador.vocabulario])];

    lista.forEach((inf) => {
      const c = this.conjugador.conjugar(inf);
      if (!c) return;
      for (const { forma, tiempo, persona, modo } of c.formasSimples()) {
        this._anotar(forma, { infinitivo: c.infinitivo, tiempo, persona, modo });
      }
      this._anotar(c.infinitivo, { infinitivo: c.infinitivo, tiempo: "infinitivo", persona: -1, modo: "No personal" });
      this._anotar(c.gerundio, { infinitivo: c.infinitivo, tiempo: "gerundio", persona: -1, modo: "No personal" });
      this._anotar(c.participio, { infinitivo: c.infinitivo, tiempo: "participio", persona: -1, modo: "No personal" });

      // El participio concuerda cuando funciona como adjetivo
      if (/o$/.test(c.participio)) {
        ["a", "os", "as"].forEach((fin) => {
          this._anotar(c.participio.slice(0, -1) + fin,
            { infinitivo: c.infinitivo, tiempo: "participio", persona: -1, modo: "No personal" });
        });
      }
    });

    // Hay es la forma impersonal del presente de haber y no sale del paradigma
    this._anotar("hay", { infinitivo: "haber", tiempo: "presenteIndicativo", persona: 2, modo: "Indicativo" });
    return this;
  }

  _anotar(forma, datos) {
    if (!forma) return;
    const clave = forma.toLowerCase();
    if (!this.mapa.has(clave)) this.mapa.set(clave, []);
    const lista = this.mapa.get(clave);
    const repetida = lista.some((d) =>
      d.infinitivo === datos.infinitivo && d.tiempo === datos.tiempo && d.persona === datos.persona);
    if (!repetida) lista.push(new LecturaVerbal(datos));
  }

  /* Devuelve todas las lecturas verbales posibles de una palabra */
  reconocer(palabra) {
    const p = (palabra || "").toLowerCase();
    if (!p) return [];
    if (this.mapa.has(p)) return this.mapa.get(p).slice();

    for (const regla of IndiceVerbal.TERMINACIONES_SEGURAS) {
      if (regla.re.test(p) && p.length >= 5) {
        return [new LecturaVerbal({ tiempo: regla.tiempo, persona: -1, modo: "Indicativo", aproximado: true })];
      }
    }
    return [];
  }

  get tamano() { return this.mapa.size; }
}
