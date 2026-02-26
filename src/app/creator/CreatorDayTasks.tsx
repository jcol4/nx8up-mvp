'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  addCreatorDayTask,
  updateCreatorDayTask,
  deleteCreatorDayTask,
  toggleCreatorDayTask,
  type CalendarTask,
} from './_actions'

type Props = {
  dateKey: string
  selectedDate: Date
  tasks: CalendarTask[]
}

export default function CreatorDayTasks({ dateKey, selectedDate, tasks }: Props) {
  const router = useRouter()
  const [newTask, setNewTask] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const handleToggle = async (taskId: string) => {
    await toggleCreatorDayTask(dateKey, taskId)
    router.refresh()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    const res = await addCreatorDayTask(dateKey, newTask.trim())
    if (!res.error) {
      setNewTask('')
      router.refresh()
    }
  }

  const startEdit = (t: CalendarTask) => {
    setEditingId(t.id)
    setEditText(t.text)
  }

  const handleSaveEdit = async () => {
    if (editingId === null) return
    await updateCreatorDayTask(dateKey, editingId, { text: editText.trim() })
    setEditingId(null)
    setEditText('')
    router.refresh()
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleDelete = async (taskId: string) => {
    await deleteCreatorDayTask(dateKey, taskId)
    if (editingId === taskId) handleCancelEdit()
    router.refresh()
  }

  const inputClass =
    'flex-1 px-3 py-1.5 rounded-lg cr-border border cr-bg-inner cr-text text-sm placeholder-[#3a5570] focus:outline-none focus:ring-1 focus:ring-[#00c8ff]/50'

  return (
    <div className="mt-4">
      <p className="text-xs cr-text-muted mb-2">Tasks for {dateLabel}</p>
      <ul className="space-y-2 text-sm cr-text">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 group">
            <button
              type="button"
              onClick={() => handleToggle(t.id)}
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                t.done ? 'bg-[#22c55e] border-[#22c55e]' : 'cr-border border bg-transparent'
              }`}
              aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
            >
              {t.done && (
                <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            {editingId === t.id ? (
              <div className="flex-1 flex gap-1">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  className={inputClass}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-2 py-1 rounded bg-[#22c55e]/20 text-[#22c55e] text-xs hover:bg-[#22c55e]/30"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2 py-1 rounded cr-text-muted hover:bg-white/10 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span
                  className={`flex-1 cursor-pointer ${t.done ? 'line-through cr-text-muted' : ''}`}
                  onClick={() => startEdit(t)}
                >
                  {t.text}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="p-1 rounded cr-text-muted hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete task"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="mt-2 flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add task..."
          className={inputClass}
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-xs font-medium hover:bg-[#00c8ff]/30 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}
