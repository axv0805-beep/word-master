/**
 * 安卓发版的公共逻辑，本地打包脚本（scripts/build-android.mjs）和
 * CI（.github/workflows/android.yml → scripts/publish-android.mjs）共用一份，
 * 免得版本号、更新清单的字段在两处各写一遍、慢慢漂移。
 *
 * 版本号的唯一来源是 android/app/build.gradle 的 versionCode / versionName。
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** 没写更新说明时的兜底文案 */
export const DEFAULT_NOTES = '细节优化与问题修复，更新后学习进度与设置都会保留。'

/**
 * 从 android/app/build.gradle 读版本号。
 * 这是全项目唯一的版本来源，public/version.json 和界面上的版本都从这里派生。
 */
export function readAndroidVersion(root = ROOT) {
  const gradleFile = fs.readFileSync(path.join(root, 'android', 'app', 'build.gradle'), 'utf8')
  const versionCode = Number((/versionCode\s+(\d+)/.exec(gradleFile) || [])[1] || 1)
  const versionName = (/versionName\s+'([^']+)'/.exec(gradleFile) || [])[1] || '1.0.0'
  return { versionCode, versionName, apkName: `cimiao-${versionName}.apk` }
}

/**
 * 把 versionName 同步进 src/core/native.ts 的 APP_VERSION。
 * 界面上的「当前版本」和应用内更新提示都读它，忘了同步就会出现「1.1.7 装着、界面显示 1.1.6」。
 * 页面资源是打进 APK 的，所以必须在 npm run build 之前改。
 */
export function syncAppVersion(versionName, root = ROOT) {
  const file = path.join(root, 'src', 'core', 'native.ts')
  const source = fs.readFileSync(file, 'utf8')
  const next = source.replace(/(export const APP_VERSION = ')[^']*(')/, `$1${versionName}$2`)
  if (next === source) return false
  fs.writeFileSync(file, next, 'utf8')
  return true
}

/**
 * 安装包的 sha256（64 位小写十六进制）。
 * 写进 version.json 后，安卓端下载完会拿它校验一遍：站点缓存/CDN 返回半截文件时能当场发现，
 * 而不是等系统安装器报「解析失败」。
 */
export function sha256Of(file) {
  const hash = crypto.createHash('sha256')
  hash.update(fs.readFileSync(file))
  return hash.digest('hex')
}

function readManifest(root = ROOT) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'public', 'version.json'), 'utf8'))
  } catch {
    return null
  }
}

/**
 * 写 public/version.json —— 站点上的更新清单，应用内「检查更新」读的就是它。
 * 没显式给 notes 时沿用上一版的说明：CI 里没填更新说明不会把人工写好的文案冲成默认值。
 */
export function writeVersionManifest(
  { versionCode, versionName, apkName, notes, publishedAt, sha256 },
  root = ROOT
) {
  const file = path.join(root, 'public', 'version.json')
  const previous = readManifest(root)
  const manifest = {
    versionCode,
    versionName,
    url: `./download/${apkName}`,
    notes: notes || previous?.notes || DEFAULT_NOTES,
    publishedAt: publishedAt || new Date().toISOString().slice(0, 10)
  }
  // 只有真的知道摘要时才写这个字段：老版本 App 不认识它，多一个字段无副作用
  if (sha256) manifest.sha256 = sha256
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return { file, manifest }
}

/**
 * 把构建出来的 APK 发布到 public/download/：
 * - cimiao-<版本>.apk 是按版本留档，应用内更新按 version.json 里的地址下载它
 * - latest.apk 是固定地址，方便手动分享/下载最新包
 * extraDirs 里的目录（本地打包时是 dist）会各再放一份，供 vite preview 直接试。
 */
export function publishApk(apkPath, { root = ROOT, extraDirs = [] } = {}) {
  if (!fs.existsSync(apkPath)) throw new Error(`找不到 APK：${apkPath}`)
  const { versionCode, versionName, apkName } = readAndroidVersion(root)
  const targets = [
    path.join(root, 'public', 'download', apkName),
    path.join(root, 'public', 'download', 'latest.apk'),
    ...extraDirs.flatMap((dir) => [
      path.join(dir, 'download', apkName),
      path.join(dir, 'download', 'latest.apk')
    ])
  ]
  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(apkPath, target)
  }
  const size = (fs.statSync(apkPath).size / 1024 / 1024).toFixed(1)
  return { versionCode, versionName, apkName, targets, size, sha256: sha256Of(apkPath) }
}
