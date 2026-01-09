---
description: 发布新版本到腾讯云 COS (Release to Tencent Cloud COS)
---
本 Workflow 用于指导构建并发布新版本至腾讯云 COS，适配国内高速更新环境。

### 1. 准备工作
-   确保当前代码已 commit。
-   确保 `release` 目录已清理（或知晓其内容）。

### 2. 修改版本号
在 `package.json` 中修改 `version` 为新版本号（如 1.0.5）。

### 3. 构建安装包
在终端运行：
```powershell
npm run build:win
```

### 4. 重命名构建产物 (关键)
为了避免 URL 中文编码问题，必须重命名生成的安装包。
-   进入 `release` 目录。
-   找到 `公文格式化助手 Setup x.y.z.exe`。
-   **重命名为**：`setup-x.y.z.exe` (例如 `setup-1.0.5.exe`)。

### 5. 修改索引文件 (latest.yml)
手动编辑 `release/latest.yml`，修改 `url` 和 `path` 字段以匹配新的文件名。

```yaml
version: x.y.z
files:
  - url: setup-x.y.z.exe      # <--- 修改为纯英文文件名
    sha512: ... (保留原值)
path: setup-x.y.z.exe         # <--- 修改为纯英文文件名
releaseDate: ...
```

### 6. 上传至腾讯云 COS
1.  登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)。
2.  进入 `app-updates-...` 存储桶。
3.  上传 **`setup-x.y.z.exe`**。
4.  上传/覆盖 **`latest.yml`**。

### 7. 验证
无需额外操作。启动旧版本程序即可自动触发更新。
