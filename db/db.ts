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
    
    CREATE TABLE IF NOT EXISTS domain (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL 
    );

    CREATE TABLE IF NOT EXISTS domain_user (
        domain_id UUID NOT NULL,
        user_id UUID NOT NULL,
        role TEXT NOT NULL CHECK (
            role IN ('user', 'admin', 'super_admin')
        ),
        PRIMARY KEY (domain_id, user_id),
        FOREIGN KEY (domain_id) REFERENCES domain(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS spot (
        id UUID PRIMARY KEY,
        domain_id UUID NOT NULL,
        created_at TEXT NOT NULL,
        start_time TEXT NOT NULL, 
        end_time TEXT NOT NULL,   
        title TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (domain_id) REFERENCES domain(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS category (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS spot_category (
        spot_id UUID NOT NULL,
        category_id UUID NOT NULL,
        PRIMARY KEY (spot_id, category_id),
        FOREIGN KEY (spot_id) REFERENCES spot(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recurrence_rule (
        id UUID PRIMARY KEY,
        spot_id UUID NOT NULL,
        frequency_type TEXT NOT NULL CHECK (
            frequency_type IN ('daily', 'weekly', 'monthly', 'yearly', 'interval')
        ),
        weekly_day TEXT CHECK (
            weekly_day IN ('SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA')
        ),
        monthly_date INTEGER CHECK (monthly_date BETWEEN 1 AND 31),
        yearly_date TEXT CHECK (length(yearly_date) = 5),
        interval INTEGER CHECK (interval >= 0), 
        FOREIGN KEY (spot_id) REFERENCES spot(id) ON DELETE CASCADE
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
