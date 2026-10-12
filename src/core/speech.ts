/**
 * 发音与拼读。
 * 优先在线真人发音（有道词典音频），失败或离线时回退到系统语音合成（Web Speech API）。
 * 所有能力都做可用性判断，任何环节不可用时静默降级，不阻塞答题。
 */

export interface SpeakOptions {
  accent: 'us' | 'uk'
  /** 是否尝试在线真人发音 */
  online: boolean
}

let cachedVoices: SpeechSynthesisVoice[] = []
let audioEl: HTMLAudioElement | null = null

export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false
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
    if (!isSpeechSupported() || !text) {
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

/** 停止所有正在播放的发音 */
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
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
