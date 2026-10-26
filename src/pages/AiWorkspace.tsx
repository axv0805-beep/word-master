import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AI_LABELS, aiRequest, aiToken, countEssayWords, type AiFeature, type AiModel, type AiResult, type AiUser } from '../core/ai'
import { writingElapsed, type WritingDraft } from '../core/writing'
import { useAppStore } from '../store/appStore'
import { AiResultView } from '../components/AiResult'
import { AppSelect } from '../components/ui/AppSelect'

const TOPICS = {
  cet4: ['The benefits of reading every day', 'A letter inviting a friend to a campus activity', 'How to develop a healthy study routine'],
  cet6: ['Balancing technological convenience and independent thinking', 'The value of lifelong learning in a changing workplace', 'How individual choices contribute to a sustainable society']
}
const EMPTY_DRAFT: WritingDraft = { topic: '', essay: '', elapsedMs: 0, runningSince: null }

export function AiWorkspacePage() {
  const params = useParams()
  const [query] = useSearchParams()
  const feature = (params.feature ?? 'writing') as AiFeature
  const [level, setLevel] = useState<'cet4' | 'cet6'>(params.level === 'cet6' ? 'cet6' : 'cet4')
  const [userId, setUserId] = useState('guest')
  const [ready, setReady] = useState(false)
  const [models, setModels] = useState<AiModel[]>([])
  const [choice, setChoice] = useState('')
  const [words, setWords] = useState(query.get('word') ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [output, setOutput] = useState<{ id: string; result: AiResult; source: string } | null>(null)
  const [now, setNow] = useState(Date.now())
  const [saveError, setSaveError] = useState(false)
  const draftKey = `${userId}:${level}`
  const draft = useAppStore((s) => s.writingDrafts[draftKey]) ?? EMPTY_DRAFT
  const saveDraft = useAppStore((s) => s.saveWritingDraft)
  const mistakes = useAppStore((s) => s.mistakes)
  const valid = Object.prototype.hasOwnProperty.call(AI_LABELS, feature) && (!params.level || ['cet4', 'cet6'].includes(params.level))
  useEffect(() => {
    let active = true
    async function load() {
      if (!aiToken()) { if (active) setReady(true); return }
      try {
        const [catalog, account] = await Promise.all([aiRequest<{ models: AiModel[] }>('/models'), aiRequest<{ user: AiUser }>('/auth/me')])
        if (active) { setModels(catalog.models); setChoice(catalog.models.length ? '0' : ''); setUserId(account.user.id) }
      } catch (e) { if (active) setError((e as Error).message) }
      finally { if (active) setReady(true) }
    }
    void load(); return () => { active = false }
  }, [])
  useEffect(() => {
    if (draft.runningSince == null) return
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 1000)
    window.addEventListener('focus', tick)
    return () => { clearInterval(id); window.removeEventListener('focus', tick) }
  }, [draft.runningSince])
  function patchDraft(patch: Partial<WritingDraft>) {
    try { saveDraft(draftKey, { ...draft, ...patch }); setSaveError(false) } catch { setSaveError(true) }
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const selected = models[Number(choice)]
    if (!selected) { setError('请先选择可用模型'); return }
    setBusy(true); setError(''); setOutput(null)
    if (feature === 'writing') patchDraft({ elapsedMs: writingElapsed(draft), runningSince: null })
    const input = feature === 'writing' ? { level, topic: draft.topic, essay: draft.essay } : { level, words }
    try {
      const data = await aiRequest<{ id: string; status: string; result: AiResult }>('/generations', { feature, providerId: selected.providerId, model: selected.model, input, requestKey: crypto.randomUUID() })
      if (data.result) setOutput({ ...data, source: feature === 'writing' ? draft.essay : words })
      else setError('任务正在处理中，请到生成记录查看')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  if (!valid) return <div className="ai-page"><h1>没有这个练习</h1><Link to="/learn">返回学习</Link></div>
  const remaining = Math.max(0, 1800 - Math.floor(writingElapsed(draft, now) / 1000))
  const wordCount = countEssayWords(draft.essay)
  return <div className="ai-page">
    <Link className="back-link" to="/learn">← 学习</Link>
    <header><p className="ai-eyebrow">词芽 · AI 学习室</p><h1>{AI_LABELS[feature]}</h1><p>{feature === 'writing' ? '先写下自己的想法，再一起打磨表达。' : feature === 'quiz' ? '用你的单词，生成一组语境练习。' : '从一个单词，走进它的语境。'}</p></header>
    <div className="ai-links"><Link to="/settings/ai">AI 账号</Link><Link to="/learn/ai/history">生成记录</Link></div>
    {error && <p className="ai-error" role="alert">{error}</p>}
    {ready && !aiToken() && <p className="ai-notice">先<Link to="/settings/ai">登录 AI 账号</Link>，即可选择模型并生成内容。写作草稿仍可离线编辑。</p>}
    {ready && aiToken() && !models.length && <p className="ai-notice">暂时没有开放的模型，请管理员在“接口与用户管理”中配置。</p>}
    <form onSubmit={submit}>
      <fieldset disabled={busy || !ready} className="ai-section">
        <div className="ai-two-columns">
          <AppSelect label="学习级别" value={level} onChange={(value) => { setLevel(value as 'cet4' | 'cet6'); setOutput(null) }} options={[{ value: 'cet4', label: '四级', description: 'CET-4 · 巩固基础表达' }, { value: 'cet6', label: '六级', description: 'CET-6 · 进阶语境与表达' }]} />
          <AppSelect label="使用模型" value={choice} onChange={setChoice} placeholder={models.length ? '选择模型' : '暂无可用模型'} options={models.map((m, i) => ({ value: String(i), label: m.model, description: m.providerName }))} />
        </div>
        {feature === 'writing' ? <>
          <AppSelect label="练习主题" value={draft.topic} onChange={(topic) => patchDraft({ topic })} placeholder="选择练习主题，或在下方自填" options={TOPICS[level].map((topic) => ({ value: topic, label: topic }))} />
          <label>题目与要求<textarea required maxLength={2000} rows={3} value={draft.topic} onChange={(e) => patchDraft({ topic: e.target.value })} placeholder="输入作文题目、要求或选用上方练习主题" /></label>
          <div className="ai-writing-meta"><span aria-label="剩余时间">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span><button type="button" className="btn btn-soft btn-sm" disabled={!remaining} onClick={() => { const time = Date.now(); setNow(time); patchDraft(draft.runningSince == null ? { runningSince: time } : { elapsedMs: writingElapsed(draft, time), runningSince: null }) }}>{draft.runningSince == null ? '开始计时' : '暂停计时'}</button><span>{wordCount} 词</span></div>
          <label htmlFor="writing-essay">你的作文</label><textarea id="writing-essay" className="ai-writing-paper" required minLength={20} maxLength={12000} rows={12} value={draft.essay} onChange={(e) => patchDraft({ essay: e.target.value })} placeholder="Start with your own words…" spellCheck lang="en" />
          <p className="ai-hint">练习建议：{level === 'cet4' ? '120–180' : '150–200'} 词。倒计时离开页面后继续，可手动暂停；时间到仍可编辑。</p>
          <p className={saveError ? 'ai-error' : 'ai-hint'} role="status">{saveError ? '本地保存失败，请复制作文以免丢失。' : '草稿自动保存在当前设备，按账号和级别区分。'}</p>
        </> : <>
          <label>{feature === 'quiz' ? '目标单词（多个词用逗号分隔）' : '要学习的单词或短语'}<textarea required maxLength={500} rows={3} value={words} onChange={(e) => setWords(e.target.value)} placeholder={feature === 'quiz' ? 'adapt, affect, efficient, opportunity, benefit' : '例如：resilient'} /></label>
          {feature === 'quiz' && <button type="button" className="btn btn-soft btn-sm" onClick={() => {
            const selected = [...new Set(Object.values(mistakes).sort((a, b) => b.wrong - a.wrong).map((m) => m.word))].slice(0, 10).join(', ')
            if (selected) setWords(selected); else setError('错题本还是空的，可以手动输入单词')
          }}>从错题本选词</button>}
        </>}
        <p className="ai-hint">提交后，以上内容会发送到管理员配置的模型服务。每次成功生成使用 1 次额度。</p>
        <button className="btn btn-primary btn-lg ai-submit" disabled={busy || !models.length || !choice}>{busy ? '正在生成，请稍候…' : feature === 'writing' ? '提交 AI 批改' : feature === 'quiz' ? '生成 5 道练习题' : '生成学习卡片'}</button>
      </fieldset>
    </form>
    {busy && <p className="ai-notice" role="status">生成结果会保存到账号。离开页面后，可在生成记录中查看。</p>}
    {output && <><p className="ai-hint">以下反馈对应本次提交。修改输入后请重新提交。</p><details className="ai-reference"><summary>查看本次提交原文</summary><p className="ai-essay">{output.source}</p></details><AiResultView key={output.id} feature={feature} result={output.result} /></>}
  </div>
}
