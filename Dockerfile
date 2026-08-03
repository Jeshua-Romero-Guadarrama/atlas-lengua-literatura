# Atlas de Lengua y Literatura
FROM node:20-alpine

WORKDIR /app

# Se copia server/ completo. Si la carpeta incluye node_modules (porque ya se
# ejecuto "npm install" en el equipo), el build no necesita red. Si no los
# incluye, se instalan aqui. El "||" hace que el build funcione en ambos casos,
# incluso en redes que interceptan el trafico TLS y rompen npm.
COPY server/ ./server/
RUN cd server && \
    if [ ! -d node_modules ]; then npm install --omit=dev --no-audit --no-fund; fi && \
    node -e "require('express'); require('mongodb'); console.log('Dependencias OK')"

# Aplicacion: datos, frontend y todo lo que sirve express.static, incluidas
# las paginas estaticas de indexacion y los archivos de raiz (manifiesto,
# robots, sitemap): sin ellos el contenedor responde 404 donde la pagina
# publicada responde contenido.
COPY data/ ./data/
COPY css/ ./css/
COPY js/ ./js/
COPY figuras-retoricas/ ./figuras-retoricas/
COPY literatura/ ./literatura/
COPY ortografia/ ./ortografia/
COPY temario/ ./temario/
COPY temas/ ./temas/
COPY index.html 404.html manifest.webmanifest portada.svg robots.txt seo.json sitemap.xml sw.js ./

EXPOSE 3000
CMD ["node", "server/index.js"]
