import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
const processes = [spawn(process.execPath, ['server/index.mjs'], { cwd: root, stdio: 'inherit' }), spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { cwd: root, stdio: 'inherit' })]
let closing = false
function stop(code = 0) { if (closing) return; closing = true; processes.forEach((p) => p.kill()); process.exitCode = code }
processes.forEach((p) => { p.on('error', () => stop(1)); p.on('exit', (code) => stop(code ?? 0)) })
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop())
