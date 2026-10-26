import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { SectionTitle } from '../components/ui/Widgets'
import { getListeningPoolInfo, isListeningLevel } from '../data/listening'
import { LEVEL_LABEL, MODE_LABEL, type ListeningMode } from '../core/listening'

const MODE_HINT: Record<ListeningMode, string> = {
  drill: '一题一段，逐题精听，适合先熟悉题型',
  mock: '材料更长、更接近整套题，建议一次做完'
}

const MODE_SOURCE: Record<ListeningMode, string> = {
  drill: '题库题：按四六级题型重写，题材覆盖短对话到新闻',
  mock: '往年场次仿真：2016–2026 各场次的题型与篇幅'
}

/** 某个级别的听力分类页：专项训练 / 真题模拟 */
export function ListeningPage() {
  const navigate = useNavigate()
  const { level } = useParams()

  if (!isListeningLevel(level)) {
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

  const label = LEVEL_LABEL[level]

  return (
    <div className="px-4 pt-5">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate('/learn')}
        aria-label="返回学习"
      >
        <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
        学习
      </button>

      <header className="mb-4 mt-2">
        <h1 style={{ fontSize: '1.42rem', fontWeight: 800 }}>{label}听力</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          先听材料、再选答案，答完立刻给解析和原文
        </p>
      </header>

      <SectionTitle title="选择练习方式" />
      {(['drill', 'mock'] as const).map((mode) => {
        const info = getListeningPoolInfo(level, mode)
        return (
          <button
            key={mode}
            type="button"
            className="card listen-mode"
            onClick={() => navigate(`/learn/listening/${level}/${mode}`)}
          >
            <span className="listen-mode__icon" aria-hidden="true">
              <Icon name={mode === 'drill' ? 'speaker' : 'target'} size={18} strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="listen-mode__title">
                {MODE_LABEL[mode]}
                <span className="listen-mode__caption">
                  {info.total} 道题 · 每轮随机 {info.roundSize} 道 · 约 {info.minutes} 分钟
                </span>
              </span>
              <span className="listen-mode__hint">{MODE_HINT[mode]}</span>
              <span className="listen-mode__grade">{MODE_SOURCE[mode]}</span>
            </span>
            <Icon name="chevronRight" size={15} strokeWidth={2.2} />
          </button>
        )
      })}

      <p className="listen-note">
        每次从题库里随机抽 6 道，抽过的题不会再抽到，整库抽完自动重新开始。答错的题会进「错题 → 听力」。
      </p>
      <p className="listen-note">
        音频由系统语音合成朗读：男声女声只用音高区分。材料是按真题题型重写的仿真题，不是真题原文。
      </p>
      <button type="button" className="btn btn-ghost btn-sm listen-voice-entry" onClick={() => navigate('/settings')}>
        音色听着别扭？去设置里换一把
      </button>
    </div>
  )
}
