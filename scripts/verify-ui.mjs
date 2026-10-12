/**
 * 真实浏览器 UI 校验（jsdom 无法覆盖的层：点击命中、滚动、遮挡）。
 *
 * 覆盖：
 *   1. 装饰背景层 .app-bg 必须是空元素，且不能包含应用内容
 *   2. 页面可以滚动（内容高度 > 视口高度时）
 *   3. 主要按钮中心点的命中元素就是按钮本身（没有被其它元素遮挡）
 *   4. 真实点击能触发生效（底部导航切页）
 *   5. 深色主题生效，且答题后出现对错反馈
 *   6. 问候语随冻结的时钟变化
 *   7. 首页「本轮单词数」档位为 10–30，且选择后真正决定这一轮的题目数
 *   8. 首次进入的学习计划引导：选词书 → 定每日目标 → 自动算出多少天背完
 *   各步骤截图输出到 artifacts/，便于人工过目
 *
 * 用法：
 *   node scripts/verify-ui.mjs                 # 自动启动预览服务（需先 build）
 *   node scripts/verify-ui.mjs <url>           # 校验一个已在运行的服务
 */
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ARTIFACTS = path.join(ROOT, 'artifacts')
const PORT = 5179

const BROWSERS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
]

const failures = []
const notes = []

function fail(message) {
  failures.push(message)
  console.log(`  x ${message}`)
}

function pass(message) {
  console.log(`  ok ${message}`)
}

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      /* 还没起来 */
    }
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  return false
}

let serverProcess = null
let baseUrl = process.argv[2]

if (!baseUrl) {
  const hasBuild = existsSync(path.join(ROOT, 'dist', 'index.html'))
  if (!hasBuild) {
    console.log('未找到 dist/index.html，请先执行 npm run build')
    process.exit(2)
  }
  console.log(`启动预览服务 http://localhost:${PORT}/ ...`)
  serverProcess = spawn(
    process.execPath,
    [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'ignore' }
  )
  baseUrl = `http://localhost:${PORT}/`
  const ready = await waitForServer(baseUrl)
  if (!ready) {
    console.error('预览服务启动失败')
    serverProcess.kill()
    process.exit(2)
  }
}

const browserPath = BROWSERS.find((item) => existsSync(item))
if (!browserPath) {
  console.error('没有找到本机 Chrome / Edge；请安装其中一个，或执行 npx playwright install chromium')
  serverProcess?.kill()
  process.exit(2)
}

