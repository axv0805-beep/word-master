export type AiFeature = 'writing' | 'association' | 'examples' | 'quiz'
export type AiProtocol = 'openai' | 'responses' | 'anthropic' | 'gemini'
export interface AiUser { id: string; username: string; role: 'admin' | 'user'; dailyLimit: number }
export interface AiModel { providerId: string; providerName: string; model: string }
export interface AiProvider {
  id: string; name: string; protocol: AiProtocol; baseUrl: string; enabled: boolean; models: string[]
  hasKey: boolean; jsonMode: boolean; tokenParameter: 'max_tokens' | 'max_completion_tokens'
}
export interface AiPreset { id: string; name: string; protocol: AiProtocol; baseUrl: string }
export interface WritingResult { summary: string; strengths: string[]; suggestions: string[]; corrections: { original: string; revised: string; reason: string }[]; modelEssay: string }
export interface AssociationResult { word: string; meaning: string; memoryTip: string; connections: { word: string; meaning: string; difference: string }[] }
export interface ExamplesResult { word: string; examples: { sentence: string; translation: string; usage: string }[] }
export interface QuizQuestion { stem: string; options: string[]; answer: number; explanation: string; word: string }
export interface QuizResult { questions: QuizQuestion[] }
export type AiResult = WritingResult | AssociationResult | ExamplesResult | QuizResult
export interface AiHistory { id: string; feature: AiFeature; model: string; status: 'pending' | 'done' | 'failed'; error?: string; created_at: number }
export interface AiGeneration extends AiHistory { input: { level: 'cet4' | 'cet6'; words?: string; topic?: string; essay?: string }; result: AiResult | null }
export const AI_LABELS: Record<AiFeature, string> = { writing: 'AI 写作', association: 'AI 联想', examples: 'AI 例句', quiz: 'AI 出题' }
const TOKEN_KEY = 'word-master-ai-session'
export function aiToken(): string { try { return sessionStorage.getItem(TOKEN_KEY) ?? '' } catch { return '' } }
export function saveAiToken(value: string): void {
  if (value) sessionStorage.setItem(TOKEN_KEY, value)
  else sessionStorage.removeItem(TOKEN_KEY)
}

/** This is the application's backend URL, never a model provider URL or secret. */
const API_BASE = (import.meta.env.VITE_AI_API_BASE_URL || '').replace(/\/$/, '')
export async function aiRequest<T>(route: string, body?: unknown, method = body == null ? 'GET' : 'POST'): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 110000)
  try {
    const response = await fetch(`${API_BASE}/api${route}`, {
      method, signal: controller.signal, cache: 'no-store',
      headers: { ...(body == null ? {} : { 'Content-Type': 'application/json' }), ...(aiToken() ? { Authorization: `Bearer ${aiToken()}` } : {}) },
      body: body == null ? undefined : JSON.stringify(body)
    })
    const data = await response.json().catch(() => { throw new Error('AI 服务未启动或地址配置不正确') })
    if (!response.ok) {
      if (response.status === 401) saveAiToken('')
      throw new Error(data.error || 'AI 请求失败')
    }
    return data as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('请求等待超时，请到生成记录查看结果，避免重复提交')
    if (error instanceof TypeError) throw new Error('无法连接 AI 后台，请检查服务和网络')
    throw error
  } finally { clearTimeout(timer) }
}

export function countEssayWords(text: string): number { return (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []).length }
