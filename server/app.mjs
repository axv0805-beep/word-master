import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { randomBytes, randomUUID, createHash, scrypt as scryptCallback, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ApiError, PRESETS, normalizeBase, listModels, generate } from './providers.mjs'
import { textField, validateInput, validateResult, promptFor } from './tasks.mjs'

const scrypt = promisify(scryptCallback)
const digest = (s) => createHash('sha256').update(s).digest('hex')
const day = () => new Date().toISOString().slice(0, 10)
const publicUser = (u) => ({ id: u.id, username: u.username, role: u.role, dailyLimit: u.daily_limit })
const safeJson = (s, fallback = {}) => { try { return JSON.parse(s) } catch { return fallback } }

async function passwordHash(password) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`
}
async function matches(password, stored) {
  const [salt, hash] = stored.split(':')
  const actual = await scrypt(password, salt, 64)
  return timingSafeEqual(Buffer.from(hash, 'hex'), actual)
}

async function readBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new ApiError(415, '请使用 JSON 请求')
  let size = 0; const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > 100000) throw new ApiError(413, '请求内容过大')
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw new ApiError(400, '请求不是有效 JSON') }
}

export function createApp({ database = ':memory:', encryptionKey, allowPrivate = false, allowSetup = false,
  origins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3180', 'http://127.0.0.1:3180'],
  staticDir, globalDailyLimit = 1000 } = {}) {
  const key = Buffer.from(encryptionKey ?? '', 'hex')
  if (key.length !== 32) throw new Error('AI_ENCRYPTION_KEY must be 64 hexadecimal characters')
  const db = new DatabaseSync(database)
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, daily_limit INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS providers(id TEXT PRIMARY KEY, config TEXT NOT NULL, secret TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS generations(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL, fingerprint TEXT NOT NULL, feature TEXT NOT NULL, provider_id TEXT NOT NULL, model TEXT NOT NULL, input TEXT NOT NULL, result TEXT, usage TEXT, status TEXT NOT NULL, error TEXT, day TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(user_id, request_key));`)
  // A process interruption has an unknown upstream outcome: mark failed; never blindly rebill/retry.
  db.prepare("UPDATE generations SET status='failed',error='服务重启中断了生成，请重新发起' WHERE status='pending'").run()
  function encrypt(secret) {
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, iv)
    const body = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
    return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), body.toString('hex')].join(':')
  }
  function decrypt(value) {
    const [iv, tag, text] = value.split(':').map((s) => Buffer.from(s, 'hex'))
    const cipher = createDecipheriv('aes-256-gcm', key, iv); cipher.setAuthTag(tag)
    return Buffer.concat([cipher.update(text), cipher.final()]).toString('utf8')
  }
  const providers = () => db.prepare('SELECT * FROM providers').all().map((r) => ({ ...safeJson(r.config), id: r.id, hasKey: !!r.secret }))
  function providerWithKey(id) {
    const row = db.prepare('SELECT * FROM providers WHERE id=?').get(id)
    if (!row) throw new ApiError(404, '未找到接口配置')
    try { return { ...JSON.parse(row.config), id, key: decrypt(row.secret) } }
    catch { throw new ApiError(500, '无法解密接口密钥，请管理员检查服务器加密配置') }
  }
  function used(id) { return db.prepare("SELECT count(*) AS n FROM generations WHERE user_id=? AND day=? AND status IN ('pending','done')").get(id, day()).n }
  function session(req) {
    const token = req.headers.authorization?.replace(/^Bearer /, '') ?? ''
    const user = db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires>?').get(digest(token), Date.now())
    if (!user) throw new ApiError(401, '请先登录 AI 账号')
    return user
  }
  function issueToken(user) {
    const token = randomBytes(32).toString('hex')
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now())
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token), user.id, Date.now() + 7 * 86400000)
    return { token, user: publicUser(user) }
  }
  async function createUser(data, role = 'user') {
    const username = textField(data.username, '用户名', 40, 3).toLowerCase()
    if (!/^[a-z0-9_.@-]+$/.test(username)) throw new ApiError(400, '用户名请使用英文字母、数字或 _.@-')
    const password = textField(data.password, '密码', 128, 10)
    const limit = data.dailyLimit ?? 20
    if (!Number.isInteger(limit) || limit < 0 || limit > 10000) throw new ApiError(400, '每日次数需为0–10000的整数')
    const hash = await passwordHash(password)
    // Recheck after async hashing to prevent parallel bootstrap requests creating multiple admins.
    if (role === 'admin' && db.prepare('SELECT id FROM users LIMIT 1').get()) throw new ApiError(409, '管理员已创建，请登录')
    const user = { id: randomUUID(), username, password_hash: hash, role, daily_limit: limit }
    try { db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(user.id, username, hash, role, limit) }
    catch { throw new ApiError(409, '用户名已存在') }
    return user
  }
  const attempts = new Map()
  function throttle(req) {
    const addr = req.socket.remoteAddress
    const now = Date.now()
    for (const [id, bucket] of attempts) if (now - bucket.start > 60000) attempts.delete(id)
    if (attempts.size > 5000) throw new ApiError(429, '请求过于频繁')
    const bucket = attempts.get(addr) ?? { start: now, count: 0 }
    attempts.set(addr, bucket)
    if (++bucket.count > 15) throw new ApiError(429, '操作过于频繁，请一分钟后再试')
  }
  const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'no-store')
    const send = (code, data) => { if (!res.destroyed) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)) } }
    try {
      const route = new URL(req.url, 'http://local').pathname
      if (!route.startsWith('/api/')) {
        if (!staticDir || req.method !== 'GET') throw new ApiError(404, '未找到页面')
        const target = path.resolve(staticDir, `.${decodeURIComponent(route === '/' ? '/index.html' : route)}`)
        if (!target.startsWith(`${path.resolve(staticDir)}${path.sep}`)) throw new ApiError(404, '未找到页面')
        const bytes = await readFile(target).catch(() => { throw new ApiError(404, '未找到页面') })
        const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }
        res.writeHead(200, { 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream' }); res.end(bytes); return
      }
      const origin = req.headers.origin
      if (origin && !origins.includes(origin)) throw new ApiError(403, '当前网页来源未被允许')
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin') }
      if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS'); res.writeHead(204); res.end(); return }
      if (route === '/api/health' && req.method === 'GET') {
        send(200, { ok: true, setupRequired: !db.prepare('SELECT id FROM users LIMIT 1').get(), setupAllowed: allowSetup && isLocal(req) }); return
      }
      if (route === '/api/auth/setup' && req.method === 'POST') {
        throttle(req)
        if (!allowSetup || !isLocal(req)) throw new ApiError(403, '管理员初始化仅限本机')
        const user = await createUser(await readBody(req), 'admin'); send(201, issueToken(user)); return
      }
      if (route === '/api/auth/login' && req.method === 'POST') {
        throttle(req)
        const data = await readBody(req)
        const username = textField(data.username, '用户名', 40, 3).toLowerCase()
        const password = textField(data.password, '密码', 128, 10)
        const user = db.prepare('SELECT * FROM users WHERE username=?').get(username)
        if (!user || !await matches(password, user.password_hash)) throw new ApiError(401, '用户名或密码不正确')
        send(200, issueToken(user)); return
      }
      const user = session(req)
      if (route === '/api/auth/me' && req.method === 'GET') { send(200, { user: publicUser(user), used: used(user.id) }); return }
      if (route === '/api/auth/logout' && req.method === 'POST') { db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(req.headers.authorization.replace(/^Bearer /, ''))); send(200, { ok: true }); return }
      if (route === '/api/models' && req.method === 'GET') {
        send(200, { models: providers().filter((p) => p.enabled).flatMap((p) => p.models.map((model) => ({ providerId: p.id, providerName: p.name, model }))) }); return
      }
      if (route.startsWith('/api/admin/')) {
        if (user.role !== 'admin') throw new ApiError(403, '此操作需要管理员权限')
        if (route === '/api/admin/providers' && req.method === 'GET') { send(200, { providers: providers(), presets: PRESETS }); return }
        if (route === '/api/admin/providers' && req.method === 'POST') {
          const data = await readBody(req)
          const id = data.id ? textField(data.id, '配置ID', 80) : randomUUID()
          const old = db.prepare('SELECT * FROM providers WHERE id=?').get(id)
          const previous = old ? safeJson(old.config) : null
          const config = {
            name: textField(data.name, '接口名称', 60), protocol: data.protocol, baseUrl: normalizeBase(data.baseUrl),
            enabled: data.enabled === true, models: data.models, jsonMode: data.jsonMode === true,
            tokenParameter: data.tokenParameter === 'max_completion_tokens' ? 'max_completion_tokens' : 'max_tokens'
          }
          if (!['openai', 'responses', 'anthropic', 'gemini'].includes(config.protocol)) throw new ApiError(400, '不支持的协议')
          if (!Array.isArray(config.models) || config.models.length > 100 || !config.models.every((s) => typeof s === 'string' && s.trim() && s.length <= 200)) throw new ApiError(400, '请填写有效的模型 ID（最多100个）')
          config.models = [...new Set(config.models.map((s) => s.trim()))]
          if (config.enabled && !config.models.length) throw new ApiError(400, '请至少开放一个模型')
          if (!data.apiKey && previous && (previous.baseUrl !== config.baseUrl || previous.protocol !== config.protocol)) throw new ApiError(400, '修改地址或协议后请重新填写密钥，避免旧密钥发送到其他接口')
          const secret = data.apiKey ? encrypt(textField(data.apiKey, 'API Key', 2000)) : old?.secret
          if (!secret) throw new ApiError(400, '首次保存请填写 API Key')
          db.prepare('INSERT INTO providers VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET config=excluded.config,secret=excluded.secret').run(id, JSON.stringify(config), secret)
          send(200, { provider: { ...config, id, hasKey: true } }); return
        }
        const providerRoute = route.match(/^\/api\/admin\/providers\/([^/]+)(?:\/(models|test))?$/)
        if (providerRoute) {
          const [, id, action] = providerRoute
          if (req.method === 'DELETE' && !action) { db.prepare('DELETE FROM providers WHERE id=?').run(id); send(200, { ok: true }); return }
          if (req.method === 'POST' && action) {
            throttle(req)
            const provider = providerWithKey(id)
            if (action === 'models') { send(200, await listModels(provider, { allowPrivate })); return }
            const input = await readBody(req)
            const model = textField(input.model, '模型 ID', 200)
            const { result } = await generate(provider, model, 'Return only JSON: {"ok":true}', { task: 'connection test' }, { allowPrivate, timeout: 30000 })
            if (result?.ok !== true) throw new ApiError(502, '模型可连接，但未通过 JSON 输出测试')
            send(200, { ok: true }); return
          }
        }
        if (route === '/api/admin/users' && req.method === 'GET') { send(200, { users: db.prepare('SELECT * FROM users').all().map((u) => ({ ...publicUser(u), used: used(u.id) })) }); return }
        if (route === '/api/admin/users' && req.method === 'POST') { throttle(req); send(201, { user: publicUser(await createUser(await readBody(req))) }); return }
        const userRoute = route.match(/^\/api\/admin\/users\/([^/]+)$/)
        if (userRoute && req.method === 'PUT') {
          const data = await readBody(req)
          if (!Number.isInteger(data.dailyLimit) || data.dailyLimit < 0 || data.dailyLimit > 10000) throw new ApiError(400, '次数需为0–10000的整数')
          db.prepare('UPDATE users SET daily_limit=? WHERE id=?').run(data.dailyLimit, userRoute[1]); send(200, { ok: true }); return
        }
      }
      if (route === '/api/generations' && req.method === 'GET') {
        send(200, { items: db.prepare('SELECT id,feature,model,status,error,created_at FROM generations WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(user.id) }); return
      }
      const generationRoute = route.match(/^\/api\/generations\/([^/]+)$/)
      if (generationRoute && req.method === 'GET') {
        const row = db.prepare('SELECT * FROM generations WHERE id=? AND user_id=?').get(generationRoute[1], user.id)
        if (!row) throw new ApiError(404, '记录不存在')
        send(200, { ...row, input: safeJson(row.input), result: safeJson(row.result, null), usage: safeJson(row.usage) }); return
      }
      if (route === '/api/generations' && req.method === 'POST') {
        const data = await readBody(req)
        const input = validateInput(data.feature, data.input)
        const requestKey = textField(data.requestKey, '请求编号', 100, 8)
        const fingerprint = digest(JSON.stringify([data.feature, data.providerId, data.model, input]))
        const existing = db.prepare('SELECT * FROM generations WHERE user_id=? AND request_key=?').get(user.id, requestKey)
        if (existing) {
          if (existing.fingerprint !== fingerprint) throw new ApiError(409, '请求编号已用于不同内容')
          send(200, { id: existing.id, status: existing.status, result: safeJson(existing.result, null), error: existing.error }); return
        }
        throttle(req)
        const provider = providerWithKey(data.providerId)
        if (!provider.enabled || !provider.models.includes(data.model)) throw new ApiError(403, '该模型尚未向用户开放')
        if (used(user.id) >= user.daily_limit) throw new ApiError(429, '今日 AI 使用次数已用完（UTC每日重置）')
        if (db.prepare("SELECT count(*) AS n FROM generations WHERE status='pending' AND user_id=?").get(user.id).n) throw new ApiError(409, '已有任务正在生成，请稍候')
        if (db.prepare("SELECT count(*) AS n FROM generations WHERE status='pending'").get().n >= 4) throw new ApiError(429, '服务繁忙，请稍后再试')
        if (db.prepare("SELECT count(*) AS n FROM generations WHERE day=? AND status IN ('pending','done')").get(day()).n >= globalDailyLimit) throw new ApiError(429, '服务今日额度已用完')
        // Synchronous SQLite reservation before first await makes the quota check atomic in this single process.
        const id = randomUUID()
        db.prepare('INSERT INTO generations(id,user_id,request_key,fingerprint,feature,provider_id,model,input,status,day,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
          .run(id, user.id, requestKey, fingerprint, data.feature, provider.id, data.model, JSON.stringify(input), 'pending', day(), Date.now())
        try {
          const generated = await generate(provider, data.model, promptFor(data.feature), input, { allowPrivate })
          const result = validateResult(data.feature, generated.result, input)
          db.prepare("UPDATE generations SET result=?,usage=?,status='done' WHERE id=?").run(JSON.stringify(result), JSON.stringify(generated.usage), id)
          send(200, { id, status: 'done', result })
        } catch (error) {
          const message = error instanceof ApiError ? error.message : '生成失败，请稍后重试'
          db.prepare("UPDATE generations SET status='failed',error=? WHERE id=?").run(message, id)
          throw new ApiError(error instanceof ApiError ? error.status : 500, message)
        }
        return
      }
      throw new ApiError(404, '接口不存在')
    } catch (error) { send(error instanceof ApiError ? error.status : 500, { error: error instanceof ApiError ? error.message : '服务暂时不可用，请稍后重试' }) }
  })
  return { server, db, close: () => new Promise((resolve) => { server.close(() => { db.close(); resolve() }); server.closeIdleConnections() }) }
}
