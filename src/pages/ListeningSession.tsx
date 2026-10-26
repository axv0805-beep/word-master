import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { ProgressBar } from '../components/ui/Widgets'
import { getListeningSet, isListeningLevel, isListeningMode } from '../data/listening'
import { LEVEL_LABEL, MODE_LABEL, type ListeningItem, type ListeningLine } from '../core/listening'
import { speakLines, stopSpeaking, type SpeechHandle, type SpeechLine } from '../core/speech'

const LETTERS = ['A', 'B', 'C', 'D']

/** 三个说话人拆成两种音色：男声美音偏低、女声英音偏高、旁白居中 */
function toSpeechLines(material: ListeningLine[]): SpeechLine[] {
  return material.map((line) => {
    if (line.speaker === 'M') return { text: line.text, accent: 'us' as const, pitch: 0.82 }
    if (line.speaker === 'W') return { text: line.text, accent: 'uk' as const, pitch: 1.16 }
    return { text: line.text, accent: 'us' as const, pitch: 1 }
  })
}

export function ListeningSessionPage() {
  const navigate = useNavigate()
  const { level, mode } = useParams()

  const valid = isListeningLevel(level) && isListeningMode(mode)
  const set = useMemo(
    () => (valid ? getListeningSet(level, mode) : null),
    [valid, level, mode]
  )

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [playing, setPlaying] = useState(false)
  const [speechOk, setSpeechOk] = useState(true)
  const [finished, setFinished] = useState(false)
  const [showText, setShowText] = useState(false)

  const handleRef = useRef<SpeechHandle | null>(null)
  const item: ListeningItem | null = set?.items[index] ?? null

  const stopAudio = useCallback(() => {
    handleRef.current?.stop()
    handleRef.current = null
    setPlaying(false)
  }, [])

  useEffect(() => () => stopSpeaking(), [])

  const play = useCallback(async () => {
    if (!item) return
    if (playing) {
      stopAudio()
      return
    }
    stopSpeaking()
    const handle = speakLines(toSpeechLines(item.material))
    handleRef.current = handle
    setPlaying(true)
    const ok = await handle.done
    if (handleRef.current === handle) {
      handleRef.current = null
      setPlaying(false)
    }
    if (!ok) setSpeechOk(false)
  }, [item, playing, stopAudio])

  if (!valid || !set || !item) {
    return (
      <div className="px-4 pt-5">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          这套题不存在，可能链接过期了。
        </p>
        <button type="button" className="btn btn-soft btn-md mt-4" onClick={() => navigate('/learn')}>
          返回学习
        </button>
      </div>
    )
  }

  const total = set.items.length
  const correct = answers.reduce((sum, value, i) => (value === set.items[i].answer ? sum + 1 : sum), 0)
  const answered = picked !== null
  const last = index === total - 1

  function choose(option: number) {
    if (picked !== null) return
    setPicked(option)
    setAnswers((prev) => {
      const next = prev.slice()
      next[index] = option
      return next
    })
    stopAudio()
  }

  function next() {
    stopAudio()
    setPicked(null)
    setShowText(false)
    if (last) setFinished(true)
    else setIndex((value) => value + 1)
  }

  function restart() {
    stopAudio()
    setIndex(0)
    setPicked(null)
    setAnswers([])
    setFinished(false)
    setShowText(false)
  }

  if (finished) {
    const rate = total === 0 ? 0 : Math.round((correct / total) * 100)
    return (
      <div className="px-4 pt-5 listen-result">
        <button type="button" className="back-link" onClick={() => navigate(`/learn/listening/${level}`)}>
          <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
          {LEVEL_LABEL[level]}听力
        </button>
        <div className="listen-result__card">
          <p className="listen-result__label">{LEVEL_LABEL[level]} · {MODE_LABEL[mode]}</p>
          <p className="listen-result__score">
            {correct}
            <span> / {total}</span>
          </p>
          <p className="listen-result__rate">正确率 {rate}%</p>
          <div className="listen-result__bar">
            <ProgressBar value={total === 0 ? 0 : correct / total} ariaLabel="本次正确率" />
          </div>
        </div>
        <div className="listen-result__actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>
            <Icon name="refresh" size={16} strokeWidth={2.1} />
            再听一遍
          </button>
          <button type="button" className="btn btn-soft btn-lg" onClick={() => navigate('/learn')}>
            回学习页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5 listen-page">
      <div className="listen-top">
        <button
          type="button"
          className="back-link"
          onClick={() => {
            stopAudio()
            navigate(`/learn/listening/${level}`)
          }}
        >
          <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
          退出
        </button>
        <span className="listen-top__count">
          {index + 1} / {total}
        </span>
      </div>
      <div className="listen-progress">
        <ProgressBar value={(index + (answered ? 1 : 0)) / total} ariaLabel="练习进度" />
      </div>

      <div className="card listen-player" data-playing={playing ? 'true' : 'false'}>
        <span className="listen-player__section">{item.section}</span>
        <button
          type="button"
          className="listen-player__button"
          onClick={play}
          aria-label={playing ? '停止播放本段材料' : '播放本段材料'}
          aria-pressed={playing}
        >
          <Icon name={playing ? 'close' : 'play'} size={22} strokeWidth={2.1} />
        </button>
        <p className="listen-player__status" role="status">
          {playing ? '正在播放…（再点一次可重播）' : answered ? '需要的话可以再听一遍' : '点一下播放录音'}
        </p>
        {!speechOk && (
          <p className="listen-player__warn">
            这台设备的语音合成好像不可用，可以先看下面的原文作答。
          </p>
        )}
      </div>

      <p className="listen-stem">{item.stem}</p>
      <div className="listen-options">
        {item.options.map((option, i) => {
          const isPicked = picked === i
          const isAnswer = item.answer === i
          const state = answered ? (isAnswer ? 'correct' : isPicked ? 'wrong' : 'idle') : 'idle'
          return (
            <button
              key={option}
              type="button"
              className="listen-option"
              data-state={state}
              onClick={() => choose(i)}
              disabled={answered}
              aria-label={`${LETTERS[i]}. ${option}`}
            >
              <span className="listen-option__letter">{LETTERS[i]}</span>
              <span className="listen-option__text">{option}</span>
              {answered && isAnswer && <Icon name="check" size={15} strokeWidth={2.4} />}
              {answered && isPicked && !isAnswer && <Icon name="close" size={15} strokeWidth={2.4} />}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="listen-explain" data-correct={picked === item.answer}>
          <p className="listen-explain__head">
            {picked === item.answer ? '答对了' : `答错了，正确选项是 ${LETTERS[item.answer]}`}
          </p>
          <p className="listen-explain__body">{item.explain}</p>
          <p className="listen-explain__body listen-explain__summary">{item.summary}</p>
          <button type="button" className="listen-text-toggle" onClick={() => setShowText((value) => !value)} aria-expanded={showText}>
            {showText ? '收起原文' : '看原文'}
            <Icon name={showText ? 'chevronRight' : 'chevronRight'} size={12} strokeWidth={2.4} />
          </button>
          {showText && (
            <ol className="listen-transcript">
              {item.material.map((line, i) => (
                <li key={`${item.id}-line-${i}`} data-speaker={line.speaker}>
                  <span className="listen-transcript__who">
                    {line.speaker === 'N' ? '旁白' : line.speaker === 'M' ? '男声' : '女声'}
                  </span>
                  <span>{line.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="listen-footer">
        {answered ? (
          <button type="button" className="btn btn-primary btn-lg" onClick={next}>
            {last ? '看结果' : '下一题'}
            <Icon name="chevronRight" size={16} strokeWidth={2.2} />
          </button>
        ) : (
          <button type="button" className="btn btn-soft btn-lg" onClick={play}>
            <Icon name={playing ? 'close' : 'speaker'} size={16} strokeWidth={2} />
            {playing ? '停止' : '播放录音'}
          </button>
        )}
      </div>
    </div>
  )
}
