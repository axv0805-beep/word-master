import { useCallback, useState } from 'react'
import type { DictEntry, StudyMode } from '../core/types'
import { alphaOrder, planRound, preferSpellable, startIndexForLetter } from '../core/dictionary'
import { clampRoundSize } from '../core/constants'
import { createRng, randomSeed, shuffle } from '../core/rng'
import { useAppStore } from '../store/appStore'
import { useSessionStore } from '../store/session'
import { readBooks, useBookList } from './useDictionary'
import { useToast } from '../components/ui/Toast'

export interface StartOptions {
  mode: StudyMode
  /** 指定词书，默认用设置里的当前词书 */
  bookId?: string
  /** 字母顺序模式：从哪个首字母开始 */
  letter?: string
  /** 答题页跳转 */
  onStarted?: () => void
}

/**
 * 统一的"开始一轮练习"入口：
 * 负责选词、组卷、把字母顺序游标推进记录交给会话。
 */
export function useStartRound() {
  const { books } = useBookList()
  const startSession = useSessionStore((state) => state.start)
  const showToast = useToast((state) => state.show)
  const [starting, setStarting] = useState(false)

  const startRound = useCallback(
    async (options: StartOptions): Promise<boolean> => {
      const app = useAppStore.getState()
      const settings = app.settings
      const bookId = options.bookId ?? settings.bookId
      setStarting(true)

      try {
        if (options.mode === 'mistakes') {
          const mistakes = Object.values(app.mistakes)
          if (mistakes.length === 0) {
            showToast('错题本是空的，先去练习吧', 'info')
            return false
          }
          const words: DictEntry[] = mistakes
            .slice()
            .sort((a, b) => b.wrong - a.wrong || b.lastWrongAt - a.lastWrongAt)
            .map((item) => ({ w: item.word, t: item.trans, us: item.us, uk: item.uk }))

          const bookIds = [...new Set(mistakes.map((item) => item.bookId))]
          const pool = await readBooks(books, bookIds)
          if (pool.length < 4) {
            showToast('错题所在词书加载失败，请检查网络后重试', 'error')
            return false
          }
          const selected = words.slice(0, Math.min(settings.roundSize, words.length))
          startSession({ bookId, mode: 'mistakes', words: selected, pool, settings })
          options.onStarted?.()
          return true
        }

        const meta = books.find((book) => book.id === bookId)
        if (!meta) {
          showToast(books.length === 0 ? '词书清单还在加载，请稍候再试' : '找不到该词书，请到「词书」页重新选择', 'error')
          return false
        }
        const words = await readBooks(books, [bookId])
        if (words.length === 0) {
          showToast('词书加载失败，请检查网络后重试', 'error')
          return false
        }
        if (words.length < 4) {
          showToast(`《${meta.name}》只有 ${words.length} 个词条，不足以出题`, 'error')
          return false
        }

        const spellOnly = settings.questionTypes.length === 1 && settings.questionTypes[0] === 'spelling'
        const pool = spellOnly ? preferSpellable(words) : words
        const ordered = alphaOrder(pool)
        const size = clampRoundSize(settings.roundSize)

        if (options.mode === 'random') {
          const rng = createRng(randomSeed())
          const plan = planRound({
            mode: 'random',
            ordered,
            cursor: 0,
            size,
            shuffle: <T,>(list: readonly T[]) => shuffle(rng, list)
          })
          startSession({ bookId, mode: 'random', words: plan.words, pool, settings, shuffleFirstPass: false })
          options.onStarted?.()
          return true
        }

        const cursor =
          options.letter != null
            ? startIndexForLetter(ordered, options.letter)
            : (app.study.alphaCursor[bookId] ?? 0)
        const plan = planRound({
          mode: 'alpha',
          ordered,
          cursor,
          size,
          shuffle: <T,>(list: readonly T[]) => list.slice()
        })
        if (options.letter != null) app.setLastLetter(bookId, options.letter)
        startSession({
          bookId,
          mode: 'alpha',
          words: plan.words,
          pool,
          settings,
          shuffleFirstPass: false,
          nextCursor: plan.nextCursor
        })
        options.onStarted?.()
        return true
      } catch (err) {
        showToast(err instanceof Error ? err.message : '开始练习失败', 'error')
        return false
      } finally {
        setStarting(false)
      }
    },
    [books, startSession, showToast]
  )

  return { startRound, starting }
}
