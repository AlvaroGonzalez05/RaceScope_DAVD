# 1. ACTUALIZACIÓN CRÍTICA: Usamos Node 20 (Requerido por Vite nuevo)
FROM nikolaik/python-nodejs:python3.10-nodejs20

WORKDIR /app

# 2. Instalamos dependencias de Python (aprovechando caché de Docker)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 3. Instalamos dependencias de Node (Backend)
COPY backend/package.json backend/
WORKDIR /app/backend
RUN npm install

# 4. Instalamos dependencias de Node (Frontend)
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install

# -----------------------------------------------------------
# 5. PASO CRÍTICO: Copiamos el código fuente AHORA
# (Antes lo hacíamos después del build, por eso fallaba al no encontrar index.html)
# -----------------------------------------------------------
WORKDIR /app
COPY . .

# 6. Ahora sí, construimos el Frontend (con todos los archivos presentes)
WORKDIR /app/frontend
RUN npm run build

# 7. Movemos la carpeta 'dist' generada al backend
WORKDIR /app
RUN rm -rf backend/public && mv frontend/dist backend/public

# 8. Arrancamos
EXPOSE 5001
WORKDIR /app/backend
CMD ["node", "server.js"]