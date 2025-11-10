import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./database.js";

const app = express();
const PORT = process.env.PORT || 3100;
const JWT_SECRET = "festa-secret-key-2025";

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

import multer from "multer";
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
};

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
      mesa_quota: user.mesa_quota,
      cadeira_extra_quota: user.cadeira_extra_quota,
    },
  });
});

app.get("/api/users", authMiddleware, adminMiddleware, (req, res) => {
  const users = db
    .prepare(
      "SELECT id, name, username, is_admin, mesa_quota, cadeira_extra_quota FROM users"
    )
    .all();
  res.json(users);
});

app.post("/api/users", authMiddleware, adminMiddleware, (req, res) => {
  const { name, username, password, mesa_quota, cadeira_extra_quota } =
    req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (name, username, password, mesa_quota, cadeira_extra_quota) VALUES (?, ?, ?, ?, ?)"
      )
      .run(
        name,
        username,
        hashedPassword,
        mesa_quota || 0,
        cadeira_extra_quota || 0
      );

    res.json({
      id: result.lastInsertRowid,
      name,
      username,
      mesa_quota,
      cadeira_extra_quota,
    });
  } catch (error) {
    res.status(400).json({ error: "Usuário já existe" });
  }
});

app.put("/api/users/:id", authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { mesa_quota, cadeira_extra_quota, password, name } = req.body;

  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare(
        "UPDATE users SET mesa_quota = ?, cadeira_extra_quota = ?, password = ?, name = ? WHERE id = ?"
      ).run(mesa_quota, cadeira_extra_quota, hashedPassword, name, id);
    } else {
      db.prepare(
        "UPDATE users SET mesa_quota = ?, cadeira_extra_quota = ?, name = ? WHERE id = ?"
      ).run(mesa_quota, cadeira_extra_quota, name, id);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Erro ao atualizar usuário" });
  }
});

app.delete("/api/users/:id", authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.prepare("DELETE FROM reservations WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ? AND is_admin = 0").run(id);

  res.json({ success: true });
});

app.get("/api/tables", authMiddleware, (req, res) => {
  const tables = db.prepare("SELECT * FROM tables ORDER BY table_number").all();
  res.json(tables);
});

app.post("/api/tables", authMiddleware, adminMiddleware, (req, res) => {
  const { table_number, capacity } = req.body;

  try {
    const result = db
      .prepare("INSERT INTO tables (table_number, capacity) VALUES (?, ?)")
      .run(table_number, capacity);

    res.json({ id: result.lastInsertRowid, table_number, capacity });
  } catch (error) {
    res.status(400).json({ error: "Mesa já existe" });
  }
});

app.delete("/api/tables/:id", authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.prepare("DELETE FROM reservations WHERE table_id = ?").run(id);
  db.prepare("DELETE FROM tables WHERE id = ?").run(id);

  res.json({ success: true });
});

