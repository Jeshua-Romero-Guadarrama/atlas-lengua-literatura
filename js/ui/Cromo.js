/* ============================================================
   Cromo de la ventana
   ------------------------------------------------------------
   Los detalles que rodean al contenido: conmutador de tema en
   tres estados, barra de avance de lectura, enlace de salto y
   botón de volver arriba. Vivía dentro de Aplicacion.js y se
   separó porque es una responsabilidad completa por sí misma.
   ============================================================ */

import { Pantalla } from "./Componentes.js";

export class Cromo {
  /* Los detalles de la ventana: conmutador de tema en tres estados, enlace de
     salto al contenido, barra de avance de lectura y botón de volver arriba */

  /* El orden del ciclo y los nombres que se leen en el rótulo del botón */
  static get TEMA_SIGUIENTE() { return { claro: "oscuro", oscuro: "sistema", sistema: "claro" }; }
  static get TEMA_NOMBRE() { return { claro: "claro", oscuro: "oscuro", sistema: "el del sistema" }; }
  static get COLOR_TEMA() { return { claro: "#4f46e5", oscuro: "#0b1220" }; }

  /* El estado sistema se representa quitando data-tema y borrando lo guardado,
     de modo que los tokens vuelven a obedecer a prefers-color-scheme y quien
     cambió de opinión puede regresar a seguir a su dispositivo. Acompaña al
     script del encabezado que aplica el tema guardado antes de pintar. */
  static aplicarTema(estado) {
    if (estado === "sistema") delete document.documentElement.dataset.tema;
    else document.documentElement.dataset.tema = estado;
    try {
      // Guardar "sistema" equivale a no guardar nada: se borra la clave.
      if (estado === "sistema") localStorage.removeItem("tema");
      else localStorage.setItem("tema", estado);
    } catch (e) { /* sin almacenamiento */ }
    // Con tema fijado, los dos theme-color llevan el mismo color; en sistema
    // cada uno recupera el suyo y el navegador elige por su media.
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      const media = meta.getAttribute("media") || "";
      const propio = media.includes("dark") ? Cromo.COLOR_TEMA.oscuro : Cromo.COLOR_TEMA.claro;
      meta.setAttribute("content", estado === "sistema" ? propio : Cromo.COLOR_TEMA[estado]);
    });
  }

  /* El aspecto con el que se ve un estado. Para «sistema» decide la
     preferencia del dispositivo, porque es la única forma de comparar ese
     estado con los dos fijos. */
  static temaEfectivo(estado) {
    if (estado !== "sistema") return estado;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
  }

  /* El paso siguiente del ciclo con una salvedad: Si ese paso se viera igual
     que el estado actual (por ejemplo, de oscuro manual a sistema con el
     dispositivo en oscuro), el toque no cambiaría nada en pantalla y el botón
     parecería muerto, así que se salta un paso más para que cada toque
     produzca siempre un cambio visible. */
  static temaSiguiente(actual) {
    let siguiente = Cromo.TEMA_SIGUIENTE[actual] || "claro";
    if (Cromo.temaEfectivo(siguiente) === Cromo.temaEfectivo(actual)) {
      siguiente = Cromo.TEMA_SIGUIENTE[siguiente];
    }
    return siguiente;
  }

  /* El nombre accesible del botón dice el estado actual y el siguiente, porque
     un botón que cicla entre tres estados no se explica con un ícono. El
     siguiente se calcula con el mismo salto que el clic, para que el rótulo
     anuncie el estado al que de verdad se va a llegar. */
  static rotularBotonTema(boton) {
    const actual = document.documentElement.dataset.tema || "sistema";
    const texto = `Tema: ${Cromo.TEMA_NOMBRE[actual]}. Cambiar a ${Cromo.TEMA_NOMBRE[Cromo.temaSiguiente(actual)]}`;
    boton.setAttribute("aria-label", texto);
    boton.setAttribute("title", texto);
  }

  static iniciar() {
    const boton = document.getElementById("conmutar-tema");
    if (boton) {
      boton.addEventListener("click", () => {
        const actual = document.documentElement.dataset.tema || "sistema";
        Cromo.aplicarTema(Cromo.temaSiguiente(actual));
        Cromo.rotularBotonTema(boton);
      });
      // El rótulo inicial refleja lo que haya dejado el script de arranque.
      Cromo.rotularBotonTema(boton);
    }

    // El enlace de salto lleva el foco al contenido de la vista visible en ese
    // momento, no a un ancla fija, porque la vista cambia con la pestaña.
    const salto = document.getElementById("saltar-al-contenido");
    if (salto) {
      salto.addEventListener("click", (e) => {
        e.preventDefault();
        const vista = document.querySelector(".vista:not(.oculta)");
        if (!vista) return;
        vista.setAttribute("tabindex", "-1");
        vista.focus();
        Pantalla.desplazar(vista);
      });
    }

    const barra = document.getElementById("barra-scroll");
    const arriba = document.getElementById("ir-arriba");
    const alDesplazar = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const pct = alto > 0 ? (window.scrollY / alto) * 100 : 0;
      if (barra) barra.style.width = pct + "%";
      if (arriba) arriba.classList.toggle("visible", window.scrollY > 500);
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    // El desplazamiento pasa por la utilidad común, que respeta la preferencia
    // de menos movimiento.
    if (arriba) arriba.addEventListener("click", () => Pantalla.desplazar(0));
    alDesplazar();
  }
}
