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

/** This is the application's backend URL, never a model provider URL or secret. Production builds read .env.production. */
export const AI_API_BASE = (import.meta.env.VITE_AI_API_BASE_URL || '').trim().replace(/\/$/, '')
/** Packaged shells (Android WebView assets, Electron static server) have no /api of their own. */
function packagedWithoutBackend(): boolean {
  if (AI_API_BASE) return false
  try { return location.hostname === 'appassets.androidplatform.net' || location.protocol === 'file:' } catch { return false }
}
export async function aiRequest<T>(route: string, body?: unknown, method = body == null ? 'GET' : 'POST'): Promise<T> {
  if (packagedWithoutBackend()) throw new Error('此安装包未配置 AI 后台地址，请在「设置 → 检查更新」升级到最新版；背词、听力和离线写作不受影响')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 110000)
  try {
    const response = await fetch(`${AI_API_BASE}/api${route}`, {
      method, signal: controller.signal, cache: 'no-store',
      headers: { ...(body == null ? {} : { 'Content-Type': 'application/json' }), ...(aiToken() ? { Authorization: `Bearer ${aiToken()}` } : {}) },
      body: body == null ? undefined : JSON.stringify(body)
    })
    // A non-JSON answer means something other than this backend replied (static page, proxy error, gateway 502).
    const data = await response.json().catch(() => { throw new Error(`AI 后台暂时不可用（HTTP ${response.status}），请稍后重试；如持续出现请联系管理员`) })
    if (!response.ok) {
      if (response.status === 401) saveAiToken('')
      throw new Error(data.error || `AI 请求失败（HTTP ${response.status}）`)
    }
    return data as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('请求等待超时，请到生成记录查看结果，避免重复提交')
    if (error instanceof TypeError) {
      throw new Error(typeof navigator !== 'undefined' && navigator.onLine === false
        ? '当前没有网络，AI 功能需要联网；背词、听力和离线写作仍可使用'
        : '无法连接 AI 后台，请检查网络后重试')
    }
    throw error
  } finally { clearTimeout(timer) }
}

export function countEssayWords(text: string): number { return (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []).length }
