import { useEffect, useState } from 'react'
import { nativeApp, requestUpdateCheck, resolveManifestUrl } from '../core/native'
import type { UpdateInfo } from '../components/ui/UpdateProgress'

/** 一次打开里只查一次清单：启动弹窗和首页「有新版本」提示共用同一个结果 */
let sessionCheck: Promise<UpdateInfo | null> | null = null

function normalize(raw: string): UpdateInfo | null {
  try {
    const parsed = JSON.parse(raw) as Partial<UpdateInfo>
    if (!parsed || typeof parsed.url !== 'string' || typeof parsed.versionCode !== 'number') return null
    return {
      versionCode: parsed.versionCode,
      versionName: typeof parsed.versionName === 'string' ? parsed.versionName : '',
      url: resolveManifestUrl(parsed.url),
      notes: parsed.notes,
      sha256: parsed.sha256
    }
  } catch {
    return null
  }
}

/** 测试用：清掉会话缓存，让下一次调用重新走原生桥 */
export function resetUpdateCheckCache(): void {
  sessionCheck = null
}

/** 没有原生桥（网页端）时直接返回 null，不发请求 */
export function checkUpdateOnce(): Promise<UpdateInfo | null> {
  const app = nativeApp()
  if (!app) return Promise.resolve(null)
  if (!sessionCheck) {
    sessionCheck = new Promise<UpdateInfo | null>((resolve) => {
      const ok = requestUpdateCheck({
        onAvailable: (raw) => resolve(normalize(raw)),
        onNone: () => resolve(null),
        onError: () => resolve(null)
      })
      if (!ok) resolve(null)
    })
  }
  return sessionCheck
}

export interface UpdateCheckResult {
  /** 站点上的最新版本，没有更新或网页端时为 null */
  info: UpdateInfo | null
  /** 确实比当前安装的版本新 */
  newer: boolean
}

export function useUpdateCheck(): UpdateCheckResult {
  const [info, setInfo] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    let alive = true
    void checkUpdateOnce().then((result) => {
      if (alive && result) setInfo(result)
    })
    return () => {
      alive = false
    }
  }, [])

  const installed = nativeApp()?.versionCode() ?? 0
  return { info, newer: !!info && info.versionCode > installed }
}
