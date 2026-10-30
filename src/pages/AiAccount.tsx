import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { aiRequest, aiToken, saveAiToken, type AiUser } from '../core/ai'

export function AiAccountPage() {
  const [user, setUser] = useState<AiUser | null>(null)
  const [used, setUsed] = useState(0)
  const [setup, setSetup] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  async function refresh() {
    setError(''); setLoading(true)
    try {
      const health = await aiRequest<{ setupRequired: boolean; setupAllowed: boolean }>('/health')
      setSetup(health.setupRequired && health.setupAllowed)
      if (health.setupRequired && !health.setupAllowed) throw new Error('AI 服务尚未初始化管理员，请联系管理员')
      if (aiToken()) { const data = await aiRequest<{ user: AiUser; used: number }>('/auth/me'); setUser(data.user); setUsed(data.used) }
      else setUser(null)
    } catch (e) { setError((e as Error).message); setUser(null) }
    finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [])
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const data = await aiRequest<{ token: string; user: AiUser }>(setup ? '/auth/setup' : '/auth/login', { username, password })
      saveAiToken(data.token); setPassword(''); setUser(data.user); setSetup(false); await refresh()
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return <div className="ai-page">
    <Link className="back-link" to="/settings">← 设置</Link>
    <header><p className="ai-eyebrow">词芽 · 智能学习</p><h1>AI 账号</h1><p>用一个账号，连接写作、记忆与练习。</p></header>
    {error && <p className="ai-error" role="alert">{error} <button className="btn btn-soft btn-sm" onClick={() => void refresh()}>重新连接</button></p>}
    {loading ? <p role="status">正在连接服务…</p> : user ? <section className="card ai-section">
      <h2>{user.username}</h2><p>今日已用 {used} / {user.dailyLimit} 次</p><p className="muted">额度按 UTC 日期重置；失败任务不扣使用次数。</p>
      <Link className="btn btn-primary btn-md" to="/learn">开始学习</Link>
      <Link className="btn btn-soft btn-md" to="/learn/ai/history">生成记录</Link>
      {user.role === 'admin' && <Link className="btn btn-soft btn-md" to="/settings/ai/admin">接口与用户管理</Link>}
      <button className="btn btn-ghost btn-md" disabled={busy} onClick={async () => {
        setBusy(true)
        try { await aiRequest('/auth/logout', {}); saveAiToken(''); setUser(null) }
        catch (e) { setError((e as Error).message) } finally { setBusy(false) }
      }}>退出登录</button>
    </section> : <form className="card ai-section" onSubmit={submit}>
      <h2>{setup ? '创建本机管理员' : '登录 AI 账号'}</h2>
      <p className="muted">{setup ? '首次运行创建管理员，之后可添加接口和学习账号。' : '账号由管理员开通。普通背词功能无需登录。'}</p>
      <label>用户名<input required minLength={3} maxLength={40} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="英文字母、数字或 _.@-" /></label>
      <label>密码<input required type="password" minLength={10} maxLength={128} autoComplete={setup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 10 个字符" /></label>
      <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? '正在处理…' : setup ? '创建管理员' : '登录'}</button>
    </form>}
  </div>
}
