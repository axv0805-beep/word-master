// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dismissBootSplash } from '../core/boot'

type BootWindow = Window & { __bootAt?: number }

function mountSplash(): HTMLElement {
  const el = document.createElement('div')
  el.id = 'boot-splash'
  document.body.append(el)
  return el
}

describe('开屏收尾', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.documentElement.className = ''
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
    document.documentElement.className = ''
    delete (window as BootWindow).__bootAt
  })

  it('刚进应用时不会立刻消失，等最短展示时长到了才淡出', () => {
    const splash = mountSplash()
    ;(window as BootWindow).__bootAt = performance.now()

    dismissBootSplash()
    vi.advanceTimersByTime(400)
    expect(splash.classList.contains('is-leaving')).toBe(false)
    expect(document.documentElement.classList.contains('app-ready')).toBe(false)

    vi.advanceTimersByTime(300)
    expect(splash.classList.contains('is-leaving')).toBe(true)
    expect(document.documentElement.classList.contains('app-ready')).toBe(true)
  })

  it('淡出后把开屏从 DOM 里移除（transitionend 没来也有兜底）', () => {
    const splash = mountSplash()
    ;(window as BootWindow).__bootAt = performance.now()

    dismissBootSplash()
    vi.advanceTimersByTime(700)
    expect(splash.isConnected).toBe(true)

    vi.advanceTimersByTime(600)
    expect(document.getElementById('boot-splash')).toBeNull()
  })

  it('已经过了最短时长时立刻淡出，不再拖一秒', () => {
    const splash = mountSplash()
    ;(window as BootWindow).__bootAt = performance.now() - 5000

    dismissBootSplash()
    vi.advanceTimersByTime(0)
    expect(splash.classList.contains('is-leaving')).toBe(true)
  })

  it('找不到开屏节点时也照样打开内容入场动画', () => {
    dismissBootSplash()
    expect(document.documentElement.classList.contains('app-ready')).toBe(true)
  })
})
