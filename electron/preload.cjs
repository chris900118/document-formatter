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
})

contextBridge.exposeInMainWorld('electronAPI', api)
console.log('[Preload] electronAPI exposed (contextIsolation ON)')
