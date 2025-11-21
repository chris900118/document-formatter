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
  getFonts: () => safeInvoke('system:getFonts'),
})

contextBridge.exposeInMainWorld('electronAPI', api)
console.log('[Preload] electronAPI injected')
