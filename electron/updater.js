import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';

// Configure logger
Object.assign(console, log.functions);
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

let mainWindow = null;
let updateAvailable = false;
let updateDownloaded = false;

export function initializeUpdater(window) {
  mainWindow = window;

  // Configure update settings
  autoUpdater.checkForUpdatesAndNotify();

  // Check for updates every hour
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);

  // --- EVENTS ---

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'checking',
        message: 'Buscando actualizaciones...'
      });
    }
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    updateAvailable = true;
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'available',
        message: `Actualización disponible: v${info.version}`,
        version: info.version,
        releaseDate: info.releaseDate
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    log.info('Update not available');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'not-available',
        message: 'Ya está usando la versión más reciente'
      });
    }
  });

  autoUpdater.on('error', (error) => {
    log.error('Update error:', error);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        message: `Error: ${error.message}`
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download progress: ${progressObj.percent}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', {
        percent: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    updateDownloaded = true;
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'downloaded',
        message: `Actualización descargada. Se instalará al reiniciar.`,
        version: info.version
      });
    }
  });

  // --- IPC HANDLERS ---

  ipcMain.handle('update-check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        updateAvailable: result?.updateInfo ? true : false,
        currentVersion: app.getVersion(),
        version: result?.updateInfo?.version || null
      };
    } catch (error) {
      return {
        error: error.message,
        currentVersion: app.getVersion()
      };
    }
  });

  ipcMain.handle('update-download', async () => {
    if (!updateAvailable) {
      return { success: false, message: 'No hay actualización disponible' };
    }
    try {
      await autoUpdater.downloadUpdate();
      return { success: true, message: 'Descargando actualización...' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-install', () => {
    if (updateDownloaded) {
      autoUpdater.quitAndInstall();
      return { success: true };
    }
    return { success: false, message: 'Actualización no descargada' };
  });

  ipcMain.handle('update-status', () => {
    return {
      updateAvailable,
      updateDownloaded,
      currentVersion: app.getVersion()
    };
  });
}

export function checkForUpdatesOnStartup() {
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}
