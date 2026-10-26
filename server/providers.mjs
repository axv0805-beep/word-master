import http from 'node:http'
import https from 'node:https'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export const PRESETS = [
  { id: 'deepseek', name: 'DeepSeek', protocol: 'openai', baseUrl: 'https://api.deepseek.com' },
  { id: 'openai', name: 'OpenAI', protocol: 'responses', baseUrl: 'https://api.openai.com/v1' },
  { id: 'qwen', name: '通义千问', protocol: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { id: 'moonshot', name: 'Kimi / Moonshot', protocol: 'openai', baseUrl: 'https://api.moonshot.cn/v1' },
  { id: 'zhipu', name: '智谱 GLM', protocol: 'openai', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  { id: 'siliconflow', name: '硅基流动', protocol: 'openai', baseUrl: 'https://api.siliconflow.cn/v1' },
  { id: 'anthropic', name: 'Anthropic Claude', protocol: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' },
  { id: 'gemini', name: 'Google Gemini', protocol: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  { id: 'custom', name: '自定义接口', protocol: 'openai', baseUrl: '' }
]

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

export function normalizeBase(value) {
  let url
  try { url = new URL(value) } catch { throw new ApiError(400, '请输入完整的 API Base URL') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new ApiError(400, '接口地址只能包含 http(s) 域名和路径，不能包含密钥、查询参数或片段')
  }
  url.pathname = url.pathname.replace(/\/(?:chat\/completions|responses|messages|models)\/?$/, '')
  return url.href.replace(/\/+$/, '')
}

// Permit public unicast only. Pin the validated DNS answer to this request to prevent DNS rebinding.
export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number)
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0)) ||
      (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)))
  }
  if (isIP(address) === 6) return /^[23][0-9a-f]{3}:/i.test(address) && !/^200[12]:/i.test(address)
  return false
}

export async function requestJson(url, { method = 'GET', headers = {}, body, allowPrivate = false, timeout = 90000 } = {}) {
  const target = new URL(url)
  if (!['https:', 'http:'].includes(target.protocol) || (!allowPrivate && target.protocol !== 'https:')) {
    throw new ApiError(400, '外部接口必须使用 HTTPS')
  }
  const host = target.hostname.replace(/^\[|\]$/g, '')
  const addresses = await lookup(host, { all: true }).catch(() => { throw new ApiError(502, '接口域名解析失败') })
  if (!addresses.length || (!allowPrivate && addresses.some((item) => !publicAddress(item.address)))) {
    throw new ApiError(400, '该接口地址不可访问；本地模型需由服务端显式允许内网接口')
  }
  const chosen = addresses[0]
  return new Promise((resolve, reject) => {
    const data = body == null ? undefined : JSON.stringify(body)
    const transport = target.protocol === 'https:' ? https : http
    const req = transport.request(target, {
      method, agent: false,
      headers: { Accept: 'application/json', ...(data ? { 'Content-Type': 'application/json' } : {}), ...headers },
      lookup: (_host, options, cb) => options?.all ? cb(null, [chosen]) : cb(null, chosen.address, chosen.family)
    }, (res) => {
      const chunks = []; let size = 0
      res.on('data', (chunk) => {
        size += chunk.length
        if (size > 2 * 1024 * 1024) req.destroy(new ApiError(502, '模型响应过大'))
        else chunks.push(chunk)
      })
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          // Never expose upstream error bodies: some gateways echo credentials or prompts.
          const hints = { 401: '密钥无效', 403: '没有访问权限', 404: '接口路径或模型不存在', 429: '额度不足或请求过于频繁' }
          reject(new ApiError(502, `模型服务返回 HTTP ${res.statusCode}：${hints[res.statusCode] ?? '请检查协议和模型配置'}`))
          return
        }
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
        catch { reject(new ApiError(502, '接口未返回有效 JSON')) }
      })
      res.on('error', () => reject(new ApiError(502, '模型响应中断')))
    })
    const timer = setTimeout(() => req.destroy(new ApiError(504, '模型响应超时，请稍后重试')), timeout)
    req.on('close', () => clearTimeout(timer))
    req.on('error', (err) => reject(err instanceof ApiError ? err : new ApiError(502, '无法连接模型服务')))
    req.end(data)
  })
}

