# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copiar código do servidor
COPY server ./server

# Copiar build do frontend
COPY --from=frontend-builder /app/dist ./dist

# Criar diretório para o banco de dados
RUN mkdir -p /app/server/data

# Expor portas
EXPOSE 3001

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001

# Comando para iniciar o servidor
CMD ["node", "server/index.js"]
