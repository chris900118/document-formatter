/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string | null>
      scanHeadings: (inputPath: string, baseFontSize?: number) => Promise<{
        success: boolean
        structure?: Array<{
          index: number
          text: string
          style: string
          suggested_key: string
        }>
        error?: string
      }>
      formatDocument: (inputPath: string, payload: any) => Promise<{
        success: boolean
        message: string
        outputPath?: string
      }>
      saveProfiles: (profiles: any[]) => Promise<{ success: boolean; error?: string }>
      loadProfiles: () => Promise<{ success: boolean; profiles?: any[]; error?: string }>
      getFonts: () => Promise<{ success: boolean; fonts: string[]; error?: string }>
      showInFolder: (path: string) => Promise<{ success: boolean; error?: string }>
      openPath: (path: string) => Promise<{ success: boolean; error?: string }>
      openGuide: () => Promise<{ success: boolean; error?: string }>
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
      checkMissingFonts: () => Promise<{ success: boolean; missing: string[]; error?: string }>
      installFont: (fontFileName: string) => Promise<{ success: boolean; message?: string; error?: string }>
      getAppVersion: () => Promise<string>
      onCheckingForUpdate: (callback: () => void) => void
      onUpdateAvailable: (callback: (info: any) => void) => void
      onUpdateNotAvailable: (callback: (info: any) => void) => void
      onUpdateError: (callback: (error: string) => void) => void
      onDownloadProgress: (callback: (progress: any) => void) => void
      onUpdateDownloaded: (callback: (info: any) => void) => void
      testMockUpdate: () => Promise<void>
      openIntro: () => Promise<void>
      closeIntro: () => Promise<void>
      quitAndInstall: () => void
    }
  }
}

export { }
