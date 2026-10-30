// Server-side account maintenance. Only someone with shell access to the server can run this,
// which is how a public deployment gets its first admin (HTTP setup stays loopback-only).
//   node --env-file=/etc/word-master/env server/admin.mjs create-admin <username>
//   node --env-file=/etc/word-master/env server/admin.mjs reset-password <username>
//   node --env-file=/etc/word-master/env server/admin.mjs list-users
// The password is read from the terminal without echo, or from the first line of piped stdin.
import { createInterface } from 'node:readline'
import { createApp } from './app.mjs'
import { loadConfig } from './config.mjs'

async function readPassword(prompt) {
  const input = process.stdin
  if (!input.isTTY) {
    const rl = createInterface({ input })
    for await (const line of rl) { rl.close(); return line.trim() }
    return ''
  }
  process.stdout.write(prompt)
  input.setRawMode(true); input.resume(); input.setEncoding('utf8')
  return new Promise((resolve, reject) => {
    let value = ''
    input.on('data', function onData(chars) {
      for (const ch of chars) {
        if (ch === '\u0003') { input.setRawMode(false); reject(new Error('已取消')); return }
        if (ch === '\r' || ch === '\n') { input.setRawMode(false); input.pause(); input.off('data', onData); process.stdout.write('\n'); resolve(value); return }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1)
        else value += ch
      }
    })
  })
}

const [command, username] = process.argv.slice(2)
const { host, port, ...config } = loadConfig()
const app = createApp({ ...config, recoverPending: false })
try {
  if (command === 'create-admin' && username) {
    const password = await readPassword('新管理员密码（至少10位）：')
    const user = await app.createUser({ username, password }, 'admin')
    console.log(`已创建管理员 ${user.username}`)
  } else if (command === 'reset-password' && username) {
    const password = await readPassword('新密码（至少10位）：')
    const user = await app.setPassword(username, password)
    console.log(`已重置 ${user.username} 的密码，并注销其全部登录`)
  } else if (command === 'list-users') {
    for (const u of app.db.prepare('SELECT username, role, daily_limit FROM users ORDER BY role, username').all()) console.log(`${u.role}\t${u.daily_limit}/天\t${u.username}`)
  } else {
    console.error('用法：node server/admin.mjs create-admin <用户名> | reset-password <用户名> | list-users')
    process.exitCode = 2
  }
} catch (error) {
  console.error(error.message); process.exitCode = 1
} finally { await app.close() }
