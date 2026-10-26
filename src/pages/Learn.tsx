import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { SectionTitle } from '../components/ui/Widgets'
import { listListeningSets } from '../data/listening'

/**
 * 学习页：听力已经能用，写作占个位。
 * 词书入口不在这里——它留在首页的书名卡片和设置页里。
 */
export function LearnPage() {
  const navigate = useNavigate()
  const sets = listListeningSets()

  const summary = (level: 'cet4' | 'cet6') => {
    const own = sets.filter((set) => set.level === level)
    const count = own.reduce((sum, set) => sum + set.items.length, 0)
    return `${count} 道题`
  }

  return (
    <div className="px-4 pt-5">
      <header className="mb-4">
        <h1 style={{ fontSize: '1.42rem', fontWeight: 800 }}>学习</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          按考试题型练听力，材料都带原文与解析
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
              短对话与短文，可重播、答完看原文
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
      <div className="card px-4 py-4 mb-5 learn-locked">
        <div className="flex items-center gap-3">
          <span className="learn-badge" aria-hidden="true">
            <Icon name="pen" size={19} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <p style={{ fontWeight: 700, fontSize: '.95rem' }}>
              写作 <span className="learn-tag">敬请期待</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              作文与翻译的批改正在做，先练听力和词书吧
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
