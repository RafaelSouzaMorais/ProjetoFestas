# Guia de Deployment - ProjetoFestas

## Arquitetura

Este projeto roda **frontend e backend no mesmo container Docker**, com duas opções de acesso:

### Opção 1: Vite Preview (Recomendado para Coolify)

- **Porta:** 5173
- **Uso:** Serve o frontend compilado via Vite preview
- **Vantagem:** Mais rápido, otimizado para produção
- **Configuração no Coolify:** Use porta **5173**

### Opção 2: Express Static (Fallback)

- **Porta:** 3100
- **Uso:** Backend Express serve o frontend como arquivos estáticos
- **Vantagem:** Tudo em uma única porta
- **Quando usar:** Se houver problemas com o Vite preview

## Como Funciona

### Dentro do Container:

1. **Backend Express** roda na porta **3100**

   - Serve a API em `/api/*`
   - Serve o frontend estático em qualquer outra rota como fallback

2. **Vite Preview** roda na porta **5173**

   - Serve o frontend compilado do `dist/`

3. **Frontend** se comunica com o backend via `http://localhost:3100/api`

### Portas Expostas:

- **3100**: Backend + Frontend (via Express static)
- **5173**: Frontend (via Vite preview)

## Configuração no Coolify

### 1. Variáveis de Ambiente Necessárias:

```bash
NODE_ENV=production
PORT=3100
JWT_SECRET=sua-chave-secreta-super-segura-aqui
DB_HOST=postgres
DB_PORT=5432
DB_NAME=projeto_festas
DB_USER=postgres
DB_PASSWORD=postgres
VITE_API_URL=http://localhost:3100/api
```

### 2. Configuração de Porta:

**Opção A (Recomendado):** Usar Vite Preview

- No Coolify, configure a porta para **5173**
- O `coolify.json` já está configurado para isso

**Opção B:** Usar Express Static

- No Coolify, configure a porta para **3100**
- Você acessará o frontend via backend Express

### 3. Healthcheck:

O healthcheck padrão verifica a porta **5173**:

```bash
wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1
```

Se você optar por usar a porta **3100**, altere no `docker-compose.yml` e `coolify.json`:

```bash
wget --no-verbose --tries=1 --spider http://localhost:3100/ || exit 1
```

## Comandos para Deploy

### Build Local:

```bash
docker-compose build
```

### Executar Local:

```bash
docker-compose up
```

### Acessar Localmente:

- Frontend (Vite): http://localhost:5173
- Frontend (Express): http://localhost:3100
- API: http://localhost:3100/api

### Push para Coolify:

```bash
git add .
git commit -m "Deploy update"
git push
```

## Troubleshooting

### Erro: "Cannot GET /"

**Causa:** Você está acessando a porta errada ou o Vite preview não está rodando.

**Solução:**

1. Verifique se está acessando a porta **5173** (Vite) ou **3100** (Express)
2. No Coolify, certifique-se de que a porta está configurada corretamente
3. Verifique os logs do container para ver se ambos os serviços estão rodando

### Erro: "Network Error" ou API não responde

**Causa:** VITE_API_URL não está configurado corretamente.

**Solução:**

1. No Coolify, adicione a variável `VITE_API_URL=http://localhost:3100/api`
2. Faça rebuild completo
3. O frontend precisa saber onde está o backend

### Healthcheck Falhando

**Causa:** O Vite preview pode demorar um pouco para iniciar.

**Solução:**

1. Verifique se o `start_period` está configurado para pelo menos 30s
2. Se continuar falhando, mude o healthcheck para a porta 3100
3. Verifique os logs do container

## Arquivos Importantes

- `Dockerfile`: Build do container com frontend e backend
- `docker-compose.yml`: Configuração dos serviços (backend + postgres)
- `coolify.json`: Configuração específica do Coolify (porta 5173)
- `start.sh`: Script de inicialização que roda ambos os serviços
- `vite.config.js`: Configuração do Vite para dev e preview
- `server/index.js`: Backend Express com rota fallback para SPA

## Estrutura de Inicialização

Quando o container inicia, o `start.sh` executa:

```bash
npm run start
```

Que por sua vez executa (definido no `package.json`):

```bash
concurrently "npm run start:server" "npm run start:client"
```

Isso inicia:

- **Backend:** `node server/index.js` (porta 3100)
- **Frontend:** `vite preview --host 0.0.0.0 --port 5173 --open false` (porta 5173)

## Logs Importantes

O `start.sh` mostra no início:

- `NODE_ENV`: Deve ser "production"
- `Backend PORT`: Deve ser 3100
- `VITE_API_URL`: Deve estar definido

Se algum desses valores estiver errado, o problema está nas variáveis de ambiente.
