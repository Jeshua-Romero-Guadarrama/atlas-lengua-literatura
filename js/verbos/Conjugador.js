/* ============================================================
   Conjugador
   ------------------------------------------------------------
   Construye la conjugación completa de un verbo. Parte de los
   modelos regulares, aplica los cambios ortográficos y encima
   los rasgos de irregularidad.

   Se usa así:
       const conjugador = new Conjugador(datosDeVerbos);
       const c = conjugador.conjugar("mantener");
   ============================================================ */

import { Conjugacion } from "./Conjugacion.js";
import { ModelosVerbales } from "./ModelosVerbales.js";
import { OrtografiaVerbal } from "./Ortografia.js";
import { RasgosVerbales } from "./RasgosVerbales.js";

export class Conjugador {
  constructor(datos = {}) {
    this.irregulares = datos.irregulares || {};
    this.participiosDobles = datos.participiosDobles || {};
    this.verbosFrecuentes = datos.verbosFrecuentes || [];
    this.cache = new Map();
  }

  /* Lista de infinitivos que conviene tener indexados */
  get vocabulario() {
    return [...new Set([...this.verbosFrecuentes, ...Object.keys(this.irregulares)])];
  }

  conjugar(entrada) {
    const clave = (entrada || "").toLowerCase().trim();
    if (this.cache.has(clave)) return this.cache.get(clave);
    const resultado = this._construir(clave);
    this.cache.set(clave, resultado);
    return resultado;
  }

  /* ------------------------------------------------------------
     Construcción
     ------------------------------------------------------------ */

  _construir(entrada) {
    let inf = (entrada || "").replace(/\s+/g, "");
    if (!inf) return null;

    const pronominal = /(ar|er|ir|ír)se$/.test(inf);
    if (pronominal) inf = inf.slice(0, -2);
    if (!/(ar|er|ir|ír)$/.test(inf)) return null;

    const modelo = /ar$/.test(inf) ? "ar" : (/er$/.test(inf) ? "er" : "ir");
    const raizBase = inf.slice(0, -2);
    const rasgos = RasgosVerbales.desde(inf, this.irregulares);
    // El verbo ir se queda sin raíz al quitarle la terminación, y no pasa
    // nada porque sustituye todos sus tiempos.
    if (!raizBase && !rasgos.formas) return null;

    const orto = new OrtografiaVerbal(inf);
    const term = ModelosVerbales.TERMINACIONES[modelo];
    const raices = this._raices(inf, raizBase, rasgos, orto, term);

    const tiempos = {};
    this._tiemposSimples(tiempos, term, raices, rasgos, orto);
    if (rasgos.formas) Object.assign(tiempos, rasgos.formas);
    this._imperativo(tiempos, term, raices, rasgos, orto);
    this._tiemposCompuestos(tiempos, raices.participio);
    if (pronominal) this._colocarPronombres(tiempos);

    return new Conjugacion({
      infinitivo: pronominal ? inf + "se" : inf,
      raiz: raizBase,
      modelo,
      pronominal,
      rasgos,
      ortografia: orto,
      gerundio: pronominal ? raices.gerundio + "se" : raices.gerundio,
      participio: raices.participio,
      participiosDobles: this.participiosDobles[inf] || null,
      irregularidad: rasgos.describir(orto, orto.vocalDeHiato, inf),
      tiempos
    });
  }

  /* Las distintas raíces que necesita la conjugación */
  _raices(inf, raizBase, rasgos, orto, term) {
    const hiato = orto.vocalDeHiato;

    // Formas fuertes: primera, segunda, tercera y sexta del presente
    let fuerte = raizBase;
    if (rasgos.diptongo) {
      const [de, a] = rasgos.cambioFuerte;
      fuerte = Conjugador._cambiarUltimaVocal(fuerte, de, a);
    } else if (hiato) {
      fuerte = Conjugador._cambiarUltimaVocal(fuerte, hiato, hiato === "i" ? "í" : "ú");
    }

    // Formas débiles de los verbos en ir: gerundio, tercera del pretérito
    let debil = raizBase;
    if (rasgos.debil) {
      const [de, a] = rasgos.cambioDebil;
      debil = Conjugador._cambiarUltimaVocal(debil, de, a);
    }

    // Primera persona del presente
    let primera;
    if (rasgos.yo) primera = rasgos.yo;
    else if (orto.tomaZc) primera = raizBase.slice(0, -1) + "zco";
    else primera = orto.unir(fuerte, term.presenteIndicativo[0]);

    // Raíz del presente de subjuntivo, cuando existe una propia
    let subjuntivo = null;
    if (rasgos.subj) subjuntivo = rasgos.subj;
    else if (rasgos.yo || orto.tomaZc) subjuntivo = primera.replace(/o$/, "");

    const futuro = rasgos.futuro || (/ír$/.test(inf) ? inf.replace(/ír$/, "ir") : inf);

    let gerundio = rasgos.gerundio || orto.unir(debil, term.gerundio);
    let participio = rasgos.participio || orto.unir(raizBase, term.participio);
    if (!rasgos.participio && orto.raizVocalica) participio = raizBase + "ído";

    return { base: raizBase, fuerte, debil, primera, subjuntivo, futuro, gerundio, participio };
  }

