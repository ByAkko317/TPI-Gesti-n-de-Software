FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Modo desarrollo con hot-reload. Para producción se hace 'npm run build'
# y se sirve 'dist/' (ver guía de despliegue).
CMD ["npm", "run", "dev", "--", "--host"]
