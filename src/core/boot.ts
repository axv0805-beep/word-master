/**
 * 开屏收尾。
 *
 * 开屏的样式和标记都写在 index.html 里（内联），所以 JS 还没下载完时
 * 用户看到的就是这一屏，不会白屏。应用挂载之后，由这里把它淡出并移除：
 *
 * - 至少停留 MIN_VISIBLE_MS：加载太快时立刻消失反而更突兀；
 * - 淡出期间给 <html> 挂 .app-ready，.page-shell 的入场动画就此开始，
 *   内容和开屏是一次交叉淡化，而不是「封面掀起后又长一遍」；
 * - 超时兜底：万一挂载出错或 transition 事件没触发，也会把开屏收走。
 */

interface BootWindow extends Window {
  /** index.html 内联脚本记录的首帧时间（performance.now 时间轴） */
  __bootAt?: number
}

/** 开屏最少停留时长 */
const MIN_VISIBLE_MS = 640
/** 系统开了「减少动效」时只做一次很短的淡出 */
const REDUCED_MIN_VISIBLE_MS = 280
/** 淡出过渡的兜底时长，正常由 transitionend 提前结束 */
const LEAVE_FALLBACK_MS = 460
/** 无论发生什么，到这个时间点一定收走 */
const HARD_REMOVE_MS = 3000

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function splashElement(): HTMLElement | null {
  return document.getElementById('boot-splash')
}

/** 内容入场动画的开关也在 <html> 上，开屏不在了也要保证它被打开 */
function markAppReady(): void {
  document.documentElement.classList.add('app-ready')
}

export function dismissBootSplash(): void {
  const splash = splashElement()
  if (!splash) {
    markAppReady()
    return
  }

  const win = window as BootWindow
  const bootAt = typeof win.__bootAt === 'number' ? win.__bootAt : performance.now()
  const elapsed = performance.now() - bootAt
  const reduced = prefersReducedMotion()
  const wait = Math.max(0, (reduced ? REDUCED_MIN_VISIBLE_MS : MIN_VISIBLE_MS) - elapsed)

  let leaving = false

  const leave = () => {
    if (leaving) return
    leaving = true
    const el = splashElement()
    markAppReady()
    if (!el) return
    const finish = () => el.remove()
    el.classList.add('is-leaving')
    el.addEventListener('transitionend', finish, { once: true })
    window.setTimeout(finish, LEAVE_FALLBACK_MS)
  }

  window.setTimeout(leave, wait)
  window.setTimeout(leave, Math.max(wait, HARD_REMOVE_MS - elapsed))
}
