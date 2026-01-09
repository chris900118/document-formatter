const { contextBridge, ipcRenderer } = require('electron')

console.log('[Preload] Script is running...')

const safeIpcInvoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

const api = Object.freeze({
  openFile: () => safeIpcInvoke('dialog:openFile'),
  scanHeadings: (inputPath, baseFontSize) => safeIpcInvoke('document:scan_headings', inputPath, baseFontSize),
  formatDocument: (inputPath, payload) => safeIpcInvoke('document:format', inputPath, payload),
  saveProfiles: (profiles) => safeIpcInvoke('store:saveProfiles', profiles),
  loadProfiles: () => safeIpcInvoke('store:loadProfiles'),
  showInFolder: (targetPath) => safeIpcInvoke('util:showInFolder', targetPath),
  openPath: (targetPath) => safeIpcInvoke('util:openPath', targetPath),
  getFonts: () => safeIpcInvoke('system:getFonts'),
  openGuide: () => safeIpcInvoke('app:openGuide'),
  checkMissingFonts: () => safeIpcInvoke('system:checkMissingFonts'),
  installFont: (fontFileName) => safeIpcInvoke('system:installFont', fontFileName),
  getAppVersion: () => safeIpcInvoke('system:getAppVersion'),
  checkForUpdate: () => safeIpcInvoke('system:checkForUpdate'),

  onCheckingForUpdate: (callback) => ipcRenderer.on('checking-for-update', (_event) => callback()),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (_event, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_event, error) => callback(error)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
  testMockUpdate: () => ipcRenderer.invoke('test:mockUpdate'),
  openIntro: () => ipcRenderer.invoke('app:openIntro'),
  closeIntro: () => ipcRenderer.invoke('app:closeIntro'),
  quitAndInstall: () => ipcRenderer.send('update:quitAndInstall'),
})

contextBridge.exposeInMainWorld('electronAPI', api)
console.log('[Preload] electronAPI exposed (contextIsolation ON)')
