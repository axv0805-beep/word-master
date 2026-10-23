import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icons'
import { EmptyState, ProgressBar, SectionTitle, Segmented, Sheet } from '../components/ui/Widgets'
import { useToast } from '../components/ui/Toast'
import { useAppStore, studiedCount } from '../store/appStore'
import { useBookList } from '../hooks/useDictionary'
import { useStartRound } from '../hooks/useStartRound'
import { parseWordList } from '../core/importer'
import { ALPHABET } from '../core/dictionary'
import type { StudyMode } from '../core/types'

export function BooksPage() {
  const navigate = useNavigate()
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const customBooks = useAppStore((state) => state.customBooks)
  const setCustomBooks = useAppStore((state) => state.setCustomBooks)
  const lastLetterMap = useAppStore((state) => state.study.lastLetter)
  const { books, loading, error } = useBookList()
  const { startRound, starting } = useStartRound()
  const showToast = useToast((state) => state.show)

  const [letterSheet, setLetterSheet] = useState(false)
  const [mode, setMode] = useState<StudyMode>('alpha')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const currentBook = books.find((book) => book.id === settings.bookId) ?? books[0]
  const lastLetter = currentBook ? lastLetterMap[currentBook.id] : undefined

  async function handleImport(file: File) {
    try {
      const text = await file.text()
      const { words, format } = parseWordList(text, file.name)
      if (words.length === 0) {
        showToast('没有解析到有效词条，请检查文件格式', 'error')
        return
      }
      const book = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 20) || '我的词表',
        description: `用户导入（${format}）· ${words.length} 词`,
        words,
        createdAt: Date.now()
      }
      setCustomBooks([...customBooks, book])
      updateSettings({ bookId: book.id })
      showToast(`导入成功：${words.length} 个词条`, 'success')
    } catch {
      showToast('导入失败，请确认文件是 UTF-8 编码的文本', 'error')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function start(withLetter?: string) {
    await startRound({
      mode: withLetter ? 'alpha' : mode,
      bookId: currentBook?.id,
      letter: withLetter,
      onStarted: () => {
        setLetterSheet(false)
        navigate('/study')
      }
    })
  }

  return (
    <div className="px-4 pt-5">
      <header className="mb-4">
        <h1 style={{ fontSize: '1.42rem', fontWeight: 800 }}>词书</h1>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
          选择词书与起点，开始一轮练习
        </p>
      </header>

      <Segmented
        options={[
          { value: 'alpha' as StudyMode, label: '按字母顺序' },
          { value: 'random' as StudyMode, label: '随机抽取' }
        ]}
        value={mode === 'mistakes' ? 'random' : mode}
        onChange={(value) => setMode(value)}
      />

      {loading ? (
        <div className="flex flex-col gap-2.5 mt-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="skeleton" style={{ height: 88 }} />
          ))}
        </div>
      ) : error ? (
        <div className="mt-4">
          <EmptyState icon="alert" title="词书清单加载失败" description={error} />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mt-4">
          {books.map((book) => {
            const active = currentBook?.id === book.id
            const bookStudied = studiedCount(book.id)
            const ratio = book.count > 0 ? bookStudied / book.count : 0
            const isCustom = book.id.startsWith('custom-')
            return (
              <div
                key={book.id}
                className="card p-4"
                style={{
                  borderColor: active ? 'var(--brand-2)' : 'var(--border)',
                  borderWidth: active ? 2 : 1,
                  boxShadow: active ? '0 14px 34px -22px var(--brand-glow)' : undefined
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="text-left"
                    style={{ flex: 1, background: 'none', border: 'none', padding: 0, color: 'inherit' }}
                    onClick={() => updateSettings({ bookId: book.id })}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{book.name}</span>
                      {active ? (
                        <span className="chip chip-active" style={{ cursor: 'default', padding: '0.15rem 0.5rem' }}>
                          当前
                        </span>
                      ) : null}
                      {isCustom ? (
                        <span className="chip" style={{ cursor: 'default', padding: '0.15rem 0.5rem' }}>
                          自定义
                        </span>
                      ) : null}
                    </div>
                    <div className="faint" style={{ fontSize: '0.74rem', marginTop: 3 }}>
                      {book.description} · 共 {book.count} 词
                    </div>
                  </button>
                  {isCustom ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 6 }}
                      aria-label="删除自定义词书"
                      onClick={() => {
                        setCustomBooks(customBooks.filter((item) => item.id !== book.id))
                        if (settings.bookId === book.id) updateSettings({ bookId: 'cet4' })
                        showToast('已删除自定义词书')
                      }}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  ) : null}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5" style={{ fontSize: '0.72rem' }}>
                    <span className="muted">已学 {bookStudied} / {book.count}</span>
                    <span className="muted">{Math.round(ratio * 100)}%</span>
                  </div>
                  <ProgressBar value={ratio} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SectionTitle title="其他操作" />
      <div className="card p-4 flex flex-col gap-3">
        <button type="button" className="btn btn-soft btn-md w-full" onClick={() => setLetterSheet(true)}>
          <Icon name="sortAz" size={16} />
          从指定首字母开始{lastLetter ? `（上次：${lastLetter}）` : ''}
        </button>
        <button type="button" className="btn btn-soft btn-md w-full" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={16} />
          导入自定义词表（CSV / JSON / TXT）
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,.txt,.tsv,text/plain,application/json"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleImport(file)
          }}
        />
        <p className="faint" style={{ fontSize: '0.7rem', lineHeight: 1.6 }}>
          支持每行「单词」与「中文释义」用逗号分隔的 CSV，或 <code>{'[{"w":"abandon","t":["放弃"]}]'}</code> 形式的 JSON。
        </p>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-lg w-full mt-5"
        disabled={starting || !currentBook}
        onClick={() => void start()}
      >
        <Icon name={mode === 'random' ? 'shuffle' : 'play'} size={17} />
        {starting ? '准备中…' : mode === 'random' ? '随机抽词开练' : '继续字母顺序练习'}
      </button>
      <div style={{ height: 16 }} />

      <Sheet open={letterSheet} title="选择起始首字母" onClose={() => setLetterSheet(false)}>
        <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
          点选一个字母，练习会从该字母的第一个单词开始按字母顺序往下走。
        </p>
        <div className="grid grid-cols-6 gap-2">
          {ALPHABET.map((letter) => {
            const count = currentBook?.letters?.[letter] ?? 0
            const disabled = count === 0
            return (
              <button
                key={letter}
                type="button"
                disabled={disabled}
                onClick={() => void start(letter)}
                className="rounded-xl flex flex-col items-center justify-center"
                style={{
                  padding: '10px 0',
                  background: disabled ? 'var(--surface-2)' : 'var(--surface)',
                  border: '1px solid var(--border)',
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  color: 'var(--text)'
                }}
              >
                <span style={{ fontWeight: 700 }}>{letter}</span>
                <span className="faint" style={{ fontSize: '0.62rem' }}>{count}</span>
              </button>
            )
          })}
        </div>
        <div style={{ height: 8 }} />
      </Sheet>
    </div>
  )
}
