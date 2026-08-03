/* ============================================================
   Texto
   ------------------------------------------------------------
   Utilidades de cadena que usa todo el atlas. Son métodos
   estáticos porque no guardan estado: cada llamada depende solo
   de lo que recibe.
   ============================================================ */

export class Texto {
  static get TILDES() {
    return { "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ü": "u" };
  }

  /* Quita las tildes y conserva la eñe, que es una letra distinta */
  static sinTildes(texto) {
    return (texto || "").replace(/[áéíóúü]/gi, (c) => {
      const min = c.toLowerCase();
      const base = Texto.TILDES[min] || min;
      return c === min ? base : base.toUpperCase();
    });
  }

  /* Forma de comparación: sin tildes y en minúsculas */
  static normalizar(texto) {
    return Texto.sinTildes(texto || "").toLowerCase();
  }

  /* Escapa el marcado para poder insertar texto en el documento */
  static escapar(texto) {
    const d = document.createElement("div");
    d.textContent = texto == null ? "" : String(texto);
    return d.innerHTML;
  }

  /* Texto seguro para un atributo entre comillas dobles */
  static atributo(texto) {
    return Texto.escapar(texto).replace(/"/g, "&quot;");
  }

  static mayuscula(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  static mezclar(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  static alAzar(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  /* Lo que va entre asteriscos se destaca al pintarlo */
  static resaltar(texto) {
    return Texto.escapar(texto).replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  /* Marcado con las coincidencias de la consulta envueltas en mark, para que
     la tarjeta muestre por qué apareció en los resultados. El texto se aplana
     carácter por carácter: así cada posición del texto llano corresponde a la
     misma posición del original y el realce cae sobre "métrica" aunque se
     haya buscado "metrica". Todo fragmento pasa por escapar antes de
     insertarse, dado que el contenido viene de archivos de datos. */
  static marcar(texto, consulta) {
    const original = texto == null ? "" : String(texto);
    const buscada = Texto.normalizar(consulta || "");
    if (!buscada.trim()) return Texto.escapar(original);
    const letras = [...original];
    const llano = letras.map((c) => {
      const n = Texto.normalizar(c);
      // Un carácter que se aplana a otra longitud rompería la correspondencia
      // de posiciones, así que se conserva en minúscula y no coincide.
      return n.length === 1 ? n : c.toLowerCase();
    });
    if (llano.length !== letras.length) return Texto.escapar(original);
    const plano = llano.join("");

    // La consulta se parte en palabras porque la búsqueda de las vistas exige
    // todas las palabras en cualquier orden, y el realce debe corresponder.
    const marcas = new Array(letras.length).fill(false);
    buscada.split(/\s+/).filter(Boolean).forEach((palabra) => {
      let desde = 0;
      let posicion;
      while ((posicion = plano.indexOf(palabra, desde)) !== -1) {
        for (let k = posicion; k < posicion + palabra.length; k++) marcas[k] = true;
        desde = posicion + palabra.length;
      }
    });

    // El texto se recompone por tramos contiguos, con lo que cada fragmento
    // se escapa una sola vez.
    let html = "";
    let inicio = 0;
    for (let i = 1; i <= letras.length; i++) {
      if (i < letras.length && marcas[i] === marcas[inicio]) continue;
      const tramo = Texto.escapar(letras.slice(inicio, i).join(""));
      html += marcas[inicio] ? `<mark>${tramo}</mark>` : tramo;
      inicio = i;
    }
    return html;
  }

  /* Comprueba que todas las palabras de la consulta estén en el texto */
  static contieneTodas(texto, consulta) {
    const t = Texto.normalizar(texto);
    return Texto.normalizar(consulta).split(/\s+/).filter(Boolean).every((p) => t.includes(p));
  }

  /* Recorta sin partir una palabra por la mitad */
  static recortar(texto, largo) {
    const t = texto || "";
    if (t.length <= largo) return t;
    const corte = t.slice(0, largo);
    return corte.slice(0, corte.lastIndexOf(" ")) + "…";
  }

  /* Número gramatical probable de una palabra por su terminación */
  static numeroDe(palabra) {
    const p = (palabra || "").toLowerCase();
    return /(es|s)$/.test(p) && p.length > 2 ? "plural" : "singular";
  }

  /* Género gramatical probable de una palabra por su terminación */
  static generoDe(palabra) {
    const p = Texto.sinTildes((palabra || "").toLowerCase());
    if (/(a|as)$/.test(p)) return "femenino";
    if (/(o|os)$/.test(p)) return "masculino";
    if (/(cion|sion|dad|tad|tud|umbre|ez|eza|ncia|itis)(es)?$/.test(p)) return "femenino";
    if (/(or|aje|ismo|men|ma)(es)?$/.test(p)) return "masculino";
    return "ambiguo";
  }
}
