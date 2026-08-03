/*
 * Validador del contenido del atlas.
 * Autor: Jeshua Romero Guadarrama
 *
 *   npm run validar        (desde la carpeta server)
 *   node server/validar.js (desde la raíz)
 *
 * Comprueba cuatro cosas: que los JSON son correctos y tienen los campos que
 * les tocan, que las referencias cruzadas apuntan a algo que existe, que el
 * texto respeta las convenciones de redacción del README (apartado 10), y que
 * los datos del motor traen las claves que el analizador y el conjugador
 * necesitan. Termina con código de salida 1 si encuentra errores, de modo que
 * sirve como comprobación antes de publicar.
 */
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const DATOS = path.join(RAIZ, "data");

const AREAS = ["Gramática", "Sintaxis", "Ortografía", "Literatura", "Léxico y semántica",
  "Expresión y redacción", "Comprensión lectora", "Comunicación"];
const NIVELES = ["Secundaria", "Preparatoria"];
const DIFICULTADES = ["Básico", "Intermedio", "Avanzado"];

/* Los guiones se construyen por código para no escribirlos en el archivo. */
const GUIONES = new RegExp("[" + String.fromCharCode(8212, 8211, 8722) + "]");
const URL = /https?:\/\/|www\./i;
const EMOJI = /\p{Extended_Pictographic}/u;
const COMA_DECIMAL = /\d,\d/;
/* Menciones que no deben aparecer en ninguna parte del contenido */
const ASISTENCIA = /(inteligencia artificial|modelo de lenguaje|generado autom)/i;

const errores = [];
const avisos = [];
const fallo = (m) => errores.push(m);
const aviso = (m) => avisos.push(m);

function leer(archivo) {
  const ruta = path.join(DATOS, archivo);
  if (!fs.existsSync(ruta)) { fallo(`Falta el archivo ${archivo}`); return null; }
  try {
    return JSON.parse(fs.readFileSync(ruta, "utf8").replace(/^﻿/, ""));
  } catch (e) {
    fallo(`${archivo} no es JSON válido. ${e.message}`);
    return null;
  }
}

/* ------------------------------------------------------------
   Reglas de redacción
   ------------------------------------------------------------ */

function revisarTexto(doc, etiqueta) {
  const visitar = (valor, ruta) => {
    if (typeof valor === "string") {
      const esCodigo = /(^|\.)codigo$/.test(ruta);
      if (GUIONES.test(valor)) fallo(`${etiqueta} ${ruta}: usa guion largo o corto`);
      if (!esCodigo && URL.test(valor)) fallo(`${etiqueta} ${ruta}: contiene una dirección web`);
      if (EMOJI.test(valor)) fallo(`${etiqueta} ${ruta}: contiene un emoji`);
      if (COMA_DECIMAL.test(valor)) fallo(`${etiqueta} ${ruta}: usa coma decimal en vez de punto`);
      if (ASISTENCIA.test(valor)) fallo(`${etiqueta} ${ruta}: menciona herramientas de asistencia`);
      revisarDosPuntos(valor, etiqueta, ruta);
      revisarAsteriscos(valor, etiqueta, ruta);
    } else if (Array.isArray(valor)) {
      valor.forEach((v, i) => visitar(v, `${ruta}[${i}]`));
    } else if (valor && typeof valor === "object") {
      Object.keys(valor).forEach((k) => visitar(valor[k], ruta ? `${ruta}.${k}` : k));
    }
  };
  Object.keys(doc).forEach((k) => visitar(doc[k], k));
}

/* Después de dos puntos va mayúscula cuando lo que sigue es una oración */
function revisarDosPuntos(texto, etiqueta, ruta) {
  const re = /:\s+([a-záéíóúñ])/g;
  let m;
  while ((m = re.exec(texto)) !== null) {
    const cola = texto.slice(m.index + 1).trim();
    // Solo se avisa cuando lo que sigue parece una oración, no una enumeración
    if (/[.!?]/.test(cola) && cola.split(/\s+/).length > 4) {
      aviso(`${etiqueta} ${ruta}: minúscula tras dos puntos («${cola.slice(0, 40)}»)`);
    }
  }
}

/* Los asteriscos que destacan una palabra van siempre en pareja */
function revisarAsteriscos(texto, etiqueta, ruta) {
  const cuantos = (texto.match(/\*/g) || []).length;
  if (cuantos % 2 !== 0) fallo(`${etiqueta} ${ruta}: asterisco sin cerrar`);
}

/* ------------------------------------------------------------
   Reglas de estructura
   ------------------------------------------------------------ */

function revisarCampos(doc, etiqueta, obligatorios) {
  obligatorios.forEach((campo) => {
    const valor = doc[campo];
    const vacio = valor === undefined || valor === null || valor === "" ||
      (Array.isArray(valor) && !valor.length);
    if (vacio) fallo(`${etiqueta}: falta el campo ${campo}`);
  });
}

