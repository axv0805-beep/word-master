import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './ui/Icons'
import { useCorpus } from '../hooks/useCorpus'
import { analyzeWord } from '../core/wordInsights'
import { REASON_LABEL } from '../core/confusables'
import { speakWord } from '../core/speech'
import { useAppStore } from '../store/appStore'
import type { DictEntry } from '../core/types'

export function AiWordActions({ word }: { word: string }) {
  return <div className="ai-word-actions"><Link to={`/learn/ai/association?word=${encodeURIComponent(word)}`}>AI 联想</Link><Link to={`/learn/ai/examples?word=${encodeURIComponent(word)}`}>AI 例句</Link><Link to={`/learn/ai/quiz?word=${encodeURIComponent(word)}`}>围绕这个词出题</Link></div>
}

/**
 * 答完一题后的「词形变化 + 易混词」卡片。
 *
 * 只在词库里真实存在的词条上展示——每个词形/易混词都带着词典里真实的中文释义，
 * 不做规则凭空生成。语料库还没加载完时不占位，加载完再淡入。
 */
export function WordInsights({ entry }: { entry: DictEntry }) {
  const { index } = useCorpus()
  const settings = useAppStore((state) => state.settings)

  const insights = useMemo(() => {
    if (!index) return null
    return analyzeWord(entry.w, index)
  }, [entry.w, index])

  if (!index || !insights) return null

  const hasForms = insights.formGroups.length > 0
  const hasConfusables = insights.confusables.length > 0

  // 词库里确实没有相关数据时，给一句说明——否则用户会以为功能没生效
  if (!hasForms && !hasConfusables) {
    return (
      <div className="flex items-center gap-2 mt-3.5 px-1 animate-floatUp">
        <span className="faint" style={{ flexShrink: 0 }}>
          <Icon name="bulb" size={14} />
        </span>
        <span className="faint" style={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
          词典里没有收录「{entry.w}」的其它形式或易混词
        </span>
      </div>
    )
  }

  const speak = (word: string) => {
    void speakWord(word, { accent: settings.accent, online: settings.onlineAudio })
  }

  return (
    <div className="flex flex-col gap-2.5 mt-3.5 animate-floatUp">
      {hasForms ? (
        <section className="card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span style={{ color: 'var(--brand-1)' }}>
              <Icon name="refresh" size={15} />
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>词形变化</span>
            <span className="faint" style={{ fontSize: '0.66rem', marginLeft: 'auto' }}>
              共 {insights.forms.length} 个
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {insights.formGroups.map((group) => (
              <div key={group.pos}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="chip"
                    style={{
                      cursor: 'default',
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.66rem',
                      background: 'var(--surface-3)',
                      color: 'var(--brand-2)',
                      borderColor: 'transparent'
                    }}
                  >
                    {group.label}
                  </span>
                </div>
                <div className="flex flex-col">
                  {group.items.map((item) => (
                    <div key={item.word} className="flex items-center justify-between gap-2.5 py-1">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span className="font-word" style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                          {item.word}
                        </span>
                        <span className="muted" style={{ fontSize: '0.78rem', marginLeft: 8 }}>
                          {item.meaning}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ width: 28, height: 28, padding: 0, flexShrink: 0 }}
                        aria-label={`朗读 ${item.word}`}
                        onClick={() => speak(item.word)}
                      >
                        <Icon name="speaker" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasConfusables ? (
        <section className="card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span style={{ color: 'var(--wrong)' }}>
              <Icon name="alert" size={15} />
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>易混词</span>
            <span className="faint" style={{ fontSize: '0.66rem', marginLeft: 'auto' }}>
              别记串了
            </span>
          </div>

          <div className="flex flex-col">
            {insights.confusables.map((item) => (
              <div
                key={item.word}
                className="flex items-center justify-between gap-2.5 py-1.5"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="flex items-center gap-2">
                    <span className="font-word" style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                      {item.word}
                    </span>
                    <span
                      className="chip"
                      style={{
                        cursor: 'default',
                        padding: '0.08rem 0.4rem',
                        fontSize: '0.62rem',
                        background:
                          item.reason === 'sound'
                            ? 'rgba(16,185,129,0.16)'
                            : item.reason === 'shape'
                              ? 'rgba(99,102,241,0.16)'
                              : 'var(--surface-2)',
                        color:
                          item.reason === 'sound' ? 'var(--correct)' : item.reason === 'shape' ? '#8B5CF6' : 'var(--text-muted)',
                        borderColor: 'transparent'
                      }}
                    >
                      {REASON_LABEL[item.reason]}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '0.78rem', marginTop: 2, lineHeight: 1.5 }}>
                    {item.meaning}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ width: 28, height: 28, padding: 0, flexShrink: 0 }}
                  aria-label={`朗读 ${item.word}`}
                  onClick={() => speak(item.word)}
                >
                  <Icon name="speaker" size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
