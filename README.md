# Sistema de Reserva de Mesas para Festas

Aplicação React com Ant Design, SQLite e Vite para gerenciamento de reservas de mesas.

## Funcionalidades

### Administrador

- Criar usuários e definir quantidade de mesas/cadeiras que cada um tem direito
- Cadastrar mesas disponíveis
- Configurar imagem do evento
- Visualizar todas as reservas

### Usuário

- Visualizar imagem do evento
- Reservar mesas de acordo com a cota disponível
- Editar/cancelar reservas
- Seleção parcial de mesas

## Como executar

1. Instalar dependências:

```bash
npm install
```

2. Iniciar aplicação (frontend e backend):

```bash
npm run dev
```

O frontend estará disponível em: http://localhost:5173
O backend estará disponível em: http://localhost:3001

## Login padrão do administrador

- Usuário: `admin`
- Senha: `admin123`

## Tecnologias utilizadas

- React + Vite
- Ant Design
- SQLite (better-sqlite3)
- Express
- Axios
- JWT para autenticação
- bcryptjs para hash de senhas

## Deploy com Docker

### Pré-requisitos

- Docker
- Docker Compose

### Executar com Docker

1. Build e iniciar os containers:

```bash
docker-compose up -d --build
```

2. Verificar status dos containers:

```bash
docker-compose ps
```

3. Ver logs:

```bash
docker-compose logs -f
```

4. Parar os containers:

```bash
docker-compose down
```

5. Parar e remover volumes (apaga banco de dados):

```bash
docker-compose down -v
```

### Acesso após deploy

- Frontend: http://localhost (porta 80)
- API Backend: http://localhost:3001
- O banco de dados SQLite é persistido em `./server/data/`

### Configuração de produção

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Edite `.env` e altere:

   - `JWT_SECRET` para uma chave segura
   - `API_URL` para o domínio do seu servidor

3. No `docker-compose.yml`, atualize:
   - A variável `JWT_SECRET` no serviço `app`
   - As portas se necessário

### Build apenas da imagem Docker

```bash
docker build -t projetofestas:latest .
```

### Executar container individual

```bash
docker run -d -p 3001:3001 -v $(pwd)/server/data:/app/server/data projetofestas:latest
```

### Estrutura do Deploy

- **Dockerfile**: Build multi-stage que compila o frontend e prepara o backend
- **docker-compose.yml**: Orquestra os serviços (app + nginx)
- **nginx.conf**: Configuração do servidor web que serve o frontend e faz proxy para a API
- **.dockerignore**: Otimiza o build excluindo arquivos desnecessários

### Troubleshooting

**Problema: Porta em uso**

```bash
# Verificar processos na porta 80 ou 3001
netstat -ano | findstr :80
netstat -ano | findstr :3001

# Mudar a porta no docker-compose.yml
ports:
  - "8080:80"  # Usar porta 8080 em vez de 80
```

**Problema: Permissões do banco de dados**

```bash
# Criar diretório com permissões corretas
mkdir -p server/data
chmod 755 server/data
```

**Problema: Build falha**

```bash
# Limpar cache do Docker
docker-compose down
docker system prune -a
docker-compose up -d --build
```
