import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let db = null;
let SQL = null;
let dbPath = '';

export async function initDatabase(dbFilePath) {
  dbPath = dbFilePath;
  
  // Initialize sql.js
  SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath);
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
    // Create directory if it doesn't exist
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Create all tables
  createTables();
  
  // Save initial state
  saveDatabase();
  
  return db;
}

function createTables() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS systems (
      id TEXT PRIMARY KEY,
      name TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS wells (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      system_id TEXT,
      status TEXT,
      created_at TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS import_rules (
      id TEXT PRIMARY KEY,
      source_pattern TEXT,
      action TEXT,
      target_ids TEXT,
      split_percentage REAL
    )`,
    
    `CREATE TABLE IF NOT EXISTS raw_measurements (
      id TEXT PRIMARY KEY,
      well_id TEXT,
      measurement_date TEXT,
      measurement_time TEXT,
      value REAL,
      channel_name TEXT,
      original_file_name TEXT,
      imported_at TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS daily_averages (
      id TEXT PRIMARY KEY,
      well_id TEXT,
      date TEXT,
      avg_value REAL,
      sample_count INTEGER,
      metric_type TEXT,
      unit TEXT,
      UNIQUE(well_id, date, metric_type)
    )`,
    
    `CREATE TABLE IF NOT EXISTS daily_report_entries (
      report_date TEXT,
      well_id TEXT,
      system_id TEXT,
      status TEXT,
      head_pressure REAL,
      sep_pressure REAL,
      steam_flow REAL,
      water_flow REAL,
      enthalpy REAL,
      quality REAL,
      operation_hours REAL,
      stem_distance REAL,
      temperature REAL,
      PRIMARY KEY (report_date, well_id)
    )`
  ];
  
  statements.forEach(stmt => {
    try {
      db.run(stmt);
    } catch (e) {
      // Table might already exist
    }
  });
  
  // Insert default admin if not exists
  try {
    db.run(`INSERT OR IGNORE INTO app_users (id, username, password, role) VALUES ('1', 'admin', '1234', 'admin')`);
  } catch (e) {
    // Already exists
  }
}

export function saveDatabase() {
  if (!db || !dbPath) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export function getDatabase() {
  return db;
}

export function runQuery(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  try {
    db.run(sql, params);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

export function getQuery(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

export function execQuery(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  try {
    db.run(sql, params);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}
