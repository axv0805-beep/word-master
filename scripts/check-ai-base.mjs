// 打包前确认 dist 里的 JS 带着统一 AI 后台地址：VITE_* 在构建时写死，漏了它装到手机上 AI 就连不上。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, process.argv[2] || 'dist')
const fromFile = fs.readFileSync(path.join(root, '.env.production'), 'utf8').match(/^VITE_AI_API_BASE_URL=(.*)$/m)?.[1]
const expected = (process.env.VITE_AI_API_BASE_URL || fromFile || '').trim().replace(/\/$/, '')
if (!/^https:\/\/[^/]+$/.test(expected)) throw new Error(`AI 后台地址必须是 https 根地址，当前为「${expected}」`)
const assets = path.join(dist, 'assets')
const found = fs.readdirSync(assets).filter((f) => f.endsWith('.js')).some((f) => fs.readFileSync(path.join(assets, f), 'utf8').includes(`"${expected}"`))
if (!found) throw new Error(`${dist} 的 JS 中没有 AI 后台地址 ${expected}，请重新构建`)
console.log(`AI 后台地址已写入构建：${expected}`)
