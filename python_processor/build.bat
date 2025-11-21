@echo off
REM 使用 PyInstaller 打包 formatter.py 为单个 EXE 文件
REM 
REM 使用方法:
REM 1. 确保已安装 Python 和 PyInstaller: pip install pyinstaller python-docx
REM 2. 在项目根目录运行: .\python_processor\build.bat
REM 3. 打包完成后，formatter.exe 会自动复制到 scripts 文件夹

echo ===================================
echo 开始打包 Python 格式化脚本...
echo ===================================

cd /d "%~dp0"

REM 检查是否已安装依赖
echo.
echo [1/4] 检查 Python 环境...
python --version
if errorlevel 1 (
    echo 错误: 未找到 Python，请先安装 Python
    pause
    exit /b 1
)

REM 安装依赖
echo.
echo [2/4] 安装 Python 依赖...
pip install -r requirements.txt
if errorlevel 1 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

REM 使用 PyInstaller 打包
echo.
echo [3/4] 使用 PyInstaller 打包...
pyinstaller --onefile --clean --name formatter formatter.py
if errorlevel 1 (
    echo 错误: 打包失败
    pause
    exit /b 1
)

REM 复制到 scripts 目录
echo.
echo [4/4] 复制 EXE 到 scripts 目录...
if not exist "..\scripts" mkdir "..\scripts"
copy /Y "dist\formatter.exe" "..\scripts\formatter.exe"
if errorlevel 1 (
    echo 错误: 复制文件失败
    pause
    exit /b 1
)

echo.
echo ===================================
echo 打包完成！
echo EXE 文件位置: scripts\formatter.exe
echo ===================================
echo.

echo.
echo ===================================
echo 打包完成！
echo EXE 文件位置: scripts\formatter.exe
echo ===================================
echo.

exit /b 0
