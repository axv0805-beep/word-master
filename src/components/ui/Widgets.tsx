import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icons'

export interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: IconName
  accent?: string
}

export function StatCard({ label, value, hint, icon, accent = 'var(--brand-1)' }: StatCardProps) {
  return (
    <div className="card p-3.5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5" style={{ fontSize: '0.72rem' }}>
        {icon ? (
          <span style={{ color: accent }}>
            <Icon name={icon} size={14} />
          </span>
        ) : null}
        <span className="muted">{label}</span>
      </div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      {hint ? <div className="faint" style={{ fontSize: '0.68rem' }}>{hint}</div> : null}
    </div>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-5 mb-2.5 px-0.5">
      <h2 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '0.01em' }}>{title}</h2>
      {action}
    </div>
  )
}

export function EmptyState({
  icon = 'sparkle',
  title,
  description,
  action
}: {
  icon?: IconName
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="card p-7 flex flex-col items-center text-center gap-2">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 54, height: 54, background: 'var(--surface-2)', color: 'var(--text-muted)' }}
      >
        <Icon name={icon} size={24} />
      </div>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {description ? (
        <p className="muted" style={{ fontSize: '0.82rem', lineHeight: 1.6, maxWidth: 260 }}>
          {description}
        </p>
      ) : null}
      {action}
    </div>
  )
}

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md'
}: {
  options: Array<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div
      className="inline-flex rounded-full p-1 gap-1"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="rounded-full font-semibold transition-all"
            style={{
              padding: size === 'sm' ? '0.28rem 0.7rem' : '0.42rem 0.95rem',
              fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
              background: active ? 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' : 'transparent',
              color: active ? 'var(--on-brand)' : 'var(--text-muted)',
              boxShadow: active ? '0 8px 18px -12px var(--brand-glow)' : 'none'
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export interface SheetProps {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** 底部弹出面板（移动端习惯的交互） */
export function Sheet({ open, title, onClose, children, footer }: SheetProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(2,6,23,0.62)', backdropFilter: 'blur(3px)', border: 'none' }}
      />
      <div
        className="relative w-full animate-floatUp"
        style={{
          maxWidth: 480,
          background: 'var(--bg)',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          border: '1px solid var(--border)',
          boxShadow: '0 -18px 50px -24px rgba(0,0,0,0.7)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="关闭">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="px-5 pb-4 overflow-y-auto hide-scrollbar" style={{ flex: 1 }}>
          {children}
        </div>
        {footer ? (
          <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            {footer}
          </div>
        ) : null}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </div>
  )
}

export interface ProgressBarProps {
  /** 0..1；indeterminate 为 true 时忽略 */
  value: number
  className?: string
  /** 拿不到总量时用来回滚动的条，避免看起来卡死在 0% */
  indeterminate?: boolean
  /** 无障碍名称：进度条是纯图形，读屏需要它才知道在表达什么 */
  ariaLabel?: string
  /** 失败态换成警示色，免得用户以为还在正常下载 */
  tone?: 'brand' | 'danger'
}

export function ProgressBar({ value, className, indeterminate = false, ariaLabel, tone = 'brand' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value))
  return (
    <div
      className={`w-full overflow-hidden rounded-full ${className ?? ''}`}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(clamped * 100)}
      aria-busy={indeterminate || undefined}
      style={{ height: 8, background: 'var(--surface-2)' }}
    >
      <div
        className={indeterminate ? 'h-full rounded-full progress-indeterminate' : 'h-full rounded-full'}
        style={{
          width: indeterminate ? '34%' : `${clamped * 100}%`,
          background:
            tone === 'danger'
              ? 'var(--wrong)'
              : 'linear-gradient(90deg, var(--brand-1), var(--brand-2) 55%, var(--brand-3))',
          transition: indeterminate ? 'none' : 'width 360ms cubic-bezier(0.2,0.8,0.2,1)'
        }}
      />
    </div>
  )
}

export interface StepperProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  suffix?: string
}

/** 加减步进器：设置页与引导页共用 */
export function Stepper({ value, min, max, step = 1, onChange, suffix }: StepperProps) {
  const clamp = (input: number) => Math.max(min, Math.min(max, input))
  return (
    <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        style={{ width: 30, height: 30, padding: 0 }}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label="减少"
      >
        −
      </button>
      <span style={{ minWidth: 54, textAlign: 'center', fontWeight: 700, fontSize: '0.92rem' }}>
        {value}
        {suffix ? <span className="faint" style={{ fontSize: '0.7rem', fontWeight: 500 }}>{suffix}</span> : null}
      </span>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        style={{ width: 30, height: 30, padding: 0 }}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label="增加"
      >
        +
      </button>
    </div>
  )
}

/** 引导流程顶部的步骤指示点 */
export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`第 ${current + 1} 步，共 ${total} 步`}>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          style={{
            width: index === current ? 22 : 8,
            height: 8,
            borderRadius: 999,
            background: index <= current ? 'linear-gradient(90deg, var(--brand-1), var(--brand-2))' : 'var(--surface-2)',
            transition: 'width 220ms ease'
          }}
        />
      ))}
    </div>
  )
}
