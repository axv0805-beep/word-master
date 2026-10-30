# Claude Code 开发交接：词芽 / word-master

交接核对日期：2026-10-30（北京时间）。本文件是给接手开发者的任务说明；本轮仅检查状态并生成交接文件，没有修复程序、启动服务、改发布配置或重新发布。

## 用户意图与优先任务

用户要求交给 Claude Code 继续开发，优先解决“下载安装后提示本地服务未启动”的问题。不要只修改提示文案，也不要让普通手机用户运行 npm。最终目标是面向其他用户，由统一后台提供 AI，管理员管理厂商密钥、模型及用户额度。

已确认需求：DeepSeek 及常用厂商预设、自定义接口地址及协议、自动获取模型列表、手动添加模型；AI 写作批改、联想、例句、出题。保持已完成的 App 主题选择面板和离线学习功能。

## 仓库与当前版本（必须先读）

- 工作目录：`F:\Claude\word-master`，不要误用 `F:\Claude\wordsteps-android` 或另一份 `F:\work\word-master`。
- GitHub：`https://github.com/axv0805-beep/word-master`，当前登录的 GitHub CLI 账号此前确认有 WRITE 权限，用户是协作者。
- 本地 main：`a7340cd7e1431fa4e1310fa0318715e644538825`，已推送的 v1.2.0 发布准备提交。
- 本轮只执行 fetch，远程 main 已到 `b21c7680e2ac14c8043ff83b7ace0dc5f034840c`（修复 gh 发布已有 Release/草稿时的重复及 latest 资产问题）；**本地工作代码没有拉取或合并这些后续提交**。先检查工作区，再同步远程，不要覆盖本交接文件或用户其他修改。
- 本地落后3个提交：`a1347e3`（协作者发版文档与CI发布Release）、`4809f54`（作者本机签名构建1.2.0 APK）、`b21c768`（已有Release处理修复）。v1.2.0 tag 实际指向 `4809f54b7367cf140699e3532df66dfff57e1424`。
- 关键已完成提交：`aa7e017`（AI 与主题控件）、`4cbf0f6`（合并作者1.1.18）、`d650ae8`（合并作者1.1.20并验证双写作流程）、`a7340cd`（准备1.2.0）。
- 本地备份分支 `backup/ai-before-author-v1.1.18` 保留 AI 原始实现；`integrate/author-v1.1.18` 保留合并过程。不要当作当前最新代码。
- GitHub 当前 **v1.2.0 已正式发布，isDraft=false，且为 Latest**，发布时间 2026-10-26T03:57:46Z。资源有 `cimiao-1.2.0.apk` 与 `version.json`。这覆盖了旧文档中“仍是草稿”的状态，不能再盲目创建同名 Release。
- Release 页面：`https://github.com/axv0805-beep/word-master/releases/tag/v1.2.0`。
- 本轮核对的 APK 资源大小 3,139,139 字节，GitHub 返回文件 SHA-256：`5e26da0e7249cafae69ea82f995b14f47608632d947294b64fe5bd15daf7d5ce`。这是文件摘要，不是签名证书指纹。
- Release 正文仍包含过时的“草稿、等待签名”段落，后续应根据真实验证结果修正文案。本轮没有下载或运行该 APK，未确认用户手机实际安装的文件就是该资产。

## 已完成的功能与代码地图

前端 React 18 + TypeScript + Vite 5 + Tailwind 3 + Zustand + HashRouter。保留 PWA、Electron 壳、Android WebView 壳。

