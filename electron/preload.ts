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
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info))
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info))
  },
  quitAndInstall: () => ipcRenderer.send('update:quitAndInstall'),
})

contextBridge.exposeInMainWorld('electronAPI', api)
console.log('[Preload] electronAPI injected')