function revisarCodigosUnicos(lista, archivo) {
  const vistos = new Set();
  lista.forEach((d) => {
    if (!d.codigo) return;
    if (vistos.has(d.codigo)) fallo(`${archivo}: el código ${d.codigo} está repetido`);
    vistos.add(d.codigo);
    if (!/^[a-z0-9-]+$/.test(d.codigo)) {
      fallo(`${archivo}: el código ${d.codigo} debe ir en minúsculas y sin espacios`);
    }
  });
}

function revisarValor(doc, campo, permitidos, etiqueta) {
  if (doc[campo] && !permitidos.includes(doc[campo])) {
    fallo(`${etiqueta}: ${campo} tiene el valor "${doc[campo]}", que no está entre los permitidos`);
  }
}

/* ------------------------------------------------------------
   Comprobación de cada colección
   ------------------------------------------------------------ */

const fichas = leer("fichas.json") || [];
const figuras = leer("figuras.json") || [];
const normas = leer("normas.json") || [];
const movimientos = leer("movimientos.json") || [];
const glosario = leer("glosario.json") || [];
const temas = leer("temas.json") || [];
const ejercicios = leer("ejercicios.json") || [];

const codigosDeTema = new Set(temas.map((t) => t.codigo));

fichas.forEach((f) => {
  const etiqueta = `ficha ${f.codigo || "sin código"}`;
  revisarCampos(f, etiqueta, ["codigo", "titulo", "area", "nivel", "dificultad", "definicion", "etiquetas"]);
  revisarValor(f, "area", AREAS, etiqueta);
  revisarValor(f, "nivel", NIVELES, etiqueta);
  revisarValor(f, "dificultad", DIFICULTADES, etiqueta);
  revisarTexto(f, etiqueta);
  if (f.temaRelacionado && !codigosDeTema.has(f.temaRelacionado)) {
    fallo(`${etiqueta}: temaRelacionado apunta a "${f.temaRelacionado}", que no existe en temas.json`);
  }
  if (f.tabla) {
    const { columnas, filas } = f.tabla;
    if (!columnas || !filas) fallo(`${etiqueta}: la tabla necesita columnas y filas`);
    else filas.forEach((fila, i) => {
      if (fila.length !== columnas.length) {
        fallo(`${etiqueta}: la fila ${i + 1} de la tabla tiene ${fila.length} celdas y hay ${columnas.length} columnas`);
      }
    });
  }
});
revisarCodigosUnicos(fichas, "fichas.json");

figuras.forEach((f) => {
  const etiqueta = `figura ${f.codigo || f.nombre || "sin nombre"}`;
  revisarCampos(f, etiqueta, ["codigo", "nombre", "tipo", "queEs", "comoSeReconoce", "comoRecordarla"]);
  if (!(f.ejemplos || []).length && !f.ejemplo) fallo(`${etiqueta}: no tiene ningún ejemplo`);
  revisarTexto(f, etiqueta);
});
revisarCodigosUnicos(figuras, "figuras.json");

normas.forEach((n) => {
  const etiqueta = `norma ${n.codigo || n.nombre || "sin nombre"}`;
  revisarCampos(n, etiqueta, ["codigo", "nombre", "tipo", "paraQue", "reglas", "comoAplicarla"]);
  (n.reglas || []).forEach((r, i) => {
    if (!r.regla || !r.cuando) fallo(`${etiqueta}: la regla ${i + 1} necesita regla y cuando`);
  });
  revisarTexto(n, etiqueta);
});
revisarCodigosUnicos(normas, "normas.json");

movimientos.forEach((m) => {
  const etiqueta = `corriente ${m.codigo || m.nombre || "sin nombre"}`;
  revisarCampos(m, etiqueta, ["codigo", "nombre", "periodo", "ambito", "contexto", "rasgos", "autores", "comoReconocerlo"]);
  (m.autores || []).forEach((a) => {
    if (!a.nombre) fallo(`${etiqueta}: hay un autor sin nombre`);
  });
  revisarTexto(m, etiqueta);
});
revisarCodigosUnicos(movimientos, "movimientos.json");

glosario.forEach((t) => {
  const etiqueta = `término ${t.termino || "sin nombre"}`;
  revisarCampos(t, etiqueta, ["termino", "definicion", "categoria"]);
  revisarTexto(t, etiqueta);
});
const terminosVistos = new Set();
glosario.forEach((t) => {
  const clave = (t.termino || "").toLowerCase();
  if (terminosVistos.has(clave)) fallo(`glosario.json: el término "${t.termino}" está repetido`);
  terminosVistos.add(clave);
});

temas.forEach((t) => {
  const etiqueta = `tema ${t.codigo || "sin código"}`;
  revisarCampos(t, etiqueta, ["codigo", "titulo", "area", "resumen", "secciones", "puntosClave"]);
  revisarValor(t, "area", AREAS, etiqueta);
  (t.secciones || []).forEach((s, i) => {
    if (!s.encabezado || !(s.parrafos || []).length) {
      fallo(`${etiqueta}: la sección ${i + 1} necesita encabezado y párrafos`);
    }
  });
  revisarTexto(t, etiqueta);
});
revisarCodigosUnicos(temas, "temas.json");

