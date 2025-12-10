
export type Role = 'admin' | 'technician';

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface Well {
  id: string;
  name: string; // e.g., "TR-101"
  type: 'production' | 'reinjection';
  systemId: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface System {
  id: string;
  name: string;
}

export interface ImportRule {
  id: string;
  sourceWellNamePattern: string; // e.g., "TR-101"
  action: 'split' | 'assign';
  targetWellIds: string[]; // IDs of wells to distribute data to
  splitPercentage?: number; // If split, how much goes where (simplified for demo)
}

// -- NEW STRUCTURE --

export interface RawMeasurement {
  id: string;
  wellId: string;
  measurementDate: string; // YYYY-MM-DD
  measurementTime: string; // HH:mm:ss
  value: number;
  channelName: string;
  originalFileName: string;
  importedAt: string;
}

export interface DailyAverage {
  id?: string;
  wellId: string;
  date: string; // YYYY-MM-DD
  avgValue: number;
  sampleCount: number;
  metricType: string;
  unit: string;
}

// Updated to reflect the full row in the report table
export interface ReportEntry {
  id?: string;
  reportDate: string;
  wellId: string;
  wellName?: string; // Helper for UI
  wellType?: 'production' | 'reinjection'; // Helper for UI
  
  // Snapshot Configuration
  systemId: string;
  status: 'open' | 'closed';

  // Metrics
  headPressure: number;
  sepPressure: number;
  steamFlow: number;
  waterFlow: number;
  enthalpy: number;
  quality: number;
  operationHours: number;
  stemDistance: number;
  temperature: number;
}

export interface ManualReport {
    // Legacy support if needed, but ReportEntry replaces this
    id: string;
    wellId: string;
    reportDate: string;
    volume: number;
    comments?: string;
}

export interface ImportedFileSummary {
  fileName: string;
  importedAt: string;
  count: number;
}

// --- ELECTRON API DEFINITION ---
declare global {
  interface Window {
    electronAPI?: {
      authenticateUser: (u: string, p: string) => Promise<any>;
      getUsers: () => Promise<any[]>;
      saveUser: (user: any) => Promise<void>;
      deleteUser: (id: string) => Promise<void>;
      
      getWells: () => Promise<any[]>;
      saveWell: (w: any) => Promise<void>;
      deleteWell: (id: string) => Promise<void>;
      getSystems: () => Promise<any[]>;
      saveSystem: (s: any) => Promise<void>;
      deleteSystem: (id: string) => Promise<void>;
      
      getRules: () => Promise<any[]>;
      saveRule: (r: any) => Promise<void>;
      deleteRule: (id: string) => Promise<void>;
      
      saveImportBatch: (raw: any[], avgs: any[]) => Promise<void>;
      getDailyAverages: (wellId?: string) => Promise<any[]>;
      
      getReportEntries: (date: string) => Promise<any[]>;
      getReportEntriesInRange: (start: string, end: string) => Promise<any[]>;
      saveReportEntries: (entries: any[]) => Promise<void>;
      
      getImportedFiles: () => Promise<any[]>;
      deleteImportedFile: (name: string) => Promise<void>;
      
      // Update API
      checkForUpdates: () => Promise<any>;
      downloadUpdate: () => Promise<any>;
      installUpdate: () => Promise<any>;
      getUpdateStatus: () => Promise<any>;
      onUpdateStatus: (callback: (data: any) => void) => void;
      onUpdateProgress: (callback: (data: any) => void) => void;
    }
  }
}