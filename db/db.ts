import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

const db = new DB("./db/database.db");

db.execute(`
    CREATE TABLE IF NOT EXISTS user (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL, 
        image BLOB
    );
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
