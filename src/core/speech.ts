/**
 * 发音与拼读。
 * 优先在线真人发音（有道词典音频），失败或离线时回退到系统语音合成（Web Speech API）。
 * 所有能力都做可用性判断，任何环节不可用时静默降级，不阻塞答题。
 */

import { androidSpeech } from './native'

export interface SpeakOptions {
  accent: 'us' | 'uk'
  /** 是否尝试在线真人发音 */
  online: boolean
}

let cachedVoices: SpeechSynthesisVoice[] = []
let audioEl: HTMLAudioElement | null = null

export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (androidSpeech()) return true
  const synth = window.speechSynthesis
  return !!synth && typeof synth.speak === 'function'
}

/** 安全获取系统语音列表（部分环境没有 getVoices） */
function readVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return []
  try {
    return window.speechSynthesis.getVoices?.() ?? []
  } catch {
    return []
  }
}

/** 预热语音列表（部分浏览器需要一次交互后才能拿到 voices） */
export function primeSpeech(): void {
  if (!isSpeechSupported()) return
  cachedVoices = readVoices()
  try {
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      cachedVoices = readVoices()
    })
  } catch {
    /* 不支持该事件时忽略 */
  }
}

function pickVoice(accent: 'us' | 'uk'): SpeechSynthesisVoice | undefined {
  if (cachedVoices.length === 0) cachedVoices = readVoices()
  const wanted = accent === 'us' ? ['en-US', 'en_US'] : ['en-GB', 'en_GB']
  for (const lang of wanted) {
    const exact = cachedVoices.find((voice) => voice.lang?.replace('_', '-').toLowerCase() === lang.toLowerCase())
    if (exact) return exact
  }
  return cachedVoices.find((voice) => voice.lang?.toLowerCase().startsWith('en'))
}

/** 系统语音合成；返回 Promise 便于拼读时按顺序朗读 */
export function speakWithTts(text: string, accent: 'us' | 'uk', rate = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (!text) {
      resolve()
      return
    }
    const bridge = androidSpeech()
    if (bridge) {
      try {
        bridge.speak(text, accent === 'us' ? 'en-US' : 'en-GB', rate)
      } catch {
        /* 忽略 */
      }
      // 原生播报没有回调，按文本长度估算结束时间
      setTimeout(resolve, Math.max(1200, text.length * 260))
      return
    }
    if (!isSpeechSupported()) {
      resolve()
      return
    }
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = accent === 'us' ? 'en-US' : 'en-GB'
      utterance.rate = rate
      utterance.pitch = 1
      const voice = pickVoice(accent)
      if (voice) utterance.voice = voice
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      // 兜底：部分移动浏览器不触发 onend
      setTimeout(resolve, Math.max(1200, text.length * 260))
      window.speechSynthesis.speak(utterance)
    } catch {
      resolve()
    }
  })
}

