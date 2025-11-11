const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const { pool, initializeDatabase } = require("./database.js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3100;
const JWT_SECRET = process.env.JWT_SECRET || "festa-secret-key-2025";

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir arquivos estáticos do frontend (fallback)
app.use(express.static(path.join(__dirname, "..", "dist")));

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Middlewares
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

// Healthcheck público
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];

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
        name: user.name,
        username: user.username,
        is_admin: user.is_admin,
        mesa_quota: user.mesa_quota,
        cadeira_extra_quota: user.cadeira_extra_quota,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: error.message });
  }
});

// Obter usuário atual a partir do token
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, username, is_admin, mesa_quota, cadeira_extra_quota FROM users WHERE id = $1",
      [req.user.id]
    );
    const me = result.rows[0];
    if (!me) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(me);
  } catch (error) {
    console.error("Error getting me:", error);
    res.status(500).json({ error: error.message });
  }
});

// Usuários
app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, username, is_admin, mesa_quota, cadeira_extra_quota FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, username, password, mesa_quota, cadeira_extra_quota } =
    req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, username, password, mesa_quota, cadeira_extra_quota) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [
        name,
        username,
        hashedPassword,
        mesa_quota || 0,
        cadeira_extra_quota || 0,
      ]
    );

    res.json({
      id: result.rows[0].id,
      name,
      mesa_quota,
      cadeira_extra_quota,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ error: "Usuário já existe" });
  }
});

app.put("/api/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, username, mesa_quota, cadeira_extra_quota, password } =
    req.body;

  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await pool.query(
        "UPDATE users SET name = $1, username = $2, mesa_quota = $3, cadeira_extra_quota = $4, password = $5 WHERE id = $6",
        [name, username, mesa_quota, cadeira_extra_quota, hashedPassword, id]
      );
    } else {
      await pool.query(
        "UPDATE users SET name = $1, username = $2, mesa_quota = $3, cadeira_extra_quota = $4 WHERE id = $5",
        [name, username, mesa_quota, cadeira_extra_quota, id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(400).json({ error: "Erro ao atualizar usuário" });
  }
});

app.delete(
  "/api/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { id } = req.params;

    try {
      await pool.query("DELETE FROM users WHERE id = $1 AND is_admin = FALSE", [
        id,
      ]);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Mesas
app.get("/api/tables", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tables ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting tables:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tables", authMiddleware, adminMiddleware, async (req, res) => {
  const { table_number, capacity } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO tables (name, capacity) VALUES ($1, $2) RETURNING id",
      [table_number, capacity]
    );

    res.json({ id: result.rows[0].id, table_number, capacity });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(400).json({ error: "Mesa já existe" });
  }
});

