/* ============================================================
   Atlas de Lengua y Literatura · Colecciones del contenido
   ------------------------------------------------------------
   Declaración única de las colecciones y de sus campos, para que
   el servidor y la carga de la base de datos no mantengan listas
   paralelas que ya habían empezado a duplicarse.

   Es un módulo sin dependencias, de modo que cualquier guion del
   servidor puede usarlo sin tener instalado el controlador de
   MongoDB. El cliente declara la misma lista de colecciones en
   js/Repositorio.js porque no puede leer archivos del servidor:
   al añadir una colección hay que tocar los dos sitios.
   ============================================================ */

// Contenido del atlas. Cada colección tiene su archivo en data/ y su ruta en la API.
const COLECCIONES = ["fichas", "figuras", "normas", "movimientos", "glosario", "temas", "ejercicios"];

// Campos por los que se busca en cada colección
const CAMPOS_BUSQUEDA = {
  fichas: ["titulo", "area", "nivel", "categoria", "definicion", "explicacion", "perla", "ejemplos", "comoReconocerlo", "etiquetas"],
  figuras: ["nombre", "tipo", "queEs", "comoSeReconoce", "ejemplos", "comoRecordarla", "etiquetas"],
  normas: ["nombre", "tipo", "paraQue", "reglas", "comoAplicarla", "excepciones", "etiquetas"],
  movimientos: ["nombre", "periodo", "ambito", "contexto", "rasgos", "autores", "comoReconocerlo", "etiquetas"],
  glosario: ["termino", "definicion", "categoria"],
  temas: ["titulo", "area", "resumen", "secciones", "puntosClave"],
  ejercicios: ["codigo"]
};

// Filtros de chips que expone cada colección
const FILTROS = { fichas: ["area", "nivel"], figuras: ["tipo"], normas: ["tipo"], movimientos: ["ambito"] };

module.exports = { COLECCIONES, CAMPOS_BUSQUEDA, FILTROS };
