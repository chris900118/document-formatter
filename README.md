# 📄 公文格式化助手

基于 **Electron + React + Python (PyInstaller)** 的文档格式化工具，专为公文格式化需求设计。

采用混合架构：漂亮的 React UI + 强大的 Python 文档处理能力。

## ✨ 特性

- 🎨 现代化的用户界面（React + 渐变设计）
- 📝 一键格式化 Word 文档 (.docx)
- 📋 预设公文标准格式（仿宋、1.5倍行距等）
- 🚀 使用 PyInstaller 打包的独立 Python 处理器
- 💡 自动生成格式化后的文件（_formatted.docx）
- ⚡ 快速、稳定、易用

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面框架**: Electron 28
- **构建工具**: Vite 5
- **文档处理**: Python 3 + python-docx + PyInstaller
- **UI**: 纯 CSS（渐变设计）

## 📦 项目结构

```
document-formatter/
├── electron/              # Electron 主进程代码
│   ├── main.ts           # 主进程入口（调用 Python EXE）
│   ├── preload.ts        # 预加载脚本
│   └── electron-env.d.ts # Electron 类型定义
├── src/                  # React 前端代码
│   ├── App.tsx           # 主应用组件
│   ├── main.tsx          # React 入口
│   ├── App.css           # 应用样式
│   ├── index.css         # 全局样式
│   └── types.d.ts        # TypeScript 类型定义
├── python_processor/     # Python 文档处理模块
│   ├── formatter.py      # 格式化脚本（命令行版本）
│   ├── requirements.txt  # Python 依赖
│   ├── build.bat         # Windows 打包脚本
│   ├── build.sh          # macOS/Linux 打包脚本
│   └── README.md         # Python 模块说明
├── scripts/              # 打包后的 Python 可执行文件
│   └── formatter.exe     # PyInstaller 生成的 EXE
├── public/               # 静态资源
├── package.json          # 项目配置
├── vite.config.ts        # Vite 配置
└── tsconfig.json         # TypeScript 配置
```

## 🚀 快速开始

### 环境要求

- **Node.js** 16+ 
- **Python** 3.7+
- **npm** 或 **yarn**
- **PyInstaller** (会自动安装)

### 安装步骤

#### 1. 安装 Node.js 依赖

```bash
cd document-formatter
npm install
```

#### 2. 打包 Python 处理器

**Windows 系统:**
```bash
npm run python:build
# 或直接运行
cd python_processor
build.bat
```

**macOS/Linux 系统:**
```bash
npm run python:build:mac
# 或直接运行
cd python_processor
chmod +x build.sh && ./build.sh
```

这将：
- 安装 Python 依赖（python-docx, pyinstaller）
- 使用 PyInstaller 将 formatter.py 打包为单个可执行文件
- 自动复制到 `scripts/formatter.exe`

⚠️ **重要**: 首次开发前必须完成此步骤！

#### 3. 开发模式

```bash
npm run dev
```

这将启动 Vite 开发服务器和 Electron 应用。

### 构建最终应用

**Windows 平台:**
```bash
npm run build:win
```

**macOS 平台:**
```bash
npm run build:mac
```

构建完成后，可执行文件将在 `release` 目录中。

## 🔐 安全策略更新

当前版本启用了 Electron 安全隔离：

- `contextIsolation: true`
- `sandbox: true`
- 仅通过 `preload.cjs` 使用 `contextBridge` 暴露白名单 API。

可用窗口接口（渲染层可直接调用）：
```ts
window.electronAPI.openFile()
window.electronAPI.scanHeadings(path: string, baseFontSize?: number)
window.electronAPI.formatDocument(path: string, payload: any)
window.electronAPI.saveProfiles(profiles: any[])
window.electronAPI.loadProfiles()
window.electronAPI.showInFolder(path: string)
window.electronAPI.openPath(path: string)
window.electronAPI.getFonts()
```

如需新增功能：
1. 在 `electron/main.ts` 注册对应 `ipcMain.handle(channel, handler)`。
2. 在 `electron/preload.cjs` 中添加包装函数。
3. 不要在渲染层直接使用 `require('electron')`。

## 🗂 生成项目代码快照

