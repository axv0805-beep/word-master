/**
 * 把构建产物打包成免安装的 Windows 桌面程序。
 *
 * 产物：release/单词王-win32-x64/单词王.exe（整个文件夹即为程序，双击 exe 运行）
 *       release/单词王-桌面版.zip（方便拷贝/分发）
 *
 * 用法：npm run package:desktop        # 先构建再打包
 *       npm run package:desktop -- --no-build   # 跳过构建，直接用现有 dist/
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ensureElectronRuntime, ensureRcedit } from './electron-runtime.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const APP_NAME = '单词王'
const OUT_DIR = path.join(ROOT, 'release', `${APP_NAME}-win32-x64`)

const skipBuild = process.argv.includes('--no-build')

// 不用 fs.cpSync：在部分 Windows + Node 22 组合上 cpSync 会把进程直接打死，
// 这里用最朴素的 readdir + copyFile 递归复制，稳定且可预期。
function copyTree(src, dest, filter = () => true) {
  const stat = fs.lstatSync(src)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const name of fs.readdirSync(src)) {
      const from = path.join(src, name)
      if (!filter(from)) continue
      copyTree(from, path.join(dest, name), filter)
    }
    return
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function run(cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`)
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
}

if (!skipBuild) run('npm', ['run', 'build'])

if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
  console.error('没有找到 dist/index.html，请先执行 npm run build')
  process.exit(1)
}

const { runtimeDir } = await ensureElectronRuntime(ROOT)

// 1. 拷贝 Electron 运行时
console.log(`\n组装应用到 ${path.relative(ROOT, OUT_DIR)} ...`)
fs.rmSync(OUT_DIR, { recursive: true, force: true })
copyTree(runtimeDir, OUT_DIR, (src) => {
  const base = path.basename(src).toLowerCase()
  // .zip 是运行时压缩包；rcedit 只是打包工具，不进最终产物
  return !base.endsWith('.zip') && base !== 'rcedit.exe'
})

// 2. 放入应用代码：resources/app/{package.json, main.cjs, dist/}
const appDir = path.join(OUT_DIR, 'resources', 'app')
fs.rmSync(path.join(OUT_DIR, 'resources', 'app.asar'), { force: true })
fs.rmSync(path.join(OUT_DIR, 'resources', 'default_app.asar'), { force: true })
fs.mkdirSync(path.join(appDir, 'electron'), { recursive: true })
copyTree(path.join(ROOT, 'electron', 'main.cjs'), path.join(appDir, 'electron', 'main.cjs'))
copyTree(path.join(ROOT, 'dist'), path.join(appDir, 'dist'))
fs.writeFileSync(
  path.join(appDir, 'package.json'),
  JSON.stringify(
    {
      name: 'word-master',
      productName: APP_NAME,
      version: '1.0.0',
      private: true,
      main: 'electron/main.cjs',
      description: '单词王 · 手机优先的背单词应用（桌面版）'
    },
    null,
    2
  ) + '\n'
)

// 3. 把 electron.exe 改成产品名，并写入图标 / 版本信息
const exeSrc = path.join(OUT_DIR, 'electron.exe')
const exeDst = path.join(OUT_DIR, `${APP_NAME}.exe`)
if (fs.existsSync(exeSrc)) fs.renameSync(exeSrc, exeDst)

const iconPath = path.join(ROOT, 'build', 'icon.ico')
if (fs.existsSync(iconPath) && process.platform === 'win32') {
  try {
    const rcedit = await ensureRcedit(ROOT)
    execFileSync(rcedit, [
      exeDst,
      '--set-icon',
      iconPath,
      '--set-version-string',
      'ProductName',
      APP_NAME,
      '--set-version-string',
      'FileDescription',
      '单词王 · 背单词',
      '--set-file-version',
      '1.0.0',
      '--set-product-version',
      '1.0.0'
    ])
    console.log('已写入程序图标与版本信息')
  } catch (error) {
    console.warn('设置图标失败（不影响运行）：', error.message)
  }
}

// 4. 打 zip（方便发送给别人）
const zipPath = path.join(ROOT, 'release', `${APP_NAME}-桌面版.zip`)
fs.rmSync(zipPath, { force: true })
try {
  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -LiteralPath '${OUT_DIR}' -DestinationPath '${zipPath}' -Force`
    ],
    { stdio: 'inherit' }
  )
} catch (error) {
  console.warn('zip 打包失败（不影响文件夹版）：', error.message)
}

const sizeMb = (dir) => {
  let total = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    total += entry.isDirectory() ? sizeMb(p) : fs.statSync(p).size
  }
  return total
}

console.log('\n打包完成：')
console.log(`  程序目录  ${OUT_DIR}`)
console.log(`  启动文件  ${exeDst}`)
if (fs.existsSync(zipPath)) console.log(`  压缩包    ${zipPath}`)
console.log(`  体积      ${(sizeMb(OUT_DIR) / 1048576).toFixed(1)} MB`)
