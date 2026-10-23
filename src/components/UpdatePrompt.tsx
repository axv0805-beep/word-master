import { useCallback, useEffect, useState } from 'react'
import { Icon } from './ui/Icons'
import { useToast } from './ui/Toast'
import { UpdateProgressView, useUpdateDownload } from './ui/UpdateProgress'
import type { UpdateInfo } from './ui/UpdateProgress'
import { APP_VERSION, UPDATE_MANIFEST_URL, nativeApp, requestUpdateCheck } from '../core/native'
import {
  isVersionMuted,
  markChecked,
  muteUpdateVersion,
  shouldCheckOnLaunch,
  snoozeUpdatePrompt
} from '../core/updatePrefs'

/** 进应用后先让开屏和首屏动画走完，再弹窗，避免一进来就糊在脸上 */
const LAUNCH_DELAY_MS = 1200

/**
 * 冷启动时静默检查一次更新，有新版本就弹窗。
 * 只有安卓壳里有原生桥，网页端返回 null，什么都不做。
 */
export function UpdatePrompt() {
  const app = nativeApp()
  const showToast = useToast((state) => state.show)
  const { job, start } = useUpdateDownload()
  const [info, setInfo] = useState<UpdateInfo | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!app) return
    if (!shouldCheckOnLaunch()) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      markChecked()
      requestUpdateCheck({
        onAvailable: (raw) => {
          if (cancelled) return
          try {
            const parsed = JSON.parse(raw) as UpdateInfo
            if (!parsed || typeof parsed.url !== 'string') return
            if (isVersionMuted(parsed.versionCode)) return
            setInfo({ ...parsed, url: new URL(parsed.url, UPDATE_MANIFEST_URL).href })
            setOpen(true)
          } catch {
            // 清单坏了就静默放过：启动阶段不值得为一次检查失败打扰用户
          }
        },
        onNone: () => undefined,
        onError: () => undefined
      })
    }, LAUNCH_DELAY_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [app])

  const dismiss = useCallback(
    (mode: 'snooze' | 'mute') => {
      setOpen(false)
      if (mode === 'snooze') snoozeUpdatePrompt()
      else if (info) {
        muteUpdateVersion(info.versionCode)
        showToast(`已跳过 v${info.versionName}，可以在设置页手动更新`)
      }
    },
    [info, showToast]
  )

  const downloading = job?.phase === 'downloading' || job?.phase === 'verifying'
  const openInBrowser = app?.openInBrowser

  const startDownload = useCallback(() => {
    if (!info) return
    start({ url: info.url, sha256: info.sha256 }, (message) => showToast(message, 'error'))
  }, [info, showToast, start])

  // 下载中允许收起（原生线程继续下），但 ESC / 点背景也按「稍后」处理，不会中断下载
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss('snooze')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, dismiss])

  if (!open || !info) return null

  return (
    <div
      className="update-backdrop fixed inset-0 z-[70] flex items-end justify-center px-4"
      style={{
        background: 'rgba(3, 18, 12, 0.5)',
        backdropFilter: 'blur(6px)',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))'
      }}
      onMouseDown={() => dismiss('snooze')}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-dialog-title"
        aria-describedby={info.notes ? 'update-dialog-notes' : undefined}
        className="card update-dialog w-full"
        style={{ maxWidth: 380, padding: 20 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start" style={{ gap: 12 }}>
          <span
            aria-hidden="true"
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--brand-soft)',
              border: '1px solid var(--border)',
              color: 'var(--brand-1)'
            }}
          >
            <Icon name="download" size={20} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div id="update-dialog-title" style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
              发现新版本 v{info.versionName}
            </div>
            <div className="faint" style={{ fontSize: '0.74rem', marginTop: 3 }}>
              当前 v{APP_VERSION} · 覆盖安装不会丢学习记录
            </div>
          </div>
        </div>

        {info.notes && (
          <p
            id="update-dialog-notes"
            className="muted"
            style={{ fontSize: '0.78rem', lineHeight: 1.65, marginTop: 12 }}
          >
            {info.notes}
          </p>
        )}

        {job && <UpdateProgressView state={job} version={info.versionName} />}

        <div className="flex flex-col gap-2" style={{ marginTop: 16 }}>
          {job === null && (
            <button
              type="button"
              className="btn btn-primary btn-md w-full"
              onClick={() => startDownload()}
            >
              <Icon name="download" size={16} />
              立即更新
            </button>
          )}

          {(job?.phase === 'failed' || job?.phase === 'paused') && (
            <button type="button" className="btn btn-primary btn-md w-full" onClick={() => startDownload()}>
              <Icon name={job?.phase === 'paused' ? 'download' : 'refresh'} size={16} />
              {job?.phase === 'paused' ? '继续下载' : '重新下载'}
            </button>
          )}

          {downloading && (
            <button
              type="button"
              className="btn btn-ghost btn-sm w-full"
              onClick={() => {
                setOpen(false)
                showToast('下载会在后台继续，设置页能看到进度')
              }}
            >
              收起，后台下载
            </button>
          )}

          {job?.phase === 'done' && (
            <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => dismiss('snooze')}>
              知道了
            </button>
          )}

          {(job?.phase === 'failed' || job?.phase === 'paused') && openInBrowser && (
            <button
              type="button"
              className="btn btn-ghost btn-sm w-full"
              onClick={() => openInBrowser?.(info.url)}
            >
              改用浏览器下载
            </button>
          )}

          {job === null && (
            <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => dismiss('snooze')}>
              稍后再说
            </button>
          )}

          {job === null && (
            <button
              type="button"
              className="faint"
              style={{ fontSize: '0.72rem', padding: '4px 0', background: 'none', border: 'none' }}
              onClick={() => dismiss('mute')}
            >
              跳过这个版本
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
