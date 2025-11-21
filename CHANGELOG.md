# 更新日志

所有重要的项目更改都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [1.0.2] - 2025-11-20

### 新增
- 首次启动时自动显示"程序功能介绍"窗口，帮助用户快速了解软件功能
- 独立的 `程序功能介绍.html` 文件，可在应用外单独查看
- 添加 `app:openGuide` IPC 接口，支持从前端手动打开功能介绍
- 完善的便携版发布包，包含详细的使用说明文档

### 改进
- 优化便携版启动脚本，显示更友好的启动信息
- 使用 electron-store 管理首次启动标记，确保只在首次启动时弹出介绍
- 更新 package.json 的 extraResources 配置，将功能介绍文件打包到发布版本
- 完善 TypeScript 类型定义，添加 openGuide 方法声明

### 技术细节
- 新增 `appSettingsStore` 用于存储应用设置（首次启动标记等）
- 新增 `openGuideWindow()` 函数，创建独立的功能介绍窗口
- 在 preload.cjs 中暴露 `openGuide` API
- 优化功能介绍窗口的路径处理，兼容开发环境和生产环境

### 文件变更
- `package.json`: 版本更新到 1.0.2，添加 resources 配置
- `electron/main.ts`: 添加首次启动检测和功能介绍窗口逻辑
- `electron/preload.cjs`: 添加 openGuide API
- `src/types.d.ts`: 添加 openGuide 方法类型定义
- `release/`: 生成 v1.0.2 便携版发布包

## [1.0.1] - 2025-xx-xx

### 改进
- 性能优化
- 修复已知问题

## [1.0.0] - 2025-xx-xx

### 新增
- 🎉 首次发布
- 文档格式化功能
- 智能标题扫描
- 标题纠偏功能
- 规范管理和持久化
- 系统字体获取
- 便携版支持

---

[1.0.2]: https://github.com/your-repo/document-formatter/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/your-repo/document-formatter/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/your-repo/document-formatter/releases/tag/v1.0.0
