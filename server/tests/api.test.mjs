import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { createApp } from '../app.mjs'
import { generate, listModels, normalizeBase, publicAddress, requestJson } from '../providers.mjs'
import { validateResult } from '../tasks.mjs'

const sample = { word: 'benefit', examples: [{ sentence: 'Reading can benefit everyone.', translation: '阅读能让每个人受益。', usage: 'benefit 作动词' }] }
async function listen(server) { await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); return `http://127.0.0.1:${server.address().port}` }

test('account isolation, encrypted secrets, discovery, idempotency and failed quota refunds', async (t) => {
  let calls = 0
  const secret = randomBytes(24).toString('hex')
  const upstream = createServer(async (req, res) => {
    assert.equal(req.headers.authorization, `Bearer ${secret}`)
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/v1/models') return res.end(JSON.stringify({ data: [{ id: 'demo-model' }, { id: 'broken-model' }] }))
    let raw = ''; for await (const b of req) raw += b
    const input = JSON.parse(raw); calls++
    res.end(JSON.stringify({ choices: [{ message: { content: input.model === 'broken-model' ? '{}' : JSON.stringify(sample) } }], usage: { total_tokens: 35 } }))
  })
  const upstreamUrl = await listen(upstream)
  const app = createApp({ encryptionKey: randomBytes(32).toString('hex'), allowPrivate: true, allowSetup: true })
  const url = await listen(app.server)
  t.after(async () => { await app.close(); await new Promise((r) => upstream.close(r)) })
  async function api(route, data, token, method = data === undefined ? 'GET' : 'POST') {
    const response = await fetch(url + '/api' + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) })
    return { status: response.status, body: await response.json() }
  }
  const password = randomBytes(24).toString('hex')
  const setup = await api('/auth/setup', { username: 'admin', password })
  assert.equal(setup.status, 201)
  const admin = setup.body.token
  assert.equal((await api('/auth/setup', { username: 'another', password })).status, 409)
  assert.equal((await api('/admin/providers')).status, 401)
  const user = await api('/admin/users', { username: 'learner', password, dailyLimit: 1 }, admin)
  assert.equal(user.status, 201)
  const login = await api('/auth/login', { username: 'learner', password })
  const token = login.body.token
  assert.equal((await api('/admin/providers', undefined, token)).status, 403)
  const config = { name: 'Mock', protocol: 'openai', baseUrl: upstreamUrl + '/v1/chat/completions', apiKey: secret, enabled: true, models: ['demo-model', 'broken-model'] }
  const saved = await api('/admin/providers', config, admin)
  assert.equal(saved.status, 200)
  const id = saved.body.provider.id
  assert.equal(saved.body.provider.baseUrl, upstreamUrl + '/v1')
  assert.ok(!JSON.stringify(saved.body).includes(secret))
  assert.ok(!JSON.stringify(app.db.prepare('SELECT * FROM providers').all()).includes(secret))
  assert.ok(!JSON.stringify(app.db.prepare('SELECT * FROM users').all()).includes(password))
  const listed = await api(`/admin/providers/${id}/models`, {}, admin)
  assert.deepEqual(listed.body.models.map((m) => m.id), ['demo-model', 'broken-model'])
  assert.equal((await api('/admin/providers', { ...config, id, apiKey: '', baseUrl: 'https://other.example/v1' }, admin)).status, 400)
  const make = (model, requestKey) => ({ feature: 'examples', providerId: id, model, input: { level: 'cet4', words: 'benefit' }, requestKey })
  assert.equal((await api('/generations', make('not-open', 'request-bad-model'), token)).status, 403)
  assert.equal((await api('/generations', make('broken-model', 'request-broken'), token)).status, 502)
  assert.equal((await api('/auth/me', undefined, token)).body.used, 0)
  const output = await api('/generations', make('demo-model', 'request-success'), token)
  assert.equal(output.status, 200)
  assert.deepEqual(output.body.result, sample)
  assert.equal((await api('/generations', make('demo-model', 'request-success'), token)).body.id, output.body.id)
  assert.equal(calls, 2)
  assert.equal((await api('/generations', make('demo-model', 'request-over-quota'), token)).status, 429)
  assert.equal((await api('/generations/' + output.body.id, undefined, admin)).status, 404)
  assert.equal((await api('/generations/' + output.body.id, undefined, token)).body.result.word, 'benefit')
  const originResponse = await fetch(url + '/api/health', { headers: { Origin: 'https://untrusted.example' } })
  assert.equal(originResponse.status, 403)
  await api('/auth/logout', {}, token)
  assert.equal((await api('/auth/me', undefined, token)).status, 401)
})

