import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { ToastHost } from './components/ui/Toast'
import { HomePage } from './pages/Home'
import { BooksPage } from './pages/Books'
import { MistakesPage } from './pages/Mistakes'
import { StatsPage } from './pages/Stats'
import { SettingsPage } from './pages/Settings'
import { StudyPage } from './pages/Study'
import { OnboardingPage } from './pages/Onboarding'
import { useAppStore } from './store/appStore'
import { primeSpeech } from './core/speech'

function ThemeSync() {
  const theme = useAppStore((state) => state.settings.theme)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0B1120' : '#F5F6FB')
  }, [theme])
  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  useEffect(() => {
    primeSpeech()
  }, [])

  const location = useLocation()
  const isStudy = location.pathname.startsWith('/study')
  const onboarded = useAppStore((state) => state.settings.onboarded)

  // 首次进入先走引导：选词书 → 定每日目标 → 生成「多少天背完」的计划
  if (!onboarded) {
    return (
      <>
        <div className="app-bg" aria-hidden="true" />
        <ThemeSync />
        <div className="phone-shell">
          <OnboardingPage />
        </div>
        <ToastHost />
      </>
    )
  }

  return (
    <>
      {/* 装饰背景层必须是空的、且不接收指针事件；绝不能包住应用内容，
          否则 z-index:-1 会把整个界面压到 #root 之下，导致点击全部被 #root 吞掉 */}
      <div className="app-bg" aria-hidden="true" />
      <ThemeSync />
      <ScrollToTop />
      <div className="phone-shell">
        <div style={{ paddingBottom: isStudy ? 0 : 'calc(78px + env(safe-area-inset-bottom, 0px))' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/mistakes" element={<MistakesPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {isStudy ? null : <TabBar />}
      </div>
      <ToastHost />
    </>
  )
}
