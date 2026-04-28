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
        checked ? 'bg-[#99f7ff]' : 'bg-white/10'
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
      <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-6">
        <p className="text-sm text-[#a9abb5]">Loading preferences…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/12 bg-black/30 px-4 py-2.5">
          <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-[#99f7ff]">Notification</span>
          <span className="w-16 text-center font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-[#99f7ff]">In-App</span>
          <span className="w-16 text-center font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-[#99f7ff]">Email</span>
        </div>
        {entries.map((entry, i) => (
          <div
            key={entry.type}
            className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.02] ${
              i < entries.length - 1 ? 'border-b border-white/12' : ''
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-[#e8f4ff]">{entry.label}</p>
              <p className="mt-0.5 text-xs text-[#a9abb5]">{entry.description}</p>
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

      <div className="rounded-xl border border-white/12 bg-black/20 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/15 px-5 py-2 text-sm font-semibold text-[#99f7ff] transition-colors hover:bg-[#99f7ff]/20 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
        {saved && <span className="text-xs text-emerald-300">Saved successfully.</span>}
        </div>
        <p className="mt-2 text-xs text-[#a9abb5]">
          Email notifications require <span className="text-[#99f7ff]">RESEND_API_KEY</span> to be configured.
        </p>
      </div>
    </div>
  )
}
