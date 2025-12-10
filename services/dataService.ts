import { Well, System, ImportRule, RawMeasurement, DailyAverage, User, ImportedFileSummary, ReportEntry } from '../types';
import { MOCK_WELLS, MOCK_SYSTEMS, INITIAL_RULES } from '../constants';

// Local Storage Keys (Fallback only)
const LS_KEYS = {
  WELLS: 'dw_wells',
  SYSTEMS: 'dw_systems',
  RULES: 'dw_rules',
  RAW_DATA: 'dw_raw_data',
  AVERAGES: 'dw_daily_averages',
  REPORT_ENTRIES: 'dw_daily_report_entries',
  USERS: 'dw_users'
};

const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;

export const updateSupabaseConfig = (url: string, key: string) => {
    // Deprecated in Electron version, kept for web compatibility
    console.warn("Supabase configuration is not used in Electron Desktop mode");
};

export const getSupabaseConfig = () => ({ url: '', key: '' });

// --- AUTH & USERS ---

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
    if (isElectron()) {
        const user = await window.electronAPI!.authenticateUser(username, password);
        return user ? { id: user.id, username: user.username, role: user.role } : null;
    }
    
    // Fallback Local
    const localUsers = await getUsers();
    const found = localUsers.find(u => u.username === username && (u as any).password === password);
    if (found) return found;

    const stored = localStorage.getItem(LS_KEYS.USERS);
    if (!stored) {
        if (username === 'admin' && password === '1234') return { id: '1', username: 'admin', role: 'admin' };
    }
    return null;
};

export const getUsers = async (): Promise<any[]> => {
    if (isElectron()) return await window.electronAPI!.getUsers();

    const stored = localStorage.getItem(LS_KEYS.USERS);
    if (stored) return JSON.parse(stored);
    
    return [
        { id: '1', username: 'admin', password: '1234', role: 'admin' },
        { id: '2', username: 'tecnico', password: '1234', role: 'technician' }
    ];
};

export const saveUser = async (user: any) => {
    if (isElectron()) return await window.electronAPI!.saveUser(user);
    
    const users = await getUsers();
    if (users.find(u => u.username === user.username)) throw new Error("El usuario ya existe");
    const newUser = { ...user, id: crypto.randomUUID() };
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify([...users, newUser]));
};

export const deleteUser = async (id: string) => {
    if (isElectron()) return await window.electronAPI!.deleteUser(id);
    const users = await getUsers();
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users.filter(u => u.id !== id)));
};


// --- WELLS & SYSTEMS ---

export const getWells = async (): Promise<Well[]> => {
  if (isElectron()) return await window.electronAPI!.getWells();
  const stored = localStorage.getItem(LS_KEYS.WELLS);
  return stored ? JSON.parse(stored) : MOCK_WELLS;
};

export const saveWell = async (well: Well) => {
  if (isElectron()) return await window.electronAPI!.saveWell(well);
  const wells = await getWells(); 
  const exists = wells.find(w => w.id === well.id);
  const updated = exists ? wells.map(w => w.id === well.id ? well : w) : [...wells, well];
  localStorage.setItem(LS_KEYS.WELLS, JSON.stringify(updated));
};

export const deleteWell = async (id: string) => {
  if (isElectron()) return await window.electronAPI!.deleteWell(id);
  const wells = await getWells();
  localStorage.setItem(LS_KEYS.WELLS, JSON.stringify(wells.filter((w: Well) => w.id !== id)));
};

export const getSystems = async (): Promise<System[]> => {
  if (isElectron()) return await window.electronAPI!.getSystems();
  const stored = localStorage.getItem(LS_KEYS.SYSTEMS);
  return stored ? JSON.parse(stored) : MOCK_SYSTEMS;
};

export const saveSystem = async (sys: System) => {
    if (isElectron()) return await window.electronAPI!.saveSystem(sys);
    const systems = await getSystems();
    localStorage.setItem(LS_KEYS.SYSTEMS, JSON.stringify([...systems.filter(s => s.id !== sys.id), sys]));
};

export const deleteSystem = async (id: string) => {
    if (isElectron()) return await window.electronAPI!.deleteSystem(id);
    const systems = await getSystems();
    localStorage.setItem(LS_KEYS.SYSTEMS, JSON.stringify(systems.filter(s => s.id !== id)));
};

// --- RULES ---
export const getRules = async (): Promise<ImportRule[]> => {
    if (isElectron()) return await window.electronAPI!.getRules();
    const stored = localStorage.getItem(LS_KEYS.RULES);
    return stored ? JSON.parse(stored) : INITIAL_RULES;
};

export const saveRule = async (rule: ImportRule) => {
    if (isElectron()) return await window.electronAPI!.saveRule(rule);
    const rules = await getRules();
    localStorage.setItem(LS_KEYS.RULES, JSON.stringify([...rules.filter(r => r.id !== rule.id), rule]));
};

