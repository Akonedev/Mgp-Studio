const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { register: registerLocalInference } = require('./lib/localInference');
const { register: registerWan2gp } = require('./lib/wan2gpProvider');

// Ubuntu 24.04+ sets kernel.apparmor_restrict_unprivileged_userns=1 which
// blocks Chromium's user namespace sandbox. The .deb package ships an AppArmor
// profile that grants the permission cleanly. When running the AppImage on an
// affected system, run once: sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
// or pass --no-sandbox on the command line.
if (process.platform === 'linux') {
    app.commandLine.appendSwitch('no-sandbox');
}

let mainWindow;

function createWindow() {
    const isMac = process.platform === 'darwin';

    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 640,
        webPreferences: {
            webSecurity: false,
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        },
        ...(isMac ? { titleBarStyle: 'hiddenInset' } : {}),
        backgroundColor: '#0d0d0d',
        show: false,
        title: 'Mgp Studio — Môguô Puissant',
    });

    const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
    const startUrl = process.env.ELECTRON_START_URL || (isDev ? 'http://localhost:58101/studio' : null);

    if (startUrl) {
        console.log(`[Electron] Loading URL: ${startUrl}`);
        mainWindow.loadURL(startUrl).catch((err) => {
            console.error('Failed to load startUrl:', err);
            const indexPath = path.join(__dirname, '../dist/index.html');
            mainWindow.loadFile(indexPath);
        });
    } else {
        const indexPath = path.join(__dirname, '../dist/index.html');
        mainWindow.loadFile(indexPath).catch((err) => {
            console.error('Failed to load index.html:', err);
            mainWindow.show();
        });
    }

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.webContents.on('did-fail-load', (event, code, desc) => {
        console.error('did-fail-load:', code, desc);
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();
    registerLocalInference();
    registerWan2gp();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
