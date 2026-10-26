import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { GENRE_LABEL, WRITING_LEVEL_LABEL, WRITING_MODE_LABEL, wordCount } from '../core/writing'
import { findWritingTask } from '../data/writing'

/** 范文页：题目回顾 + 范文全文 + 亮点表达 */
export function WritingModelPage() {
  const navigate = useNavigate()
  const { level, mode, taskId } = useParams()
  const task = taskId ? findWritingTask(taskId) : null

  if (!task) {
    return (
      <div className="px-4 pt-5">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          找不到这篇范文。
        </p>
        <button type="button" className="btn btn-soft btn-md mt-4" onClick={() => navigate('/learn')}>
          返回学习
        </button>
      </div>
    )
  }

  const paperLevel = level ?? task.level
  const paperMode = mode ?? task.mode
  const modelWords = wordCount(task.model.essay)
  const paragraphs = task.model.essay
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className="px-4 pt-5 pb-10">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate(`/learn/writing/${paperLevel}/${paperMode}`)}
        aria-label="返回批改结果"
      >
        <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
        返回
      </button>

      <header className="mt-3 mb-4">
        <div className="writing-chips">
          <span className="learn-tag">{WRITING_LEVEL_LABEL[task.level]}</span>
          <span className="learn-tag">{WRITING_MODE_LABEL[task.mode]}</span>
          <span className="learn-tag">{GENRE_LABEL[task.genre]}</span>
          {task.source ? <span className="learn-tag">{task.source}</span> : null}
        </div>
        <h1 className="mt-3" style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.35 }}>
          {task.title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          范文 {modelWords} 词 · 建议 {task.wordRange[0]}–{task.wordRange[1]} 词
        </p>
      </header>

      <section className="card writing-model">
        <div className="writing-model__head">
          <Icon name="pen" size={15} strokeWidth={2} />
          <span>参考范文</span>
        </div>
        {paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 12)}`} className="writing-model__paragraph">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="card writing-highlights">
        <h2>可背的表达</h2>
        <ul>
          {task.model.highlights.map((item) => (
            <li key={item.phrase}>
              <p className="writing-highlight__phrase">{item.phrase}</p>
              <p className="writing-highlight__note">{item.note}</p>
            </li>
          ))}
        </ul>
        {task.model.structure ? (
          <p className="writing-highlights__structure">结构提示：{task.model.structure}</p>
        ) : null}
      </section>

      <section className="card writing-prompt">
        <p className="writing-prompt__text">{task.prompt}</p>
        <ul className="writing-prompt__outline">
          {task.outline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="writing-result__actions">
        <button
          type="button"
          className="btn btn-soft btn-md"
          onClick={() => navigate(`/learn/writing/${paperLevel}/${paperMode}`)}
        >
          回去改我的作文
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-md"
          onClick={() => navigate('/learn')}
        >
          回学习页
        </button>
      </div>
    </div>
  )
}
