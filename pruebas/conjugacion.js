/*
 * Pruebas del conjugador con formas declaradas a mano.
 * Cada forma esperada está escrita tal como la recogen las tablas académicas del español, no generada con el propio motor, de modo que un cambio de conducta del conjugador se nota aquí de inmediato.
 * Se cubren los auxiliares y los irregulares de más uso, un regular de cada conjugación, los cambios ortográficos de buscar y de llegar, y la alternancia vocálica de pedir y de dormir.
 */

const FORMAS = {
  ser: {
    presenteIndicativo: ["soy", "eres", "es", "somos", "sois", "son"],
    copreterito: ["era", "eras", "era", "éramos", "erais", "eran"],
    preterito: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    futuro: ["seré", "serás", "será", "seremos", "seréis", "serán"],
    participio: "sido"
  },
  estar: {
    presenteIndicativo: ["estoy", "estás", "está", "estamos", "estáis", "están"],
    preterito: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"],
    futuro: ["estaré", "estarás", "estará", "estaremos", "estaréis", "estarán"],
    participio: "estado"
  },
  haber: {
    presenteIndicativo: ["he", "has", "ha", "hemos", "habéis", "han"],
    preterito: ["hube", "hubiste", "hubo", "hubimos", "hubisteis", "hubieron"],
    futuro: ["habré", "habrás", "habrá", "habremos", "habréis", "habrán"],
    participio: "habido"
  },
  ir: {
    presenteIndicativo: ["voy", "vas", "va", "vamos", "vais", "van"],
    copreterito: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"],
    preterito: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    futuro: ["iré", "irás", "irá", "iremos", "iréis", "irán"],
    participio: "ido",
    gerundio: "yendo"
  },
  tener: {
    presenteIndicativo: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
    preterito: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
    futuro: ["tendré", "tendrás", "tendrá", "tendremos", "tendréis", "tendrán"],
    participio: "tenido"
  },
  hacer: {
    presenteIndicativo: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
    // La tercera persona cambia la c por z, porque hico no existe: la forma correcta es hizo.
    preterito: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
    futuro: ["haré", "harás", "hará", "haremos", "haréis", "harán"],
    participio: "hecho"
  },
  poder: {
    presenteIndicativo: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
    preterito: ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"],
    futuro: ["podré", "podrás", "podrá", "podremos", "podréis", "podrán"],
    participio: "podido",
    gerundio: "pudiendo"
  },
  querer: {
    presenteIndicativo: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
    preterito: ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"],
    futuro: ["querré", "querrás", "querrá", "querremos", "querréis", "querrán"],
    participio: "querido"
  },
  cantar: {
    presenteIndicativo: ["canto", "cantas", "canta", "cantamos", "cantáis", "cantan"],
    preterito: ["canté", "cantaste", "cantó", "cantamos", "cantasteis", "cantaron"],
    futuro: ["cantaré", "cantarás", "cantará", "cantaremos", "cantaréis", "cantarán"],
    participio: "cantado"
  },
  comer: {
    presenteIndicativo: ["como", "comes", "come", "comemos", "coméis", "comen"],
    preterito: ["comí", "comiste", "comió", "comimos", "comisteis", "comieron"],
    futuro: ["comeré", "comerás", "comerá", "comeremos", "comeréis", "comerán"],
    participio: "comido"
  },
  vivir: {
    presenteIndicativo: ["vivo", "vives", "vive", "vivimos", "vivís", "viven"],
    preterito: ["viví", "viviste", "vivió", "vivimos", "vivisteis", "vivieron"],
    futuro: ["viviré", "vivirás", "vivirá", "viviremos", "viviréis", "vivirán"],
    participio: "vivido"
  },
  buscar: {
    presenteIndicativo: ["busco", "buscas", "busca", "buscamos", "buscáis", "buscan"],
    // Delante de e la c se escribe qu, así que la primera persona es busqué y no buscé.
    preterito: ["busqué", "buscaste", "buscó", "buscamos", "buscasteis", "buscaron"],
    presenteSubjuntivo: ["busque", "busques", "busque", "busquemos", "busquéis", "busquen"],
    participio: "buscado"
  },
  llegar: {
    // Delante de e la g toma una u de apoyo, así que la primera persona es llegué y no llegé.
    preterito: ["llegué", "llegaste", "llegó", "llegamos", "llegasteis", "llegaron"],
    presenteSubjuntivo: ["llegue", "llegues", "llegue", "lleguemos", "lleguéis", "lleguen"],
    futuro: ["llegaré", "llegarás", "llegará", "llegaremos", "llegaréis", "llegarán"],
    participio: "llegado"
  },
  pedir: {
    // La e de la raíz pasa a i en las formas fuertes y en las débiles de los verbos en ir.
    presenteIndicativo: ["pido", "pides", "pide", "pedimos", "pedís", "piden"],
    preterito: ["pedí", "pediste", "pidió", "pedimos", "pedisteis", "pidieron"],
    presenteSubjuntivo: ["pida", "pidas", "pida", "pidamos", "pidáis", "pidan"],
    futuro: ["pediré", "pedirás", "pedirá", "pediremos", "pediréis", "pedirán"],
    participio: "pedido",
    gerundio: "pidiendo"
  },
  dormir: {
    // La o diptonga en ue cuando lleva el acento y pasa a u en las formas débiles.
    presenteIndicativo: ["duermo", "duermes", "duerme", "dormimos", "dormís", "duermen"],
    preterito: ["dormí", "dormiste", "durmió", "dormimos", "dormisteis", "durmieron"],
    presenteSubjuntivo: ["duerma", "duermas", "duerma", "durmamos", "durmáis", "duerman"],
    participio: "dormido",
    gerundio: "durmiendo"
  }
};

