import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import updater from 'electron-updater'
const { autoUpdater } = updater
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import fs from 'fs'
import Store from 'electron-store'
// 无需第三方库，使用原生命令获取系统字体

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

// 初始化应用设置 store（用于首次启动标记等）
const appSettingsStore = new Store({
  name: 'app-settings',
  defaults: {
    isFirstLaunch: true
  }
})

let mainWindow: BrowserWindow | null = null
let guideWindow: BrowserWindow | null = null
let introWindow: BrowserWindow | null = null

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
      contextIsolation: true,
      sandbox: true
    },
    autoHideMenuBar: true // 隐藏菜单栏
  })

  // 等待窗口创建完成后再加载内容
  let didFallbackToFile = false
  let didFinishLoad = false

  const fallbackToFile = () => {
    if (didFallbackToFile) return
    didFallbackToFile = true
    const filePath = path.join(__dirname, '../dist/index.html')
    console.log('[Main] Fallback -> dist/index.html:', filePath)
    if (fs.existsSync(filePath)) {
      mainWindow!.loadFile(filePath)
    } else {
      console.warn('[Main] Fallback 文件不存在，请先运行 vite build 生成 dist')
      // 在开发环境下，若 dev server 不可用且 dist 也不存在，加载一个友好的错误页，避免白屏
      const hintHtml = `<!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>开发服务器未就绪</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; background:#f7f8fa; margin:0; }
            .wrap { height:100vh; display:flex; align-items:center; justify-content:center; }
            .card { background:#fff; border:1px solid #e5e6eb; border-radius:12px; padding:28px 24px; width: 720px; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
            h1 { margin:0 0 10px; font-size:20px; color:#1d2129; }
            p { margin:6px 0; color:#4e5969; line-height:1.6; }
            code { background:#f2f3f5; padding:2px 6px; border-radius:4px; }
            .actions { margin-top:16px; display:flex; gap:10px; }
            button { background:#165DFF; color:#fff; border:none; border-radius:6px; padding:8px 14px; cursor:pointer; }
            button.secondary { background:#fff; color:#165DFF; border:1px solid #94BFFF; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="card">
              <h1>开发服务器未就绪或已断开</h1>
              <p>Electron 正尝试连接 <code>http://localhost:5173</code>，但当前不可访问；同时未发现打包产物 <code>dist/index.html</code>。</p>
              <p>请在项目根目录运行以下命令启动开发环境：</p>
              <p><code>npm run electron:dev</code></p>
              <p>或仅运行前端服务器：</p>
              <p><code>npm run dev</code></p>
              <div class="actions">
                <button onclick="location.reload()">重试加载</button>
                <button class="secondary" onclick="location.href='http://localhost:5173'">打开 Dev Server</button>
              </div>
            </div>
          </div>
        </body>
      </html>`
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(hintHtml)
      mainWindow!.loadURL(dataUrl)
    }
  }

  mainWindow.webContents.on('did-finish-load', () => {
    didFinishLoad = true
    console.log('[Main] Page loaded')
    mainWindow!.webContents.executeJavaScript('console.log("[Main] Checking electronAPI:", typeof window.electronAPI)')
  })

  // did-fail-load 事件触发时回退
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.warn('[Main] did-fail-load:', { errorCode, errorDescription, validatedURL })
    fallbackToFile()
  })

  if (isDev) {
    // 优先尝试 Vite dev server
    const devUrl = 'http://localhost:5173'
    console.log('[Main] 尝试加载开发服务器:', devUrl)
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools()

    // 超时自动回退（例如端口未启动或连接被重置）
    // 增加超时时间到 15000ms，防止在性能较慢的机器上误报
    const timeoutMs = 15000
    setTimeout(() => {
      if (!didFinishLoad && !didFallbackToFile) {
        console.warn(`[Main] ${timeoutMs}ms 内未成功加载 dev server，执行超时回退。`)
        fallbackToFile()
      }
    }, timeoutMs)
  } else {
    // 非开发模式直接加载打包后的文件
    const prodIndex = path.join(__dirname, '../dist/index.html')
    console.log('[Main] 生产模式加载文件:', prodIndex)
    mainWindow.loadFile(prodIndex)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 检查是否首次启动，如果是则显示功能介绍
  const isFirstLaunch = appSettingsStore.get('isFirstLaunch', true) as boolean
  if (isFirstLaunch) {
    // 延迟打开，确保主窗口已经加载完成
    setTimeout(() => {
      openGuideWindow()
      appSettingsStore.set('isFirstLaunch', false)
    }, 1000)
  }
}