app.get("/api/reservations", authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Getting reservations for user:", userId);

    const reservations = db
      .prepare(
        `
      SELECT r.*, t.table_number, t.capacity
      FROM reservations r 
      JOIN tables t ON r.table_id = t.id
      WHERE r.user_id = ?
    `
      )
      .all(userId);

    console.log("Reservations found:", reservations.length);
    res.json(reservations);
  } catch (error) {
    console.error("Error getting reservations:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reservations/chairs", authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    //recuperar somatório de cadeiras extras da reserva do usuário mas também da quota do usuário
    console.log("Getting extra chairs for user:", userId);
    const reservation = db
      .prepare(
        `SELECT SUM(chairs) AS total_chairs
            FROM (
                SELECT u.cadeira_extra_quota AS chairs
                FROM users u
                WHERE u.id = ?

                UNION ALL

                SELECT SUM(t.capacity) AS chairs
                FROM reservations r
                JOIN tables t ON r.table_id = t.id
                WHERE r.user_id = ?
            ) AS combined;`
      )
      .get(userId, userId);

    console.log("Total chairs:", reservation);
    res.json(reservation);
  } catch (error) {
    console.error("Error getting extra chairs:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/relatorio", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const reservations = db
      .prepare(
        `   
      SELECT g.name as convidado, u.name, u.username
      FROM guests g
      JOIN users u ON u.id = g.user_id
      `
      )
      .all();
    res.json(reservations);
  } catch (error) {
    console.error("Error getting relatorio:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reservations/all", authMiddleware, (req, res) => {
  const reservations = db
    .prepare(
      `
    SELECT r.*, t.table_number, t.capacity, u.username 
    FROM reservations r 
    JOIN tables t ON r.table_id = t.id 
    JOIN users u ON r.user_id = u.id
  `
    )
    .all();

  res.json(reservations);
});

app.post("/api/reservations", authMiddleware, (req, res) => {
  const { table_id, extra_chairs } = req.body;
  const userId = req.user.id;

  try {
    //verifia se está reservada
    const existingReservation = db
      .prepare("SELECT * FROM reservations WHERE table_id = ?")
      .get(table_id);

    if (existingReservation) {
      throw new Error("Mesa já reservada");
    }

    const result = db
      .prepare(
        "INSERT INTO reservations (user_id, table_id, extra_chairs) VALUES (?, ?, ?)"
      )
      .run(userId, table_id, extra_chairs || 0);

    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: "Mesa já reservada" });
  }
});

// Convidados
app.get("/api/guests", authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Getting guests for user:", userId);

    const guests = db
      .prepare("SELECT * FROM guests WHERE user_id = ?")
      .all(userId);

    console.log("Guests found:", guests.length);
    res.json(guests);
  } catch (error) {
    console.error("Error getting guests:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/guests", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome obrigatório" });
  }
  const result = db
    .prepare("INSERT INTO guests (user_id, name) VALUES (?, ?)")
    .run(userId, name.trim());
  res.json({ id: result.lastInsertRowid, name });
});

app.delete("/api/guests/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  db.prepare("DELETE FROM guests WHERE id = ? AND user_id = ?").run(id, userId);
  res.json({ success: true });
});

app.delete("/api/reservations/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Contar convidados do usuário
    const guestCount = db
      .prepare("SELECT COUNT(*) as count FROM guests WHERE user_id = ?")
      .get(userId).count;

    // Calcular capacidade total APÓS a exclusão da reserva
    const futureCapacity = db
      .prepare(
        `SELECT SUM(chairs) AS total_chairs
        FROM (
            SELECT u.cadeira_extra_quota AS chairs
            FROM users u
            WHERE u.id = ?

            UNION ALL

            SELECT SUM(t.capacity) AS chairs
            FROM reservations r
            JOIN tables t ON r.table_id = t.id
            WHERE r.user_id = ? AND r.id != ?
        ) AS combined;`
      )
      .get(userId, userId, id);

    const totalCapacityAfterDelete = futureCapacity.total_chairs || 0;

    // Verificar se a quantidade de convidados será maior que a capacidade após exclusão
    if (guestCount > totalCapacityAfterDelete) {
      return res.status(400).json({
        error: `Não é possível excluir esta reserva. Você tem ${guestCount} convidado(s) cadastrado(s) e após a exclusão terá apenas ${totalCapacityAfterDelete} vaga(s). Exclua ${
          guestCount - totalCapacityAfterDelete
        } convidado(s) antes de remover esta reserva.`,
      });
    }

    // Se passou na validação, pode excluir
    db.prepare("DELETE FROM reservations WHERE id = ? AND user_id = ?").run(
      id,
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/event-config", authMiddleware, (req, res) => {
  const config = db.prepare("SELECT * FROM event_config WHERE id = 1").get();
  res.json(config || { event_image: "" });
});

app.put("/api/event-config", authMiddleware, adminMiddleware, (req, res) => {
  const { event_image } = req.body;
  db.prepare("UPDATE event_config SET event_image = ? WHERE id = 1").run(
    event_image
  );
  res.json({ success: true });
});

// Novo endpoint para upload de imagem
app.post(
  "/api/event-config/upload",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }
    const base64Image = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;
    db.prepare("UPDATE event_config SET event_image = ? WHERE id = 1").run(
      base64Image
    );
    res.json({ success: true, event_image: base64Image });
  }
);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
