import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { ProgressBar } from '../components/ui/Widgets'
import { loadCorpus } from '../core/dictionaryLoader'
import { GENRE_LABEL, WRITING_LEVEL_LABEL, WRITING_MODE_LABEL, wordCount, type WritingMode } from '../core/writing'
import { buildSpellDictionary, gradeEssay } from '../core/writingGrader'
import { findWritingTask, getWritingPool, mergeWritingDrawn, pickWritingTask } from '../data/writing'
import { useAppStore } from '../store/appStore'
import { useWritingSession } from '../store/writingSession'

const KIND_LABEL: Record<'spelling' | 'grammar' | 'style', string> = {
  spelling: '拼写',
  grammar: '语法',
  style: '表达'
}

const MIN_SUBMIT_WORDS = 12

let dictionaryCache: Promise<Set<string>> | null = null

/** 词书词条 + 常见词，作为拼写检查的底表（只加载一次） */
function loadDictionary(): Promise<Set<string>> {
  if (!dictionaryCache) {
    dictionaryCache = loadCorpus()
      .then((entries) => buildSpellDictionary(entries.map((entry) => entry.w)))
      .catch(() => new Set<string>())
  }
  return dictionaryCache
}

/** 写作答题页：抽一道题 → 写 → 提交批改 → 决定是否看范文 */
export function WritingSessionPage() {
  const navigate = useNavigate()
  const { level, mode } = useParams()
  const markWritingDrawn = useAppStore((state) => state.markWritingDrawn)
  const recordWritingResult = useAppStore((state) => state.recordWritingResult)

  const session = useWritingSession()
  const [dictionary, setDictionary] = useState<Set<string>>(new Set())
  const [poolEmpty, setPoolEmpty] = useState(false)
  const [drawNotice, setDrawNotice] = useState<string | null>(null)
  const startRef = useRef(false)

  const valid = (level === 'cet4' || level === 'cet6') && (mode === 'drill' || mode === 'mock')
  const task = useMemo(
    () => (session.taskId ? findWritingTask(session.taskId) : null),
    [session.taskId]
  )

  useEffect(() => {
    let alive = true
    loadDictionary().then((dict) => {
      if (alive) setDictionary(dict)
    })
    return () => {
      alive = false
    }
  }, [])

  const draw = useCallback(() => {
    if (!valid) return
    const paperLevel = level as 'cet4' | 'cet6'
    const paperMode = mode as WritingMode
    const pool = getWritingPool(paperLevel, paperMode)
    if (pool.length === 0) {
      setPoolEmpty(true)
      return
    }
    const previous = useAppStore.getState().writingDrawn[`${paperLevel}:${paperMode}`] ?? []
    const round = pickWritingTask(paperLevel, paperMode, previous)
    if (!round) {
      setPoolEmpty(true)
      return
    }
    const next = mergeWritingDrawn(previous, round.task.id, pool.length, round.restarted)
    markWritingDrawn(paperLevel, paperMode, round.task.id, round.restarted)
    setDrawNotice(round.restarted ? '题库已经写过一轮，这次从头开始重新抽题。' : null)
    void next
    session.begin(paperLevel, paperMode, round.task.id)
  }, [valid, level, mode, markWritingDrawn, session])

  // 只有第一次进入（或者换了级别/模式）才抽题；从范文页返回时沿用原来那一篇
  useEffect(() => {
    if (!valid || startRef.current) return
    startRef.current = true
    const sameRound = session.taskId && session.level === level && session.mode === mode
    if (sameRound) return
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, level, mode])

  if (!valid) {
    return (
      <div className="px-4 pt-5">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          没有这个练习。
        </p>
        <button type="button" className="btn btn-soft btn-md mt-4" onClick={() => navigate('/learn')}>
          返回学习
        </button>
      </div>
    )
  }

  const paperLevel = level as 'cet4' | 'cet6'
  const paperMode = mode as WritingMode

  if (poolEmpty || !task) {
    return (
      <div className="px-4 pt-5">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          这个题库暂时没有题目。
        </p>
        <button type="button" className="btn btn-soft btn-md mt-4" onClick={() => navigate('/learn')}>
          返回学习
        </button>
      </div>
    )
  }

  const total = wordCount(session.text)
  const [minWords, maxWords] = task.wordRange
  const lengthRatio = Math.max(0, Math.min(1, total / Math.max(minWords, 1)))

  const submit = () => {
    const grade = gradeEssay(session.text, task, { dictionary })
    session.submit(grade)
    recordWritingResult({
      taskId: task.id,
      level: paperLevel,
      mode: paperMode,
      title: task.title,
      score: grade.score,
      band: grade.band,
      words: grade.stats.words
    })
    window.scrollTo({ top: 0 })
  }

  const grade = session.grade
  const showResult = session.submitted && grade

  return (
    <div className="px-4 pt-5 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="back-link"
          onClick={() => {
            session.reset()
            navigate(`/learn/writing/${paperLevel}`)
          }}
          aria-label="退出写作"
        >
          <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
          退出
        </button>
        <span className="writing-counter">
          {total} 词 / {minWords}–{maxWords}
        </span>
      </div>

      <header className="mt-3">
        <div className="writing-chips">
          <span className="learn-tag">{WRITING_LEVEL_LABEL[paperLevel]}</span>
          <span className="learn-tag">{WRITING_MODE_LABEL[paperMode]}</span>
          <span className="learn-tag">{GENRE_LABEL[task.genre]}</span>
          {task.source ? <span className="learn-tag">{task.source}</span> : null}
        </div>
        <h1 className="mt-3" style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.35 }}>
          {task.title}
        </h1>
      </header>

      <div className="card writing-prompt">
        <p className="writing-prompt__text">{task.prompt}</p>
        <ul className="writing-prompt__outline">
          {task.outline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="writing-prompt__meta">
          建议 {minWords}–{maxWords} 词 · 约 {task.minutes} 分钟
        </p>
      </div>

      {!showResult ? (
        <>
          <div className="writing-editor">
            <textarea
              className="writing-input"
              value={session.text}
              onChange={(event) => session.setText(event.target.value)}
              placeholder="在这里写英文，写完点下面的按钮批改。"
              spellCheck={false}
              aria-label="作文正文"
            />
            <div className="writing-editor__meter">
              <ProgressBar
                value={lengthRatio}
                tone={total >= minWords ? 'brand' : 'brand'}
                ariaLabel={`已写 ${total} 词`}
                className="writing-editor__bar"
              />
              <span className="writing-editor__count">
                {total < minWords ? `还差 ${minWords - total} 词到建议长度` : '已达到建议长度'}
              </span>
            </div>
          </div>

          {drawNotice ? <p className="listen-note">{drawNotice}</p> : null}

          <button
            type="button"
            className="btn btn-primary btn-lg writing-submit"
            onClick={submit}
            disabled={total < MIN_SUBMIT_WORDS}
          >
            提交批改
          </button>
          <p className="listen-note">
            批改在手机本地完成：查拼写、查语法、按内容与结构打分，作文不会上传到任何服务器。
            至少写 {MIN_SUBMIT_WORDS} 个词才能提交。
          </p>
        </>
      ) : (
        <>
          <section className="card writing-score" aria-live="polite">
            <div className="writing-score__head">
              <div>
                <p className="writing-score__label">本次得分</p>
                <p className="writing-score__value">
                  {grade.score}
                  <span> / 100</span>
                </p>
              </div>
              <div className="writing-score__band">
                <span>{grade.band}</span>
                <small>约 {grade.cetScore} / 106.5</small>
              </div>
            </div>

            <div className="writing-breakdown">
              {(
                [
                  ['内容', grade.breakdown.content, 30],
                  ['结构', grade.breakdown.structure, 20],
                  ['语言', grade.breakdown.language, 50]
                ] as const
              ).map(([label, value, max]) => (
                <div key={label} className="writing-breakdown__row">
                  <span className="writing-breakdown__label">{label}</span>
                  <ProgressBar value={value / max} ariaLabel={`${label} ${value} 分`} className="writing-breakdown__bar" />
                  <span className="writing-breakdown__value">
                    {value}/{max}
                  </span>
                </div>
              ))}
            </div>

            <p className="writing-score__stats">
              {grade.stats.words} 词 · {grade.stats.sentences} 句 · {grade.stats.paragraphs} 段 · 平均句长{' '}
              {grade.stats.avgSentence} 词
            </p>

            <ul className="writing-comments">
              {grade.comments.map((comment) => (
                <li key={comment}>{comment}</li>
              ))}
            </ul>
          </section>

          <section className="card writing-issues">
            <div className="writing-issues__head">
              <h2>需要改的地方</h2>
              <span>{grade.issues.length} 处</span>
            </div>
            {grade.issues.length === 0 ? (
              <p className="listen-note">没有查出明显的拼写和语法问题。</p>
            ) : (
              <ul>
                {grade.issues.map((issue) => (
                  <li key={`${issue.kind}-${issue.excerpt}-${issue.message}`} className="writing-issue">
                    <span className="writing-issue__kind" data-kind={issue.kind}>
                      {KIND_LABEL[issue.kind]}
                    </span>
                    <div className="writing-issue__body">
                      <p className="writing-issue__message">{issue.message}</p>
                      <p className="writing-issue__excerpt">“{issue.excerpt}”</p>
                      {issue.suggestion ? (
                        <p className="writing-issue__suggestion">建议改成：{issue.suggestion}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card writing-ask">
            <h2>要不要看看范文？</h2>
            <p>范文按这道题的提纲写，附 3 条可背的表达。看完可以回来改自己的作文。</p>
            <div className="writing-ask__actions">
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={() => navigate(`/learn/writing/${paperLevel}/${paperMode}/model/${task.id}`)}
              >
                查看范文
              </button>
              <button type="button" className="btn btn-soft btn-md" onClick={() => session.edit()}>
                先不改，回看我写的
              </button>
            </div>
          </section>

          <div className="writing-result__actions">
            <button
              type="button"
              className="btn btn-soft btn-md"
              onClick={() => {
                draw()
                window.scrollTo({ top: 0 })
              }}
            >
              换一道题
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-md"
              onClick={() => {
                session.reset()
                navigate(`/learn/writing/${paperLevel}`)
              }}
            >
              返回写作
            </button>
          </div>
        </>
      )}
    </div>
  )
}
