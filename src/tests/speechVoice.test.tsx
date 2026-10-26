// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEFAULT_SETTINGS, useAppStore } from '../store/appStore'
import { stopSpeaking } from '../core/speech'

const VOICES = [
  { name: 'en-us-x-sfg-local', lang: 'en-US', local: true },
  { name: 'en-gb-x-gbb-local', lang: 'en-GB', local: true },
  { name: 'cmn-cn-x-ccc-local', lang: 'zh-CN', local: true }
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

  it('设置页列出设备上的英语语音，选中后写进设置', async () => {
    installFakeBridge()
    renderAt('/settings')

    const select = (await waitFor(() => screen.getByLabelText('听力音色'))) as HTMLSelectElement
    await waitFor(() => expect(select.options.length).toBe(3))
    const labels = Array.from(select.options).map((option) => option.textContent ?? '')
    expect(labels.some((text) => text.includes('en-gb-x-gbb-local'))).toBe(true)
    // 中文语音不该出现在听力的下拉里
    expect(labels.some((text) => text.includes('cmn-cn'))).toBe(false)

    fireEvent.change(select, { target: { value: 'en-gb-x-gbb-local' } })
    expect(useAppStore.getState().settings.speechVoice).toBe('en-gb-x-gbb-local')
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

  it('没选音色时交给原生自动挑', async () => {
    const { speakLines } = installFakeBridge()
    renderAt('/learn/listening/cet6/drill')

    await waitFor(() => expect(screen.getByText('1 / 6')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '播放本段材料' }))

    await waitFor(() => expect(speakLines).toHaveBeenCalled())
    expect((speakLines.mock.calls[0] as [string, number, string])[2]).toBe('')
  })
})
