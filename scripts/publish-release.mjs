/**
 * 用 GitHub CLI（gh）把当前版本的 APK 发成 GitHub Release，
 * 并把应用内更新用的 version.json 一起作为 release 资源上传。
 *
 * 为什么走 Release 而不是 gh-pages：
 * - `releases/latest/download/version.json` 是固定地址，永远指向最新正式版，地址不用跟版本变；
 * - 安装包和清单同一次发布，不会出现「清单写了新版、APK 还是 404」的中间态（gh-pages 就踩过）；
 * - 下载走 GitHub 的 CDN，比 Pages 稳定，也方便在仓库页面直接下载。
 *
 * 用法：
 *   node scripts/publish-release.mjs                    # 用 release/词芽-安卓.apk 发当前版本
 *   node scripts/publish-release.mjs --notes "更新说明"  # 自定义说明（也可用 UPDATE_NOTES）
 *   node scripts/publish-release.mjs --dry-run          # 只准备资源并打印命令，不真的发布
 *   node scripts/publish-release.mjs --prerelease       # 发成预发布（不会顶掉 latest）
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_NOTES,
  ROOT,
  RELEASE_MANIFEST_URL,
  publishApk,
  readAndroidVersion,
  sha256Of,
  writeVersionManifest
} from './android-release.mjs'

const REPO = 'axv0805-beep/word-master'
const DEFAULT_APK = path.join(ROOT, 'release', '词芽-安卓.apk')

function parseArgs(argv) {
  const options = { notes: process.env.UPDATE_NOTES || '', dryRun: false, prerelease: false, apk: DEFAULT_APK }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--notes') options.notes = argv[++index] || ''
    else if (arg === '--apk') options.apk = argv[++index] || DEFAULT_APK
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--prerelease') options.prerelease = true
  }
  return options
}

/** gh 可能没在 PATH 里（Windows 安装包默认落在 Program Files），按常见位置找一遍 */
function resolveGh() {
  const candidates = [
    process.env.GH_BIN,
    'gh',
    'C:\\Program Files\\GitHub CLI\\gh.exe',
    '/c/Program Files/GitHub CLI/gh.exe'
  ].filter(Boolean)
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' })
      return candidate
    } catch {
      // 试下一个
    }
  }
  throw new Error('找不到 gh，请先安装 GitHub CLI 并 gh auth login，或用 GH_BIN 指定路径')
}

function run(gh, args, options = {}) {
  return execFileSync(gh, args, { encoding: 'utf8', stdio: options.stdio || 'pipe', ...options })
}

function releaseExists(gh, tag) {
  try {
    run(gh, ['release', 'view', tag, '--repo', REPO])
    return true
  } catch {
    return false
  }
}

const options = parseArgs(process.argv.slice(2))
const { versionCode, versionName, apkName } = readAndroidVersion()
const tag = `v${versionName}`

if (!fs.existsSync(options.apk)) {
  throw new Error(`找不到 APK：${options.apk}，先跑 npm run package:android`)
}

// 资源先摆在一个临时目录里：APK 改成带版本号的名字，version.json 用相对路径指向它
const stageDir = path.join(ROOT, 'artifacts', 'release', versionName)
fs.rmSync(stageDir, { recursive: true, force: true })
fs.mkdirSync(stageDir, { recursive: true })
const stagedApk = path.join(stageDir, apkName)
fs.copyFileSync(options.apk, stagedApk)
const sha256 = sha256Of(stagedApk)
const { file: manifestFile, manifest } = writeVersionManifest(
  {
    versionCode,
    versionName,
    apkName,
    notes: options.notes,
    sha256
  },
  ROOT,
  { outDir: stageDir, urlPrefix: './' }
)

// 站点上的副本保持同步，方便还在读 gh-pages 的老版本
publishApk(options.apk)

console.log(`版本：${versionName}（versionCode ${versionCode}）`)
console.log(`APK：${apkName}  ${(fs.statSync(stagedApk).size / 1024 / 1024).toFixed(1)} MB`)
console.log(`sha256：${sha256}`)
console.log(`清单：${path.relative(ROOT, manifestFile)} → ${manifest.url}`)
console.log(`说明：${manifest.notes}`)

if (options.dryRun) {
  console.log('\n--dry-run：资源已就绪，未创建 release')
  console.log(`gh release create ${tag} --repo ${REPO} "${stagedApk}" "${manifestFile}"`)
  process.exit(0)
}

const gh = resolveGh()
const flags = ['--repo', REPO, '--title', `词芽 v${versionName}`, '--notes', manifest.notes]
if (options.prerelease) flags.push('--prerelease')
else flags.push('--latest')

if (releaseExists(gh, tag)) {
  console.log(`\n${tag} 已存在，改为覆盖资源`)
  run(gh, ['release', 'upload', tag, stagedApk, manifestFile, '--repo', REPO, '--clobber'], { stdio: 'inherit' })
  if (!options.prerelease) {
    run(gh, ['release', 'edit', tag, '--repo', REPO, '--notes', manifest.notes, '--latest'], { stdio: 'inherit' })
  }
} else {
  run(gh, ['release', 'create', tag, stagedApk, manifestFile, ...flags], { stdio: 'inherit' })
}

console.log(`\n已发布：https://github.com/${REPO}/releases/tag/${tag}`)
console.log(`应用内更新清单：${RELEASE_MANIFEST_URL}`)
console.log(`APK 固定地址：https://github.com/${REPO}/releases/latest/download/${apkName}`)
