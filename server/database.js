const { Pool } = require("pg");
// dotenv é carregado no index.js

// Função de retry genérica
const retry = async (
  fn,
  { attempts = 10, delayMs = 2000, label = "operation" } = {}
) => {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(
        `[Retry] ${label} tentativa ${i}/${attempts} falhou: ${err.message}`
      );
      if (i < attempts) await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  throw lastErr;
};

// Resolver host do Postgres: em dev local, se DB_HOST for 'postgres', usar 'localhost'
const resolveDbHost = () => {
  const envHost = process.env.DB_HOST;
  if (!envHost) return "localhost";
  if (envHost === "postgres" && process.env.NODE_ENV !== "production") {
    return "localhost";
  }
  return envHost;
};

// Primeiro, criar uma conexão sem especificar o database para verificar/criar
const createDatabaseIfNotExists = async () => {
  console.log("porta:", process.env.DB_PORT);
  const adminPool = new Pool({
    host: resolveDbHost(),
    port: process.env.DB_PORT || 5432,
    database: "postgres", // Conecta ao banco padrão
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
  });

  try {
    const dbName = process.env.DB_NAME || "projeto_festas";

    // Verificar se o banco existe
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (result.rows.length === 0) {
      // Banco não existe, criar
      console.log(`Criando banco de dados '${dbName}'...`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Banco de dados '${dbName}' criado com sucesso!`);
    } else {
      console.log(`Banco de dados '${dbName}' já existe.`);
    }
  } catch (error) {
    console.error("Erro ao verificar/criar banco de dados:", error.message);
    throw error;
  } finally {
    await adminPool.end();
  }
};

// Pool de conexão para o banco de dados da aplicação
const pool = new Pool({
  host: resolveDbHost(),
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "projeto_festas",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
});

// Inicializar banco de dados
const initializeDatabase = async () => {
  // Primeiro, garantir que o banco existe
  // Retry para garantir que o servidor aceitou conexões
  await retry(createDatabaseIfNotExists, {
    attempts: 5,
    delayMs: 2500,
    label: "criar/verificar banco",
  });

  const client = await retry(() => pool.connect(), {
    attempts: 12,
    delayMs: 2500,
    label: "conectar pool",
  });
  try {
    await client.query("BEGIN");

    // Criar tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        mesa_quota INTEGER DEFAULT 0,
        cadeira_extra_quota INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adicionar coluna name se não existir (para bancos já criados)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'name'
        ) THEN
          ALTER TABLE users ADD COLUMN name VARCHAR(255);
        END IF;
      END $$;
    `);

    // Criar tabela de mesas
    await client.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        capacity INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de reservas
    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        table_id INTEGER NOT NULL,
        reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
        UNIQUE (table_id)
      )
    `);

    // Criar tabela de convidados
    await client.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Criar tabela de configuração do evento (agora com campo value para mesas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_config (
        id SERIAL PRIMARY KEY,
        event_image TEXT,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adicionar coluna 'value' se não existir (migração para bancos antigos)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'event_config' AND column_name = 'value'
        ) THEN
          ALTER TABLE event_config ADD COLUMN value TEXT;
        END IF;
      END $$;
    `);

    // Adicionar coluna 'main_image' para imagem principal (diferente do mapa)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'event_config' AND column_name = 'main_image'
        ) THEN
          ALTER TABLE event_config ADD COLUMN main_image TEXT;
        END IF;
      END $$;
    `);

    // Verificar se já existe um registro de configuração
    const configResult = await client.query(
      "SELECT COUNT(*) as count FROM event_config"
    );
    if (parseInt(configResult.rows[0].count) === 0) {
      await client.query(
        "INSERT INTO event_config (event_image, value) VALUES ($1, $2)",
        ["", "[]"]
      );
    }

    // Garantir default caso valor esteja nulo
    await client.query(
      "UPDATE event_config SET value = '[]' WHERE value IS NULL"
    );

    // Criar usuário admin padrão se não existir
    const adminResult = await client.query(
      "SELECT COUNT(*) as count FROM users WHERE username = $1",
      ["admin"]
    );
    if (parseInt(adminResult.rows[0].count) === 0) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await client.query(
        "INSERT INTO users (username, password, is_admin, mesa_quota, cadeira_extra_quota) VALUES ($1, $2, $3, $4, $5)",
        ["admin", hashedPassword, true, 0, 0]
      );
      console.log("Usuário admin criado com sucesso!");
    }

    await client.query("COMMIT");
    console.log("Banco de dados PostgreSQL inicializado com sucesso!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao inicializar banco de dados:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Executar migrations se necessário
const runMigrations = async () => {
  // Adicione aqui migrations futuras se necessário
  console.log("Migrations concluídas!");
};

module.exports = {
  pool,
  initializeDatabase,
  runMigrations,
};
