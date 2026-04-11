const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { initDatabase, closeDatabase } = require('./database');
const { seedDatabase } = require('./database/seed');

let mainWindow = null;
let serverInstance = null;

// Determine if we're in development or production
const isDev = !app.isPackaged;

// Find a free port and start the Express server
async function startServer() {
  // Initialize SQLite database first
  initDatabase();

  // Seed sample data (only if database is empty)
  seedDatabase();

  const expressApp = require('./server/server');

  return new Promise((resolve, reject) => {
    // Use port 0 to let OS assign a free port
    serverInstance = expressApp.listen(0, '127.0.0.1', () => {
      const port = serverInstance.address().port;
      console.log(`🚀 Express server running on http://127.0.0.1:${port}`);
      resolve(port);
    });
    serverInstance.on('error', reject);
  });
}

async function createWindow(apiPort) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Jaiswal Billing',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      additionalArguments: [`--api-port=${apiPort}`]
    },
    show: false, // Show after ready
    backgroundColor: '#0f172a'
  });

  // Remove menu bar for a cleaner look
  Menu.setApplicationMenu(null);

  // Show window when ready (prevents flash of white)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Load the React app from built files
  const rendererPath = isDev
    ? path.join(__dirname, 'renderer', 'index.html')
    : path.join(process.resourcesPath, 'renderer', 'index.html');

  await mainWindow.loadFile(rendererPath);
  mainWindow.show(); // Fallback in case ready-to-show fired early

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock - prevent multiple app instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // If user tries to open another instance, focus the existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      const port = await startServer();
      // Store port globally so preload can access it
      process.env.API_PORT = port;
      await createWindow(port);
    } catch (error) {
      console.error('Failed to start application:', error);
      app.quit();
    }
  });
}

app.on('window-all-closed', () => {
  // Shut down Express server
  if (serverInstance) {
    serverInstance.close();
    console.log('🛑 Express server stopped');
  }
  // Close SQLite connection
  closeDatabase();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    startServer().then(port => createWindow(port));
  }
});
