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
 *   - JDK 17（JAVA_HOME 或 C:\Program Files\Java\jdk-17）
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const toolchain = 'D:\\A-WWW\\DS-harness\\android-toolchain'
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
if (!skipBuild) {
  console.log('[1/5] 构建 web 产物')
  // Windows 上 .cmd 必须经 shell 启动（Node 22 起禁止直接 spawn .cmd）
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
    shell: process.platform === 'win32'
  })
}

console.log('[2/5] 复制安卓工程到 ASCII 暂存区')
fs.rmSync(stage, { recursive: true, force: true })
fs.mkdirSync(stage, { recursive: true })
for (const file of ['settings.gradle', 'build.gradle', 'gradle.properties']) {
  fs.copyFileSync(path.join(root, 'android', file), path.join(stage, file))
}
copyTree(sourceApp, stageApp)

console.log('[3/5] 拷贝 dist 到 assets/www')
const wwwDir = path.join(stageApp, 'src', 'main', 'assets', 'www')
fs.rmSync(wwwDir, { recursive: true, force: true })
fs.mkdirSync(wwwDir, { recursive: true })
copyTree(path.join(root, 'dist'), wwwDir, new Set())

console.log('[4/5] Gradle assembleDebug')
fs.writeFileSync(path.join(stage, 'local.properties'), `sdk.dir=${sdkDir.replace(/\\/g, '/')}\n`, 'utf8')
if (!fs.existsSync(gradleBin)) throw new Error(`找不到 Gradle：${gradleBin}`)
if (!fs.existsSync(sdkDir)) throw new Error(`找不到 Android SDK：${sdkDir}`)
run(gradleBin, ['assembleDebug', '--no-daemon', '--console=plain'], {
  cwd: stage,
  env: {
    ...process.env,
    JAVA_HOME: process.env.JAVA_HOME || 'C:\\Program Files\\Java\\jdk-17',
    ANDROID_HOME: sdkDir,
    ANDROID_SDK_ROOT: sdkDir
  }
})

console.log('[5/5] 输出 APK')
if (!fs.existsSync(apkSrc)) throw new Error(`未生成 APK：${apkSrc}`)
fs.mkdirSync(path.dirname(apkOut), { recursive: true })
fs.copyFileSync(apkSrc, apkOut)
const size = (fs.statSync(apkOut).size / 1024 / 1024).toFixed(1)
console.log(`完成：${apkOut}（${size} MB）`)
