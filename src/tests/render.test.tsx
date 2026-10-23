// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { WordInsights } from '../components/WordInsights'
import { alphaOrder } from '../core/dictionary'
import { DEFAULT_SETTINGS, mergePersistedState, useAppStore } from '../store/appStore'
import { ROUND_SIZE_PRESETS } from '../core/constants'
import { useSessionStore } from '../store/session'
import type { DictEntry } from '../core/types'

/* 用可控的小词书驱动界面，题目形态与线上一致 */
const WORDS: DictEntry[] = [
  { w: 'abandon', t: ['放弃'], us: 'phon0', uk: 'phon0' },
  { w: 'benefit', t: ['好处'], us: 'phon1', uk: 'phon1' },
  { w: 'cancel', t: ['取消'], us: 'phon2', uk: 'phon2' },
  { w: 'decline', t: ['下降'], us: 'phon3', uk: 'phon3' },
  { w: 'earnest', t: ['认真的'], us: 'phon4', uk: 'phon4' },
  { w: 'fascinate', t: ['使着迷'], us: 'phon5', uk: 'phon5' },
  { w: 'govern', t: ['统治'], us: 'phon6', uk: 'phon6' },
  { w: 'harbor', t: ['港口'], us: 'phon7', uk: 'phon7' },
  { w: 'mobile phone', t: ['手机'], us: 'phon8', uk: 'phon8' },
  { w: 'ice cream', t: ['冰淇淋'], us: 'phon9', uk: 'phon9' },
  // 下面几个用于验证「词形变化 / 易混词」：care 是动词，careful / careless 是它的词形，cake 与它形近
  { w: 'care', t: ['v. 在乎；关心'], us: 'keə', uk: 'keə' },
  { w: 'careful', t: ['adj. 小心的'], us: 'keəfl', uk: 'keəfl' },
  { w: 'careless', t: ['adj. 粗心的'], us: 'keələs', uk: 'keələs' },
  { w: 'cake', t: ['n. 蛋糕'], us: 'keɪk', uk: 'keɪk' }
]

const CET6_WORDS: DictEntry[] = [
  { w: 'abolish', t: ['废除'], us: 'uk', uk: 'uk' },
  { w: 'bizarre', t: ['奇怪的'], us: 'uk', uk: 'uk' },
  { w: 'coincide', t: ['巧合'], us: 'uk', uk: 'uk' },
  { w: 'deteriorate', t: ['恶化'], us: 'uk', uk: 'uk' },
  { w: 'eliminate', t: ['消除'], us: 'uk', uk: 'uk' },
  { w: 'fluctuate', t: ['波动'], us: 'uk', uk: 'uk' }
]

const MANIFEST = {
  generatedAt: '2025-01-01T00:00:00.000Z',
  source: 'test',
  license: 'test',
  books: [
    {
      id: 'cet4',
      name: '四级核心',
      description: '大学英语四级核心词汇',
      file: 'cet4.json',
      count: WORDS.length,
      letters: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1, H: 1, I: 1, M: 1 },
      phoneticRate: 1,
      source: 'test'
    },
    {
      id: 'cet6',
      name: '六级',
      description: '大学英语六级词汇',
      file: 'cet6.json',
      count: CET6_WORDS.length,
      letters: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 },
      phoneticRate: 1,
      source: 'test'
    }
  ]
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  })
}

function resetStore() {
  window.localStorage.clear()
  useAppStore.setState({
    // 大部分用例验证的是主应用，这里直接从「已完成引导」开始；
    // 引导流程单独用 setOnboarded(false) 的用例覆盖。
    settings: { ...DEFAULT_SETTINGS, autoSpeak: false, onlineAudio: false, onboarded: true },
    progress: {},
    mistakes: {},
    daily: {},
    rounds: [],
    study: { alphaCursor: {}, lastLetter: {} },
    customBooks: []
  })
  useSessionStore.setState({ engine: null, bookId: '', mode: 'alpha', lastResult: null })
}

