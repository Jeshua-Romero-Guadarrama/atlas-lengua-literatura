/* ============================================================
   RasgosVerbales
   ------------------------------------------------------------
   Reúne todo lo que un verbo tiene de irregular: el cambio
   vocálico, la primera persona propia, la raíz del pretérito
   fuerte, la del futuro, el participio, el gerundio y el
   imperativo.

   Sabe además resolver la herencia por prefijo, de modo que
   mantener recibe los rasgos de tener sin que haya que
   escribirlos en el archivo de datos.
   ============================================================ */

import { Acentuador } from "../nucleo/Acentuador.js";
import { Texto } from "../nucleo/Texto.js";
import { ModelosVerbales } from "./ModelosVerbales.js";

export class RasgosVerbales {
  constructor(datos = {}) {
    this.yo = datos.yo || null;
    this.subj = datos.subj || null;
    this.diptongo = datos.diptongo || null;
    this.debil = datos.debil || null;
    this.preterito = datos.preterito || null;
    this.futuro = datos.futuro || null;
    this.participio = datos.participio || null;
    this.gerundio = datos.gerundio || null;
    this.imperativoTu = datos.imperativoTu || null;
    this.formas = datos.formas || null;
    this.impersonal = Boolean(datos.impersonal);
    this.verboBase = datos._base || null;
    this.prefijo = datos._prefijo || "";
  }

  get esIrregular() {
    return Boolean(this.yo || this.subj || this.diptongo || this.debil ||
      this.preterito || this.futuro || this.participio || this.gerundio ||
      this.imperativoTu || this.formas);
  }

  /* Cambio vocálico de las formas fuertes, como e por ie */
  get cambioFuerte() {
    return this.diptongo ? this.diptongo.split(":") : null;
  }

  /* Cambio vocálico de las formas átonas de los verbos en ir */
  get cambioDebil() {
    return this.debil ? this.debil.split(":") : null;
  }

  /* ------------------------------------------------------------
     Resolución de los rasgos de un infinitivo
     ------------------------------------------------------------ */

  static desde(infinitivo, tablaIrregulares) {
    const irr = tablaIrregulares || {};

    if (irr[infinitivo]) {
      return new RasgosVerbales(Object.assign({}, irr[infinitivo], { _base: infinitivo, _prefijo: "" }));
    }

    const heredados = RasgosVerbales._heredar(infinitivo, irr);
    if (heredados) return heredados;

    // Verbos en ducir: pretérito fuerte en duj (conducir da conduje)
    if (/ducir$/.test(infinitivo)) {
      return new RasgosVerbales({ preterito: infinitivo.slice(0, -3) + "j", _base: infinitivo });
    }
    return new RasgosVerbales({});
  }

  /* Busca el verbo base más largo del que este pueda derivar */
  static _heredar(infinitivo, irr) {
    const bases = Object.keys(irr)
      .filter((b) => irr[b] && !irr[b].formas)     // solo patrones descritos por rasgos
      .sort((a, b) => b.length - a.length);

    for (const base of bases) {
      if (infinitivo.length <= base.length || !infinitivo.endsWith(base)) continue;
      const prefijo = infinitivo.slice(0, infinitivo.length - base.length);
      if (!/^[a-záéíóúñ]+$/.test(prefijo)) continue;

      const fuente = irr[base];
      const datos = { _base: base, _prefijo: prefijo };
      ["yo", "subj", "preterito", "futuro", "participio", "gerundio", "imperativoTu"]
        .forEach((k) => { if (fuente[k]) datos[k] = prefijo + fuente[k]; });
      if (fuente.diptongo) datos.diptongo = fuente.diptongo;
      if (fuente.debil) datos.debil = fuente.debil;

      // ten pasa a mantén, pon pasa a propón
      if (datos.imperativoTu) datos.imperativoTu = Acentuador.acentuarAguda(datos.imperativoTu);
      return new RasgosVerbales(datos);
    }
    return null;
  }

  /* ------------------------------------------------------------
     Explicación en palabras, para mostrarla en la ficha del verbo
     ------------------------------------------------------------ */

  describir(ortografia, hiatoFuerte, infinitivo) {
    const partes = [];
    if (this.diptongo) {
      const [de, a] = this.cambioFuerte;
      partes.push(`la ${de} de la raíz se convierte en ${a} cuando lleva el acento`);
    }
    if (this.debil) {
      const [de, a] = this.cambioDebil;
      partes.push(`la ${de} pasa a ${a} en el gerundio y en las formas sin acento en la raíz`);
    }
    if (this.yo) partes.push(`la primera persona del presente es irregular (${this.yo})`);
    if (this.preterito) partes.push(`tiene pretérito fuerte, con la raíz ${this.preterito}`);
    if (this.futuro) partes.push(`el futuro y el pospretérito parten de la raíz ${this.futuro}`);
    if (this.participio) partes.push(`el participio es irregular (${this.participio})`);
    if (hiatoFuerte) partes.push(`la ${hiatoFuerte} de la raíz se acentúa en las formas fuertes`);

    const notas = {
      car: "la c se escribe qu delante de e (busqué)",
      gar: "la g se escribe gu delante de e (llegué)",
      zar: "la z se escribe c delante de e (empecé)",
      ger: "la g se escribe j delante de a y de o (cojo)",
      guir: "el grupo gu pierde la u delante de a y de o (sigo)",
      guar: "la u lleva diéresis delante de e (averigüé)",
      cerZ: "la c se escribe z delante de a y de o (venzo)"
    };
    if (ortografia.tipo && notas[ortografia.tipo]) partes.push(notas[ortografia.tipo]);
    if (/(acer|ecer|ocer|ucir)$/.test(infinitivo) && !ModelosVerbales.SIN_ZC.has(infinitivo)) {
      partes.push("la primera persona intercala zc (conozco)");
    }
    if (ortografia.uir) partes.push("se intercala una y delante de a, e y o (construyo)");
    if (ortografia.raizVocalica) partes.push("la i átona entre vocales se escribe y (leyó)");

    if (!partes.length) return "Sigue el modelo regular en todos sus tiempos.";
    return Texto.mayuscula(partes.join(", ")) + ".";
  }
}
