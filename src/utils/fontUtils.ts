
/**
 * 字号映射表 (Word 标准)
 * 键: pt 值 (number)
 * 值: 中文名称 (string)
 */
export const FONT_SIZE_MAP: Record<number, string> = {
  42: '初号',
  36: '小初',
  26: '一号',
  24: '小一',
  22: '二号',
  18: '小二',
  16: '三号',
  15: '小三',
  14: '四号',
  12: '小四',
  10.5: '五号',
  9: '小五',
  7.5: '六号',
  6.5: '小六',
  5.5: '七号',
  5: '八号'
}

/**
 * 反向映射表 (中文名称 -> pt)
 */
export const FONT_SIZE_REVERSE_MAP: Record<string, number> = Object.entries(FONT_SIZE_MAP).reduce((acc, [pt, name]) => {
  acc[name] = Number(pt)
  return acc
}, {} as Record<string, number>)

/**
 * 获取字号显示文本
 * 优先显示中文名称，如果没有匹配则显示 pt 值
 */
export const getFontSizeDisplay = (pt: number): string => {
  return FONT_SIZE_MAP[pt] || `${pt}pt`
}

/**
 * 解析字号输入
 * 支持输入 "三号" 或 "16"
 */
export const parseFontSizeInput = (input: string): number => {
  const trimmed = input.trim()
  // 尝试匹配中文名称
  if (FONT_SIZE_REVERSE_MAP[trimmed]) {
    return FONT_SIZE_REVERSE_MAP[trimmed]
  }
  // 尝试解析数字
  const num = parseFloat(trimmed)
  return isNaN(num) ? 0 : num
}
