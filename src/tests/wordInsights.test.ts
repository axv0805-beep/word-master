import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { DictEntry } from '../core/types'
import { buildWordIndex, candidatesForConfusable } from '../core/wordIndex'
import { buildWordForms, isFamilyCandidate, stemVariants } from '../core/wordForms'
import { editDistance, findConfusables, normalizePhonetic } from '../core/confusables'
import { cleanTrans, parsePosFromTrans, stripPosMarker } from '../core/pos'

const DICT_DIR = path.resolve(__dirname, '../../public/dicts')

function loadCorpus(): DictEntry[] {
  const manifest = JSON.parse(fs.readFileSync(path.join(DICT_DIR, 'manifest.json'), 'utf8')) as {
    books: Array<{ file: string }>
  }
  const seen = new Set<string>()
  const out: DictEntry[] = []
  for (const book of manifest.books) {
    const words = JSON.parse(fs.readFileSync(path.join(DICT_DIR, book.file), 'utf8')) as DictEntry[]
    for (const entry of words) {
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

function words(list: Array<{ word: string }>): string[] {
  return list.map((item) => item.word.toLowerCase())
}

describe('词性解析', () => {
  it('识别释义开头的词性标记', () => {
    expect(parsePosFromTrans(['n. 决定；决心'])).toBe('noun')
    expect(parsePosFromTrans(['v. 决定；下决心'])).toBe('verb')
    expect(parsePosFromTrans(['vt. 放弃'])).toBe('verb')
    expect(parsePosFromTrans(['a.幸福；快乐的'])).toBe('adjective')
    expect(parsePosFromTrans(['ad. 幸福地'])).toBe('adverb')
    expect(parsePosFromTrans(['adv. 不同地'])).toBe('adverb')
  })

  it('识别释义结尾括号里的词性标记', () => {
    expect(parsePosFromTrans(['生产力； 生产率 (n.)'])).toBe('noun')
    expect(parsePosFromTrans(['多产的， 富饶的 (adj.)'])).toBe('adjective')
  })

  it('没有标记时返回 null', () => {
    expect(parsePosFromTrans(['取消， 撤销； 删去'])).toBeNull()
    expect(parsePosFromTrans([])).toBeNull()
  })

  it('去掉词性标记后展示更干净', () => {
    expect(stripPosMarker('n. 决定；决心')).toBe('决定；决心')
    expect(stripPosMarker('生产力 (n.)')).toBe('生产力')
    expect(cleanTrans(['v. 决定', 'n. 决心'])).toBe('决定；决心')
  })

  it('真实词库里的词性能被正确解析', () => {
    expect(parsePosFromTrans(INDEX.byWord.get('happiness')?.t ?? [])).toBe('noun')
    expect(parsePosFromTrans(INDEX.byWord.get('careful')?.t ?? [])).toBe('adjective')
  })
})

describe('相似度工具', () => {
  it('编辑距离', () => {
    expect(editDistance('effect', 'affect')).toBe(1)
    expect(editDistance('desert', 'dessert')).toBe(1)
    expect(editDistance('principle', 'principal')).toBe(2)
    expect(editDistance('abandon', 'abundant', 3)).toBeGreaterThan(2)
    expect(editDistance('same', 'same')).toBe(0)
  })

  it('音标归一化保留 IPA 字母', () => {
    expect(normalizePhonetic('ɪˈfɛkt')).toBe('ɪfɛkt')
    expect(normalizePhonetic('əˈfɛkt')).toBe('əfɛkt')
    expect(normalizePhonetic(undefined)).toBe('')
  })
})

describe('词形变化（规则推导 + 词库验证）', () => {
  it('名词 / 形容词 / 副词都能推出来', () => {
    expect(words(buildWordForms('happy', INDEX))).toEqual(expect.arrayContaining(['happiness', 'happily']))
    expect(words(buildWordForms('care', INDEX))).toEqual(
      expect.arrayContaining(['careful', 'careless', 'carefully', 'carelessly'])
    )
    expect(words(buildWordForms('differ', INDEX))).toEqual(
      expect.arrayContaining(['difference', 'different', 'differently'])
    )
    expect(words(buildWordForms('produce', INDEX))).toEqual(
      expect.arrayContaining(['production', 'productive', 'productivity'])
    )
    expect(words(buildWordForms('success', INDEX))).toEqual(
      expect.arrayContaining(['succeed', 'successful', 'successfully'])
    )
  })

  it('构词规则覆盖不到的同族词也能补上（decide → decisiv/decision、benefit → beneficial）', () => {
    expect(words(buildWordForms('decide', INDEX))).toEqual(expect.arrayContaining(['decision', 'decisive']))
    expect(words(buildWordForms('benefit', INDEX))).toEqual(expect.arrayContaining(['beneficial']))
    expect(words(buildWordForms('create', INDEX))).toEqual(expect.arrayContaining(['creation', 'creative', 'creativity']))
  })

  it('不产生"真词误报"', () => {
    // care(动词) 加比较级 -er 会拼出 career；happy 删掉 y 加 -en 会拼出 happen
    expect(words(buildWordForms('care', INDEX))).not.toContain('career')
    expect(words(buildWordForms('happy', INDEX))).not.toContain('happen')
    expect(words(buildWordForms('happy', INDEX))).not.toContain('happening')
    expect(words(buildWordForms('create', INDEX))).not.toContain('creature')
  })

  it('每个形式都带着词库里真实存在的释义与词性', () => {
    for (const word of ['happy', 'care', 'decide', 'produce', 'success', 'differ']) {
      const forms = buildWordForms(word, INDEX)
      expect(forms.length).toBeGreaterThan(0)
      for (const form of forms) {
        expect(INDEX.byWord.has(form.word.toLowerCase())).toBe(true)
        expect(form.meaning.length).toBeGreaterThan(0)
        expect(['noun', 'verb', 'adjective', 'adverb', 'other']).toContain(form.pos)
        expect(form.word.toLowerCase()).not.toBe(word)
      }
    }
  })

  it('结果稳定可复现（同样的输入同样的顺序）', () => {
    const first = buildWordForms('care', INDEX).map((item) => item.word)
    const second = buildWordForms('care', INDEX).map((item) => item.word)
    expect(second).toEqual(first)
  })

  it('四级词库里的 create 同时有词形与易混词（真实浏览器校验依赖这一点）', () => {
    const forms = words(buildWordForms('create', INDEX))
    expect(forms).toEqual(expect.arrayContaining(['creation', 'creative']))
    const confusables = words(findConfusables('create', INDEX, { exclude: new Set(forms) }))
    expect(confusables).toContain('creature')
  })

  it('短语、超短词、未知词不会崩且返回空', () => {
    expect(buildWordForms('mobile phone', INDEX)).toEqual([])
    expect(buildWordForms('at', INDEX)).toEqual([])
    expect(buildWordForms('zzzzzz', INDEX)).toEqual([])
    expect(buildWordForms('', INDEX)).toEqual([])
  })

  it('limit 生效，且按词性分组排序（动词在前）', () => {
    const limited = buildWordForms('care', INDEX, { limit: 2 })
    expect(limited).toHaveLength(2)
    const all = buildWordForms('care', INDEX)
    expect(all.length).toBeLessThanOrEqual(8)
    const order = all.map((item) => item.pos)
    const ranked = [...order].sort(
      (a, b) =>
        ['verb', 'noun', 'adjective', 'adverb', 'other'].indexOf(a) -
        ['verb', 'noun', 'adjective', 'adverb', 'other'].indexOf(b)
    )
    expect(order).toEqual(ranked)
  })

  it('词干还原覆盖去 e、y→i、双写', () => {
    expect(stemVariants('caring')).toContain('care')
    expect(stemVariants('happiness')).toContain('happy')
    expect(stemVariants('running')).toContain('run')
    expect(stemVariants('happy')).toContain('happi')
  })

  it('同族守卫能挡住巧合相似', () => {
    expect(isFamilyCandidate('happy', 'happen')).toBe(false)
    expect(isFamilyCandidate('decide', 'decisive')).toBe(true)
    expect(isFamilyCandidate('produce', 'production')).toBe(true)
    expect(isFamilyCandidate('care', 'career')).toBe(false)
  })
})

describe('易混词', () => {
  it('常见易混词对能被找出来', () => {
    expect(words(findConfusables('effect', INDEX))).toContain('affect')
    expect(words(findConfusables('principle', INDEX))).toContain('principal')
    expect(words(findConfusables('desert', INDEX))).toContain('dessert')
    expect(words(findConfusables('adapt', INDEX))).toContain('adopt')
    expect(words(findConfusables('detain', INDEX))).toContain('retain')
  })

  it('距离 2 内没有结果时，会用距离 3 但足够相似的词补齐（abandon → abundant）', () => {
    // 这是用户实际遇到的第一个词：字母顺序第一题永远是 abandon
    const confusables = findConfusables('abandon', INDEX)
    expect(words(confusables)).toContain('abundant')
    expect(confusables[0].word.toLowerCase()).toBe('abundant')
    expect(confusables[0].distance).toBe(3)
  })

  it('补齐的候选依然要过质量门槛（不会塞进不相干的词）', () => {
    const confusables = findConfusables('abandon', INDEX)
    for (const item of confusables) {
      expect(item.word.length).toBeGreaterThanOrEqual(6)
      expect(item.score).toBeGreaterThanOrEqual(34)
    }
    // band / random / cannon 这些更弱的候选不该出现
    expect(words(confusables)).not.toContain('band')
    expect(words(confusables)).not.toContain('random')
    expect(words(confusables)).not.toContain('cannon')
  })

  it('不会把词形变化当成易混词（由调用方通过 exclude 排除）', () => {
    const forms = buildWordForms('care', INDEX)
    const exclude = new Set(forms.map((item) => item.word.toLowerCase()))
    const confusables = words(findConfusables('care', INDEX, { exclude }))
    for (const form of forms) {
      expect(confusables).not.toContain(form.word.toLowerCase())
    }

    // 不传 exclude 时，形近词本身仍可能出现
    expect(words(findConfusables('care', INDEX)).length).toBeGreaterThan(0)
  })

  it('排除与目标释义完全相同的词', () => {
    const confusables = findConfusables('effect', INDEX)
    const head = cleanTrans(INDEX.byWord.get('effect')?.t ?? [])
    for (const item of confusables) {
      expect(item.meaning).not.toBe(head)
    }
  })

  it('不会返回自己，且数量不超过 limit', () => {
    for (const word of ['effect', 'care', 'create', 'produce', 'happy']) {
      const list = findConfusables(word, INDEX, { limit: 3 })
      expect(list.length).toBeLessThanOrEqual(3)
      expect(words(list)).not.toContain(word)
    }
  })

  it('每条都给出理由与真实释义', () => {
    const list = findConfusables('effect', INDEX)
    expect(list.length).toBeGreaterThan(0)
    for (const item of list) {
      expect(['shape', 'sound', 'tail']).toContain(item.reason)
      expect(item.meaning.length).toBeGreaterThan(0)
      expect(item.distance).toBeGreaterThanOrEqual(1)
      expect(item.distance).toBeLessThanOrEqual(3)
      expect(INDEX.byWord.has(item.word.toLowerCase())).toBe(true)
    }
  })

  it('结果按分数排序且稳定可复现', () => {
    const first = findConfusables('desert', INDEX)
    const second = findConfusables('desert', INDEX)
    expect(second.map((item) => item.word)).toEqual(first.map((item) => item.word))
    for (let i = 1; i < first.length; i += 1) {
      expect(first[i - 1].score).toBeGreaterThanOrEqual(first[i].score)
    }
  })

  it('候选分桶不按首字母过滤（否则 effect / affect 永远碰不到面）', () => {
    const candidates = candidatesForConfusable(INDEX, 'effect').map((entry) => entry.w.toLowerCase())
    expect(candidates).toContain('affect')
  })

  it('未知词与短语不会崩', () => {
    expect(findConfusables('zzzzzz', INDEX)).toEqual([])
    expect(findConfusables('mobile phone', INDEX)).toEqual([])
    expect(findConfusables('', INDEX)).toEqual([])
  })
})
