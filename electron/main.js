const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Determine where data.json lives.
// If packaged (exe), it lives next to the exe.
// If dev, it lives in the project root.
const DATA_PATH = app.isPackaged
    ? path.join(path.dirname(process.execPath), 'data.json')
    : path.join(__dirname, '..', 'data.json');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true // Looks cleaner
    });

    // In dev, load vite server. In prod, load built file.
    if (!app.isPackaged) {
        win.loadURL('http://localhost:5173');
        // win.webContents.openDevTools(); // Optional: Enable for debugging
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    // IPC Handlers (Replacing Express Routes)

    // GET Data
    ipcMain.handle('get-data', async () => {
        try {
            if (!fs.existsSync(DATA_PATH)) {
                // Default empty structure if missing
                return { rooms: [], seats: [], students: [], assignments: {} };
            }
            const data = fs.readFileSync(DATA_PATH, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error('Read Error:', err);
            return { error: 'Failed to read data' };
        }
    });

    // SAVE Data
    ipcMain.handle('save-data', async (event, content) => {
        try {
            // Simple file lock check could be added here
            fs.writeFileSync(DATA_PATH, JSON.stringify(content, null, 2));
            return { success: true };
        } catch (err) {
            console.error('Write Error:', err);
            return { error: 'Failed to write data' };
        }
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
