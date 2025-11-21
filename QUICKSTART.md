# 🚀 快速开始指南

按照以下步骤快速启动公文格式化助手项目。

## 📋 前置要求

确保已安装：
- ✅ Node.js 16+ ([下载](https://nodejs.org/))
- ✅ Python 3.7+ ([下载](https://www.python.org/downloads/))
- ✅ Git (可选)

## 🔧 安装步骤

### 第一步：安装 Node.js 依赖

```powershell
cd d:\dve\document-formatter
npm install
```

等待安装完成...

### 第二步：打包 Python 处理器

**Windows 用户（推荐）：**

方法 1 - 使用 npm 命令：
```powershell
npm run python:build
```

方法 2 - 直接运行批处理文件：
```powershell
cd python_processor
.\build.bat
```

这将：
1. 安装 python-docx 和 pyinstaller
2. 将 formatter.py 打包为 formatter.exe
3. 自动复制到 scripts 目录

⏱️ 预计耗时：2-5 分钟（首次运行）

### 第三步：启动开发模式

```powershell
npm run dev
```

🎉 完成！应用将自动打开。

## 🧪 测试

1. 准备一个测试用的 .docx 文件
2. 在应用中点击"选择 Word 文档"
3. 选择测试文件
4. 点击"开始格式化"
5. 查看输出的 `原文件名_formatted.docx`

## 📦 打包生产版本

```powershell
npm run build:win
```

打包完成后，在 `release` 目录中找到安装程序。

## ❓ 遇到问题？

### 问题：npm install 失败
**解决**：尝试使用国内镜像
```powershell
npm config set registry https://registry.npmmirror.com
npm install
```

### 问题：Python 打包失败
**解决**：
1. 检查 Python 版本：`python --version`
2. 手动安装依赖：
   ```powershell
   pip install python-docx pyinstaller
   ```
3. 重新运行 build.bat

### 问题：开发模式启动失败
**解决**：检查是否完成了 Python 打包步骤
```powershell
# 检查文件是否存在
dir scripts\formatter.exe
```

## 📚 下一步

- 查看 [README.md](README.md) 了解详细信息
- 查看 [python_processor/README.md](python_processor/README.md) 了解 Python 模块
- 修改 `python_processor/formatter.py` 自定义格式化规则

---

**需要帮助？** 检查终端输出的错误信息，或查看 README.md 中的"常见问题"部分。
