/*
 * Orquestador de las pruebas del motor lingüístico.
 * Se ejecuta con node pruebas/todas.js desde la raíz, o con npm run probar desde la carpeta server.
 * No usa nada fuera de Node, así que corre en cualquier equipo con el repositorio recién clonado.
 */

const soporte = require("./soporte.js");

// El montaje es asíncrono porque los módulos ES del cliente solo se cargan con import dinámico.
(async () => {
  const motor = await soporte.montarMotor();
  require("./conjugacion.js")(motor, soporte);
  require("./analisis.js")(motor, soporte);
  require("./silabas.js")(motor, soporte);
  process.exit(soporte.terminar());
})().catch((error) => {
  console.error("Las pruebas no pudieron ni cargarse:", error);
  process.exit(1);
});
