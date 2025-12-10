import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { app, BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';
import https from 'https';
import { URL } from 'url';

// Catch unhandled promise rejections globally in main process and log them
process.on('unhandledRejection', (reason, p) => {
  try {
    log.error('Unhandled Rejection at:', p, 'reason:', reason);
  } catch (e) {
    console.error('Unhandled Rejection:', reason, p);
  }
});

// Configure logger
Object.assign(console, log.functions);
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// IMPORTANT: Disable autoUpdater's automatic checking since we use custom REST API
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
// Explicitly disable the periodic update check that runs every 1 hour by default
// by setting checkForUpdatesAndNotify to null

let mainWindow = null;
let updateAvailable = false;
let updateDownloaded = false;

// Custom function to check for updates using GitHub REST API (works with public repos)
async function checkForUpdatesViaRestAPI() {
  return new Promise((resolve, reject) => {
    try {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/hcabrera-geo/datawell-import-pro/releases',
        method: 'GET',
        headers: {
          'User-Agent': 'DataWell-Pro-Updater/1.0.1'
        }
      };

      log.info(`Making HTTPS request to ${options.hostname}${options.path}`);

      const req = https.request(options, (res) => {
        let data = '';
        
        log.info(`GitHub API response status: ${res.statusCode}`);
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', async () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`GitHub API error: ${res.statusCode}`);
            }

            const releases = JSON.parse(data);
            log.info(`Received ${releases.length} releases from GitHub`);

            if (!Array.isArray(releases) || releases.length === 0) {
              throw new Error('No releases found');
            }

            // Find the first published (non-draft, non-prerelease) release
            const release = releases.find(r => !r.draft && !r.prerelease) || releases[0];
            if (!release) {
              throw new Error('No published releases found');
            }

            // Get current version from package.json
            const currentVersion = app.getVersion();
            const latestVersion = release.tag_name.replace(/^v/, '');

            log.info(`Current version: ${currentVersion}, Latest version: ${latestVersion}`);

            // Compare versions (simple string comparison works for semantic versioning)
            if (latestVersion > currentVersion) {
              log.info(`Update available: ${latestVersion}`);
              updateAvailable = true;
              if (mainWindow) {
                mainWindow.webContents.send('update-status', {
                  status: 'available',
                  message: `Actualización disponible: v${latestVersion}`,
                  version: latestVersion,
                  releaseDate: release.published_at
                });
              }
              resolve({ available: true, version: latestVersion, releaseUrl: release.html_url });
            } else {
              log.info('No update available');
              if (mainWindow) {
                mainWindow.webContents.send('update-status', {
                  status: 'not-available',
                  message: 'Ya está usando la versión más reciente'
                });
              }
              resolve({ available: false });
            }
          } catch (err) {
            log.error('Failed to parse GitHub response:', err);
            reject(err);
          }
        });
      });

      req.on('error', (err) => {
        log.error('GitHub API request error:', err);
        reject(err);
      });

      req.end();
    } catch (err) {
      log.error('REST API check setup error:', err);
      reject(err);
    }
  }).catch((err) => {
    log.error('REST API check failed:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        message: `Error checking for updates: ${err?.message || String(err)}`
      });
    }
    throw err;
  });
}

export function initializeUpdater(window) {
  mainWindow = window;

  // Configure update settings
  try {
    // Use custom REST API check instead of electron-updater's Atom feed
    checkForUpdatesViaRestAPI().catch((err) => {
      log.error('Updater check failed:', err);
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          status: 'error',
          message: 'No se pudo verificar las actualizaciones'
        });
      }
    });
  } catch (err) {
    log.error('Updater initialization error:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        message: err?.message || String(err)
      });
    }
  }

  // Check for updates every hour
  setInterval(() => {
    checkForUpdatesViaRestAPI().catch((err) => {
      log.error('Periodic update check failed:', err);
    });
  }, 60 * 60 * 1000);

  // NOTE: autoUpdater event handlers are DISABLED
  // We use custom REST API implementation instead to avoid conflicts
  // Do NOT add autoUpdater.on() listeners here

  // --- IPC HANDLERS ---

  ipcMain.handle('update-check', async () => {
    try {
      // Use custom REST API (avoids latest.yml requirement)
      const result = await checkForUpdatesViaRestAPI();
      return {
        updateAvailable: result?.available || false,
        version: result?.version || null,
        releaseUrl: result?.releaseUrl || null,
        currentVersion: app.getVersion()
      };
    } catch (error) {
      return {
        error: error.message,
        currentVersion: app.getVersion()
      };
    }
  });

  ipcMain.handle('update-download', async () => {
    // Download via electron-updater requires latest.yml; provide clear response instead of failing silently
    if (!updateAvailable) {
      return { success: false, message: 'No hay actualización disponible' };
    }
    return {
      success: false,
      message: 'Descarga automática no configurada (falta latest.yml en la release)'
    };
  });

  ipcMain.handle('update-install', () => {
    return {
      success: false,
      message: 'Instalación automática no disponible en esta versión'
    };
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
  // DISABLED: Using custom checkForUpdatesViaRestAPI() in initializeUpdater() instead
  // This function previously called autoUpdater.checkForUpdatesAndNotify()
  // which used the Atom feed endpoint that doesn't work for public repos
  log.info('Auto-update check via custom REST API initialization');
}