// 创建功能介绍窗口
function openGuideWindow() {
  // 如果已经打开，则聚焦
  if (guideWindow && !guideWindow.isDestroyed()) {
    guideWindow.focus()
    return
  }

  guideWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: '程序功能介绍',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // 加载功能介绍 HTML 文件
  let guidePath: string
  if (isDev) {
    // 开发环境下从源文件读取
    guidePath = path.join(__dirname, '../resources/introduction.html')
  } else {
    // 生产环境从 resources 目录读取
    guidePath = path.join(process.resourcesPath, '程序功能介绍.html')
  }

  console.log('[Guide] Loading guide from:', guidePath)

  if (fs.existsSync(guidePath)) {
    guideWindow.loadFile(guidePath)
  } else {
    console.error('[Guide] 功能介绍文件不存在:', guidePath)
    guideWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>错误</title></head>
      <body><h1>功能介绍文件未找到</h1><p>路径: ${guidePath}</p></body>
      </html>
    `))
  }

  guideWindow.on('closed', () => {
    guideWindow = null
  })
  guideWindow.on('closed', () => {
    guideWindow = null
  })
}

function createIntroWindow() {
  if (introWindow && !introWindow.isDestroyed()) {
    introWindow.focus()
    return
  }

  introWindow = new BrowserWindow({
    width: 900,
    height: 620,
    title: '欢迎使用 - 兴城公文格式化助手',
    autoHideMenuBar: true,
    resizable: false,
    maximizable: false,
    frame: true, // Standard window frame
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Use hash routing for intro page
  const introUrl = isDev
    ? 'http://localhost:5173/#/intro'
    : `file://${path.join(__dirname, '../dist/index.html')}#/intro`

  console.log('[Intro] Loading URL:', introUrl)
  introWindow.loadURL(introUrl)

  // Remove menu (standard behavior for dialogs)
  introWindow.setMenu(null)

  introWindow.on('closed', () => {
    introWindow = null
  })
}

// 确保应用单实例运行，避免误启动多个窗口/进程
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
  app.whenReady().then(() => {
    createWindow()
    // 启动时检查更新
    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify()
      }, 3000)
    }
  })
}

// 自动更新逻辑配置
autoUpdater.on('checking-for-update', () => {
  console.log('[Updater] Checking for update...')
})

autoUpdater.on('update-available', (info) => {
  console.log('[Updater] Update available:', info.version)
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info)
  }
})

autoUpdater.on('update-not-available', (info) => {
  console.log('[Updater] Update not available:', info.version)
})

autoUpdater.on('error', (err) => {
  console.error('[Updater] Error in auto-updater:', err)
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
  console.log('[Updater]', log_message)
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('[Updater] Update downloaded:', info.version)
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info)
  }
  // 保留原有的弹窗提示作为双重保险，或者您可以去掉它完全交给前端处理
  dialog.showMessageBox({
    type: 'info',
    title: '更新已就绪',
    message: `新版本 ${info.version} 已下载完成，重启应用以安装更新。`,
    buttons: ['现在重启', '稍后处理'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall()
    }
  })
})

ipcMain.on('update:quitAndInstall', () => {
  autoUpdater.quitAndInstall()
})

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

