const express = require("express");
const path = require("path");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
const allowedOrigins = [
  "https://frequencia-carisma.vercel.app",
  "http://localhost:3000", // já está aqui
  "http://localhost:3001", // <-- adicione esta linha
];

//app.use(cors());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend/build")));

// Rota fallback para React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});


// Inicializa banco
const db = new sqlite3.Database("frequencia.db");

// Cria tabela se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS alunos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula TEXT UNIQUE,
    nome TEXT NOT NULL,
    telefone TEXT,
    rua TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    pais TEXT
  )
`);

// Cria tabela se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS frequencia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula TEXT,
    data DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Rota para registrar presença
app.post("/registrar", (req, res) => {
  const { matricula } = req.body;

  if (!matricula) {
    return res.status(400).json({ erro: "Matrícula é obrigatória" });
  }

  db.run(
    "INSERT INTO frequencia (matricula) VALUES (?)",
    [matricula],
    function (err) {
      if (err) {
        console.error("Erro ao registrar presença:", err);
        return res.status(500).json({ erro: "Erro ao registrar presença" });
      }
      res.json({ sucesso: true, id: this.lastID });
    }
  );
});

// Rota para buscar frequências com filtros flexíveis
app.get("/frequencia", (req, res) => {
  const { matricula, dataInicial, dataFinal } = req.query;

  let query = "SELECT * FROM frequencia WHERE 1=1";
  const params = [];

  if (matricula) {
    query += " AND LOWER(matricula) LIKE ?";
    params.push(`%${matricula.toLowerCase()}%`);
  }

  if (dataInicial && dataFinal) {
    query += " AND DATE(data) BETWEEN ? AND ?";
    params.push(dataInicial, dataFinal);
  } else if (dataInicial) {
    query += " AND DATE(data) >= ?";
    params.push(dataInicial);
  } else if (dataFinal) {
    query += " AND DATE(data) <= ?";
    params.push(dataFinal);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Erro ao buscar frequência:", err);
      return res.status(500).json({ erro: "Erro ao buscar frequência" });
    }
    res.json(rows);
  });
});

// Deletar frequências
app.post("/frequencia/delete", (req, res) => {
  const { ids } = req.body;

  console.log("Recebido para deletar:", ids); // DEBUG

  if (!Array.isArray(ids) || ids.length === 0) {
    console.warn("Nenhum ID fornecido");
    return res.status(400).json({ erro: "Nenhum ID fornecido para exclusão." });
  }

  const placeholders = ids.map(() => "?").join(", ");
  const query = `DELETE FROM frequencia WHERE id IN (${placeholders})`;

  db.run(query, ids, function (err) {
    if (err) {
      console.error("Erro ao deletar registros:", err.message);
      return res.status(500).json({ erro: "Erro ao deletar registros." });
    }

    console.log(`Registros deletados com sucesso: ${this.changes}`);
    res.json({ mensagem: "Registros deletados com sucesso." });
  });
});

// Criar aluno
app.post("/alunos", (req, res) => {
  const aluno = req.body;
  const { nome, telefone, rua, numero, bairro, cidade, estado, pais } = aluno;

  // Buscar o último número de matrícula
  db.get("SELECT MAX(id) as lastId FROM alunos", [], (err, row) => {
    if (err) {
      console.error("Erro ao buscar último id:", err.message);
      return res.status(500).json({ erro: err.message });
    }
    const nextNumber = (row?.lastId || 0) + 1;
    const matricula = `CLUSA${String(nextNumber).padStart(7, "0")}`;

    const query = `INSERT INTO alunos (matricula, nome, telefone, rua, numero, bairro, cidade, estado, pais)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(
      query,
      [matricula, nome, telefone, rua, numero, bairro, cidade, estado, pais],
      function (err) {
        if (err) {
          console.error("Erro ao inserir aluno:", err.message);
          return res.status(500).json({ erro: err.message });
        }
        res.status(201).json({ id: this.lastID, matricula });
      }
    );
  });
});

// Listar alunos
app.get("/alunos", (req, res) => {
  db.all("SELECT * FROM alunos", [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

// Atualizar aluno
app.put("/alunos/:id", (req, res) => {
  const { id } = req.params;
  const { nome, telefone, rua, numero, bairro, cidade, estado, pais } =
    req.body;

  const query = `UPDATE alunos SET nome = ?, telefone = ?, rua = ?, numero = ?, bairro = ?, cidade = ?, estado = ?, pais = ?
                 WHERE id = ?`;
  db.run(
    query,
    [nome, telefone, rua, numero, bairro, cidade, estado, pais, id],
    function (err) {
      if (err) return res.status(500).json({ erro: err.message });
      res.json({ id });
    }
  );
});

// Deletar aluno
app.delete("/alunos/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM alunos WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ erro: err.message });
    res.json({ id });
  });
});
