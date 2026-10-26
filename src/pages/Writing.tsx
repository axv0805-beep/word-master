import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { SectionTitle } from '../components/ui/Widgets'
import { getWritingPoolInfo } from '../data/writing'
import { WRITING_LEVEL_LABEL, WRITING_MODE_LABEL, type WritingLevel, type WritingMode } from '../core/writing'
import { useAppStore } from '../store/appStore'

const MODE_HINT: Record<WritingMode, string> = {
  drill: '一次练一个功能段落：留言、通知、书信、建议书，先把套路写熟',
  mock: '按考场要求写整篇，字数与提纲都要顾到'
}

const MODE_SOURCE: Record<WritingMode, string> = {
  drill: '题库题：按四六级常见应用文与小议论组织',
  mock: '往年场次仿真：2016–2026 常见命题方向重写'
}

function isWritingLevel(value: string | undefined): value is WritingLevel {
  return value === 'cet4' || value === 'cet6'
}

/** 某个级别的写作分类页：专项训练 / 真题模拟 */
export function WritingPage() {
  const navigate = useNavigate()
  const { level } = useParams()
  const writingRecords = useAppStore((state) => state.writingRecords)

  if (!isWritingLevel(level)) {
    return (
      <div className="px-4 pt-5">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          没有这个级别。
        </p>
        <button type="button" className="btn btn-soft btn-md mt-4" onClick={() => navigate('/learn')}>
          返回学习
        </button>
      </div>
    )
  }

  const label = WRITING_LEVEL_LABEL[level]
  const own = writingRecords.filter((record) => record.level === level)
  const best = own.reduce((max, record) => Math.max(max, record.score), 0)

  return (
    <div className="px-4 pt-5">
      <button type="button" className="back-link" onClick={() => navigate('/learn')} aria-label="返回学习">
        <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
        学习
      </button>

      <header className="mb-4 mt-2">
        <h1 style={{ fontSize: '1.42rem', fontWeight: 800 }}>{label}写作</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          写完提交，立刻查拼写与语法、给出分数和理由，再决定要不要看范文
        </p>
      </header>

      <SectionTitle title="选择练习方式" />
      <button type="button" className="btn btn-soft btn-md w-full mb-3" onClick={() => navigate(`/learn/ai/writing/${level}`)}>
        <Icon name="sparkle" size={16} />
        {label} AI 写作 · 在线批改
      </button>
      {(['drill', 'mock'] as const).map((mode) => {
        const info = getWritingPoolInfo(level, mode)
        const done = own.filter((record) => record.mode === mode).length
        return (
          <button
            key={mode}
            type="button"
            className="card listen-mode"
            onClick={() => navigate(`/learn/writing/${level}/${mode}`)}
          >
            <span className="listen-mode__icon" aria-hidden="true">
              <Icon name={mode === 'drill' ? 'pen' : 'target'} size={18} strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="listen-mode__title">
                {WRITING_MODE_LABEL[mode]}
                <span className="listen-mode__caption">
                  {info.total} 道题 · {done > 0 ? `已练 ${done} 次 · ` : ''}约 {info.minutes} 分钟
                </span>
              </span>
              <span className="listen-mode__hint">{MODE_HINT[mode]}</span>
              <span className="listen-mode__grade">{MODE_SOURCE[mode]}</span>
            </span>
            <Icon name="chevronRight" size={15} strokeWidth={2.2} />
          </button>
        )
      })}

      {best > 0 ? (
        <p className="listen-note">
          你在{label}写作里的最好成绩是 <strong>{best}</strong> 分（换算四六级 106.5 分制约 {Math.round((best / 100) * 106.5)} 分）。
        </p>
      ) : null}
      <p className="listen-note">
        每次随机抽一道题，写过的不会再抽到，题库写完自动重新开始。批改在本地完成，作文不会上传到任何服务器。
      </p>
      <p className="listen-note">
        题目按四六级常见命题方向重写，范文为原创示例，不是真题原文。
      </p>
    </div>
  )
}