// 智能扫描疑似标题（scan_headings）
ipcMain.handle('document:scan_headings', async (_event, inputPath: string, baseFontSize: number = 16) => {
  return new Promise((resolve, reject) => {
    let formatterPath: string
    if (isDev) {
      const projectRoot = path.join(__dirname, '..')
      formatterPath = path.join(projectRoot, 'scripts', 'formatter.exe')
      if (!fs.existsSync(formatterPath)) {
        return reject(new Error('未找到 formatter.exe，请先运行 python_processor/build.bat 进行打包'))
      }
    } else {
      const exeName = process.platform === 'win32' ? 'formatter.exe' : 'formatter'
      formatterPath = path.join(process.resourcesPath, 'scripts', exeName)
    }
    const args = ['scan_headings', inputPath, String(baseFontSize)]
    const proc = spawn(formatterPath, args)
    let stdoutData = ''
    let stderrData = ''
    proc.stdout.on('data', (data) => {
      stdoutData += data.toString('utf8')
    })
    proc.stderr.on('data', (data) => {
      stderrData += data.toString('utf8')
    })
    proc.on('close', (code) => {
      console.log('[scan_headings] exit code:', code)
      console.log('[scan_headings] stdout:', stdoutData)
      console.log('[scan_headings] stderr:', stderrData)

      if (code === 0) {
        try {
          const result = JSON.parse(stdoutData)
          resolve(result)
        } catch (e) {
          reject(new Error(`Python返回内容解析失败: ${(e as Error).message}\nstdout: ${stdoutData}\nstderr: ${stderrData}`))
        }
      } else {
        reject(new Error('扫描失败: ' + (stderrData || stdoutData)))
      }
    })
    proc.on('error', (error) => {
      reject(new Error('无法启动扫描程序: ' + error.message))
    })
  })
})

