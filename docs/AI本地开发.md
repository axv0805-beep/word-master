# AI 本地版本

本次在 1.1.13 上增加统一的多厂商 AI 服务与学习界面，现已合并作者至 1.1.20（030e49a）的更新，包含扩充听力题库、听力错题、离线写作题库及批改、TTS 音色和 Release 更新流程。原有背词、听力、离线写作和本地存档继续可独立运行；AI 生成需要后台和已配置的模型服务。

离线写作使用 `/learn/writing/:level`，AI 写作使用 `/learn/ai/writing/:level`。学习页分别提供入口，离线写作分类页也可进入 AI 写作；双方存档字段均保留并参与导入导出。仓库内作者发布的 APK 不包含本地 AI 改动，安装合并版仍需重新打包。

## 启动

后端需要 **Node.js 24+**（使用内置 `node:sqlite`，不额外安装数据库）。首次安装沿用项目锁文件：`pnpm install --frozen-lockfile`，建议使用与 CI 相同的 pnpm 9。

```powershell
npm run local
```

打开 `http://127.0.0.1:5173`。完成原有学习计划引导后，进入 **设置 → AI 账号与服务**，首次在本机创建管理员。

也可先 `npm run build`，再 `npm run server`，由后台直接提供构建产物，打开 `http://127.0.0.1:3180`。同源访问不需要额外配置 CORS。

## 管理员配置模型

1. 进入 **AI 账号 → 接口与用户管理**。
2. 选择 DeepSeek、OpenAI、通义千问、Kimi、智谱、硅基流动、Claude、Gemini 或自定义接口。
3. 填写名称、协议、API Base URL、API Key，先保存为未开放。
4. 点击“获取模型列表”，搜索并点击需要的模型；也可以直接填写模型 ID，一行一个。
5. 点击“测试连接”。测试发起一次短 JSON 生成，可能产生厂商费用。
6. 勾选“向用户开放”，再次保存。普通用户只能看到这些开放模型。
7. 在页面下方创建学习账号及每日使用次数。

密钥只在管理员保存时发送到本应用后台，接口响应只包含 `hasKey`。编辑时密钥留空表示保留；修改地址或协议必须重新输入密钥，避免旧密钥被发送到另一个服务。

模型列表与调用权限不是一回事。列表查询失败时可以手动添加，例如某些服务使用自定义推理接入点 ID。预设地址可编辑，地区、业务空间或厂商政策变化时应使用对应账号的地址。

### 支持的协议

| 协议 | 生成接口 | 模型查询 |
| --- | --- | --- |
| OpenAI 兼容 | `POST {base}/chat/completions` | `GET {base}/models` |
| OpenAI Responses | `POST {base}/responses` | `GET {base}/models` |
| Anthropic Messages | `POST {base}/messages` | `GET {base}/models`，支持分页 |
| Google Gemini | `POST {base}/models/{model}:generateContent` | `GET {base}/models`，分页并过滤文本生成能力 |

Base URL 应保留厂商要求的 `/v1`、`/v4` 等路径前缀。误填常见完整生成地址时会移除尾部端点；不自动猜测或增加 `/v1`。

OpenAI 兼容模式可选择 `max_tokens` 或 `max_completion_tokens`，并可选启用 JSON mode。不支持上述协议的任意私有 API 仍需单独增加适配器。不同模型的参数、JSON 能力及地区权限必须通过真实账号验证。

## 学习功能

- **写作**：四级／六级入口，原创主题或自填题目，30分钟练习计时，字数统计，自动存草稿；AI 返回总体评价、优点、逐句修改理由、改进建议与范文。无官方评分承诺。修改后可再次提交，历次批改保存到账号。
- **联想**：词义、场景记忆技巧、关联词区别；明确联想不等于真实词源。
- **例句**：分级英文例句、中文翻译、搭配说明；复用系统朗读。
- **出题**：手动输入逗号分隔的目标词，或从错题本选取最多10个词，生成5道语境选择题，答后显示解析，可重新练习。
- **入口**：学习页有四项入口；背词答题反馈卡下方可携带当前单词进入 AI；生成记录位于学习页。

本地写作草稿按账号 ID + 级别保存，包含在现有 JSON 备份中；账号登录会话和厂商密钥不进入备份。计时在页面关闭后继续，暂停须手动操作。当前每个账号每个级别保留一份可编辑草稿，历史提交在服务端分别保存。

AI 生成记录独立于原有背词统计，不会把作文或 AI 题目计入“已掌握词数”。首版 AI 练习选项作答状态是当前页面状态，重新打开记录可重新练习；尚未纳入永久错题追踪。生成历史需联网读取，目前没有批改结果的离线缓存。

