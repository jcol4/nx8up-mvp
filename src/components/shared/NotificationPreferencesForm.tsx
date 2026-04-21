/**
 * NotificationPreferencesForm — per-type toggle grid for in-app and email notification channels.
 * Loads current prefs from /api/notifications/preferences on mount and PATCHes on save.
 * Defaults to inApp=true, email=false for any type with no saved pref.
 */
'use client'

import { useState, useEffect } from 'react'

type PrefEntry = {
  type: string
  label: string
  /** Describes what triggers this notification type. */
  description: string
}

type TypePrefs = { inApp: boolean; email: boolean }
type PrefsMap = Record<string, TypePrefs>

const DEFAULT_PREFS: TypePrefs = { inApp: true, email: false }

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-[#00c8ff]' : 'bg-white/10'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

type Props = {
  entries: PrefEntry[]
}

export default function NotificationPreferencesForm({ entries }: Props) {
  const [prefs, setPrefs] = useState<PrefsMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((data) => {
        setPrefs(data.prefs ?? {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getPref = (type: string): TypePrefs => prefs[type] ?? DEFAULT_PREFS

  const update = (type: string, channel: 'inApp' | 'email', value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      [type]: { ...getPref(type), [channel]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // non-fatal
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="cr-panel rounded-xl p-6">
        <p className="text-sm cr-text-muted">Loading preferences…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="cr-panel rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2 border-b cr-border">
          <span className="text-xs font-semibold cr-text-muted uppercase tracking-wider">Notification</span>
          <span className="text-xs font-semibold cr-text-muted uppercase tracking-wider text-center w-16">In-App</span>
          <span className="text-xs font-semibold cr-text-muted uppercase tracking-wider text-center w-16">Email</span>
        </div>
        {entries.map((entry, i) => (
          <div
            key={entry.type}
            className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 ${
              i < entries.length - 1 ? 'border-b cr-border' : ''
            }`}
          >
            <div>
              <p className="text-sm cr-text-bright font-medium">{entry.label}</p>
              <p className="text-xs cr-text-muted mt-0.5">{entry.description}</p>
            </div>
            <div className="flex justify-center w-16">
              <Toggle
                checked={getPref(entry.type).inApp}
                onChange={(v) => update(entry.type, 'inApp', v)}
                label={`${entry.label} in-app`}
              />
            </div>
            <div className="flex justify-center w-16">
              <Toggle
                checked={getPref(entry.type).email}
                onChange={(v) => update(entry.type, 'email', v)}
                label={`${entry.label} email`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#00c8ff]/20 text-[#00c8ff] border border-[#00c8ff]/30 hover:bg-[#00c8ff]/30 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
        {saved && <span className="text-xs text-green-400">Saved!</span>}
      </div>

      <p className="text-xs cr-text-muted">
        Email notifications require <span className="cr-accent">RESEND_API_KEY</span> to be configured.
      </p>
    </div>
  )
}
