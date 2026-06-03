# Etapa 1: Construcción
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servidor Nginx
FROM nginx:alpine

# Instalamos openssl
RUN apk add --no-cache openssl

# Generar certificado SSL
RUN mkdir -p /etc/nginx/ssl \
    && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=AR/ST=Mendoza/L=Mendoza/O=UM/OU=Haberes/CN=haberes.local"

# Copiar archivos estáticos (usamos una ruta fija para evitar problemas con find en el Dockerfile)
# Basado en el nombre del proyecto detectado anteriormente: sauceColegio
COPY --from=build /app/dist/sauceColegio/browser /usr/share/nginx/html

# Copiar configuración (como template) y script de entrada
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
