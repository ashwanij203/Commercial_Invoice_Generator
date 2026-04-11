const { contextBridge } = require('electron');

// Extract port from command line arguments
const portArg = process.argv.find(arg => arg.startsWith('--api-port='));
const apiPort = portArg ? portArg.split('=')[1] : '5000';

// Expose API URL to the renderer process securely
contextBridge.exposeInMainWorld('electronAPI', {
  apiUrl: `http://127.0.0.1:${apiPort}/api`,
  isDesktop: true,
  platform: process.platform
});
