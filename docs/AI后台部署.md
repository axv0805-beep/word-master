# 统一 AI 后台部署（线上）

安装版 App（安卓 WebView、桌面版）和 GitHub Pages 都通过 `https://word.xiaoxin8.com` 访问同一个后台。地址写在仓库根目录的 `.env.production`，**构建时**写进 JS；打包脚本和 CI 都会用 `scripts/check-ai-base.mjs` 校验，漏写就中止打包。1.2.0 就是因为漏写了这个地址，App 才去请求 `https://appassets.androidplatform.net/api/...`，拿到的不是 JSON，于是提示“AI 服务未启动”。

厂商密钥只存在后台数据库里（AES-256-GCM 加密），不会进入 APK、前端或仓库。

## 服务器布局（108.187.15.183，Ubuntu 24.04）

| 项目 | 位置 |
| --- | --- |
| 代码（root 只读） | `/opt/word-master/server/*.mjs`，无 npm 依赖，Node 24 内置 `node:sqlite` |
| 数据（SQLite + WAL） | `/var/lib/word-master/`，属主 `wordmaster`，权限 700 |
| 环境变量（含加密密钥） | `/etc/word-master/env`，`root:wordmaster` 640 |
| 进程 | systemd `word-master-ai.service`，`wordmaster` 用户，只监听 `127.0.0.1:3180`，`MemoryMax=300M` |
| HTTPS | Caddy（`/etc/caddy/Caddyfile` 的 `word.xiaoxin8.com` 站点）自动签发证书，反代到 3180 |

`/etc/word-master/env` 的键：`AI_ENCRYPTION_KEY`、`AI_HOST=127.0.0.1`、`AI_PORT=3180`、`AI_TRUST_PROXY=true`、`AI_DATA_DIR=/var/lib/word-master`、`AI_GLOBAL_DAILY_LIMIT`，以及
`AI_ALLOWED_ORIGINS=https://appassets.androidplatform.net,https://axv0805-beep.github.io,https://word.xiaoxin8.com,http://127.0.0.1:*,http://localhost:*`。

> **`AI_ENCRYPTION_KEY` 必须另行备份。** 丢了它，已保存的厂商密钥全部无法解密，只能重新录入。不要重新生成。

## 管理员

公网部署时网页初始化接口永远关闭（`setupAllowed:false`），管理员只能在服务器上创建：

```bash
cd /opt/word-master
runuser -u wordmaster -- node --env-file=/etc/word-master/env server/admin.mjs create-admin <用户名>
runuser -u wordmaster -- node --env-file=/etc/word-master/env server/admin.mjs reset-password <用户名>   # 同时注销其登录
runuser -u wordmaster -- node --env-file=/etc/word-master/env server/admin.mjs list-users
```

密码在终端里无回显输入。之后在 App「设置 → AI 账号」登录，进入「接口与用户管理」添加厂商接口、获取模型、测试、开放模型，并为学习者开通账号与每日次数。

## 更新后台代码

```bash
# 本机（仓库根目录）
tar -cf wm-server.tar server/app.mjs server/config.mjs server/index.mjs server/admin.mjs server/providers.mjs server/tasks.mjs
scp wm-server.tar root@108.187.15.183:/tmp/
# 服务器
tar -xf /tmp/wm-server.tar -C /opt/word-master && rm /tmp/wm-server.tar && systemctl restart word-master-ai
curl -s https://word.xiaoxin8.com/api/health
```

重启会把进行中的生成标为失败（不自动重试，避免重复计费），尽量在空闲时更新。

## 备份

停服后整体复制 `/var/lib/word-master/`，或在线执行 `sqlite3 /var/lib/word-master/word-master.sqlite ".backup /root/wm-$(date +%F).sqlite"`；同时备份 `/etc/word-master/env`。

## 发版

CI「打包安卓 APK 并发布更新」用仓库 Secrets 里的原签名构建，并核对证书 SHA-256 为 `9b95f93d…eaf`（与 1.1.20/1.2.0 一致，才能覆盖安装）。取消勾选 `publish` 只生成签名测试包（在 Actions 产物里下载），先在真机验证 AI 全流程，再勾选 `publish` 正式发布。
