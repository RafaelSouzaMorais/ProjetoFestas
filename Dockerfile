FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache wget

COPY package*.json ./
COPY vite.config.* ./
COPY index.html ./
COPY src ./src
COPY server ./server
COPY public ./public

RUN npm install
RUN npm run build

EXPOSE 3100
EXPOSE 5173
ENV NODE_ENV=production
ENV PORT=3100

CMD ["npm", "run", "start"]
