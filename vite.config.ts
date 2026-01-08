import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'electron-updater']
            }
          }
        }
      }
    ]),
    // 手动复制 preload.cjs 文件
    {
      name: 'copy-preload',
      buildStart() {
        const srcPath = path.join(process.cwd(), 'electron', 'preload.cjs')
        const destPath = path.join(process.cwd(), 'dist-electron', 'preload.cjs')

        // 确保目标目录存在
        const destDir = path.dirname(destPath)
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }

        // 复制文件
        fs.copyFileSync(srcPath, destPath)
        console.log('[Vite] Copied preload.cjs to dist-electron')
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
