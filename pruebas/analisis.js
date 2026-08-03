/*
 * Pruebas del analizador sintáctico con oraciones y funciones declaradas a mano.
 * Cada oración lleva escrito lo que un análisis correcto debe encontrar, es decir, su sujeto, su predicado y sus complementos clave, tal como se resolverían en la pizarra.
 * Se empieza por lo simple y se sube hasta la pasiva, la copulativa con atributo, el complemento indirecto y las oraciones compuestas.
 */

module.exports = function (motor, s) {
  const analizar = (texto) => motor.analizador.analizar(texto);

  // Texto del primer nodo del árbol que cumple la función pedida, o null si no existe.
  const funcion = (analisis, nombre) => {
    const nodo = analisis.arbol.buscar(nombre);
    return nodo ? nodo.texto : null;
  };

  // El núcleo del predicado se busca dentro del nodo Predicado, porque el sujeto también tiene su propio núcleo.
  const nucleoVerbal = (analisis) => {
    const predicado = analisis.arbol.buscar("Predicado");
    return predicado ? predicado.hijos.find((h) => h.funcion === "Núcleo") : null;
  };

  s.suite("Análisis de oraciones simples");

  const perro = analizar("El perro come carne.");
  s.comprobar("sujeto de la transitiva básica", funcion(perro, "Sujeto"), "El perro");
  s.comprobar("predicado de la transitiva básica", funcion(perro, "Predicado"), "come carne");
  s.comprobar("el complemento directo sin preposición", funcion(perro, "CD"), "carne");
  s.comprobar("se clasifica como oración simple", perro.rasgo("Por su estructura"), "Oración simple");
  s.comprobar("se clasifica como transitiva", perro.rasgo("Por el complemento directo"), "Transitiva");

  const maria = analizar("María canta.");
  s.comprobar("el nombre propio hace de sujeto", funcion(maria, "Sujeto"), "María");
  s.comprobar("sin complemento directo es intransitiva", maria.rasgo("Por el complemento directo"), "Intransitiva");

  const cancion = analizar("María canta una canción.");
  s.comprobar("el complemento directo con determinante", funcion(cancion, "CD"), "una canción");

  s.suite("Atributo y complementos del predicado");

  const contento = analizar("El niño está contento.");
  s.comprobar("el adjetivo con copulativo es atributo", funcion(contento, "Atributo"), "contento");
  s.comprobar("el predicado con copulativo es nominal", contento.rasgo("Por el predicado"), "Predicado nominal (atributiva)");

  const inteligente = analizar("Mi hermana es muy inteligente.");
  s.comprobar("el atributo absorbe el adverbio de grado", funcion(inteligente, "Atributo"), "muy inteligente");

  const carta = analizar("María escribió una carta a su abuela.");
  s.comprobar("el complemento directo va primero", funcion(carta, "CD"), "una carta");
  s.comprobar("a más destinatario es complemento indirecto", funcion(carta, "CI"), "a su abuela");

  const visita = analizar("María visita a su abuela.");
  s.comprobar("el directo de persona lleva preposición", funcion(visita, "CD"), "a su abuela");

  const parque = analizar("Los niños juegan en el parque.");
  s.comprobar("sujeto plural con verbo de diptongo", funcion(parque, "Sujeto"), "Los niños");
  s.comprobar("en más lugar es circunstancial de lugar", funcion(parque, "CC de lugar"), "en el parque");

  const alegria = analizar("El niño come con alegría.");
  s.comprobar("con más nombre abstracto es de modo", funcion(alegria, "CC de modo"), "con alegría");

  const amiga = analizar("María baila con su amiga.");
  s.comprobar("con más ser animado es de compañía", funcion(amiga, "CC de compañía"), "con su amiga");

  s.suite("Pasiva, impersonales y sujeto pospuesto");

  const pasiva = analizar("La carta fue escrita por María.");
  s.comprobar("el sujeto paciente de la pasiva", funcion(pasiva, "Sujeto"), "La carta");
  s.comprobar("por más agente es complemento agente", funcion(pasiva, "C. agente"), "por María");
  s.comprobar("la voz se clasifica como pasiva", pasiva.rasgo("Por la voz"), "Pasiva");
  s.comprobar("el sujeto se clasifica como paciente", pasiva.rasgo("Por el sujeto"), "Sujeto paciente");

  const llovio = analizar("Ayer llovió mucho.");
  s.comprobar("llover no admite sujeto", llovio.rasgo("Por el sujeto"), "Impersonal (sin sujeto)");
  s.comprobar("el adverbio adelantado es de tiempo", funcion(llovio, "CC de tiempo"), "Ayer");
  s.comprobar("el adverbio pospuesto es de cantidad", funcion(llovio, "CC de cantidad"), "mucho");

  const hay = analizar("Hay flores en el jardín.");
  s.comprobar("haber existencial es impersonal", hay.rasgo("Por el sujeto"), "Impersonal (sin sujeto)");
  s.comprobar("lo que hay es el complemento directo", funcion(hay, "CD"), "flores");
  s.comprobar("el circunstancial de lugar del jardín", funcion(hay, "CC de lugar"), "en el jardín");

  const gustan = analizar("Me gustan los libros.");
  s.comprobar("con gustar el sujeto va detrás", funcion(gustan, "Sujeto"), "los libros");
  s.comprobar("el pronombre átono queda junto al verbo", funcion(gustan, "CD o CI"), "Me");

  const explicado = analizar("El profesor ha explicado el tema.");
  s.comprobar("haber más participio forman un solo núcleo", nucleoVerbal(explicado).texto, "ha explicado");
  s.comprobar("el núcleo se marca como tiempo compuesto", nucleoVerbal(explicado).tipo, "Verbo en tiempo compuesto");
  s.comprobar("el directo del tiempo compuesto", funcion(explicado, "CD"), "el tema");

  s.suite("Oraciones compuestas");

  const coordinada = analizar("María canta y Pedro baila.");
  s.comprobar("la coordinada tiene dos proposiciones", coordinada.proposiciones.length, 2);
  s.comprobar("la segunda proposición es coordinada copulativa",
    coordinada.proposiciones[1].tipo, "Proposición coordinada copulativa");
  s.comprobar("la estructura es compuesta por coordinación",
    coordinada.rasgo("Por su estructura"), "Oración compuesta por coordinación");

  const completiva = analizar("Quiero que vengas.");
  s.comprobar("la completiva es subordinada sustantiva",
    completiva.proposiciones[1].tipo, "Proposición subordinada sustantiva");
  s.comprobar("la estructura es compuesta por subordinación",
    completiva.rasgo("Por su estructura"), "Oración compuesta por subordinación");
  s.comprobar("el sujeto omitido se deduce del verbo", funcion(completiva, "Sujeto"), "(yo)");

  const relativa = analizar("Los alumnos que estudian aprueban el examen.");
  s.comprobar("la relativa incrustada se separa", relativa.proposiciones.length, 2);
  s.comprobar("la relativa se clasifica como adjetiva",
    relativa.proposiciones[1].tipo, "Proposición subordinada adjetiva o de relativo");
  s.comprobar("el sujeto de la principal queda limpio", funcion(relativa, "Sujeto"), "Los alumnos");
  s.comprobar("el directo de la principal queda limpio", funcion(relativa, "CD"), "el examen");
};
