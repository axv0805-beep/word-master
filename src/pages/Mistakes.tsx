import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { EmptyState, SectionTitle, Segmented } from '../components/ui/Widgets'
import { useToast } from '../components/ui/Toast'
import { useAppStore } from '../store/appStore'
import { useStartRound } from '../hooks/useStartRound'
import { useBookList } from '../hooks/useDictionary'
import { speakWord, spellWord } from '../core/speech'
import type { MistakeEntry } from '../core/types'

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const minute = 60 * 1000
  if (diff < minute) return '刚刚'
  if (diff < 60 * minute) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))} 小时前`
  const days = Math.floor(diff / (24 * 60 * minute))
  if (days < 30) return `${days} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

export function MistakesPage() {
  const navigate = useNavigate()
  const settings = useAppStore((state) => state.settings)
  const mistakes = useAppStore((state) => state.mistakes)
  const dropMistake = useAppStore((state) => state.dropMistake)
  const clearMistakeBook = useAppStore((state) => state.clearMistakeBook)
  const { books } = useBookList()
  const { startRound, starting } = useStartRound()
  const showToast = useToast((state) => state.show)

  const [scope, setScope] = useState<'current' | 'all'>('current')
  const [sortBy, setSortBy] = useState<'wrong' | 'recent'>('wrong')

  const list = useMemo(() => {
    const all = Object.values(mistakes)
    const filtered = scope === 'all' ? all : all.filter((item) => item.bookId === settings.bookId)
    return filtered.slice().sort((a, b) =>
      sortBy === 'recent' ? b.lastWrongAt - a.lastWrongAt : b.wrong - a.wrong || b.lastWrongAt - a.lastWrongAt
    )
  }, [mistakes, scope, settings.bookId, sortBy])

  const totalInBook = useMemo(
    () => Object.values(mistakes).filter((item) => item.bookId === settings.bookId).length,
    [mistakes, settings.bookId]
  )

  function bookName(bookId: string): string {
    return books.find((book) => book.id === bookId)?.name ?? bookId
  }

  async function practice() {
    await startRound({ mode: 'mistakes', onStarted: () => navigate('/study') })
  }

  return (
    <div className="px-4 pt-5">
      <header className="mb-4">
        <h1 style={{ fontSize: '1.42rem', fontWeight: 800 }}>错题本</h1>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
          共 {Object.keys(mistakes).length} 个错词，当前词书 {totalInBook} 个
        </p>
      </header>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Segmented
          size="sm"
          options={[
            { value: 'current' as const, label: '当前词书' },
            { value: 'all' as const, label: '全部词书' }
          ]}
          value={scope}
          onChange={setScope}
        />
        <Segmented
          size="sm"
          options={[
            { value: 'wrong' as const, label: '错误次数' },
            { value: 'recent' as const, label: '最近出错' }
          ]}
          value={sortBy}
          onChange={setSortBy}
        />
      </div>

      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon="sparkle"
            title="错题本是空的"
            description="练习中答错的单词会自动出现在这里，并按照你设置的频率反复出现。"
            action={
              <button type="button" className="btn btn-primary btn-md mt-2" onClick={() => navigate('/')}>
                去练一轮
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5 mt-4">
            {list.map((item) => (
              <MistakeCard
                key={item.key}
                item={item}
                bookName={scope === 'all' ? bookName(item.bookId) : undefined}
                accent={settings.accent}
                online={settings.onlineAudio}
                onRemove={() => {
                  dropMistake(item.key)
                  showToast('已移出错题本')
                }}
              />
            ))}
          </div>

          <SectionTitle title="操作" />
          <div className="flex gap-2.5">
            <button type="button" className="btn btn-primary btn-md" style={{ flex: 1 }} disabled={starting} onClick={() => void practice()}>
              <Icon name="play" size={16} />
              {starting ? '准备中…' : '开始错题专项'}
            </button>
            <button
              type="button"
              className="btn btn-soft btn-md"
              onClick={() => {
                clearMistakeBook()
                showToast('错题本已清空')
              }}
            >
              <Icon name="trash" size={16} />
              清空
            </button>
          </div>
        </>
      )}
      <div style={{ height: 16 }} />
    </div>
  )
}

function MistakeCard({
  item,
  bookName,
  accent,
  online,
  onRemove
}: {
  item: MistakeEntry
  bookName?: string
  accent: 'us' | 'uk'
  online: boolean
  onRemove: () => void
}) {
  const speakOptions = { accent, online }
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-word" style={{ fontWeight: 700, fontSize: '1.18rem' }}>
              {item.word}
            </span>
            <span
              className="chip"
              style={{ cursor: 'default', padding: '0.14rem 0.5rem', background: 'color-mix(in srgb, var(--wrong) 16%, transparent)', color: 'var(--wrong)', borderColor: 'transparent' }}
            >
              错 {item.wrong} 次
            </span>
            {bookName ? (
              <span className="chip" style={{ cursor: 'default', padding: '0.14rem 0.5rem' }}>
                {bookName}
              </span>
            ) : null}
          </div>
          <div className="muted" style={{ fontSize: '0.84rem', marginTop: 4, lineHeight: 1.55 }}>
            {item.trans.join('；')}
          </div>
          {item.lastWrongInput ? (
            <div className="faint" style={{ fontSize: '0.72rem', marginTop: 3 }}>
              上次答成：{item.lastWrongInput} · {relativeTime(item.lastWrongAt)}
            </div>
          ) : (
            <div className="faint" style={{ fontSize: '0.72rem', marginTop: 3 }}>
              最近出错：{relativeTime(item.lastWrongAt)}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5" style={{ flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            style={{ width: 34, height: 34, padding: 0 }}
            aria-label="朗读"
            onClick={() => void speakWord(item.word, speakOptions)}
          >
            <Icon name="speaker" size={16} />
          </button>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            style={{ width: 34, height: 34, padding: 0 }}
            aria-label="拼读"
            onClick={() => void spellWord(item.word, speakOptions)}
          >
            <Icon name="keyboard" size={16} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ width: 34, height: 34, padding: 0 }}
            aria-label="移出错题本"
            onClick={onRemove}
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
