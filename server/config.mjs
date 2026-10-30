import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

/** Shared by the HTTP service and the admin CLI so both open the same database with the same key. */
export function loadConfig(env = process.env) {
  const dataDir = env.AI_DATA_DIR || path.join(root, 'server', 'data')
  mkdirSync(dataDir, { recursive: true })
  const keyFile = path.join(dataDir, 'encryption.key')
  const host = env.AI_HOST || '127.0.0.1'
  const port = Number(env.AI_PORT || 3180)
  const local = ['127.0.0.1', '::1'].includes(host)
  // Behind Caddy/nginx the socket is loopback for everyone, so loopback no longer means "this machine".
  const trustProxy = env.AI_TRUST_PROXY === 'true'
  if (!env.AI_ENCRYPTION_KEY && (!local || trustProxy)) throw new Error('公网部署必须配置 AI_ENCRYPTION_KEY')
  if (!env.AI_ENCRYPTION_KEY && !existsSync(keyFile)) writeFileSync(keyFile, randomBytes(32).toString('hex'), { mode: 0o600, flag: 'wx' })
  return {
    host, port,
    database: path.join(dataDir, 'word-master.sqlite'),
    encryptionKey: env.AI_ENCRYPTION_KEY || readFileSync(keyFile, 'utf8').trim(),
    allowPrivate: env.AI_ALLOW_PRIVATE_ENDPOINTS === 'true',
    allowSetup: local && !trustProxy,
    trustProxy,
    origins: (env.AI_ALLOWED_ORIGINS || `http://localhost:${port},http://127.0.0.1:${port},http://localhost:5173,http://127.0.0.1:5173`).split(',').map((s) => s.trim()).filter(Boolean),
    staticDir: path.join(root, 'dist'),
    globalDailyLimit: Number(env.AI_GLOBAL_DAILY_LIMIT || 1000)
  }
}
