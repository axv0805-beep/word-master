import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { DictEntry } from '../core/types'
import { buildWordIndex } from '../core/wordIndex'
import { buildWordForms } from '../core/wordForms'
import { findConfusables } from '../core/confusables'

/**
 * 覆盖率回归测试。
 *
 * 「词形变化 / 易混词」完全依赖内置词库，覆盖率一旦悄悄掉下来，
 * 用户会觉得功能没生效（第一版就踩过：字母顺序第一题 abandon 两者都无）。
 * 这里用固定采样把下限钉住。
 */

const DICT_DIR = path.resolve(__dirname, '../../public/dicts')

function loadCorpus(): DictEntry[] {
  const manifest = JSON.parse(fs.readFileSync(path.join(DICT_DIR, 'manifest.json'), 'utf8')) as {
    books: Array<{ file: string }>
  }
  const seen = new Set<string>()
  const out: DictEntry[] = []
  for (const book of manifest.books) {
    for (const entry of JSON.parse(fs.readFileSync(path.join(DICT_DIR, book.file), 'utf8')) as DictEntry[]) {
      const key = entry.w.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(entry)
    }
  }
  return out
}

const CORPUS = loadCorpus()
const INDEX = buildWordIndex(CORPUS)

interface Coverage {
  total: number
  withForms: number
  withConfusables: number
  withNothing: number
}

function measure(step: number): Coverage {
  const sample = CORPUS.filter((entry) => !entry.w.includes(' ')).filter((_, index) => index % step === 0)
  const stats: Coverage = { total: sample.length, withForms: 0, withConfusables: 0, withNothing: 0 }
  for (const entry of sample) {
    const forms = buildWordForms(entry.w, INDEX)
    const exclude = new Set(forms.map((item) => item.word.toLowerCase()))
    const confusables = findConfusables(entry.w, INDEX, { exclude })
    if (forms.length > 0) stats.withForms += 1
    if (confusables.length > 0) stats.withConfusables += 1
    if (forms.length === 0 && confusables.length === 0) stats.withNothing += 1
  }
  return stats
}

describe('洞察数据覆盖率', () => {
  const stats = measure(13)

  it('至少 85% 的词能拿到易混词', () => {
    const rate = stats.withConfusables / stats.total
    expect(rate).toBeGreaterThanOrEqual(0.85)
  })

  it('至少 15% 的词能拿到词形变化（受词库收录范围限制，不可能很高）', () => {
    const rate = stats.withForms / stats.total
    expect(rate).toBeGreaterThanOrEqual(0.15)
  })

  it('两者都为空的词控制在 12% 以内', () => {
    const rate = stats.withNothing / stats.total
    expect(rate).toBeLessThanOrEqual(0.12)
  })

  it('字母顺序第一题 abandon 至少能拿到易混词', () => {
    const forms = buildWordForms('abandon', INDEX)
    const exclude = new Set(forms.map((item) => item.word.toLowerCase()))
    const confusables = findConfusables('abandon', INDEX, { exclude })
    expect(confusables.map((item) => item.word.toLowerCase())).toContain('abundant')
  })
})