| 内容 | 文件/目录 |
| --- | --- |
| AI 账号/管理员/学习/历史 | `src/pages/AiAccount.tsx`、`AiAdmin.tsx`、`AiWorkspace.tsx`、`AiHistory.tsx` |
| API 地址、鉴权请求、超时、提示 | `src/core/ai.ts` |
| AI 内容展示、选择面板 | `src/components/AiResult.tsx`、`src/components/ui/AppSelect.tsx` |
| 路由与入口 | `src/App.tsx`、`src/pages/Learn.tsx`、`Settings.tsx`、`Writing.tsx` |
| AI 草稿、计时 | `src/core/aiWriting.ts`，通过 `src/store/appStore.ts` 持久化及备份 |
| 作者离线写作 | `src/core/writing.ts`、`writingGrader.ts`、`src/data/writing/`、`WritingSession.tsx`、`WritingModel.tsx` |
| 听力题库/错题/音色 | `src/data/listening/`、`ListeningSession.tsx`、`Mistakes.tsx`、`src/core/speech.ts` |
| 服务启动及配置 | `server/index.mjs` |
| HTTP、账号、SQLite、额度与历史 | `server/app.mjs` |
| 四种厂商协议/模型发现 | `server/providers.mjs` |
| 提示词、请求与结果校验 | `server/tasks.mjs` |
| 发版与更新 | `scripts/android-release.mjs`、`build-android.mjs`、`publish-release.mjs`、`src/core/native.ts` |

路由必须保留两套：

- 作者离线写作：`/learn/writing/:level`、`/learn/writing/:level/:mode`、范文子路由。
- AI 写作：`/learn/ai/writing/:level`；其他 `/learn/ai/:feature`；历史 `/learn/ai/history`。
- 管理：`/settings/ai` 和 `/settings/ai/admin`。

不要再次把两套 `writing.ts` 或写作路由合到同名覆盖。作者的 `listeningDrawn/listeningMistakes/writingDrawn/writingRecords` 与我们的 `writingDrafts` 已共同保存在 store、reset、备份导入导出中。

## “本地服务未启动”的代码证据与待验证结论

### 已核对的证据

1. `src/core/ai.ts`：`API_BASE = (import.meta.env.VITE_AI_API_BASE_URL || '').replace(/\/$/, '')`，请求 `${API_BASE}/api${route}`。变量未设置时退到同源 `/api`。
2. 同一文件把 **JSON 解析失败**也提示为“AI 服务未启动或地址配置不正确”。404 HTML、静态首页、代理错误页都可能触发，不等于已经证明服务器进程停止。网络失败走另一个“无法连接 AI 后台”分支。
3. Android `MainActivity.java` 使用 `https://appassets.androidplatform.net/assets/www/index.html`，资源映射只配置 `/assets/`。默认的 `/api/health` 于是指向 `https://appassets.androidplatform.net/api/health`，不是业务后台。
4. Vite 的 `/api → http://127.0.0.1:3180` 代理只在开发服务器有效；生产静态构建、GitHub Pages、Android 不会带上该代理。
5. `server/index.mjs` 默认监听 `127.0.0.1:3180`。电脑的 localhost 和手机的 localhost 是不同设备，手机安装 APK 不会启动电脑里的 Node 进程。
6. 本轮检查电脑 3180 端口没有发现监听；这只能解释电脑本地访问状态，不能替代手机请求诊断。没有启动它，因为用户要求交由 Claude Code 解决。
7. `electron/main.cjs` 只启动静态文件服务，缺失路径会回退 index.html；若用户实际安装的是桌面版，默认 `/api` 也可能返回 HTML 并触发同一提示。
8. 当前 Android CI 构建 web 步骤没有注入 `VITE_AI_API_BASE_URL`；本地打包是否设置环境变量尚未核验。`VITE_*` 是构建时值，发布后单改服务器环境变量不会改变既有 APK 的 JS。
9. 远程 a7340cd → b21c768 对 `src/core/ai.ts`、`server/index.mjs` 没有差异。Android workflow 新增了 GitHub Release 发布步骤，但仍未在 web 构建阶段注入 AI 后台地址；新发版提交不代表已完成后台部署。

### 结论边界

