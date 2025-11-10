# Instruções para Migração do SQLite para PostgreSQL

## 1. Instalar PostgreSQL

### Windows

- Baixe o instalador em: https://www.postgresql.org/download/windows/
- Execute o instalador e siga as instruções
- Anote a senha que você definir para o usuário `postgres`
- Por padrão, o PostgreSQL roda na porta 5432

## 2. Criar o Banco de Dados

Abra o pgAdmin (instalado junto com PostgreSQL) ou use o terminal:

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar o banco de dados
CREATE DATABASE projeto_festas;

# Sair
\q
```

Ou pelo pgAdmin:

- Clique com botão direito em "Databases"
- Selecione "Create" > "Database"
- Nome: `projeto_festas`
- Clique em "Save"

## 3. Configurar o arquivo .env

Edite o arquivo `.env` na raiz do projeto com suas configurações:

```env
# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=projeto_festas
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_AQUI

# Configuração do Servidor
PORT=3100

# Configuração JWT
JWT_SECRET=sua_chave_secreta_jwt_aqui_mude_isso
```

**IMPORTANTE:** Substitua `SUA_SENHA_AQUI` pela senha que você definiu ao instalar o PostgreSQL!

## 4. Atualizar o package.json

O servidor agora usa CommonJS (require) ao invés de ES Modules (import).

Edite `package.json` e **REMOVA** a linha:

```json
"type": "module",
```

Ou atualize o script de servidor em `package.json`:

```json
"scripts": {
  "server": "node server/indexPostgres.js"
}
```

## 5. Iniciar o Servidor

```bash
npm run dev
```

O servidor irá:

1. Conectar ao PostgreSQL
2. Criar automaticamente todas as tabelas necessárias
3. Criar o usuário admin padrão (username: admin, password: admin123)
4. Iniciar na porta 3100

## 6. Verificar se está funcionando

Acesse: http://localhost:5191
Login: admin / admin123

## 7. Migrar dados do SQLite (opcional)

Se você já tem dados no SQLite e quer migrar para o PostgreSQL:

### Opção 1: Manual pelo pgAdmin

1. Exporte os dados do SQLite usando o DB Browser for SQLite
2. Importe no PostgreSQL usando pgAdmin

### Opção 2: Script SQL

Crie um script para exportar do SQLite e importar no PostgreSQL.

## Estrutura das Tabelas Criadas

O script cria automaticamente:

- `users` - Usuários do sistema
- `tables` - Mesas do evento
- `reservations` - Reservas de mesas
- `guests` - Convidados por usuário
- `event_config` - Configurações do evento (imagem)

## Troubleshooting

### Erro de conexão

- Verifique se o PostgreSQL está rodando
- Confirme usuário e senha no .env
- Teste a conexão com pgAdmin

### Erro de porta

- Se porta 5432 está ocupada, altere DB_PORT no .env
- Configure o PostgreSQL para usar outra porta

### Tabelas não criadas

- Verifique os logs do servidor
- Confirme permissões do usuário no PostgreSQL

## Diferenças do SQLite

1. **Sintaxe de Queries:**

   - SQLite: `?` para placeholders
   - PostgreSQL: `$1, $2, $3...` para placeholders

2. **Auto Increment:**

   - SQLite: `INTEGER PRIMARY KEY AUTOINCREMENT`
   - PostgreSQL: `SERIAL PRIMARY KEY`

3. **Timestamps:**

   - SQLite: `DATETIME('now')`
   - PostgreSQL: `CURRENT_TIMESTAMP`

4. **Tipos de Dados:**
   - SQLite: `INTEGER, TEXT, REAL, BLOB`
   - PostgreSQL: `INTEGER, VARCHAR, NUMERIC, BYTEA, BOOLEAN, TIMESTAMP`

## Vantagens do PostgreSQL

- ✅ Melhor performance com muitos usuários
- ✅ Suporte a transações mais robusto
- ✅ Recursos avançados (JSON, full-text search, etc)
- ✅ Melhor para produção
- ✅ Suporte a concurrent connections
- ✅ Backup e restore mais eficientes
