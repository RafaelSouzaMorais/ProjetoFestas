# 🎉 Migração Concluída: SQLite → PostgreSQL

## ✅ Arquivos Criados

1. **server/databasePostgres.js** - Nova configuração do banco PostgreSQL
2. **server/indexPostgres.js** - Servidor Express atualizado para PostgreSQL
3. **.env** - Variáveis de ambiente (configure suas credenciais!)
4. **POSTGRESQL_SETUP.md** - Guia completo de instalação e configuração

## 📋 Próximos Passos

### 1. Instalar PostgreSQL

```bash
# Windows: Baixe em https://www.postgresql.org/download/windows/
# Durante a instalação, defina uma senha para o usuário 'postgres'
```

### 2. Criar o Banco de Dados

```sql
-- No pgAdmin ou psql:
CREATE DATABASE projeto_festas;
```

### 3. Configurar o .env

Edite o arquivo `.env` e configure:

```env
DB_PASSWORD=SUA_SENHA_POSTGRES  # ⚠️ OBRIGATÓRIO!
JWT_SECRET=sua_chave_secreta_jwt  # ⚠️ Mude para produção!
```

### 4. Atualizar package.json

**OPÇÃO A:** Remover `"type": "module"` do package.json

**OU**

**OPÇÃO B:** Atualizar o script de servidor:

```json
{
  "scripts": {
    "server": "node server/indexPostgres.js"
  }
}
```

### 5. Iniciar o Sistema

```bash
npm run dev
```

## 🔄 Como Funciona

O novo sistema:

1. Conecta ao PostgreSQL automaticamente
2. Cria todas as tabelas necessárias na primeira execução
3. Cria o usuário admin padrão (admin/admin123)
4. Mantém todas as funcionalidades existentes

## 📊 Estrutura das Tabelas

```sql
users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  is_admin BOOLEAN,
  mesa_quota INTEGER,
  cadeira_extra_quota INTEGER
)

tables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE,
  capacity INTEGER
)

reservations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  table_id INTEGER REFERENCES tables(id)
)

guests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255)
)

event_config (
  id SERIAL PRIMARY KEY,
  event_image TEXT
)
```

## 🎯 Principais Mudanças

### 1. Sintaxe de Queries

- **Antes (SQLite):** `db.prepare("SELECT * FROM users WHERE id = ?").get(id)`
- **Agora (PostgreSQL):** `await pool.query("SELECT * FROM users WHERE id = $1", [id])`

### 2. Async/Await

- Todas as operações de banco agora são assíncronas
- Uso de `async/await` em todos os endpoints

### 3. Conexão Pool

- PostgreSQL usa connection pooling para melhor performance
- Gerencia múltiplas conexões simultâneas automaticamente

### 4. Tipos de Dados

- `INTEGER` → mantido
- `TEXT` → `VARCHAR(255)` ou `TEXT`
- `DATETIME` → `TIMESTAMP`
- Auto increment: `SERIAL PRIMARY KEY`

## 🚀 Vantagens do PostgreSQL

✅ **Performance:** Muito mais rápido com múltiplos usuários  
✅ **Escalabilidade:** Suporta milhares de conexões simultâneas  
✅ **Recursos:** JSON, full-text search, materialized views  
✅ **Produção:** Pronto para ambientes de produção  
✅ **Integridade:** ACID compliance completo  
✅ **Backup:** Ferramentas robustas de backup/restore

## 🔧 Troubleshooting

### Erro: "password authentication failed"

→ Verifique a senha no arquivo `.env`

### Erro: "database does not exist"

→ Crie o banco: `CREATE DATABASE projeto_festas;`

### Erro: "ECONNREFUSED"

→ PostgreSQL não está rodando. Inicie o serviço.

### Erro: "MODULE_NOT_FOUND"

→ Execute: `npm install pg dotenv`

## 📝 Notas Importantes

1. **Backup do SQLite:** O arquivo SQLite antigo (`reservations.db`) não é mais usado, mas mantenha um backup
2. **Migração de Dados:** Se tem dados importantes, faça a migração manual antes de usar o novo sistema
3. **Ambiente de Produção:** Troque `JWT_SECRET` por um valor forte e único
4. **Segurança:** Nunca commite o arquivo `.env` no git (já está no .gitignore)

## 🎓 Aprendizado

Esta migração ensina:

- Diferenças entre SQLite e PostgreSQL
- Como trabalhar com connection pools
- Queries parametrizadas com placeholders
- Async/await patterns em Node.js
- Configuração de variáveis de ambiente

## 📚 Próximos Passos Sugeridos

1. [ ] Instalar e configurar PostgreSQL
2. [ ] Criar o banco de dados
3. [ ] Configurar o .env
4. [ ] Testar a aplicação
5. [ ] Migrar dados antigos (se necessário)
6. [ ] Deploy em produção

---

**Dúvidas?** Consulte o arquivo `POSTGRESQL_SETUP.md` para instruções detalhadas!
