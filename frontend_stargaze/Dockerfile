# Imagen base
FROM node:20

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el proyecto
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Levantamos React/Vite
CMD ["npm", "run", "dev", "--", "--host"]