## 本地数据与配置

默认只监听 `127.0.0.1:3180`。首次本地运行自动生成 `server/data/encryption.key`；数据库为 `server/data/word-master.sqlite`，均已忽略提交。

| 环境变量 | 默认值 / 用途 |
| --- | --- |
| `AI_HOST` | `127.0.0.1` |
| `AI_PORT` | `3180` |
| `AI_DATA_DIR` | `server/data` |
| `AI_ENCRYPTION_KEY` | 64位十六进制字符串；本地未配置时生成文件，非本地运行必须显式配置 |
| `AI_ALLOWED_ORIGINS` | 本机 3180、5173 的 localhost 与 127.0.0.1 来源；自定义时用逗号分隔 |
| `AI_ALLOW_PRIVATE_ENDPOINTS` | `false`；开发时设为 `true` 可连接本机或内网模型服务 |
| `AI_GLOBAL_DAILY_LIMIT` | `1000`，整个服务每日成功及进行中请求上限 |
| `AI_TRUST_PROXY` | `false`；放在 Caddy/nginx 后面时设为 `true`：按 `X-Forwarded-For` 限流，并彻底关闭网页初始化管理员（改用 `server/admin.mjs`） |
| `VITE_AI_API_BASE_URL` | 构建时值。开发服务器为空（走 Vite 代理）；生产构建读取仓库里的 `.env.production`（统一后台 `https://word.xiaoxin8.com`）。只能填本应用后台根地址，不能填模型厂商地址或密钥 |

`AI_ALLOWED_ORIGINS` 支持 `http://127.0.0.1:*` 这种只放开端口的写法，用于桌面版（静态服务每次随机端口）。线上部署见 `docs/AI后台部署.md`。

退出后台进程后再备份整个数据目录，数据库和加密密钥需要同时保留。启动代码不会自动读取 `.env`，可使用 PowerShell 环境变量或 `node --env-file=<文件> server/index.mjs` 注入。

当前是单进程本地版本，SQLite 同步预留额度；不支持多实例共用数据库。公开部署前需配置 HTTPS、允许的来源、管理员初始化流程、服务器数据备份与密码找回机制。当前普通账号由管理员创建，没有公开注册、找回密码或支付系统。后续多人部署可迁移 PostgreSQL。

### 额度及失败处理

按 UTC 日期计次；成功生成扣1次，进行中预留1次，失败释放。每个用户同时最多1个生成任务，全服务最多4个。请求编号按用户唯一，同一编号重复提交返回原记录，不重复调用。

应用次数与厂商账单不同：超时、校验失败或服务重启时，厂商可能已产生费用。服务器重启将未完成任务标为失败，不自动重试造成重复收费。管理员短连接测试不占学习次数，但受请求频率限制。

结果先做结构校验：四选项不重复、答案索引有效、考查词来自输入、批改原句必须出现在原文。此检查不能证明语义或教学内容正确，正式推广前仍需使用真实模型做题目及批改质量评测。

## 验证

```powershell
npm run verify       # 词书、TypeScript、前端测试、构建
npm run test:server  # 本地模拟上游：鉴权、密钥、额度、协议适配、隔离
npm run verify:ai    # 后端测试 + Chrome/Edge 中完整的 AI 操作链路（先 build）
npm run verify:ui    # 原有浏览器验收
```

AI 浏览器验收使用内存数据库和随机临时凭证，启动本地模拟模型，不访问付费模型，不写入真实管理员或接口配置；截图输出到 `output/playwright/`。通过只能证明应用链路及协议契约，不代表真实厂商调用已验证。真实配置需由管理员输入有效密钥再测试。

## 代码位置

- `server/providers.mjs`：厂商预设、协议适配、模型发现、请求超时及地址限制。
- `server/app.mjs`：账号、配置、额度、生成记录与 HTTP API。
- `server/tasks.mjs`：四项任务的输入、提示词与结果校验。
- `src/pages/Ai*.tsx`：账号、管理、学习与生成历史。
- `src/core/ai.ts`：前端服务请求与类型；`src/core/aiWriting.ts`：AI 草稿与计时；`src/core/writing.ts` 保留作者的离线写作类型。

接入依据：[DeepSeek](https://api-docs.deepseek.com/)、[OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs)、[Claude](https://platform.claude.com/docs/en/api/messages)、[Gemini](https://ai.google.dev/api/generate-content)、[阿里云 Base URL](https://www.alibabacloud.com/help/zh/model-studio/base-url)。
