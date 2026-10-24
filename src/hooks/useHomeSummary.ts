import { useMemo } from 'react'
import { roundSizePresetsFor } from '../core/constants'
import { countMastered } from '../core/mistakes'
import { buildStudyPlan, type StudyPlan } from '../core/plan'
import { isDue } from '../core/srs'
import { computeStreak, dateKey, ensureDay } from '../core/stats'
import type { BookMeta, DailyStat } from '../core/types'
import { useAppStore } from '../store/appStore'
import { useBookList } from './useDictionary'

/**
 * 首页两种面貌（打卡页 / 经典版）共用的那一份数据。
 * 口径只写一次，避免两边算出不同的「已学词数」「连续打卡」。
 */
export interface HomeSummary {
  currentBook: BookMeta | undefined
  today: DailyStat
  todayAccuracy: number
  /** 连续打卡天数（今天没学但昨天学了，仍然算在连续里） */
  streak: number
  studiedInBook: number
  progressRatio: number
  /** 字母顺序游标：大于 0 说明这一本已经背过一段 */
  cursor: number
  plan: StudyPlan | null
  roundSizePresets: number[]
  masteredCount: number
  mistakeCount: number
  /** 今天新学的词数（按今天各轮的「首次出现题目数」累加） */
  newWordsToday: number
  /** 错题里今天到期待复习的个数 */
  dueReviewCount: number
}

export function useHomeSummary(): HomeSummary {
  const settings = useAppStore((state) => state.settings)
  const daily = useAppStore((state) => state.daily)
  const progress = useAppStore((state) => state.progress)
  const study = useAppStore((state) => state.study)
  const mistakes = useAppStore((state) => state.mistakes)
  const rounds = useAppStore((state) => state.rounds)
  const { books } = useBookList()

  const currentBook = books.find((book) => book.id === settings.bookId) ?? books[0]

  const today = useMemo(() => ensureDay(daily, dateKey(Date.now()), 0), [daily])
  const todayAccuracy = today.questions > 0 ? today.correct / today.questions : 0
  const streak = computeStreak(daily)
  const masteredCount = countMastered(progress)
  const mistakeCount = Object.keys(mistakes).length

  const studiedInBook = useMemo(() => {
    const prefix = `${settings.bookId}:`
    let count = 0
    for (const key of Object.keys(progress)) if (key.startsWith(prefix)) count += 1
    return count
  }, [progress, settings.bookId])

  const cursor = study.alphaCursor[settings.bookId] ?? 0
  const progressRatio = currentBook && currentBook.count > 0 ? studiedInBook / currentBook.count : 0
  const roundSizePresets = useMemo(() => roundSizePresetsFor(settings.dailyGoal), [settings.dailyGoal])

  const plan = useMemo(() => {
    if (!currentBook) return null
    return buildStudyPlan({
      bookId: currentBook.id,
      bookName: currentBook.name,
      totalWords: currentBook.count,
      studiedWords: studiedInBook,
      dailyGoal: settings.dailyGoal,
      roundSize: settings.roundSize
    })
  }, [currentBook, studiedInBook, settings.dailyGoal, settings.roundSize])

  const newWordsToday = useMemo(() => {
    const todayKey = dateKey(Date.now())
    let count = 0
    for (const round of rounds) {
      if (round.mode === 'mistakes') continue
      if (dateKey(round.endedAt) !== todayKey) continue
      count += round.planned
    }
    return count
  }, [rounds])

  const dueReviewCount = useMemo(() => {
    const now = Date.now()
    let count = 0
    for (const item of Object.values(mistakes)) {
      if (isDue(progress[item.key], now)) count += 1
    }
    return count
  }, [mistakes, progress])

  return {
    currentBook,
    today,
    todayAccuracy,
    streak,
    studiedInBook,
    progressRatio,
    cursor,
    plan,
    roundSizePresets,
    masteredCount,
    mistakeCount,
    newWordsToday,
    dueReviewCount
  }
}