目前强烈指向“发布客户端未连接到可访问的统一 AI 后台”，而非厂商模型生成本身失败。本轮未连接用户手机、未抓取 WebView 请求、未拆查发布 APK 的构建值，不能宣称已精确定位用户安装包。先确认安装版本、来源和实际失败请求 URL、状态码、响应类型。

## Claude Code 建议执行顺序

1. `git status`、`git fetch origin`，检查本地与远程差异，安全同步到作者最新代码。核对最新 Release、tag 所指提交、APK版本、摘要和签名，不要继续依赖旧“草稿”说明。
2. 复现安装包问题。优先通过 Android WebView 调试/日志观察 `/api/health`，记录地址、HTTP状态、Content-Type、错误响应摘要（不输出令牌/作文/密钥）。确认是否缺少构建时后台地址、后端未部署、HTTPS/CORS/代理配置错误，或错误文案掩盖了真正的返回内容。
3. 保持“面向多人、统一后台”架构。向用户获取尚未决定的服务器/托管位置与域名；先完成不依赖部署信息的实现。不要自选收费服务，不要把模型 API Key 写进 Vite变量、APK、localStorage或前端。
4. 准备 Node.js 24+ 后台部署，稳定 HTTPS 地址、持久数据目录、明确的监听与反向代理设置。`VITE_AI_API_BASE_URL` 应填本应用后台根地址，**不能填 DeepSeek/OpenAI 的 Base URL**。
5. 配置真实来源：Android 通常为 `https://appassets.androidplatform.net`，Pages 为 `https://axv0805-beep.github.io`；以实际 Origin 为准。检查 POST 预检和 Authorization/Content-Type。不要把通配 CORS 当成鉴权替代。
6. 管理员初始化目前受双重限制：`allowSetup` 只有 loopback监听时启用，且请求必须来自本机。监听0.0.0.0后不能直接用手机首次创建管理员。设计或使用受控初始化流程，确认正确的数据目录与加密密钥，不能把公共注册改成“第一个人自动当管理员”。
7. 建立账号、配置厂商密钥、获取模型、测试真实请求并开放模型。模型列表成功不代表生成成功。记录四项任务的成功/失败路径及额度变化。
8. 改善移动端未配置/离线/服务故障的提示与引导，保持本地背词、听力、离线写作可用；不要要求普通用户“在手机运行 npm”。避免只改文案而不打通服务。
9. 构建时注入 HTTPS 后台地址，验证打包 JS 中的有效 API 根地址；安装真机，完成账号→模型→写作/联想/例句/出题→历史记录整条链路。
10. 使用原签名、递增 versionCode、同步 APP_VERSION/清单、验证可覆盖升级后再发布。发布版本号先查远程，v1.2.0 已被占用。按实际状态修正 Release说明。

## 本地服务和敏感数据

