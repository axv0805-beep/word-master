/**
 * 桌面调试：先构建（保证窗口里是最新代码），再用 .electron 里的运行时启动窗口。
 * 用法：npm run electron:dev [-- --no-build]
 */
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ensureElectronRuntime } from './electron-runtime.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const skipBuild = process.argv.includes('--no-build')

if (!skipBuild) {
  console.log('$ npm run build')
  execFileSync('npm', ['run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
}

const { exe } = await ensureElectronRuntime(ROOT)
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(exe, [ROOT, ...process.argv.slice(2).filter((a) => a !== '--no-build')], {
  stdio: 'inherit',
  env
})
child.on('close', (code) => process.exit(code ?? 0))
