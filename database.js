const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'passwords.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

const stmts = {
  all: db.prepare(`
    SELECT id, service, username, url, created_at, updated_at
    FROM passwords ORDER BY updated_at DESC
  `),
  search: db.prepare(`
    SELECT id, service, username, url, created_at, updated_at
    FROM passwords
    WHERE service LIKE ? OR username LIKE ? OR url LIKE ?
    ORDER BY updated_at DESC
  `),
  getById: db.prepare('SELECT * FROM passwords WHERE id = ?'),
  insert: db.prepare(`
    INSERT INTO passwords (service, username, password_encrypted, url, notes)
    VALUES (?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE passwords
    SET service = ?, username = ?, password_encrypted = ?, url = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `),
  updateNoPwd: db.prepare(`
    UPDATE passwords
    SET service = ?, username = ?, url = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM passwords WHERE id = ?'),
};

module.exports = { db, stmts };