- `server/data/word-master.sqlite`、`-wal`、`-shm` 与 `encryption.key` 已存在，未检查其内容。目录已被 gitignore 忽略。
- 不要删除、覆盖或提交这些文件；不能随意生成新 encryption.key，否则已有厂商密钥无法解密。备份数据库时要正确处理 WAL，或停服后整体备份。
- 登录令牌存 sessionStorage。后台密码用 scrypt，厂商密钥 AES-256-GCM 加密，生成记录按用户隔离。
- 首版本地 SQLite 为单进程；需配置全站额度、限流、超时。失败释放应用次数不保证厂商账单为零。
- `.env` 不由 Node 启动脚本自动加载，需要显式 env 注入或 `node --env-file=...`；Vite 构建环境与后端运行环境是两回事。
- 原签名证书 SHA-256（此前验证1.1.20）：`9b95f93da79d22b5ff1fdc66d6fefabac50070eea1fc15fa3e9f4720dacc9eaf`。本机 `F:\Claude\.android\debug.keystore` 不兼容。用户此前明确选择等作者原签名后发布覆盖升级包。当前1.2.0已由后续操作发布，仍需重新验证其证书，不能据已发布就推断签名匹配。
- 作者新增的 `docs/协作者发版.md` 推荐将原签名保存为仓库 Secrets，由协作者触发 CI；优先核对该流程和当前 Secrets 是否齐全，不必默认要求作者再发送私钥文件。本轮未核验 Secrets 当前状态。新 CI 调用 `publish-release.mjs` 时未传 `--apk`，而本地脚本默认读取 `release/词芽-安卓.apk`；正式触发前检查是否已将 Gradle输出复制到该处，或应明确传入实际APK路径，避免沿用文档就直接宣称流水线可用。
- 打包脚本使用作者电脑硬编码 `D:\A-WWW\DS-harness` 路径，本机未有该目录。`build-android.mjs` 会删除暂存目录，运行前确认路径并适配工具链。不要误删其他项目。
- 可用工具曾核实：`F:\Claude\.tools\jdk-17`、`F:\Claude\.android-sdk\build-tools\36.0.0`、`F:\Claude\.tools\gradle-9.4.1`；项目AGP8.4.2原用Gradle8.7，不能直接假设9.4.1兼容。依赖/缓存优先放F盘。

## 验证与完成标准

上次合并后已有244个测试、后端测试、构建和浏览器验收通过；这是历史结果，本轮未重跑。模型验收使用模拟接口，没有证明真实厂商服务或生产APK的AI可用。

```powershell
cd F:\Claude\word-master
npm run verify
npm run test:server
npm run verify:ai
npm run verify:ui
```

`verify:ai` 需先构建，使用临时内存数据库与本地模拟上游，不会验证线上真实模型。截图位于 `output/playwright/`，原有截图在 `artifacts/`。

验收必须覆盖：

- 真机 APK 经移动网络可访问真实业务后台，无需开发电脑开机。
- 普通账号可登录，管理员可维护接口，用户仅能使用开放模型。
- 四项AI功能至少各一次真实成功请求；鉴权、超额、超时、未配置、无网络分别有准确提示。
- 用户数据隔离、密钥不进入前端、重复请求不重复生成、失败不误扣应用额度。
- 作者离线题库、错题、写作、本地记录及备份导入导出不回退。
- 旧 APK 覆盖安装新包时保留学习记录；发布资源、清单摘要、版本号和签名一致。

进一步参考 `docs/AI本地开发.md`、`docs/RELEASE-v1.2.0.md`、`docs/打包与安装.md`，以及远程新增的 `docs/协作者发版.md`；其中状态性描述须与本交接中的实时核查区分。下一步的重点是生产接入与发布验证，不是重写已完成的四项AI界面。

## 后续进展（2026-10-30，Claude Code）

以上为交接时的状态，以下为处理结果：

- 根因已确认：1.2.0 APK 的 JS 中后台地址为空（`G0=""`），请求落到 `https://appassets.androidplatform.net/api/health`，返回非 JSON，于是提示“AI 服务未启动”。
- 统一后台已上线：`https://word.xiaoxin8.com`（systemd `word-master-ai` + Caddy），部署、管理员命令、更新与备份见 `docs/AI后台部署.md`。
- 提交 `0e96646`：`.env.production` 固定后台地址并在打包时校验；反代部署下关闭网页初始化管理员，改用 `server/admin.mjs`；错误提示区分未配置/HTTP 异常/离线/无法连接；CI 修复 `--apk` 路径、核对签名证书、新增 `publish=false` 测试包模式。
- CI 签名测试包 1.2.1（versionCode 24）已构建，证书 SHA-256 `9b95f93d…eaf` 与原签名一致，内置后台地址已核对；尚未发布 Release。
- 待办：真机覆盖安装测试包，管理员录入厂商密钥、开放模型，完成写作/联想/例句/出题各一次真实请求后，再用 CI（勾选 `publish`）正式发布 1.2.1。
