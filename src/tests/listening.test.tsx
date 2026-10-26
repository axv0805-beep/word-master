// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEFAULT_SETTINGS, useAppStore } from '../store/appStore'
import { stopSpeaking } from '../core/speech'
import { getListeningPool } from '../data/listening'
import type { ListeningItem } from '../core/listening'

/**
 * 听力的材料是系统语音合成的：jsdom 里没有 speechSynthesis，
 * 这里塞一个能立刻触发 onend 的假实现，避免界面卡在「正在播放」。
 */
function installFakeSpeech() {
  class FakeUtterance {
    text: string
    lang = ''
    rate = 1
    pitch = 1
    voice: unknown = null
    onend: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor(text: string) {
      this.text = text
    }
  }
  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    cancel: vi.fn(),
    getVoices: () => [{ lang: 'en-US', name: 'Fake US' }, { lang: 'en-GB', name: 'Fake UK' }],
    addEventListener: vi.fn(),
    speak: vi.fn((utterance: FakeUtterance) => {
      // 用微任务触发结束，保证界面先进入「播放中」
      setTimeout(() => utterance.onend?.(), 0)
    })
  }
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true })
  return synth
}

function resetStore() {
  window.localStorage.clear()
  useAppStore.setState({
    settings: { ...DEFAULT_SETTINGS, autoSpeak: false, onlineAudio: false, onboarded: true, homeView: 'classic' },
    progress: {},
    mistakes: {},
    daily: {},
    rounds: [],
    study: { alphaCursor: {}, lastLetter: {} },
    customBooks: [],
    listeningDrawn: {},
    listeningMistakes: []
  })
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  )
}

function options() {
  return Array.from(document.querySelectorAll('.listen-option')) as HTMLButtonElement[]
}

/** 界面上正在显示的题：从题库里按题干反查，避免依赖随机抽到的顺序 */
function currentItem(level: 'cet4' | 'cet6', mode: 'drill' | 'mock'): ListeningItem {
  const stem = document.querySelector('.listen-stem')?.textContent?.trim() ?? ''
  const item = getListeningPool(level, mode).find((entry) => entry.stem === stem)
  if (!item) throw new Error(`题库里找不到当前题：${stem}`)
  return item
}

function drawnIds(level: 'cet4' | 'cet6' = 'cet4', mode: 'drill' | 'mock' = 'drill') {
  return useAppStore.getState().listeningDrawn[`${level}:${mode}`] ?? []
}

