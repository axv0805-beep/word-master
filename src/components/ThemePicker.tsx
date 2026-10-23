import { Icon } from './ui/Icons'
import { THEMES } from '../core/theme'
import type { ThemeId } from '../core/types'

/**
 * 主题选择器：2 列色卡，色卡本身就是该主题的微缩截图
 * （背景 + 顶部弧光 + 一块玻璃卡片）。
 */
export function ThemePicker({ value, onChange }: { value: ThemeId; onChange: (id: ThemeId) => void }) {
  return (
    <div className="theme-grid" role="radiogroup" aria-label="选择主题">
      {THEMES.map((theme) => {
        const active = theme.id === value
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${theme.name}主题，${theme.tag}`}
            onClick={() => onChange(theme.id)}
            className={`theme-option${active ? ' is-active' : ''}`}
          >
            <span className="theme-swatch" style={{ background: theme.preview.bg }} aria-hidden="true">
              <span
                className="theme-swatch-glow"
                style={{ background: `linear-gradient(120deg, ${theme.preview.c1}, ${theme.preview.c2})` }}
              />
              <span
                className="theme-swatch-card"
                style={{ background: theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.78)' }}
              />
            </span>
            <span className="theme-meta">
              <span className="theme-name">{theme.name}</span>
              <span className="theme-tag">{theme.tag}</span>
            </span>
            {active ? (
              <span className="theme-check" aria-hidden="true">
                <Icon name="check" size={12} strokeWidth={3} />
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
