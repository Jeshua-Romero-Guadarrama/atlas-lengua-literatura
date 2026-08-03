/*
 * Soporte compartido de las pruebas del motor lingüístico.
 * Reúne el contador de comprobaciones y la carga de las clases del navegador, para que cada suite declare solo sus casos.
 * Los valores esperados de todas las suites se escriben a mano razonando la gramática, nunca copiando lo que responde el motor.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const RAIZ = path.join(__dirname, "..");

/* ---------- Contador de comprobaciones ---------- */

const suites = [];
let actual = null;

function suite(nombre) {
  actual = { nombre, total: 0, fallos: [] };
  suites.push(actual);
}

/*
 * Comprobación de igualdad estructural.
 * Los valores del motor traen prototipos propios, así que antes de comparar se copian a estructuras planas, porque deepStrictEqual distingue los prototipos y marcaría como distinto lo que es igual.
 */
function aplanar(valor) {
  return valor === undefined ? undefined : JSON.parse(JSON.stringify(valor));
}

function comprobar(nombre, obtenido, esperado) {
  actual.total++;
  try {
    assert.deepStrictEqual(aplanar(obtenido), aplanar(esperado));
  } catch {
    actual.fallos.push({ nombre, obtenido, esperado });
  }
}

function terminar() {
  let totales = 0;
  let fallidos = 0;
  console.log("");
  suites.forEach((s) => {
    totales += s.total;
    fallidos += s.fallos.length;
    console.log(`  ${s.fallos.length ? "FALLA" : "pasa"}  ${s.nombre}: ${s.total - s.fallos.length} de ${s.total}`);
    s.fallos.forEach((f) => {
      console.log(`         ${f.nombre}`);
      console.log(`           esperado: ${JSON.stringify(f.esperado)}`);
      console.log(`           obtenido: ${JSON.stringify(f.obtenido)}`);
    });
  });
  console.log(`\n  Total: ${totales - fallidos} de ${totales} comprobaciones\n`);
  return fallidos ? 1 : 0;
}

/* ---------- Carga del motor ---------- */

/*
 * Sustituto mínimo del documento, porque Texto.escapar fabrica un div para escapar marcado.
 * Reproduce el mismo contrato del navegador, es decir, asignar textContent y leer innerHTML escapado.
 */
const documentoMinimo = {
  createElement() {
    return {
      textContent: "",
      get innerHTML() {
        return String(this.textContent)
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
    };
  }
};

// Importa un módulo ES del cliente por su ruta relativa a la raíz del proyecto, porque las pruebas son CommonJS y los módulos del navegador solo se cargan con import dinámico.
function importar(relativa) {
  return import(pathToFileURL(path.join(RAIZ, relativa)).href);
}

/*
 * Las clases del motor son módulos ES, los mismos que resuelve el navegador desde js/main.js, y cada archivo declara sus dependencias con import.
 * Basta con importar las nueve piezas de la cara pública del motor: sus dependencias internas entran solas por el grafo de importaciones.
 * El documento mínimo se instala antes de importar, porque Texto.escapar lo consulta en cuanto una prueba escapa marcado.
 */
async function montarMotor() {
  if (typeof globalThis.document === "undefined") globalThis.document = documentoMinimo;

  const [texto, silabeador, acentuador, modelos, conjugadorM, lexicoM, indiceM, analizadorM, nodo] =
    await Promise.all([
      importar("js/nucleo/Texto.js"),
      importar("js/nucleo/Silabeador.js"),
      importar("js/nucleo/Acentuador.js"),
      importar("js/verbos/ModelosVerbales.js"),
      importar("js/verbos/Conjugador.js"),
      importar("js/analisis/Lexico.js"),
      importar("js/verbos/IndiceVerbal.js"),
      importar("js/analisis/Analizador.js"),
      importar("js/analisis/Nodo.js")
    ]);

  // El objeto contexto conserva el nombre y las claves de la etapa de vm, para que las suites no cambien.
  const contexto = {
    Texto: texto.Texto,
    Silabeador: silabeador.Silabeador,
    Acentuador: acentuador.Acentuador,
    ModelosVerbales: modelos.ModelosVerbales,
    Conjugador: conjugadorM.Conjugador,
    Lexico: lexicoM.Lexico,
    IndiceVerbal: indiceM.IndiceVerbal,
    Analizador: analizadorM.Analizador,
    Nodo: nodo.Nodo
  };

  // El motor se arma con los mismos datos reales que usa la aplicación al arrancar.
  const verbos = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "verbos.json"), "utf8"));
  const lexicoDatos = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "lexico.json"), "utf8"));
  const conjugador = new contexto.Conjugador(verbos);
  const lexico = new contexto.Lexico(lexicoDatos);
  const indiceVerbal = new contexto.IndiceVerbal(conjugador).construir(lexico.verbos);
  const analizador = new contexto.Analizador(lexico, indiceVerbal);

  return { contexto, conjugador, lexico, indiceVerbal, analizador };
}

module.exports = { suite, comprobar, terminar, montarMotor };
