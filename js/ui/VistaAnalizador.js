/* ============================================================
   PintorDeArbol y VistaAnalizador
   ------------------------------------------------------------
   El pintor convierte el árbol de nodos en marcado. La vista se
   encarga de la caja de texto, de los ejemplos y de los cuatro
   paneles del resultado.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { Pantalla } from "./Componentes.js";
import { Vista } from "./Vista.js";

class PintorDeArbol {
  /* Clase de color de una palabra según su clase gramatical */
  static clasePalabra(clase) {
    const c = Texto.normalizar(clase || "").replace(/[^a-z]/g, "");
    const conocidas = ["sustantivo", "verbo", "adjetivo", "determinante", "pronombre",
      "adverbio", "preposicion", "conjuncion", "interjeccion", "signo"];
    return "p-" + (conocidas.includes(c) ? c : "desconocida");
  }

  /* Abreviatura que se escribe debajo de cada palabra. Es la que se usa
     al analizar a mano, y es lo que permite que el color no tenga que
     cargar solo con la identificación de nueve clases distintas. */
  static get ABREVIATURAS() {
    return {
      sustantivo: "sust", verbo: "verb", adjetivo: "adj", determinante: "det",
      pronombre: "pron", adverbio: "adv", "preposición": "prep",
      "conjunción": "conj", "interjección": "interj", signo: ""
    };
  }

  static abreviatura(clase) {
    const a = PintorDeArbol.ABREVIATURAS[clase];
    return a === undefined ? "?" : a;
  }

  /* Las cuatro familias funcionales que agrupan las nueve clases */
  static get FAMILIAS() {
    return [
      { clave: "nombra", titulo: "Nombra", clases: [
        { clase: "sustantivo", trazo: "relleno", nota: "el núcleo" },
        { clase: "determinante", trazo: "contorno", nota: "lo presenta" },
        { clase: "pronombre", trazo: "punteado", nota: "lo sustituye" }
      ] },
      { clave: "predica", titulo: "Predica", clases: [
        { clase: "verbo", trazo: "relleno", nota: "el núcleo" }
      ] },
      { clave: "modifica", titulo: "Modifica", clases: [
        { clase: "adjetivo", trazo: "relleno", nota: "al sustantivo" },
        { clase: "adverbio", trazo: "contorno", nota: "al verbo" }
      ] },
      { clave: "enlaza", titulo: "Enlaza", clases: [
        { clase: "preposición", trazo: "contorno", nota: "con su término" },
        { clase: "conjunción", trazo: "punteado", nota: "dos partes" },
        { clase: "interjección", trazo: "puntos", nota: "fuera de la oración" }
      ] }
    ];
  }

  static nodo(nodo) {
    const hijos = nodo.hijos.map((h) => PintorDeArbol.nodo(h)).join("");
    const nucleo = nodo.nucleo && nodo.tieneHijos
      ? `<p class="nodo-nucleo">Núcleo: <strong>${Texto.escapar(nodo.nucleo)}</strong></p>` : "";
    return `
      <div class="nodo ${nodo.claseDeColor}">
        <div class="nodo-cabeza">
          <span class="nodo-funcion">${Texto.escapar(nodo.funcion)}</span>
          ${nodo.tipo ? `<span class="nodo-tipo">${Texto.escapar(nodo.tipo)}</span>` : ""}
          ${nodo.texto ? `<span class="nodo-texto">${Texto.escapar(nodo.texto)}</span>` : ""}
        </div>
        ${nucleo}
        ${nodo.pista ? `<p class="nodo-pista">${Texto.escapar(nodo.pista)}</p>` : ""}
        ${hijos ? `<div class="nodo-hijos">${hijos}</div>` : ""}
      </div>`;
  }

  static oracionPintada(analisis) {
    return analisis.palabrasVisibles.map((p) => {
      const clase = p.clase || "desconocida";
      const titulo = `${clase}${p.subtipo ? " " + p.subtipo : ""}`;
      return `<span class="palabra ${PintorDeArbol.clasePalabra(clase)}" title="${Texto.atributo(titulo)}">
        <span class="palabra-forma">${Texto.escapar(p.visible)}</span>
        <span class="palabra-abrev">${Texto.escapar(PintorDeArbol.abreviatura(clase))}</span>
      </span>`;
    }).join("");
  }

  /* La leyenda se agrupa por familias, que es lo que el color codifica.
     Solo se muestran las familias que aparecen en la oración. */
  static leyenda(analisis) {
    const usadas = new Set(analisis.clasesUsadas);
    return PintorDeArbol.FAMILIAS
      .filter((f) => f.clases.some((c) => usadas.has(c.clase)))
      .map((f) => {
        const items = f.clases.filter((c) => usadas.has(c.clase)).map((c) => `
          <li>
            <span class="leyenda-muestra ${c.trazo}"></span>
            <span>${Texto.escapar(Texto.mayuscula(c.clase))}, ${Texto.escapar(c.nota)}</span>
          </li>`).join("");
        return `<div class="leyenda-familia fam-${f.clave}">
                  <h4>${Texto.escapar(f.titulo)}</h4>
                  <ul>${items}</ul>
                </div>`;
      }).join("");
  }

  /* El análisis en texto llano, para copiarlo a un trabajo */
  static aTextoLlano(analisis) {
    const lineas = [analisis.texto, ""];
    lineas.push("Tipo de oración");
    analisis.rasgos.forEach((r) => lineas.push(`  ${r.nombre}: ${r.valor}`));
    lineas.push("", "Análisis sintáctico");
    const recorrer = (nodo, nivel) => {
      const sangria = "  ".repeat(nivel + 1);
      const tipo = nodo.tipo ? ` (${nodo.tipo})` : "";
      lineas.push(`${sangria}${nodo.funcion}${tipo}: ${nodo.texto}`);
      nodo.hijos.forEach((h) => recorrer(h, nivel + 1));
    };
    recorrer(analisis.arbol, 0);
    lineas.push("", "Palabra por palabra");
    analisis.palabrasConContenido.forEach((p) => {
      const rasgos = p.analisis.rasgos;
      lineas.push(`  ${p.texto}: ${p.analisis.clase}${p.subtipo ? ", " + p.subtipo : ""}${rasgos ? ", " + rasgos : ""}`);
    });
    return lineas.join("\n");
  }

  static rasgos(analisis) {
    return analisis.rasgos.map((r) =>
      `<span class="rasgo"><span class="rasgo-nombre">${Texto.escapar(r.nombre)}</span><span class="rasgo-valor">${Texto.escapar(r.valor)}</span></span>`
    ).join("");
  }

  static tablaMorfologica(analisis) {
    return analisis.palabrasConContenido.map((p) => {
      const a = p.analisis;
      const nombre = p.contraida ? `${p.texto} (de ${p.original})` : p.texto;
      return `<tr>
        <td class="col-palabra">${Texto.escapar(nombre)}</td>
        <td><span class="pastilla-clase ${PintorDeArbol.clasePalabra(a.clase)}">${Texto.escapar(Texto.mayuscula(a.clase))}</span></td>
        <td>${Texto.escapar(a.subtipo || "")}</td>
        <td class="col-rasgos">${Texto.escapar(a.rasgos)}</td>
      </tr>`;
    }).join("");
  }
}

