
import os
import urllib.request
import shutil

# 配置
CACHE_DIR = r"C:\Users\qw261\AppData\Local\electron-builder\Cache\winCodeSign"
VERSION = "2.6.0"
TARGET_DIR = os.path.join(CACHE_DIR, f"winCodeSign-{VERSION}")
TARGET_FILE = os.path.join(TARGET_DIR, f"winCodeSign-{VERSION}.7z")
DOWNLOAD_URL = f"https://npmmirror.com/mirrors/electron-builder-binaries/winCodeSign-{VERSION}/winCodeSign-{VERSION}.7z"

def setup_dependency():
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)
        print(f"Created directory: {TARGET_DIR}")


    print(f"Downloading from: {DOWNLOAD_URL}")
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"Attempt {attempt + 1}/{max_retries}...")
            req = urllib.request.Request(
                DOWNLOAD_URL, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            )
            with urllib.request.urlopen(req, timeout=60) as response:
                with open(TARGET_FILE, 'wb') as f:
                    shutil.copyfileobj(response, f)
            
            print(f"Successfully downloaded to: {TARGET_FILE}")
            
            # 验证文件大小
            file_size = os.path.getsize(TARGET_FILE)
            print(f"File size: {file_size / 1024 / 1024:.2f} MB")
            break # 成功则退出循环
            
        except Exception as e:
            print(f"Download failed (attempt {attempt + 1}): {e}")
            if attempt == max_retries - 1:
                print("Giving up after max retries.")


if __name__ == "__main__":
    setup_dependency()
