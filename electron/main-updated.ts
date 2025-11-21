import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn, execSync } from 'child_process'
import fs from 'fs'
import Store from 'electron-store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// 初始化 electron-store
const store = new Store({
  name: 'profiles',
  defaults: {
    profiles: []
  }
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  // 使用 .cjs 扩展名
  const preloadPath = path.join(__dirname, 'preload.cjs')
  
  console.log('[Main] isDev:', isDev)
  console.log('[Main] __dirname:', __dirname)
  console.log('[Main] Preload path:', preloadPath)
  console.log('[Main] Preload exists:', fs.existsSync(preloadPath))
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: false,  // 暂时禁用隔离以调试
      sandbox: false
    }
  })

  // 等待窗口创建完成后再加载内容
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Page loaded')
    mainWindow!.webContents.executeJavaScript('console.log("[Main] Checking electronAPI:", typeof window.electronAPI)')
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 文件选择对话框
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Word Documents', extensions: ['docx', 'doc'] }
    ]
  })
  
  if (result.canceled) {
    return null
  }
  return result.filePaths[0]
})

// 处理文档格式化 - 调用 PyInstaller 打包的 EXE
ipcMain.handle('document:format', async (_event, inputPath: string, profile?: any) => {
  return new Promise(async (resolve, reject) => {
    // 1. 弹出保存对话框，让用户选择输出路径
    const originalExtension = path.extname(inputPath) // .doc or .docx
    const defaultName = path.basename(inputPath, originalExtension) + '_formatted' + originalExtension
    
    const saveDialogResult = await dialog.showSaveDialog(mainWindow!, {
      title: '保存格式化后的文档',
      defaultPath: defaultName,
      filters: [
        { name: 'Word Document', extensions: [originalExtension.substring(1)] }
      ]
    })

    if (saveDialogResult.canceled || !saveDialogResult.filePath) {
      return reject(new Error('用户取消了保存操作'))
    }
    
    const desiredOutputPath = saveDialogResult.filePath

    // 2. 获取 formatter.exe 的路径
    let formatterPath: string
    
    if (isDev) {
      // 开发模式：使用 scripts 目录下的 formatter.exe
      // __dirname 在开发模式下是 dist-electron，需要回到项目根目录
      const projectRoot = path.join(__dirname, '..')
      formatterPath = path.join(projectRoot, 'scripts', 'formatter.exe')
      
      console.log(`[Electron] __dirname: ${__dirname}`)
      console.log(`[Electron] Project root: ${projectRoot}`)
      console.log(`[Electron] Formatter path: ${formatterPath}`)
      
      if (!fs.existsSync(formatterPath)) {
        console.error(`[Electron] formatter.exe 不存在于: ${formatterPath}`)
        return reject(new Error('未找到 formatter.exe，请先运行 python_processor/build.bat 进行打包'))
      }
    } else {
      // 生产模式：从打包后的资源目录读取
      const exeName = process.platform === 'win32' ? 'formatter.exe' : 'formatter'
      formatterPath = path.join(process.resourcesPath, 'scripts', exeName)
    }

    // 3. 准备参数：传入 inputPath, desiredOutputPath, profileJSON（让 Python 直接保存到用户选择的路径）
    // 注意：必须总是传3个参数，避免Python误将第二参数当JSON解析
    const args = [inputPath, desiredOutputPath, JSON.stringify(profile || {})]
    
    // 4. 启动 Python 进程
    console.log(`[Electron] 启动 formatter: ${formatterPath}`)
    console.log(`[Electron] 输入文件: ${inputPath}`)
    console.log(`[Electron] 目标保存路径(用户选择): ${desiredOutputPath}`)
    console.log(`[Electron] 规范配置:`, profile)
    
    const formatterProcess = spawn(formatterPath, args)

    let stdoutData = ''
    let stderrData = ''

    formatterProcess.stdout.on('data', (data) => {
      const output = data.toString('utf8')
      stdoutData += output
      console.log(`[Python STDOUT] ${output}`)
    })

    formatterProcess.stderr.on('data', (data) => {
      const output = data.toString('utf8')
      stderrData += output
      console.error(`[Python STDERR] ${output}`)
    })

    formatterProcess.on('close', (code) => {
      console.log(`[Electron] Python 进程退出，代码: ${code}`)
      
      if (code === 0) {
        // 直接使用用户选择的输出路径（Python 已按该路径保存）
        resolve({
          success: true,
          message: '文档格式化成功！',
          outputPath: desiredOutputPath
        })
      } else {
        const errorMatch = stderrData.match(/ERROR: (.+)/) || stdoutData.match(/ERROR: (.+)/)
        const errorMessage = errorMatch ? errorMatch[1].trim() : '未知错误，请查看Python日志'
        
        reject(new Error(`格式化失败: ${errorMessage}`))
      }
    })

    formatterProcess.on('error', (error) => {
      console.error(`[Electron] 无法启动 formatter 进程:`, error)
      reject(new Error(`无法启动格式化程序: ${error.message}`))
    })
  })
})

// 规范持久化 - 保存
ipcMain.handle('store:saveProfiles', async (_event, profiles) => {
  try {
    store.set('profiles', profiles)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 规范持久化 - 加载
ipcMain.handle('store:loadProfiles', async () => {
  try {
    const profiles = store.get('profiles', [])
    return { success: true, profiles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 显示文件所在文件夹
ipcMain.handle('util:showInFolder', async (_e, targetPath: string) => {
  if (targetPath && fs.existsSync(targetPath)) {
    shell.showItemInFolder(targetPath)
    return { success: true }
  }
  return { success: false, error: '路径不存在' }
})

// 直接打开路径/文件
ipcMain.handle('util:openPath', async (_e, targetPath: string) => {
  if (targetPath && fs.existsSync(targetPath)) {
    const result = await shell.openPath(targetPath)
    if (!result) return { success: true }
    return { success: false, error: result }
  }
  return { success: false, error: '路径不存在' }
})

// 读取系统字体列表
ipcMain.handle('system:getFonts', async () => {
  try {
    // Windows: 从注册表读取字体
    if (process.platform === 'win32') {
      const output = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts" /s', { encoding: 'utf8' })
      const lines = output.split('\n')
      const fontNames = new Set<string>()
      
      lines.forEach(line => {
        // 匹配字体名称行 (格式: "字体名 (TrueType)    REG_SZ    xxx.ttf")
        const match = line.trim().match(/^(.+?)\s+\(.*?\)\s+REG_SZ/)
        if (match) {
          let fontName = match[1].trim()
          // 移除尾部的 & Bold, & Italic 等后缀
          fontName = fontName.replace(/\s*&\s*(Bold|Italic|Regular|Light|Medium).*$/i, '')
          if (fontName) {
            fontNames.add(fontName)
          }
        }
      })
      
      const uniqueFonts = Array.from(fontNames).sort()
      return { success: true, fonts: uniqueFonts }
    } else {
      // 非Windows平台返回空列表
      return { success: true, fonts: [] }
    }
  } catch (error: any) {
    console.error('[Electron] 无法读取系统字体:', error)
    return { success: false, error: error.message, fonts: [] }
  }
})
