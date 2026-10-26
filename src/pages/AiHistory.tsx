import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AI_LABELS, aiRequest, type AiHistory, type AiGeneration } from '../core/ai'
import { AiResultView } from '../components/AiResult'

export function AiHistoryPage() {
  const [items, setItems] = useState<AiHistory[]>([])
  const [detail, setDetail] = useState<AiGeneration | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function refresh() {
    setBusy(true); setError('')
    try { setItems((await aiRequest<{ items: AiHistory[] }>('/generations')).items) }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  useEffect(() => { void refresh() }, [])
  return <div className="ai-page"><Link className="back-link" to="/learn">← 学习</Link><header><p className="ai-eyebrow">每一次练习都有迹可循</p><h1>生成记录</h1><p>最近 50 次生成，按账号独立保存。</p></header>
    {error && <p className="ai-error" role="alert">{error} <Link to="/settings/ai">登录账号</Link></p>}
    <button className="btn btn-soft btn-md" disabled={busy} onClick={() => { setDetail(null); void refresh() }}>{busy ? '正在加载…' : '刷新记录'}</button>
    {!items.length && !busy && !error && <p className="ai-notice">还没有生成记录，去完成第一次练习吧。</p>}
    <div className="ai-provider-list">{items.map((item) => <button className="card ai-provider" disabled={busy} key={item.id} onClick={async () => { setBusy(true); setError(''); try { setDetail(await aiRequest<AiGeneration>(`/generations/${item.id}`)) } catch (e) { setError((e as Error).message) } finally { setBusy(false) } }}><strong>{AI_LABELS[item.feature]} · {item.status === 'done' ? '已完成' : item.status === 'pending' ? '生成中' : '未完成'}</strong><span>{new Date(item.created_at).toLocaleString()} · {item.model}</span></button>)}</div>
    {detail && <section><h2>这次练习</h2><p className="ai-hint">{detail.input.level === 'cet4' ? '四级' : '六级'} · {detail.model}</p><details className="ai-reference"><summary>提交内容</summary><p className="ai-essay">{detail.input.topic}</p><p className="ai-essay">{detail.input.essay ?? detail.input.words}</p></details>{detail.error && <p className="ai-error">{detail.error}</p>}{detail.status === 'pending' && <p className="ai-notice">任务仍在处理中，请稍后刷新记录。</p>}{detail.result && <AiResultView key={detail.id} feature={detail.feature} result={detail.result} />}</section>}
  </div>
}
