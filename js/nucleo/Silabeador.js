/* ============================================================
   Silabeador
   ------------------------------------------------------------
   Separa una palabra en sílabas siguiendo las reglas del
   español: grupos consonánticos inseparables, diptongos,
   triptongos e hiatos.
   ============================================================ */

export class Silabeador {
  static get ABIERTAS() { return "aeoáéó"; }      // vocales fuertes
  static get CERRADAS() { return "iuíúü"; }       // vocales débiles
  static get CON_TILDE() { return "áéíóú"; }
  static get VOCALES() { return Silabeador.ABIERTAS + Silabeador.CERRADAS; }

  /* Grupos consonánticos que nunca se separan */
  static get INSEPARABLES() {
    return new Set(["pr", "br", "tr", "dr", "cr", "gr", "fr",
      "pl", "bl", "cl", "gl", "fl", "ll", "rr", "ch"]);
  }

  static esVocal(c) { return Silabeador.VOCALES.includes(c); }
  static esAbierta(c) { return Silabeador.ABIERTAS.includes(c); }
  static esCerrada(c) { return Silabeador.CERRADAS.includes(c); }
  static esCerradaTonica(c) { return c === "í" || c === "ú"; }
  static tieneTilde(c) { return Silabeador.CON_TILDE.includes(c); }

  /* Dos vocales seguidas: ¿una sílaba o dos?
     Diptongo: abierta más cerrada átona, o dos cerradas distintas.
     Hiato: dos abiertas, o cerrada con tilde junto a abierta. */
  static formanDiptongo(a, b) {
    if (Silabeador.esCerradaTonica(a) || Silabeador.esCerradaTonica(b)) return false;
    if (Silabeador.esAbierta(a) && Silabeador.esAbierta(b)) return false;
    if (Silabeador.esCerrada(a) && Silabeador.esCerrada(b)) return a !== b;
    return true;
  }

  /* Separa la palabra en sílabas y devuelve el arreglo */
  static separar(palabra) {
    const p = (palabra || "").toLowerCase().replace(/[^a-záéíóúüñ]/gi, "");
    if (!p) return [];

    const nucleos = Silabeador._nucleosVocalicos(p);
    if (!nucleos.length) return [p];

    const cortes = Silabeador._cortes(p, nucleos);
    const salida = [];
    for (let k = 0; k < cortes.length - 1; k++) {
      const trozo = p.slice(cortes[k], cortes[k + 1]);
      if (trozo) salida.push(trozo);
    }
    return salida.length ? salida : [p];
  }

  /* Localiza los núcleos vocálicos, partiendo los grupos por sus hiatos */
  static _nucleosVocalicos(p) {
    const bloques = [];
    let i = 0;
    while (i < p.length) {
      const vocal = Silabeador.esVocal(p[i]);
      let j = i;
      while (j < p.length && Silabeador.esVocal(p[j]) === vocal) j++;
      bloques.push({ vocal, texto: p.slice(i, j) });
      i = j;
    }

    const nucleos = [];
    let pos = 0;
    bloques.forEach((b) => {
      if (!b.vocal) { pos += b.texto.length; return; }
      let arranque = 0;
      for (let k = 1; k < b.texto.length; k++) {
        if (!Silabeador.formanDiptongo(b.texto[k - 1], b.texto[k])) {
          nucleos.push({ inicio: pos + arranque, fin: pos + k });
          arranque = k;
        }
      }
      nucleos.push({ inicio: pos + arranque, fin: pos + b.texto.length });
      pos += b.texto.length;
    });
    return nucleos;
  }

  /* Reparte las consonantes que quedan entre dos núcleos */
  static _cortes(p, nucleos) {
    const cortes = [0];
    for (let n = 0; n < nucleos.length - 1; n++) {
      const desde = nucleos[n].fin;
      const hasta = nucleos[n + 1].inicio;
      const cons = p.slice(desde, hasta);
      let corte;
      if (cons.length === 0) corte = hasta;                         // hiato
      else if (cons.length === 1) corte = desde;                    // ca-sa
      else if (cons.length === 2) corte = Silabeador.INSEPARABLES.has(cons) ? desde : desde + 1;
      else if (cons.length === 3) corte = Silabeador.INSEPARABLES.has(cons.slice(1)) ? desde + 1 : desde + 2;
      else corte = desde + 2;                                       // cuatro consonantes
      cortes.push(corte);
    }
    cortes.push(p.length);
    return cortes;
  }

  /* Diptongos, triptongos e hiatos que contiene una palabra */
  static gruposVocalicos(palabra) {
    const p = (palabra || "").toLowerCase();
    const salida = [];
    let i = 0;
    while (i < p.length) {
      if (!Silabeador.esVocal(p[i])) { i++; continue; }
      let j = i;
      while (j < p.length && Silabeador.esVocal(p[j])) j++;
      const grupo = p.slice(i, j);
      if (grupo.length >= 2) {
        for (let k = 1; k < grupo.length; k++) {
          if (!Silabeador.formanDiptongo(grupo[k - 1], grupo[k])) {
            salida.push({ texto: grupo.slice(k - 1, k + 1), tipo: "hiato" });
          }
        }
        const esTriptongo = grupo.length === 3 &&
          Silabeador.esCerrada(grupo[0]) && Silabeador.esAbierta(grupo[1]) && Silabeador.esCerrada(grupo[2]) &&
          Silabeador.formanDiptongo(grupo[0], grupo[1]) && Silabeador.formanDiptongo(grupo[1], grupo[2]);
        if (esTriptongo) {
          salida.push({ texto: grupo, tipo: "triptongo" });
        } else {
          for (let k = 1; k < grupo.length; k++) {
            if (Silabeador.formanDiptongo(grupo[k - 1], grupo[k])) {
              salida.push({ texto: grupo.slice(k - 1, k + 1), tipo: "diptongo" });
            }
          }
        }
      }
      i = j;
    }
    return salida;
  }
}
