import { useEffect, useLayoutEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { ToastHost } from './components/ui/Toast'
import { UpdatePrompt } from './components/UpdatePrompt'
import { HomePage } from './pages/Home'
import { BooksPage } from './pages/Books'
import { MistakesPage } from './pages/Mistakes'
import { StatsPage } from './pages/Stats'
import { SettingsPage } from './pages/Settings'
import { StudyPage } from './pages/Study'
import { OnboardingPage } from './pages/Onboarding'
import { useAppStore } from './store/appStore'
import { primeSpeech } from './core/speech'
import { applyTheme } from './core/theme'

function ThemeSync() {
  const theme = useAppStore((state) => state.settings.theme)
  // 用 layout effect：主题变量在首帧绘制前落到 <html> 上，避免切主题时闪一下旧配色
  useLayoutEffect(() => {
    applyTheme(theme)
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
          <div className="page-shell">
            <OnboardingPage />
          </div>
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
        {/* key 跟着 pathname 走：切页时整块重新挂载，.page-shell 的入场动画就重新播一次 */}
        <div
          key={location.pathname}
          className="page-shell"
          style={{ paddingBottom: isStudy ? 0 : 'calc(78px + env(safe-area-inset-bottom, 0px))' }}
        >
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
      {/* 冷启动时静默查一次更新，有新版本就弹窗（只有安卓壳里有原生桥） */}
      <UpdatePrompt />
      <ToastHost />
    </>
  )
}
