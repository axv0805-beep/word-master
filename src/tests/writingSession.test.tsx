// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEFAULT_SETTINGS, useAppStore } from '../store/appStore'
import { useWritingSession } from '../store/writingSession'
import { useUpdateUi } from '../store/updateUi'

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
    listeningMistakes: [],
    writingDrawn: {},
    writingRecords: []
  })
  useWritingSession.getState().reset()
  useUpdateUi.setState({ info: null, open: false })
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )
}

const ESSAY = `Reading has become a daily habit for many students, and it is worth thinking about.

In my opinion, reading works in two ways. First, it trains patience, because a long article cannot be finished in one minute. Second, it widens vocabulary naturally.

What is more, I keep thirty minutes for a book every evening. Therefore reading is a important part of my life and the goverment should build more libaries.`

beforeEach(() => {
  resetStore()
  // 抽题是随机的，固定一下让断言稳定
  Math.random = () => 0.42
})

afterEach(() => {
  cleanup()
})

describe('写作练习', () => {
  it('打开写作页能抽到一道题，并显示题干与提纲', () => {
    renderAt('/learn/writing/cet4/drill')
    expect(screen.getByPlaceholderText('在这里写英文，写完点下面的按钮批改。')).toBeTruthy()
    expect(screen.getByRole('button', { name: '提交批改' })).toBeTruthy()
    expect(useAppStore.getState().writingDrawn['cet4:drill']).toHaveLength(1)
  })

  it('提交后给出分数、理由与错误清单', async () => {
    renderAt('/learn/writing/cet4/drill')
    const input = screen.getByLabelText('作文正文') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: ESSAY } })
    fireEvent.click(screen.getByRole('button', { name: '提交批改' }))

    expect(await screen.findByText('本次得分')).toBeTruthy()
    expect(screen.getByText('需要改的地方')).toBeTruthy()
    expect(screen.getAllByText(/goverment/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/a important/).length).toBeGreaterThan(0)
    expect(screen.getByText('要不要看看范文？')).toBeTruthy()

    const records = useAppStore.getState().writingRecords
    expect(records).toHaveLength(1)
    expect(records[0].score).toBeGreaterThan(0)
    expect(records[0].level).toBe('cet4')
  })

  it('点「查看范文」跳到范文页，能看到范文与可背的表达', async () => {
    renderAt('/learn/writing/cet4/drill')
    fireEvent.change(screen.getByLabelText('作文正文'), { target: { value: ESSAY } })
    fireEvent.click(screen.getByRole('button', { name: '提交批改' }))
    fireEvent.click(await screen.findByRole('button', { name: '查看范文' }))

    expect(await screen.findByText('参考范文')).toBeTruthy()
    expect(screen.getByText('可背的表达')).toBeTruthy()
    expect(screen.getByRole('button', { name: '回去改我的作文' })).toBeTruthy()
  })

  it('「先不改，回看我写的」回到编辑态并保留正文', async () => {
    renderAt('/learn/writing/cet4/drill')
    fireEvent.change(screen.getByLabelText('作文正文'), { target: { value: ESSAY } })
    fireEvent.click(screen.getByRole('button', { name: '提交批改' }))
    fireEvent.click(await screen.findByRole('button', { name: '先不改，回看我写的' }))

    const input = (await screen.findByLabelText('作文正文')) as HTMLTextAreaElement
    expect(input.value).toBe(ESSAY)
  })

  it('「换一道题」会换掉当前题目并记账', async () => {
    renderAt('/learn/writing/cet4/drill')
    fireEvent.change(screen.getByLabelText('作文正文'), { target: { value: ESSAY } })
    fireEvent.click(screen.getByRole('button', { name: '提交批改' }))
    fireEvent.click(await screen.findByRole('button', { name: '换一道题' }))

    expect(useAppStore.getState().writingDrawn['cet4:drill']).toHaveLength(2)
    expect((screen.getByLabelText('作文正文') as HTMLTextAreaElement).value).toBe('')
  })
})
