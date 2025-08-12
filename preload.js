const { contextBridge, ipcRenderer, shell, screen } = require('electron');

// Expose methods to the renderer process using the contextBridge
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, callback) => ipcRenderer.on(channel, callback),
    once: (channel, listener) => ipcRenderer.once(channel, listener),
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  },
  shell: {
    openExternal: (url) => shell.openExternal(url),
  },
  // Expose functions for launching applications (MobaXterm, Medini, etc.)
  launchMobaXterm: (credentials) => ipcRenderer.send('launch-mobaxterm', credentials),
  launchMedini: () => ipcRenderer.send('launch-Medini'),
  launchFaultinjection: () => ipcRenderer.send('launch-FI'),
  launchEthernet: () => ipcRenderer.send('launch-EN'),
  launchSecure: () => ipcRenderer.send('launch-Secure'),
  // Expose resize handling
  getWindowSize: () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    return { width, height };
  }
});
