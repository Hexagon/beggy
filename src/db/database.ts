import { Database } from "@db/sqlite"

let db: Database | null = null

export function getDatabase(): Database {
  if (!db) {
    throw new Error("Database not initialized")
  }
  return db
}

export async function initDatabase(): Promise<void> {
  // Use file-based SQLite for persistence, in-memory for Deno Deploy
  const dbPath = Deno.env.get("DENO_DEPLOYMENT_ID") ? ":memory:" : "./data/beggy.db"

  // Ensure data directory exists for local development
  if (dbPath !== ":memory:") {
    try {
      await Deno.mkdir("./data", { recursive: true })
    } catch {
      // Directory might already exist
    }
  }

  db = new Database(dbPath)

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      city TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
    CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
    CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
    CREATE INDEX IF NOT EXISTS idx_images_ad_id ON images(ad_id);
  `)

  console.log("✅ Databas initierad")
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
