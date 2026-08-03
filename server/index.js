/* ============================================================
   Atlas de Lengua y Literatura · Servidor
   Autor: Jeshua Romero Guadarrama
   ------------------------------------------------------------
   Sirve la aplicación web y expone la API conectada a MongoDB.
   Si MongoDB no está disponible, la API sigue funcionando
   leyendo los archivos JSON de la carpeta data/.
   ============================================================ */

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");
const { COLECCIONES, CAMPOS_BUSQUEDA, FILTROS } = require("./colecciones.js");

const PUERTO = process.env.PORT || 3000;
const URI_MONGO = process.env.MONGO_URI || "mongodb://localhost:27017";
const NOMBRE_BD = process.env.MONGO_DB || "atlas_lengua_literatura";
const RAIZ = path.join(__dirname, "..");

const app = express();
app.use(express.json());

let bd = null; // conexión a MongoDB (null si no está disponible)

/* ---------- Respaldo en archivos ----------
   Las colecciones y sus campos viven en colecciones.js, que comparten este
   servidor y la carga de la base de datos. */

function leerJsonOpcional(nombre) {
  try {
    return JSON.parse(fs.readFileSync(path.join(RAIZ, "data", nombre), "utf8"));
  } catch (err) {
    return [];
  }
}

const RESPALDO = {};
for (const nombre of COLECCIONES) {
  RESPALDO[nombre] = leerJsonOpcional(`${nombre}.json`);
}

/* ---------- Conexión y siembra de MongoDB ---------- */

async function conectarMongo() {
  const cliente = new MongoClient(URI_MONGO, { serverSelectionTimeoutMS: 5000 });
  await cliente.connect();
  bd = cliente.db(NOMBRE_BD);

  // Se compara una huella del contenido, no solo el número de documentos:
  // así, si se edita el texto de una ficha sin cambiar cuántas hay, la base
  // también se actualiza.
  for (const nombre of COLECCIONES) {
    if (!RESPALDO[nombre].length) continue;
    const huella = crypto.createHash("sha1").update(JSON.stringify(RESPALDO[nombre])).digest("hex");
    const marca = await bd.collection("_huellas").findOne({ _id: nombre });
    if (marca && marca.huella === huella) continue;

    await bd.collection(nombre).deleteMany({});
    await bd.collection(nombre).insertMany(RESPALDO[nombre]);
    await bd.collection("_huellas").updateOne(
      { _id: nombre },
      { $set: { huella, actualizado: new Date() } },
      { upsert: true }
    );
    console.log(`  ✔ Colección "${nombre}": ${RESPALDO[nombre].length} documentos cargados`);
  }

  await bd.collection("fichas").createIndex(
    { titulo: "text", definicion: "text", explicacion: "text", perla: "text", etiquetas: "text" },
    { default_language: "spanish", name: "busqueda_texto" }
  );
  await bd.collection("fichas").createIndex({ area: 1, nivel: 1 });

  console.log(`✅ MongoDB conectado (base de datos "${NOMBRE_BD}")`);
}

/* ---------- Búsqueda sin acentos ---------- */

function normalizar(texto) {
  // La eñe se aparta con un centinela antes de descomponer: NFD la separa
  // en ene más virgulilla (dentro del rango que se borra) y sin esta guarda
  // el servidor igualaría año con ano, cuando el buscador del cliente los
  // distingue porque su normalización conserva la eñe. El centinela U+0000
  // no puede venir en un JSON leído de disco, así que no colisiona.
  return (texto || "").toLowerCase()
    .replace(/ñ/g, "\u0000")
    .normalize("NFD")
    // El rango U+0300 a U+036F son los signos diacríticos que la
    // descomposición NFD separa de su letra, tildes incluidas.
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0000/g, "ñ");
}

function textoDe(documento, campos) {
  return campos.map((c) => JSON.stringify(documento[c] || "")).join(" ");
}

