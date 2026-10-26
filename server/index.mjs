import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createApp } from './app.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const dataDir = process.env.AI_DATA_DIR || path.join(root, 'server', 'data')
mkdirSync(dataDir, { recursive: true })
const keyFile = path.join(dataDir, 'encryption.key')
const host = process.env.AI_HOST || '127.0.0.1'
const port = Number(process.env.AI_PORT || 3180)
const local = ['127.0.0.1', '::1'].includes(host)
if (!process.env.AI_ENCRYPTION_KEY && !local) throw new Error('非本地运行必须配置 AI_ENCRYPTION_KEY')
if (!process.env.AI_ENCRYPTION_KEY && !existsSync(keyFile)) writeFileSync(keyFile, randomBytes(32).toString('hex'), { mode: 0o600, flag: 'wx' })
const app = createApp({
  database: path.join(dataDir, 'word-master.sqlite'),
  encryptionKey: process.env.AI_ENCRYPTION_KEY || readFileSync(keyFile, 'utf8').trim(),
  allowPrivate: process.env.AI_ALLOW_PRIVATE_ENDPOINTS === 'true',
  allowSetup: local,
  origins: (process.env.AI_ALLOWED_ORIGINS || `http://localhost:${port},http://127.0.0.1:${port},http://localhost:5173,http://127.0.0.1:5173`).split(',').map((s) => s.trim()),
  staticDir: path.join(root, 'dist'),
  globalDailyLimit: Number(process.env.AI_GLOBAL_DAILY_LIMIT || 1000)
})
app.server.listen(port, host, () => console.log(`词芽本地 AI 服务：http://${host}:${port} （首次打开「AI 账号」创建管理员）`))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { void app.close().then(() => process.exit(0)) })