test('native protocol adapters send expected headers and parse results', async (t) => {
  const received = []
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    let raw = ''; for await (const b of req) raw += b
    received.push({ path: req.url, headers: req.headers, body: raw ? JSON.parse(raw) : null })
    if (req.url.startsWith('/claude/models')) {
      return res.end(JSON.stringify(req.url.includes('after_id') ? { data: [{ id: 'claude-b' }], has_more: false } : { data: [{ id: 'claude-a' }], has_more: true, last_id: 'claude-a' }))
    }
    if (req.url.startsWith('/google/models?')) return res.end(JSON.stringify({ models: [{ name: 'models/gemini-text', supportedGenerationMethods: ['generateContent'] }, { name: 'models/embed', supportedGenerationMethods: ['embedContent'] }] }))
    const text = JSON.stringify({ ok: true })
    if (req.url === '/claude/messages') return res.end(JSON.stringify({ content: [{ type: 'text', text }] }))
    if (req.url === '/google/models/gemini-text:generateContent') return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }))
    if (req.url === '/openai/responses') return res.end(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'output_text', text }] }] }))
    res.statusCode = 400; res.end('{}')
  })
  const url = await listen(server)
  t.after(() => new Promise((r) => server.close(r)))
  for (const [protocol, suffix, model] of [['anthropic', 'claude', 'claude-a'], ['gemini', 'google', 'gemini-text'], ['responses', 'openai', 'test-model']]) {
    const provider = { protocol, baseUrl: `${url}/${suffix}`, key: 'fixture-only' }
    assert.equal((await generate(provider, model, 'JSON please', { task: 'test' }, { allowPrivate: true })).result.ok, true)
    if (protocol === 'anthropic') assert.deepEqual((await listModels(provider, { allowPrivate: true })).models.map((m) => m.id), ['claude-a', 'claude-b'])
    if (protocol === 'gemini') assert.deepEqual((await listModels(provider, { allowPrivate: true })).models.map((m) => m.id), ['gemini-text'])
  }
  assert.equal(received.find((r) => r.path === '/claude/messages').headers['anthropic-version'], '2023-06-01')
  assert.equal(received.find((r) => r.path.startsWith('/google/models/gemini')).headers['x-goog-api-key'], 'fixture-only')
  assert.equal(received.find((r) => r.path === '/openai/responses').body.store, false)
})

test('rejects internal endpoints, malformed answers and fabricated source quotes', async () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1']) assert.equal(publicAddress(address), false)
  assert.equal(publicAddress('8.8.8.8'), true)
  assert.throws(() => normalizeBase('https://example.com/v1?key=secret'))
  await assert.rejects(requestJson('https://127.0.0.1/v1/models'), /不可访问/)
  const writing = { summary: '评价', strengths: ['切题'], suggestions: ['注意语法'], corrections: [{ original: 'not in essay', revised: 'changed', reason: '理由' }], modelEssay: 'Example.' }
  assert.throws(() => validateResult('writing', writing, { essay: 'My real essay.' }))
  writing.corrections = []
  assert.equal(validateResult('writing', writing, { essay: 'My real essay.' }).summary, '评价')
  const q = { stem: 'A question', options: ['same', 'same', 'C', 'D'], answer: 0, explanation: 'reason', word: 'benefit' }
  assert.throws(() => validateResult('quiz', { questions: Array(5).fill(q) }, { words: 'benefit' }))
  q.options = ['A', 'B', 'C', 'D']
  assert.equal(validateResult('quiz', { questions: Array(5).fill(q) }, { words: 'benefit' }).questions.length, 5)
})

test('behind a reverse proxy, HTTP setup is closed and only the CLI path creates the first admin', async (t) => {
  const app = createApp({ encryptionKey: randomBytes(32).toString('hex'), allowSetup: false, trustProxy: true, origins: ['https://appassets.androidplatform.net', 'http://127.0.0.1:*'] })
  const url = await listen(app.server)
  t.after(() => app.close())
  const headers = { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.9', Origin: 'https://appassets.androidplatform.net' }
  const password = randomBytes(24).toString('hex')
  const health = await fetch(url + '/api/health', { headers })
  assert.equal(health.headers.get('access-control-allow-origin'), 'https://appassets.androidplatform.net')
  assert.deepEqual(await health.json(), { ok: true, service: 'word-master-ai', setupRequired: true, setupAllowed: false })
  const setup = await fetch(url + '/api/auth/setup', { method: 'POST', headers, body: JSON.stringify({ username: 'attacker', password }) })
  assert.equal(setup.status, 403)
  const preflight = await fetch(url + '/api/auth/login', { method: 'OPTIONS', headers: { ...headers, Origin: 'https://evil.example' } })
  assert.equal(preflight.status, 403)
  const desktop = await fetch(url + '/api/health', { headers: { Origin: 'http://127.0.0.1:51234' } })
  assert.equal(desktop.headers.get('access-control-allow-origin'), 'http://127.0.0.1:51234')
  assert.equal((await fetch(url + '/api/health', { headers: { Origin: 'http://127.0.0.1:5.evil.example' } })).status, 403)
  await app.createUser({ username: 'owner', password }, 'admin')
  await assert.rejects(app.createUser({ username: 'second', password }, 'admin'), /管理员已创建/)
  const login = await fetch(url + '/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ username: 'owner', password }) })
  assert.equal(login.status, 200)
  const { token } = await login.json()
  await app.setPassword('owner', randomBytes(24).toString('hex'))
  assert.equal((await fetch(url + '/api/auth/me', { headers: { ...headers, Authorization: `Bearer ${token}` } })).status, 401)
})

test('a loopback request carrying forwarding headers is not treated as local', async (t) => {
  const app = createApp({ encryptionKey: randomBytes(32).toString('hex'), allowSetup: true })
  const url = await listen(app.server)
  t.after(() => app.close())
  const body = JSON.stringify({ username: 'admin', password: randomBytes(24).toString('hex') })
  const proxied = await fetch(url + '/api/auth/setup', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.7' }, body })
  assert.equal(proxied.status, 403)
  assert.equal((await fetch(url + '/api/auth/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })).status, 201)
})
