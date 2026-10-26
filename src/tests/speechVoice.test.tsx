// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEFAULT_SETTINGS, useAppStore } from '../store/appStore'
import { stopSpeaking } from '../core/speech'

// 默认引擎（Google）的音色 + 另一个引擎（小米语音）的音色，后者用来验证跨引擎
const VOICES = [
  { name: 'en-us-x-sfg-local', lang: 'en-US', local: true, engine: 'com.google.android.tts', label: 'Google 语音服务', default: true },
  { name: 'en-gb-x-gbb-local', lang: 'en-GB', local: true, engine: 'com.google.android.tts', label: 'Google 语音服务', default: true },
  { name: 'cmn-cn-x-ccc-local', lang: 'zh-CN', local: true, engine: 'com.google.android.tts', label: 'Google 语音服务', default: true },
  { name: 'mimo-en-us', lang: 'en-US', local: false, engine: 'com.xiaomi.tts', label: '小米语音', default: false }
]

/** 假原生桥：只实现这一版要用的发音接口 */
function installFakeBridge() {
  const speakLines = vi.fn()
  const bridge = {
    speak: vi.fn(),
    stop: vi.fn(),
    speakLines,
    getVoices: () => JSON.stringify(VOICES)
  }
  ;(window as unknown as { AndroidSpeech?: typeof bridge }).AndroidSpeech = bridge
  return { bridge, speakLines }
}

function resetStore(overrides: Partial<typeof DEFAULT_SETTINGS> = {}) {
  window.localStorage.clear()
  useAppStore.setState({
    settings: {
      ...DEFAULT_SETTINGS,
      autoSpeak: false,
      onlineAudio: false,
      onboarded: true,
      homeView: 'classic',
      ...overrides
    },
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

describe('听力音色', () => {
  beforeEach(() => {
    resetStore()
  })

  afterEach(() => {
    stopSpeaking()
    cleanup()
    delete (window as unknown as { AndroidSpeech?: unknown }).AndroidSpeech
  })

  it('设置页列出所有引擎的音色，英语排前面，选别的引擎会带上包名', async () => {
    installFakeBridge()
    renderAt('/settings')

    const select = (await waitFor(() => screen.getByLabelText('听力音色'))) as HTMLSelectElement
    await waitFor(() => expect(select.options.length).toBe(5))
    const labels = Array.from(select.options).map((option) => option.textContent ?? '')
    expect(labels[1]).toContain('en-us-x-sfg-local')
    expect(labels.some((text) => text.includes('en-gb-x-gbb-local'))).toBe(true)
    // 小米引擎的音色也在列表里，网络音色会标出来
    const mimo = labels.find((text) => text.includes('mimo-en-us'))
    expect(mimo).toBeTruthy()
    expect(mimo).toContain('（网络）')
    // 英语之外的语音排在后面（听力材料是英语）
    const enIndex = labels.findIndex((text) => text.includes('en-us-x-sfg-local'))
    const zhIndex = labels.findIndex((text) => text.includes('cmn-cn'))
    expect(enIndex).toBeLessThan(zhIndex)

    fireEvent.change(select, { target: { value: 'com.xiaomi.tts::mimo-en-us' } })
    expect(useAppStore.getState().settings.speechVoice).toBe('com.xiaomi.tts::mimo-en-us')
  })

  it('选好的音色会传给原生的整段朗读接口', async () => {
    const { speakLines } = installFakeBridge()
    resetStore({ speechVoice: 'en-gb-x-gbb-local' })
    renderAt('/learn/listening/cet4/drill')

    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '播放本段材料' }))

    await waitFor(() => expect(speakLines).toHaveBeenCalled())
    const [json, rate, voice] = speakLines.mock.calls[0] as [string, number, string]
    expect(voice).toBe('en-gb-x-gbb-local')
    expect(rate).toBeCloseTo(0.92, 5)
    const lines = JSON.parse(json) as Array<{ t: string; p: number; r: number }>
    expect(lines.length).toBeGreaterThan(0)
    // 男声女声只靠音高区分，不再切两把音色
    lines.forEach((line) => {
      expect(line.p).toBeGreaterThan(0.9)
      expect(line.p).toBeLessThan(1.1)
    })
  })

  it('别的引擎的音色会把「包名::音色」原样传给原生', async () => {
    const { speakLines } = installFakeBridge()
    resetStore({ speechVoice: 'com.xiaomi.tts::mimo-en-us' })
    renderAt('/learn/listening/cet4/drill')

    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '播放本段材料' }))

    await waitFor(() => expect(speakLines).toHaveBeenCalled())
    expect((speakLines.mock.calls[0] as [string, number, string])[2]).toBe('com.xiaomi.tts::mimo-en-us')
  })

  it('没选音色时交给原生自动挑', async () => {
    const { speakLines } = installFakeBridge()
    renderAt('/learn/listening/cet6/drill')

    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '播放本段材料' }))

    await waitFor(() => expect(speakLines).toHaveBeenCalled())
    expect((speakLines.mock.calls[0] as [string, number, string])[2]).toBe('')
  })
})
