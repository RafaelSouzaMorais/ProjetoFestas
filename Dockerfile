# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY vite.config.* ./
COPY src ./src
COPY public ./public
RUN npm install
RUN npm run build

# Stage 2: Backend
FROM node:20-alpine AS backend
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY server ./server
COPY package*.json ./
RUN npm install --production

# Criar diretório para o banco de dados
RUN mkdir -p /app/server/data

# Expor portas
EXPOSE 3001

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001

# Comando para iniciar o servidor
CMD ["node", "server/index.js"]
