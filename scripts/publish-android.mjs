/**
 * 发布已经构建好的 APK：拷进 public/download/ 并更新 public/version.json。
 *
 * 本地用法：
 *   node scripts/publish-android.mjs release/词芽-安卓.apk --notes "这次修了什么"
 * CI 用法（.github/workflows/android.yml）：
 *   node scripts/publish-android.mjs android/app/build/outputs/apk/debug/app-debug.apk
 *
 * 版本号只有一处来源：android/app/build.gradle，先改那里再发。
 */
import path from 'node:path'
import { ROOT, DEFAULT_NOTES, readAndroidVersion, publishApk, writeVersionManifest } from './android-release.mjs'

const args = process.argv.slice(2)
const apkArg = args.find((arg) => !arg.startsWith('--'))
if (!apkArg) {
  console.error('用法：node scripts/publish-android.mjs <apk 路径> [--notes "更新说明"] [--dry-run]')
  process.exit(1)
}
const notesIndex = args.indexOf('--notes')
const notes = notesIndex >= 0 ? args[notesIndex + 1] : process.env.UPDATE_NOTES
const dryRun = args.includes('--dry-run')
const apkPath = path.resolve(ROOT, apkArg)
const { versionCode, versionName, apkName } = readAndroidVersion(ROOT)

console.log(`词芽 v${versionName}（versionCode ${versionCode}）`)
console.log(`  源文件：${apkPath}`)
console.log(`  发布到：public/download/${apkName}、public/download/latest.apk`)
console.log(`  清单：  public/version.json → ./download/${apkName}`)

if (dryRun) {
  console.log('\n[dry-run] 只打印计划，不改文件。')
  process.exit(0)
}

const published = publishApk(apkPath, { root: ROOT })
const { manifest } = writeVersionManifest({ versionCode, versionName, apkName, notes })

console.log(`\n完成：${published.size} MB，${published.targets.length} 个文件已更新`)
console.log(`version.json 说明：${manifest.notes || DEFAULT_NOTES}`)
console.log('\n下一步：提交 public/download 与 public/version.json，Push 后 Pages 会一起更新。')
