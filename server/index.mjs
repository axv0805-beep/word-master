import { createApp } from './app.mjs'
import { loadConfig } from './config.mjs'

const { host, port, ...config } = loadConfig()
const app = createApp(config)
const hint = config.allowSetup ? '首次打开「AI 账号」创建管理员' : '管理员用 node server/admin.mjs create-admin 创建'
app.server.listen(port, host, () => console.log(`词芽 AI 服务：http://${host}:${port} （${hint}）`))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { void app.close().then(() => process.exit(0)) })
