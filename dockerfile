# Etapa 1: Construcción
FROM node:22.1.0 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx para producción
FROM nginx:stable-alpine

# Copia el build generado a la carpeta pública de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Elimina el archivo de configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copia tu propia configuración si lo necesitas
COPY nginx.conf /etc/nginx/conf.d

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
