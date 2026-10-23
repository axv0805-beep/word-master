import { useId, useMemo } from 'react'

export interface ProgressRingProps {
  /** 0..1 */
  value: number
  size?: number
  stroke?: number
  /** 环内主文本 */
  label?: string
  /** 环内次文本 */
  sublabel?: string
  gradientId?: string
  className?: string
}

/** 环形进度：今日目标、结算准确率都用它 */
export function ProgressRing({
  value,
  size = 128,
  stroke = 10,
  label,
  sublabel,
  gradientId = 'ring-grad',
  className
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference * clamped

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--brand-1)' }} />
            <stop offset="55%" style={{ stopColor: 'var(--brand-2)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--brand-3)' }} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        {clamped > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 520ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />
        ) : null}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        {label ? <span style={{ fontSize: size * 0.24, fontWeight: 700 }}>{label}</span> : null}
        {sublabel ? <span style={{ fontSize: size * 0.11 }} className="muted">{sublabel}</span> : null}
      </div>
    </div>
  )
}

export interface LineChartProps {
  /** 0..1 的数值序列 */
  values: number[]
  labels?: string[]
  height?: number
  /** 纵轴最大值，默认 1 */
  max?: number
  /** 是否填充面积 */
  area?: boolean
  color?: string
  formatValue?: (value: number) => string
  className?: string
}

/** 轻量 SVG 折线图：成长曲线（准确率 / 练习量） */
export function LineChart({
  values,
  labels,
  height = 132,
  max = 1,
  area = true,
  color = 'var(--brand-2)',
  formatValue,
  className
}: LineChartProps) {
  const width = 300
  const paddingX = 6
  const paddingY = 12
  /** 同一页可能有多个折线图，渐变 id 必须唯一，否则后一个会覆盖前一个的填充色 */
  const areaId = useId().replace(/:/g, '')
  const hasData = values.some((value) => value > 0)

  const { linePath, areaPath, points } = useMemo(() => {
    const count = values.length
    if (count === 0) return { linePath: '', areaPath: '', points: [] as Array<{ x: number; y: number }> }

    const stepX = count === 1 ? 0 : (width - paddingX * 2) / (count - 1)
    const scale = (value: number) => {
      const ratio = max === 0 ? 0 : Math.max(0, Math.min(1, value / max))
      return paddingY + (1 - ratio) * (height - paddingY * 2)
    }

    const pts = values.map((value, index) => ({
      x: paddingX + index * stepX,
      y: scale(value)
    }))

    const line = pts.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')
    const first = pts[0]
    const last = pts[pts.length - 1]
    const areaPathValue = `${line} L${last.x.toFixed(2)},${height - paddingY} L${first.x.toFixed(2)},${height - paddingY} Z`

    return { linePath: line, areaPath: areaPathValue, points: pts }
  }, [values, height, max])

  if (values.length === 0 || !hasData) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 muted ${className ?? ''}`}
        style={{ height }}
      >
        <span style={{ fontSize: '0.84rem' }}>暂无数据</span>
        <span className="faint" style={{ fontSize: '0.72rem' }}>完成练习后这里会绘制曲线</span>
      </div>
    )
  }

  const lastPoint = points[points.length - 1]
  const lastValue = values[values.length - 1]

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <defs>
          <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: color }} stopOpacity="0.36" />
            <stop offset="100%" style={{ stopColor: color }} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={0}
            x2={width}
            y1={paddingY + ratio * (height - paddingY * 2)}
            y2={paddingY + ratio * (height - paddingY * 2)}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}
        {area ? <path d={areaPath} fill={`url(#${areaId})`} /> : null}
        <path
          d={linePath}
          fill="none"
          style={{ stroke: color }}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {lastPoint ? (
          <>
            <circle cx={lastPoint.x} cy={lastPoint.y} r="6" style={{ fill: color }} opacity="0.22" />
            <circle cx={lastPoint.x} cy={lastPoint.y} r="3.2" style={{ fill: color }} />
          </>
        ) : null}
      </svg>
      <div className="flex items-center justify-between mt-1" style={{ fontSize: '0.7rem' }}>
        <span className="faint">{labels?.[0] ?? ''}</span>
        {formatValue ? <span className="muted">{formatValue(lastValue)}</span> : null}
        <span className="faint">{labels?.[labels.length - 1] ?? ''}</span>
      </div>
    </div>
  )
}

export interface BarChartProps {
  values: number[]
  labels?: string[]
  height?: number
  color?: string
  className?: string
}

/** 轻量柱状图：每日练习量 */
export function BarChart({ values, labels, height = 90, color = 'var(--brand-1)', className }: BarChartProps) {
  const max = Math.max(1, ...values)
  if (values.length === 0) {
    return (
      <div className={`flex items-center justify-center muted ${className ?? ''}`} style={{ height }}>
        暂无数据
      </div>
    )
  }
  return (
    <div className={className}>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {values.map((value, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-md"
            style={{
              height: `${Math.max(3, (value / max) * height)}px`,
              background: value > 0 ? color : 'var(--surface-2)',
              opacity: value > 0 ? 0.55 + 0.45 * (value / max) : 1,
              transition: 'height 320ms ease'
            }}
            title={`${labels?.[index] ?? ''} ${value}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-1" style={{ fontSize: '0.7rem' }}>
        <span className="faint">{labels?.[0] ?? ''}</span>
        <span className="faint">{labels?.[labels.length - 1] ?? ''}</span>
      </div>
    </div>
  )
}
