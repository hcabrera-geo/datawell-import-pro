import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Users
  authenticateUser: (username, password) => ipcRenderer.invoke('db-auth-user', { username, password }),
  getUsers: () => ipcRenderer.invoke('db-get-users'),
  saveUser: (user) => ipcRenderer.invoke('db-save-user', user),
  deleteUser: (id) => ipcRenderer.invoke('db-delete-user', id),

  // Wells & Systems
  getWells: () => ipcRenderer.invoke('db-get-wells'),
  saveWell: (well) => ipcRenderer.invoke('db-save-well', well),
  deleteWell: (id) => ipcRenderer.invoke('db-delete-well', id),
  getSystems: () => ipcRenderer.invoke('db-get-systems'),
  saveSystem: (system) => ipcRenderer.invoke('db-save-system', system),
  deleteSystem: (id) => ipcRenderer.invoke('db-delete-system', id),

  // Rules
  getRules: () => ipcRenderer.invoke('db-get-rules'),
  saveRule: (rule) => ipcRenderer.invoke('db-save-rule', rule),
  deleteRule: (id) => ipcRenderer.invoke('db-delete-rule', id),

  // Data
  saveImportBatch: (raw, avgs) => ipcRenderer.invoke('db-save-import-batch', { raw, avgs }),
  getDailyAverages: (wellId) => ipcRenderer.invoke('db-get-averages', wellId),
  
  // Reports
  getReportEntries: (date) => ipcRenderer.invoke('db-get-report', date),
  getReportEntriesInRange: (start, end) => ipcRenderer.invoke('db-get-report-range', { start, end }),
  saveReportEntries: (entries) => ipcRenderer.invoke('db-save-report', entries),

  // Files
  getImportedFiles: () => ipcRenderer.invoke('db-get-files'),
  deleteImportedFile: (fileName) => ipcRenderer.invoke('db-delete-file', fileName),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('update-check'),
  downloadUpdate: () => ipcRenderer.invoke('update-download'),
  installUpdate: () => ipcRenderer.invoke('update-install'),
  getUpdateStatus: () => ipcRenderer.invoke('update-status'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_, data) => callback(data)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (_, data) => callback(data))
});