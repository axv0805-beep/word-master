import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { ProgressBar, SectionTitle, StatCard } from '../components/ui/Widgets'
import { LineChart } from '../components/ui/Charts'
import { ProgressRing } from '../components/ui/Charts'
import { useAppStore } from '../store/appStore'
import { useBookList } from '../hooks/useDictionary'
import { useStartRound } from '../hooks/useStartRound'
import { useGreeting } from '../hooks/useGreeting'
import { buildSeries, computeStreak, dateKey, ensureDay, totalMinutes, totalQuestions } from '../core/stats'
import { countMastered } from '../core/mistakes'
import { roundSizePresetsFor } from '../core/constants'
import { buildStudyPlan } from '../core/plan'

export function HomePage() {
  const navigate = useNavigate()
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const daily = useAppStore((state) => state.daily)
  const progress = useAppStore((state) => state.progress)
  const study = useAppStore((state) => state.study)
  const mistakes = useAppStore((state) => state.mistakes)
  const greeting = useGreeting()
  const { books } = useBookList()
  const { startRound, starting } = useStartRound()
  const [pending, setPending] = useState<'alpha' | 'random' | 'mistakes' | null>(null)

  const currentBook = books.find((book) => book.id === settings.bookId) ?? books[0]

  const today = useMemo(() => ensureDay(daily, dateKey(Date.now()), 0), [daily])

  const goalRatio = settings.dailyGoal > 0 ? today.questions / settings.dailyGoal : 0
  const todayAccuracy = today.questions > 0 ? today.correct / today.questions : 0
  const streak = computeStreak(daily)
  const series = buildSeries(daily, 7)
  const masteredCount = countMastered(progress)
  const mistakeCount = Object.keys(mistakes).length

  const studiedInBook = useMemo(() => {
    const prefix = `${settings.bookId}:`
    let count = 0
    for (const key of Object.keys(progress)) if (key.startsWith(prefix)) count += 1
    return count
  }, [progress, settings.bookId])

  const cursor = study.alphaCursor[settings.bookId] ?? 0
  const progressRatio = currentBook && currentBook.count > 0 ? studiedInBook / currentBook.count : 0
  const roundSizePresets = useMemo(() => roundSizePresetsFor(settings.dailyGoal), [settings.dailyGoal])

  const plan = useMemo(() => {
    if (!currentBook) return null
    return buildStudyPlan({
      bookId: currentBook.id,
      bookName: currentBook.name,
      totalWords: currentBook.count,
      studiedWords: studiedInBook,
      dailyGoal: settings.dailyGoal,
      roundSize: settings.roundSize
    })
  }, [currentBook, studiedInBook, settings.dailyGoal, settings.roundSize])

  async function handleStart(mode: 'alpha' | 'random' | 'mistakes') {
    setPending(mode)
    await startRound({ mode, onStarted: () => navigate('/study') })
    setPending(null)
  }

  return (
    <div className="px-4 pt-5">
      {/* 顶部问候 */}
      <header className="flex items-start justify-between mb-4">
        <div>
          <div className="muted" style={{ fontSize: '0.78rem' }}>
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
          <h1 style={{ fontSize: '1.42rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            {greeting.hello}，{greeting.remark}
          </h1>
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-3 py-1.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          title="连续打卡天数"
        >
          <span style={{ color: streak > 0 ? '#F59E0B' : 'var(--text-faint)' }}>
            <Icon name="flame" size={16} />
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{streak}</span>
          <span className="muted" style={{ fontSize: '0.7rem' }}>天</span>
        </div>
      </header>

      {/* 今日目标 */}
      <section className="card-brand p-5 relative overflow-hidden">
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -50,
            width: 170,
            height: 170,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.14)'
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
                style={{ background: '#fff', color: '#4F46E5', fontWeight: 700, padding: '0.68rem 1rem' }}
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
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.4)',
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
        <StatCard label="今日正确率" value={`${Math.round(todayAccuracy * 100)}%`} icon="target" accent="#10B981" />
        <StatCard label="累计练习" value={totalQuestions(daily)} hint={`${totalMinutes(daily)} 分钟`} icon="clock" accent="#6366F1" />
        <StatCard label="已掌握" value={masteredCount} hint="连续答对达标" icon="bulb" accent="#F59E0B" />
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
                  style={{ width: 40, height: 40, background: 'var(--surface-3)', color: '#8B5CF6' }}
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
                <div style={{ fontWeight: 700, color: '#8B5CF6' }}>{Math.round(progressRatio * 100)}%</div>
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
              style={{ width: 42, height: 42, background: 'rgba(244,63,94,0.14)', color: '#F43F5E' }}
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