export class VistaAnalizador extends Vista {
  static get EJEMPLOS() {
    return [
      "El niño pequeño come una manzana roja.",
      "María escribió una carta a su abuela ayer.",
      "Mi hermano mayor es muy inteligente.",
      "La novela fue escrita por un autor mexicano.",
      "Los alumnos que estudian aprueban el examen.",
      "Ayer llovió mucho en la ciudad.",
      "Nosotros vamos a estudiar gramática.",
      "Compré un cuaderno y vendí mi lápiz.",
      "Vine porque te necesito.",
      "¿Dónde están mis cuadernos?"
    ];
  }

  constructor(analizador) {
    super("analizador");
    this.analizador = analizador;
    // Aviso de análisis hecho por interacción directa, que usan las rutas
    // para escribir #/analizador?frase=... sin producir un ciclo.
    this.alAnalizar = null;
  }

  iniciar() {
    const lista = document.getElementById("ejemplos-analizador");
    if (lista) {
      lista.innerHTML = "";
      VistaAnalizador.EJEMPLOS.forEach((frase) => {
        const b = document.createElement("button");
        b.className = "ejemplo-chip";
        b.textContent = frase;
        b.addEventListener("click", () => { this.entrada.value = frase; this.analizar(); });
        lista.appendChild(b);
      });
    }

    document.getElementById("boton-analizar").addEventListener("click", () => this.analizar());
    document.getElementById("boton-limpiar").addEventListener("click", () => this.limpiar());
    this.entrada.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.analizar(); }
    });

    const copiar = document.getElementById("boton-copiar-analisis");
    if (copiar) copiar.addEventListener("click", () => this.copiar());
  }

  /* Copia el análisis en texto llano, para pegarlo en un trabajo */
  async copiar() {
    if (!this.ultimo) return;
    const texto = PintorDeArbol.aTextoLlano(this.ultimo);
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (err) { /* sin portapapeles */ }
      document.body.removeChild(ta);
    }
    const boton = document.getElementById("boton-copiar-analisis");
    const etiqueta = boton.querySelector("span");
    const original = etiqueta.textContent;
    etiqueta.textContent = "Copiado";
    setTimeout(() => { etiqueta.textContent = original; }, 1600);
  }

  get entrada() { return document.getElementById("entrada-analizador"); }
  get resultado() { return document.getElementById("resultado-analisis"); }

  limpiar() {
    this.entrada.value = "";
    this.resultado.classList.add("oculta");
    this._avisar("");
  }

  /* Pinta o retira el error de la entrada: mensaje bajo el campo,
     aria-invalid y el anuncio en la región de estado, porque fallar en
     silencio deja a quien pulsó el botón sin saber si algo ocurrió. */
  _avisar(mensaje) {
    const aviso = document.getElementById("aviso-entrada-analizador");
    if (aviso) {
      aviso.textContent = mensaje;
      aviso.hidden = !mensaje;
    }
    if (mensaje) {
      this.entrada.setAttribute("aria-invalid", "true");
      Pantalla.anunciar(mensaje);
    } else {
      this.entrada.removeAttribute("aria-invalid");
    }
  }

  /* Ejecuta la frase que llega en la dirección, como
     #/analizador?frase=..., que es lo que hace compartible un análisis */
  aplicarConsulta(parametros) {
    const frase = (parametros.get("frase") || "").trim();
    if (!frase) return;
    this.entrada.value = frase;
    this.analizar();
  }

  analizar() {
    const texto = this.entrada.value.trim();
    if (!texto) {
      this.resultado.classList.add("oculta");
      this._avisar("Escribe una oración para analizarla, o elige uno de los ejemplos.");
      return;
    }

    const analisis = this.analizador.analizar(texto);
    if (!analisis) {
      this.resultado.classList.add("oculta");
      this._avisar("No encontré nada que analizar en esa entrada. Prueba con una oración con palabras, como las de los ejemplos.");
      return;
    }
    this._avisar("");
    this.ultimo = analisis;

    document.getElementById("oracion-pintada").innerHTML = PintorDeArbol.oracionPintada(analisis);
    document.getElementById("leyenda-clases").innerHTML = PintorDeArbol.leyenda(analisis);
    document.getElementById("rasgos-oracion").innerHTML = PintorDeArbol.rasgos(analisis);
    document.getElementById("arbol-sintactico").innerHTML = PintorDeArbol.nodo(analisis.arbol);
    document.getElementById("tabla-morfologica").innerHTML = PintorDeArbol.tablaMorfologica(analisis);

    this.resultado.classList.remove("oculta");
    // El resultado ya no es una región viva completa: el aviso de que hay
    // análisis nuevo sale por la región de estado, sin releer todo el árbol.
    Pantalla.anunciar("Análisis listo. El resultado está debajo de la caja de texto.");
    Pantalla.desplazar(this.resultado);
    // La dirección recoge la frase analizada, para poder compartir el enlace.
    if (this.alAnalizar) this.alAnalizar(texto);
  }
}
