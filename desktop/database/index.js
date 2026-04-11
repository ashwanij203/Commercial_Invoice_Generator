const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const SCHEMA = require('./schema');

let db = null;

/**
 * Initialize SQLite database.
 * Stores data in %APPDATA%/jaiswal-billing/data.db so it persists across updates.
 * @param {string} [appDataPath] - Override path for testing
 */
function initDatabase(appDataPath) {
  const dataDir = appDataPath || path.join(
    process.env.APPDATA || path.join(require('os').homedir(), 'AppData', 'Roaming'),
    'jaiswal-billing'
  );

  // Ensure directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'data.db');
  console.log(`📁 Database location: ${dbPath}`);

  db = new Database(dbPath);

  // Performance settings
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Execute schema (CREATE TABLE IF NOT EXISTS — safe to run every time)
  db.exec(SCHEMA);

  console.log('✅ SQLite database initialized');
  return db;
}

/**
 * Get the database instance.
 * @returns {Database}
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection gracefully.
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Database connection closed');
  }
}

module.exports = { initDatabase, getDb, closeDatabase };
