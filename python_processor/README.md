# Python Processor

这个目录包含用于处理 Word 文档格式化的 Python 脚本。

## 文件说明

- `formatter.py` - 主格式化脚本，接收命令行参数处理文档
- `requirements.txt` - Python 依赖列表
- `build.bat` - Windows 打包脚本
- `build.sh` - macOS/Linux 打包脚本

## 开发环境设置

### 1. 安装 Python 依赖

```bash
cd python_processor
pip install -r requirements.txt
```

### 2. 测试脚本

```bash
python formatter.py "C:\path\to\your\document.docx"
```

## 打包为 EXE

### Windows 系统

双击运行 `build.bat` 或在命令行中执行：

```cmd
cd python_processor
build.bat
```

### macOS/Linux 系统

```bash
cd python_processor
chmod +x build.sh
./build.sh
```

## 打包后

打包完成后，可执行文件会被复制到项目根目录的 `scripts` 文件夹：

- Windows: `scripts/formatter.exe`
- macOS/Linux: `scripts/formatter`

这个可执行文件会被 Electron 应用调用来处理文档格式化。

## 格式化标准

当前脚本实现的公文格式化标准：

- **字体**: 仿宋_GB2312
- **字号**: 14磅（小四）
- **行距**: 1.5倍行距
- **首行缩进**: 2个字符（0.74cm）
- **页边距**:
  - 上: 3.7cm
  - 下: 3.5cm
  - 左: 2.8cm
  - 右: 2.6cm

## 输出格式

脚本执行后会输出以下信息到标准输出：

**成功时:**
```
SUCCESS
OUTPUT_PATH:C:\path\to\document_formatted.docx
```

**失败时:**
```
ERROR: [错误信息]
```

Electron 主进程会监听这些输出来判断处理状态。
