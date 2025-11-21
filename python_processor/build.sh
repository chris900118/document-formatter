#!/bin/bash
# 使用 PyInstaller 打包 formatter.py 为单个可执行文件
# 
# 使用方法:
# 1. 确保已安装 Python 和 PyInstaller: pip install pyinstaller python-docx
# 2. 在项目根目录运行: chmod +x python_processor/build.sh && ./python_processor/build.sh
# 3. 打包完成后，formatter 会自动复制到 scripts 文件夹

echo "==================================="
echo "开始打包 Python 格式化脚本..."
echo "==================================="

cd "$(dirname "$0")"

# 检查是否已安装依赖
echo ""
echo "[1/4] 检查 Python 环境..."
python3 --version
if [ $? -ne 0 ]; then
    echo "错误: 未找到 Python，请先安装 Python"
    exit 1
fi

# 安装依赖
echo ""
echo "[2/4] 安装 Python 依赖..."
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

# 使用 PyInstaller 打包
echo ""
echo "[3/4] 使用 PyInstaller 打包..."
pyinstaller --onefile --clean --name formatter formatter.py
if [ $? -ne 0 ]; then
    echo "错误: 打包失败"
    exit 1
fi

# 复制到 scripts 目录
echo ""
echo "[4/4] 复制可执行文件到 scripts 目录..."
mkdir -p ../scripts
cp -f dist/formatter ../scripts/formatter
if [ $? -ne 0 ]; then
    echo "错误: 复制文件失败"
    exit 1
fi

echo ""
echo "==================================="
echo "打包完成！"
echo "可执行文件位置: scripts/formatter"
echo "==================================="
echo ""

# 清理临时文件（可选）
read -p "是否清理临时文件？(build 和 dist 目录) [y/N]: " cleanup
if [[ $cleanup =~ ^[Yy]$ ]]; then
    echo "清理中..."
    rm -rf build dist formatter.spec
    echo "清理完成"
fi
