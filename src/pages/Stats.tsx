import { useMemo, useState } from 'react'
import { Icon } from '../components/ui/Icons'
import { Heatmap } from '../components/ui/Heatmap'
import { BarChart, LineChart } from '../components/ui/Charts'
import { SectionTitle, Segmented, StatCard } from '../components/ui/Widgets'
import { useAppStore } from '../store/appStore'
import { countMastered } from '../core/mistakes'
import {
  activeDays,
  buildAchievements,
  buildSeries,
  computeStreak,
  roundGrade,
  totalCorrect,
  totalMinutes,
  totalQuestions
} from '../core/stats'

type Range = '7' | '30' | 'all'

export function StatsPage() {
  const daily = useAppStore((state) => state.daily)
  const rounds = useAppStore((state) => state.rounds)
  const progress = useAppStore((state) => state.progress)
  const mistakes = useAppStore((state) => state.mistakes)
  const settings = useAppStore((state) => state.settings)
  const [range, setRange] = useState<Range>('7')

  const questions = totalQuestions(daily)
  const correct = totalCorrect(daily)
  const accuracy = questions > 0 ? correct / questions : 0
  const mastered = countMastered(progress)
  const streak = computeStreak(daily)
  const days = activeDays(daily)
  const minutes = totalMinutes(daily)

  const series = useMemo(
    () => buildSeries(daily, range === 'all' ? 'all' : Number(range)),
    [daily, range]
  )

  const bestAccuracy = useMemo(
    () => rounds.reduce((best, round) => (round.answered >= 5 ? Math.max(best, round.accuracy) : best), 0),
    [rounds]
  )

  const achievements = useMemo(
    () =>
      buildAchievements({
        rounds,
        daily,
        mastered,
        mistakeCount: Object.keys(mistakes).length,
        streak,
        bestAccuracy
      }),
    [rounds, daily, mastered, mistakes, streak, bestAccuracy]
  )

  const recentRounds = rounds.slice(0, 12)

  return (
    <div className="px-4 pt-5">
      <header className="mb-4">
        <h1 style={{ fontSize: '1.42rem', fontWeight: 800 }}>统计与成长</h1>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
          练习痕迹、成长曲线与成就
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="累计题数" value={questions} icon="target" accent="#6366F1" />
        <StatCard label="总正确率" value={`${Math.round(accuracy * 100)}%`} icon="check" accent="#10B981" />
        <StatCard label="掌握词数" value={mastered} icon="bulb" accent="#F59E0B" />
        <StatCard label="连续打卡" value={`${streak} 天`} icon="flame" accent="#F43F5E" />
        <StatCard label="学习天数" value={days} icon="clock" accent="#8B5CF6" />
        <StatCard label="累计时长" value={`${minutes}′`} icon="chart" accent="#0EA5E9" />
      </div>

      <SectionTitle title="练习痕迹" action={<span className="faint" style={{ fontSize: '0.7rem' }}>最近 12 周</span>} />
      <div className="card p-4">
        <Heatmap daily={daily} weeks={12} goal={settings.dailyGoal} />
      </div>

      <SectionTitle
        title="成长曲线"
        action={
          <Segmented
            size="sm"
            options={[
              { value: '7' as Range, label: '7 天' },
              { value: '30' as Range, label: '30 天' },
              { value: 'all' as Range, label: '全部' }
            ]}
            value={range}
            onChange={setRange}
          />
        }
      />

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: '#8B5CF6' }}>
            <Icon name="chart" size={16} />
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>准确率趋势</span>
        </div>
        <LineChart
          values={series.map((point) => point.accuracy)}
          labels={series.map((point) => point.label)}
          height={130}
          formatValue={(value) => `${Math.round(value * 100)}%`}
        />
      </div>

      <div className="card p-4 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: '#6366F1' }}>
            <Icon name="target" size={16} />
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>每日练习量</span>
        </div>
        <BarChart
          values={series.map((point) => point.questions)}
          labels={series.map((point) => point.label)}
          height={92}
        />
      </div>

      <div className="card p-4 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: '#F59E0B' }}>
            <Icon name="bulb" size={16} />
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>累计掌握词数</span>
        </div>
        <LineChart
          values={series.map((point) => point.mastered)}
          labels={series.map((point) => point.label)}
          height={124}
          max={Math.max(10, ...series.map((point) => point.mastered))}
          color="#F59E0B"
          area={false}
          formatValue={(value) => `当前 ${value} 词`}
        />
      </div>

      <SectionTitle
        title="成就徽章"
        action={
          <span className="faint" style={{ fontSize: '0.7rem' }}>
            已解锁 {achievements.filter((item) => item.unlocked).length}/{achievements.length}
          </span>
        }
      />
      <div className="grid grid-cols-3 gap-2.5">
        {achievements.map((item) => (
          <div
            key={item.id}
            className="card p-3 flex flex-col items-center text-center gap-1"
            style={{ opacity: item.unlocked ? 1 : 0.55 }}
          >
            <span style={{ fontSize: '1.5rem', filter: item.unlocked ? 'none' : 'grayscale(1)' }}>{item.icon}</span>
            <span style={{ fontWeight: 700, fontSize: '0.76rem' }}>{item.name}</span>
            <span className="faint" style={{ fontSize: '0.62rem', lineHeight: 1.4 }}>{item.description}</span>
            <div className="w-full rounded-full mt-1" style={{ height: 4, background: 'var(--surface-2)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(item.progress * 100)}%`,
                  background: item.unlocked ? 'linear-gradient(90deg,#F59E0B,#EC4899)' : 'var(--border-strong)'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <SectionTitle title="练习记录" action={<span className="faint" style={{ fontSize: '0.7rem' }}>最近 {recentRounds.length} 轮</span>} />
      {recentRounds.length === 0 ? (
        <div className="card p-5 text-center muted" style={{ fontSize: '0.84rem' }}>
          还没有练习记录，完成一轮后会出现在这里
        </div>
      ) : (
        <div className="card divide-y" style={{ borderColor: 'var(--border)' }}>
          {recentRounds.map((round) => {
            const grade = roundGrade(round.accuracy, round.answered)
            const when = new Date(round.endedAt)
            return (
              <div key={round.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {round.mode === 'alpha' ? '字母顺序' : round.mode === 'random' ? '随机抽词' : '错题专项'} ·{' '}
                    {round.answered} 题
                  </div>
                  <div className="faint" style={{ fontSize: '0.7rem', marginTop: 2 }}>
                    {when.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {round.wrongWords.length > 0 ? ` · 错 ${round.wrongWords.length} 词` : ' · 全对'}
                  </div>
                </div>
                <div className="text-right" style={{ flexShrink: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: round.accuracy >= 0.9 ? 'var(--correct)' : round.accuracy >= 0.6 ? '#F59E0B' : 'var(--wrong)'
                    }}
                  >
                    {Math.round(round.accuracy * 100)}%
                  </div>
                  <div className="faint" style={{ fontSize: '0.66rem' }}>评级 {grade.grade}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ height: 16 }} />
    </div>
  )
}
