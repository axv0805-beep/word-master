// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AiWorkspacePage } from '../pages/AiWorkspace'
import { AiResultView } from '../components/AiResult'
import { countEssayWords } from '../core/ai'
import { normalizeDrafts, writingElapsed } from '../core/aiWriting'
import { exportBackup, importBackup, mergePersistedState, useAppStore } from '../store/appStore'

describe('AI learning flows', () => {
  beforeEach(() => { sessionStorage.clear(); useAppStore.getState().resetAll() })
  afterEach(() => { cleanup(); vi.restoreAllMocks() })
  it('draft migration, backup and timer survive reload without changing learning statistics', () => {
    const draft = { topic: 'Reading', essay: "Reading helps us learn. I don't stop.", elapsedMs: 1000, runningSince: 10000 }
    expect(countEssayWords(draft.essay)).toBe(7)
    expect(writingElapsed(draft, 15000)).toBe(6000)
    expect(writingElapsed(draft, 99999999)).toBe(1800000)
    expect(normalizeDrafts({ bad: null, 'guest:cet4': { ...draft, elapsedMs: -1 } })['guest:cet4'].elapsedMs).toBe(0)
    useAppStore.getState().saveWritingDraft('guest:cet4', draft)
    useAppStore.getState().markListeningDrawn('cet4', 'drill', ['listening-fixture'], false)
    useAppStore.getState().markWritingDrawn('cet6', 'mock', 'writing-fixture', false)
    const backup = exportBackup()
    useAppStore.getState().resetAll()
    expect(importBackup(backup).ok).toBe(true)
    expect(useAppStore.getState().writingDrafts['guest:cet4']).toEqual(draft)
    expect(useAppStore.getState().listeningDrawn['cet4:drill']).toEqual(['listening-fixture'])
    expect(useAppStore.getState().writingDrawn['cet6:mock']).toEqual(['writing-fixture'])
    expect(mergePersistedState({}, useAppStore.getState()).writingDrafts).toEqual({})
    expect(useAppStore.getState().daily).toEqual({})
  })
  it('writing submits selected provider and preserves draft while displaying structured feedback', async () => {
    sessionStorage.setItem('word-master-ai-session', 'fixture-only')
    const result = { summary: '表达清楚', strengths: ['切题'], suggestions: ['补充细节'], corrections: [], modelEssay: 'Reference essay.' }
    const mock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const route = String(input)
      const body = route.endsWith('/models') ? { models: [{ providerId: 'p1', providerName: 'DeepSeek', model: 'fixture-model' }] } : route.endsWith('/auth/me') ? { user: { id: 'learner', username: 'learner', role: 'user', dailyLimit: 20 } } : { id: 'result1', status: 'done', result }
      return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
    })
    render(<MemoryRouter initialEntries={['/learn/ai/writing/cet4']}><Routes><Route path="/learn/ai/writing/:level" element={<AiWorkspacePage />} /></Routes></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('button', { name: '提交 AI 批改' }).hasAttribute('disabled')).toBe(false))
    fireEvent.change(screen.getByLabelText('题目与要求'), { target: { value: 'Reading every day' } })
    const essay = 'Reading every day helps me learn about the world.'
    fireEvent.change(screen.getByLabelText('你的作文'), { target: { value: essay } })
    fireEvent.click(screen.getByRole('button', { name: '提交 AI 批改' }))
    await waitFor(() => expect(screen.getByText('表达清楚')).toBeTruthy())
    expect(useAppStore.getState().writingDrafts['learner:cet4'].essay).toBe(essay)
    const request = mock.mock.calls.find(([url]) => String(url).endsWith('/generations'))!
    expect(JSON.parse(request[1]!.body as string)).toMatchObject({ providerId: 'p1', model: 'fixture-model', feature: 'writing', input: { essay } })
  })
  it('quiz shows feedback only after answering and prevents repeat answer changes', () => {
    render(<AiResultView feature="quiz" result={{ questions: [{ stem: 'Reading can ___ everyone.', options: ['benefit', 'cancel', 'forget', 'lose'], answer: 0, explanation: 'benefit 表示使受益', word: 'benefit' }] }} />)
    expect(screen.queryByText(/正确答案/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /cancel/ }))
    expect(screen.getByText(/正确答案：A/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /benefit/ }).hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '重新练习' }))
    expect(screen.queryByText(/正确答案/)).toBeNull()
  })
})
