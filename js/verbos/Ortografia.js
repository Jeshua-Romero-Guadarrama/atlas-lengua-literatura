/* ============================================================
   OrtografiaVerbal
   ------------------------------------------------------------
   Los cambios de escritura que exige unir una raíz con una
   terminación. No cambian el sonido del verbo, solo la forma de
   escribirlo: buscar da busqué, llegar da llegué, construir da
   construyo, leer da leyó.

   Se separa del conjugador porque es un asunto puramente
   ortográfico y se puede probar por sí solo.
   ============================================================ */

import { ModelosVerbales } from "./ModelosVerbales.js";

export class OrtografiaVerbal {
  constructor(infinitivo) {
    this.infinitivo = infinitivo;
    this.tipo = OrtografiaVerbal._tipoDe(infinitivo);
    this.uir = /uir$/.test(infinitivo) && !/(guir|quir)$/.test(infinitivo);
    this.pierdeI = /(ñer|ñir|ller|llir)$/.test(infinitivo);
    const raiz = infinitivo.slice(0, -2);
    this.raizVocalica = !this.uir && /[aeoáéó]$/.test(raiz);
  }

  static _tipoDe(inf) {
    if (/car$/.test(inf)) return "car";
    if (/gar$/.test(inf)) return "gar";
    if (/zar$/.test(inf)) return "zar";
    if (/guar$/.test(inf)) return "guar";
    if (/guir$/.test(inf)) return "guir";
    if (/quir$/.test(inf)) return "quir";
    if (/(ger|gir)$/.test(inf)) return "ger";
    if (/(cer|cir)$/.test(inf) && ModelosVerbales.SIN_ZC.has(inf)) return "cerZ";
    return null;
  }

  /* Une una raíz con una terminación aplicando los ajustes que toquen */
  unir(raiz, terminacion) {
    const t = terminacion;
    const inicial = t[0];
    const aOu = "aáoó".includes(inicial);
    const eOi = "eéií".includes(inicial);

    // Verbos en uir: se intercala una y (construyo, construyó)
    if (this.uir) {
      if (inicial === "i" && t.length > 1 && "aeouáéó".includes(t[1])) return raiz + "y" + t.slice(1);
      if ("aeoáéó".includes(inicial)) return raiz + "y" + t;
      return raiz + t;
    }

    // Raíz terminada en vocal (leer, caer, oír): la i átona se vuelve y,
    // y la i tónica de las demás formas toma tilde por hiato
    if (this.raizVocalica && inicial === "i") {
      if (t.length > 1 && "aeouáéó".includes(t[1])) return raiz + "y" + t.slice(1);
      return raiz + "í" + t.slice(1);
    }

    // Verbos en ñer, ñir y llir: la i de la terminación se pierde
    if (this.pierdeI && inicial === "i" && t.length > 1 && "aeoáéó".includes(t[1])) {
      return raiz + t.slice(1);
    }

    if (eOi) {
      if (this.tipo === "car" && raiz.endsWith("c")) return raiz.slice(0, -1) + "qu" + t;
      if (this.tipo === "gar" && raiz.endsWith("g")) return raiz + "u" + t;
      if (this.tipo === "zar" && raiz.endsWith("z")) return raiz.slice(0, -1) + "c" + t;
      if (this.tipo === "guar" && raiz.endsWith("gu")) return raiz.slice(0, -2) + "gü" + t;
    }
    if (aOu) {
      if (this.tipo === "ger" && raiz.endsWith("g")) return raiz.slice(0, -1) + "j" + t;
      if (this.tipo === "guir" && raiz.endsWith("gu")) return raiz.slice(0, -2) + "g" + t;
      if (this.tipo === "quir" && raiz.endsWith("qu")) return raiz.slice(0, -2) + "c" + t;
      if (this.tipo === "cerZ" && raiz.endsWith("c")) return raiz.slice(0, -1) + "z" + t;
    }
    return raiz + t;
  }

  /* ¿El verbo intercala zc en la primera persona? (conozco, conduzco) */
  get tomaZc() {
    return /(acer|ecer|ocer|ucer|ucir)$/.test(this.infinitivo) &&
      !ModelosVerbales.SIN_ZC.has(this.infinitivo);
  }

  /* ¿La vocal de la raíz se acentúa en las formas fuertes? (envío, continúo) */
  get vocalDeHiato() {
    if (ModelosVerbales.HIATO_IAR.has(this.infinitivo)) return "i";
    if (ModelosVerbales.HIATO_UAR.has(this.infinitivo)) return "u";
    return null;
  }
}
