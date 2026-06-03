# Etapa 1: Construcción
FROM node:22-alpine AS build

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build -- --configuration production

# Etapa 2: Servidor Nginx
FROM nginx:alpine

# Instalamos openssl y generamos un certificado auto-firmado
RUN apk add --no-cache openssl     && mkdir -p /etc/nginx/ssl     && openssl req -x509 -nodes -days 365 -newkey rsa:2048     -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt     -subj "/C=AR/ST=Mendoza/L=Mendoza/O=UM/OU=Haberes/CN=haberes.local"

# Copiamos los archivos estáticos desde la etapa de construcción
# Buscamos el index.html para determinar la carpeta correcta dinámicamente
COPY --from=build /app/dist /app/dist_temp
RUN FIND_PATH=$(find /app/dist_temp -name index.html -print -quit | xargs dirname) &&     cp -r $FIND_PATH/. /usr/share/nginx/html/ &&     rm -rf /app/dist_temp

# Copiamos la configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
