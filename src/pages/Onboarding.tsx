import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { ProgressBar, StepDots, Stepper } from '../components/ui/Widgets'
import { useToast } from '../components/ui/Toast'
import { useAppStore } from '../store/appStore'
import { useBookList } from '../hooks/useDictionary'
import { useStartRound } from '../hooks/useStartRound'
import {
  DAILY_GOAL_PRESETS,
  MAX_DAILY_GOAL,
  MIN_DAILY_GOAL,
  MIN_ROUND_SIZE,
  clampDailyGoal,
  clampRoundSizeFor,
  maxRoundSizeFor,
  roundSizePresetsFor
} from '../core/constants'
import { buildStudyPlan, formatFinishDate, humanizeDays } from '../core/plan'

const STEP_TITLES = ['选择要背的词书', '设定每天的目标', '你的学习计划']

export function OnboardingPage() {
  const navigate = useNavigate()
  const settings = useAppStore((state) => state.settings)
  const progress = useAppStore((state) => state.progress)
  const finishOnboarding = useAppStore((state) => state.finishOnboarding)
  const { books, loading, error } = useBookList()
  const { startRound, starting } = useStartRound()
  const showToast = useToast((state) => state.show)

  const [step, setStep] = useState(0)
  const [bookId, setBookId] = useState(settings.bookId)
  const [goal, setGoal] = useState(clampDailyGoal(settings.dailyGoal))
  const [roundSize, setRoundSize] = useState(settings.roundSize)

  const currentBook = books.find((book) => book.id === bookId) ?? books[0]

  // 每轮单词数的可选档位随每日目标变化：最低 10，最高不超过目标
  const roundPresets = useMemo(() => roundSizePresetsFor(goal), [goal])
  const maxRound = maxRoundSizeFor(goal)
  const effectiveRoundSize = clampRoundSizeFor(roundSize, goal, settings.roundSize)

  const studiedByBook = useMemo(() => {
    const map: Record<string, number> = {}
    for (const key of Object.keys(progress)) {
      const id = key.slice(0, key.indexOf(':'))
      map[id] = (map[id] ?? 0) + 1
    }
    return map
  }, [progress])

  const plan = useMemo(() => {
    if (!currentBook) return null
    return buildStudyPlan({
      bookId: currentBook.id,
      bookName: currentBook.name,
      totalWords: currentBook.count,
      studiedWords: studiedByBook[currentBook.id] ?? 0,
      dailyGoal: goal,
      roundSize: effectiveRoundSize
    })
  }, [currentBook, goal, effectiveRoundSize, studiedByBook])

  function confirm(): void {
    if (!currentBook) return
    finishOnboarding({ bookId: currentBook.id, dailyGoal: goal, roundSize: effectiveRoundSize })
  }

  async function startFirstRound(): Promise<void> {
    if (!currentBook) return
    confirm()
    await startRound({
      mode: 'alpha',
      bookId: currentBook.id,
      letter: 'A',
      onStarted: () => navigate('/study')
    })
  }

  return (
    <div className="px-5 pt-6 pb-10">
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center rounded-xl"
            style={{ width: 34, height: 34, background: 'linear-gradient(135deg, var(--brand-1), var(--brand-3))', color: '#fff' }}
          >
            <Icon name="sparkle" size={17} />
          </span>
          <span style={{ fontWeight: 800 }}>单词王</span>
        </div>
        <StepDots total={3} current={step} />
      </header>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{STEP_TITLES[step]}</h1>
      <p className="muted" style={{ fontSize: '0.82rem', marginTop: 6, lineHeight: 1.6 }}>
        {step === 0
          ? '选一本你现在最想拿下（或正在准备）的词书，之后随时可以在「词书」页切换。'
          : step === 1
            ? '每天计划背多少词？定一个能长期坚持的数字，比定得很高然后放弃更有效。'
            : '这是按你的选择推算出的计划，随时可以在设置里调整。'}
      </p>

      {/* 第一步：选词书 */}
      {step === 0 ? (
        <div className="mt-5">
          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="skeleton" style={{ height: 82 }} />
              ))}
            </div>
          ) : error ? (
            <div className="card p-5 text-center muted" style={{ fontSize: '0.84rem' }}>
              词书清单加载失败：{error}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {books.map((book) => {
                const active = book.id === bookId
                const studied = studiedByBook[book.id] ?? 0
                const ratio = book.count > 0 ? studied / book.count : 0
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => setBookId(book.id)}
                    className="card p-4 text-left"
                    style={{
                      borderColor: active ? 'var(--brand-2)' : 'var(--border)',
                      borderWidth: active ? 2 : 1,
                      boxShadow: active ? '0 14px 34px -22px var(--brand-glow)' : undefined,
                      color: 'var(--text)',
                      cursor: 'pointer'
                    }}
                    aria-pressed={active}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{book.name}</span>
                      <span
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: 22,
                          height: 22,
                          border: `1.5px solid ${active ? 'var(--brand-2)' : 'var(--border-strong)'}`,
                          background: active ? 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' : 'transparent',
                          color: '#fff',
                          flexShrink: 0
                        }}
                      >
                        {active ? <Icon name="check" size={13} strokeWidth={3} /> : null}
                      </span>
                    </div>
                    <div className="faint" style={{ fontSize: '0.74rem', marginTop: 3 }}>
                      {book.description} · 共 {book.count} 词
                      {studied > 0 ? ` · 已学 ${studied}` : ''}
                    </div>
                    {studied > 0 ? (
                      <div className="mt-2.5">
                        <ProgressBar value={ratio} />
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* 第二步：定目标 */}
      {step === 1 ? (
        <div className="mt-5">
          <div className="card p-5 flex flex-col items-center gap-1.5">
            <div className="muted" style={{ fontSize: '0.78rem' }}>每天背</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>{goal}</span>
              <span className="muted" style={{ fontSize: '0.9rem' }}>词</span>
            </div>
            <div className="mt-2">
              <Stepper
                value={goal}
                min={MIN_DAILY_GOAL}
                max={MAX_DAILY_GOAL}
                step={5}
                onChange={(value) => setGoal(value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {DAILY_GOAL_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`chip ${preset === goal ? 'chip-active' : ''}`}
                aria-pressed={preset === goal}
                onClick={() => setGoal(preset)}
              >
                {preset} 词/天
              </button>
            ))}
          </div>

          {/* 每轮单词数：可选档位跟着上面的每日目标变化 */}
          <div className="card p-4 mt-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>每轮单词数</div>
                <div className="faint" style={{ fontSize: '0.68rem', marginTop: 2 }}>
                  最低 {MIN_ROUND_SIZE}，最高不超过每天的目标（{maxRound}）
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {roundPresets.map((count) => {
                  const active = count === effectiveRoundSize
                  return (
                    <button
                      key={count}
                      type="button"
                      className={`chip ${active ? 'chip-active' : ''}`}
                      style={{ minWidth: 42, justifyContent: 'center' }}
                      aria-pressed={active}
                      aria-label={`本轮 ${count} 个单词`}
                      onClick={() => setRoundSize(count)}
                    >
                      {count}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {plan ? (
            <div
              className="card p-4 mt-5"
              style={{ background: 'var(--surface-3)', borderColor: 'transparent' }}
            >
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
                以每天 <strong>{goal}</strong> 词的速度，约需{' '}
                <strong style={{ color: 'var(--brand-2)', fontSize: '1.05rem' }}>{plan.days}</strong> 天背完
                <strong>{currentBook?.name}</strong>
                {plan.studiedWords > 0 ? `（还剩 ${plan.remainingWords} 词未学）` : `（共 ${plan.totalWords} 词）`}；
                每轮 {plan.roundSize} 词，每天约 {plan.roundsPerDay} 轮。
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 第三步：计划确认 */}
      {step === 2 && plan ? (
        <div className="mt-5">
          <section className="card-brand p-5 text-center">
            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>预计需要</div>
            <div style={{ fontSize: '3.1rem', fontWeight: 800, lineHeight: 1.1 }}>{plan.days}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>天背完</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: 6 }}>
              {humanizeDays(plan.days)} · 预计 {formatFinishDate(plan.finishDate)} 完成
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <div className="card p-3.5">
              <div className="faint" style={{ fontSize: '0.7rem' }}>词书</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{plan.bookName}</div>
            </div>
            <div className="card p-3.5">
              <div className="faint" style={{ fontSize: '0.7rem' }}>待学词数</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{plan.remainingWords} 词</div>
            </div>
            <div className="card p-3.5">
              <div className="faint" style={{ fontSize: '0.7rem' }}>每日目标</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{plan.dailyGoal} 词</div>
            </div>
            <div className="card p-3.5">
              <div className="faint" style={{ fontSize: '0.7rem' }}>每天约需</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>
                {plan.roundsPerDay} 轮（每轮 {plan.roundSize} 词）
              </div>
            </div>
          </div>

          <div className="card p-4 mt-3.5 flex items-start gap-2.5">
            <span style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }}>
              <Icon name="bulb" size={16} />
            </span>
            <p className="muted" style={{ fontSize: '0.78rem', lineHeight: 1.65 }}>
              按字母顺序从 A 开始往下背，答错的词会自动进错题本并按你设定的频率反复出现。
              计划随时可以在「设置」里调整。
            </p>
          </div>
        </div>
      ) : null}

      {/* 底部操作 */}
      <div className="flex flex-col gap-2.5 mt-6">
        {step < 2 ? (
          <button
            type="button"
            className="btn btn-primary btn-lg w-full"
            disabled={!currentBook}
            onClick={() => setStep(step + 1)}
          >
            下一步
            <Icon name="chevronRight" size={17} />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-lg w-full"
            disabled={starting}
            onClick={() => void startFirstRound()}
          >
            <Icon name="play" size={17} />
            {starting ? '准备中…' : '开始第一轮'}
          </button>
        )}

        <div className="flex gap-2.5">
          {step > 0 ? (
            <button
              type="button"
              className="btn btn-soft btn-md"
              style={{ flex: 1 }}
              onClick={() => setStep(step - 1)}
            >
              <Icon name="chevronLeft" size={16} />
              上一步
            </button>
          ) : null}
          {step === 2 ? (
            <button
              type="button"
              className="btn btn-soft btn-md"
              style={{ flex: 1 }}
              onClick={() => {
                confirm()
                showToast('计划已保存', 'success')
                navigate('/')
              }}
            >
              先回首页
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-md"
              style={{ flex: step > 0 ? 1 : undefined }}
              onClick={() => {
                confirm()
                navigate('/')
              }}
            >
              跳过引导
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