/** 在线真人发音音频地址 */
export function onlineAudioUrl(word: string, accent: 'us' | 'uk'): string {
  const type = accent === 'us' ? 2 : 1
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`
}

/** 播放在线音频；失败时 reject，由调用方回退系统语音 */
function playOnline(word: string, accent: 'us' | 'uk'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof Audio === 'undefined') {
      reject(new Error('Audio 不可用'))
      return
    }
    try {
      if (!audioEl) audioEl = new Audio()
      const el = audioEl
      const onError = () => {
        cleanup()
        reject(new Error('在线发音失败'))
      }
      const onEnded = () => {
        cleanup()
        resolve()
      }
      const cleanup = () => {
        el.removeEventListener('error', onError)
        el.removeEventListener('ended', onEnded)
      }
      el.addEventListener('error', onError)
      el.addEventListener('ended', onEnded)
      el.src = onlineAudioUrl(word, accent)
      el.play().catch(onError)
      // 超时保护，避免网络卡住时"没声音也没回退"
      setTimeout(() => {
        cleanup()
        reject(new Error('在线发音超时'))
      }, 2500)
    } catch (err) {
      reject(err instanceof Error ? err : new Error('在线发音异常'))
    }
  })
}

/** 朗读一个单词：在线优先，系统语音兜底 */
export async function speakWord(word: string, options: SpeakOptions): Promise<void> {
  if (!word) return
  if (options.online && typeof navigator !== 'undefined' && navigator.onLine !== false) {
    try {
      await playOnline(word, options.accent)
      return
    } catch {
      // 继续回退
    }
  }
  await speakWithTts(word, options.accent)
}

/**
 * 单词拼读：逐字母朗读，再整词朗读（对应万词王"真人拆音节领读"的降级实现）。
 * 字母之间的间隔靠 TTS 文本中的逗号与空格实现，兼容性最好。
 */
export async function spellWord(word: string, options: SpeakOptions): Promise<void> {
  const clean = word.trim()
  if (!clean) return

  if (!isSpeechSupported()) {
    // 无系统语音时至少尝试在线整词发音
    await speakWord(clean, options)
    return
  }

  const letters = clean
    .toLowerCase()
    .split('')
    .filter((char) => /[a-z0-9]/.test(char))

  if (letters.length === 0 || letters.length > 24) {
    await speakWithTts(clean, options.accent)
    return
  }

  // 用 "a, b, a, n, d, o, n" 让 TTS 逐字母读出
  await speakWithTts(letters.join(', '), options.accent, 0.72)
  await speakWithTts(clean, options.accent)
}

/* ------------------------------------------------------------------ */
/* 听力材料：整段多句顺序朗读                                            */
/* ------------------------------------------------------------------ */

export interface SpeechLine {
  text: string
  /** 美音 / 英音，用来区分两个说话人 */
  accent: 'us' | 'uk'
  /** 音高，只在 Web Speech 生效；原生侧靠英音/美音区分角色 */
  pitch?: number
}

export interface SpeechHandle {
  /** true = 正常播完，false = 被打断或引擎不可用 */
  done: Promise<boolean>
  stop: () => void
}

let nativeLinesDone: ((ok: boolean) => void) | null = null

/** 原生 TTS 播完最后一句时回调这里 */
export function handleSpeechLinesDone(): void {
  const resolve = nativeLinesDone
  nativeLinesDone = null
  resolve?.(true)
}

/** 按字数估个播放上限，避免引擎不回调时界面一直停在「正在播放」 */
function estimateDuration(lines: { text: string }[]): number {
  return lines.reduce((sum, line) => sum + line.text.length * 78, 0) + 2000
}

/**
 * 依次朗读多行文本（听力材料）。
 * 原生侧把整段丢给 TextToSpeech 用 QUEUE_ADD 排队，句子之间插静音，避免叠在一起；
 * 网页侧用 speechSynthesis 的队列，最后一句话的 onend 视为播完。
 */
export function speakLines(lines: SpeechLine[], options: { rate?: number } = {}): SpeechHandle {
  const rate = options.rate ?? 0.94
  const cleaned = lines.map((line) => ({ ...line, text: line.text.trim() })).filter((line) => line.text.length > 0)

  if (cleaned.length === 0) {
    return { done: Promise.resolve(true), stop: () => {} }
  }

  const bridge = androidSpeech()
  if (bridge?.speakLines) {
    let finished = false
    const done = new Promise<boolean>((resolve) => {
      const settle = (ok: boolean) => {
        if (finished) return
        finished = true
        nativeLinesDone = null
        resolve(ok)
      }
      nativeLinesDone = settle
      try {
        bridge.speakLines!(
          JSON.stringify(cleaned.map((line) => ({ t: line.text, l: line.accent === 'uk' ? 'en-GB' : 'en-US' }))),
          rate
        )
      } catch {
        settle(false)
      }
      setTimeout(() => settle(false), estimateDuration(cleaned))
    })
    return {
      done,
      stop: () => {
        if (finished) return
        finished = true
        nativeLinesDone = null
        bridge.stop?.()
      }
    }
  }

  if (!isSpeechSupported()) {
    return { done: Promise.resolve(false), stop: () => {} }
  }

  const synth = window.speechSynthesis
  let cancelled = false
  const done = new Promise<boolean>((resolve) => {
    try {
      synth.cancel()
      const utterances: SpeechSynthesisUtterance[] = []
      cleaned.forEach((line, index) => {
        const utterance = new SpeechSynthesisUtterance(line.text)
        utterance.lang = line.accent === 'uk' ? 'en-GB' : 'en-US'
        utterance.rate = rate
        utterance.pitch = line.pitch ?? 1
        const voice = pickVoice(line.accent)
        if (voice) utterance.voice = voice
        if (index === cleaned.length - 1) {
          utterance.onend = () => resolve(!cancelled)
          utterance.onerror = () => resolve(false)
        }
        utterances.push(utterance)
      })
      utterances.forEach((utterance) => synth.speak(utterance))
      setTimeout(() => resolve(!cancelled), estimateDuration(cleaned))
    } catch {
      resolve(false)
    }
  })

  return {
    done,
    stop: () => {
      cancelled = true
      try {
        synth.cancel()
      } catch {
        /* 忽略 */
      }
    }
  }
}

/**
 * 原生播完最后一句话会调 window.__speechLinesDone，这里把入口挂到全局。
 * 用属性赋值而不是 addInitScript：安卓壳的 WebView 每次加载都重新执行这段模块代码。
 */
if (typeof window !== 'undefined') {
  ;(window as unknown as { __speechLinesDone?: () => void }).__speechLinesDone = handleSpeechLinesDone
}

/** 停止所有正在播放的发音 */
export function stopSpeaking(): void {
  androidSpeech()?.stop()
  if (isSpeechSupported() && !androidSpeech()) {
    try {
      window.speechSynthesis.cancel?.()
    } catch {
      /* 忽略 */
    }
  }
  if (audioEl) {
    try {
      audioEl.pause()
      audioEl.currentTime = 0
    } catch {
      /* 忽略 */
    }
  }
}
