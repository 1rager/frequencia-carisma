const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./frequencia.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS frequencia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula TEXT NOT NULL,
      data DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
