import { describe, expect, it } from 'vitest'
import { parseDelimited, parseWordList } from '../core/importer'

describe('importer 自定义词表解析', () => {
  it('解析本 App 的 JSON 格式', () => {
    const { words, format } = parseWordList(
      JSON.stringify([
        { w: 'abandon', t: ['放弃'], us: "'æbəndən" },
        { w: 'benefit', t: ['好处', '有益于'] }
      ])
    )
    expect(format).toBe('json')
    expect(words).toHaveLength(2)
    expect(words[0].w).toBe('abandon')
    expect(words[0].us).toBe("'æbəndən")
    expect(words[1].t).toEqual(['好处', '有益于'])
  })

  it('兼容 {name, trans} 与 {word, meaning} 等常见格式', () => {
    const a = parseWordList(JSON.stringify([{ name: 'cancel', trans: ['取消'] }]))
    expect(a.words[0].w).toBe('cancel')
    const b = parseWordList(JSON.stringify([{ word: 'govern', meaning: '统治；支配' }]))
    expect(b.words[0].t).toEqual(['统治', '支配'])
  })

  it('兼容 {words:[...]} 包装的 JSON', () => {
    const { words } = parseWordList(JSON.stringify({ words: [{ w: 'alpha', t: ['第一'] }] }))
    expect(words.map((entry) => entry.w)).toEqual(['alpha'])
  })

  it('解析带表头的 CSV', () => {
    const csv = ['单词,释义', 'abandon,放弃', 'benefit,好处'].join('\n')
    const { words } = parseWordList(csv, 'my-words.csv')
    expect(words.map((entry) => entry.w)).toEqual(['abandon', 'benefit'])
    expect(words[0].t).toEqual(['放弃'])
  })

  it('解析 TSV 且保留第 3/4 列音标', () => {
    const tsv = 'abandon\t放弃\təˈbændən\tabændən'
    const { words } = parseWordList(tsv)
    expect(words[0]).toEqual({ w: 'abandon', t: ['放弃'], us: 'əˈbændən', uk: 'abændən' })
  })

  it('解析「单词 中文释义」纯文本', () => {
    const text = ['abandon 放弃', 'benefit 好处'].join('\n')
    const { words } = parseWordList(text, 'words.txt')
    expect(words.map((entry) => entry.w)).toEqual(['abandon', 'benefit'])
  })

  it('去重并丢弃没有释义的行', () => {
    const text = ['abandon,放弃', 'Abandon,放弃', 'lonely', ''].join('\n')
    const words = parseDelimited(text)
    expect(words).toHaveLength(1)
    expect(words[0].w).toBe('abandon')
  })

  it('完全无效的内容返回空数组而不是抛错', () => {
    expect(parseWordList('').words).toHaveLength(0)
    expect(parseWordList('这个文件不是词表').words).toHaveLength(0)
    expect(parseWordList('{不是合法 JSON').words).toHaveLength(0)
  })

  it('JSON 是数组但字段缺失时回退到文本解析', () => {
    const { words } = parseWordList(JSON.stringify([{ foo: 'bar' }]))
    expect(words).toHaveLength(0)
  })
})
