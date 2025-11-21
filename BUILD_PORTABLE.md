# 便携版打包说明

## 快速构建

### 生成免安装单 exe 文件（推荐）

```powershell
npm run build:portable
```

生成的文件位于：`release/公文格式化助手 1.0.0.exe`

### 同时生成安装版和便携版

```powershell
npm run build:win
```

生成文件：
- **便携版**：`release/公文格式化助手 1.0.0.exe`（免安装，双击即用）
- **安装版**：`release/公文格式化助手 Setup 1.0.0.exe`（需安装）

## 便携版特点

✅ **单文件**：所有资源打包在一个 exe 中  
✅ **免安装**：双击即可运行，无需管理员权限  
✅ **便携**：可放在 U 盘、网盘等任意位置  
✅ **数据独立**：配置文件存储在 exe 同目录下的 `portable` 文件夹  

## 注意事项

1. **Python 处理器**：如果使用了 Python 脚本，需先编译：
   ```powershell
   npm run python:build
   ```

2. **首次构建**：可能需要下载 Electron 二进制文件（约 100MB），请耐心等待

3. **文件大小**：便携版 exe 大约 150-250MB（包含 Electron + Chromium）

4. **杀毒软件**：部分杀毒软件可能误报，需添加信任

## 构建流程

```
TypeScript 编译 → Vite 打包前端 → Electron Builder 打包
     (tsc)            (dist/)         (release/*.exe)
```

## 故障排查

### 构建失败

- 确保已安装所有依赖：`npm install`
- 清理缓存：删除 `node_modules/.cache` 和 `dist`、`dist-electron` 目录
- 检查磁盘空间（至少需要 2GB 可用空间）

### 打包后无法运行

- 检查是否包含了所有必需资源（`dist/` 和 `dist-electron/`）
- 查看 `release/builder-debug.yml` 了解详细配置
- 使用开发者工具调试：在代码中加入 `mainWindow.webContents.openDevTools()`

## 版本号修改

修改 `package.json` 中的 `version` 字段，重新构建即可：

```json
{
  "version": "1.0.1"
}
```
