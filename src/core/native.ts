/**
 * 安卓 WebView 壳注入的原生能力（见 android/.../MainActivity.java）
 * 网页单独跑的时候这些都不存在，所有调用方都要先判空。
 */

/** 网页端展示的版本号（安卓壳里以 APK 的实际版本为准） */
export const APP_VERSION = '1.1.5'

/**
 * 应用内更新检查的地址。
 * 安卓壳里页面来自本地 assets，所以不能读相对路径的 version.json（那是它自己的版本），
 * 必须去线上站点读；仓库改名/迁移时同步改这里。
 */
export const UPDATE_MANIFEST_URL = 'https://axv0805-beep.github.io/word-master/version.json'

export interface AndroidSpeechBridge {
  speak(text: string, lang: string, rate: number): void
  stop(): void
}

export interface AndroidAppBridge {
  /** 当前 APK 的 versionCode，用来和站点上的 version.json 比较 */
  versionCode(): number
  versionName(): string
  /** 交给原生去请求 version.json，结果通过 window.__update* 回调返回 */
  checkUpdate(): void
  /** 下载并拉起系统安装器（覆盖安装，学习数据保留） */
  installUpdate(url: string): void
  /** 状态栏/导航栏图标明暗：浅色主题传 true（深色图标） */
  setBarIcons?(darkIcons: boolean): void
  /** 系统栏高度（CSS px），页面加载瞬间先用它占位 */
  statusBarHeight?(): number
  navigationBarHeight?(): number
  /** 用系统浏览器打开链接：应用内下载失败时的兜底（浏览器支持断点续传） */
  openInBrowser?(url: string): void
}

/** 原生检查更新的三种回调（安卓壳通过 evaluateJavascript 调用） */
export interface UpdateCallbacks {
  onAvailable: (raw: string) => void
  onNone: () => void
  onError: () => void
}

/** 挂上 window.__update* 回调，调用原生 checkUpdate() */
export function requestUpdateCheck(callbacks: UpdateCallbacks): boolean {
  const app = nativeApp()
  if (!app) return false
  const w = window as unknown as {
    __updateAvailable?: (raw: string) => void
    __updateNone?: () => void
    __updateError?: () => void
  }
  w.__updateAvailable = callbacks.onAvailable
  w.__updateNone = callbacks.onNone
  w.__updateError = callbacks.onError
  try {
    app.checkUpdate()
  } catch {
    return false
  }
  return true
}

interface NativeWindow {
  AndroidSpeech?: AndroidSpeechBridge
  AndroidApp?: AndroidAppBridge
}

function nativeWindow(): NativeWindow | undefined {
  if (typeof window === 'undefined') return undefined
  return window as unknown as NativeWindow
}

export function androidSpeech(): AndroidSpeechBridge | undefined {
  return nativeWindow()?.AndroidSpeech
}

export function nativeApp(): AndroidAppBridge | undefined {
  return nativeWindow()?.AndroidApp
}

/** 是否跑在安卓壳里（此时不需要再给用户下载 APK 的入口） */
export function isNativeShell(): boolean {
  return !!androidSpeech() || !!nativeApp()
}

/**
 * 把系统栏高度写进 CSS 变量，页面用它们给状态栏/手势条留白。
 * 安卓壳在视口变化时也会调 window.__setSafeArea，所以这里只做初始值与安装回调。
 */
export function installSafeArea(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { __setSafeArea?: (top: number, bottom: number) => void }
  const set = (top: number, bottom: number) => {
    const root = document.documentElement
    root.style.setProperty('--safe-top', `${Math.max(0, Math.round(top))}px`)
    root.style.setProperty('--safe-bottom', `${Math.max(0, Math.round(bottom))}px`)
  }
  w.__setSafeArea = set

  const app = nativeApp()
  if (!app) return
  try {
    set(app.statusBarHeight?.() ?? 0, app.navigationBarHeight?.() ?? 0)
  } catch {
    /* 老版本壳没有这两个方法，退化成 0，等 insets 回调补上 */
  }
}

/** 状态栏图标跟随主题明暗：浅色背景要深色图标 */
export function syncBarIcons(mode: 'light' | 'dark'): void {
  const app = nativeApp()
  if (!app?.setBarIcons) return
  try {
    app.setBarIcons(mode === 'light')
  } catch {
    /* 忽略：网页端没有桥或老版本壳不支持 */
  }
}
