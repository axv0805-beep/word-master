import { NavLink, useLocation } from 'react-router-dom'
import { Icon, type IconName } from './ui/Icons'
import { useAppStore } from '../store/appStore'

interface Tab {
  to: string
  label: string
  icon: IconName
  badge?: number
}

export function TabBar() {
  const location = useLocation()
  const mistakeCount = useAppStore((state) => Object.keys(state.mistakes).length)

  const tabs: Tab[] = [
    { to: '/', label: '首页', icon: 'home' },
    { to: '/books', label: '词书', icon: 'book' },
    { to: '/mistakes', label: '错题', icon: 'alert', badge: mistakeCount },
    { to: '/stats', label: '统计', icon: 'chart' },
    { to: '/settings', label: '设置', icon: 'sliders' }
  ]

  return (
    <nav className="tabbar">
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1.5">
        {tabs.map((tab) => {
          const active = tab.to === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.to)
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl relative"
              style={{
                flex: 1,
                padding: '6px 4px',
                color: active ? '#8B5CF6' : 'var(--text-faint)',
                textDecoration: 'none',
                transition: 'color 160ms ease'
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon name={tab.icon} size={21} strokeWidth={active ? 2.1 : 1.7} />
                {tab.badge ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -9,
                      minWidth: 16,
                      height: 16,
                      padding: '0 4px',
                      borderRadius: 999,
                      background: 'linear-gradient(135deg,#F43F5E,#EC4899)',
                      color: '#fff',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1
                    }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </span>
              <span style={{ fontSize: '0.66rem', fontWeight: active ? 700 : 500 }}>{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