/* Los ejercicios son un solo documento con los cuatro bancos dentro */
const banco = Array.isArray(ejercicios) ? ejercicios[0] || {} : ejercicios;
const CLASES = ["sustantivo", "verbo", "adjetivo", "determinante", "pronombre",
  "adverbio", "preposición", "conjunción", "interjección"];

(banco.analisis || []).forEach((ej, n) => {
  const etiqueta = `ejercicio de análisis ${n + 1}`;
  if (!ej.oracion || !(ej.palabras || []).length) { fallo(`${etiqueta}: necesita oración y palabras`); return; }
  ej.palabras.forEach((p) => {
    if (!p.texto) fallo(`${etiqueta}: hay una palabra sin texto`);
    if (!CLASES.includes(p.clase)) fallo(`${etiqueta}: "${p.texto}" tiene la clase "${p.clase}", que no existe`);
  });
  // Las palabras del ejercicio deben coincidir con las de la oración
  const enOracion = ej.oracion.match(/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+/g) || [];
  if (enOracion.length !== ej.palabras.length) {
    aviso(`${etiqueta}: la oración tiene ${enOracion.length} palabras y el ejercicio lista ${ej.palabras.length}`);
  }
});

(banco.sujetoPredicado || []).forEach((ej, n) => {
  const etiqueta = `ejercicio de sujeto y predicado ${n + 1}`;
  if (!ej.oracion || !(ej.palabras || []).length) { fallo(`${etiqueta}: necesita oración y palabras`); return; }
  const i = ej.inicioPredicado;
  if (typeof i !== "number" || i <= 0 || i >= ej.palabras.length) {
    fallo(`${etiqueta}: inicioPredicado vale ${i} y debe estar entre 1 y ${ej.palabras.length - 1}`);
  }
});

(banco.ortografia || []).forEach((ej, n) => {
  const etiqueta = `par de ortografía ${n + 1}`;
  if (!ej.correcta || !ej.incorrecta) { fallo(`${etiqueta}: necesita correcta e incorrecta`); return; }
  if (ej.correcta === ej.incorrecta) fallo(`${etiqueta}: las dos opciones son iguales ("${ej.correcta}")`);
  if (!ej.regla) aviso(`${etiqueta}: no explica la regla`);
  if (ej.contexto && !ej.contexto.includes("___")) {
    aviso(`${etiqueta}: el contexto no tiene el hueco ___`);
  }
});

(banco.acentuacion || []).forEach((ej, n) => {
  const palabra = typeof ej === "string" ? ej : ej.palabra;
  if (!palabra) fallo(`palabra de acentuación ${n + 1}: está vacía`);
});

/* Los archivos del motor (lexico.json y verbos.json) se revisan aparte,
   porque sus reglas son otras: claves obligatorias y listas sin repetidos,
   no campos de contenido */
require("./validarMotor")(leer, fallo, aviso);

/* Páginas estáticas: cada documento debe tener su página y el <h1>, lo único que se lee por ser barato, debe coincidir con el título. */
const aHtml = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
for (const col of JSON.parse(fs.readFileSync(path.join(RAIZ, "seo.json"), "utf8")).colecciones) {
  if (!fs.existsSync(path.join(RAIZ, col.ruta, "index.html"))) fallo(`${col.ruta}/index.html no existe: falta regenerar con npm run seo`);
  for (const doc of leer(col.archivo + ".json") || []) {
    const ruta = path.join(RAIZ, col.ruta, `${doc.codigo}.html`);
    if (typeof doc[col.titulo] !== "string" || !fs.existsSync(ruta)) { fallo(`${col.ruta}/${doc.codigo}.html: falta la página o el campo de título "${col.titulo}" del dato; regenerar con npm run seo`); continue; }
    if (aHtml(doc[col.titulo]) !== (/<h1>(.*?)<\/h1>/.exec(fs.readFileSync(ruta, "utf8")) || [])[1]) fallo(`${col.ruta}/${doc.codigo}.html: el <h1> no coincide con el título del dato`);
  }
}

/* ------------------------------------------------------------
   Resumen
   ------------------------------------------------------------ */

const total = fichas.length + figuras.length + normas.length + movimientos.length +
  glosario.length + temas.length;

console.log(`\nRevisados ${total} documentos:`);
console.log(`  fichas ${fichas.length} · figuras ${figuras.length} · normas ${normas.length} · ` +
  `corrientes ${movimientos.length} · términos ${glosario.length} · temas ${temas.length}`);
console.log(`  ejercicios: ${(banco.analisis || []).length} de análisis, ` +
  `${(banco.sujetoPredicado || []).length} de sujeto y predicado, ` +
  `${(banco.ortografia || []).length} de ortografía, ` +
  `${(banco.acentuacion || []).length} de acentuación`);

if (avisos.length) {
  console.log(`\n${avisos.length} aviso${avisos.length === 1 ? "" : "s"}:`);
  avisos.forEach((a) => console.log("  · " + a));
}

if (errores.length) {
  console.log(`\n${errores.length} error${errores.length === 1 ? "" : "es"}:`);
  errores.forEach((e) => console.log("  ✗ " + e));
  console.log("");
  process.exit(1);
}

console.log("\n✔ Todo el contenido cumple las convenciones del proyecto.\n");
