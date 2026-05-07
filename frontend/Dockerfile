# frontend/Dockerfile (CORREGIDO - sin npm ci)
FROM node:18-alpine
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Usar npm install en lugar de npm ci
RUN npm install

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando para producción
CMD ["npm", "start"]