export const deleteRule = async (id: string) => {
    if (isElectron()) return await window.electronAPI!.deleteRule(id);
    const rules = await getRules();
    localStorage.setItem(LS_KEYS.RULES, JSON.stringify(rules.filter(r => r.id !== id)));
};

// --- IMPORT PROCESS ---

export const saveImportBatch = async (
    rawMeasurements: RawMeasurement[], 
    dailyAverages: DailyAverage[]
) => {
    if (isElectron()) {
        return await window.electronAPI!.saveImportBatch(rawMeasurements, dailyAverages);
    }
    
    // ... (existing Local Storage import logic) ...
    const existingRaw = JSON.parse(localStorage.getItem(LS_KEYS.RAW_DATA) || '[]');
    const newRaw = [...existingRaw, ...rawMeasurements].slice(-5000); 
    localStorage.setItem(LS_KEYS.RAW_DATA, JSON.stringify(newRaw));

    const existingAvg = JSON.parse(localStorage.getItem(LS_KEYS.AVERAGES) || '[]');
    const newAvgList = [...existingAvg];
    dailyAverages.forEach(newAvg => {
        const idx = newAvgList.findIndex(x => x.wellId === newAvg.wellId && x.date === newAvg.date && x.metricType === newAvg.metricType);
        if (idx >= 0) newAvgList[idx] = newAvg;
        else newAvgList.push(newAvg);
    });
    localStorage.setItem(LS_KEYS.AVERAGES, JSON.stringify(newAvgList));
};

export const getDailyAverages = async (wellId?: string): Promise<DailyAverage[]> => {
    if (isElectron()) {
        return await window.electronAPI!.getDailyAverages(wellId);
    }
    const stored = JSON.parse(localStorage.getItem(LS_KEYS.AVERAGES) || '[]');
    if (wellId) return stored.filter((x: DailyAverage) => x.wellId === wellId);
    return stored;
};

// --- REPORT ENTRIES ---

export const getReportEntries = async (date: string): Promise<ReportEntry[]> => {
    if (isElectron()) return await window.electronAPI!.getReportEntries(date);
    
    // Local Storage
    const allEntries = JSON.parse(localStorage.getItem(LS_KEYS.REPORT_ENTRIES) || '[]');
    return allEntries.filter((e: ReportEntry) => e.reportDate === date);
};

export const getReportEntriesInRange = async (startDate: string, endDate: string): Promise<ReportEntry[]> => {
    if (isElectron()) return await window.electronAPI!.getReportEntriesInRange(startDate, endDate);

    // Local Storage
    const allEntries = JSON.parse(localStorage.getItem(LS_KEYS.REPORT_ENTRIES) || '[]');
    return allEntries.filter((e: ReportEntry) => e.reportDate >= startDate && e.reportDate <= endDate);
};

export const saveReportEntries = async (entries: ReportEntry[]) => {
    if (isElectron()) return await window.electronAPI!.saveReportEntries(entries);

    // Local Storage
    const allEntries = JSON.parse(localStorage.getItem(LS_KEYS.REPORT_ENTRIES) || '[]');
    // Remove existing entries for this date/well combination to avoid dupes
    const filtered = allEntries.filter((exist: ReportEntry) => 
        !entries.some(newE => newE.reportDate === exist.reportDate && newE.wellId === exist.wellId)
    );
    localStorage.setItem(LS_KEYS.REPORT_ENTRIES, JSON.stringify([...filtered, ...entries]));
};


// --- FILES ---

export const getImportedFiles = async (): Promise<ImportedFileSummary[]> => {
    if (isElectron()) return await window.electronAPI!.getImportedFiles();
    
    const raw = JSON.parse(localStorage.getItem(LS_KEYS.RAW_DATA) || '[]');
    const groups: Record<string, any> = {};
    raw.forEach((r: RawMeasurement) => {
        if(!groups[r.originalFileName]) groups[r.originalFileName] = { fileName: r.originalFileName, importedAt: r.importedAt, count: 0 };
        groups[r.originalFileName].count++;
    });
    return Object.values(groups);
};

export const deleteImportedFile = async (fileName: string) => {
    if (isElectron()) return await window.electronAPI!.deleteImportedFile(fileName);

    // Local delete
    const raw = JSON.parse(localStorage.getItem(LS_KEYS.RAW_DATA) || '[]');
    const fileData = raw.filter((r: RawMeasurement) => r.originalFileName === fileName);
    const newRaw = raw.filter((r: RawMeasurement) => r.originalFileName !== fileName);
    localStorage.setItem(LS_KEYS.RAW_DATA, JSON.stringify(newRaw));
    const avgs = JSON.parse(localStorage.getItem(LS_KEYS.AVERAGES) || '[]');
    const keysToDelete = new Set(fileData.map((d: RawMeasurement) => `${d.wellId}_${d.measurementDate}`));
    const newAvgs = avgs.filter((a: DailyAverage) => !keysToDelete.has(`${a.wellId}_${a.date}`));
    localStorage.setItem(LS_KEYS.AVERAGES, JSON.stringify(newAvgs));
};