function headersFor(provider) {
  if (provider.protocol === 'anthropic') return { 'x-api-key': provider.key, 'anthropic-version': '2023-06-01' }
  if (provider.protocol === 'gemini') return { 'x-goog-api-key': provider.key }
  return { Authorization: `Bearer ${provider.key}` }
}

export async function listModels(provider, options = {}) {
  const models = new Map()
  let cursor = ''
  for (let page = 0; page < 10; page++) {
    const url = new URL(`${provider.baseUrl}/models`)
    if (provider.protocol === 'anthropic') { url.searchParams.set('limit', '1000'); if (cursor) url.searchParams.set('after_id', cursor) }
    if (provider.protocol === 'gemini') { url.searchParams.set('pageSize', '1000'); if (cursor) url.searchParams.set('pageToken', cursor) }
    const data = await requestJson(url, { ...options, timeout: 15000, headers: headersFor(provider) })
    const entries = provider.protocol === 'gemini' ? data.models : data.data
    if (!Array.isArray(entries)) throw new ApiError(502, '接口未提供模型列表，可手动填写模型 ID')
    for (const item of entries) {
      if (provider.protocol === 'gemini' && !item.supportedGenerationMethods?.includes('generateContent')) continue
      const id = provider.protocol === 'gemini' ? item.name?.replace(/^models\//, '') : item.id
      if (typeof id === 'string' && id.length < 200) models.set(id, { id, name: item.displayName || item.display_name || item.name || id })
    }
    const next = provider.protocol === 'gemini' ? data.nextPageToken : data.has_more ? data.last_id : ''
    if (!next) return { models: [...models.values()], truncated: false }
    if (cursor === next) throw new ApiError(502, '模型列表分页异常，可手动填写模型 ID')
    cursor = next
  }
  return { models: [...models.values()], truncated: true }
}

export async function generate(provider, model, system, input, options = {}) {
  const user = JSON.stringify(input)
  let endpoint, body
  if (provider.protocol === 'anthropic') {
    endpoint = '/messages'
    body = { model, max_tokens: 4096, system, messages: [{ role: 'user', content: user }] }
  } else if (provider.protocol === 'gemini') {
    endpoint = `/models/${encodeURIComponent(model.replace(/^models\//, ''))}:generateContent`
    body = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { maxOutputTokens: 4096, responseMimeType: 'application/json' } }
  } else if (provider.protocol === 'responses') {
    endpoint = '/responses'
    body = { model, instructions: system, input: user, max_output_tokens: 4096, store: false }
  } else {
    endpoint = '/chat/completions'
    body = { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], stream: false,
      [provider.tokenParameter === 'max_completion_tokens' ? 'max_completion_tokens' : 'max_tokens']: 4096 }
    if (provider.jsonMode) body.response_format = { type: 'json_object' }
  }
  const data = await requestJson(`${provider.baseUrl}${endpoint}`, { ...options, method: 'POST', headers: headersFor(provider), body })
  let content
  if (provider.protocol === 'anthropic') content = data.content?.filter((b) => b.type === 'text').map((b) => b.text).join('')
  else if (provider.protocol === 'gemini') content = data.candidates?.[0]?.content?.parts?.filter((b) => !b.thought).map((b) => b.text ?? '').join('')
  else if (provider.protocol === 'responses') content = data.output?.flatMap((b) => b.content ?? []).filter((b) => b.type === 'output_text').map((b) => b.text).join('')
  else content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) throw new ApiError(502, '模型没有返回可用文本，请检查模型是否支持文本生成')
  let result
  try { result = JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) }
  catch { throw new ApiError(502, '模型返回格式不符合要求，请换用支持 JSON 输出的模型') }
  return { result, usage: data.usage ?? data.usageMetadata ?? {} }
}
