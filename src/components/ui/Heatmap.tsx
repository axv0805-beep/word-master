import { useMemo, useState } from 'react'
import type { DailyStat } from '../../core/types'
import { dateKey } from '../../core/stats'
import { DAY_MS } from '../../core/srs'

export interface HeatmapProps {
  daily: Record<string, DailyStat>
  /** 显示最近多少周 */
  weeks?: number
  goal?: number
  onPick?: (date: string) => void
}

const LEVEL_COLORS = ['var(--surface-2)', 'rgba(99,102,241,0.32)', 'rgba(99,102,241,0.55)', 'rgba(139,92,246,0.78)', 'rgba(236,72,153,0.92)']
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function levelOf(questions: number, goal: number): number {
  if (questions <= 0) return 0
  const unit = Math.max(5, Math.round(goal / 2))
  if (questions < unit) return 1
  if (questions < unit * 2) return 2
  if (questions < unit * 4) return 3
  return 4
}

/** 练习痕迹日历热力图（最近 N 周） */
export function Heatmap({ daily, weeks = 12, goal = 30, onPick }: HeatmapProps) {
  const [active, setActive] = useState<string | null>(null)

  const { columns, monthLabels } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const totalDays = weeks * 7
    const start = new Date(today.getTime() - (totalDays - 1) * DAY_MS)

    const days: string[] = []
    for (let i = 0; i < totalDays; i += 1) {
      days.push(dateKey(start.getTime() + i * DAY_MS))
    }

    const cols: string[][] = []
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7))
    }

    const labels: Array<{ index: number; text: string }> = []
    cols.forEach((col, index) => {
      const first = col[0]
      const month = Number(first.slice(5, 7))
      const prev = index > 0 ? Number(cols[index - 1][0].slice(5, 7)) : -1
      if (month !== prev) labels.push({ index, text: `${month}月` })
    })

    return { columns: cols, monthLabels: labels }
  }, [weeks])

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between pt-[18px]" style={{ fontSize: '0.62rem' }}>
          {WEEKDAYS.map((day, index) => (
            <span key={day} className="faint" style={{ height: 14, lineHeight: '14px', opacity: index % 2 === 0 ? 1 : 0 }}>
              {day}
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto hide-scrollbar">
          <div style={{ minWidth: columns.length * 15 }}>
            <div className="relative" style={{ height: 14 }}>
              {monthLabels.map((label) => (
                <span
                  key={`${label.index}-${label.text}`}
                  className="faint absolute"
                  style={{ left: label.index * 15, fontSize: '0.62rem' }}
                >
                  {label.text}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {columns.map((col, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-[3px]">
                  {col.map((day) => {
                    const stat = daily[day]
                    const questions = stat?.questions ?? 0
                    const level = levelOf(questions, goal)
                    const isActive = active === day
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setActive(isActive ? null : day)
                          onPick?.(day)
                        }}
                        title={`${day}：${questions} 题`}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          background: LEVEL_COLORS[level],
                          border: isActive ? '1.5px solid var(--text)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <span className="faint" style={{ fontSize: '0.68rem' }}>
          {active
            ? `${active}：${daily[active]?.questions ?? 0} 题，正确率 ${
                daily[active]?.questions
                  ? Math.round(((daily[active]?.correct ?? 0) / (daily[active]?.questions ?? 1)) * 100)
                  : 0
              }%`
            : '点击方块查看某天的练习情况'}
        </span>
        <div className="flex items-center gap-1">
          <span className="faint" style={{ fontSize: '0.68rem' }}>少</span>
          {LEVEL_COLORS.map((color, index) => (
            <span key={index} style={{ width: 10, height: 10, borderRadius: 3, background: color, border: '1px solid var(--border)' }} />
          ))}
          <span className="faint" style={{ fontSize: '0.68rem' }}>多</span>
        </div>
      </div>
    </div>
  )
}
