# 开发者注意事项

## 📍 当前项目状态

项目已完成基础架构搭建，采用 **Electron + React + PyInstaller (Python)** 混合架构。

## ⚠️ 开发前必做

1. **打包 Python 处理器**
   ```bash
   npm run python:build
   ```
   这会生成 `scripts/formatter.exe`，Electron 需要它来处理文档。

2. **验证打包结果**
   ```bash
   # 检查文件是否存在
   dir scripts\formatter.exe
   
   # 测试 Python 脚本（可选）
   cd python_processor
   python formatter.py "测试文件路径.docx"
   ```

## 🏗️ 架构概览

```
┌─────────────────┐
│   React UI      │  用户界面
│   (src/App.tsx) │
└────────┬────────┘
         │ IPC
         ↓
┌─────────────────┐
│  Electron Main  │  主进程
│ (electron/main) │
└────────┬────────┘
         │ spawn
         ↓
┌─────────────────┐
│ formatter.exe   │  Python 处理器
│  (PyInstaller)  │  (python-docx)
└─────────────────┘
```

## 🔑 关键文件

| 文件 | 作用 |
|------|------|
| `python_processor/formatter.py` | Python 格式化逻辑 |
| `python_processor/build.bat` | Windows 打包脚本 |
| `scripts/formatter.exe` | 打包后的 Python 可执行文件 |
| `electron/main.ts` | Electron 主进程，调用 EXE |
| `electron/preload.ts` | IPC 桥接 |
| `src/App.tsx` | React UI 组件 |

## 🔄 开发工作流

1. 修改 Python 逻辑 → `python_processor/formatter.py`
2. 重新打包 → `npm run python:build`
3. 测试 → `npm run dev`

## 🎯 当前功能

- ✅ 选择 .docx 文件
- ✅ 应用公文标准格式
- ✅ 输出格式化后的文件
- ✅ 显示处理结果

## 📝 待优化

- [ ] 添加拖拽上传功能
- [ ] 支持批量处理
- [ ] 可配置的格式化选项（UI）
- [ ] 处理进度条
- [ ] 历史记录

## 🐛 已知问题

- TypeScript 编译错误（不影响运行，需要安装 @types/node）
- 需要手动打包 Python 脚本才能开发

## 💡 提示

- Python 脚本只需打包一次，除非修改了 `formatter.py`
- 开发模式下，EXE 从 `scripts/` 读取
- 生产模式下，EXE 从 `process.resourcesPath/scripts/` 读取
- 日志输出在终端和 Electron DevTools Console

## 🚀 部署清单

构建前确保：
- [ ] `scripts/formatter.exe` 存在
- [ ] 测试过格式化功能
- [ ] 更新了版本号（package.json）
- [ ] 准备了应用图标（public/icon.ico）

---

**Happy Coding!** 🎉