const browser = await chromium.launch({ executablePath: browserPath, headless: true })
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 })

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`))

await fs.mkdir(ARTIFACTS, { recursive: true })

/** 检查某文字对应的控件是否可点中 */
async function checkClickable(text, { requireHit = true } = {}) {
  const result = await page.evaluate((label) => {
    const candidates = Array.from(document.querySelectorAll('button, a'))
    const target = candidates.find((el) => (el.textContent ?? '').trim().includes(label))
    if (!target) return { found: false }
    const rect = target.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const top = document.elementFromPoint(x, y)
    return {
      found: true,
      tag: target.tagName,
      topTag: top?.tagName ?? null,
      topIsTarget: top === target || target.contains(top),
      disabled: target.tagName === 'BUTTON' ? target.disabled : false
    }
  }, text)

  if (!result.found) {
    fail(`找不到控件「${text}」`)
    return false
  }
  if (result.disabled) {
    notes.push(`控件「${text}」当前为禁用状态（符合预期时可忽略）`)
    return false
  }
  if (requireHit && !result.topIsTarget) {
    fail(`控件「${text}」被遮挡：命中元素是 <${result.topTag}>，不是它自己`)
    return false
  }
  pass(`控件「${text}」可点中（命中 <${result.topTag}>）`)
  return true
}

/** 写入一份「引导已完成」的存档，让 1–7 步直接进入主应用 */
async function seedOnboarded() {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.setItem(
      'word-master-store',
      JSON.stringify({
        state: {
          settings: { onboarded: true, theme: 'dark' },
          progress: {},
          mistakes: {},
          daily: {},
          rounds: [],
          study: { alphaCursor: {}, lastLetter: {} },
          customBooks: []
        },
        version: 1
      })
    )
  })
}

console.log('\n[0/8] 准备：写入「引导已完成」的初始存档')
await page.clock.setFixedTime(new Date(2025, 5, 1, 10, 0, 0))
await seedOnboarded()
pass('已写入初始存档，后续步骤直接进入主应用')

console.log('\n[1/8] 检查装饰背景层结构')
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

const structure = await page.evaluate(() => {
  const bg = document.querySelector('.app-bg')
  const shell = document.querySelector('.phone-shell')
  return {
    hasBg: !!bg,
    bgChildCount: bg ? bg.children.length : -1,
    bgContainsApp: !!(bg && shell && bg.contains(shell)),
    bgPointerEvents: bg ? getComputedStyle(bg).pointerEvents : null,
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight
  }
})

if (!structure.hasBg) fail('没有找到 .app-bg 背景层')
else {
  if (structure.bgChildCount !== 0) fail(`.app-bg 必须是空元素，但含有 ${structure.bgChildCount} 个子元素`)
  else pass('.app-bg 是空元素')

  if (structure.bgContainsApp) fail('.app-bg 包住了应用内容（会导致整页点击被遮挡）')
  else pass('.app-bg 没有包住应用内容')

  if (structure.bgPointerEvents !== 'none') fail(`.app-bg 的 pointer-events 应为 none，实际是 ${structure.bgPointerEvents}`)
  else pass('.app-bg 已禁用指针事件')
}

console.log('\n[2/8] 检查页面滚动')
if (structure.scrollHeight <= structure.viewportHeight) {
  notes.push('首页内容没有超出一屏，无法验证滚动（可忽略）')
} else {
  const scrolled = await page.evaluate(() => {
    window.scrollTo(0, 400)
    return window.scrollY
  })
  if (scrolled > 0) pass(`页面可以滚动（scrollY=${scrolled}）`)
  else fail('页面无法滚动，内容被固定容器锁死')
  await page.evaluate(() => window.scrollTo(0, 0))
}

console.log('\n[3/8] 检查首页控件命中')
await checkClickable('开始学习')
await checkClickable('随机')
await checkClickable('切换')

await page.screenshot({ path: path.join(ARTIFACTS, 'ui-1-home.png') })

console.log('\n[4/8] 检查底部导航与真实点击')
for (const [label, file] of [
  ['词书', 'ui-2-books.png'],
  ['错题', 'ui-3-mistakes.png'],
  ['统计', 'ui-4-stats.png'],
  ['设置', 'ui-5-settings.png']
]) {
  const before = await page.evaluate(() => location.hash)
  try {
    await page.getByText(label, { exact: true }).click({ timeout: 5000 })
    await page.waitForTimeout(500)
    const after = await page.evaluate(() => location.hash)
    if (after === before) fail(`点击「${label}」后路由没有变化（仍为 ${after}）`)
    else pass(`点击「${label}」生效：${after || '#/'}`)
  } catch (err) {
    fail(`点击「${label}」失败：${String(err.message).split('\n')[0]}`)
  }
  await page.screenshot({ path: path.join(ARTIFACTS, file) })
}

console.log('\n[5/8] 检查开始答题流程（固定选择题型，保证可复现）')
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  const key = 'word-master-store'
  const parsed = JSON.parse(localStorage.getItem(key) ?? '{"state":{},"version":1}')
  parsed.state = parsed.state ?? {}
  parsed.state.settings = {
    ...(parsed.state.settings ?? {}),
    theme: 'dark',
    questionTypes: ['zh2en'],
    roundSize: 10,
    autoSpeak: false,
    onlineAudio: false,
    onboarded: true
  }
  localStorage.setItem(key, JSON.stringify(parsed))
})
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)

const darkTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'))
if (darkTheme) pass('深色主题已生效（html.dark）')
else fail('切换到深色主题失败')
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-9-dark-home.png') })

await checkClickable('开始学习')

try {
  await page.getByRole('button', { name: /开始学习|继续学习/ }).click({ timeout: 6000 })
  await page.waitForTimeout(1600)
  const inStudy = await page.evaluate(() => location.hash.includes('/study'))
  const hasQuestion = await page.evaluate(() => {
    const options = document.querySelectorAll('.option')
    const input = document.querySelector('input[placeholder="在这里拼写…"]')
    return options.length === 4 || !!input
  })
  if (inStudy && hasQuestion) pass('点击「开始学习」成功进入答题页并出题')
  else fail(`进入答题页失败（hash=${await page.evaluate(() => location.hash)}，题目渲染=${hasQuestion}）`)
} catch (err) {
  fail(`点击「开始学习」失败：${String(err.message).split('\n')[0]}`)
}
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-6-study.png') })

const answered = await page.evaluate(() => {
  const options = Array.from(document.querySelectorAll('.option'))
  if (options.length !== 4) return false
  options[0].click()
  return true
})
if (answered) {
  await page.waitForTimeout(1800)
  const feedbackText = await page.evaluate(() => document.body.innerText)
  const hasFeedback = feedbackText.includes('答对了') || feedbackText.includes('答错了')
  if (hasFeedback) pass('作答后出现对错反馈')
  else fail('作答后没有出现反馈')

  // 默认第一题是字母顺序第一个词 abandon：它没有词形变化，但必须有易混词 abundant
  if (feedbackText.includes('abandon')) {
    if (feedbackText.includes('易混词') && feedbackText.includes('abundant'))
      pass('第一题 abandon 的反馈里出现易混词 abundant')
    else fail('abandon 没有出现易混词（用户最早遇到的问题）')
  } else {
    notes.push(`本轮第一题不是 abandon（实测为其他词），跳过该项检查`)
  }
  await page.screenshot({ path: path.join(ARTIFACTS, 'ui-7-feedback.png') })
} else {
  notes.push('本轮第一题不是选择题，跳过选项反馈检查')
}

// 词形变化 / 易混词：把游标移到 create（四级词库里词形与易混词都齐全），作答后检查两张卡片
console.log('  -- 词形变化与易混词 --')
const TARGET_WORD = 'create'
const dictionary = await (await fetch(new URL('dicts/cet4.json', baseUrl))).json()
const orderedWords = dictionary.map((item) => item.w.toLowerCase()).sort()
const targetIndex = orderedWords.indexOf(TARGET_WORD)
if (targetIndex < 0) {
  fail(`词库里找不到 ${TARGET_WORD}，无法验证词形变化`)
} else {
  await page.evaluate(
    ({ index, word }) => {
      const key = 'word-master-store'
      const parsed = JSON.parse(localStorage.getItem(key) ?? '{"state":{},"version":1}')
      parsed.state = parsed.state ?? {}
      parsed.state.settings = {
        ...(parsed.state.settings ?? {}),
        theme: 'dark',
        questionTypes: ['zh2en'],
        roundSize: 5,
        autoSpeak: false,
        onlineAudio: false,
        onboarded: true
      }
      parsed.state.study = { ...(parsed.state.study ?? {}), alphaCursor: { cet4: index } }
      localStorage.setItem(key, JSON.stringify(parsed))
      void word
    },
    { index: targetIndex, word: TARGET_WORD }
  )

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: /开始学习|继续学习/ }).click({ timeout: 6000 })
  await page.waitForTimeout(2500)

  const promptText = await page.evaluate(() => document.body.innerText)
  if (promptText.includes('创造') || promptText.includes('引起'))
    pass(`本轮第一题就是 ${TARGET_WORD}`)
  else fail(`第一题不是 ${TARGET_WORD}，题干为「${promptText.slice(0, 60)}…」`)

  const clicked = await page.evaluate((word) => {
    const option = Array.from(document.querySelectorAll('.option')).find(
      (el) => (el.textContent ?? '').trim().toLowerCase() === word
    )
    if (!option) return false
    option.click()
    return true
  }, TARGET_WORD)
  if (!clicked) fail(`没有找到 ${TARGET_WORD} 选项`)

  await page.waitForTimeout(2500)
  const feedbackText = await page.evaluate(() => document.body.innerText)
  if (feedbackText.includes('答对了')) pass('选择正确答案后显示「答对了」')
  else fail('选择正确答案后没有显示答对')

  if (feedbackText.includes('词形变化') && feedbackText.includes('creative') && feedbackText.includes('creation'))
    pass('反馈里出现「词形变化」并列出 creative / creation')
  else fail('反馈里没有出现词形变化')

  const posLabels = ['名词', '动词', '形容词', '副词'].filter((label) => feedbackText.includes(label))
  if (posLabels.length > 0) pass(`词形按词性分组展示：${posLabels.join(' / ')}`)
  else fail('词形没有按词性分组')

  if (feedbackText.includes('易混词') && feedbackText.includes('creature'))
    pass('反馈里出现「易混词」并列出 creature')
  else fail('反馈里没有出现易混词')

  await page.screenshot({ path: path.join(ARTIFACTS, 'ui-21-word-insights.png') })
}

// 桌面宽度下检查居中的手机框
await page.setViewportSize({ width: 1280, height: 900 })
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-8-desktop.png') })
pass('已输出桌面宽度截图')

console.log('\n[6/8] 检查问候语随时间变化（冻结时钟）')
await page.setViewportSize({ width: 430, height: 932 })
const TIME_CASES = [
  { time: new Date(2025, 5, 1, 7, 0, 0), expect: '早上好', file: 'ui-10-greeting-morning.png' },
  { time: new Date(2025, 5, 1, 15, 30, 0), expect: '下午好', file: 'ui-11-greeting-afternoon.png' },
  { time: new Date(2025, 5, 1, 20, 0, 0), expect: '晚上好', file: 'ui-12-greeting-night.png' }
]
for (const item of TIME_CASES) {
  await page.clock.setFixedTime(item.time)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const heading = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '')
  if (heading.startsWith(item.expect)) pass(`${item.time.getHours()}:00 显示「${heading}」`)
  else fail(`${item.time.getHours()}:00 问候语应为「${item.expect}...」，实际是「${heading}」`)
  await page.screenshot({ path: path.join(ARTIFACTS, item.file) })
}

console.log('\n[7/8] 检查首页「本轮单词数」选择（10-30）')
await page.clock.setFixedTime(new Date(2025, 5, 1, 10, 0, 0))
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)

const PRESETS = ['本轮 10 个单词', '本轮 15 个单词', '本轮 20 个单词', '本轮 25 个单词', '本轮 30 个单词']
const presets = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[aria-label^="本轮 "]')).map((el) => el.getAttribute('aria-label'))
)
if (JSON.stringify(presets) === JSON.stringify(PRESETS)) pass(`首页可选档位 ${presets.length} 个：10 / 15 / 20 / 25 / 30`)
else fail(`首页档位不正确：${JSON.stringify(presets)}`)

const outOfRange = await page.evaluate(
  () => ['本轮 5 个单词', '本轮 35 个单词'].filter((label) => document.querySelector(`[aria-label="${label}"]`)).length
)
if (outOfRange === 0) pass('不存在越界档位（5 / 35）')
else fail('首页出现了 10-30 之外的档位')

await page.getByRole('button', { name: '本轮 30 个单词' }).click({ timeout: 5000 })
await page.waitForTimeout(300)
const storedRoundSize = await page.evaluate(() => {
  const raw = localStorage.getItem('word-master-store')
  return raw ? JSON.parse(raw)?.state?.settings?.roundSize : null
})
if (storedRoundSize === 30) pass('点击「30」后已写入本地存储（roundSize=30）')
else fail(`roundSize 未生效，当前为 ${storedRoundSize}`)
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-13-round-size.png') })

await page.getByRole('button', { name: /开始学习|继续学习/ }).click({ timeout: 6000 })
await page.waitForTimeout(1600)
const header = await page.evaluate(() => document.body.innerText.match(/按字母顺序 · \d+\/\d+ 题/)?.[0] ?? '')
if (header.includes('0/30')) pass(`本轮题目数跟随首页选择：${header}`)
else fail(`本轮题目数不是 30，实际为「${header}」`)
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-14-round-30-study.png') })

// 把每日目标调小到 20，每轮的档位与已选值都应跟着收缩
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  const key = 'word-master-store'
  const parsed = JSON.parse(localStorage.getItem(key) ?? '{"state":{},"version":1}')
  parsed.state = parsed.state ?? {}
  parsed.state.settings = { ...(parsed.state.settings ?? {}), dailyGoal: 20, roundSize: 30, onboarded: true }
  localStorage.setItem(key, JSON.stringify(parsed))
})
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)

const goalBoundPresets = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[aria-label^="本轮 "]')).map((el) => el.getAttribute('aria-label'))
)
if (JSON.stringify(goalBoundPresets) === JSON.stringify(['本轮 10 个单词', '本轮 15 个单词', '本轮 20 个单词']))
  pass(`每日目标 20 时可选档位收缩为：${goalBoundPresets.length} 个（10 / 15 / 20）`)
else fail(`每日目标 20 时档位不正确：${JSON.stringify(goalBoundPresets)}`)

const clampedRound = await page.evaluate(() => {
  const raw = localStorage.getItem('word-master-store')
  const el = document.querySelector('[aria-pressed="true"][aria-label^="本轮 "]')
  return { roundSize: raw ? JSON.parse(raw)?.state?.settings?.roundSize : null, pressed: el?.getAttribute('aria-label') }
})
if (clampedRound.roundSize === 20 && clampedRound.pressed === '本轮 20 个单词')
  pass(`原先选的 30 被自动夹到 20，并保持高亮`)
else fail(`每轮单词数没有随目标收缩：${JSON.stringify(clampedRound)}`)
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-20-round-bound-by-goal.png') })

console.log('\n[8/8] 检查首次进入的学习计划引导')
// 清空存档 = 全新安装
await page.evaluate(() => localStorage.clear())
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const headingOf = () => page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '')
const step1 = await headingOf()
if (step1.includes('选择要背的词书')) pass('全新进入时先显示引导：选择要背的词书')
else fail(`全新进入没有显示引导，实际标题为「${step1}」`)
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-15-onboarding-book.png') })

// 选六级 → 下一步
await page.getByRole('button', { name: /六级/ }).click({ timeout: 5000 })
await page.getByRole('button', { name: '下一步' }).click({ timeout: 5000 })
await page.waitForTimeout(500)
const step2 = await headingOf()
if (step2.includes('设定每天的目标')) pass('第二步：设定每日目标')
else fail(`第二步标题不对：「${step2}」`)

await page.getByRole('button', { name: '20 词/天' }).click({ timeout: 5000 })
await page.waitForTimeout(300)
const liveHint = await page.evaluate(() => document.body.innerText)
if (liveHint.includes('以每天') && liveHint.includes('背完')) pass('第二步实时给出「多少天背完」的预估')
else fail('第二步没有实时预估文案')

// 每轮单词数的档位必须跟着每日目标变化
const goalBoundInOnboarding = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[aria-label^="本轮 "]')).map((el) => el.getAttribute('aria-label'))
)
if (JSON.stringify(goalBoundInOnboarding) === JSON.stringify(['本轮 10 个单词', '本轮 15 个单词', '本轮 20 个单词']))
  pass(`第二步选了 20 词/天后，每轮档位变为：${goalBoundInOnboarding.length} 个（10 / 15 / 20）`)
else fail(`引导里每轮档位没有随目标变化：${JSON.stringify(goalBoundInOnboarding)}`)

if (liveHint.includes('最高不超过每天的目标（20）')) pass('界面明确提示「最高不超过每天的目标（20）」')
else fail('引导里没有说明每轮上限与每日目标的关系')

await page.getByRole('button', { name: '本轮 15 个单词' }).click({ timeout: 5000 })
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-16-onboarding-goal.png') })

// 第三步：自动算出总天数
await page.getByRole('button', { name: '下一步' }).click({ timeout: 5000 })
await page.waitForTimeout(500)
const step3 = await headingOf()
const planText = await page.evaluate(() => document.body.innerText)
if (step3.includes('你的学习计划')) pass('第三步：展示学习计划')
else fail(`第三步标题不对：「${step3}」`)
// 六级 2345 词 ÷ 每天 20 词 = 117.25 → 118 天
if (planText.includes('天背完') && planText.includes('118') && planText.includes('2345'))
  pass('自动算出「118 天背完」（六级 2345 词 ÷ 20 词/天）')
else fail('学习计划的预计天数不正确')
if (planText.includes('每轮 15 词')) pass('计划里带上所选的每轮单词数（每轮 15 词）')
else fail('计划里没有体现每轮单词数')
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-17-onboarding-plan.png') })

// 开始第一轮 → 应直接进入答题页
await page.getByRole('button', { name: '开始第一轮' }).click({ timeout: 6000 })
await page.waitForTimeout(2200)
const inStudyAfterOnboarding = await page.evaluate(() => location.hash.includes('/study'))
if (inStudyAfterOnboarding) pass('点「开始第一轮」直接进入答题页')
else fail(`点「开始第一轮」没有进入答题页（hash=${await page.evaluate(() => location.hash)}）`)
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-18-onboarding-first-round.png') })

// 计划已写入存档，且首页会显示剩余天数
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
const saved = await page.evaluate(() => {
  const raw = localStorage.getItem('word-master-store')
  const settings = raw ? JSON.parse(raw)?.state?.settings : null
  return {
    onboarded: settings?.onboarded,
    bookId: settings?.bookId,
    dailyGoal: settings?.dailyGoal,
    roundSize: settings?.roundSize
  }
})
if (saved.onboarded === true && saved.bookId === 'cet6' && saved.dailyGoal === 20 && saved.roundSize === 15)
  pass(`引导结果已保存：${saved.bookId} / 每天 ${saved.dailyGoal} 词 / 每轮 ${saved.roundSize} 词`)
else fail(`引导结果未正确保存：${JSON.stringify(saved)}`)

const homeText = await page.evaluate(() => document.body.innerText)
if (homeText.includes('预计还需') && homeText.includes('118 天')) pass('首页显示「预计还需 118 天背完」')
else fail('首页没有显示预计天数')
await page.screenshot({ path: path.join(ARTIFACTS, 'ui-19-home-plan.png') })

await browser.close()
serverProcess?.kill()
await new Promise((resolve) => setTimeout(resolve, 300))

console.log('\n=== 控制台错误 ===')
if (consoleErrors.length) {
  for (const item of consoleErrors) console.log(`  ! ${item}`)
  fail(`浏览器控制台有 ${consoleErrors.length} 条错误`)
} else {
  pass('浏览器控制台无错误')
}

console.log(`\n截图已输出到 ${path.relative(ROOT, ARTIFACTS)}/`)
if (notes.length) {
  console.log('\n提示：')
  for (const item of notes) console.log(`  · ${item}`)
}

if (failures.length) {
  console.error(`\nUI 校验失败，共 ${failures.length} 项问题`)
  process.exit(1)
}
console.log('\nUI 校验全部通过')
process.exit(0)
