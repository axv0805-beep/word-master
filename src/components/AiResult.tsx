import { useState } from 'react'
import { type AiFeature, type AiResult, type WritingResult, type AssociationResult, type ExamplesResult, type QuizResult } from '../core/ai'
import { speakWord } from '../core/speech'
import { useAppStore } from '../store/appStore'

export function AiResultView({ feature, result }: { feature: AiFeature; result: AiResult }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const settings = useAppStore((s) => s.settings)
  if (feature === 'writing') {
    const r = result as WritingResult
    return <section className="ai-result"><p className="ai-eyebrow">AI 反馈 · 非官方评分</p><h2>把这一次，写得更好</h2><p>{r.summary}</p>
      {!!r.strengths.length && <><h3>写得好的地方</h3><ul>{r.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
      <h3>逐句修改</h3>{r.corrections.length ? r.corrections.map((c, i) => <article className="ai-correction" key={i}><p><span>原句</span>{c.original}</p><p className="ai-revised"><span>建议</span>{c.revised}</p><p className="muted">{c.reason}</p></article>) : <p>本次没有列出逐句修改，请结合总体建议继续检查。</p>}
      <h3>下一次可以这样改</h3><ul>{r.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
      <details className="ai-reference"><summary>展开参考范文</summary><p className="ai-essay">{r.modelEssay}</p></details>
    </section>
  }
  if (feature === 'association') {
    const r = result as AssociationResult
    return <section className="ai-result"><p className="ai-eyebrow">记忆联想</p><h2 className="font-word">{r.word}</h2><p>{r.meaning}</p><blockquote>{r.memoryTip}</blockquote><p className="ai-hint">联想是记忆技巧，不代表真实词源。</p><h3>放在一起，分清用法</h3>{r.connections.map((c, i) => <article className="ai-correction" key={i}><strong>{c.word}</strong><p>{c.meaning}</p><p className="muted">{c.difference}</p></article>)}</section>
  }
  if (feature === 'examples') {
    const r = result as ExamplesResult
    return <section className="ai-result"><p className="ai-eyebrow">在语境里记住</p><h2 className="font-word">{r.word}</h2>{r.examples.map((e, i) => <article className="ai-correction" key={i}><p className="ai-example">{e.sentence}</p><p>{e.translation}</p><p className="muted">{e.usage}</p><button className="btn btn-soft btn-sm" onClick={() => void speakWord(e.sentence, { accent: settings.accent, online: false })}>朗读例句 {i + 1}</button></article>)}</section>
  }
  const r = result as QuizResult
  const answered = Object.keys(answers).length
  const correct = r.questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0)
  return <section className="ai-result"><p className="ai-eyebrow">AI 原创练习 · 非考试真题</p><h2>把单词用起来</h2><p role="status">已答 {answered} / {r.questions.length} · 答对 {correct} 题</p>
    {r.questions.map((q, i) => <article className="ai-quiz" key={i}><h3>{i + 1}. {q.stem}</h3><div className="listen-options">{q.options.map((o, j) => <button className="listen-option" key={j} disabled={answers[i] != null} data-state={answers[i] == null ? 'idle' : j === q.answer ? 'correct' : answers[i] === j ? 'wrong' : 'idle'} onClick={() => setAnswers((v) => ({ ...v, [i]: j }))}><span className="listen-option__letter">{'ABCD'[j]}</span><span>{o}</span></button>)}</div>{answers[i] != null && <p className="ai-notice">{answers[i] === q.answer ? '答对了。' : `正确答案：${'ABCD'[q.answer]}。`}{q.explanation}</p>}</article>)}
    {answered === r.questions.length && <button className="btn btn-soft btn-md" onClick={() => setAnswers({})}>重新练习</button>}
  </section>
}
