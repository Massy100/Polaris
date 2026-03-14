FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose port
EXPOSE 3000

# Start in development mode with host configurated
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]