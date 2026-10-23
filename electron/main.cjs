/**
 * 词芽 桌面壳（Electron）
 *
 * 为什么内置一个本地静态服务器：生产构建是 ES module + PWA，
 * 直接用 file:// 打开会被浏览器按 CORS 拦掉（脚本/样式全部加载失败），
 * Service Worker 也无法在 null origin 注册。所以这里用 127.0.0.1 随机端口
 * 起一个只读静态服务，再让窗口加载 http://127.0.0.1:<port>/。
 *
 * 用法：
 *   npm run electron:dev    # 先构建再启动
 *   npm run package:desktop # 打包成免安装 exe
 *   electron . --smoke      # 冒烟模式：加载完成后打印 READY 并退出
 */
const { app, BrowserWindow, shell, Menu } = require('electron')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const DIST = path.join(__dirname, '..', 'dist')
const IS_SMOKE = process.argv.includes('--smoke')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
  const resolved = path.normalize(path.join(root, decoded))
  return resolved.startsWith(root) ? resolved : null
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = safeJoin(DIST, req.url === '/' ? '/index.html' : req.url)
      if (!filePath) {
        res.writeHead(403).end('Forbidden')
        return
      }
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html')
      }
      if (!fs.existsSync(filePath)) {
        // HashRouter 下理论上不会走到这里；兜底回首页
        filePath = path.join(DIST, 'index.html')
        if (!fs.existsSync(filePath)) {
          res.writeHead(404).end('Not Found')
          return
        }
      }
      const ext = path.extname(filePath).toLowerCase()
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      })
      fs.createReadStream(filePath).pipe(res)
    })
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

async function createWindow(server) {
  const port = server.address().port
  const iconPath = [
    path.join(__dirname, '..', 'dist', 'icons', 'icon-512.png'),
    path.join(__dirname, '..', 'public', 'icons', 'icon-512.png')
  ].find((p) => fs.existsSync(p))
  const win = new BrowserWindow({
    width: 430,
    height: 900,
    minWidth: 360,
    minHeight: 560,
    resizable: true,
    autoHideMenuBar: true,
    backgroundColor: '#0F172A',
    title: '词芽 · 背单词',
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.setMenuBarVisibility(false)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  // F12 打开/关闭开发者工具，方便查看效果与排查问题
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i'))) {
      win.webContents.toggleDevTools()
    }
  })

  win.webContents.on('did-finish-load', () => {
    console.log('READY http://127.0.0.1:' + port + '/')
    if (IS_SMOKE) {
      setTimeout(async () => {
        try {
          const image = await win.webContents.capturePage()
          const out = process.env.SMOKE_SHOT || path.join(app.getPath('temp'), 'word-master-smoke.png')
          fs.mkdirSync(path.dirname(out), { recursive: true })
          fs.writeFileSync(out, image.toPNG())
          console.log('SHOT ' + out)
        } catch (error) {
          console.error('SHOT_FAILED', error)
        }
        console.log('SMOKE_EXIT')
        app.exit(0)
      }, 2500)
    }
  })
  win.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('LOAD_FAILED', code, desc)
    if (IS_SMOKE) app.exit(1)
  })

  await win.loadURL(`http://127.0.0.1:${port}/`)
  return win
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null)
    try {
      const server = await startServer()
      await createWindow(server)
    } catch (error) {
      console.error('START_FAILED', error)
      app.exit(1)
    }
  })

  app.on('window-all-closed', () => app.quit())
}
