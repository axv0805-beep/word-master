// End-to-end contract verification with a local mock upstream. No paid API calls or real credentials.
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { mkdir, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createApp } from '../server/app.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = path.join(root, 'output', 'playwright')
await mkdir(out, { recursive: true })
const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].filter(Boolean)
let executablePath
for (const candidate of candidates) { try { await access(candidate); executablePath = candidate; break } catch {} }
if (!executablePath) throw new Error('No installed Chrome/Edge found. Set CHROME_PATH.')
async function listen(server) { await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); return `http://127.0.0.1:${server.address().port}` }
const upstream = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.url === '/v1/models') return res.end(JSON.stringify({ data: [{ id: 'local-test-model' }] }))
  let raw = ''; for await (const chunk of req) raw += chunk
  const body = JSON.parse(raw)
  const instructions = body.messages[0].content
  const input = JSON.parse(body.messages[1].content)
  let result
  if (input.task === 'connection test') result = { ok: true }
  else if (input.essay) result = { summary: '观点清楚，可以补充一个具体的阅读经历。', strengths: ['主题明确'], suggestions: ['用一个实例支持观点'], corrections: [], modelEssay: 'Reading helps us understand different ways of life. A short daily reading habit can bring lasting benefits.' }
  else if (instructions.includes('questions')) result = { questions: Array.from({ length: 5 }, (_, i) => ({ stem: `${i + 1}. Reading can ___ everyone.`, options: ['benefit', 'forget', 'lose', 'cancel'], answer: 0, explanation: 'benefit 表示使受益。', word: 'benefit' })) }
  else if (instructions.includes('memoryTip')) result = { word: 'benefit', meaning: '好处；使受益', memoryTip: '想象一本书给你带来收获。这是一种记忆联想。', connections: [{ word: 'advantage', meaning: '优势', difference: 'advantage 更强调相对优势。' }] }
  else result = { word: 'benefit', examples: [{ sentence: 'Reading can benefit everyone.', translation: '阅读能让每个人受益。', usage: 'benefit 在这里作及物动词。' }] }
  res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }], usage: { total_tokens: 100 } }))
})
const upstreamUrl = await listen(upstream)
const origins = []
const app = createApp({ encryptionKey: randomBytes(32).toString('hex'), allowPrivate: true, allowSetup: true, staticDir: path.join(root, 'dist'), origins })
const base = await listen(app.server); origins.push(base)
let browser
try {
  browser = await chromium.launch({ executablePath, headless: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  page.on('response', async (response) => { if (response.url().endsWith('/api/generations') && response.request().method() === 'POST' && response.status() !== 200) console.log('Generation error:', response.status(), await response.text()) })
  const errors = []; page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(base)
  await page.evaluate(() => localStorage.setItem('word-master-store', JSON.stringify({ version: 1, state: { settings: { onboarded: true, autoSpeak: false } } })))
  await page.goto(base + '/#/settings/ai'); await page.reload()
  await page.getByRole('heading', { name: '创建本机管理员' }).waitFor()
  await page.getByLabel('用户名', { exact: true }).fill('local-admin')
  await page.getByLabel('密码', { exact: true }).fill(randomBytes(24).toString('hex'))
  await page.getByRole('button', { name: '创建管理员', exact: true }).click()
  await page.getByRole('link', { name: '接口与用户管理' }).click()
  await page.getByRole('combobox', { name: '厂商预设' }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('dialog').evaluate(async (element) => { await Promise.all(element.getAnimations().map((a) => a.finished)) })
  await page.screenshot({ path: path.join(out, 'ai-provider-picker.png') })
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  await page.screenshot({ path: path.join(out, 'ai-provider-picker-dark-desktop.png') })
  const pickerBox = await page.getByRole('dialog').boundingBox()
  assert.ok(pickerBox && pickerBox.x > 200 && pickerBox.y > 0 && pickerBox.y + pickerBox.height <= 800)
  await page.getByRole('textbox', { name: '搜索厂商预设' }).fill('no-such-provider')
  await page.getByText('没有匹配的选项，试试其他关键词。').waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('combobox', { name: '厂商预设' }).evaluate((el) => el === document.activeElement), true)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'forest'))
  await page.getByRole('combobox', { name: '厂商预设' }).click()
  await page.getByRole('textbox', { name: '搜索厂商预设' }).fill('DeepSeek')
  await page.getByRole('option', { name: /DeepSeek/ }).click()
  await page.getByLabel('接口名称').fill('本地测试接口')
  await page.getByLabel('API Base URL').fill(upstreamUrl + '/v1')
  await page.getByLabel('API Key').fill(randomBytes(24).toString('hex'))
  await page.getByRole('button', { name: '保存配置', exact: true }).click()
  await page.getByRole('button', { name: '获取模型列表', exact: true }).click()
  await page.getByRole('button', { name: 'local-test-model 添加' }).click()
  await page.getByLabel('向用户开放此接口中的模型').check()
  await page.getByRole('button', { name: '保存配置', exact: true }).click()
  await page.getByRole('button', { name: '测试连接', exact: true }).click()
  await page.getByText('连接与 JSON 输出测试通过。', { exact: true }).waitFor()
  await page.screenshot({ path: path.join(out, 'ai-admin.png'), fullPage: true })
  console.log('PASS: administrator setup, provider save, model discovery, publish and connection test')

  await page.goto(base + '/#/learn')
  await page.getByRole('button', { name: /四级写作/ }).click()
  await page.getByRole('combobox', { name: '学习级别' }).click()
  await page.getByRole('dialog').evaluate(async (element) => { await Promise.all(element.getAnimations().map((a) => a.finished)) })
  await page.screenshot({ path: path.join(out, 'ai-level-picker.png') })
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  assert.equal(await page.getByRole('combobox', { name: '学习级别' }).innerText(), '六级')
  await page.getByRole('combobox', { name: '学习级别' }).click()
  await page.getByRole('option', { name: /四级/ }).click()
  await page.getByRole('combobox', { name: '练习主题' }).click()
  await page.getByRole('option').first().click()
  await page.getByLabel('你的作文').fill('Reading every day helps me understand the world. I enjoy learning about new places and sharing ideas with my friends.')
  await page.getByRole('button', { name: '开始计时' }).click()
  await page.reload()
  await page.getByRole('button', { name: '暂停计时' }).waitFor()
  await page.locator('#boot-splash').waitFor({ state: 'detached' })
  assert.match(await page.getByLabel('你的作文').inputValue(), /Reading every day/)
  await page.screenshot({ path: path.join(out, 'ai-writing.png'), fullPage: true })
  await page.getByRole('button', { name: '提交 AI 批改' }).click()
  await page.getByRole('heading', { name: '把这一次，写得更好' }).waitFor()
  await page.getByText('展开参考范文', { exact: true }).click()
  await page.screenshot({ path: path.join(out, 'ai-feedback.png'), fullPage: true })
  console.log('PASS: writing draft and timer survive reload, submission renders structured feedback')

  for (const feature of ['association', 'examples', 'quiz']) {
    await page.goto(`${base}/#/learn/ai/${feature}?word=benefit`)
    const button = page.getByRole('button', { name: feature === 'quiz' ? '生成 5 道练习题' : '生成学习卡片' })
    await button.click()
    try { await page.locator('.ai-result').waitFor({ timeout: 10000 }) }
    catch (error) { console.log('Failed page:', await page.locator('.ai-page').innerText()); throw error }
    if (feature === 'quiz') {
      assert.equal(await page.locator('.ai-quiz').count(), 5)
      await page.locator('.ai-quiz').first().getByRole('button', { name: 'A benefit' }).click()
      await page.getByText('已答 1 / 5 · 答对 1 题').waitFor()
      await page.screenshot({ path: path.join(out, 'ai-quiz.png'), fullPage: true })
    }
    console.log(`PASS: ${feature} generation and result rendering`)
  }
  await page.goto(base + '/#/learn/ai/history')
  await page.getByRole('button', { name: /AI 写作 · 已完成/ }).click()
  await page.getByRole('heading', { name: '把这一次，写得更好' }).waitFor()
  assert.equal(await page.locator('.ai-provider-list .ai-provider').count(), 4)
  await page.setViewportSize({ width: 320, height: 700 })
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.screenshot({ path: path.join(out, 'ai-history-dark.png'), fullPage: true })
  assert.deepEqual(errors, [])
  console.log('PASS: persisted private history, 320px layout, dark theme, no browser errors')
} finally {
  await browser?.close()
  await app.close()
  await new Promise((resolve) => upstream.close(resolve))
}
