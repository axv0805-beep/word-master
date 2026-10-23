/**
 * 把 android/app/build.gradle 的 versionCode +1、versionName 末位 +1（例：8 / 1.1.6 → 9 / 1.1.7）。
 * CI 的「版本号自增」开关会调它；本地发版前也可以手动跑一次。
 */
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, readAndroidVersion } from './android-release.mjs'

const file = path.join(ROOT, 'android', 'app', 'build.gradle')
const { versionCode, versionName } = readAndroidVersion(ROOT)
const parts = versionName.split('.').map(Number)
if (parts.some((part) => Number.isNaN(part))) throw new Error(`versionName 不是 x.y.z 形式：${versionName}`)
parts[parts.length - 1] += 1
const nextName = parts.join('.')

const gradle = fs
  .readFileSync(file, 'utf8')
  .replace(/(versionCode\s+)\d+/, `$1${versionCode + 1}`)
  .replace(/(versionName\s+')([^']+)(')/, `$1${nextName}$3`)
fs.writeFileSync(file, gradle, 'utf8')

console.log(`versionCode ${versionCode} → ${versionCode + 1}`)
console.log(`versionName ${versionName} → ${nextName}`)
