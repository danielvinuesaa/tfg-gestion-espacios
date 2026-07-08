FROM node:20-alpine

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Arrancamos con host expuesto para que Docker pueda mapear el puerto
CMD ["npm", "run", "dev", "--", "--host"]
