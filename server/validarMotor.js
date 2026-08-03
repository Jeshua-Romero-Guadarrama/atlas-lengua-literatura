/*
 * Revisión de los archivos del motor: lexico.json y verbos.json.
 * Autor: Jeshua Romero Guadarrama
 *
 * Va separada del validador de contenido porque sus reglas son distintas:
 * aquí no hay fichas con campos, sino listas de palabras y tablas de rasgos.
 *
 * Sin las claves que leen Lexico.js y RasgosVerbales.js el motor no falla:
 * responde mal en silencio (árboles sin clases cerradas y todo verbo tratado
 * como regular), y por eso su ausencia es un error. Los duplicados exactos
 * dentro de una misma lista solo avisan (un conjunto los absorbe, pero son
 * ruido al editar). Los solapes entre listas distintas no se revisan: son
 * legítimos, porque la desambiguación necesita que una palabra pueda estar
 * en varias clases a la vez.
 */

/* Claves que el motor lee. Cada archivo va envuelto en un arreglo de un
   elemento, porque MongoDB guarda documentos y no objetos sueltos. */
const CLAVES_MOTOR = {
  "lexico.json": ["determinantes", "pronombres", "preposiciones", "conjunciones", "adverbios", "verbos"],
  "verbos.json": ["irregulares"]
};

module.exports = function revisarMotor(leer, fallo, aviso) {
  Object.entries(CLAVES_MOTOR).forEach(([archivo, claves]) => {
    const crudo = leer(archivo);
    const doc = (Array.isArray(crudo) ? crudo[0] : crudo) || {};

    claves.forEach((clave) => {
      const v = doc[clave];
      const vacia = Array.isArray(v) ? !v.length : !v || !Object.keys(v).length;
      if (vacia) fallo(`${archivo}: falta la clave ${clave} o está vacía, y el motor la necesita`);
    });

    // Se recorren tanto las listas de primer nivel como las agrupadas en un
    // objeto (determinantes.articuloDeterminado y similares)
    const listas = Object.entries(doc).flatMap(([clave, v]) => {
      if (Array.isArray(v)) return [[clave, v]];
      if (v && typeof v === "object") {
        return Object.entries(v)
          .filter(([, sub]) => Array.isArray(sub))
          .map(([sub, lista]) => [`${clave}.${sub}`, lista]);
      }
      return [];
    });

    listas.forEach(([ruta, lista]) => {
      const vistos = new Set();
      lista.forEach((palabra) => {
        if (typeof palabra !== "string") return;
        if (vistos.has(palabra)) aviso(`${archivo} en ${ruta}: "${palabra}" está repetido`);
        vistos.add(palabra);
      });
    });
  });
};