不再手动维护静态 `project_full_code.txt`。使用脚本动态生成：

```bash
npm run dump:code
```

生成文件位于项目根目录，包含所有源码文本（已排除 `node_modules` / `dist` / `release`）。

## 🧹 清理策略

已移除的冗余文件：
- `python_processor/formatter.py.bak`
- `python_processor/formatter.py.corrupted`
- 空文件 `python_processor/test_flow.py`
测试文档已移动至：`python_processor/tests/fixtures/`

建议：后续新增测试文档统一放入该 fixtures 目录。

## 🎯 使用说明

### 用户操作流程

1. **选择文档**: 点击"选择 Word 文档"按钮，选择需要格式化的 `.docx` 文件
2. **查看格式标准**: 界面会显示将要应用的公文格式标准
3. **开始格式化**: 点击"开始格式化"按钮
4. **等待完成**: 处理完成后，格式化的文件会自动保存为 `原文件名_formatted.docx`
5. **查看结果**: 界面会显示输出文件的路径

### 格式化标准

应用的公文标准格式：

| 项目 | 设置 |
|------|------|
| **字体** | 仿宋_GB2312 |
| **字号** | 14磅（小四） |
| **行距** | 1.5倍行距 |
| **首行缩进** | 2个字符（0.74cm） |
| **页边距** | 上：3.7cm<br>下：3.5cm<br>左：2.8cm<br>右：2.6cm |

## 🏗️ 架构说明

### 工作流程

```
用户选择文档
    ↓
React UI (前端)
    ↓
IPC 通信
    ↓
Electron Main Process
    ↓
spawn 启动
    ↓
formatter.exe (Python)
    ↓
使用 python-docx 处理文档
    ↓
输出 _formatted.docx
    ↓
返回结果到 UI
```

### 为什么使用 PyInstaller？

1. **独立运行**: 用户无需安装 Python 环境
2. **简化部署**: 单个 EXE 文件包含所有依赖
3. **稳定可靠**: 避免 Python 版本冲突
4. **性能优化**: 子进程运行，不阻塞 UI

## 🔧 开发指南

### 修改格式化逻辑

编辑 `python_processor/formatter.py`：

```python
# 修改字体
FONT_NAME = '宋体'  # 改为其他字体

# 修改字号
FONT_SIZE = 16  # 改为其他大小

# 修改页边距
section.top_margin = Cm(2.5)  # 自定义边距
```

修改后重新打包：
```bash
npm run python:build
```

### 添加新功能

1. 在 `formatter.py` 中添加处理逻辑
2. 如需 UI 交互，更新 `src/App.tsx`
3. 通过 IPC 传递参数（参考 `electron/main.ts`）

## 📝 常见问题

### Q: 开发时提示"未找到 formatter.exe"
**A:** 需要先运行 `npm run python:build` 打包 Python 脚本。这是开发前的必要步骤。

### Q: 格式化后中文字体显示不正确
**A:** 默认使用仿宋_GB2312 字体，请确保系统已安装该字体。可以在 `python_processor/formatter.py` 中修改 `FONT_NAME` 常量。

### Q: PyInstaller 打包失败
**A:** 
- 确保已安装 Python 3.7+
- 检查网络连接（需要下载 PyInstaller）
- 尝试手动安装：`pip install pyinstaller python-docx`
- 在 `python_processor` 目录下运行 `build.bat`

### Q: 如何调试 Python 脚本？
**A:** 
```bash
cd python_processor
python formatter.py "C:\path\to\test.docx"
```
查看输出是否包含 "SUCCESS" 或错误信息。

### Q: 打包后的应用体积太大
**A:** PyInstaller 打包的 EXE 约 15-20MB，这是正常的（包含 Python 运行时和所有依赖）。如需优化，可以研究 PyInstaller 的高级选项。

### Q: 支持 .doc 格式吗？
**A:** 当前仅支持 .docx 格式。如需支持 .doc，需要先将其转换为 .docx。

## 📄 许可证

MIT License

## 👨‍💻 作者

Your Name

---

**注意**: 首次使用前请确保已正确安装所有依赖项。如遇问题，请检查 Node.js 和 Python 版本是否符合要求。
