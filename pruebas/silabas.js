/*
 * Pruebas del silabeador y del acentuador con palabras declaradas a mano.
 * Cada separación y cada sílaba tónica están escritas según las reglas ortográficas del español, no generadas con el propio motor.
 */

// Separaciones esperadas: diptongos, hiatos, grupos inseparables y grupos de tres y cuatro consonantes.
const SEPARACIONES = {
  casa: ["ca", "sa"],
  camión: ["ca", "mión"],
  águila: ["á", "gui", "la"],
  buey: ["buey"],
  construir: ["cons", "truir"],
  ahínco: ["a", "hín", "co"],
  reír: ["re", "ír"],
  leer: ["le", "er"],
  paraguas: ["pa", "ra", "guas"],
  murciélago: ["mur", "cié", "la", "go"],
  transporte: ["trans", "por", "te"],
  árbol: ["ár", "bol"],
  examen: ["e", "xa", "men"]
};

/*
 * Acentuación esperada: el índice señala la sílaba tónica dentro de la separación de arriba.
 * El campo tilde dice si la palabra debe llevar tilde escrita según la regla que le toca.
 */
const ACENTOS = {
  casa: { tipo: "grave o llana", tonica: 0, tilde: false },
  camión: { tipo: "aguda", tonica: 1, tilde: true },
  águila: { tipo: "esdrújula", tonica: 0, tilde: true },
  construir: { tipo: "aguda", tonica: 1, tilde: false },
  // La i tónica junto a la a forma hiato, así que la tilde es obligatoria aunque la palabra sea llana.
  ahínco: { tipo: "grave o llana", tonica: 1, tilde: true },
  reír: { tipo: "aguda", tonica: 1, tilde: true },
  paraguas: { tipo: "grave o llana", tonica: 1, tilde: false },
  árbol: { tipo: "grave o llana", tonica: 0, tilde: true },
  examen: { tipo: "grave o llana", tonica: 1, tilde: false }
};

module.exports = function (motor, s) {
  const { Silabeador, Acentuador } = motor.contexto;

  s.suite("Separación en sílabas");

  Object.entries(SEPARACIONES).forEach(([palabra, esperado]) => {
    s.comprobar(`separación de ${palabra}`, Silabeador.separar(palabra), esperado);
  });

  s.suite("Sílaba tónica y tilde");

  Object.entries(ACENTOS).forEach(([palabra, esperado]) => {
    const acento = Acentuador.analizar(palabra);
    s.comprobar(`${palabra} es ${esperado.tipo}`, acento.tipo, esperado.tipo);
    s.comprobar(`la tónica de ${palabra}`, acento.indiceTonica, esperado.tonica);
    s.comprobar(`la tilde de ${palabra}`, acento.debeLlevarTilde, esperado.tilde);
  });

  // Las monosílabas no se acentúan salvo por tilde diacrítica, y buey además agrupa un triptongo entero.
  const buey = Acentuador.analizar("buey");
  s.comprobar("buey es monosílaba", buey.silabas.length, 1);
  s.comprobar("buey no lleva tilde", buey.debeLlevarTilde, false);
};
