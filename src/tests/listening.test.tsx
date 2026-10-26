// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEFAULT_SETTINGS, useAppStore } from '../store/appStore'
import { stopSpeaking } from '../core/speech'

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
    customBooks: []
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

describe('学习页与四六级听力', () => {
  beforeEach(() => {
    resetStore()
    installFakeSpeech()
  })

  afterEach(() => {
    stopSpeaking()
    cleanup()
    vi.useRealTimers()
  })

  it('学习页保留听力入口并提供四、六级 AI 写作', async () => {
    renderAt('/learn')
    await waitFor(() => expect(screen.getByText('四六级听力')).toBeTruthy())
    expect(screen.getByText('四级')).toBeTruthy()
    expect(screen.getByText('六级')).toBeTruthy()
    expect(screen.getByText('四级写作')).toBeTruthy()
    expect(screen.getByText('六级写作')).toBeTruthy()
    expect(screen.queryByText('敬请期待')).toBeNull()
  })

  it('四级听力页能选专项训练或真题模拟，题量不超过 10 道', async () => {
    renderAt('/learn/listening/cet4')
    await waitFor(() => expect(screen.getByText('选择练习方式')).toBeTruthy())
    expect(screen.getByText('专项训练')).toBeTruthy()
    expect(screen.getByText('真题模拟')).toBeTruthy()
    // caption 形如「6 道题 · 约 5 分钟」
    const captions = Array.from(document.querySelectorAll('.listen-mode__caption')).map((el) => el.textContent ?? '')
    expect(captions.length).toBe(2)
    captions.forEach((text) => {
      const count = Number(text.match(/^(\d+) 道题/)?.[1] ?? 0)
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThanOrEqual(10)
    })
  })

  it('播放、答对、答错都能给出反馈并进入下一题', async () => {
    renderAt('/learn/listening/cet4/drill')
    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())

    // 播放：点一下进入播放中，播完自动回到可重播
    const playButton = screen.getByRole('button', { name: '播放本段材料' })
    fireEvent.click(playButton)
    await waitFor(() => expect(screen.getByText(/正在播放/)).toBeTruthy())
    await waitFor(() => expect(screen.getByText(/点一下播放录音/)).toBeTruthy())

    // 第一题正确答案是 B
    fireEvent.click(options()[1])
    await waitFor(() => expect(screen.getByText('答对了')).toBeTruthy())
    expect(screen.getByText('看原文')).toBeTruthy()
    fireEvent.click(screen.getByText('看原文'))
    await waitFor(() => expect(document.querySelectorAll('.listen-transcript li').length).toBeGreaterThan(0))

    fireEvent.click(screen.getByText('下一题'))
    await waitFor(() => expect(screen.getByText('2 / 6')).toBeTruthy())

    // 第二题的正确答案是 A，这里故意选成 B
    fireEvent.click(options()[1])
    await waitFor(() => expect(screen.getByText(/答错了，正确选项是/)).toBeTruthy())
  })

  it('做完一套题会给出正确率，并能再听一遍', async () => {
    renderAt('/learn/listening/cet6/drill')
    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())

    // 六级专项第一题正确答案是 B，其余题随便选，最后只校验结果页出现
    for (let i = 0; i < 6; i += 1) {
      const target = options()[i === 0 ? 1 : 0]
      fireEvent.click(target)
      await waitFor(() => expect(document.querySelector('.listen-explain')).toBeTruthy())
      fireEvent.click(screen.getByText(i === 5 ? '看结果' : '下一题'))
    }

    await waitFor(() => expect(screen.getByText(/正确率 \d+%/)).toBeTruthy())
    expect(screen.getByText('再听一遍')).toBeTruthy()
    fireEvent.click(screen.getByText('再听一遍'))
    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())
  })

  it('底部导航里已经没有词书 Tab，词书页仍可从首页进入', async () => {
    renderAt('/')
    await waitFor(() => expect(screen.getByText('学习')).toBeTruthy())
    const tabLabels = Array.from(document.querySelectorAll('.tab-link')).map((el) => el.textContent ?? '')
    expect(tabLabels.some((label) => label.includes('学习'))).toBe(true)
    expect(tabLabels.some((label) => label.includes('词书'))).toBe(false)
  })
})
