# frontend/Dockerfile (CORREGIDO para producción)
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar package.json y lock file
COPY package*.json ./
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando para PRODUCCIÓN 
CMD ["npm", "start"]