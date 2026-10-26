import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { aiRequest, type AiProvider, type AiPreset, type AiProtocol, type AiUser } from '../core/ai'
import { AppSelect } from '../components/ui/AppSelect'

const blank = { id: '', name: '', baseUrl: '', protocol: 'openai' as AiProtocol, apiKey: '', enabled: false, modelsText: '', jsonMode: false, tokenParameter: 'max_tokens' }
export function AiAdminPage() {
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [presets, setPresets] = useState<AiPreset[]>([])
  const [form, setForm] = useState(blank)
  const [presetId, setPresetId] = useState('custom')
  const [found, setFound] = useState<{ id: string; name: string }[]>([])
  const [filter, setFilter] = useState('')
  const [testModel, setTestModel] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [users, setUsers] = useState<(AiUser & { used: number })[]>([])
  const [newUser, setNewUser] = useState({ username: '', password: '', dailyLimit: 20 })
  async function refresh() {
    const [p, u] = await Promise.all([aiRequest<{ providers: AiProvider[]; presets: AiPreset[] }>('/admin/providers'), aiRequest<{ users: (AiUser & { used: number })[] }>('/admin/users')])
    setProviders(p.providers); setPresets(p.presets); setUsers(u.users)
  }
  useEffect(() => { void refresh().catch((e) => setError(e.message)) }, [])
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('')
    try { await action() } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    await run(async () => {
      const data = await aiRequest<{ provider: AiProvider }>('/admin/providers', { ...form, id: form.id || undefined, models: form.modelsText.split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean) })
      setForm((f) => ({ ...f, id: data.provider.id, apiKey: '' })); await refresh(); setNotice('接口已保存，密钥不会返回浏览器。现在可以获取模型或测试连接。')
    })
  }
  function edit(p: AiProvider) { setForm({ ...p, apiKey: '', modelsText: p.models.join('\n') }); setFound([]); setTestModel(p.models[0] ?? ''); setNotice(''); setError('') }
  return <div className="ai-page">
    <Link className="back-link" to="/settings/ai">← AI 账号</Link>
    <header><p className="ai-eyebrow">管理员</p><h1>模型与接口</h1><p>连接服务，选择模型，再开放给学习者。</p></header>
    {error && <p className="ai-error" role="alert">{error}</p>}
    {notice && <p className="ai-notice" role="status">{notice}</p>}
    <section className="ai-provider-list">
      {providers.map((p) => <button className="card ai-provider" disabled={busy} key={p.id} onClick={() => edit(p)}><strong>{p.name}</strong><span>{p.enabled ? `${p.models.length} 个开放模型` : '未开放'} · 密钥已保存</span></button>)}
      <button className="btn btn-soft btn-md" disabled={busy} onClick={() => { setForm(blank); setPresetId('custom'); setFound([]); setTestModel('') }}>＋ 添加接口</button>
    </section>
    <form className="card ai-section" onSubmit={save}>
      <fieldset disabled={busy}>
        <h2>{form.id ? '编辑接口' : '新建接口'}</h2>
        {!form.id && <AppSelect label="厂商预设" value={presetId} options={presets.map((p) => ({ value: p.id, label: p.name, description: p.id === 'custom' ? '使用自己的接口地址与模型' : p.baseUrl.replace('https://', '') }))} onChange={(value) => {
          const p = presets.find((p) => p.id === value)
          setPresetId(value)
          if (p) setForm({ ...blank, name: p.id === 'custom' ? '' : p.name, protocol: p.protocol, baseUrl: p.baseUrl })
        }} />}
        <label>接口名称<input required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：DeepSeek 主接口" /></label>
        <AppSelect label="接口协议" value={form.protocol} onChange={(value) => setForm({ ...form, protocol: value as AiProtocol })} options={[
          { value: 'openai', label: 'OpenAI 兼容', description: 'Chat Completions · DeepSeek 等兼容接口' },
          { value: 'responses', label: 'OpenAI Responses', description: 'OpenAI Responses API' },
          { value: 'anthropic', label: 'Anthropic Messages', description: 'Claude 原生协议' },
          { value: 'gemini', label: 'Google Gemini', description: 'Gemini 原生协议' }
        ]} />
        <label>API Base URL<input required type="url" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.example.com/v1" /></label>
        <p className="ai-hint">保留厂商要求的 /v1 等前缀，系统会自动拼接请求路径。地区不同可修改预设地址。</p>
        <label>API Key<input type="password" required={!form.id} autoComplete="new-password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={form.id ? '留空保留已存密钥' : '仅发送到本应用后台保存'} /></label>
        <label>开放给用户的模型 ID<textarea rows={4} value={form.modelsText} onChange={(e) => setForm({ ...form, modelsText: e.target.value })} placeholder="每行一个模型 ID；可先保存接口，再获取模型" /></label>
        {form.protocol === 'openai' && <details><summary>兼容选项</summary>
          <AppSelect label="输出长度参数" value={form.tokenParameter} onChange={(value) => setForm({ ...form, tokenParameter: value })} options={[{ value: 'max_tokens', label: 'max_tokens' }, { value: 'max_completion_tokens', label: 'max_completion_tokens' }]} />
          <label className="ai-check"><input type="checkbox" checked={form.jsonMode} onChange={(e) => setForm({ ...form, jsonMode: e.target.checked })} />请求 JSON 模式（需接口支持）</label>
        </details>}
        <label className="ai-check"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />向用户开放此接口中的模型</label>
        <button className="btn btn-primary btn-lg" type="submit">{busy ? '处理中…' : '保存配置'}</button>
      </fieldset>
    </form>
    {form.id && <section className="card ai-section">
      <h2>发现与测试模型</h2><p className="ai-hint">以下操作使用已保存配置。模型列表查询失败时，仍可在上方手动填写 ID。</p>
      <button className="btn btn-soft btn-md" disabled={busy} onClick={() => void run(async () => {
        const data = await aiRequest<{ models: { id: string; name: string }[]; truncated: boolean }>(`/admin/providers/${form.id}/models`, {})
        setFound(data.models); setNotice(`获取到 ${data.models.length} 个模型${data.truncated ? '（列表已截断，可手动补充）' : ''}。点击添加后请保存配置；列出模型不代表已具备调用权限。`)
      })}>获取模型列表</button>
      {!!found.length && <><label>搜索模型<input value={filter} onChange={(e) => setFilter(e.target.value)} /></label><div className="ai-model-list">{found.filter((m) => `${m.id} ${m.name}`.toLowerCase().includes(filter.toLowerCase())).map((m) => <button key={m.id} className="ai-model" disabled={busy} onClick={() => { setTestModel(m.id); setForm((f) => ({ ...f, modelsText: [...new Set([...f.modelsText.split('\n').filter(Boolean), m.id])].join('\n') })) }}>{m.id}<span>添加</span></button>)}</div></>}
      <label>测试模型 ID<input value={testModel} onChange={(e) => setTestModel(e.target.value)} placeholder="填写或点击上方模型" /></label>
      <p className="ai-hint">连接测试会向厂商发送一次短请求，可能产生少量费用。</p>
      <button disabled={busy || !testModel.trim()} className="btn btn-soft btn-md" onClick={() => void run(async () => { await aiRequest(`/admin/providers/${form.id}/test`, { model: testModel }); setNotice('连接与 JSON 输出测试通过。') })}>测试连接</button>
    </section>}
    <section className="card ai-section"><h2>学习账号</h2><p className="ai-hint">每日额度按成功生成次数计，0 次即暂停使用；不会向用户提供厂商密钥。</p>
      {users.map((u) => <div className="ai-user" key={u.id}><span>{u.username} · {u.role === 'admin' ? '管理员' : '用户'}<small>今日已用 {u.used} 次</small></span><label>每日次数<input aria-label={`${u.username} 每日次数`} type="number" min={0} max={10000} value={u.dailyLimit} onChange={(e) => setUsers(users.map((v) => v.id === u.id ? { ...v, dailyLimit: Number(e.target.value) } : v))} /></label><button disabled={busy} className="btn btn-soft btn-sm" onClick={() => void run(async () => { await aiRequest(`/admin/users/${u.id}`, { dailyLimit: u.dailyLimit }, 'PUT'); setNotice('额度已保存') })}>保存</button></div>)}
      <form onSubmit={(e) => { e.preventDefault(); void run(async () => { await aiRequest('/admin/users', newUser); setNewUser({ username: '', password: '', dailyLimit: 20 }); await refresh(); setNotice('学习账号已创建') }) }}><fieldset disabled={busy}>
        <h3>添加学习账号</h3><label>用户名<input required minLength={3} value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} /></label>
        <label>初始密码<input required type="password" minLength={10} autoComplete="new-password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></label>
        <label>每日次数<input required type="number" min={0} max={10000} value={newUser.dailyLimit} onChange={(e) => setNewUser({ ...newUser, dailyLimit: Number(e.target.value) })} /></label>
        <button className="btn btn-primary btn-md">创建账号</button>
      </fieldset></form>
    </section>
  </div>
}
