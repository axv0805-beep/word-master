import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { WordInsights } from '../components/WordInsights'
import { ProgressBar } from '../components/ui/Widgets'
import { ProgressRing } from '../components/ui/Charts'
import { useAppStore } from '../store/appStore'
import { useSessionStore } from '../store/session'
import { useStartRound } from '../hooks/useStartRound'
import { canonicalTrans } from '../core/quiz'
import { speakWord, spellWord, stopSpeaking } from '../core/speech'
import { roundGrade } from '../core/stats'
import type { AnswerResult, DictEntry, Question, RoundResult, StudyMode } from '../core/types'

const MODE_LABEL: Record<StudyMode, string> = {
  alpha: '按字母顺序',
  random: '随机抽词',
  mistakes: '错题专项'
}

function phoneticOf(entry: DictEntry, accent: 'us' | 'uk'): string {
  const value = accent === 'us' ? entry.us ?? entry.uk : entry.uk ?? entry.us
  return value ? `/${value}/` : ''
}

export function StudyPage() {
  const navigate = useNavigate()
  const session = useSessionStore()
  const { engine, lastResult } = session
  const { startRound } = useStartRound()

  const [result, setResult] = useState<RoundResult | null>(null)
  const snapshot = useRef<AnswerResult[]>([])

  // 记录作答明细，供结算页展示错词
  useEffect(() => {
    if (engine) snapshot.current = [...engine.results]
  }, [engine, session.tick])

  // 所有题目答完（且最后一道题的反馈已关闭）后结算
  useEffect(() => {
    if (engine && !lastResult && engine.isDone && !result) {
      const finished = session.finish()
      if (finished) setResult(finished)
    }
  }, [engine, lastResult, result, session])

  useEffect(() => () => stopSpeaking(), [])

  if (!engine && !result) {
    return (
      <div className="px-6 pt-24 flex flex-col items-center gap-4 text-center">
        <div className="muted">当前没有进行中的练习</div>
        <button type="button" className="btn btn-primary btn-md" onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    )
  }

  if (result) {
    const wrongEntries: DictEntry[] = []
    const seenWrong = new Set<string>()
    for (const answer of snapshot.current) {
      if (answer.correct) continue
      const word = answer.question.entry.w
      if (seenWrong.has(word)) continue
      seenWrong.add(word)
      wrongEntries.push(answer.question.entry)
    }

    return (
      <RoundResultView
        result={result}
        wrongEntries={wrongEntries}
        onRestart={async () => {
          stopSpeaking()
          setResult(null)
          snapshot.current = []
          await startRound({ mode: result.mode, bookId: result.bookId, onStarted: () => undefined })
        }}
        onPracticeMistakes={async () => {
          stopSpeaking()
          setResult(null)
          snapshot.current = []
          await startRound({ mode: 'mistakes', onStarted: () => undefined })
        }}
        onHome={() => {
          stopSpeaking()
          navigate('/')
        }}
      />
    )
  }

  const question = engine!.current
  const total = engine!.total
  const answered = engine!.answered
  const mode = session.mode

  return (
    <div className="min-h-screen px-4 pt-5 pb-8">
      <header className="flex items-center gap-3 mb-4">
        <button
          type="button"
          className="btn btn-soft btn-sm"
          style={{ width: 34, height: 34, padding: 0 }}
          onClick={() => {
            session.abort()
            stopSpeaking()
            navigate('/')
          }}
          aria-label="退出练习"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="muted" style={{ fontSize: '0.76rem', fontWeight: 600 }}>
              {MODE_LABEL[mode]} · {answered}/{total} 题
            </span>
            <span className="muted" style={{ fontSize: '0.76rem' }}>
              正确率 {Math.round(engine!.accuracy * 100)}%
            </span>
          </div>
          <ProgressBar value={total === 0 ? 0 : answered / total} />
        </div>
      </header>

      {lastResult ? (
        <FeedbackView result={lastResult} onNext={() => session.dismissFeedback()} />
      ) : question ? (
        <QuestionView question={question} onSubmit={(input) => session.submit(input)} />
      ) : (
        <div className="muted text-center pt-16">正在准备下一题…</div>
      )}

      <p className="faint text-center mt-6" style={{ fontSize: '0.68rem' }}>
        题目种子 {engine!.seed} · 同一种子可复现同一套题
      </p>
    </div>
  )
}