function setOnboarded(value: boolean) {
  useAppStore.setState((state) => ({ settings: { ...state.settings, onboarded: value } }))
}

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>
  )
}

/** 按可见文字或 aria-label 找按钮（不依赖无障碍名称计算） */
function buttonsMatching(matcher: string): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).filter((button) => {
    const text = button.textContent ?? ''
    const label = button.getAttribute('aria-label') ?? ''
    return text.includes(matcher) || label.includes(matcher)
  })
}

function clickButton(matcher: string): void {
  const found = buttonsMatching(matcher)
  if (found.length === 0) throw new Error(`找不到按钮：${matcher}`)
  fireEvent.click(found[0])
}

/** 依次尝试多个按钮文字，点击第一个匹配到的 */
function clickAnyButton(matchers: string[]): void {
  for (const matcher of matchers) {
    const found = buttonsMatching(matcher)
    if (found.length > 0) {
      fireEvent.click(found[0])
      return
    }
  }
  throw new Error(`找不到按钮：${matchers.join(' / ')}`)
}

/** 从首页开始一轮练习，并等待题目界面出现 */
async function startRoundFromHome(): Promise<void> {
  await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
  clickAnyButton(['开始学习', '继续学习'])
  await waitFor(() => expect(useSessionStore.getState().engine).not.toBeNull())
  await waitFor(() => {
    const hasOptions = document.querySelectorAll('.option').length === 4
    const hasInput = screen.queryByPlaceholderText('在这里拼写…') !== null
    expect(hasOptions || hasInput).toBe(true)
  })
}

// 所有用例共用的准备：清 DOM、重置 store、桩掉 fetch 与 jsdom 缺失的浏览器 API
beforeEach(() => {
  cleanup()
  resetStore()
  delete (window as { speechSynthesis?: unknown }).speechSynthesis
  window.scrollTo = (() => undefined) as typeof window.scrollTo
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('manifest.json')) return jsonResponse(MANIFEST)
      if (url.includes('cet6.json')) return jsonResponse(CET6_WORDS)
      if (url.includes('cet4.json')) return jsonResponse(WORDS)
      return new Response('{}', { status: 404 })
    })
  )
})

