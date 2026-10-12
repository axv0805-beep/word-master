import { create } from 'zustand'

interface ToastState {
  message: string
  tone: 'info' | 'success' | 'error'
  show: (message: string, tone?: 'info' | 'success' | 'error') => void
  clear: () => void
}

let timer: ReturnType<typeof setTimeout> | null = null

export const useToast = create<ToastState>((set) => ({
  message: '',
  tone: 'info',
  show: (message, tone = 'info') => {
    if (timer) clearTimeout(timer)
    set({ message, tone })
    timer = setTimeout(() => set({ message: '' }), 2400)
  },
  clear: () => {
    if (timer) clearTimeout(timer)
    set({ message: '' })
  }
}))

export function ToastHost() {
  const { message, tone } = useToast()
  if (!message) return null

  const color =
    tone === 'success' ? 'var(--correct)' : tone === 'error' ? 'var(--wrong)' : 'var(--text)'

  return (
    <div className="fixed left-0 right-0 z-[60] flex justify-center px-5" style={{ bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))' }}>
      <div
        className="animate-floatUp card px-4 py-2.5"
        style={{ borderColor: tone === 'info' ? 'var(--border)' : color, color, fontWeight: 600, fontSize: '0.84rem' }}
        role="status"
      >
        {message}
      </div>
    </div>
  )
}
