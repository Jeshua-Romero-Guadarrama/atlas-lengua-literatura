/* ============================================================
   VistaConjugador
   ------------------------------------------------------------
   La pestaña del conjugador: campo de verbo, sugerencias y las
   tablas de los dieciocho tiempos agrupadas por modo.
   ============================================================ */

import { Texto } from "../nucleo/Texto.js";
import { ModelosVerbales } from "../verbos/ModelosVerbales.js";
import { Pantalla } from "./Componentes.js";
import { Vista } from "./Vista.js";

export class VistaConjugador extends Vista {
  static get SUGERENCIAS() {
    return ["ser", "estar", "tener", "hacer", "ir", "decir", "poder", "querer", "dormir",
      "pedir", "jugar", "conocer", "traer", "oír", "leer", "construir", "levantarse", "buscar"];
  }

  constructor(conjugador) {
    super("conjugador");
    this.conjugador = conjugador;
    // Aviso de conjugación hecha por interacción directa, que usan las rutas
    // para escribir #/conjugador?verbo=... sin producir un ciclo.
    this.alConjugar = null;
  }

  iniciar() {
    const lista = document.getElementById("sugerencias-conjugador");
    if (lista) {
      lista.innerHTML = "";
      VistaConjugador.SUGERENCIAS.forEach((verbo) => {
        const b = document.createElement("button");
        b.className = "ejemplo-chip";
        b.textContent = verbo;
        b.addEventListener("click", () => { this.entrada.value = verbo; this.conjugar(); });
        lista.appendChild(b);
      });
    }
    document.getElementById("boton-conjugar").addEventListener("click", () => this.conjugar());
    this.entrada.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this.conjugar(); }
    });
  }

  get entrada() { return document.getElementById("entrada-conjugador"); }
  get resultado() { return document.getElementById("resultado-conjugacion"); }

  /* Pinta o retira el error de la entrada: mensaje bajo el campo,
     aria-invalid y el anuncio en la región de estado. Sustituye al panel de
     resultado vacío que antes ocupaba el lugar de la conjugación. */
  _avisar(mensaje) {
    const aviso = document.getElementById("aviso-entrada-conjugador");
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

  /* Ejecuta el verbo que llega en la dirección, como
     #/conjugador?verbo=..., que es lo que hace compartible una conjugación */
  aplicarConsulta(parametros) {
    const verbo = (parametros.get("verbo") || "").trim();
    if (!verbo) return;
    this.entrada.value = verbo;
    this.conjugar();
  }

  conjugar() {
    const entrada = this.entrada.value.trim();
    if (!entrada) {
      this.resultado.classList.add("oculta");
      this._avisar("Escribe un verbo en infinitivo para conjugarlo, como cantar, comer o vivir.");
      return;
    }
    const c = this.conjugador.conjugar(entrada);
    if (!c) {
      this.resultado.classList.add("oculta");
      this._avisar("Eso no parece un infinitivo. Los infinitivos terminan en ar, en er o en ir (cantar, comer, vivir), y los pronominales añaden se (levantarse).");
      return;
    }
    this._avisar("");
    this.resultado.classList.remove("oculta");
    // El resultado ya no es una región viva completa: el aviso sale por la
    // región de estado, sin releer los dieciocho tiempos.
    Pantalla.anunciar(`Conjugación de ${c.infinitivo} lista.`);

    document.getElementById("conj-infinitivo").textContent = c.infinitivo;
    document.getElementById("conj-insignias").innerHTML = this._insignias(c);
    document.getElementById("conj-irregularidad").textContent = c.irregularidad;
    document.getElementById("conj-nopersonales").innerHTML = c.formasNoPersonales.map((f) =>
      `<div class="conj-nopersonal"><span>${Texto.escapar(f.nombre)}</span><strong>${Texto.escapar(f.forma)}</strong></div>`).join("");
    document.getElementById("conj-tiempos").innerHTML = this._tiempos(c);
    // La dirección recoge el verbo conjugado, para poder compartir el enlace.
    if (this.alConjugar) this.alConjugar(entrada);
  }

  _insignias(c) {
    const partes = [
      `<span class="insignia modalidad mod-gramatica">${Texto.escapar(c.conjugacion)}</span>`,
      `<span class="insignia">${c.esIrregular ? "Irregular" : "Regular"}</span>`
    ];
    if (c.pronominal) partes.push('<span class="insignia">Pronominal</span>');
    if (c.verboBase) partes.push(`<span class="insignia">Se conjuga como ${Texto.escapar(c.verboBase)}</span>`);
    if (c.esImpersonal) partes.push('<span class="insignia">Impersonal</span>');
    return partes.join("");
  }

  _tiempos(c) {
    return ModelosVerbales.MODOS.map((modo) => {
      const tarjetas = ModelosVerbales.tiemposDelModo(modo).map((t) => {
        const filas = c.filasDe(t.id).map((f) =>
          `<span class="conj-persona">${Texto.escapar(f.persona)}</span><span class="conj-forma">${Texto.escapar(f.forma)}</span>`).join("");
        return `<div class="conj-tiempo">
                  <h4>${Texto.escapar(t.nombre)}</h4>
                  <span class="conj-alias">también llamado ${Texto.escapar(t.alias)}</span>
                  <div class="conj-lista">${filas}</div>
                </div>`;
      }).join("");
      return `<div class="conj-modo"><h3>Modo ${Texto.escapar(modo.toLowerCase())}</h3>
                <div class="conj-rejilla">${tarjetas}</div></div>`;
    }).join("");
  }
}