describe('界面渲染冒烟测试', () => {
  it('首页能渲染，并显示今日目标与当前词书', async () => {
    renderApp('/')
    expect(screen.getByText('今日目标')).toBeTruthy()
    expect(screen.getByText('错题专项练习')).toBeTruthy()
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
  })

  // 回归测试：曾经把整个应用包进 position:fixed + z-index:-1 的装饰背景层里，
  // 导致整页被 #root 盖住、所有点击失效且无法滚动（jsdom 的 fireEvent 绕过命中测试，查不出来）。
  it('装饰背景层必须是空元素，且不包含任何可交互内容', async () => {
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    const bg = document.querySelector('.app-bg')
    expect(bg).toBeTruthy()
    expect(bg!.children.length).toBe(0)
    expect(bg!.querySelector('button, a, input, textarea')).toBeNull()

    // 应用内容必须在背景层之外（背景层不能是它的祖先）
    const shell = document.querySelector('.phone-shell')
    expect(shell).toBeTruthy()
    expect(bg!.contains(shell)).toBe(false)

    let node: Element | null = shell
    let insideBackground = false
    while (node) {
      if (node.classList?.contains('app-bg')) insideBackground = true
      node = node.parentElement
    }
    expect(insideBackground).toBe(false)
  })

  it('可交互控件不能被 aria-hidden 的祖先包裹（否则读屏与无障碍查询都会失效）', async () => {
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    for (const control of Array.from(document.querySelectorAll('button, a'))) {
      let node: Element | null = control
      while (node) {
        expect(node.getAttribute('aria-hidden')).not.toBe('true')
        node = node.parentElement
      }
    }
  })

  it('首页问候语随时间变化（冻结在下午 15:30 时显示「下午好」）', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(2025, 5, 1, 15, 30, 0))
      renderApp('/')
      const heading = document.querySelector('h1')
      expect(heading?.textContent).toMatch(/^下午好，/)
      expect(heading?.textContent).not.toContain('脑子最清醒')
    } finally {
      vi.useRealTimers()
    }
  })

  it('页面一直开着时，跨过时段会自动更新问候语', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(2025, 5, 1, 8, 59, 30))
      renderApp('/')
      expect(document.querySelector('h1')?.textContent).toMatch(/^早上好，/)

      // 推进 1 分钟跨过 9:00 的分界
      act(() => {
        vi.advanceTimersByTime(60_000)
      })
      expect(document.querySelector('h1')?.textContent).toMatch(/^上午好，/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('首页可以直接选择本轮单词数（10–30），并立即生效到存储', async () => {
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    expect(screen.getByText('本轮单词数')).toBeTruthy()
    expect(screen.getByText('可选 10 – 30 个（不超过每日目标 30 词）')).toBeTruthy()

    // 只提供 10 / 15 / 20 / 25 / 30 五档，没有越界选项
    const chips = ROUND_SIZE_PRESETS.map((count) => screen.getByRole('button', { name: `本轮 ${count} 个单词` }))
    expect(chips).toHaveLength(5)
    expect(screen.queryByRole('button', { name: '本轮 5 个单词' })).toBeNull()
    expect(screen.queryByRole('button', { name: '本轮 40 个单词' })).toBeNull()

    // 默认高亮 20
    expect(chips[2].getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: '本轮 30 个单词' }))
    expect(useAppStore.getState().settings.roundSize).toBe(30)
    expect(screen.getByRole('button', { name: '本轮 30 个单词' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '本轮 20 个单词' }).getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: '本轮 10 个单词' }))
    expect(useAppStore.getState().settings.roundSize).toBe(10)
  })

  it('首页选定的单词数会真正决定一輪的题目数量', async () => {
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    // 词库里只有 10 个词，这里改成 10 并确认进度显示 0/10
    fireEvent.click(screen.getByRole('button', { name: '本轮 10 个单词' }))
    clickAnyButton(['开始学习', '继续学习'])

    await waitFor(() => expect(useSessionStore.getState().engine).not.toBeNull())
    expect(useSessionStore.getState().engine!.plannedTotal).toBe(10)
    await waitFor(() => expect(screen.getByText(/按字母顺序 · 0\/10 题/)).toBeTruthy())
  })

  it('每日目标调小后，首页每轮单词数的档位跟着变少', async () => {
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    // 默认每日目标 30 → 5 档
    expect(screen.getByRole('button', { name: '本轮 30 个单词' })).toBeTruthy()

    act(() => {
      useAppStore.getState().updateSettings({ dailyGoal: 20 })
    })
    await waitFor(() => expect(screen.getByRole('button', { name: '本轮 20 个单词' })).toBeTruthy())
    // 20 及以上不再可选
    expect(screen.queryByRole('button', { name: '本轮 25 个单词' })).toBeNull()
    expect(screen.queryByRole('button', { name: '本轮 30 个单词' })).toBeNull()
    // 低于每日目标的档位保留
    expect(screen.getByRole('button', { name: '本轮 10 个单词' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '本轮 15 个单词' })).toBeTruthy()

    act(() => {
      useAppStore.getState().updateSettings({ dailyGoal: 15 })
    })
    await waitFor(() => expect(screen.getByText('可选 10 – 15 个（不超过每日目标 15 词）')).toBeTruthy())
    expect(screen.queryByRole('button', { name: '本轮 20 个单词' })).toBeNull()
  })

  it('每日目标调小后，已选的每轮单词数会被自动夹到上限', async () => {
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    act(() => {
      useAppStore.getState().updateSettings({ roundSize: 30 })
    })
    expect(useAppStore.getState().settings.roundSize).toBe(30)

    act(() => {
      useAppStore.getState().updateSettings({ dailyGoal: 20 })
    })
    await waitFor(() => expect(useAppStore.getState().settings.roundSize).toBe(20))
    expect(screen.getByRole('button', { name: '本轮 20 个单词' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('每日目标低于 10 时每轮只保留最低档 10', async () => {
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    act(() => {
      useAppStore.getState().updateSettings({ dailyGoal: 5 })
    })
    await waitFor(() => expect(screen.getByText('可选 10 – 10 个（不超过每日目标 5 词）')).toBeTruthy())
    expect(screen.getByRole('button', { name: '本轮 10 个单词' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '本轮 15 个单词' })).toBeNull()
    expect(useAppStore.getState().settings.roundSize).toBe(10)
  })

  it('每日目标调大后，可选档位随之放开（最高仍为 30）', async () => {
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    act(() => {
      useAppStore.getState().updateSettings({ dailyGoal: 15 })
    })
    await waitFor(() => expect(screen.queryByRole('button', { name: '本轮 20 个单词' })).toBeNull())

    act(() => {
      useAppStore.getState().updateSettings({ dailyGoal: 100 })
    })
    await waitFor(() => expect(screen.getByRole('button', { name: '本轮 30 个单词' })).toBeTruthy())
    expect(screen.getByText('可选 10 – 30 个（不超过每日目标 100 词）')).toBeTruthy()
  })

  it('底部导航可以切换到词书、错题、统计、设置各页', async () => {
    renderApp('/')

    fireEvent.click(screen.getByText('词书'))
    await waitFor(() => expect(screen.getByText('选择词书与起点，开始一轮练习')).toBeTruthy())
    expect(screen.getByText('随机抽取')).toBeTruthy()

    fireEvent.click(screen.getByText('错题'))
    await waitFor(() => expect(screen.getByText('错题本是空的')).toBeTruthy())

    fireEvent.click(screen.getByText('统计'))
    await waitFor(() => expect(screen.getByText('统计与成长')).toBeTruthy())
    expect(screen.getByText('练习痕迹')).toBeTruthy()

    fireEvent.click(screen.getByText('设置'))
    await waitFor(() => expect(screen.getByText('每一轮题目数量')).toBeTruthy())
    expect(screen.getByText('错题再次出现频率')).toBeTruthy()
  })

  it('点击「开始学习」会生成一轮题目并进入答题页', async () => {
    renderApp('/')
    await startRoundFromHome()

    const engine = useSessionStore.getState().engine!
    // 词书词数少于每轮设定时，一轮实际题目数不会超过词书容量
    expect(engine.plannedTotal).toBe(Math.min(DEFAULT_SETTINGS.roundSize, WORDS.length))
    expect(engine.plannedTotal).toBe(WORDS.length)
    expect(screen.getByText(new RegExp(`按字母顺序 · 0/${WORDS.length} 题`))).toBeTruthy()

    const question = engine.current!
    if (question.type === 'spelling') {
      expect(screen.getByPlaceholderText('在这里拼写…')).toBeTruthy()
    } else {
      const options = document.querySelectorAll('.option')
      expect(options).toHaveLength(4)
      const texts = Array.from(options).map((item) => item.textContent)
      expect(texts).toContain(question.answer)
    }
  })

  it('选择正确答案后出现「答对了」反馈，点击继续进入下一题', async () => {
    renderApp('/')
    await startRoundFromHome()

    const question = useSessionStore.getState().engine!.current!
    if (question.type === 'spelling') {
      const input = screen.getByPlaceholderText('在这里拼写…') as HTMLInputElement
      fireEvent.change(input, { target: { value: question.answer } })
      fireEvent.submit(input.closest('form') as HTMLFormElement)
    } else {
      const option = Array.from(document.querySelectorAll<HTMLButtonElement>('.option')).find(
        (item) => item.textContent === question.answer
      )
      expect(option).toBeTruthy()
      fireEvent.click(option!)
    }

    await waitFor(() => expect(screen.getByText('答对了！')).toBeTruthy())

    // 反馈里应展示单词与释义
    expect(screen.getAllByText(question.entry.w).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText('继续'))
    await waitFor(() => expect(useSessionStore.getState().lastResult).toBeNull())
    expect(useAppStore.getState().progress[`cet4:${question.entry.w}`].correct).toBe(1)
  })

  it('答错会写入错题本，并显示正确释义', async () => {
    renderApp('/')
    await startRoundFromHome()

    const question = useSessionStore.getState().engine!.current!
    if (question.type === 'spelling') {
      const input = screen.getByPlaceholderText('在这里拼写…') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'zzz' } })
      fireEvent.submit(input.closest('form') as HTMLFormElement)
    } else {
      const option = Array.from(document.querySelectorAll<HTMLButtonElement>('.option')).find(
        (item) => item.textContent !== question.answer
      )!
      fireEvent.click(option)
    }

    await waitFor(() => expect(screen.getByText('答错了')).toBeTruthy())
    expect(screen.getByText('已经记入错题本')).toBeTruthy()
    await waitFor(() => expect(useAppStore.getState().mistakes[`cet4:${question.entry.w}`]).toBeTruthy())
  })

  it('设置页可以修改每轮题目数量、主题，并切换错题重现模式', async () => {
    renderApp('/settings')
    await waitFor(() => expect(screen.getByText('每一轮题目数量')).toBeTruthy())

    const before = useAppStore.getState().settings.roundSize
    clickButton('增加')
    expect(useAppStore.getState().settings.roundSize).toBe(before + 5)

    fireEvent.click(screen.getByText('晨雾'))
    expect(useAppStore.getState().settings.theme).toBe('light')

    fireEvent.click(screen.getByText('轮末复习'))
    expect(useAppStore.getState().settings.mistakeReplayMode).toBe('endOfRound')

    fireEvent.click(screen.getByText('拼写题'))
    expect(useAppStore.getState().settings.questionTypes).not.toContain('spelling')
  })

  it('错题本为空时不会开始错题专项，并给出提示', async () => {
    renderApp('/mistakes')
    await waitFor(() => expect(screen.getByText('错题本是空的')).toBeTruthy())
    expect(buttonsMatching('开始错题专项')).toHaveLength(0)
  })

  it('词书页展示首字母索引与导入入口', async () => {
    renderApp('/books')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
    expect(screen.getByText('按字母顺序')).toBeTruthy()
    expect(screen.getByText(/从指定首字母开始/)).toBeTruthy()
    expect(screen.getByText(/导入自定义词表/)).toBeTruthy()
  })
})