function filtrar(documentos, coleccion, consulta) {
  const { q } = consulta;
  let salida = documentos;

  (FILTROS[coleccion] || []).forEach((campo) => {
    const valor = consulta[campo];
    if (valor && !/^Tod[oa]s$/.test(valor)) salida = salida.filter((d) => d[campo] === valor);
  });

  if (q) {
    const partes = normalizar(q).split(/\s+/).filter(Boolean);
    salida = salida.filter((d) => {
      const texto = normalizar(textoDe(d, CAMPOS_BUSQUEDA[coleccion] || []));
      return partes.every((p) => texto.includes(p));
    });
  }
  return salida;
}

/* ============================================================
   API
   ============================================================ */

app.get("/api/estado", (req, res) => {
  res.json({
    ok: true,
    origen: bd ? "mongodb" : "archivos",
    baseDeDatos: bd ? NOMBRE_BD : null,
    totales: Object.fromEntries(COLECCIONES.map((c) => [c, RESPALDO[c].length]))
  });
});

// Una ruta por colección, todas con la misma forma
COLECCIONES.forEach((nombre) => {
  app.get(`/api/${nombre}`, async (req, res) => {
    try {
      let documentos = RESPALDO[nombre];
      if (bd) {
        const desdeMongo = await bd.collection(nombre).find({}).project({ _id: 0 }).toArray();
        if (desdeMongo.length) documentos = desdeMongo;
      }
      res.json(filtrar(documentos, nombre, req.query));
    } catch (err) {
      console.error(`Error en /api/${nombre}:`, err.message);
      res.json(RESPALDO[nombre]);
    }
  });
});

// Una ficha concreta por su código
app.get("/api/fichas/:codigo", async (req, res) => {
  try {
    if (bd) {
      const ficha = await bd.collection("fichas").findOne({ codigo: req.params.codigo }, { projection: { _id: 0 } });
      if (ficha) return res.json(ficha);
    }
    const ficha = RESPALDO.fichas.find((f) => f.codigo === req.params.codigo);
    if (!ficha) return res.status(404).json({ error: "Ficha no encontrada" });
    res.json(ficha);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/filtros", (req, res) => {
  const distintos = (lista, campo) => [...new Set(lista.map((d) => d[campo]).filter(Boolean))].sort();
  res.json({
    areas: ["Todas", ...distintos(RESPALDO.fichas, "area")],
    niveles: ["Todos", ...distintos(RESPALDO.fichas, "nivel")],
    tiposDeFigura: ["Todos", ...distintos(RESPALDO.figuras, "tipo")],
    tiposDeNorma: ["Todos", ...distintos(RESPALDO.normas, "tipo")],
    ambitos: ["Todos", ...distintos(RESPALDO.movimientos, "ambito")]
  });
});

/* ---------- Archivos estáticos ---------- */
// El HTML, el CSS y el JS no se cachean, para que al editar el contenido el
// navegador nunca muestre una versión antigua.
app.use(express.static(RAIZ, {
  index: "index.html",
  setHeaders(res, ruta) {
    if (/\.(html|css|js|json)$/i.test(ruta)) {
      res.setHeader("Cache-Control", "no-store, must-revalidate");
    }
  }
}));

/* ---------- Arranque ---------- */
(async () => {
  try {
    await conectarMongo();
  } catch (err) {
    console.warn(`⚠️  MongoDB no disponible (${err.message}).`);
    console.warn("   La aplicación funcionará leyendo los archivos de data/.");
  }
  app.listen(PUERTO, () => {
    console.log(`\n📚 Atlas de Lengua y Literatura escuchando en http://localhost:${PUERTO}`);
    console.log(`   Fichas: ${RESPALDO.fichas.length} · Figuras: ${RESPALDO.figuras.length} · ` +
      `Normas: ${RESPALDO.normas.length} · Corrientes: ${RESPALDO.movimientos.length}\n`);
  });
})();
