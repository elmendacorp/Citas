# Etapa 1: Construcción (Build)
FROM node:22-alpine AS builder

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de manifiesto de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias (usando npm ci si existe package-lock.json)
RUN npm ci || npm install

# Copiar el resto del código fuente del proyecto
COPY . .

# Construir la aplicación para producción (Vite generará la carpeta 'dist')
RUN npm run build

# Etapa 2: Producción (Servir con Nginx)
FROM nginx:alpine AS production

# Copiar el build compilado desde la etapa anterior hacia el directorio de nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# (Opcional) Copiar un archivo de configuración custom para Nginx si tuvieras rutas dinámicas en React/Vite
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto por defecto de Nginx
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
