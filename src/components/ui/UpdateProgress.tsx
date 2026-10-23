import { useCallback, useEffect, useRef, useState } from 'react'
import { ProgressBar } from './Widgets'
import { nativeApp, onUpdateProgress } from '../../core/native'
import type { UpdateProgress } from '../../core/native'

/** 站点清单解析后的形态，url 已经按 UPDATE_MANIFEST_URL 补全 */
export interface UpdateInfo {
  versionCode: number
  versionName: string
  url: string
  notes?: string
}

export type DownloadState = UpdateProgress & { speed?: number }

interface SpeedSample {
  at: number
  received: number
  attempt: number
  speed: number
}

/** 用相邻两次回调的增量估下载速度；换了一次重试就重新算，避免把上一轮平均进去 */
function withSpeed(sample: { current: SpeedSample | null }, progress: UpdateProgress): DownloadState {
  if (progress.phase !== 'downloading') return { ...progress }
  const now = Date.now()
  const received = Math.max(0, progress.received ?? 0)
  const attempt = progress.attempt ?? 1
  const prev = sample.current
  if (!prev || prev.attempt !== attempt || received < prev.received) {
    sample.current = { at: now, received, attempt, speed: 0 }
    return { ...progress, speed: 0 }
  }
  let speed = prev.speed
  const elapsed = (now - prev.at) / 1000
  if (elapsed >= 0.6) {
    const instant = Math.max(0, (received - prev.received) / elapsed)
    speed = prev.speed > 0 ? prev.speed * 0.6 + instant * 0.4 : instant
    sample.current = { at: now, received, attempt, speed }
  }
  return { ...progress, speed }
}

function formatSize(bytes?: number): string {
  const value = bytes ?? 0
  if (value <= 0) return '0 MB'
  const mb = value / (1024 * 1024)
  return mb >= 10 ? `${mb.toFixed(1)} MB` : `${mb.toFixed(2)} MB`
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  if (seconds < 60) return `${Math.ceil(seconds)} 秒`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return rest > 0 ? `${minutes} 分 ${rest} 秒` : `${minutes} 分`
}

const DOWNLOAD_HEADLINE: Record<UpdateProgress['phase'], string> = {
  downloading: '正在下载安装包',
  verifying: '正在校验安装包',
  installing: '正在打开安装器',
  done: '下载完成',
  failed: '更新没有完成'
}

export function UpdateProgressView({ state, version }: { state: DownloadState; version: string }) {
  const received = Math.max(0, state.received ?? 0)
  const total = state.total && state.total > 0 ? state.total : 0
  const ratio = total > 0 ? Math.min(1, received / total) : 0
  const known = total > 0
  const percent = known ? Math.floor(ratio * 100) : null
  const attempt = state.attempt ?? 1
  const downloading = state.phase === 'downloading'

  const details: string[] = []
  if (downloading) {
    details.push(known ? `${formatSize(received)} / ${formatSize(total)}` : `已下载 ${formatSize(received)}`)
    if (known && received < total && (state.speed ?? 0) > 0) {
      const eta = formatEta((total - received) / (state.speed ?? 1))
      if (eta) details.push(`还剩约 ${eta}`)
    }
    if (attempt > 1) details.push(`第 ${attempt} 次尝试`)
    details.push('请勿关闭应用')
  } else if (state.phase === 'verifying') {
    details.push('确认文件完整后会自动打开安装器')
  } else if (state.phase === 'installing') {
    details.push('安装界面没出现？可以改用浏览器下载')
  } else if (state.phase === 'done') {
    details.push('按系统提示覆盖安装即可，学习数据会保留')
  } else {
    if (known) details.push(`${formatSize(received)} / ${formatSize(total)}`)
    details.push(state.message || '网络中断了，可以重新下载')
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div className="flex items-center justify-between" style={{ gap: 10 }}>
        <span
          style={{
            fontWeight: 600,
            fontSize: '0.82rem',
            color: state.phase === 'failed' ? 'var(--wrong)' : undefined
          }}
        >
          {DOWNLOAD_HEADLINE[state.phase]}
        </span>
        <span className="faint" style={{ fontSize: '0.78rem', flexShrink: 0 }}>
          {percent === null ? (downloading ? '下载中' : '') : `${percent}%`}
        </span>
      </div>
      <ProgressBar
        className="mt-2"
        value={downloading || state.phase === 'failed' ? ratio : 1}
        indeterminate={downloading && !known}
        tone={state.phase === 'failed' ? 'danger' : 'brand'}
        ariaLabel={`v${version} 更新下载进度`}
      />
      <p className="faint" style={{ fontSize: '0.72rem', marginTop: 6, lineHeight: 1.6 }}>
        {details.join(' · ')}
      </p>
    </div>
  )
}

export interface UpdateDownload {
  job: DownloadState | null
  /** 调起原生下载；返回 false 表示当前环境调不起来（原生壳缺失或抛错） */
  start: (url: string, onError?: (message: string) => void) => boolean
  reset: () => void
}

/**
 * 下载安装包的进度状态：订阅原生 window.__updateProgress，并把字节数换算成速度/剩余时间。
 * 设置页的「立即更新」和启动时的新版本弹窗共用这一份逻辑，避免两处行为漂移。
 */
export function useUpdateDownload(): UpdateDownload {
  const [job, setJob] = useState<DownloadState | null>(null)
  const speedSample = useRef<SpeedSample | null>(null)
  // 原生失败时会把已下载量清成 0，用最后一次真实进度把进度条冻在原地
  const lastBytes = useRef<{ received: number; total: number } | null>(null)

  useEffect(
    () =>
      onUpdateProgress((progress) => {
        if (progress.phase === 'downloading' && (progress.received ?? 0) > 0) {
          lastBytes.current = { received: progress.received ?? 0, total: progress.total ?? -1 }
        }
        const stalled =
          progress.phase === 'failed' && (progress.total ?? -1) <= 0 && lastBytes.current
            ? { ...progress, ...lastBytes.current }
            : progress
        setJob(withSpeed(speedSample, stalled))
      }),
    []
  )

  const reset = useCallback(() => {
    speedSample.current = null
    lastBytes.current = null
    setJob(null)
  }, [])

  const start = useCallback((url: string, onError?: (message: string) => void) => {
    const app = nativeApp()
    if (!app) {
      onError?.('当前环境不支持应用内更新')
      return false
    }
    speedSample.current = null
    lastBytes.current = null
    // 先点亮进度条：第一个进度事件要等连接建立后才会来
    setJob({ phase: 'downloading', received: 0, total: -1, attempt: 1, speed: 0 })
    try {
      app.installUpdate(url)
      return true
    } catch {
      const message = '调起下载失败，请改用浏览器下载'
      setJob({ phase: 'failed', message })
      onError?.(message)
      return false
    }
  }, [])

  return { job, start, reset }
}
