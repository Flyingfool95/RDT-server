import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

const db = new DB("./db/database.db");

db.execute(`
  CREATE TABLE IF NOT EXISTS user (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    image BLOB
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID PRIMARY KEY,
    token TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS domain (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    image TEXT
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS domain_user (
    domain_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (
      role IN ('user', 'admin', 'super_admin')
    ),
    PRIMARY KEY (domain_id, user_id),
    FOREIGN KEY (domain_id) REFERENCES domain(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  )
`);

function closeDb() {
    console.log("Closing database...");
    db.close();
    console.log("Database closed.");
}

Deno.addSignalListener("SIGINT", () => {
    closeDb();
    Deno.exit();
});

export default db;
