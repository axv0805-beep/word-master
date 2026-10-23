import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { installSafeArea } from './core/native'
import { dismissBootSplash } from './core/boot'
import './index.css'

// 安卓壳把状态栏设成透明后，页面会顶到屏幕最上沿，这里把系统栏高度交给 CSS 占位
installSafeArea()

const container = document.getElementById('root')
if (!container) throw new Error('缺少 #root 容器')

try {
  ReactDOM.createRoot(container).render(
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </HashRouter>
  )
} finally {
  // 即使挂载出错也要把开屏收走，避免卡在封面
  dismissBootSplash()
}
