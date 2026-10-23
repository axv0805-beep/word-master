/**
 * 下载并解压一份 Electron 运行时到 .electron/（不依赖 npm 安装，避开本机 npm 的
 * pnpm 目录解析问题）。只针对 Windows x64，其它平台会给出提示。
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import https from 'node:https'

export const ELECTRON_VERSION = '33.2.0'
const RUNTIME_DIR = '.electron'
const ZIP_NAME = `electron-v${ELECTRON_VERSION}-win32-x64.zip`

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const request = (target) => {
      https
        .get(target, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume()
            request(res.headers.location)
            return
          }
          if (res.statusCode !== 200) {
            reject(new Error(`下载失败 HTTP ${res.statusCode}: ${target}`))
            return
          }
          const total = Number(res.headers['content-length'] || 0)
          let received = 0
          let lastTick = 0
          res.on('data', (chunk) => {
            received += chunk.length
            const now = Date.now()
            if (now - lastTick > 2000) {
              lastTick = now
              const pct = total ? ((received / total) * 100).toFixed(1) + '%' : ''
              process.stdout.write(`  下载中 ${pct} (${(received / 1048576).toFixed(1)} MB)\r`)
            }
          })
          res.pipe(file)
          file.on('finish', () => file.close(() => resolve()))
        })
        .on('error', reject)
    }
    request(url)
  })
}

function extract(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destDir}' -Force`
    ],
    { stdio: 'inherit' }
  )
}

export async function ensureElectronRuntime(root) {
  const runtimeDir = path.join(root, RUNTIME_DIR)
  const exe = path.join(runtimeDir, 'electron.exe')
  if (fs.existsSync(exe)) return { runtimeDir, exe }

  if (process.platform !== 'win32') {
    throw new Error('当前脚本只提供了 Windows x64 的 Electron 运行时；其它平台请用 npm i -D electron 后运行 npx electron .')
  }

  const zipPath = path.join(runtimeDir, ZIP_NAME)
  const url = `https://npmmirror.com/mirrors/electron/${ELECTRON_VERSION}/${ZIP_NAME}`
  console.log(`首次运行：下载 Electron ${ELECTRON_VERSION} 运行时...`)
  console.log(`  ${url}`)
  fs.mkdirSync(runtimeDir, { recursive: true })
  await download(url, zipPath)
  console.log('\n解压运行时...')
  extract(zipPath, runtimeDir)
  fs.rmSync(zipPath, { force: true })
  if (!fs.existsSync(exe)) throw new Error('解压后没有找到 electron.exe')
  return { runtimeDir, exe }
}

/** rcedit.exe：给 exe 换图标、写版本信息。缺失时自动下载。 */
export async function ensureRcedit(root) {
  const target = path.join(root, RUNTIME_DIR, 'rcedit.exe')
  if (fs.existsSync(target)) return target

  const url = 'https://github.com/electron/rcedit/releases/download/v2.0.0/rcedit-x64.exe'
  console.log('下载 rcedit（用于设置程序图标）...')
  fs.mkdirSync(path.dirname(target), { recursive: true })
  await download(url, target)
  console.log('')
  return target
}
