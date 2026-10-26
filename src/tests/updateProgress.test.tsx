// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEFAULT_SETTINGS, useAppStore } from '../store/appStore'
import { useSessionStore } from '../store/session'
import { APP_VERSION, onUpdateProgress, resolveManifestUrl } from '../core/native'
import type { UpdateProgress } from '../core/native'

type NativeWindow = {
  __updateProgress?: (raw: string) => void
  __updateAvailable?: (raw: string) => void
  __updateNone?: () => void
  AndroidApp?: Record<string, unknown>
}

const win = window as unknown as NativeWindow

/** 站点清单里的安装包摘要：用来验证网页把 sha256 原样透传给原生 */
const SHA256 = 'a3f1'.repeat(16)

function resetStore() {
  window.localStorage.clear()
  useAppStore.setState({
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

function pushProgress(payload: UpdateProgress | string) {
  const handler = win.__updateProgress
  if (!handler) throw new Error('页面没有订阅进度事件')
  act(() => {
    handler(typeof payload === 'string' ? payload : JSON.stringify(payload))
  })
}

function buttonsMatching(matcher: string): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).filter((button) => {
    const text = button.textContent ?? ''
    const label = button.getAttribute('aria-label') ?? ''
    return text.includes(matcher) || label.includes(matcher)
  })
}

function clickButton(matcher: string) {
  const found = buttonsMatching(matcher)
  if (found.length === 0) throw new Error(`找不到按钮：${matcher}`)
  fireEvent.click(found[0])
}

/** 模拟安卓壳：checkUpdate 立刻回调一个新版本，installUpdate 只记录被调用 */
function installFakeBridge(
  overrides: { withBrowser?: boolean; resume?: { received: number; total: number } } = {}
) {
  const installUpdate = vi.fn()
  const openInBrowser = vi.fn()
  const app: Record<string, unknown> = {
    versionCode: () => 7,
    versionName: () => '1.1.5',
    checkUpdate: () => {
      win.__updateAvailable?.(
        JSON.stringify({
          versionCode: 8,
          versionName: '1.1.6',
          url: './download/cimiao-1.1.6.apk',
          notes: '修复若干问题',
          sha256: SHA256
        })
      )
    },
    installUpdate
  }
  if (overrides.withBrowser) app.openInBrowser = openInBrowser
  if (overrides.resume) {
    const { received, total } = overrides.resume
    app.getUpdateState = () => JSON.stringify({ received, total, running: false, partial: true })
  }
  win.AndroidApp = app
  return { installUpdate, openInBrowser }
}

afterEach(() => {
  cleanup()
  delete win.__updateProgress
  delete win.__updateAvailable
  delete win.AndroidApp
})

describe('onUpdateProgress', () => {
  beforeEach(() => {
    resetStore()
  })

  it('解析原生推送、忽略坏帧，并在退订后停止接收', () => {
    const seen: UpdateProgress[] = []
    const stop = onUpdateProgress((progress) => seen.push(progress))

    pushProgress({ phase: 'downloading', received: 1024, total: 4096, attempt: 2 })
    pushProgress('not json')
    pushProgress(JSON.stringify({ phase: 'teleporting', received: 1 }))
    pushProgress({ phase: 'verifying' })

    expect(seen).toEqual([
      { phase: 'downloading', received: 1024, total: 4096, attempt: 2, message: undefined },
      { phase: 'verifying', received: undefined, total: undefined, attempt: undefined, message: undefined }
    ])

    stop()
    expect(win.__updateProgress).toBeUndefined()
  })
})

describe('设置页更新下载进度', () => {
  beforeEach(() => {
    resetStore()
  })

  function renderSettings() {
    return render(
      <MemoryRouter
        initialEntries={['/settings']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </MemoryRouter>
    )
  }

  it('下载过程中显示百分比、总量与剩余时间，校验和失败阶段跟着切换', async () => {
    const { installUpdate } = installFakeBridge()
    renderSettings()

    clickButton('检查')
    await waitFor(() => expect(screen.getByText('v1.1.6 可用')).toBeTruthy())

    // 还没点更新：进度条不该存在
    expect(screen.queryByRole('progressbar')).toBeNull()

    clickButton('立即更新')
    expect(installUpdate).toHaveBeenCalledWith(
      resolveManifestUrl('./download/cimiao-1.1.6.apk'),
      SHA256
    )

    // 第一个事件可能是「总大小未知」，先给不确定进度条，不能停在 0%
    pushProgress({ phase: 'downloading', received: 0, total: -1, attempt: 1 })
    const bar = screen.getByRole('progressbar', { name: 'v1.1.6 更新下载进度' })
    expect(bar.getAttribute('aria-busy')).toBe('true')
    expect(bar.hasAttribute('aria-valuenow')).toBe(false)
    expect(screen.getByText('下载中')).toBeTruthy()

    // 拿到 Content-Length 后切成确定进度
    pushProgress({ phase: 'downloading', received: 5 * 1024 * 1024, total: 10 * 1024 * 1024, attempt: 1 })
    const determinate = screen.getByRole('progressbar', { name: 'v1.1.6 更新下载进度' })
    expect(determinate.getAttribute('aria-valuenow')).toBe('50')
    expect(screen.getByText('50%')).toBeTruthy()
    expect(screen.getByText(/5\.00 MB \/ 10\.0 MB/)).toBeTruthy()
    expect(screen.getByText(/请勿关闭应用/)).toBeTruthy()

    // 重试次数要露出来，否则用户会以为卡住了
    pushProgress({ phase: 'downloading', received: 1 * 1024 * 1024, total: 10 * 1024 * 1024, attempt: 2 })
    expect(screen.getByText(/第 2 次尝试/)).toBeTruthy()

    pushProgress({ phase: 'verifying' })
    expect(screen.getByText('正在校验安装包')).toBeTruthy()

    // 原生失败帧会把已下载量清成 0：进度条必须冻在最后一次真实进度上
    pushProgress({ phase: 'failed', received: 0, total: -1, attempt: 3, message: '网络断了' })
    expect(screen.getByText('更新没有完成')).toBeTruthy()
    expect(screen.getByText(/1\.00 MB \/ 10\.0 MB/)).toBeTruthy()
    expect(screen.getByText('10%')).toBeTruthy()
    expect(screen.getByText(/网络断了/)).toBeTruthy()
    expect(buttonsMatching('重新下载')).toHaveLength(1)

    // 重新下载会重新点亮进度条，而不是留着上一次的完成态
    clickButton('重新下载')
    expect(installUpdate).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(screen.getByText('正在下载安装包')).toBeTruthy())

    pushProgress({ phase: 'done' })
    expect(screen.getByText('下载完成')).toBeTruthy()
    expect(buttonsMatching('重新下载')).toHaveLength(0)
  })

  it('上次下到一半被系统杀掉：进页面显示「下载已暂停」，继续下载接着传', async () => {
    const { installUpdate } = installFakeBridge({ resume: { received: 4 * 1024 * 1024, total: 10 * 1024 * 1024 } })
    renderSettings()

    clickButton('检查')
    await waitFor(() => expect(screen.getByText('v1.1.6 可用')).toBeTruthy())

    // 缓存里还有半截安装包：先把进度摆出来，别让用户以为要从 0 重下
    expect(screen.getByText('下载已暂停')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'v1.1.6 更新下载进度' }).getAttribute('aria-valuenow')).toBe('40')
    expect(screen.getByText(/退出应用不会丢/)).toBeTruthy()

    clickButton('继续下载')
    expect(installUpdate).toHaveBeenCalledWith(
      resolveManifestUrl('./download/cimiao-1.1.6.apk'),
      SHA256
    )
    await waitFor(() => expect(screen.getByText('正在下载安装包')).toBeTruthy())
  })

  it('失败时能退到浏览器下载', async () => {
    const { openInBrowser } = installFakeBridge({ withBrowser: true })
    renderSettings()

    clickButton('检查')
    await waitFor(() => expect(screen.getByText('v1.1.6 可用')).toBeTruthy())
    clickButton('立即更新')
    pushProgress({ phase: 'failed', message: '磁盘写不进去' })

    clickButton('改用浏览器下载')
    expect(openInBrowser).toHaveBeenCalledTimes(1)
  })

  it('网页端没有安卓桥时整块更新卡都不出现', () => {
    renderSettings()
    expect(screen.queryByText('检查更新')).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
    // 版本号退回编译期常量，不会因为缺桥而崩（跟着 native.ts 的 APP_VERSION 走，发版不用改测试）
    expect(screen.getByText(new RegExp(`版本 ${APP_VERSION.replace(/\./g, '\\.')}`))).toBeTruthy()
  })
})
