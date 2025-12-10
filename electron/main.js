import { app, BrowserWindow, ipcMain } from 'electron';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeUpdater } from './updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database instance
let db = null;
let SQL = null;
let dbPath = '';
let mainWindow = null;

// Initialize DB
const getDbPath = () => {
  return app.isPackaged 
    ? path.join(app.getPath('userData'), 'datawell.db') 
    : path.join(__dirname, '..', 'datawell.db');
};

async function initDatabase() {
  dbPath = getDbPath();
  
  try {
    // Initialize sql.js
    SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath);
      db = new SQL.Database(data);
    } else {
      db = new SQL.Database();
    }
    
    // Create all tables
    createTables();
    
    // Save initial state
    saveDatabase();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
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

function saveDatabase() {
  if (!db || !dbPath) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dbPath, buffer);
}

function queryDatabase(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
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
}

function executeDatabase(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  saveDatabase();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
  // Initialize updater with custom REST API implementation
  if (mainWindow) {
    initializeUpdater(mainWindow);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// --- IPC HANDLERS (Database API) ---

// USERS
ipcMain.handle('db-auth-user', (_, { username, password }) => {
  const result = queryDatabase('SELECT * FROM app_users WHERE username = ? AND password = ?', [username, password]);
  return result.length > 0 ? result[0] : null;
});

ipcMain.handle('db-get-users', () => {
  return queryDatabase('SELECT * FROM app_users');
});

ipcMain.handle('db-save-user', (_, user) => {
  executeDatabase(
    'INSERT OR REPLACE INTO app_users (id, username, password, role) VALUES (?, ?, ?, ?)',
    [user.id, user.username, user.password, user.role]
  );
});

ipcMain.handle('db-delete-user', (_, id) => {
  executeDatabase('DELETE FROM app_users WHERE id = ?', [id]);
});

// WELLS & SYSTEMS
ipcMain.handle('db-get-wells', () => {
  const wells = queryDatabase('SELECT * FROM wells');
  return wells.map(w => ({
    id: w.id,
    name: w.name,
    type: w.type,
    systemId: w.system_id,
    status: w.status,
    createdAt: w.created_at
  }));
});

ipcMain.handle('db-save-well', (_, w) => {
  executeDatabase(
    'INSERT OR REPLACE INTO wells (id, name, type, system_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [w.id, w.name, w.type, w.systemId, w.status, w.createdAt]
  );
});

ipcMain.handle('db-delete-well', (_, id) => {
  executeDatabase('DELETE FROM raw_measurements WHERE well_id = ?', [id]);
  executeDatabase('DELETE FROM daily_averages WHERE well_id = ?', [id]);
  executeDatabase('DELETE FROM daily_report_entries WHERE well_id = ?', [id]);
  executeDatabase('DELETE FROM wells WHERE id = ?', [id]);
});

ipcMain.handle('db-get-systems', () => {
  return queryDatabase('SELECT * FROM systems');
});

ipcMain.handle('db-save-system', (_, s) => {
  executeDatabase('INSERT OR REPLACE INTO systems (id, name) VALUES (?, ?)', [s.id, s.name]);
});

ipcMain.handle('db-delete-system', (_, id) => {
  executeDatabase('DELETE FROM systems WHERE id = ?', [id]);
});

// RULES
ipcMain.handle('db-get-rules', () => {
  const rules = queryDatabase('SELECT * FROM import_rules');
  return rules.map(r => ({
    id: r.id,
    sourceWellNamePattern: r.source_pattern,
    action: r.action,
    targetWellIds: JSON.parse(r.target_ids || '[]'),
    splitPercentage: r.split_percentage
  }));
});

ipcMain.handle('db-save-rule', (_, r) => {
  executeDatabase(
    'INSERT OR REPLACE INTO import_rules (id, source_pattern, action, target_ids, split_percentage) VALUES (?, ?, ?, ?, ?)',
    [r.id, r.sourceWellNamePattern, r.action, JSON.stringify(r.targetWellIds || []), r.splitPercentage]
  );
});

ipcMain.handle('db-delete-rule', (_, id) => {
  executeDatabase('DELETE FROM import_rules WHERE id = ?', [id]);
});

// DATA IMPORT
ipcMain.handle('db-save-import-batch', (_, { raw, avgs }) => {
  // Insert raw measurements
  for (const r of raw) {
    executeDatabase(
      `INSERT INTO raw_measurements (id, well_id, measurement_date, measurement_time, value, channel_name, original_file_name, imported_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.wellId, r.measurementDate, r.measurementTime, r.value, r.channelName, r.originalFileName, r.importedAt]
    );
  }
  
  // Insert averages
  for (const a of avgs) {
    const id = a.id || `${a.wellId}_${a.date}_${a.metricType}`;
    executeDatabase(
      `INSERT OR REPLACE INTO daily_averages (id, well_id, date, avg_value, sample_count, metric_type, unit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, a.wellId, a.date, a.avgValue, a.sampleCount, a.metricType, a.unit]
    );
  }
});

ipcMain.handle('db-get-averages', (_, wellId) => {
  let rows;
  if (wellId) {
    rows = queryDatabase('SELECT * FROM daily_averages WHERE well_id = ? ORDER BY date DESC', [wellId]);
  } else {
    rows = queryDatabase('SELECT * FROM daily_averages ORDER BY date DESC');
  }
  
  return rows.map(r => ({
    id: r.id,
    wellId: r.well_id,
    date: r.date,
    avgValue: r.avg_value,
    sampleCount: r.sample_count,
    metricType: r.metric_type,
    unit: r.unit
  }));
});

// REPORTS
ipcMain.handle('db-get-report', (_, date) => {
  const rows = queryDatabase('SELECT * FROM daily_report_entries WHERE report_date = ?', [date]);
  return mapReportRows(rows);
});

ipcMain.handle('db-get-report-range', (_, { start, end }) => {
  const rows = queryDatabase(
    'SELECT * FROM daily_report_entries WHERE report_date >= ? AND report_date <= ?',
    [start, end]
  );
  return mapReportRows(rows);
});

function mapReportRows(rows) {
  return rows.map(r => ({
    reportDate: r.report_date,
    wellId: r.well_id,
    systemId: r.system_id,
    status: r.status,
    headPressure: r.head_pressure,
    sepPressure: r.sep_pressure,
    steamFlow: r.steam_flow,
    waterFlow: r.water_flow,
    enthalpy: r.enthalpy,
    quality: r.quality,
    operationHours: r.operation_hours,
    stemDistance: r.stem_distance,
    temperature: r.temperature
  }));
}

ipcMain.handle('db-save-report', (_, entries) => {
  for (const e of entries) {
    executeDatabase(
      `INSERT OR REPLACE INTO daily_report_entries 
       (report_date, well_id, system_id, status, head_pressure, sep_pressure, steam_flow, water_flow, enthalpy, quality, operation_hours, stem_distance, temperature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.reportDate, e.wellId, e.systemId, e.status, e.headPressure, e.sepPressure, e.steamFlow, e.waterFlow, e.enthalpy, e.quality, e.operationHours, e.stemDistance, e.temperature]
    );
  }
});

// FILES MANAGEMENT
ipcMain.handle('db-get-files', () => {
  return queryDatabase(
    `SELECT original_file_name as fileName, MAX(imported_at) as importedAt, COUNT(*) as count 
     FROM raw_measurements 
     GROUP BY original_file_name`
  );
});

ipcMain.handle('db-delete-file', (_, fileName) => {
  // Get pairs to identify impacted averages
  const rows = queryDatabase('SELECT well_id, measurement_date FROM raw_measurements WHERE original_file_name = ?', [fileName]);
  
  // Delete Raw
  executeDatabase('DELETE FROM raw_measurements WHERE original_file_name = ?', [fileName]);

  // Delete Averages
  const seen = new Set();
  for (const r of rows) {
    const key = `${r.well_id}_${r.measurement_date}`;
    if (!seen.has(key)) {
      executeDatabase('DELETE FROM daily_averages WHERE well_id = ? AND date = ?', [r.well_id, r.measurement_date]);
      seen.add(key);
    }
  }
});