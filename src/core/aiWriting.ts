export interface WritingDraft { topic: string; essay: string; elapsedMs: number; runningSince: number | null }
export type WritingDrafts = Record<string, WritingDraft>
export function normalizeDrafts(value: unknown): WritingDrafts {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: WritingDrafts = {}
  for (const [key, raw] of Object.entries(value).slice(0, 100)) {
    if (!raw || typeof raw !== 'object' || !/^[a-zA-Z0-9_-]+:(cet4|cet6)$/.test(key)) continue
    const draft = raw as Partial<WritingDraft>
    if (typeof draft.topic !== 'string' || typeof draft.essay !== 'string') continue
    result[key] = { topic: draft.topic.slice(0, 2000), essay: draft.essay.slice(0, 12000),
      elapsedMs: typeof draft.elapsedMs === 'number' && Number.isFinite(draft.elapsedMs) ? Math.max(0, Math.min(draft.elapsedMs, 1800000)) : 0,
      runningSince: typeof draft.runningSince === 'number' && Number.isFinite(draft.runningSince) && draft.runningSince > 0 ? draft.runningSince : null }
  }
  return result
}
export function writingElapsed(draft: WritingDraft, now = Date.now()): number {
  return Math.min(1800000, draft.elapsedMs + (draft.runningSince == null ? 0 : Math.max(0, now - draft.runningSince)))
}
