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
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold dash-text-bright">
          {isEdit ? 'Edit Survey' : 'New Survey'}
        </h1>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
      )}

      <div className="dash-panel p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-text-bright">Survey Details</h2>

        <div className="space-y-1">
          <label className="text-xs dash-text-muted font-medium">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter survey title"
            className="w-full px-3 py-2 rounded-lg text-sm dash-text-bright bg-white/5 border dash-border focus:border-[#00c8ff]/50 outline-none placeholder:dash-text-muted transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs dash-text-muted font-medium">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description shown to users"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm dash-text-bright bg-white/5 border dash-border focus:border-[#00c8ff]/50 outline-none placeholder:dash-text-muted transition-colors resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs dash-text-muted font-medium">Target Roles *</label>
          <div className="flex gap-4">
            {['creator', 'sponsor'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={targetRoles.includes(r)}
                  onChange={() => toggleRole(r)}
                  className="accent-[#00c8ff]"
                />
                <span className="text-sm dash-text-bright capitalize">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs dash-text-muted font-medium">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm dash-text-bright bg-[#0a1223] border dash-border focus:border-[#00c8ff]/50 outline-none transition-colors"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="dash-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold dash-text-bright">Questions</h2>
          <button
            type="button"
            onClick={addQuestion}
            className="text-xs dash-accent hover:underline"
          >
            + Add question
          </button>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.localId} className="border dash-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs dash-text-muted font-medium">Question {idx + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveQuestion(q.localId, -1)}
                    disabled={idx === 0}
                    className="p-1 dash-text-muted hover:dash-text-bright disabled:opacity-30 transition-colors"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(q.localId, 1)}
                    disabled={idx === questions.length - 1}
                    className="p-1 dash-text-muted hover:dash-text-bright disabled:opacity-30 transition-colors"
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
                className="w-full px-3 py-2 rounded-lg text-sm dash-text-bright bg-white/5 border dash-border focus:border-[#00c8ff]/50 outline-none placeholder:dash-text-muted transition-colors"
              />

              <div className="space-y-2">
                <p className="text-xs dash-text-muted">Options ({q.options.length}/6)</p>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={e => updateOption(q.localId, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 px-3 py-1.5 rounded-lg text-sm dash-text-bright bg-white/5 border dash-border focus:border-[#00c8ff]/50 outline-none placeholder:dash-text-muted transition-colors"
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
                    className="text-xs dash-text-muted hover:dash-accent transition-colors"
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
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 dash-text-bright hover:bg-white/15 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('active')}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00c8ff] text-black hover:bg-[#00b8ef] disabled:opacity-50 transition-colors"
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
  )
}
