# 📚 Atlas de Lengua y Literatura

Atlas de estudio de **español para secundaria y preparatoria**. Reúne el temario completo de la materia, un **analizador que desarma cualquier oración en su árbol sintáctico**, un **conjugador de verbos** y **siete juegos** de práctica.

Está pensado para estudiar haciendo: se lee la ficha, se prueba la regla en el analizador y se practica en el juego que le corresponde.

**Funciona sin conexión.** No carga librerías de terceros, no depende de ningún servicio externo y no envía nada a ninguna parte. Todo el código es propio.

---

## Índice

1. [Qué incluye](#1-qué-incluye)
2. [El analizador sintáctico](#2-el-analizador-sintáctico)
3. [El conjugador](#3-el-conjugador)
4. [Los juegos](#4-los-juegos)
5. [Cómo levantarlo](#5-cómo-levantarlo)
6. [Arquitectura](#6-arquitectura)
7. [El modelo de datos](#7-el-modelo-de-datos)
8. [Cómo agregar contenido](#8-cómo-agregar-contenido)
9. [Decisiones de diseño](#9-decisiones-de-diseño)
10. [Convenciones del proyecto](#10-convenciones-del-proyecto)
11. [Pruebas y validación](#11-pruebas-y-validación)
12. [Estado y trabajo pendiente](#12-estado-y-trabajo-pendiente)

---

## 1. Qué incluye

| Sección | Contenido |
|---|---|
| 📖 Temario | Fichas de gramática, sintaxis, ortografía, literatura, léxico, redacción, comprensión y comunicación, con definición, ejemplos, tabla, errores frecuentes y perla |
| 🌳 Analizador | Árbol sintáctico completo, oración pintada por familias de palabra, clasificación de la oración y tabla morfológica |
| 🔤 Conjugador | Cualquier verbo en sus dieciocho tiempos, con el nombre académico y el de Bello, y la explicación de sus irregularidades |
| 🎮 Juegos | Siete: clases de palabra, sujeto y predicado, tiempos verbales, reto de la tilde, ortografía dudosa, figuras retóricas y literatura |
| 🎭 Figuras | Figuras retóricas con su ejemplo y el truco para no confundirlas entre ellas |
| ✍️ Ortografía | Normas de acentuación, letras dudosas, puntuación y otras, con sus reglas y sus excepciones |
| 🏛️ Literatura | Corrientes desde la literatura prehispánica hasta la contemporánea, con sus rasgos, autores y obras |
| 📘 Temas | Artículos de estudio en profundidad |
| 📗 Glosario | Terminología de la materia, organizada por categoría |

**Áreas cubiertas:** gramática, sintaxis, ortografía, literatura, léxico y semántica, expresión y redacción, comprensión lectora y comunicación.

El buscador funciona con o sin acentos (escribir `metafora` encuentra «metáfora») y busca en todo el texto de la ficha, no solo en el título.

---

## 2. El analizador sintáctico

Es la pieza central del atlas. Se escribe una oración y se obtiene:

1. **La oración pintada**, con las palabras agrupadas por familia funcional y su abreviatura debajo.
2. **La clasificación**, por actitud del hablante, estructura, predicado, voz, transitividad y sujeto.
3. **El árbol**, con el sujeto y el predicado y, dentro de este, el núcleo y todos sus complementos. **Cada caja explica por qué se le asignó esa función.**
4. **La tabla morfológica**, con la clase, la subclase y los rasgos de cada palabra.

Hay además un botón para copiar el análisis en texto llano y pegarlo en un trabajo.

### Qué reconoce

Sujeto omitido y pospuesto, oraciones impersonales, voz pasiva con complemento agente, tiempos compuestos, perífrasis verbales modales y aspectuales, complementos de régimen, oraciones de relativo incrustadas, coordinación y subordinación.

### Cómo funciona

El análisis va en siete pasos, y cada uno está en su propia clase:

1. **Tokenizar.** Se parte el texto en palabras, números y signos, y se desdoblan las contracciones `del` y `al` en preposición más artículo.
2. **Generar lecturas.** De cada palabra se obtienen todos sus análisis posibles, cada uno con un peso: las clases cerradas salen del léxico, las formas verbales del índice inverso del conjugador, y el resto de las listas de vocabulario y de las terminaciones típicas.
3. **Desambiguar.** Ocho reglas de contexto ordenadas de la más segura a la más general deciden qué lectura gana. Resuelven, entre otros casos, `la casa` frente a `la veo`, `este libro` frente a `este es mío`, el `que` relativo frente al completivo, y `la casa está limpia`, donde detrás de un verbo conjugado no viene otro verbo conjugado.
4. **Extraer las relativas incrustadas.** En *Los alumnos que estudian aprueban el examen* la relativa se saca aparte y la principal se analiza sin ella, que es exactamente lo que se hace al analizar a mano.
5. **Partir en proposiciones**, por conjunciones y por relativos.
6. **Analizar cada proposición.** Se localiza el núcleo verbal, se forma el grupo verbal con sus clíticos y sus auxiliares, se busca el sujeto delante, se recogen los complementos adelantados y se reparten las funciones de lo que va detrás.
7. **Clasificar** el conjunto.

Funciona con **reglas del español, no con estadística**, y por eso puede explicar cada decisión. Con oraciones de secundaria y preparatoria acierta casi siempre; con oraciones muy largas o muy literarias conviene revisar el resultado, y para eso está la pista de cada nodo.

---

## 3. El conjugador

Conjuga cualquier verbo, incluidos los pronominales (`levantarse`) y los derivados: **`mantener` se conjuga como `tener` sin necesidad de declararlo**, porque los rasgos de irregularidad se heredan por prefijo.

Resuelve solo:

- **Cambios ortográficos.** `buscar` da `busqué`, `llegar` da `llegué`, `empezar` da `empecé`, `coger` da `cojo`, `seguir` da `sigo`, `construir` da `construyo`, `leer` da `leyó`, `averiguar` da `averigüé`.
- **Irregularidades.** Diptongación en las formas fuertes, cambio débil de los verbos en `ir`, pretéritos fuertes, futuros irregulares, participios y gerundios irregulares, primera persona en `zc`.
- **Verbos en `iar` y `uar` con hiato.** `enviar` da `envío`, `continuar` da `continúa`.
- **Colocación del pronombre** en los pronominales, incluidos `sentémonos` y `sentaos`.

Muestra los dieciocho tiempos con sus dos nombres, el académico y el de la nomenclatura de Bello, porque en México se usa el segundo y los libros de texto alternan.

---

## 4. Los juegos

| Juego | Origen de las preguntas |
|---|---|
| Caza la clase de palabra | Ejercicios resueltos a mano |
| Sujeto y predicado | Ejercicios resueltos a mano |
| Tiempos verbales | Generadas con el conjugador, **infinitas** |
| Reto de la tilde | Generadas con el acentuador, **infinitas** |
| Ortografía dudosa | Pares escritos a mano |
| Caza la figura retórica | Contenido del propio atlas |
| Literatura relámpago | Contenido del propio atlas, con tres formas de preguntar |

Todos comparten marcador de aciertos, racha, barra de avance, retroalimentación que explica el porqué y pantalla final con repaso de los fallos. Se manejan con el ratón o con el teclado: los números eligen opción y la tecla Enter avanza.

---

## 5. Cómo levantarlo

### Opción 1. Docker, recomendada

```bash
docker compose up -d --build
```

Abrir **http://localhost:8083**

Levanta dos contenedores, MongoDB y la aplicación. La base se siembra sola con el contenido de `data/` y se recarga cuando ese contenido cambia, porque se compara una huella del texto y no solo el número de documentos. Los datos persisten en un volumen.

Para detenerlo: `docker compose down`, con `-v` si además se quiere borrar la base.

> Si el registro de npm falla dentro del contenedor por una red que intercepta el tráfico TLS, basta ejecutar `npm install` en el equipo antes de construir: el `Dockerfile` reutiliza `server/node_modules` si ya existe.

### Opción 2. Node sin Docker

```bash
cd server
npm install
npm start
```

Abrir **http://localhost:3000**. Si no hay MongoDB corriendo, la aplicación lo detecta y lee directamente los archivos de `data/`, así que funciona igual.

### Opción 3. Servidor estático, sin base de datos

La aplicación necesita servirse por HTTP, porque todos los navegadores bloquean sobre `file://` tanto los módulos de JavaScript como `fetch()`, y con doble clic no arranca. Basta cualquier servidor estático desde la raíz del proyecto:

```bash
npx serve
# o bien
python -m http.server 8000
```

Abrir la dirección que indique el comando. El navegador carga los JSON de `data/` directamente, sin API ni base de datos.

---

## 6. Arquitectura

El código está organizado en clases pequeñas de archivos cortos, ninguno de más de 300 líneas. Los archivos de `js/` son **módulos ES**: `index.html` carga un único `<script type="module">`, que es `js/main.js`, y cada archivo declara sus dependencias con `import`, de modo que el navegador resuelve el orden de carga por su cuenta y el grafo de importaciones sustituye al antiguo listado de etiquetas `<script>` en orden manual. Sigue sin haber ningún paso de construcción: basta cualquier servidor estático.

```
js/
  main.js       El único punto de entrada: registra el service worker y arranca la aplicación
  nucleo/       Texto · Silabeador · Acentuador
  verbos/       ModelosVerbales · RasgosVerbales · OrtografiaVerbal
                Conjugacion · Conjugador · IndiceVerbal
  analisis/     Lexico · Palabra · Etiquetador · Nodo · LectorDeSintagmas
                GrupoVerbal · Complementos · AnalizadorDeProposicion
                ClasificadorDeOracion · Analizador
  juegos/       Pregunta y sus cuatro tipos · Juego · Partida · los siete juegos
  ui/           Componentes · Modal · Cromo · Vista · VistaTemario · VistasDeContenido
                VistaAnalizador · VistaConjugador · VistaJuegos
                MenuLateral · Rutas
  Repositorio.js   único punto de entrada de los datos
  Aplicacion.js    monta todo y conecta la navegación
```

Las hojas de estilo van numeradas por su orden en la cascada, separadas por responsabilidad:

```
css/
  1-base.css        Tokens de color y espacio de los dos temas, reinicio y foco visible
  2-cabecera.css    Cabecera, pestañas y menú lateral
  3-contenido.css   Ancho de las vistas, portada, buscador, chips y contadores
  4-tarjetas.css    Tarjetas de las rejillas, insignias y acentos por área
  5-modales.css     Ventanas de detalle con sus tablas, listas y bloques destacados
  6-secciones.css   Lo propio del analizador, el conjugador y los juegos
  7-interfaz.css    Pie, aurora, paginación, esqueletos y reglas responsivas
  colorimetria.css  El sistema de color del análisis, documentado en su cabecera
  8-impresion.css   Solo para imprimir, cargada con media print
  seo.css           Solo la usan las páginas estáticas de posicionamiento
```

En la raíz vive además `sw.js`, el service worker que deja el armazón disponible sin conexión.

### Direcciones con fragmento

La clase `Rutas` mantiene el fragmento de la dirección sincronizado con lo que se está viendo, con el formato `#/figuras` para una pestaña y `#/figuras/metafora` para una ficha concreta.
Gracias a eso cada ficha tiene un enlace que se puede compartir o guardar, el botón de atrás del navegador cierra la ficha en lugar de salir de la aplicación, y las páginas estáticas de `temario/`, `figuras-retoricas/`, `ortografia/`, `literatura/` y `temas/` enlazan directo a su ficha dentro de la aplicación.
El glosario no tiene código por término, así que su ruta queda en `#/glosario` a secas, igual que `#/juegos`.
Las dos herramientas escriben su consulta en la dirección: analizar una oración deja `#/analizador?frase=...` y conjugar un verbo deja `#/conjugador?verbo=...`, de modo que un profesor puede mandar el enlace de una oración ya analizada y quien lo abre la recibe analizada.
Además, el parámetro `?q=palabra` deja esa búsqueda hecha en el temario al arrancar, que es lo que promete el `SearchAction` declarado en el encabezado del documento.

### Funcionamiento sin conexión

El service worker `sw.js` precachea el armazón, es decir, el documento, las hojas de estilo, `js/main.js` con todos los módulos de `js/` y el manifiesto, en una caché con nombre versionado, `atlas-len-v6`.
Los archivos de `data/*.json` y la API se sirven con caché primero y revalidación en segundo plano: La copia guardada responde al instante y en paralelo la red actualiza la caché para la próxima visita, así que una corrección puede tardar una visita en verse, algo aceptable en contenido educativo estable; el resto va con caché primero.
El registro ocurre solo bajo HTTPS o en localhost, con ruta relativa para respetar el subdirectorio de GitHub Pages.

Para publicar una versión nueva hay que subir el número de la constante `CACHE` en `sw.js`, por ejemplo de `atlas-len-v6` a `atlas-len-v7`, y sumar a la lista de precacheado cualquier archivo del armazón que se haya añadido o renombrado.
El service worker nuevo instala su caché con ese nombre y, al activarse, borra las cachés con nombres anteriores.
Publicar cambios sin cambiar el nombre deja a los visitantes recurrentes con el armazón viejo hasta que el navegador decida revalidar.

### Las tres capas

**Núcleo lingüístico** (`nucleo/`, `verbos/`, `analisis/`). No toca el documento ni sabe que existe un navegador. Se puede cargar en Node y probar por separado, que es como se comprueban las formas verbales y los árboles sintácticos.

**Juegos** (`juegos/`). Dependen del núcleo pero no de la interfaz. Cada tipo de pregunta sabe **pintarse, conectarse a los clics y corregirse a sí mismo**, así que añadir un juego nuevo no obliga a tocar la vista.

**Interfaz** (`ui/`). Cada pestaña es una `Vista`. Las cinco pestañas de contenido heredan de `VistaDeColeccion`, que ya resuelve buscador, filtros, paginación y modal: una vista concreta solo declara qué campos busca, cómo se pinta su tarjeta y qué muestra su modal.

### Clases principales

| Clase | Responsabilidad |
|---|---|
| `Texto` | Utilidades de cadena: normalizar, escapar, mezclar, resaltar, número y género |
| `Silabeador` | Separación silábica, diptongos, triptongos e hiatos |
| `Acentuador` | Sílaba tónica, tipo de palabra y si debe llevar tilde |
| `ModelosVerbales` | Tablas fijas: los dieciocho tiempos, las personas y las terminaciones regulares |
| `RasgosVerbales` | Irregularidades de un verbo y su herencia por prefijo |
| `OrtografiaVerbal` | Cambios de escritura al unir raíz y terminación |
| `Conjugador` | Construye la `Conjugacion` completa de un verbo |
| `IndiceVerbal` | Buscador inverso: de una forma escrita al verbo, tiempo y persona |
| `Lexico` | Envuelve el léxico y responde por clases cerradas, régimen y semántica |
| `Etiquetador` | Genera las lecturas posibles y desambigua por contexto |
| `LectorDeSintagmas` | Agrupa palabras en sintagmas nominales, preposicionales, adjetivales y adverbiales |
| `GrupoVerbal` | Núcleo del predicado: clíticos, tiempos compuestos, pasiva y perífrasis |
| `Complementos` | Reglas que reparten CD, CI, régimen, agente y circunstanciales |
| `AnalizadorDeProposicion` | Analiza un tramo con un solo verbo y monta su árbol |
| `Analizador` | Fachada que coordina el análisis completo |
| `Nodo` | Cada caja del árbol, con su función, su pista y su color |
| `Pregunta` | Base de los cuatro tipos de pregunta de los juegos |
| `Partida` | Marcador de una ronda: aciertos, racha y fallos |
| `Vista` | Base de cada pestaña; `VistaDeColeccion` añade buscador, filtros, paginación y modal |
| `Modal` | Ventana de detalle accesible: trampa de foco, fondo inerte y devolución del foco |
| `Cromo` | Conmutador de tema en tres estados, barra de avance, salto al contenido y volver arriba |
| `MenuLateral` | Panel de secciones que sustituye a la cabecera cuando se retira durante la lectura |
| `Rutas` | Sincroniza el fragmento de la dirección con lo que se está viendo |
| `Repositorio` | Único punto de entrada de los datos, con respaldo a los archivos |
| `Aplicacion` | Monta el motor, las vistas y los juegos, y conecta la navegación |

---

## 7. El modelo de datos

Todo el contenido vive en `data/`, en JSON editable con cualquier editor. **Añadir contenido no obliga a tocar ningún archivo de `js/`.**

| Archivo | Qué guarda |
|---|---|
| `fichas.json` | El temario |
| `figuras.json` | Figuras retóricas |
| `normas.json` | Normas de ortografía |
| `movimientos.json` | Corrientes literarias |
| `glosario.json` | Terminología |
| `temas.json` | Artículos de estudio |
| `ejercicios.json` | Banco de ejercicios de los juegos |
| `lexico.json` | **Motor.** Clases cerradas, vocabulario y régimen preposicional |
| `verbos.json` | **Motor.** Verbos irregulares con sus rasgos |

Los dos últimos no son contenido: alimentan el analizador y el conjugador. Añadir una palabra al léxico mejora el análisis, y añadir un verbo irregular mejora la conjugación.

### La base de datos

MongoDB, base `atlas_lengua_literatura`, una colección por archivo de contenido. Recargarla desde los JSON:

```bash
cd server
npm run seed
```

Consultarla:

```bash
docker exec -it atlas-lengua-literatura-mongo mongosh atlas_lengua_literatura
```

### API

| Ruta | Descripción |
|---|---|
| `GET /api/fichas` | Temario. Acepta `?q=`, `?area=` y `?nivel=` |
| `GET /api/fichas/:codigo` | Una ficha concreta |
| `GET /api/figuras` | Figuras retóricas. Acepta `?q=` y `?tipo=` |
| `GET /api/normas` | Normas de ortografía. Acepta `?q=` y `?tipo=` |
| `GET /api/movimientos` | Corrientes literarias. Acepta `?q=` y `?ambito=` |
| `GET /api/glosario` | Términos. Acepta `?q=` |
| `GET /api/temas` | Artículos de estudio |
| `GET /api/ejercicios` | Banco de ejercicios |
| `GET /api/filtros` | Áreas, niveles, tipos y ámbitos disponibles |
| `GET /api/estado` | Diagnóstico: dice si los datos vienen de MongoDB o de archivos |

---

## 8. Cómo agregar contenido

Se copia una entrada existente, se pega y se cambia el texto. La estructura de una ficha:

```json
{
  "codigo": "identificador-unico-sin-espacios",
  "titulo": "El sustantivo",
  "area": "Gramática",
  "nivel": "Secundaria",
  "dificultad": "Básico",
  "categoria": "Clases de palabras",
  "definicion": "Qué es, en una o dos oraciones...",
  "explicacion": "Cómo funciona, con más detalle...",
  "subclases": [{ "nombre": "Común y propio", "descripcion": "...", "ejemplos": ["..."] }],
  "tabla": { "titulo": "", "columnas": ["", ""], "filas": [["", ""]] },
  "ejemplos": ["La *paciencia* de mi abuela era infinita."],
  "comoReconocerlo": ["Admite un artículo delante."],
  "errores": ["El error que más se repite..."],
  "perla": "El dato que conviene no olvidar...",
  "temaRelacionado": "codigo-de-un-tema",
  "etiquetas": ["palabra1", "palabra2"]
}
```

Lo que va **entre asteriscos** se destaca al pintarlo, y sirve para señalar la palabra concreta de la que habla el ejemplo.

Valores admitidos: `area` es una de las ocho áreas, `nivel` es `Secundaria` o `Preparatoria`, y `dificultad` es `Básico`, `Intermedio` o `Avanzado`.

Después de editar, **pasar el validador** (ver el apartado 11) y recargar la página. Con Docker la base se recarga sola al reiniciar el contenedor.

---

## 9. Decisiones de diseño

Las razones detrás de lo que puede parecer arbitrario.

### El analizador explica, no solo acierta

Cada decisión tiene una regla y una pista visible. Un analizador que acierta sin explicar sirve para corregir tareas; uno que explica sirve para aprender, que es lo que se busca aquí. Por eso no usa estadística: una decisión estadística no se puede discutir en clase.

### Los juegos de análisis no usan el analizador

Los juegos de clases de palabra y de sujeto y predicado leen soluciones escritas a mano en `ejercicios.json`. Si usaran la salida del analizador, un fallo del motor daría por mala una respuesta correcta del estudiante, que es el peor error posible en material didáctico.

Los juegos de tiempos verbales y de la tilde **sí** se generan con el motor, porque ahí está comprobado al cien por ciento y a cambio las preguntas salen infinitas.

### La colorimetría codifica familias, no clases

Nueve clases de palabra no se pueden distinguir por color a la vez: con nueve tonos en pantalla aparecen pares a distancia perceptual ΔE 4, indistinguibles incluso con visión normal. La primera versión del atlas tenía justo ese defecto.

La solución fue dejar de codificar la clase y codificar la **familia funcional**, que además es lo que se quiere enseñar:

| Color | Familia | Clases |
|---|---|---|
| Azul | lo que nombra | sustantivo, determinante, pronombre |
| Naranja | lo que predica | verbo |
| Verde | lo que modifica | adjetivo, adverbio |
| Gris | lo que enlaza | preposición, conjunción, interjección |

Dentro de cada familia, **el trazo distingue la clase**: relleno para el núcleo, contorno para lo que lo acompaña y contorno punteado para lo que lo sustituye. Y encima, cada palabra lleva su abreviatura escrita, de modo que la identidad nunca depende solo del color.

Los cuatro tonos están comprobados a todos los pares en los dos temas: peor separación con daltonismo ΔE 10.0 en claro y 10.1 en oscuro, y con visión normal ΔE 15.4 en los dos. Las cifras y el comando que las reproduce están en la cabecera de `css/colorimetria.css`.

En el árbol, las etiquetas llevan siempre su nombre escrito, así que allí el color solo agrupa. Los complementos se ordenan en una rampa de un solo tono, de más ligado al verbo a menos ligado.

### Los dos nombres de cada tiempo verbal

En México se usa la nomenclatura de Bello (copretérito, pospretérito, antepresente) y en los libros de texto alterna con la académica. Mostrar las dos evita que el estudiante crea que son tiempos distintos.

### `vosotros` aparece aunque no se use en México

Sale en los textos literarios que se leen en clase, así que está en las tablas del conjugador. En el juego de tiempos verbales se salta a propósito, porque practicarlo no aporta nada a un estudiante mexicano.

### Nombres de clase en español

El dominio es el español, y una clase que analiza proposiciones se llama `AnalizadorDeProposicion`. Traducir a medias produce código que no se lee ni en un idioma ni en otro.

---

## 10. Convenciones del proyecto

### Redacción

Se aplican al contenido de `data/`, a los textos de la interfaz, a los comentarios del código y a esta documentación.

- **Sin guion largo ni guion corto.** Donde harían falta se reescribe con un conector, una coma o un paréntesis.
- **Punto decimal, no coma**, siguiendo la convención de México.
- **Mayúscula después de los dos puntos** cuando el signo se conserva. Siempre que se puede se evita el signo reescribiendo con un conector.
- **Paréntesis en lugar de punto y coma** cuando lo que sigue es un matiz. El punto de cierre va fuera del paréntesis.
- **Se explica el porqué, no solo el qué.** Una regla sin su razón no se retiene.
- **Exactitud por encima de cantidad.** Ante la duda sobre una regla se escribe algo más general o se omite.

### Autores y obras

A diferencia de otros atlas de esta familia, aquí **sí se nombran autores y obras**, porque son el objeto de estudio de la materia. Se citan con una línea sobre su aporte, no con una biografía, y con atención expresa a la literatura mexicana e hispanoamericana. No se reproducen textos completos: solo fragmentos breves a modo de ejemplo.

### Interfaz

- **Iconos vectoriales propios, nunca emoji.** Hay un conjunto de símbolos al principio de `index.html`, que se usan con `Icono.de("nombre")`. Los emoji solo se admiten en este README.
- **Sin dependencias externas.** Todo el CSS y el JavaScript son propios.
- **Tema claro y oscuro.** Todo componente nuevo debe verse bien en los dos, usando las variables de color en lugar de valores fijos.

### Código

- **Una clase por archivo.** Si un archivo pasa de unas trescientas líneas, es señal de que la clase hace más de una cosa.
- **Los comentarios explican el porqué.** Un comentario que repite lo que dice el código sobra.
- **Cada regla lingüística lleva su ejemplo en el comentario**, para poder comprobar de un vistazo si sigue haciendo lo que se pretendía.

---

## 11. Pruebas y validación

### El validador de contenido

```bash
cd server
npm run validar
```

Comprueba campos obligatorios, códigos únicos y bien formados, valores admitidos, referencias cruzadas a temas, cuadre de las tablas, coherencia de los ejercicios y las convenciones de redacción del apartado anterior. Termina con código de salida 1 si encuentra errores, así que sirve como comprobación antes de publicar.

En su primera pasada encontró tres cosas que ya están corregidas: 149 minúsculas tras dos puntos, cinco fichas que apuntaban a temas inexistentes y dos pares de ortografía cuyas dos opciones eran idénticas. El último era un fallo real: el juego habría mostrado dos botones iguales.

### El motor

Las clases de `nucleo/`, `verbos/` y `analisis/` no tocan el documento, así que se cargan en Node y se prueban por separado. Las suites viven en la carpeta `pruebas/`, no usan nada fuera de Node y se ejecutan así:

```bash
cd server
npm run probar
```

El resultado actual, reproducible con ese comando:

| Suite | Resultado |
|---|---|
| Conjugación (`pruebas/conjugacion.js`) | 328 de 328 comprobaciones sobre 15 verbos con sus formas declaradas a mano |
| Análisis sintáctico (`pruebas/analisis.js`) | 43 de 43 comprobaciones sobre 18 oraciones con su análisis declarado |
| Silabación y acentuación (`pruebas/silabas.js`) | 42 de 42 comprobaciones sobre 13 palabras |

El cargador de `pruebas/soporte.js` importa los módulos del motor con `import()` dinámico y `pathToFileURL`, que son los mismos archivos que resuelve el navegador desde `js/main.js`, y aporta el `document.createElement` mínimo que necesita `Texto.escapar`. Los valores esperados de las tres suites están escritos a mano razonando la gramática, nunca copiados de lo que responde el motor.

---

## 12. Estado y trabajo pendiente

### Contenido actual

| Colección | Documentos |
|---|---|
| Fichas del temario | 45 |
| Figuras retóricas | 40 |
| Normas de ortografía | 21 |
| Corrientes literarias | 14 |
| Términos del glosario | 116 |
| Temas de estudio | 11 |
| Ejercicios | 25 de análisis, 20 de sujeto y predicado, 51 de ortografía, 92 de acentuación |

### Por dónde seguir

**Ampliar el banco de ejercicios.** Es lo primero que se agota al jugar. Conviene subir las oraciones de análisis a unas sesenta y los pares de ortografía a un centenar.

**Ampliar el temario.** Están cubiertas las clases de palabra, el sistema verbal, los sintagmas, todos los complementos, la oración compuesta, la acentuación, las letras dudosas, la puntuación, los géneros literarios, la métrica y las relaciones de significado. Faltan sobre todo la aposición y el vocativo, los subgéneros narrativos uno a uno, el comentario de texto paso a paso, la cita y la referencia, y los tipos de inferencia.

**Ampliar el léxico.** Cada palabra que se añade a `lexico.json` mejora el analizador. Los huecos que más se notan son los verbos poco frecuentes y los adjetivos.

### Mejoras del analizador que quedan por hacer

Ninguna es un fallo, son ampliaciones:

- Aposición: *Juan, mi vecino, llegó*, que ahora se analiza como dos sintagmas sueltos.
- Complemento predicativo del objeto directo: *lo nombraron director*.
- Función de las subordinadas sustantivas dentro de la principal: en *que vengas me alegra* la subordinada se separa pero no se etiqueta como sujeto.
- Distinguir la pasiva refleja de la impersonal con `se`: *se venden casas* frente a *se vive bien*.
- Oraciones con más de dos subordinadas encadenadas.

### Ideas para más adelante

Modo examen que mezcle preguntas de los siete juegos con una calificación final, avance guardado en el navegador con las palabras que más se fallan, e ilustraciones propias para los temas de métrica y de estructura de la oración.

---

## ⚠️ Aviso

Este atlas es **material de estudio**. No sustituye los libros de texto ni la enseñanza de los profesores.

---

Autor: **Jeshua Romero Guadarrama**
