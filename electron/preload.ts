import { contextBridge, ipcRenderer } from 'electron'

console.log('[Preload] Script running with contextIsolation=true')

const safeInvoke = (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)

const api = Object.freeze({
  openFile: () => safeInvoke('dialog:openFile'),
  scanHeadings: (inputPath: string, baseFontSize?: number) => safeInvoke('document:scan_headings', inputPath, baseFontSize),
  formatDocument: (inputPath: string, payload: any) => safeInvoke('document:format', inputPath, payload),
  saveProfiles: (profiles: any[]) => safeInvoke('store:saveProfiles', profiles),
  loadProfiles: () => safeInvoke('store:loadProfiles'),
  showInFolder: (path: string) => safeInvoke('util:showInFolder', path),
  openPath: (path: string) => safeInvoke('util:openPath', path),
  openExternal: (url: string) => safeInvoke('util:openExternal', url),
  getFonts: () => safeInvoke('system:getFonts'),
  checkMissingFonts: () => safeInvoke('system:checkMissingFonts'),
  installFont: (fontFileName: string) => safeInvoke('system:installFont', fontFileName),
  getAppVersion: () => safeInvoke('system:getAppVersion'),
  checkForUpdate: () => safeInvoke('system:checkForUpdate'),

  onCheckingForUpdate: (callback: () => void) => ipcRenderer.on('checking-for-update', (_event) => callback()),
  onUpdateAvailable: (callback: (info: any) => void) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
  onUpdateNotAvailable: (callback: (info: any) => void) => ipcRenderer.on('update-not-available', (_event, info) => callback(info)),
  onUpdateError: (callback: (error: string) => void) => ipcRenderer.on('update-error', (_event, error) => callback(error)),
  onDownloadProgress: (callback: (progress: any) => void) => ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
  onUpdateDownloaded: (callback: (info: any) => void) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
  testMockUpdate: () => ipcRenderer.invoke('test:mockUpdate'),
  openIntro: () => ipcRenderer.invoke('app:openIntro'),
  closeIntro: () => ipcRenderer.invoke('app:closeIntro'),
  quitAndInstall: () => ipcRenderer.send('update:quitAndInstall'),
})

contextBridge.exposeInMainWorld('electronAPI', api)
console.log('[Preload] electronAPI injected')
