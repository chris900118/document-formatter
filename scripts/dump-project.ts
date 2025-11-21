#!/usr/bin/env node
/**
 * 动态生成项目代码快照（替代静态 project_full_code.txt）
 * 使用：npm run dump:code
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const OUT_FILE = path.join(ROOT, 'project_full_code.txt')
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'release', 'dist', 'dist-electron'])
const INCLUDE_EXT = ['.ts', '.tsx', '.js', '.cjs', '.mjs', '.json', '.md', '.py', '.bat', '.sh', '.yml', '.yaml', '.css', '.html']

function shouldInclude(file: string) {
  const ext = path.extname(file).toLowerCase()
  return INCLUDE_EXT.includes(ext)
}

function walk(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const rel = path.relative(ROOT, full)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry)) walk(full, files)
    } else if (shouldInclude(entry)) {
      files.push(rel)
    }
  }
  return files
}

function dump() {
  const files = walk(ROOT)
  let out = `\n\n===== Project Snapshot Generated: ${new Date().toISOString()} =====\nTotal Files: ${files.length}\n\n`
  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(ROOT, f), 'utf-8')
      out += `==================================================\nFILE: ${f}\n==================================================\n${content}\n\n`
    } catch (e) {
      out += `==================================================\nFILE: ${f}\n==================================================\n<非文本或读取失败>\n\n`
    }
  }
  fs.writeFileSync(OUT_FILE, out, 'utf-8')
  console.log(`✅ 已生成快照: ${OUT_FILE}`)
}

dump()
