import { Link, useLocation } from 'react-router-dom'
import { Layout as ArcoLayout, Menu } from '@arco-design/web-react'
import { IconHome, IconSettings, IconFile } from '@arco-design/web-react/icon'

const { Sider, Content } = ArcoLayout

interface LayoutProps {
  children: React.ReactNode
}

const MenuItem = Menu.Item

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const getCurrentKey = () => {
    if (location.pathname === '/') return '1'
    if (location.pathname.startsWith('/profiles')) return '2'
    return '1'
  }

  return (
    <ArcoLayout style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
      <Sider
        width={260}
        style={{
          backgroundColor: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--color-border-2)',
        }}>
          <div style={{
            width: 40,
            height: 40,
            backgroundColor: 'rgb(var(--arcoblue-6))',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <IconFile style={{ fontSize: 20 }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 600 }}>公文格式化助手</span>
        </div>

        <Menu
          selectedKeys={[getCurrentKey()]}
          style={{ marginTop: 20, border: 'none' }}
        >
          <MenuItem key="1">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <IconHome />
              <span>首页</span>
            </Link>
          </MenuItem>
          <MenuItem key="2">
            <Link to="/profiles" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <IconSettings />
              <span>规范管理</span>
            </Link>
          </MenuItem>
        </Menu>

        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--color-text-3)',
        }}>
          V1.0 (MVP)
        </div>
      </Sider>

      <Content style={{ 
        padding: 40, 
        overflow: 'auto',
        backgroundColor: 'var(--color-fill-1)',
      }}>
        {children}
      </Content>
    </ArcoLayout>
  )
}