/* ─────────── 答题区 ─────────── */

function QuestionView({ question, onSubmit }: { question: Question; onSubmit: (input: string) => void }) {
  const settings = useAppStore((state) => state.settings)
  const [typed, setTyped] = useState('')
  const [reveal, setReveal] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setTyped('')
    setReveal(0)
    if (question.type === 'en2zh' || question.type === 'listening') {
      if (settings.autoSpeak) void speakWord(question.entry.w, { accent: settings.accent, online: settings.onlineAudio })
    } else {
      stopSpeaking()
    }
    if (question.type === 'spelling') {
      const timer = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(timer)
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id])

  const typeHint = useMemo(() => {
    switch (question.type) {
      case 'zh2en':
        return '选出对应的英文单词'
      case 'en2zh':
        return '选出正确的中文释义'
      case 'listening':
        return '听发音，选出中文释义'
      case 'spelling':
        return '根据中文释义拼写单词'
      default:
        return ''
    }
  }, [question.type])

  const masked = useMemo(() => {
    const word = question.answer
    if (reveal === 0) return '•'.repeat(word.replace(/\s/g, '').length)
    return word
      .split('')
      .map((char, index) => (index < reveal ? char : char === ' ' ? ' ' : '•'))
      .join('')
  }, [question.answer, reveal])

  return (
    <div>
      <div className="flex items-center justify-center mb-3">
        <span className="chip chip-active" style={{ cursor: 'default' }}>
          {typeHint}
        </span>
      </div>

      {/* 题干卡片 */}
      <section className="card p-6 flex flex-col items-center text-center gap-3 min-h-[186px] justify-center">
        {question.type === 'zh2en' || question.type === 'spelling' ? (
          <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.45 }}>{question.prompt}</div>
        ) : null}

        {question.type === 'en2zh' ? (
          <>
            <div className="font-word" style={{ fontSize: '2.3rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {question.entry.w}
            </div>
            {phoneticOf(question.entry, settings.accent) ? (
              <div className="muted" style={{ fontSize: '0.94rem' }}>
                {phoneticOf(question.entry, settings.accent)}
              </div>
            ) : null}
          </>
        ) : null}

        {question.type === 'listening' ? (
          <>
            <button
              type="button"
              className="btn"
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: '#fff',
                boxShadow: '0 18px 40px -18px rgba(99,102,241,0.95)'
              }}
              onClick={() => void speakWord(question.entry.w, { accent: settings.accent, online: settings.onlineAudio })}
              aria-label="再听一次"
            >
              <Icon name="speaker" size={38} />
            </button>
            <span className="muted" style={{ fontSize: '0.78rem' }}>
              点击喇叭再听一次
            </span>
          </>
        ) : null}

        {question.type === 'spelling' ? (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="muted" style={{ fontSize: '0.84rem', letterSpacing: '0.06em' }}>
              {masked}
            </span>
            {settings.showPhoneticInSpelling && phoneticOf(question.entry, settings.accent) ? (
              <span className="faint" style={{ fontSize: '0.8rem' }}>
                {phoneticOf(question.entry, settings.accent)}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* 作答区 */}
      {question.type === 'spelling' ? (
        <form
          className="mt-4 flex flex-col gap-2.5"
          onSubmit={(event) => {
            event.preventDefault()
            if (typed.trim()) onSubmit(typed)
          }}
        >
          <input
            ref={inputRef}
            className="input"
            style={{ fontSize: '1.15rem', textAlign: 'center', letterSpacing: '0.04em' }}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="在这里拼写…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="text"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-soft btn-md"
              onClick={() => setReveal((value) => Math.min(question.answer.length, value + 1))}
              disabled={reveal >= question.answer.length}
            >
              <Icon name="bulb" size={15} />
              提示一个字母
            </button>
            <button
              type="button"
              className="btn btn-soft btn-md"
              onClick={() => void spellWord(question.entry.w, { accent: settings.accent, online: settings.onlineAudio })}
            >
              <Icon name="keyboard" size={15} />
              拼读
            </button>
            <button type="submit" className="btn btn-primary btn-md" style={{ flex: 1 }} disabled={!typed.trim()}>
              确定
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {(question.options ?? []).map((option) => (
            <button key={option} type="button" className="option" onClick={() => onSubmit(option)}>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────── 作答反馈 ─────────── */

function FeedbackView({ result, onNext }: { result: AnswerResult; onNext: () => void }) {
  const settings = useAppStore((state) => state.settings)
  const { question, correct, input } = result
  const entry = question.entry

  useEffect(() => {
    if (!correct) return
    // 答对后强化记忆：读出单词
    if (settings.autoSpeak) void speakWord(entry.w, { accent: settings.accent, online: settings.onlineAudio })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  return (
    <div className={correct ? 'animate-pop' : 'animate-shake'}>
      <div
        className="card p-5 flex items-center gap-3 mb-3.5"
        style={{
          borderColor: correct ? 'var(--correct)' : 'var(--wrong)',
          background: correct
            ? 'color-mix(in srgb, var(--correct) 12%, var(--surface))'
            : 'color-mix(in srgb, var(--wrong) 12%, var(--surface))'
        }}
      >
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: 42,
            height: 42,
            background: correct ? 'var(--correct)' : 'var(--wrong)',
            color: '#fff'
          }}
        >
          <Icon name={correct ? 'check' : 'close'} size={22} strokeWidth={2.4} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.02rem', color: correct ? 'var(--correct)' : 'var(--wrong)' }}>
            {correct ? '答对了！' : '答错了'}
          </div>
          <div className="muted" style={{ fontSize: '0.78rem' }}>
            {correct ? '继续保持这个节奏' : question.replay ? '这道错题又见面了' : '已经记入错题本'}
          </div>
        </div>
      </div>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-word" style={{ fontSize: '1.95rem', fontWeight: 700, lineHeight: 1.2 }}>
              {entry.w}
            </div>
            {phoneticOf(entry, settings.accent) ? (
              <div className="muted" style={{ fontSize: '0.9rem', marginTop: 2 }}>
                {phoneticOf(entry, settings.accent)}
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-soft btn-sm"
              style={{ width: 38, height: 38, padding: 0 }}
              onClick={() => void speakWord(entry.w, { accent: settings.accent, online: settings.onlineAudio })}
              aria-label="朗读单词"
            >
              <Icon name="speaker" size={18} />
            </button>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              style={{ width: 38, height: 38, padding: 0 }}
              onClick={() => void spellWord(entry.w, { accent: settings.accent, online: settings.onlineAudio })}
              aria-label="拼读单词"
            >
              <Icon name="keyboard" size={18} />
            </button>
          </div>
        </div>

        <div className="divider my-3.5" />

        <div className="flex flex-col gap-1.5">
          {entry.t.map((trans, index) => (
            <div key={index} style={{ fontSize: '0.98rem', lineHeight: 1.55 }}>
              {trans}
            </div>
          ))}
        </div>

        {!correct && input ? (
          <div className="mt-3.5 card-flat p-3">
            <span className="faint" style={{ fontSize: '0.74rem' }}>你的作答</span>
            <div style={{ color: 'var(--wrong)', fontWeight: 600, marginTop: 2 }}>{input}</div>
          </div>
        ) : null}
      </section>

      {/* 词形变化与易混词：只在词库里真实存在的词条上展示 */}
      <WordInsights entry={entry} />

      <button type="button" className="btn btn-primary btn-lg w-full mt-4" onClick={onNext} autoFocus>
        继续
        <Icon name="chevronRight" size={17} />
      </button>
    </div>
  )
}

/* ─────────── 结算页 ─────────── */

function RoundResultView({
  result,
  wrongEntries,
  onRestart,
  onPracticeMistakes,
  onHome
}: {
  result: RoundResult
  wrongEntries: DictEntry[]
  onRestart: () => void
  onPracticeMistakes: () => void
  onHome: () => void
}) {
  const settings = useAppStore((state) => state.settings)
  const { grade, label } = roundGrade(result.accuracy, result.answered)
  const seconds = Math.max(1, Math.round(result.durationMs / 1000))

  return (
    <div className="px-4 pt-8">
      <div className="flex flex-col items-center gap-3">
        <ProgressRing
          value={result.accuracy}
          size={168}
          stroke={13}
          label={grade}
          sublabel={`准确率 ${Math.round(result.accuracy * 100)}%`}
          gradientId="result-ring"
        />
        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{label}</div>
        <div className="muted" style={{ fontSize: '0.82rem' }}>
          本轮共作答 {result.answered} 题（计划 {result.planned} 题）
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-6">
        <div className="card p-3 text-center">
          <div className="faint" style={{ fontSize: '0.7rem' }}>答对</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--correct)' }}>{result.correct}</div>
        </div>
        <div className="card p-3 text-center">
          <div className="faint" style={{ fontSize: '0.7rem' }}>首答正确率</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{Math.round(result.firstTryAccuracy * 100)}%</div>
        </div>
        <div className="card p-3 text-center">
          <div className="faint" style={{ fontSize: '0.7rem' }}>用时</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>
            {seconds >= 60 ? `${Math.floor(seconds / 60)}′${seconds % 60}″` : `${seconds}″`}
          </div>
        </div>
      </div>

      {wrongEntries.length > 0 ? (
        <section className="mt-5">
          <div className="flex items-center justify-between mb-2.5">
            <h2 style={{ fontSize: '0.98rem', fontWeight: 700 }}>本轮错词（{wrongEntries.length}）</h2>
            <span className="faint" style={{ fontSize: '0.72rem' }}>已自动记入错题本</span>
          </div>
          <div className="card divide-y" style={{ borderColor: 'var(--border)' }}>
            {wrongEntries.map((entry) => (
              <div key={entry.w} className="flex items-center justify-between gap-3 px-4 py-3">
                <div style={{ minWidth: 0 }}>
                  <div className="font-word" style={{ fontWeight: 700, fontSize: '1.02rem' }}>
                    {entry.w}
                  </div>
                  <div className="muted" style={{ fontSize: '0.76rem' }}>{canonicalTrans(entry)}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  style={{ width: 34, height: 34, padding: 0, flexShrink: 0 }}
                  onClick={() => void speakWord(entry.w, { accent: settings.accent, online: settings.onlineAudio })}
                  aria-label={`朗读 ${entry.w}`}
                >
                  <Icon name="speaker" size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="card p-5 mt-5 flex items-center gap-3">
          <span style={{ fontSize: '1.6rem' }}>🎉</span>
          <div>
            <div style={{ fontWeight: 700 }}>本轮全对</div>
            <div className="muted" style={{ fontSize: '0.78rem' }}>错题本没有新增，稳！</div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 mt-6">
        <button type="button" className="btn btn-primary btn-lg" onClick={onRestart}>
          <Icon name="refresh" size={17} />
          再来一轮
        </button>
        <div className="flex gap-2.5">
          <button type="button" className="btn btn-soft btn-lg" style={{ flex: 1 }} onClick={onPracticeMistakes}>
            <Icon name="alert" size={16} />
            专练错题
          </button>
          <button type="button" className="btn btn-soft btn-lg" style={{ flex: 1 }} onClick={onHome}>
            <Icon name="home" size={16} />
            回到首页
          </button>
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
