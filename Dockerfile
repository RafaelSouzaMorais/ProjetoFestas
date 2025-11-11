############### STAGE 1: Build Frontend #################
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY vite.config.* ./
COPY index.html ./
COPY public ./public
COPY src ./src
RUN npm install --frozen-lockfile || npm install
RUN npm run build

############### STAGE 2: Runtime #################
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3100

RUN apk add --no-cache wget

COPY package*.json ./
RUN npm install --omit=dev --frozen-lockfile || npm install --omit=dev

# Copiar backend e build do frontend
COPY server ./server
COPY --from=build /app/dist ./dist
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3100

CMD ["/app/start.sh"]
