# 1. Usamos una imagen base que tenga Python y Node instalados
FROM nikolaik/python-nodejs:python3.10-nodejs18

# 2. Creamos el directorio de trabajo en el servidor
WORKDIR /app

# 3. Copiamos los archivos de dependencias primero (para aprovechar caché de Docker)
COPY requirements.txt ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# 4. Instalamos dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# 5. Instalamos dependencias del Backend
WORKDIR /app/backend
RUN npm install

# 6. Instalamos dependencias del Frontend y construimos la versión de producción
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# 7. Volvemos a la raíz y copiamos TODO el código del proyecto
WORKDIR /app
COPY . .

# 8. Importante: Movemos la "build" del frontend a la carpeta pública del backend
# (Vite genera la web en frontend/dist, el backend la espera en backend/public)
# Primero borramos la carpeta public del backend si existe para evitar conflictos
RUN rm -rf backend/public
# Movemos la carpeta dist generada por Vite y la renombramos a public dentro del backend
RUN mv frontend/dist backend/public

# 9. Exponemos el puerto
EXPOSE 5001

# 10. Comando para arrancar el servidor
WORKDIR /app/backend
CMD ["node", "server.js"]