// 格式化文档（支持 mappings 纠偏）
ipcMain.handle('document:format', async (_event, inputPath: string, payload: { profile: any, mappings: Record<string, string> }) => {
  return new Promise(async (resolve, reject) => {
    const originalExtension = path.extname(inputPath)
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
    let formatterPath: string
    if (isDev) {
      const projectRoot = path.join(__dirname, '..')
      formatterPath = path.join(projectRoot, 'scripts', 'formatter.exe')
      if (!fs.existsSync(formatterPath)) {
        return reject(new Error('未找到 formatter.exe，请先运行 python_processor/build.bat 进行打包'))
      }
    } else {
      const exeName = process.platform === 'win32' ? 'formatter.exe' : 'formatter'
      formatterPath = path.join(process.resourcesPath, 'scripts', exeName)
    }
    // 新参数格式：['format', inputPath, desiredOutputPath, JSON.stringify(payload)]
    const args = ['format', inputPath, desiredOutputPath, JSON.stringify(payload)]
    const proc = spawn(formatterPath, args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    })
    let stdoutData = ''
    let stderrData = ''
    proc.stdout.on('data', (data) => {
      stdoutData += data.toString('utf8')
    })
    proc.stderr.on('data', (data) => {
      stderrData += data.toString('utf8')
    })
    proc.on('close', (code) => {
      console.log('[document:format] exit code:', code)
      console.log('[document:format] stdout:', stdoutData)
      console.log('[document:format] stderr:', stderrData)

      if (code === 0) {
        try {
          const result = JSON.parse(stdoutData)
          if (result.success) {
            resolve({ success: true, message: '文档格式化成功！', outputPath: desiredOutputPath })
          } else {
            reject(new Error(`格式化失败: ${result.error || '未知错误'}`))
          }
        } catch (e) {
          reject(new Error(`Python返回内容解析失败: ${(e as Error).message}\nstdout: ${stdoutData}\nstderr: ${stderrData}`))
        }
      } else {
        const errorMatch = stderrData.match(/ERROR: (.+)/) || stdoutData.match(/ERROR: (.+)/)
        const errorMessage = errorMatch ? errorMatch[1].trim() : '未知错误，请查看Python日志'
        reject(new Error(`格式化失败: ${errorMessage}`))
      }
    })
    proc.on('error', (error) => {
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
    return { success: false, error: result }
  }
  return { success: false, error: '路径不存在' }
})

// 打开外部链接 (URL/协议)
ipcMain.handle('util:openExternal', async (_e, url: string) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 读取系统字体列表
ipcMain.handle('system:getFonts', async () => {
  // Windows系统使用PowerShell + .NET(WPF) 获取字体
  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      // 核心修复点：
      // 1. 加载 PresentationCore
      // 2. 遍历字体家族
      // 3. 同时输出 .Source (内部英文名，如 KaiTi) 
      // 4. 同时输出 .FamilyNames["zh-cn"] (显示中文名，如 楷体)
      const psScript = `
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
        Add-Type -AssemblyName PresentationCore;
        $fonts = [System.Windows.Media.Fonts]::SystemFontFamilies;
        foreach ($family in $fonts) {
            # 输出英文内部名 (如 KaiTi)
            Write-Output $family.Source;
            
            # 尝试输出中文名称 (如 楷体)
            if ($family.FamilyNames.ContainsKey("zh-cn")) {
                Write-Output $family.FamilyNames["zh-cn"];
            }
            
            # 尝试输出英文显示名称 (如 Microsoft YaHei)
            if ($family.FamilyNames.ContainsKey("en-us")) {
                Write-Output $family.FamilyNames["en-us"];
            }
        }
      `

      const ps = spawn('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        psScript
      ])

      let output = ''
      let errorOutput = ''

      ps.stdout.on('data', (data) => {
        output += data.toString()
      })

      ps.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      ps.on('close', (code) => {
        if (code !== 0) {
          console.error('[Electron] PowerShell字体查询失败:', errorOutput)
          return resolve({ success: false, fonts: [], error: errorOutput })
        }

        // 处理输出：按行分割，去空，去重
        const rawFonts = output.split(/\r?\n/).map(line => line.trim()).filter(Boolean)

        // 数组去重 + 排序 (让中文排在前面方便查看)
        const uniqueFonts = Array.from(new Set(rawFonts)).sort((a, b) => {
          const aIsChinese = /[\u4e00-\u9fa5]/.test(a);
          const bIsChinese = /[\u4e00-\u9fa5]/.test(b);
          if (aIsChinese && !bIsChinese) return -1;
          if (!aIsChinese && bIsChinese) return 1;
          return a.localeCompare(b, 'zh-CN');
        })

        // 智能过滤：仅保留中文字体和 Times New Roman
        const filteredFonts = uniqueFonts.filter(font => {
          const isChinese = /[\u4e00-\u9fa5]/.test(font);
          const isTimes = font.toLowerCase().includes('times new roman');
          return isChinese || isTimes;
        });

        console.log(`[Electron] Font scan complete. Found ${filteredFonts.length} fonts after filtering.`)
        resolve({ success: true, fonts: filteredFonts })
      })

      ps.on('error', (err) => {
        console.error('[Electron] Failed to start PowerShell:', err)
        resolve({ success: false, fonts: [], error: err.message })
      })
    })
  }

  // Non-Windows logic
  let command = 'bash';
  let args = ['-lc', "fc-list :family | sort -u"];

  if (process.platform === 'darwin') {
    command = 'system_profiler';
    args = ['SPFontsDataType', '-detailLevel', 'mini'];
  }

  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: false })
    let output = ''

    child.stdout.on('data', (data) => {
      output += data.toString()
    })

    child.on('close', (code) => {
      let fonts: string[] = []
      if (process.platform === 'darwin') {
        fonts = output.split('\n')
          .filter(line => line.includes('Family:'))
          .map(line => line.replace(/.*Family:\s*/, '').trim())
      } else {
        fonts = output.split('\n').map(line => line.split(':')[0]?.trim())
      }
      const uniqueFonts = [...new Set(fonts.filter(Boolean))].sort()

      // 智能过滤：仅保留中文字体和 Times New Roman
      const filteredFonts = uniqueFonts.filter(font => {
        const isChinese = /[\u4e00-\u9fa5]/.test(font);
        const isTimes = font.toLowerCase().includes('times new roman');
        return isChinese || isTimes;
      });

      resolve({ success: true, fonts: filteredFonts })
    })

    child.on('error', (err) => {
      console.error('[Electron] Non-Windows font command failed:', err)
      resolve({ success: false, fonts: [], error: err.message })
    })
  })
})

