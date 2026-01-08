/**
 * 对齐方式类型
 */
export type Alignment = 'left' | 'center' | 'right' | 'justify'

/**
 * 自动编号配置
 */
export interface NumberingConfig {
  enabled: boolean
  cascade: boolean // 是否继承上级
  separator: string // 连接符
  prefix: string // 前缀
  counterType: string // 计数器类型
  suffix: string // 后缀
  previewText: string // 预览文本
}

/**
 * 样式配置接口
 */
export interface StyleConfig {
  fontFamily: string
  fontSize: number // 字号 (磅)
  lineSpacing?: number // 行距 (磅)
  bold?: boolean
  alignment?: Alignment // 对齐方式
  spaceBefore?: number // 段前间距 (磅)
  spaceAfter?: number // 段后间距 (磅)
  firstLineIndent?: number // 首行缩进 (字符数)
  numbering?: NumberingConfig // 自动编号配置
}

/**
 * 特殊规则配置
 */
export interface SpecialRules {
  autoTimesNewRoman: boolean // 自动将数字/英文设为 Times New Roman
  resetIndentsAndSpacing: boolean // 重置左右缩进与段前段后间距为0（保留首行缩进）
  pictureLineSpacing: boolean // 图片段落自动设为单倍行距
  pictureCenterAlign: boolean // 图片段落自动居中对齐
  removeManualNumberPrefixes?: boolean // 移除系统自动编号/项目符号（w:numPr），保留手动输入的数字前缀
}

/**
 * 格式化规范接口 (V1.0 完整版)
 */
export interface FormatProfile {
  id: string
  name: string
  description?: string

  // 样式映射配置
  styles: {
    documentTitle: StyleConfig // 文档标题 (Title)
    body: StyleConfig // 正文 (Normal)
    heading1: StyleConfig // 一级标题 (Heading 1)
    heading2: StyleConfig // 二级标题 (Heading 2)
    heading3: StyleConfig // 三级标题 (Heading 3)
    heading4: StyleConfig // 四级标题 (Heading 4)
  }

  // 特殊规则处理器
  specialRules: SpecialRules

  // 页边距（单位：厘米，若后续需要毫米在前端转换）
  pageMargins?: {
    top: number
    bottom: number
    left: number
    right: number
  }

  // 元数据
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 成都兴城集团规范 (预设规范)
 */
export const DEFAULT_PROFILE: FormatProfile = {
  id: 'default_chengdu_xingcheng',
  name: '成都兴城集团规范',
  description: '根据集团最新公文格式要求设定',
  isDefault: true,
  createdAt: '2023-11-17T00:00:00Z',
  updatedAt: '2023-11-17T00:00:00Z',
  styles: {
    documentTitle: {
      fontFamily: '方正小标宋简体',
      fontSize: 22, // 二号
      lineSpacing: 35, // 35磅
      alignment: 'center',
      bold: true,
    },
    body: {
      fontFamily: '仿宋',
      fontSize: 16, // 三号
      lineSpacing: 28, // 28磅
      alignment: 'justify',
      bold: false,
      firstLineIndent: 2,
    },
    heading1: {
      fontFamily: '方正黑体',
      fontSize: 16, // 三号
      lineSpacing: 28,
      alignment: 'left',
      bold: true,
      firstLineIndent: 2,
    },
    heading2: {
      fontFamily: '楷体',
      fontSize: 16, // 三号
      lineSpacing: 28,
      alignment: 'left',
      bold: true,
      firstLineIndent: 2,
    },
    heading3: {
      fontFamily: '仿宋',
      fontSize: 16, // 三号
      lineSpacing: 28,
      alignment: 'left',
      bold: true,
      firstLineIndent: 2,
    },
    heading4: {
      fontFamily: '仿宋',
      fontSize: 16, // 三号
      lineSpacing: 28,
      alignment: 'left',
      bold: true,
      firstLineIndent: 2,
    },
  },

  specialRules: {
    autoTimesNewRoman: true,
    resetIndentsAndSpacing: true,
    pictureLineSpacing: true,
    pictureCenterAlign: true,
    removeManualNumberPrefixes: false,
  },
  pageMargins: {
    top: 3.7,
    bottom: 3.5,
    left: 2.8,
    right: 2.6,
  },


};

/**
 * 文件处理状态
 */
export enum ProcessStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * 文件信息
 */
export interface FileInfo {
  path: string
  name: string
  size: number
}
