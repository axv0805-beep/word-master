/**
 * 打包安卓安装包：web 构建 → 复制工程到 ASCII 路径暂存区 → Gradle assembleDebug → release/词芽-安卓.apk
 *
 * 为什么要有暂存区：AGP 在 Windows 上遇到非 ASCII 项目路径会直接报
 *   Your project path contains non-ASCII characters
 * 本项目目录名是「单词」，所以真正参与 Gradle 构建的副本放在 D:\A-WWW\DS-harness\android-build。
 *
 * 依赖本地工具链（都在项目外的 ASCII 目录，已被 .gitignore 忽略）：
 *   - D:\A-WWW\DS-harness\android-toolchain\sdk        Android SDK（platform 34 / build-tools 34）
 *   - D:\A-WWW\DS-harness\android-toolchain\gradle-8.7 Gradle
 *   - D:\A-WWW\DS-harness\.android                     debug 签名钥匙（ANDROID_USER_HOME 固定在这里）
 *   - JDK 17 或 21（JAVA_HOME，或下面 JAVA_CANDIDATES 里的默认位置）
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { publishApk, readAndroidVersion, writeVersionManifest } from './android-release.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const harness = 'D:\\A-WWW\\DS-harness'
const toolchain = path.join(harness, 'android-toolchain')
// AndroidUserHome 固定下来，debug 签名钥匙每次都落在同一个 debug.keystore 里；
// 钥匙变了覆盖安装就会失败，所以这个位置不能随环境变量漂移。
const androidUserHome = path.join(harness, '.android')
const sdkDir = path.join(toolchain, 'sdk')
const gradleBin = path.join(toolchain, 'gradle-8.7', 'bin', 'gradle.bat')
const stage = 'D:\\A-WWW\\DS-harness\\android-build'
const stageApp = path.join(stage, 'app')
const sourceApp = path.join(root, 'android', 'app')
const apkSrc = path.join(stageApp, 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
const apkOut = path.join(root, 'release', '词芽-安卓.apk')

const SKIP_DIRS = new Set(['build', '.gradle', 'www'])

function run(cmd, args, options = {}) {
  // Windows 上 .cmd/.bat 必须经 shell 启动（Node 22 起禁止直接 spawn 批处理文件）
  const needsShell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(cmd)
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    ...(needsShell ? { shell: true } : {}),
    ...options
  })
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} 退出码 ${result.status}`)
}

function copyTree(from, to, skip = SKIP_DIRS) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const source = path.join(from, entry.name)
    const target = path.join(to, entry.name)
    if (entry.isDirectory()) copyTree(source, target, skip)
    else fs.copyFileSync(source, target)
  }
}

const skipBuild = process.argv.includes('--no-build')

const JAVA_CANDIDATES = [
  'C:\\Program Files\\Java\\jdk-17',
  'C:\\Program Files\\Java\\jdk-21.0.10',
  'C:\\Program Files\\Java\\jdk-21',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17'
]

function resolveJavaHome() {
  if (process.env.JAVA_HOME) return process.env.JAVA_HOME
  const found = JAVA_CANDIDATES.find((dir) => fs.existsSync(path.join(dir, 'bin', 'java.exe')))
  if (!found) {
    throw new Error(`找不到 JDK，请先设置 JAVA_HOME。试过的位置：${JAVA_CANDIDATES.join('、')}`)
  }
  return found
}

// 版本号以 android/app/build.gradle 为唯一来源（解析逻辑与 CI 共用 scripts/android-release.mjs）；发版前把它 +1
const { versionCode, versionName, apkName } = readAndroidVersion(root)

console.log(`[1/6] 写 version.json（v${versionName} / code ${versionCode}）`)
fs.mkdirSync(path.join(root, 'public', 'download'), { recursive: true })
writeVersionManifest({ versionCode, versionName, apkName, notes: process.env.UPDATE_NOTES }, root)

if (!skipBuild) {
  console.log('[2/6] 构建 web 产物')
  // Windows 上 .cmd 必须经 shell 启动（Node 22 起禁止直接 spawn .cmd）
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
    shell: process.platform === 'win32'
  })
}

console.log('[3/6] 复制安卓工程到 ASCII 暂存区')
fs.rmSync(stage, { recursive: true, force: true })
fs.mkdirSync(stage, { recursive: true })
for (const file of ['settings.gradle', 'build.gradle', 'gradle.properties']) {
  fs.copyFileSync(path.join(root, 'android', file), path.join(stage, file))
}
// 配了自定义签名就把 keystore.properties 和钥匙一起带过去，否则打出来的包签名和 CI 对不上
for (const file of fs.readdirSync(path.join(root, 'android'))) {
  if (file === 'keystore.properties' || /\.(jks|keystore)$/i.test(file)) {
    fs.copyFileSync(path.join(root, 'android', file), path.join(stage, file))
  }
}
copyTree(sourceApp, stageApp)

console.log('[4/6] 拷贝 dist 到 assets/www')
const wwwDir = path.join(stageApp, 'src', 'main', 'assets', 'www')
fs.rmSync(wwwDir, { recursive: true, force: true })
fs.mkdirSync(wwwDir, { recursive: true })
// download/ 是给网页端下载 APK 用的，别塞进 APK 自己
copyTree(path.join(root, 'dist'), wwwDir, new Set(['download']))

console.log('[5/6] Gradle assembleDebug')
fs.writeFileSync(path.join(stage, 'local.properties'), `sdk.dir=${sdkDir.replace(/\\/g, '/')}\n`, 'utf8')
if (!fs.existsSync(gradleBin)) throw new Error(`找不到 Gradle：${gradleBin}`)
if (!fs.existsSync(sdkDir)) throw new Error(`找不到 Android SDK：${sdkDir}`)
fs.mkdirSync(androidUserHome, { recursive: true })
run(gradleBin, ['assembleDebug', '--no-daemon', '--console=plain'], {
  cwd: stage,
  env: {
    ...process.env,
    JAVA_HOME: resolveJavaHome(),
    ANDROID_HOME: sdkDir,
    ANDROID_SDK_ROOT: sdkDir,
    ANDROID_USER_HOME: androidUserHome
  }
})

console.log('[5/6] 输出到 release/')
if (!fs.existsSync(apkSrc)) throw new Error(`未生成 APK：${apkSrc}`)
fs.mkdirSync(path.dirname(apkOut), { recursive: true })
fs.copyFileSync(apkSrc, apkOut)

console.log('[6/6] 发布到 public/download（随站点提供，供应用内更新与手动下载）')
const published = publishApk(apkOut, { root, extraDirs: [path.join(root, 'dist')] })
console.log(`完成：${apkOut}（${published.size} MB），站点地址 ./download/${apkName}`)