// 打开功能介绍窗口（供前端调用）
ipcMain.handle('app:openGuide', async () => {
  try {
    openGuideWindow()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('app:openIntro', () => {
  createIntroWindow()
  return { success: true }
})

ipcMain.handle('app:closeIntro', () => {
  if (introWindow && !introWindow.isDestroyed()) {
    introWindow.close()
  }
})



// Check missing fonts
ipcMain.handle('system:checkMissingFonts', async () => {
  // Placeholder implementing actual logic if needed later or relying on frontend checks
  return { success: true, missing: [] };
})

// Install font
ipcMain.handle('system:installFont', async (_event, fontFileName: string) => {
  if (process.platform !== 'win32') {
    return { success: false, error: 'Font installation is only supported on Windows.' }
  }

  const fontSourcePath = isDev
    ? path.join(__dirname, '..', 'resources', 'fonts', fontFileName)
    : path.join(process.resourcesPath, 'fonts', fontFileName);

  if (!fs.existsSync(fontSourcePath)) {
    return { success: false, error: `Font file not found: ${fontSourcePath}` }
  }

  // 简化安装逻辑：直接打开字体文件让用户点击安装
  // 这样规避了复杂的权限和注册表操作，更稳定
  const error = await shell.openPath(fontSourcePath);
  if (error) {
    return { success: false, error: `无法打开字体文件: ${error}` };
  }
  return { success: true, message: '请在弹出的窗口中点击“安装”按钮' };
})

// 获取应用版本号
ipcMain.handle('system:getAppVersion', () => {
  return app.getVersion()
})

// 手动检查更新
ipcMain.handle('system:checkForUpdate', async () => {
  try {
    await autoUpdater.checkForUpdates()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})


// 开发环境强制启用更新检查
if (isDev) {
  autoUpdater.forceDevUpdateConfig = true
  console.log('Development Mode: AutoUpdater forceDevUpdateConfig enabled')
}

// Auto Updater Events
const sendToWindow = (channel: string, ...args: any[]) => {
  mainWindow?.webContents.send(channel, ...args)
}

autoUpdater.on('checking-for-update', () => sendToWindow('checking-for-update'))
autoUpdater.on('update-available', (info) => sendToWindow('update-available', info))
autoUpdater.on('update-not-available', (info) => sendToWindow('update-not-available', info))
autoUpdater.on('error', (err) => sendToWindow('update-error', err.message))
autoUpdater.on('download-progress', (progressObj) => sendToWindow('download-progress', progressObj))
autoUpdater.on('update-downloaded', (info) => sendToWindow('update-downloaded', info))

ipcMain.on('update:quitAndInstall', () => {
  autoUpdater.quitAndInstall()
})

// 测试用：模拟更新流程
ipcMain.handle('test:mockUpdate', () => {
  console.log('Starting mock update flow...')
  const sender = mainWindow?.webContents
  if (!sender) return

  // 1. 检查中
  sender.send('checking-for-update')

  setTimeout(() => {
    // 2. 发现更新
    sender.send('update-available', { version: '1.1.0' })

    // 3. 下载进度
    let progress = 0
    const interval = setInterval(() => {
      progress += 20 // 加快演示速度
      if (progress > 100) progress = 100

      sender.send('download-progress', { percent: progress })

      if (progress >= 100) {
        clearInterval(interval)
        // 4. 下载完成
        setTimeout(() => {
          sender.send('update-downloaded', { version: '1.1.0' })
        }, 500)
      }
    }, 800)
  }, 1500)
})
