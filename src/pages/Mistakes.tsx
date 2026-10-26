import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { EmptyState, SectionTitle, Segmented } from '../components/ui/Widgets'
import { useToast } from '../components/ui/Toast'
import { useAppStore } from '../store/appStore'
import { useStartRound } from '../hooks/useStartRound'
import { useBookList } from '../hooks/useDictionary'
import { speakWord, spellWord } from '../core/speech'
import { LEVEL_LABEL } from '../core/listening'
import type { ListeningMistake, MistakeEntry } from '../core/types'

const LETTERS = ['A', 'B', 'C', 'D']

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
  const listeningMistakes = useAppStore((state) => state.listeningMistakes)
  const dropListeningMistake = useAppStore((state) => state.dropListeningMistake)
  const clearListeningMistakes = useAppStore((state) => state.clearListeningMistakes)
  const { books } = useBookList()
  const { startRound, starting } = useStartRound()
  const showToast = useToast((state) => state.show)

  const [kind, setKind] = useState<'words' | 'listening'>('words')
  const [scope, setScope] = useState<'current' | 'all'>('current')
  const [sortBy, setSortBy] = useState<'wrong' | 'recent'>('wrong')

  const list = useMemo(() => {
    const all = Object.values(mistakes)
    const filtered = scope === 'all' ? all : all.filter((item) => item.bookId === settings.bookId)
    return filtered.slice().sort((a, b) =>
      sortBy === 'recent' ? b.lastWrongAt - a.lastWrongAt : b.wrong - a.wrong || b.lastWrongAt - a.lastWrongAt
    )
  }, [mistakes, scope, settings.bookId, sortBy])

  const listeningList = useMemo(
    () =>
      listeningMistakes.slice().sort((a, b) =>
        sortBy === 'recent' ? b.lastWrongAt - a.lastWrongAt : b.wrong - a.wrong || b.lastWrongAt - a.lastWrongAt
      ),
    [listeningMistakes, sortBy]
  )

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

  const wordCount = Object.keys(mistakes).length
  const listeningCount = listeningMistakes.length

  return (
    <div className="px-4 pt-5">
      <header className="mb-4">
        <h1 style={{ fontSize: '1.42rem', fontWeight: 800 }}>错题本</h1>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
          {kind === 'words'
            ? `共 ${wordCount} 个错词，当前词书 ${totalInBook} 个`
            : `共 ${listeningCount} 道听力错题，答错的听力题会自动收进来`}
        </p>
      </header>

      <Segmented
        size="sm"
        options={[
          { value: 'words' as const, label: wordCount > 0 ? `单词 ${wordCount}` : '单词' },
          { value: 'listening' as const, label: listeningCount > 0 ? `听力 ${listeningCount}` : '听力' }
        ]}
        value={kind}
        onChange={setKind}
      />

      {kind === 'words' ? (
        <WordMistakes
          list={list}
          scope={scope}
          sortBy={sortBy}
          onScope={setScope}
          onSort={setSortBy}
          bookName={bookName}
          accent={settings.accent}
          online={settings.onlineAudio}
          starting={starting}
          onPractice={() => void practice()}
          onRemove={(key) => {
            dropMistake(key)
            showToast('已移出错题本')
          }}
          onClear={() => {
            clearMistakeBook()
            showToast('错题本已清空')
          }}
          onGoHome={() => navigate('/')}
        />
      ) : (
        <ListeningMistakes
          list={listeningList}
          sortBy={sortBy}
          onSort={setSortBy}
          onRemove={(key) => {
            dropListeningMistake(key)
            showToast('已移出听力错题')
          }}
          onClear={() => {
            clearListeningMistakes()
            showToast('听力错题已清空')
          }}
          onGoLearn={() => navigate('/learn')}
        />
      )}
      <div style={{ height: 16 }} />
    </div>
  )
}

