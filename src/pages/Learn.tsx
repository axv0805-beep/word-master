import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { SectionTitle } from '../components/ui/Widgets'
import { listListeningPools } from '../data/listening'
import { listWritingPools } from '../data/writing'

/**
 * 学习页：离线听力、写作题库与可选的 AI 辅导。
 * 词书入口不在这里——它留在首页的书名卡片和设置页里。
 */
export function LearnPage() {
  const navigate = useNavigate()
  const pools = listListeningPools()
  const writingPools = listWritingPools()

  const summary = (level: 'cet4' | 'cet6') => {
    const own = pools.filter((pool) => pool.level === level)
    const count = own.reduce((sum, pool) => sum + pool.total, 0)
    return `${count} 道题`
  }

  const writingSummary = (level: 'cet4' | 'cet6') =>
    `${writingPools.filter((pool) => pool.level === level).reduce((sum, pool) => sum + pool.total, 0)} 道题`

  return (
    <div className="px-4 pt-5">
      <header className="mb-4">
        <h1 style={{ fontSize: '1.42rem', fontWeight: 800 }}>学习</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          听懂、写清、记牢，把英语真正用起来
        </p>
      </header>

      <SectionTitle title="听力" />
      <div className="card px-4 py-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="learn-badge" aria-hidden="true">
            <Icon name="headphones" size={19} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <p style={{ fontWeight: 700, fontSize: '.95rem' }}>四六级听力</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              2016–2026 场次仿真，题库随时扩充，每轮随机 6 题
            </p>
          </div>
        </div>
        <div className="learn-levels">
          {(['cet4', 'cet6'] as const).map((level) => (
            <button
              key={level}
              type="button"
              className="learn-level"
              onClick={() => navigate(`/learn/listening/${level}`)}
            >
              <span style={{ fontWeight: 700 }}>{level === 'cet4' ? '四级' : '六级'}</span>
              <span className="learn-level__meta">{summary(level)}</span>
              <Icon name="chevronRight" size={14} strokeWidth={2.2} />
            </button>
          ))}
        </div>
      </div>

      <SectionTitle title="写作" />
      <div className="card px-4 py-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="learn-badge" aria-hidden="true">
            <Icon name="pen" size={19} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <p style={{ fontWeight: 700, fontSize: '.95rem' }}>四六级写作</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              写完提交，立刻查拼写与语法、给分并说明理由
            </p>
          </div>
        </div>
        <div className="learn-levels">
          {(['cet4', 'cet6'] as const).map((level) => (
            <button
              key={level}
              type="button"
              className="learn-level"
              onClick={() => navigate(`/learn/writing/${level}`)}
            >
              <span style={{ fontWeight: 700 }}>{level === 'cet4' ? '四级' : '六级'}</span>
              <span className="learn-level__meta">{writingSummary(level)}</span>
              <Icon name="chevronRight" size={14} strokeWidth={2.2} />
            </button>
          ))}
        </div>
      </div>
      <SectionTitle title="AI 学习工具" />
      <div className="card px-4 py-4 mb-5 flex flex-col gap-3">
        <div>
          <p style={{ fontWeight: 700 }}>四六级 AI 写作</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>登录后选择模型，获取逐句批改与表达建议</p>
          <div className="learn-levels">{(['cet4', 'cet6'] as const).map((level) => <button type="button" className="learn-level" key={level} onClick={() => navigate(`/learn/ai/writing/${level}`)}><span style={{ fontWeight: 700 }}>{level === 'cet4' ? '四级 AI 写作' : '六级 AI 写作'}</span><Icon name="chevronRight" size={14} /></button>)}</div>
        </div>
        {([{ id: 'association', title: 'AI 联想', hint: '用场景与关联词串起记忆' }, { id: 'examples', title: 'AI 例句', hint: '在自然语境里理解单词' }, { id: 'quiz', title: 'AI 出题', hint: '围绕目标词与错词做练习' }] as const).map((item) => <button className="ai-tool-link" key={item.id} onClick={() => navigate(`/learn/ai/${item.id}`)}><span><strong>{item.title}</strong><small>{item.hint}</small></span><Icon name="chevronRight" size={16} /></button>)}
        <button className="btn btn-soft btn-md" onClick={() => navigate('/learn/ai/history')}>查看生成记录</button>
      </div>
    </div>
  )
}
