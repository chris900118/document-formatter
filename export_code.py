import os

# 配置不需要读取的文件夹
IGNORE_DIRS = {
    'node_modules', 'dist', 'dist-electron', 'release', 
    '.git', '.vscode', '__pycache__', '.idea'
}

# 配置不需要读取的文件后缀
IGNORE_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', 
    '.exe', '.dll', '.dmg', '.zip', '.lock', '-lock.json'
}

# 必须读取的核心文件夹
TARGET_DIRS = ['src', 'electron', 'python_processor', 'scripts']

# 输出文件
OUTPUT_FILE = 'project_full_code.txt'

def is_text_file(filename):
    return not any(filename.endswith(ext) for ext in IGNORE_EXTENSIONS)

def main():
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out_f:
        # 1. 先读取根目录下的关键配置文件
        root_files = ['package.json', 'vite.config.ts', 'tailwind.config.cjs', 'tsconfig.json']
        for root_file in root_files:
            if os.path.exists(root_file):
                out_f.write(f"\n\n{'='*50}\nFILE: {root_file}\n{'='*50}\n")
                try:
                    with open(root_file, 'r', encoding='utf-8') as f:
                        out_f.write(f.read())
                except Exception as e:
                    out_f.write(f"Error reading file: {e}")

        # 2. 遍历核心文件夹
        for root, dirs, files in os.walk('.'):
            # 过滤文件夹
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            # 简单的过滤：只看关键目录或根目录配置，避免遍历太深层的无关目录
            # 如果你在根目录运行，这个逻辑会遍历所有非忽略目录
            
            for file in files:
                if is_text_file(file):
                    file_path = os.path.join(root, file)
                    
                    # 再次确认路径是否在我们要关注的范围内 (可选，去掉这行会读取更多)
                    # if not any(target in file_path for target in TARGET_DIRS) and root != '.':
                    #    continue

                    out_f.write(f"\n\n{'='*50}\nFILE: {file_path}\n{'='*50}\n")
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            out_f.write(f.read())
                    except Exception:
                        out_f.write(f"Error reading file (encoding or permission)")

    print(f"完成！所有代码已保存到 {OUTPUT_FILE}，请把这个文件发给 AI。")

if __name__ == '__main__':
    main()