describe('答题后的词形变化与易混词', () => {
  it('展示词形变化（按词性分组）与易混词，且都带真实释义', async () => {
    const care = WORDS.find((entry) => entry.w === 'care')!
    render(<WordInsights entry={care} />)

    await waitFor(() => expect(screen.getByText('词形变化')).toBeTruthy())
    expect(screen.getByText('易混词')).toBeTruthy()

    // 词形：careful / careless 由规则推导 + 词库验证得到，归在「形容词」下
    expect(screen.getByText('形容词')).toBeTruthy()
    expect(screen.getByText('careful')).toBeTruthy()
    expect(screen.getByText('careless')).toBeTruthy()
    expect(screen.getByText('小心的')).toBeTruthy()

    // 易混词：cake 与 care 形近，带理由标签与释义
    expect(screen.getByText('cake')).toBeTruthy()
    expect(screen.getByText('蛋糕')).toBeTruthy()
    expect(screen.getByText(/形近|音近|同尾/)).toBeTruthy()
  })

  it('词库里没有相关词时给一句说明，而不是静默什么都不显示', async () => {
    const plain = WORDS.find((entry) => entry.w === 'harbor')!
    render(<WordInsights entry={plain} />)

    await waitFor(() => expect(screen.getByText(/词典里没有收录/)).toBeTruthy())
    expect(screen.getByText(/harbor/)).toBeTruthy()
    expect(screen.queryByText('词形变化')).toBeNull()
    expect(screen.queryByText('易混词')).toBeNull()
  })

  it('答对后的反馈界面里会显示词形变化与易混词', async () => {
    // 把字母顺序游标移到 care，保证第一题就是它；题型固定为选择题
    const ordered = alphaOrder(WORDS)
    const careIndex = ordered.findIndex((entry) => entry.w === 'care')
    expect(careIndex).toBeGreaterThan(0)
    act(() => {
      useAppStore.setState((state) => ({
        settings: { ...state.settings, questionTypes: ['zh2en'] },
        study: { ...state.study, alphaCursor: { cet4: careIndex } }
      }))
    })

    renderApp('/')
    await startRoundFromHome()

    const question = useSessionStore.getState().engine!.current!
    expect(question.entry.w).toBe('care')
    expect(question.type).toBe('zh2en')

    const option = Array.from(document.querySelectorAll<HTMLButtonElement>('.option')).find(
      (item) => item.textContent === question.answer
    )
    expect(option).toBeTruthy()
    fireEvent.click(option!)

    await waitFor(() => expect(screen.getByText('答对了！')).toBeTruthy())
    // 反馈卡下方出现词形变化与易混词
    await waitFor(() => expect(screen.getByText('词形变化')).toBeTruthy())
    expect(screen.getByText('易混词')).toBeTruthy()
    expect(screen.getByText('careful')).toBeTruthy()
    expect(screen.getByText('careless')).toBeTruthy()
    expect(screen.getByText('cake')).toBeTruthy()
  })
})

