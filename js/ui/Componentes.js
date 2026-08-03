/* ============================================================
   Componentes de interfaz reutilizables
   ------------------------------------------------------------
   Piezas pequeñas que usan todas las vistas: los iconos, la fila
   de filtros, el paginador, los modales y el campo de búsqueda.
   ============================================================ */

export class Icono {
  /* Marcado de un icono de la biblioteca de símbolos */
  static de(nombre) {
    return `<svg class="ico"><use href="#ico-${nombre}"/></svg>`;
  }
}

export class Pantalla {
  /* Desplaza la página o un elemento a la vista respetando la preferencia de
     menos movimiento: quien la activa recibe un salto directo en lugar de una
     animación que puede marear. */
  static desplazar(destino) {
    const comportamiento = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (destino instanceof Element) {
      destino.scrollIntoView({ behavior: comportamiento, block: "start" });
      return;
    }
    window.scrollTo({ top: destino, behavior: comportamiento });
  }

  /* Escribe un mensaje en la región de estado permanente, que es la única
     región viva que existe desde el primer pintado y por eso no pierde ningún
     anuncio. La usan el cambio de vista y los avisos generales. */
  static anunciar(mensaje) {
    const region = document.getElementById("region-estado");
    if (!region) return;
    // Se vacía antes de escribir para que repetir el mismo texto también se anuncie.
    region.textContent = "";
    region.textContent = mensaje;
  }
}

export class Chips {
  /* Cada opción llega como { valor, cuenta }: saber cuántos elementos esperan
     detrás de un chip ayuda a decidir si vale la pena pulsarlo. */
  constructor(idContenedor, opciones, alElegir) {
    this.contenedor = document.getElementById(idContenedor);
    this.opciones = opciones;
    this.alElegir = alElegir;
    this.pintar();
  }

  pintar() {
    if (!this.contenedor) return;
    this.contenedor.innerHTML = "";
    this.opciones.forEach((opcion, indice) => {
      const chip = document.createElement("button");
      chip.className = "chip" + (indice === 0 ? " activo" : "");
      // aria-pressed dice cuál filtro está aplicado, que la clase sola no comunica
      // a un lector de pantalla.
      chip.setAttribute("aria-pressed", indice === 0 ? "true" : "false");
      // El recuento va en el texto del botón, de modo que el lector de
      // pantalla también lo anuncia.
      chip.append(opcion.valor + " ");
      const cuenta = document.createElement("span");
      cuenta.className = "chip-cuenta";
      cuenta.textContent = `(${opcion.cuenta})`;
      chip.appendChild(cuenta);
      chip.addEventListener("click", () => {
        this.contenedor.querySelectorAll(".chip").forEach((c) => {
          c.classList.remove("activo");
          c.setAttribute("aria-pressed", "false");
        });
        chip.classList.add("activo");
        chip.setAttribute("aria-pressed", "true");
        this.alElegir(opcion.valor);
      });
      this.contenedor.appendChild(chip);
    });
  }

  /* Devuelve el grupo a su primer chip, que es el que no filtra nada, sin
     disparar el manejador: quien limpia repinta una sola vez por su cuenta. */
  reiniciar() {
    if (!this.contenedor) return;
    this.contenedor.querySelectorAll(".chip").forEach((c, i) => {
      c.classList.toggle("activo", i === 0);
      c.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    });
  }

  /* Valores distintos de un campo, tomados de los datos y ordenados */
  static valoresDe(lista, campo) {
    const vistos = new Set();
    lista.forEach((d) => { const v = d && d[campo]; if (v) vistos.add(v); });
    return [...vistos].sort((a, b) => a.localeCompare(b, "es"));
  }
}

export class Paginador {
  constructor(idNav, porPagina, alCambiar) {
    this.nav = document.getElementById(idNav);
    this.porPagina = porPagina;
    this.alCambiar = alCambiar;
    this.pagina = 1;
  }

  reiniciar() { this.pagina = 1; }

  /* Devuelve el trozo de la lista que corresponde a la página actual */
  trozo(lista) {
    const paginas = Math.max(1, Math.ceil(lista.length / this.porPagina));
    if (this.pagina > paginas) this.pagina = paginas;
    const inicio = (this.pagina - 1) * this.porPagina;
    return { items: lista.slice(inicio, inicio + this.porPagina), paginas, inicio, total: lista.length };
  }

  /* Qué números mostrar, con puntos suspensivos si hay muchas páginas */
  static numerosVisibles(actual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const nums = new Set([1, total, actual, actual - 1, actual + 1]);
    const orden = [...nums].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    const salida = [];
    orden.forEach((n, i) => {
      if (i > 0 && n - orden[i - 1] > 1) salida.push("…");
      salida.push(n);
    });
    return salida;
  }

  pintar(info) {
    if (!this.nav) return;
    if (info.paginas <= 1) { this.nav.innerHTML = ""; return; }

    const desde = info.inicio + 1;
    const hasta = info.inicio + info.items.length;
    let html = `<span class="pag-info">${desde} a ${hasta} de ${info.total}</span><div class="pag-botones">`;
    html += `<button class="pag-btn pag-flecha" data-ir="${this.pagina - 1}" ${this.pagina === 1 ? "disabled" : ""} aria-label="Anterior">${Icono.de("anterior")}</button>`;
    Paginador.numerosVisibles(this.pagina, info.paginas).forEach((n) => {
      html += n === "…"
        ? `<span class="pag-elipsis">…</span>`
        : `<button class="pag-btn ${n === this.pagina ? "activo" : ""}" data-ir="${n}">${n}</button>`;
    });
    html += `<button class="pag-btn pag-flecha" data-ir="${this.pagina + 1}" ${this.pagina === info.paginas ? "disabled" : ""} aria-label="Siguiente">${Icono.de("siguiente")}</button></div>`;
    this.nav.innerHTML = html;

    this.nav.querySelectorAll("button[data-ir]").forEach((b) => {
      b.addEventListener("click", () => {
        const destino = Number(b.dataset.ir);
        if (destino < 1 || destino > info.paginas) return;
        this.pagina = destino;
        this.alCambiar();
      });
    });
  }
}

export class Mensajes {
  /* El segundo argumento añade el botón de salida rápida del estado vacío,
     que las vistas con buscador conectan a su método limpiar. */
  static sinResultados(mensaje, conLimpiar) {
    const boton = conLimpiar
      ? `<button type="button" class="boton-limpiar">${Icono.de("equis")} Limpiar búsqueda y filtros</button>`
      : "";
    return `<div class="sin-resultados"><p class="emoji-grande">${Icono.de("buscar")}</p><p>${mensaje}</p>${boton}</div>`;
  }

  static contador(n, singular, plural) {
    return n === 1 ? `1 ${singular}` : `${n} ${plural}`;
  }
}
