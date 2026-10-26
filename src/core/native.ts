/**
 * 安卓 WebView 壳注入的原生能力（见 android/.../MainActivity.java）
 * 网页单独跑的时候这些都不存在，所有调用方都要先判空。
 */

/** 网页端展示的版本号（安卓壳里以 APK 的实际版本为准） */
export const APP_VERSION = '1.1.20'

/**
 * 应用内更新检查的地址：GitHub Release 里随安装包一起上传的 version.json。
 * `releases/latest/download/` 永远指向最新一次正式发布，所以地址不用跟着版本变。
 * 安卓壳优先读它，读不到再退回 gh-pages 上的副本（见 MainActivity.VERSION_URLS）；
 * 网页端也用它把相对 url 补成绝对地址。
 */
export const UPDATE_MANIFEST_URL =
  'https://github.com/axv0805-beep/word-master/releases/latest/download/version.json'

/** gh-pages 上的备用清单：安卓端读不到 Release 清单时会退回这里 */
export const LEGACY_MANIFEST_URL = 'https://axv0805-beep.github.io/word-master/version.json'

/**
 * 把清单里的 url 补成绝对地址。
 * 新清单（发到 Release）里写的是绝对地址；老清单（gh-pages）里写的是 ./download/xxx.apk，
 * 那种相对路径要相对 gh-pages 解析，不能拿 Release 地址去拼。
 */
export function resolveManifestUrl(url: string, base = UPDATE_MANIFEST_URL): string {
  const isPagesPath = url.startsWith('./download/') || url.startsWith('download/')
  return new URL(url, isPagesPath ? LEGACY_MANIFEST_URL : base).href
}

export interface AndroidSpeechBridge {
  speak(text: string, lang: string, rate: number): void
  stop(): void
  /**
   * 整段朗读：json 是 [{t: 文本, l: 语言, p: 音高, r: 语速}]。
   * voiceName 可以是「引擎包名::音色名」（用别的引擎，比如小米语音），也可以是空的。
   * 播完回调 window.__speechLinesDone。
   */
  speakLines?(json: string, rate: number, voiceName?: string): void
  /** 所有 TTS 引擎的音色，JSON 字符串：[{name, lang, local, engine, label, default}] */
  getVoices?(): string
}

export interface AndroidAppBridge {
  /** 当前 APK 的 versionCode，用来和站点上的 version.json 比较 */
  versionCode(): number
  versionName(): string
  /** 交给原生去请求 version.json，结果通过 window.__update* 回调返回 */
  checkUpdate(): void
  /** 下载并拉起系统安装器（覆盖安装，学习数据保留）；sha256 非空时原生会校验安装包完整性 */
  installUpdate(url: string, sha256?: string): void
  /** 当前下载状态（JSON 字符串）：进程被杀后重新打开页面时用它恢复进度条 */
  getUpdateState?(): string
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

/**
 * 下载安装包时的进度事件（安卓壳通过 window.__updateProgress 推送）。
 * 原生只负责报「阶段 + 已下载/总字节」，百分比与网速由页面自己算，
 * 这样拿不到 Content-Length 时也能退化成不确定进度条。
 */
export interface UpdateProgress {
  /**
   * paused 只由页面产生（不是原生事件）：上次没下完、缓存里还留着可续传的片段时用它，
   * 告诉用户「进度还在，点继续下载接着下」。
   */
  phase: 'downloading' | 'verifying' | 'installing' | 'failed' | 'done' | 'paused'
  /** 已下载字节数 */
  received?: number
  /** 总字节数；-1 表示服务器没给 Content-Length */
  total?: number
  /** 第几次尝试（下载失败会自动重试） */
  attempt?: number
  /** failed / done 时给用户看的原因 */
  message?: string
}

const UPDATE_PHASES: ReadonlyArray<UpdateProgress['phase']> = [
  'downloading',
  'verifying',
  'installing',
  'failed',
  'done'
]

/** 原生推到网页的下载状态：缓存里的续传片段与是否有线程在跑 */
export interface UpdateDownloadState {
  received: number
  total: number
  running: boolean
  partial: boolean
}

/** 读原生侧「下到一半」的状态；网页端（没有安卓桥）返回 null */
export function readUpdateDownloadState(): UpdateDownloadState | null {
  const app = nativeApp()
  if (!app || typeof app.getUpdateState !== 'function') return null
  try {
    const raw = app.getUpdateState()
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<UpdateDownloadState> | null
    if (!parsed) return null
    return {
      received: typeof parsed.received === 'number' ? parsed.received : 0,
      total: typeof parsed.total === 'number' ? parsed.total : -1,
      running: parsed.running === true,
      partial: parsed.partial === true
    }
  } catch {
    return null
  }
}

/** 进度订阅者集合：设置页和启动弹窗会同时挂着，事件必须广播给每一家 */
const progressSubscribers = new Set<(progress: UpdateProgress) => void>()
let progressHandler: ((raw: string) => void) | null = null

/**
 * 订阅原生下载进度，返回退订函数。
 * 网页端（没有安卓桥）调用它是安全的空操作，进度条自然不出现。
 * 多个订阅者共存时 window.__updateProgress 只装一个分发器，事件广播给全部。
 */
export function onUpdateProgress(callback: (progress: UpdateProgress) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const w = window as unknown as { __updateProgress?: (raw: string) => void }
  progressSubscribers.add(callback)
  if (!progressHandler) {
    progressHandler = (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as Partial<UpdateProgress> | null
        if (!parsed || typeof parsed.phase !== 'string') return
        const phase = parsed.phase as UpdateProgress['phase']
        if (!UPDATE_PHASES.includes(phase)) return
        const progress: UpdateProgress = {
          phase,
          received: typeof parsed.received === 'number' ? parsed.received : undefined,
          total: typeof parsed.total === 'number' ? parsed.total : undefined,
          attempt: typeof parsed.attempt === 'number' ? parsed.attempt : undefined,
          message: typeof parsed.message === 'string' ? parsed.message : undefined
        }
        for (const subscriber of Array.from(progressSubscribers)) {
          try {
            subscriber(progress)
          } catch {
            // 单个订阅者出错不该让别人收不到进度
          }
        }
      } catch {
        // 单条坏消息不该打断正在进行的下载：丢掉这一帧进度即可
      }
    }
    w.__updateProgress = progressHandler
  }
  return () => {
    progressSubscribers.delete(callback)
    if (progressSubscribers.size === 0 && progressHandler) {
      if (w.__updateProgress === progressHandler) delete w.__updateProgress
      progressHandler = null
    }
  }
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
  /** 原生 TTS 播完整段音频后回调（听力材料用） */
  __speechLinesDone?: () => void
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
