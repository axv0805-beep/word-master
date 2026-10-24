import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { ProgressBar, SectionTitle, StatCard } from '../components/ui/Widgets'
import { LineChart, ProgressRing } from '../components/ui/Charts'
import { useAppStore } from '../store/appStore'
import { useHomeSummary } from '../hooks/useHomeSummary'
import { useStartRound } from '../hooks/useStartRound'
import { useGreeting } from '../hooks/useGreeting'
import { useUpdateCheck } from '../hooks/useUpdateCheck'
import { useUpdateUi } from '../store/updateUi'
import { isVersionMuted } from '../core/updatePrefs'
import { buildSeries, totalMinutes, totalQuestions } from '../core/stats'
import type { HomeView } from '../core/types'

/**
 * 首页：同一份数据，两副面孔。
 * - 打卡页（默认）：一颗小树芽、已打卡天数、当前词书、新学/复习、开始学习
 * - 经典版：今日目标圆环、本轮单词数、速览、词书、错题、成长曲线
 * 右上角那颗按钮在两者之间切换，形变 + 交叉淡入由 CSS 负责。
 */
export function HomePage() {
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const summary = useHomeSummary()
  const greeting = useGreeting()

  const view: HomeView = settings.homeView ?? 'sprout'
  const dateLabel = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  return (
    <div className="px-4 pt-5">
      <header className="flex items-start justify-between mb-4">
        {view === 'sprout' ? (
          <div className="muted" style={{ fontSize: '0.78rem', paddingTop: 7 }}>
            {greeting.hello}
          </div>
        ) : (
          <div>
            <div className="muted" style={{ fontSize: '0.78rem' }}>
              {dateLabel}
            </div>
            <h1 style={{ fontSize: '1.42rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              {greeting.hello}，{greeting.remark}
            </h1>
          </div>
        )}
        <HomeViewToggle
          view={view}
          streak={summary.streak}
          onToggle={() => updateSettings({ homeView: view === 'sprout' ? 'classic' : 'sprout' })}
        />
      </header>

      <div className="home-swap" key={view}>
        {view === 'sprout' ? <SproutHome /> : <ClassicHome />}
      </div>
    </div>
  )
}

/** 右上角切换按钮：水滴 + 天数 与 小树芽 之间形变 */
function HomeViewToggle({ view, streak, onToggle }: { view: HomeView; streak: number; onToggle: () => void }) {
  const classic = view === 'classic'
  return (
    <button
      type="button"
      className="home-toggle"
      data-view={view}
      onClick={onToggle}
      aria-label={classic ? '切换到打卡页' : '切换到今日主页'}
      title={classic ? '切换到打卡页' : '切换到今日主页'}
    >
      <span className="home-toggle__layer home-toggle__classic" aria-hidden={!classic}>
        <span style={{ color: streak > 0 ? 'var(--warning)' : 'var(--text-faint)', display: 'inline-flex' }}>
          <Icon name="flame" size={15} />
        </span>
        <span className="home-toggle__streak">{streak}</span>
        <span className="home-toggle__unit">天</span>
      </span>
      <span className="home-toggle__layer home-toggle__sprout" aria-hidden={classic}>
        <Icon name="sprout" size={21} strokeWidth={2} />
      </span>
    </button>
  )
}

/** 打卡页：图二那张脸 */
function SproutHome() {
  const navigate = useNavigate()
  const settings = useAppStore((state) => state.settings)
  const { currentBook, today, streak, studiedInBook, progressRatio, newWordsToday, mistakeCount, dueReviewCount } =
    useHomeSummary()
  const { startRound, starting } = useStartRound()
  const [startingRound, setStartingRound] = useState(false)
  const [reviewHintOpen, setReviewHintOpen] = useState(false)
  const { info: updateInfo, newer: updateNewer } = useUpdateCheck()
  const openUpdateSheet = useUpdateUi((state) => state.openSheet)
  const updateReady = updateNewer && !!updateInfo && !isVersionMuted(updateInfo.versionCode)

  async function handleStart() {
    setStartingRound(true)
    await startRound({ mode: 'alpha', onStarted: () => navigate('/study') })
    setStartingRound(false)
  }

  const goalMet = today.questions >= settings.dailyGoal
  const statusText = goalMet
    ? '今日已完成'
    : today.questions > 0
      ? `今天已学 ${today.questions} / ${settings.dailyGoal} 题`
      : '今天还没开始'

  return (
    <div className="sprout">
      <section className="sprout-hero">
        <div className="sprout-hero__label">
          已打卡天数
          <Icon name="heart" size={11} strokeWidth={2.2} />
        </div>
        <div className="sprout-hero__count" aria-label={`已连续打卡 ${streak} 天`}>
          {streak}
        </div>
        <div className="sprout-hero__status">{statusText}</div>
      </section>

      <button type="button" className="card sprout-book" onClick={() => navigate('/books')}>
        <span className="sprout-book__row">
          <span className="sprout-book__name">
            {currentBook ? currentBook.name : '还没有词书'}
            <Icon name="chevronRight" size={14} />
          </span>
          <span className="sprout-book__vocab">
            <Icon name="book" size={15} strokeWidth={1.9} />
            词书
          </span>
        </span>
        <span className="sprout-book__row sprout-book__row--meta">
          <span>已学 {(progressRatio * 100).toFixed(1)}%</span>
          <span>
            {studiedInBook}/{currentBook ? currentBook.count : 0} 词
          </span>
        </span>
        <ProgressBar value={progressRatio} className="sprout-book__bar" />
      </button>

      <div className="sprout-metrics">
        <div className="sprout-metric">
          <span className="sprout-metric__label">新学词</span>
          <span className="sprout-metric__value">
            {newWordsToday}
            <i>/{settings.dailyGoal}</i>
          </span>
        </div>
        <div className="sprout-metric">
          <span className="sprout-metric__label">
            复习词
            <button
              type="button"
              className="sprout-hint"
              aria-expanded={reviewHintOpen}
              aria-controls="sprout-review-hint"
              aria-label="复习词是怎么算的"
              onClick={() => setReviewHintOpen((open) => !open)}
            >
              ?
            </button>
          </span>
          <span className="sprout-metric__value">
            {dueReviewCount}
            <i>/{mistakeCount}</i>
          </span>
        </div>
      </div>

      {reviewHintOpen && (
        <div className="sprout-note" id="sprout-review-hint">
          <p>
            复习词只算<strong>错题本</strong>里到期的词：刚上手错得少，这里几乎是 0；错题攒起来后会慢慢变多，
            每轮练习会按「错题重现频率」把它们插回来。
          </p>
          <div className="sprout-note__actions">
            <button type="button" className="btn btn-soft btn-sm" onClick={() => navigate('/settings')}>
              调整重现频率
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReviewHintOpen(false)}>
              知道了
            </button>
          </div>
        </div>
      )}

      {updateReady && updateInfo && (
        <button type="button" className="sprout-update" onClick={() => openUpdateSheet(updateInfo)}>
          <span className="sprout-update__dot" aria-hidden="true" />
          <span className="sprout-update__text">
            有新版本 <strong>v{updateInfo.versionName}</strong>
          </span>
          <span className="sprout-update__cta">
            去更新
            <Icon name="chevronRight" size={12} strokeWidth={2.4} />
          </span>
        </button>
      )}
      <button type="button" className="btn sprout-start" onClick={() => void handleStart()} disabled={starting}>
        <span className="sprout-start__play">
          <Icon name="play" size={14} strokeWidth={2.6} />
        </span>
        {startingRound || starting ? '准备中…' : '开始学习'}
      </button>
    </div>
  )
}

/** 经典版：原来的今日主页，去掉页头（页头由 HomePage 统一渲染） */
function ClassicHome() {
  const navigate = useNavigate()
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const daily = useAppStore((state) => state.daily)
  const {
    currentBook,
    today,
    todayAccuracy,
    studiedInBook,
    progressRatio,
    cursor,
    plan,
    roundSizePresets,
    masteredCount,
    mistakeCount
  } = useHomeSummary()
  const { startRound, starting } = useStartRound()
  const [pending, setPending] = useState<'alpha' | 'random' | 'mistakes' | null>(null)

  const goalRatio = settings.dailyGoal > 0 ? today.questions / settings.dailyGoal : 0
  const series = useMemo(() => buildSeries(daily, 7), [daily])

  async function handleStart(mode: 'alpha' | 'random' | 'mistakes') {
    setPending(mode)
    await startRound({ mode, onStarted: () => navigate('/study') })
    setPending(null)
  }

  return (
    <div>
      {/* 今日目标 */}
      <section className="card-brand p-5 relative overflow-hidden">
        <div
          style={{
            position: 'absolute',
            right: -46,
            top: -58,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background:
              'conic-gradient(from 195deg, rgba(255,255,255,0.34), rgba(255,255,255,0.05) 42%, transparent 68%)',
            filter: 'blur(3px)'
          }}
        />
        <div className="flex items-center justify-between gap-4 relative">
          <div className="flex flex-col gap-3">
            <div>
              <div style={{ fontSize: '0.78rem', opacity: 0.86 }}>今日目标</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.15 }}>
                {today.questions}
                <span style={{ fontSize: '0.9rem', opacity: 0.86, fontWeight: 600 }}> / {settings.dailyGoal} 题</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-md"
                style={{ background: 'var(--on-brand)', color: 'var(--brand-1)', fontWeight: 700, padding: '0.68rem 1rem' }}
                onClick={() => void handleStart('alpha')}
                disabled={starting}
              >
                <Icon name="play" size={16} strokeWidth={2.2} />
                {pending === 'alpha' ? '准备中…' : cursor > 0 ? '继续学习' : '开始学习'}
              </button>
              <button
                type="button"
                className="btn btn-md"
                style={{
                  background: 'rgba(15,23,42,0.26)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.68rem 1rem'
                }}
                onClick={() => void handleStart('random')}
                disabled={starting}
              >
                <Icon name="shuffle" size={15} />
                随机
              </button>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <ProgressRing
              value={goalRatio}
              size={108}
              stroke={9}
              label={`${Math.round(Math.min(1, goalRatio) * 100)}%`}
              sublabel={today.questions >= settings.dailyGoal ? '已达成' : '完成度'}
              gradientId="home-ring"
            />
          </div>
        </div>
      </section>

      {/* 本轮单词数：直接在首页选，上限跟随每日目标 */}
      <section className="card p-3.5 mt-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>本轮单词数</div>
            <div className="faint" style={{ fontSize: '0.68rem', marginTop: 2 }}>
              可选 {roundSizePresets[0]} – {roundSizePresets[roundSizePresets.length - 1]} 个（不超过每日目标{' '}
              {settings.dailyGoal} 词）
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {roundSizePresets.map((count) => {
              const active = count === settings.roundSize
              return (
                <button
                  key={count}
                  type="button"
                  className={`chip ${active ? 'chip-active' : ''}`}
                  style={{ minWidth: 42, justifyContent: 'center' }}
                  aria-pressed={active}
                  aria-label={`本轮 ${count} 个单词`}
                  onClick={() => updateSettings({ roundSize: count })}
                >
                  {count}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 今日速览 */}
      <div className="grid grid-cols-3 gap-2.5 mt-3.5">
        <StatCard label="今日正确率" value={`${Math.round(todayAccuracy * 100)}%`} icon="target" accent="var(--correct)" />
        <StatCard label="累计练习" value={totalQuestions(daily)} hint={`${totalMinutes(daily)} 分钟`} icon="clock" accent="var(--brand-1)" />
        <StatCard label="已掌握" value={masteredCount} hint="连续答对达标" icon="bulb" accent="var(--warning)" />
      </div>

      {/* 当前词书 */}
      {currentBook ? (
        <section className="mt-4">
          <SectionTitle
            title="当前词书"
            action={
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/books')}>
                切换
                <Icon name="chevronRight" size={14} />
              </button>
            }
          />
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 40, height: 40, background: 'var(--surface-3)', color: 'var(--brand-2)' }}
                >
                  <Icon name="book" size={20} />
                </span>
                <div>
                  <div style={{ fontWeight: 700 }}>{currentBook.name}</div>
                  <div className="faint" style={{ fontSize: '0.72rem' }}>
                    共 {currentBook.count} 词 · 已学 {studiedInBook}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--brand-2)' }}>{Math.round(progressRatio * 100)}%</div>
                <div className="faint" style={{ fontSize: '0.68rem' }}>学习进度</div>
              </div>
            </div>
            <ProgressBar value={progressRatio} />
            <div className="flex items-center justify-between mt-3">
              <span className="faint" style={{ fontSize: '0.72rem' }}>
                {plan && plan.days > 0
                  ? `每天 ${plan.dailyGoal} 词 · 预计还需 ${plan.days} 天背完`
                  : `字母进度：第 ${cursor + 1} 个词之后`}
              </span>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/books')}>
                <Icon name="sortAz" size={14} />
                按字母选起点
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* 错题专项 */}
      <section className="mt-4">
        <SectionTitle title="错题专项练习" />
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center rounded-xl"
              style={{ width: 42, height: 42, background: 'color-mix(in srgb, var(--wrong) 16%, transparent)', color: 'var(--wrong)' }}
            >
              <Icon name="alert" size={21} />
            </span>
            <div>
              <div style={{ fontWeight: 700 }}>{mistakeCount > 0 ? `${mistakeCount} 个错词待攻克` : '暂无错题'}</div>
              <div className="faint" style={{ fontSize: '0.72rem' }}>
                重现频率：{describeReplay(settings.mistakeReplayMode, settings.mistakeReplayInterval)}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-soft btn-md"
            disabled={mistakeCount === 0 || starting}
            onClick={() => void handleStart('mistakes')}
          >
            {pending === 'mistakes' ? '准备中…' : '开始'}
          </button>
        </div>
      </section>

      {/* 成长曲线 */}
      <section className="mt-4">
        <SectionTitle
          title="近 7 天正确率"
          action={
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/stats')}>
              详细统计
              <Icon name="chevronRight" size={14} />
            </button>
          }
        />
        <div className="card p-4">
          <LineChart
            values={series.map((point) => point.accuracy)}
            labels={series.map((point) => point.label)}
            height={120}
            formatValue={(value) => `最近 ${Math.round(value * 100)}%`}
          />
        </div>
      </section>

      <div style={{ height: 8 }} />
    </div>
  )
}

export function describeReplay(mode: string, interval: number): string {
  switch (mode) {
    case 'immediate':
      return '答错后隔 1 题重出'
    case 'interval':
      return `每 ${interval} 题重现`
    case 'endOfRound':
      return '轮末集中复习'
    case 'srs':
      return '智能间隔（艾宾浩斯）'
    default:
      return '未设置'
  }
}
