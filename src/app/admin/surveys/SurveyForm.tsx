'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type QuestionDraft = {
  localId: string
  id: string | null
  text: string
  options: string[]
  order: number
}

type Props = {
  surveyId?: string
  initialTitle?: string
  initialDescription?: string
  initialTargetRoles?: string[]
  initialStatus?: string
  initialQuestions?: QuestionDraft[]
}

let localIdCounter = 0
function nextLocalId() { return `local_${++localIdCounter}` }

function emptyQuestion(order: number): QuestionDraft {
  return { localId: nextLocalId(), id: null, text: '', options: ['', ''], order }
}

export default function SurveyForm({
  surveyId,
  initialTitle = '',
  initialDescription = '',
  initialTargetRoles = [],
  initialStatus = 'draft',
  initialQuestions = [],
}: Props) {
  const router = useRouter()
  const isEdit = !!surveyId

  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [targetRoles, setTargetRoles] = useState<string[]>(initialTargetRoles)
  const [status, setStatus] = useState(initialStatus)
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions.length > 0 ? initialQuestions : [emptyQuestion(1)]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [removedIds, setRemovedIds] = useState<string[]>([])

  const toggleRole = (r: string) =>
    setTargetRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  const addQuestion = () =>
    setQuestions(prev => [...prev, emptyQuestion(prev.length + 1)])

  const removeQuestion = (localId: string) => {
    const q = questions.find(q => q.localId === localId)
    if (q?.id) setRemovedIds(prev => [...prev, q.id!])
    setQuestions(prev => prev.filter(q => q.localId !== localId).map((q, i) => ({ ...q, order: i + 1 })))
  }

  const moveQuestion = (localId: string, dir: -1 | 1) => {
    setQuestions(prev => {
      const idx = prev.findIndex(q => q.localId === localId)
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr.map((q, i) => ({ ...q, order: i + 1 }))
    })
  }

  const updateQuestion = (localId: string, patch: Partial<QuestionDraft>) =>
    setQuestions(prev => prev.map(q => q.localId === localId ? { ...q, ...patch } : q))

  const updateOption = (localId: string, optIdx: number, value: string) =>
    setQuestions(prev => prev.map(q => {
      if (q.localId !== localId) return q
      const opts = [...q.options]
      opts[optIdx] = value
      return { ...q, options: opts }
    }))

  const addOption = (localId: string) =>
    setQuestions(prev => prev.map(q => {
      if (q.localId !== localId) return q
      if (q.options.length >= 6) return q
      return { ...q, options: [...q.options, ''] }
    }))

  const removeOption = (localId: string, optIdx: number) =>
    setQuestions(prev => prev.map(q => {
      if (q.localId !== localId || q.options.length <= 2) return q
      return { ...q, options: q.options.filter((_, i) => i !== optIdx) }
    }))

  const handleSubmit = async (publishStatus?: string) => {
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }
    if (targetRoles.length === 0) { setError('Select at least one target role.'); return }
    for (const q of questions) {
      if (!q.text.trim()) { setError('All questions must have text.'); return }
      const validOpts = q.options.filter(o => o.trim())
      if (validOpts.length < 2) { setError('Each question needs at least 2 non-empty options.'); return }
    }

    setSaving(true)
    try {
      const finalStatus = publishStatus ?? status

      if (!isEdit) {
        const res = await fetch('/api/admin/surveys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, targetRoles, status: finalStatus }),
        })
        if (!res.ok) { setError('Failed to create survey.'); setSaving(false); return }
        const { survey } = await res.json()

        for (const q of questions) {
          await fetch(`/api/admin/surveys/${survey.id}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: q.text.trim(),
              options: q.options.filter(o => o.trim()),
              order: q.order,
            }),
          })
        }
      } else {
        await fetch(`/api/admin/surveys/${surveyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, targetRoles, status: finalStatus }),
        })

        for (const id of removedIds) {
          await fetch(`/api/admin/surveys/${surveyId}/questions/${id}`, { method: 'DELETE' })
        }

        for (const q of questions) {
          if (!q.id) {
            await fetch(`/api/admin/surveys/${surveyId}/questions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: q.text.trim(),
                options: q.options.filter(o => o.trim()),
                order: q.order,
              }),
            })
          } else {
            await fetch(`/api/admin/surveys/${surveyId}/questions/${q.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: q.text.trim(),
                options: q.options.filter(o => o.trim()),
                order: q.order,
              }),
            })
          }
        }
      }

      router.push('/admin/surveys')
      router.refresh()
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
        <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">
          {isEdit ? 'Edit Survey' : 'New Survey'}
        </h1>
        <p className="mt-1 text-sm text-[#c4cad6]">
          Build clear survey questions and publish to creators and/or sponsors.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#e8f4ff]">Survey Details</h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#b9c5d8]">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter survey title"
            className="w-full rounded-lg border border-white/12 bg-black/20 px-3 py-2 text-sm text-[#e8f4ff] outline-none transition-colors placeholder:text-[#8f97ab] focus:border-[#99f7ff]/55"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#b9c5d8]">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description shown to users"
            rows={2}
            className="w-full resize-none rounded-lg border border-white/12 bg-black/20 px-3 py-2 text-sm text-[#e8f4ff] outline-none transition-colors placeholder:text-[#8f97ab] focus:border-[#99f7ff]/55"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#b9c5d8]">Target Roles *</label>
          <div className="flex gap-4">
            {['creator', 'sponsor'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={targetRoles.includes(r)}
                  onChange={() => toggleRole(r)}
                  className="accent-[#00c8ff]"
                />
                <span className="text-sm capitalize text-[#e8f4ff]">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#b9c5d8]">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-lg border border-white/12 bg-[#0a1223] px-3 py-2 text-sm text-[#e8f4ff] outline-none transition-colors focus:border-[#99f7ff]/55"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#e8f4ff]">Questions</h2>
          <button
            type="button"
            onClick={addQuestion}
            className="text-xs font-medium text-[#99f7ff] transition-colors hover:text-[#d7fbff]"
          >
            + Add question
          </button>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.localId} className="space-y-3 rounded-lg border border-white/12 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#b9c5d8]">Question {idx + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveQuestion(q.localId, -1)}
                    disabled={idx === 0}
                    className="p-1 text-[#a9abb5] transition-colors hover:text-[#e8f4ff] disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(q.localId, 1)}
                    disabled={idx === questions.length - 1}
                    className="p-1 text-[#a9abb5] transition-colors hover:text-[#e8f4ff] disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.localId)}
                    disabled={questions.length === 1}
                    className="p-1 text-red-400/60 hover:text-red-400 disabled:opacity-30 transition-colors"
                    aria-label="Remove question"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <input
                value={q.text}
                onChange={e => updateQuestion(q.localId, { text: e.target.value })}
                placeholder="Question text"
                className="w-full rounded-lg border border-white/12 bg-black/20 px-3 py-2 text-sm text-[#e8f4ff] outline-none transition-colors placeholder:text-[#8f97ab] focus:border-[#99f7ff]/55"
              />

              <div className="space-y-2">
                <p className="text-xs text-[#b9c5d8]">Options ({q.options.length}/6)</p>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={e => updateOption(q.localId, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 text-sm text-[#e8f4ff] outline-none transition-colors placeholder:text-[#8f97ab] focus:border-[#99f7ff]/55"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(q.localId, oi)}
                      disabled={q.options.length <= 2}
                      className="p-1.5 text-red-400/50 hover:text-red-400 disabled:opacity-30 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(q.localId)}
                    className="text-xs text-[#a9abb5] transition-colors hover:text-[#99f7ff]"
                  >
                    + Add option
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="rounded-lg border border-white/14 bg-white/10 px-4 py-2 text-sm font-medium text-[#e8f4ff] transition-colors hover:bg-white/15 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('active')}
          disabled={saving}
          className="rounded-lg border border-[#99f7ff]/45 bg-[#99f7ff]/15 px-4 py-2 text-sm font-semibold text-[#bffcff] transition hover:border-[#99f7ff]/70 hover:bg-[#99f7ff]/22 hover:text-[#e8f4ff] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Publish'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/surveys')}
          disabled={saving}
          className="text-sm dash-text-muted hover:dash-text-bright transition-colors"
        >
          Cancel
        </button>
      </div>
      </div>
    </div>
  )
}
