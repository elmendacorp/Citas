# Etapa 1: Construcción (Build)
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:22-alpine AS production

WORKDIR /app
COPY package.json package-lock.json* ./
# Sólo dependencias de producción
RUN npm install --omit=dev

# Copiar el backend y el build
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist

# Instalar tsx temporalmente para ejecutar el servidor (o usar tsc, pero tsx es fácil para este caso)
RUN npm install -g tsx

EXPOSE 80

CMD ["tsx", "server/index.ts"]
