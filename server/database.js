import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "festa.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    mesa_quota INTEGER DEFAULT 0,
    cadeira_extra_quota INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    table_id INTEGER NOT NULL,
    extra_chairs INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (table_id) REFERENCES tables(id),
    UNIQUE(user_id, table_id)
  );

  CREATE TABLE IF NOT EXISTS event_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    event_image TEXT
  );
`);

const adminExists = db.prepare("SELECT id FROM users WHERE is_admin = 1").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare(
    "INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)"
  ).run("admin", hashedPassword);
  console.log("Admin padrão criado: username=admin, password=admin123");
}

const eventConfig = db
  .prepare("SELECT id FROM event_config WHERE id = 1")
  .get();
if (!eventConfig) {
  db.prepare("INSERT INTO event_config (id, event_image) VALUES (1, ?)").run(
    ""
  );
}

export default db;