describe('首次进入的学习计划引导', () => {
  it('未完成引导时进入引导页，而不是首页', () => {
    setOnboarded(false)
    renderApp('/')
    expect(screen.getByText('选择要背的词书')).toBeTruthy()
    // 引导页没有底部导航
    expect(screen.queryByText('统计与成长')).toBeNull()
  })

  it('三步走完：选词书 → 定每日目标 → 生成「多少天背完」的计划', async () => {
    setOnboarded(false)
    renderApp('/')

    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    // 第一步：默认选中当前词书，可以直接下一步
    clickAnyButton(['下一步'])
    await waitFor(() => expect(screen.getByText('设定每天的目标')).toBeTruthy())

    // 第二步：换一个每日目标，实时看到天数变化
    const goalChip = screen.getByRole('button', { name: '50 词/天' })
    fireEvent.click(goalChip)
    expect(goalChip.getAttribute('aria-pressed')).toBe('true')
    // 10 个词 / 每天 50 → 1 天
    await waitFor(() => expect(screen.getByText(/以每天/)).toBeTruthy())
    expect(useAppStore.getState().settings.dailyGoal).toBe(30) // 未确认前不改动设置

    clickAnyButton(['下一步'])
    await waitFor(() => expect(screen.getByText('你的学习计划')).toBeTruthy())

    // 第三步：显示预计天数与计划明细
    expect(screen.getByText('天背完')).toBeTruthy()
    expect(screen.getByText('每日目标')).toBeTruthy()
    expect(screen.getByText('待学词数')).toBeTruthy()
    expect(screen.getAllByText(/50 词/).length).toBeGreaterThan(0)
    expect(screen.getByText(`${WORDS.length} 词`)).toBeTruthy()
  })

  it('第二步选完每日目标后，每轮单词数的档位随之变化', async () => {
    setOnboarded(false)
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
    clickAnyButton(['下一步'])
    await waitFor(() => expect(screen.getByText('设定每天的目标')).toBeTruthy())

    // 默认每日目标 30 → 每轮可选 10–30
    expect(screen.getByText('最低 10，最高不超过每天的目标（30）')).toBeTruthy()
    expect(screen.getByRole('button', { name: '本轮 30 个单词' })).toBeTruthy()

    // 目标改成 20 → 每轮最多 20
    fireEvent.click(screen.getByRole('button', { name: '20 词/天' }))
    await waitFor(() => expect(screen.getByText('最低 10，最高不超过每天的目标（20）')).toBeTruthy())
    expect(screen.getByRole('button', { name: '本轮 20 个单词' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '本轮 25 个单词' })).toBeNull()
    expect(screen.queryByRole('button', { name: '本轮 30 个单词' })).toBeNull()

    // 目标改成 10 → 只剩 10 一档
    fireEvent.click(screen.getByRole('button', { name: '10 词/天' }))
    await waitFor(() => expect(screen.getByText('最低 10，最高不超过每天的目标（10）')).toBeTruthy())
    expect(screen.getByRole('button', { name: '本轮 10 个单词' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '本轮 15 个单词' })).toBeNull()
  })

  it('引导里选的每轮单词数会写入设置并用于计划', async () => {
    setOnboarded(false)
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
    clickAnyButton(['下一步'])
    await waitFor(() => expect(screen.getByText('设定每天的目标')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: '20 词/天' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '本轮 15 个单词' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '本轮 15 个单词' }))

    clickAnyButton(['下一步'])
    await waitFor(() => expect(screen.getByText('你的学习计划')).toBeTruthy())
    expect(screen.getAllByText(/每轮 15 词/).length).toBeGreaterThan(0)

    clickAnyButton(['先回首页'])
    const settings = useAppStore.getState().settings
    expect(settings.dailyGoal).toBe(20)
    expect(settings.roundSize).toBe(15)
  })

  it('确认后写入词书与每日目标，并标记已完成引导', async () => {
    setOnboarded(false)
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
    expect(useAppStore.getState().settings.onboarded).toBe(false)

    clickAnyButton(['下一步'])
    await waitFor(() => expect(screen.getByText('设定每天的目标')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '100 词/天' }))
    clickAnyButton(['下一步'])
    await waitFor(() => expect(screen.getByText('天背完')).toBeTruthy())
    clickAnyButton(['先回首页'])

    const settings = useAppStore.getState().settings
    expect(settings.onboarded).toBe(true)
    expect(settings.dailyGoal).toBe(100)
    expect(settings.bookId).toBe('cet4')

    // 回到首页后底部导航出现
    await waitFor(() => expect(screen.getByText('今日目标')).toBeTruthy())
  })

  it('选择另一本词书后计划按该词书计算', async () => {
    setOnboarded(false)
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())

    const cet6Card = screen.getByRole('button', { name: /六级/ })
    fireEvent.click(cet6Card)
    expect(cet6Card.getAttribute('aria-pressed')).toBe('true')

    clickAnyButton(['下一步'])
    await waitFor(() => expect(screen.getByText('设定每天的目标')).toBeTruthy())
    clickAnyButton(['下一步'])
    await waitFor(() => expect(screen.getByText('你的学习计划')).toBeTruthy())

    // 计划明细按六级计算（fixture 里六级 6 个词）
    expect(screen.getByText('6 词')).toBeTruthy()
    expect(useAppStore.getState().settings.onboarded).toBe(false)

    clickAnyButton(['先回首页'])
    expect(useAppStore.getState().settings.bookId).toBe('cet6')
  })

  it('跳过引导也会保存当前选择并进入首页', async () => {
    setOnboarded(false)
    renderApp('/')
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
    clickAnyButton(['跳过引导'])
    expect(useAppStore.getState().settings.onboarded).toBe(true)
    await waitFor(() => expect(screen.getByText('今日目标')).toBeTruthy())
  })

  it('已有学习数据的老用户不会被迫重新走引导', () => {
    const merged = mergePersistedState(
      {
        settings: { theme: 'dark' },
        progress: { 'cet4:abandon': { streak: 1, correct: 1, wrong: 0, mastered: false, lastSeenAt: 1, ef: 2.5, intervalDays: 0, dueAt: 1 } }
      },
      useAppStore.getState()
    )
    expect(merged.settings.onboarded).toBe(true)
  })

  it('全新安装（无任何数据）会走引导', () => {
    const merged = mergePersistedState({ settings: { theme: 'dark' } }, useAppStore.getState())
    expect(merged.settings.onboarded).toBe(false)
  })

  it('明确存过的 onboarded 字段优先于数据推断', () => {
    const merged = mergePersistedState({ settings: { onboarded: false }, progress: { a: {} } }, useAppStore.getState())
    expect(merged.settings.onboarded).toBe(false)
  })
})