// Personas cortas para nombrar cada comprobación de forma legible.
const PERSONAS = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];

module.exports = function (motor, s) {
  s.suite("Conjugación con formas declaradas a mano");

  Object.entries(FORMAS).forEach(([infinitivo, tiempos]) => {
    const c = motor.conjugador.conjugar(infinitivo);
    s.comprobar(`${infinitivo} se reconoce como verbo`, Boolean(c), true);
    if (!c) return;

    Object.entries(tiempos).forEach(([tiempo, esperado]) => {
      if (tiempo === "participio") {
        s.comprobar(`participio de ${infinitivo}`, c.participio, esperado);
      } else if (tiempo === "gerundio") {
        s.comprobar(`gerundio de ${infinitivo}`, c.gerundio, esperado);
      } else {
        esperado.forEach((forma, persona) => {
          s.comprobar(`${infinitivo}, ${tiempo}, ${PERSONAS[persona]}`, c.forma(tiempo, persona), forma);
        });
      }
    });
  });

  // El imperativo de los irregulares de más uso, que es donde el modelo regular más se equivoca.
  s.comprobar("imperativo de tener para tú", motor.conjugador.conjugar("tener").forma("imperativoAfirmativo", 1), "ten");
  s.comprobar("imperativo de hacer para tú", motor.conjugador.conjugar("hacer").forma("imperativoAfirmativo", 1), "haz");
  s.comprobar("imperativo de ir para tú", motor.conjugador.conjugar("ir").forma("imperativoAfirmativo", 1), "ve");

  // La herencia por prefijo: mantener toma los rasgos de tener y acentúa su imperativo.
  s.comprobar("mantener hereda el pretérito fuerte de tener",
    motor.conjugador.conjugar("mantener").forma("preterito", 0), "mantuve");
  s.comprobar("el imperativo heredado se acentúa como aguda",
    motor.conjugador.conjugar("mantener").forma("imperativoAfirmativo", 1), "mantén");

  // Lo que no es un verbo debe devolver null en lugar de una conjugación inventada.
  s.comprobar("una palabra sin terminación verbal no se conjuga", motor.conjugador.conjugar("mesa"), null);
};
