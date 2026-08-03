/* ============================================================
   Atlas de Lengua y Literatura · Carga de la base de datos
   Autor: Jeshua Romero Guadarrama
   ------------------------------------------------------------
   Vuelca el contenido de data/*.json en MongoDB.
   Uso:  npm run seed
   ============================================================ */

const path = require("path");
const fs = require("fs");
const { MongoClient } = require("mongodb");
// La lista de colecciones vive en colecciones.js, compartida con el servidor.
const { COLECCIONES } = require("./colecciones.js");

const URI_MONGO = process.env.MONGO_URI || "mongodb://localhost:27017";
const NOMBRE_BD = process.env.MONGO_DB || "atlas_lengua_literatura";
const CARPETA_DATOS = path.join(__dirname, "..", "data");

async function main() {
  const cliente = new MongoClient(URI_MONGO, { serverSelectionTimeoutMS: 10000 });
  await cliente.connect();
  const bd = cliente.db(NOMBRE_BD);
  console.log(`Conectado a MongoDB · base de datos "${NOMBRE_BD}"`);

  for (const nombre of COLECCIONES) {
    const ruta = path.join(CARPETA_DATOS, `${nombre}.json`);
    if (!fs.existsSync(ruta)) {
      console.log(`  · ${nombre}: sin archivo, se omite`);
      continue;
    }
    const documentos = JSON.parse(fs.readFileSync(ruta, "utf8"));
    const coleccion = bd.collection(nombre);
    await coleccion.deleteMany({});
    if (documentos.length) await coleccion.insertMany(documentos);
    console.log(`  ✔ ${nombre}: ${documentos.length} documentos cargados`);
  }

  await bd.collection("fichas").createIndex(
    { titulo: "text", definicion: "text", explicacion: "text", perla: "text", etiquetas: "text" },
    { default_language: "spanish", name: "busqueda_texto" }
  );
  await bd.collection("fichas").createIndex({ area: 1, nivel: 1 });
  await bd.collection("fichas").createIndex({ codigo: 1 }, { unique: true });
  console.log("  ✔ Índices creados");

  await cliente.close();
  console.log("Listo.");
}

main().catch((err) => {
  console.error("Error al cargar la base de datos:", err.message);
  process.exit(1);
});
