import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.platform === 'win32') {
  // eslint-disable-next-line
  import('electron-squirrel-startup').then(squirrelStartup => {
      if (squirrelStartup.default) app.quit();
  });
}

let mainWindow;

// Determine where data.json is located
let DATA_FILE;
if (app.isPackaged) {
    // In production, use the userData directory for persistence
    DATA_FILE = path.join(app.getPath('userData'), 'data.json');
} else {
    // In development, use the root directory
    DATA_FILE = path.join(__dirname, '..', 'data.json');
}

console.log('Data file path:', DATA_FILE);

async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        // File doesn't exist, create it with default empty structure
        const defaultData = {
            rooms: [],
            seats: [],
            students: [],
            assignments: {}
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = 'http://localhost:5173';

  if (!app.isPackaged) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // IPC Handlers
  ipcMain.handle('load-data', async () => {
    try {
        await ensureDataFile();
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        throw error;
    }
  });

  ipcMain.handle('save-data', async (event, data) => {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (error) {
        console.error('Error writing data:', error);
        throw error;
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
