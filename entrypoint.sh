#!/bin/sh

ROOT_DIR=/usr/share/nginx/html

echo "--- Iniciando script de entrada del Frontend ---"
echo "API_KEY a inyectar: ${API_KEY}"
echo "Configurando backend: http://${BACKEND_HOST}:${BACKEND_PORT}"

# 1. Inyectar la API_KEY en los archivos JS compilados
if [ -z "$API_KEY" ]; then
    echo "Aviso: API_KEY no definida, se usará el valor por defecto."
else
    echo "Buscando archivos JS para inyectar la API_KEY..."
    for file in $ROOT_DIR/*.js;
    do
      if [ -f "$file" ]; then
        if grep -q "API_KEY_PLACEHOLDER" "$file"; then
            echo "   Inyectando en: $file"
            sed -i "s#API_KEY_PLACEHOLDER#$API_KEY#g" "$file"
        fi
      fi
    done
fi

# 2. Procesar el template de Nginx usando envsubst
# Solo reemplazamos variables específicas para no romper las de Nginx ($host, etc)
envsubst '${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "--- Configuración completada. Iniciando Nginx ---"
exec "$@"
