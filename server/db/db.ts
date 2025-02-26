import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

const db = new DB("./db/database.db");

db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    image TEXT
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
