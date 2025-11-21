/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    openFile: () => Promise<string | null>
    saveFile: () => Promise<string | null>
    formatDocument: (inputPath: string, outputPath: string, options: any) => Promise<{
      success: boolean
      message: string
      output?: string
      error?: string
    }>
  }
}