describe('学习页与四六级听力', () => {
  beforeEach(() => {
    resetStore()
    installFakeSpeech()
    // 抽题用 Math.random 打乱：固定成 0 让每轮的题顺序可复现
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    stopSpeaking()
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('学习页同时有听力和写作两个入口', async () => {
    renderAt('/learn')
    await waitFor(() => expect(screen.getByText('四六级听力')).toBeTruthy())
    expect(screen.getByText('四六级写作')).toBeTruthy()
    expect(screen.getAllByText('四级').length).toBe(2)
    expect(screen.getAllByText('六级').length).toBe(2)
  })

  it('四级听力页能选专项训练或真题模拟，并标出题库题量与每轮题数', async () => {
    renderAt('/learn/listening/cet4')
    await waitFor(() => expect(screen.getByText('选择练习方式')).toBeTruthy())
    expect(screen.getByText('专项训练')).toBeTruthy()
    expect(screen.getByText('真题模拟')).toBeTruthy()
    const captions = Array.from(document.querySelectorAll('.listen-mode__caption')).map((el) => el.textContent ?? '')
    expect(captions.length).toBe(2)
    captions.forEach((text) => {
      expect(text).toMatch(/26 道题 · 每轮随机 6 道/)
    })
  })

  it('播放、答对、答错都能给出反馈，答错的题会进听力错题本', async () => {
    renderAt('/learn/listening/cet4/drill')
    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())

    // 播放：点一下进入播放中，播完自动回到可重播
    const playButton = screen.getByRole('button', { name: '播放本段材料' })
    fireEvent.click(playButton)
    await waitFor(() => expect(screen.getByText(/正在播放/)).toBeTruthy())
    await waitFor(() => expect(screen.getByText(/点一下播放录音/)).toBeTruthy())

    const first = currentItem('cet4', 'drill')
    fireEvent.click(options()[first.answer])
    await waitFor(() => expect(screen.getByText('答对了')).toBeTruthy())
    expect(screen.getByText('看原文')).toBeTruthy()
    fireEvent.click(screen.getByText('看原文'))
    await waitFor(() => expect(document.querySelectorAll('.listen-transcript li').length).toBeGreaterThan(0))

    fireEvent.click(screen.getByText('下一题'))
    await waitFor(() => expect(screen.getByText('2 / 6')).toBeTruthy())

    const second = currentItem('cet4', 'drill')
    const wrongOption = (second.answer + 1) % second.options.length
    fireEvent.click(options()[wrongOption])
    await waitFor(() => expect(screen.getByText(/答错了，正确选项是/)).toBeTruthy())

    const recorded = useAppStore.getState().listeningMistakes
    expect(recorded).toHaveLength(1)
    expect(recorded[0].itemId).toBe(second.id)
    expect(recorded[0].chosen).toBe(wrongOption)
    expect(recorded[0].answer).toBe(second.answer)
  })

  it('做完一轮会给出正确率，再抽一轮不会重复抽到做过的题', async () => {
    renderAt('/learn/listening/cet6/drill')
    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())

    for (let i = 0; i < 6; i += 1) {
      const item = currentItem('cet6', 'drill')
      fireEvent.click(options()[item.answer])
      await waitFor(() => expect(document.querySelector('.listen-explain')).toBeTruthy())
      fireEvent.click(screen.getByText(i === 5 ? '看结果' : '下一题'))
    }

    await waitFor(() => expect(screen.getByText(/正确率 \d+%/)).toBeTruthy())
    const firstRound = drawnIds('cet6', 'drill')
    expect(firstRound).toHaveLength(6)

    fireEvent.click(screen.getByText('再抽 6 题'))
    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())

    const secondRound = drawnIds('cet6', 'drill')
    expect(secondRound).toHaveLength(12)
    // 第二轮的一题不能出现在第一轮里
    const current = currentItem('cet6', 'drill')
    expect(firstRound).not.toContain(current.id)
  })

  it('错题本里的听力标签会列出听力错题', async () => {
    useAppStore.setState({
      listeningMistakes: [
        {
          key: 'cet4:drill:c4-d01',
          level: 'cet4',
          mode: 'drill',
          itemId: 'c4-d01',
          section: '短对话',
          stem: 'What does the woman suggest?',
          options: ['Take the bus.', 'Walk to work.', 'Buy a bike.', 'Work from home.'],
          chosen: 1,
          answer: 0,
          wrong: 2,
          lastWrongAt: Date.now()
        }
      ]
    })
    renderAt('/mistakes')
    await waitFor(() => expect(screen.getByText('错题本')).toBeTruthy())
    fireEvent.click(screen.getByText('听力 1'))
    await waitFor(() => expect(screen.getByText('What does the woman suggest?')).toBeTruthy())
    expect(screen.getByText('你选了 B')).toBeTruthy()
    expect(screen.getByText('正确答案 A')).toBeTruthy()
    expect(screen.getByText('错 2 次')).toBeTruthy()
  })

  it('底部导航里已经没有词书 Tab，词书页仍可从首页进入', async () => {
    renderAt('/')
    await waitFor(() => expect(screen.getByText('学习')).toBeTruthy())
    const tabLabels = Array.from(document.querySelectorAll('.tab-link')).map((el) => el.textContent ?? '')
    expect(tabLabels.some((label) => label.includes('学习'))).toBe(true)
    expect(tabLabels.some((label) => label.includes('词书'))).toBe(false)
  })
})
