import { useEffect, useState } from 'react'
import { greetingFor, msUntilNextGreetingChange, type Greeting } from '../core/greeting'

/**
 * 随时间自动更新的问候语。
 *
 * 只在「时段分界」上重新计算（不是每秒轮询），另外在页面从后台切回前台时校准一次——
 * 手机浏览器休眠后会冻结定时器，不校准就会出现「晚上打开还显示早上好」。
 */
export function useGreeting(): Greeting {
  const [greeting, setGreeting] = useState<Greeting>(() => greetingFor(new Date()))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const refresh = () => setGreeting(greetingFor(new Date()))

    const schedule = () => {
      timer = setTimeout(() => {
        refresh()
        schedule()
      }, msUntilNextGreetingChange(new Date()))
    }
    schedule()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return greeting
}