function WordMistakes({
  list,
  scope,
  sortBy,
  onScope,
  onSort,
  bookName,
  accent,
  online,
  starting,
  onPractice,
  onRemove,
  onClear,
  onGoHome
}: {
  list: MistakeEntry[]
  scope: 'current' | 'all'
  sortBy: 'wrong' | 'recent'
  onScope: (value: 'current' | 'all') => void
  onSort: (value: 'wrong' | 'recent') => void
  bookName: (bookId: string) => string
  accent: 'us' | 'uk'
  online: boolean
  starting: boolean
  onPractice: () => void
  onRemove: (key: string) => void
  onClear: () => void
  onGoHome: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap mt-3">
        <Segmented
          size="sm"
          options={[
            { value: 'current' as const, label: '当前词书' },
            { value: 'all' as const, label: '全部词书' }
          ]}
          value={scope}
          onChange={onScope}
        />
        <Segmented
          size="sm"
          options={[
            { value: 'wrong' as const, label: '错误次数' },
            { value: 'recent' as const, label: '最近出错' }
          ]}
          value={sortBy}
          onChange={onSort}
        />
      </div>

      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon="sparkle"
            title="错题本是空的"
            description="练习中答错的单词会自动出现在这里，并按照你设置的频率反复出现。"
            action={
              <button type="button" className="btn btn-primary btn-md mt-2" onClick={onGoHome}>
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
                accent={accent}
                online={online}
                onRemove={() => onRemove(item.key)}
              />
            ))}
          </div>

          <SectionTitle title="操作" />
          <div className="flex gap-2.5">
            <button
              type="button"
              className="btn btn-primary btn-md"
              style={{ flex: 1 }}
              disabled={starting}
              onClick={onPractice}
            >
              <Icon name="play" size={16} />
              {starting ? '准备中…' : '开始错题专项'}
            </button>
            <button type="button" className="btn btn-soft btn-md" onClick={onClear}>
              <Icon name="trash" size={16} />
              清空
            </button>
          </div>
        </>
      )}
    </>
  )
}

function ListeningMistakes({
  list,
  sortBy,
  onSort,
  onRemove,
  onClear,
  onGoLearn
}: {
  list: ListeningMistake[]
  sortBy: 'wrong' | 'recent'
  onSort: (value: 'wrong' | 'recent') => void
  onRemove: (key: string) => void
  onClear: () => void
  onGoLearn: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-end gap-2 flex-wrap mt-3">
        <Segmented
          size="sm"
          options={[
            { value: 'wrong' as const, label: '错误次数' },
            { value: 'recent' as const, label: '最近出错' }
          ]}
          value={sortBy}
          onChange={onSort}
        />
      </div>

      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon="headphones"
            title="还没有听力错题"
            description="听力练习里答错的题会自动收进来，方便你回头重听原文。"
            action={
              <button type="button" className="btn btn-primary btn-md mt-2" onClick={onGoLearn}>
                去练听力
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5 mt-4">
            {list.map((item) => (
              <ListeningMistakeCard key={item.key} item={item} onRemove={() => onRemove(item.key)} />
            ))}
          </div>

          <SectionTitle title="操作" />
          <div className="flex gap-2.5">
            <button type="button" className="btn btn-soft btn-md" style={{ flex: 1 }} onClick={onGoLearn}>
              <Icon name="headphones" size={16} />
              再练一轮听力
            </button>
            <button type="button" className="btn btn-soft btn-md" onClick={onClear}>
              <Icon name="trash" size={16} />
              清空
            </button>
          </div>
        </>
      )}
    </>
  )
}

function ListeningMistakeCard({ item, onRemove }: { item: ListeningMistake; onRemove: () => void }) {
  const chosenText = item.options[item.chosen]
  const answerText = item.options[item.answer]
  return (
    <div className="card p-4 listen-mistake">
      <div className="flex items-start justify-between gap-3">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="chip" style={{ cursor: 'default', padding: '0.14rem 0.5rem' }}>
              {LEVEL_LABEL[item.level]} · {item.section}
            </span>
            {item.source && (
              <span className="chip" style={{ cursor: 'default', padding: '0.14rem 0.5rem' }}>
                {item.source}
              </span>
            )}
            <span
              className="chip"
              style={{
                cursor: 'default',
                padding: '0.14rem 0.5rem',
                background: 'color-mix(in srgb, var(--wrong) 16%, transparent)',
                color: 'var(--wrong)',
                borderColor: 'transparent'
              }}
            >
              错 {item.wrong} 次
            </span>
          </div>

          <p className="listen-mistake__stem">{item.stem}</p>

          <p className="listen-mistake__line listen-mistake__line--wrong">
            <span>你选了 {LETTERS[item.chosen] ?? '?'}</span>
            {chosenText && <span className="listen-mistake__text">{chosenText}</span>}
          </p>
          <p className="listen-mistake__line listen-mistake__line--right">
            <span>正确答案 {LETTERS[item.answer]}</span>
            {answerText && <span className="listen-mistake__text">{answerText}</span>}
          </p>

          <div className="faint" style={{ fontSize: '0.72rem', marginTop: 4 }}>
            最近出错：{relativeTime(item.lastWrongAt)}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ width: 34, height: 34, padding: 0, flexShrink: 0 }}
          aria-label="移出听力错题"
          onClick={onRemove}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
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
              style={{
                cursor: 'default',
                padding: '0.14rem 0.5rem',
                background: 'color-mix(in srgb, var(--wrong) 16%, transparent)',
                color: 'var(--wrong)',
                borderColor: 'transparent'
              }}
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