app.delete(
  "/api/tables/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { id } = req.params;

    try {
      await pool.query("DELETE FROM tables WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting table:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Reservas
app.get("/api/reservations", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Getting reservations for user:", userId);

    const result = await pool.query(
      `SELECT r.*, t.name as table_number, t.capacity
       FROM reservations r 
       JOIN tables t ON r.table_id = t.id
       WHERE r.user_id = $1`,
      [userId]
    );

    console.log("Reservations found:", result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting reservations:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reservations/chairs", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Getting extra chairs for user:", userId);

    const result = await pool.query(
      `SELECT COALESCE(SUM(chairs), 0) AS total_chairs
       FROM (
         SELECT cadeira_extra_quota AS chairs
         FROM users
         WHERE id = $1
         
         UNION ALL
         
         SELECT COALESCE(SUM(t.capacity), 0) AS chairs
         FROM reservations r
         JOIN tables t ON r.table_id = t.id
         WHERE r.user_id = $1
       ) AS combined`,
      [userId]
    );

    console.log("Total chairs:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error getting extra chairs:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/relatorio", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.name as convidado, u.name, u.username
       FROM guests g
       JOIN users u ON u.id = g.user_id
       ORDER BY u.username, g.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting relatorio:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reservations/all", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, t.name as table_number, t.capacity, u.username 
       FROM reservations r 
       JOIN tables t ON r.table_id = t.id 
       JOIN users u ON r.user_id = u.id
       ORDER BY t.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting all reservations:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reservations", authMiddleware, async (req, res) => {
  const { table_id, extra_chairs } = req.body;
  const userId = req.user.id;

  try {
    // Verificar se está reservada
    const existingReservation = await pool.query(
      "SELECT * FROM reservations WHERE table_id = $1",
      [table_id]
    );

    if (existingReservation.rows.length > 0) {
      return res.status(400).json({ error: "Mesa já reservada" });
    }

    const result = await pool.query(
      "INSERT INTO reservations (user_id, table_id) VALUES ($1, $2) RETURNING id",
      [userId, table_id]
    );

    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(400).json({ error: "Erro ao criar reserva" });
  }
});

app.delete("/api/reservations/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Contar convidados do usuário
    const guestCountResult = await pool.query(
      "SELECT COUNT(*) as count FROM guests WHERE user_id = $1",
      [userId]
    );
    const guestCount = parseInt(guestCountResult.rows[0].count);

    // Calcular capacidade total APÓS a exclusão da reserva
    const futureCapacityResult = await pool.query(
      `SELECT COALESCE(SUM(chairs), 0) AS total_chairs
       FROM (
         SELECT cadeira_extra_quota AS chairs
         FROM users
         WHERE id = $1
         
         UNION ALL
         
         SELECT COALESCE(SUM(t.capacity), 0) AS chairs
         FROM reservations r
         JOIN tables t ON r.table_id = t.id
         WHERE r.user_id = $1 AND r.id != $2
       ) AS combined`,
      [userId, id]
    );

    const totalCapacityAfterDelete =
      parseInt(futureCapacityResult.rows[0].total_chairs) || 0;

    // Verificar se a quantidade de convidados será maior que a capacidade após exclusão
    if (guestCount > totalCapacityAfterDelete) {
      return res.status(400).json({
        error: `Não é possível excluir esta reserva. Você tem ${guestCount} convidado(s) cadastrado(s) e após a exclusão terá apenas ${totalCapacityAfterDelete} vaga(s). Exclua ${
          guestCount - totalCapacityAfterDelete
        } convidado(s) antes de remover esta reserva.`,
      });
    }

    // Se passou na validação, pode excluir
    await pool.query(
      "DELETE FROM reservations WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    res.status(500).json({ error: error.message });
  }
});

// Convidados
app.get("/api/guests", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Getting guests for user:", userId);

    const result = await pool.query(
      "SELECT * FROM guests WHERE user_id = $1 ORDER BY name",
      [userId]
    );

    console.log("Guests found:", result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting guests:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/guests", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome obrigatório" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO guests (user_id, name) VALUES ($1, $2) RETURNING id",
      [userId, name.trim()]
    );

    res.json({ id: result.rows[0].id, name: name.trim() });
  } catch (error) {
    console.error("Error creating guest:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/guests/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await pool.query("DELETE FROM guests WHERE id = $1 AND user_id = $2", [
      id,
      userId,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting guest:", error);
    res.status(500).json({ error: error.message });
  }
});

// Configuração do evento
app.get("/api/event-config", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM event_config LIMIT 1");
    res.json(result.rows[0] || { event_image: "" });
  } catch (error) {
    console.error("Error getting event config:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put(
  "/api/event-config",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { event_image } = req.body;

    try {
      await pool.query(
        "UPDATE event_config SET event_image = $1, updated_at = CURRENT_TIMESTAMP",
        [event_image]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating event config:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.post(
  "/api/event-config/upload",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    try {
      const base64Image = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;

      await pool.query(
        "UPDATE event_config SET event_image = $1, updated_at = CURRENT_TIMESTAMP",
        [base64Image]
      );

      res.json({ success: true, event_image: base64Image });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Inicializar banco de dados e servidor
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log("Banco de dados PostgreSQL conectado!");
    });
  })
  .catch((error) => {
    console.error("Erro ao inicializar servidor:", error);
    process.exit(1);
  });

// SPA fallback: servir index.html para qualquer rota não-API
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});
