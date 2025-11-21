import { HashRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import HomePage from './pages/HomePage'
const PageProfileEditor = lazy(() => import('./pages/PageProfileEditor').then(m => ({ default: m.PageProfileEditor })))
const PageProfileList = lazy(() => import('./pages/PageProfileList').then(m => ({ default: m.PageProfileList })))
import { usePersistence } from './store/usePersistence'

// 预设规范数据（去除页边距配置，使用 Word 默认页边距）
export const DEFAULT_PROFILE_DATA = {
  id: 'default_chengdu_xingcheng',
  name: '成都兴城集团规范',
  description: '根据集团最新公文格式要求设定',
  isDefault: true,
  createdAt: '2023-11-17T00:00:00Z',
  updatedAt: '2023-11-17T00:00:00Z',
  styles: {
    documentTitle: { fontFamily: '方正小标宋简体', fontSize: 22, lineSpacing: 35, alignment: 'center', bold: true },
    body: { fontFamily: '仿宋', fontSize: 16, lineSpacing: 28, alignment: 'justify', bold: false, firstLineIndent: 2 },
    heading1: { fontFamily: '方正黑体', fontSize: 16, lineSpacing: 28, alignment: 'left', bold: true, firstLineIndent: 2 },
    heading2: { fontFamily: '楷体', fontSize: 16, lineSpacing: 28, alignment: 'left', bold: true, firstLineIndent: 2 },
    heading3: { fontFamily: '仿宋', fontSize: 16, lineSpacing: 28, alignment: 'left', bold: true, firstLineIndent: 2 },
    heading4: { fontFamily: '仿宋', fontSize: 16, lineSpacing: 28, alignment: 'left', bold: true, firstLineIndent: 2 },
  },
  specialRules: {
    autoTimesNewRoman: true,
    resetIndentsAndSpacing: true
  }
}

function App() {
  // 启用持久化
  usePersistence()

  return (
    <HashRouter>
      <Suspense fallback={<div style={{padding:20}}>页面加载中...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profiles" element={<PageProfileList />} />
          <Route path="/profiles/new" element={<PageProfileEditor />} />
          <Route path="/profiles/edit/:id" element={<PageProfileEditor />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
