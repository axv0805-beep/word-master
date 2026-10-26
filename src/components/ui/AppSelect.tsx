import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icons'

interface SelectOption { value: string; label: string; description?: string }
interface AppSelectProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
}

/** Theme-aware choice sheet. Portaled outside forms so it cannot be clipped or submit them. */
export function AppSelect({ label, value, options, onChange, placeholder = '请选择', disabled, searchable = options.length > 6 }: AppSelectProps) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = options.find((option) => option.value === value)
  const visible = options.filter((option) => `${option.label} ${option.description ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    if (!open) return
    const opener = trigger.current
    const root = document.getElementById('root')
    const previousInert = root?.inert ?? false
    const previousOverflow = document.body.style.overflow
    if (root) root.inert = true
    document.body.style.overflow = 'hidden'
    const initial = panel.current?.querySelector<HTMLElement>(searchable ? 'input' : '[aria-selected="true"]')
      ?? panel.current?.querySelector<HTMLElement>('[role="option"]')
      ?? panel.current?.querySelector<HTMLElement>('button')
    initial?.focus()
    initial?.scrollIntoView?.({ block: 'nearest' })
    return () => {
      if (root) root.inert = previousInert
      document.body.style.overflow = previousOverflow
      opener?.focus({ preventScroll: true })
    }
  }, [open, searchable])

  function show() {
    if (trigger.current?.matches(':disabled')) return
    setQuery(''); setOpen(true)
  }

  return <div className="app-field">
    <label id={`${id}-label`} htmlFor={id}>{label}</label>
    <button ref={trigger} id={id} type="button" role="combobox" aria-labelledby={`${id}-label`}
      aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? `${id}-dialog` : undefined}
      disabled={disabled || !options.length} className="app-select-trigger" data-placeholder={!selected || undefined}
      onClick={show} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show() } }}>
      <span title={selected?.label}>{selected?.label ?? placeholder}</span>
      <span className="app-select-arrow"><Icon name="chevronRight" size={15} strokeWidth={2} /></span>
    </button>
    {open && (createPortal(<div className="app-select-overlay" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <div ref={panel} id={`${id}-dialog`} className="app-select-panel" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
          const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input') ?? [])
          if (event.key === 'Tab') {
            const index = nodes.indexOf(document.activeElement as HTMLElement)
            if (event.shiftKey && index <= 0) { event.preventDefault(); nodes[nodes.length - 1]?.focus() }
            else if (!event.shiftKey && index === nodes.length - 1) { event.preventDefault(); nodes[0]?.focus() }
          }
          const choices = Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])
          const index = choices.indexOf(document.activeElement as HTMLElement)
          const inSearch = (event.target as HTMLElement).tagName === 'INPUT'
          if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && (!inSearch || event.key === 'ArrowDown')) {
            event.preventDefault()
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : event.key === 'ArrowDown' ? (index + 1) % choices.length : (index - 1 + choices.length) % choices.length
            choices[next]?.focus(); choices[next]?.scrollIntoView?.({ block: 'nearest' })
          }
        }}>
        <div className="app-select-handle" aria-hidden="true" />
        <div className="app-select-header"><div><p>选择适合你的选项</p><h2 id={`${id}-title`}>{label}</h2></div>
          <button type="button" className="app-select-close" aria-label="关闭选择面板" onClick={() => setOpen(false)}><Icon name="close" size={18} /></button>
        </div>
        {searchable && <div className="app-select-search"><input aria-label={`搜索${label}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称…" /></div>}
        <div className="app-select-options" role="listbox" aria-label={label}>
          {visible.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value} className="app-select-option"
            onClick={() => { onChange(option.value); setOpen(false) }}>
            <span className="app-select-option-copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
            <span className="app-select-check" aria-hidden="true">{option.value === value && <Icon name="check" size={14} strokeWidth={2.6} />}</span>
          </button>)}
          {!visible.length && <p className="app-select-empty" role="status">没有匹配的选项，试试其他关键词。</p>}
        </div>
        <p className="app-select-footer">{selected ? `当前选择：${selected.label}` : '点选后自动应用'}</p>
      </div>
    </div>, document.body) as unknown as ReactNode)}
  </div>
}