  _tiemposSimples(T, term, raices, rasgos, orto) {
    // Presente de indicativo
    T.presenteIndicativo = term.presenteIndicativo.map((t, i) => {
      if (i === 0) return raices.primera;
      const esFuerte = i === 1 || i === 2 || i === 5;
      return orto.unir(esFuerte ? raices.fuerte : raices.base, t);
    });

    T.copreterito = term.copreterito.map((t) => orto.unir(raices.base, t));

    // Pretérito, fuerte o regular
    if (rasgos.preterito) {
      const raiz = rasgos.preterito;
      const acabaEnJ = /j$/.test(raiz);
      T.preterito = ModelosVerbales.PRETERITO_FUERTE.map((t) =>
        acabaEnJ && t === "ieron" ? raiz + "eron" : raiz + t);
      if (raiz.endsWith("c")) T.preterito[2] = raiz.slice(0, -1) + "zo";   // hice da hizo
    } else {
      T.preterito = term.preterito.map((t, i) => {
        const usaDebil = (i === 2 || i === 5) && rasgos.debil;
        return orto.unir(usaDebil ? raices.debil : raices.base, t);
      });
    }

    T.futuro = ModelosVerbales.FUTURO.map((t) => raices.futuro + t);
    T.pospreterito = ModelosVerbales.POSPRETERITO.map((t) => raices.futuro + t);

    // Presente de subjuntivo
    T.presenteSubjuntivo = term.presenteSubjuntivo.map((t, i) => {
      if (raices.subjuntivo) return orto.unir(raices.subjuntivo, t);
      const esFuerte = i === 0 || i === 1 || i === 2 || i === 5;
      let raiz = esFuerte ? raices.fuerte : raices.base;
      if (!esFuerte && rasgos.debil) raiz = raices.debil;
      return orto.unir(raiz, t);
    });

    // Los subjuntivos de pretérito y de futuro salen de la tercera del pretérito
    const raizPreterito = rasgos.preterito || (rasgos.debil ? raices.debil : raices.base);
    const esFuerte = Boolean(rasgos.preterito);
    const quitaI = esFuerte && /j$/.test(raizPreterito);

    ["preteritoSubjuntivoRa", "preteritoSubjuntivoSe", "futuroSubjuntivo"].forEach((id) => {
      T[id] = term[id].map((t) => {
        if (esFuerte) return raizPreterito + (quitaI ? t.replace(/^i/, "") : t);
        return orto.unir(raizPreterito, t);
      });
    });
  }

  _imperativo(T, term, raices, rasgos, orto) {
    const tu = rasgos.imperativoTu || orto.unir(raices.fuerte, term.imperativoTu);
    T.imperativoAfirmativo = [
      "", tu, T.presenteSubjuntivo[2], T.presenteSubjuntivo[3],
      orto.unir(raices.base, term.imperativoVosotros), T.presenteSubjuntivo[5]
    ];
    T.imperativoNegativo = ["",
      "no " + T.presenteSubjuntivo[1], "no " + T.presenteSubjuntivo[2],
      "no " + T.presenteSubjuntivo[3], "no " + T.presenteSubjuntivo[4],
      "no " + T.presenteSubjuntivo[5]
    ];
  }

  _tiemposCompuestos(T, participio) {
    ModelosVerbales.TIEMPOS.filter((t) => t.esCompuesto).forEach((t) => {
      T[t.id] = ModelosVerbales.HABER[t.compuesto].map((h) => `${h} ${participio}`);
    });
  }

  /* Coloca el pronombre de los verbos pronominales donde le corresponde */
  _colocarPronombres(T) {
    const P = ModelosVerbales.PRONOMBRES_REFLEXIVOS;
    Object.keys(T).forEach((id) => {
      if (id === "imperativoAfirmativo") {
        T[id] = T[id].map((f, i) => {
          if (!f) return "";
          if (i === 3) return f.replace(/s$/, "") + "nos";     // sentémonos
          if (i === 4) return f.replace(/d$/, "") + "os";      // sentaos
          return f + P[i];                                     // siéntate, siéntese
        });
      } else if (id === "imperativoNegativo") {
        T[id] = T[id].map((f, i) => (f ? `no ${P[i]} ${f.replace(/^no /, "")}` : ""));
      } else {
        T[id] = T[id].map((f, i) => (f ? `${P[i]} ${f}` : ""));
      }
    });
  }

  static _cambiarUltimaVocal(raiz, de, a) {
    const i = raiz.lastIndexOf(de);
    return i === -1 ? raiz : raiz.slice(0, i) + a + raiz.slice(i + 1);
  }
}
