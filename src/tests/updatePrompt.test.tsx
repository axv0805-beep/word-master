// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { UpdatePrompt } from '../components/UpdatePrompt'
import { APP_VERSION, resolveManifestUrl } from '../core/native'
import type { UpdateProgress } from '../core/native'
import { readUpdatePrefs, resetUpdatePrefs, writeUpdatePrefs } from '../core/updatePrefs'
import { resetUpdateCheckCache } from '../hooks/useUpdateCheck'
import { useUpdateUi } from '../store/updateUi'

type NativeWindow = {
  __updateProgress?: (raw: string) => void
  __updateAvailable?: (raw: string) => void
  __updateNone?: () => void
  __updateError?: (message: string) => void
  AndroidApp?: Record<string, unknown>
}

const win = window as unknown as NativeWindow

/** 站点清单里的安装包摘要：用来验证网页把 sha256 原样透传给原生 */
const SHA256 = 'b7c2'.repeat(16)

const MANIFEST = {
  versionCode: 12,
  versionName: '1.2.0',
  url: './download/cimiao-1.2.0.apk',
  notes: '修掉了几个小问题，单词卡片排版更宽松',
  sha256: SHA256
}

/** 模拟安卓壳：checkUpdate 立刻按 reply 回调，installUpdate 只记录 */
function installFakeBridge(reply: 'available' | 'none' | 'error' = 'available') {
  const installUpdate = vi.fn()
  const openInBrowser = vi.fn()
  const checkUpdate = vi.fn(() => {
    if (reply === 'available') win.__updateAvailable?.(JSON.stringify(MANIFEST))
    else if (reply === 'none') win.__updateNone?.()
    else win.__updateError?.('连不上服务器')
  })
  win.AndroidApp = {
    versionCode: () => 11,
    versionName: () => '1.1.6',
    checkUpdate,
    installUpdate,
    openInBrowser
  }
  return { installUpdate, openInBrowser, checkUpdate }
}

function buttonsMatching(matcher: string): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).filter((button) =>
    (button.textContent ?? '').includes(matcher)
  )
}

function clickButton(matcher: string) {
  const found = buttonsMatching(matcher)
  if (found.length === 0) throw new Error(`找不到按钮：${matcher}`)
  fireEvent.click(found[0])
}

function pushProgress(payload: UpdateProgress) {
  const handler = win.__updateProgress
  if (!handler) throw new Error('页面没有订阅进度事件')
  act(() => handler(JSON.stringify(payload)))
}

/**
 * 清单检查在挂载时就发起（结果走微任务回来），弹窗的 1.2s 延迟是拿到结果之后才排的：
 * 先让微任务跑完，再把定时器推过去。
 */
async function runLaunchCheck() {
  await act(async () => {
    await Promise.resolve()
  })
  await act(async () => {
    vi.advanceTimersByTime(1300)
  })
}

async function mountPrompt() {
  const view = render(<UpdatePrompt />)
  await runLaunchCheck()
  return view
}

beforeEach(() => {
  vi.useFakeTimers()
  resetUpdatePrefs()
  // 一次打开只查一次清单是模块级缓存，用例之间要清掉；弹窗显隐状态同理
  resetUpdateCheckCache()
  useUpdateUi.setState({ info: null, open: false })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  delete win.AndroidApp
  delete win.__updateProgress
  delete win.__updateAvailable
  delete win.__updateNone
  delete win.__updateError
  resetUpdatePrefs()
})

describe('启动时的新版本提醒', () => {
  it('发现新版本后弹出提醒，带上版本号、更新说明和三个选择', async () => {
    installFakeBridge()
    const view = render(<UpdatePrompt />)

    // 进来先别抢开屏的风头
    expect(screen.queryByRole('dialog')).toBeNull()
    await runLaunchCheck()

    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByText('发现新版本 v1.2.0')).toBeTruthy()
    expect(screen.getByText(new RegExp(`当前 v${APP_VERSION.replace(/\./g, '\\.')}`))).toBeTruthy()
    expect(screen.getByText(/单词卡片排版更宽松/)).toBeTruthy()
    expect(buttonsMatching('立即更新')).toHaveLength(1)
    expect(buttonsMatching('稍后再说')).toHaveLength(1)
    expect(buttonsMatching('跳过这个版本')).toHaveLength(1)

    view.unmount()
  })

  it('点了立即更新就调起原生下载，并就地显示进度', async () => {
    const { installUpdate } = installFakeBridge()
    await mountPrompt()

    clickButton('立即更新')
    expect(installUpdate).toHaveBeenCalledWith(
      resolveManifestUrl('./download/cimiao-1.2.0.apk'),
      SHA256
    )

    const bar = screen.getByRole('progressbar', { name: 'v1.2.0 更新下载进度' })
    expect(bar.getAttribute('aria-busy')).toBe('true')

    pushProgress({ phase: 'downloading', received: 5 * 1024 * 1024, total: 10 * 1024 * 1024, attempt: 1 })
    expect(screen.getByText('50%')).toBeTruthy()

    // 下载中可以收起，原生线程会继续下
    clickButton('收起，后台下载')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('「稍后再说」记下静默期，六个小时内不再打扰', async () => {
    const { checkUpdate } = installFakeBridge()
    const view = await mountPrompt()

    clickButton('稍后再说')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(readUpdatePrefs().snoozeUntil).toBeGreaterThan(Date.now())
    expect(checkUpdate).toHaveBeenCalledTimes(1)

    // 再进一次应用：静默期内连检查都不做
    view.unmount()
    await mountPrompt()
    expect(checkUpdate).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('「跳过这个版本」按版本号永久静音，同版本不再提醒', async () => {
    const { checkUpdate } = installFakeBridge()
    const view = await mountPrompt()

    clickButton('跳过这个版本')
    expect(readUpdatePrefs().mutedVersionCode).toBe(12)
    expect(screen.queryByRole('dialog')).toBeNull()
    view.unmount()

    // 清掉检查间隔与静默期，只留下「跳过」记录：确实是被静音挡掉的
    writeUpdatePrefs({ lastCheckAt: 0, snoozeUntil: 0 })
    resetUpdateCheckCache()
    await mountPrompt()
    expect(checkUpdate).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('没有新版本或检查失败都静默，不弹任何东西', async () => {
    installFakeBridge('none')
    const view = await mountPrompt()
    expect(screen.queryByRole('dialog')).toBeNull()
    view.unmount()

    resetUpdatePrefs()
    installFakeBridge('error')
    await mountPrompt()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('网页端没有安卓桥时整套逻辑不动', async () => {
    delete win.AndroidApp
    render(<UpdatePrompt />)
    await runLaunchCheck()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(win.__updateAvailable).toBeUndefined()
  })
})
