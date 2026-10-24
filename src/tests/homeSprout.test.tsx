// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEFAULT_SETTINGS, useAppStore } from '../store/appStore'
import { useSessionStore } from '../store/session'
import { dateKey } from '../core/stats'
import { DAY_MS } from '../core/srs'
import type { DailyMap } from '../core/stats'
import type { DictEntry } from '../core/types'

const WORDS: DictEntry[] = [
  { w: 'abandon', t: ['放弃'], us: 'phon0', uk: 'phon0' },
  { w: 'benefit', t: ['好处'], us: 'phon1', uk: 'phon1' },
  { w: 'cancel', t: ['取消'], us: 'phon2', uk: 'phon2' },
  { w: 'decline', t: ['下降'], us: 'phon3', uk: 'phon3' },
  { w: 'earnest', t: ['认真的'], us: 'phon4', uk: 'phon4' },
  { w: 'fascinate', t: ['使着迷'], us: 'phon5', uk: 'phon5' }
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

function resetStore(daily: DailyMap = {}) {
  window.localStorage.clear()
  useAppStore.setState({
    // 不写 homeView，用的就是默认值——默认必须是打卡页
    settings: { ...DEFAULT_SETTINGS, autoSpeak: false, onlineAudio: false, onboarded: true },
    progress: {},
    mistakes: {},
    daily,
    rounds: [],
    study: { alphaCursor: {}, lastLetter: {} },
    customBooks: []
  })
  useSessionStore.setState({ engine: null, bookId: '', mode: 'alpha', lastResult: null })
}

/** 连续两天都练习过：今天 + 昨天 */
function twoDaysOfPractice(): DailyMap {
  const today = dateKey(Date.now())
  const yesterday = dateKey(Date.now() - DAY_MS)
  return {
    [yesterday]: { date: yesterday, questions: 20, correct: 15, rounds: 1, ms: 60000, mastered: 0 },
    [today]: { date: today, questions: 10, correct: 8, rounds: 1, ms: 30000, mastered: 0 }
  }
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  )
}

function toggleButton(): HTMLButtonElement {
  const button = document.querySelector<HTMLButtonElement>('.home-toggle')
  if (!button) throw new Error('找不到右上角的切换按钮')
  return button
}

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
      if (url.includes('cet4.json')) return jsonResponse(WORDS)
      return new Response('{}', { status: 404 })
    })
  )
})

describe('首页的两副面孔', () => {
  it('默认进站看到的是打卡页：已打卡天数、词书卡、新学/复习、开始学习', async () => {
    renderHome()
    expect(screen.getByText('已打卡天数')).toBeTruthy()
    expect(screen.getByText('新学词')).toBeTruthy()
    expect(screen.getByText('复习词')).toBeTruthy()
    // 经典版的招牌内容此时不该出现
    expect(screen.queryByText('今日目标')).toBeNull()
    expect(screen.queryByText('本轮单词数')).toBeNull()
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
    expect(toggleButton().getAttribute('data-view')).toBe('sprout')
    expect(toggleButton().getAttribute('aria-label')).toBe('切换到今日主页')
  })

  it('打卡天数是真实的连续天数，今天的状态显示在数字下面', async () => {
    resetStore(twoDaysOfPractice())
    renderHome()
    expect(screen.getByLabelText('已连续打卡 2 天').textContent).toBe('2')
    expect(screen.getByText('今天已学 10 / 30 题')).toBeTruthy()
  })

  it('今天还没学时，状态行是「今天还没开始」', async () => {
    renderHome()
    expect(screen.getByLabelText('已连续打卡 0 天')).toBeTruthy()
    expect(screen.getByText('今天还没开始')).toBeTruthy()
  })

  it('点小树芽切到经典版，再点水滴切回打卡页，选择会存进设置', async () => {
    renderHome()

    fireEvent.click(toggleButton())
    await waitFor(() => expect(screen.getByText('今日目标')).toBeTruthy())
    expect(screen.queryByText('已打卡天数')).toBeNull()
    expect(toggleButton().getAttribute('data-view')).toBe('classic')
    expect(useAppStore.getState().settings.homeView).toBe('classic')

    fireEvent.click(toggleButton())
    await waitFor(() => expect(screen.getByText('已打卡天数')).toBeTruthy())
    expect(screen.queryByText('今日目标')).toBeNull()
    expect(useAppStore.getState().settings.homeView).toBe('sprout')
  })

  it('上次停在经典版，重新进站仍然是经典版', async () => {
    renderHome()
    fireEvent.click(toggleButton())
    await waitFor(() => expect(useAppStore.getState().settings.homeView).toBe('classic'))

    // 模拟一次冷启动：按当前设置重新挂载
    cleanup()
    renderHome()
    await waitFor(() => expect(screen.getByText('今日目标')).toBeTruthy())
  })

  it('打卡页的「开始学习」能进答题页', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /开始学习|准备中/ }))
    await waitFor(() => expect(useSessionStore.getState().engine).not.toBeNull())
  })

  it('词书卡上的「词表」跳转到词书页', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByText('四级核心')).toBeTruthy())
    fireEvent.click(screen.getByText('词表'))
    await waitFor(() => expect(screen.getByText('选择词书与起点，开始一轮练习')).toBeTruthy())
  })
})
