// 裁剪 Electron locales，仅保留所需语言，减少体积。
// 由 electron-builder 的 afterPack 钩子调用。

const fs = require('fs');
const path = require('path');

exports.default = async (context) => {
  try {
    const localesDir = path.join(context.appOutDir, 'locales');
    if (!fs.existsSync(localesDir)) {
      console.log('[afterPack] locales 目录不存在，跳过裁剪');
      return;
    }
    const keep = new Set(['zh-CN.pak', 'en-US.pak']); // 仅需中文，可去掉 en-US
    const files = fs.readdirSync(localesDir);
    let removed = 0;
    for (const f of files) {
      if (!keep.has(f) && f.endsWith('.pak')) {
        fs.unlinkSync(path.join(localesDir, f));
        removed++;
      }
    }
    console.log(`[afterPack] locales 裁剪完成，已删除 ${removed} 个语言包，仅保留: ${[...keep].join(', ')}`);
  } catch (e) {
    console.warn('[afterPack] 裁剪 locales 失败（不阻塞构建）:', e && e.message);
  }
};
