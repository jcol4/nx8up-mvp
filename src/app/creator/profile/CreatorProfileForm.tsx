'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCreatorProfile, deleteCreatorProfile } from './_actions'
import type { CreatorProfile } from '@/lib/creator-profile'

type Props = {
  profile: CreatorProfile | null
  categoriesOptions: readonly string[]
}

export default function CreatorProfileForm({ profile, categoriesOptions }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [categories, setCategories] = useState<string[]>(profile?.categories ?? [])
  const [urls, setUrls] = useState<{ label?: string; url: string }[]>(
    profile?.urls?.length ? profile.urls : [{ url: '' }]
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const addUrl = () => {
    setUrls((prev) => [...prev, { url: '' }])
  }

  const removeUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const updateUrl = (index: number, field: 'label' | 'url', value: string) => {
    setUrls((prev) =>
      prev.map((u, i) =>
        i === index ? { ...u, [field]: value } : u
      )
    )
  }

  const isValidUrl = (s: string): boolean => {
    const trimmed = s.trim()
    if (!trimmed) return false
    try {
      const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      const u = new URL(withProtocol)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
      const host = u.hostname.toLowerCase()
      return host === 'localhost' || host.includes('.')
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    const filledUrls = urls
      .map((u) => ({ label: u.label?.trim() || undefined, url: u.url.trim() }))
      .filter((u) => u.url)
    const invalidUrl = filledUrls.find((u) => !isValidUrl(u.url))
    if (invalidUrl) {
      setError(`"${invalidUrl.url}" is not a valid URL. Use a proper link like https://twitch.tv/you or https://youtube.com/@you`)
      return
    }
    setIsSaving(true)
    const validUrls = filledUrls.map((u) => ({
      label: u.label,
      url: /^https?:\/\//i.test(u.url) ? u.url : `https://${u.url}`,
    }))
    const res = await updateCreatorProfile({
      displayName,
      bio,
      categories,
      urls: validUrls,
    })
    setIsSaving(false)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      router.refresh()
    }
  }

    const handleDelete = async () => {
    setError('')
    setIsDeleting(true)
    const res = await deleteCreatorProfile()
    setIsDeleting(false)
    setShowDeleteConfirm(false)
    if (res.error) {
      setError(res.error)
    } else {
      setDisplayName('')
      setBio('')
      setCategories([])
      setUrls([{ url: '' }])
      router.refresh()
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg cr-border border cr-bg-inner cr-text placeholder-[#3a5570] focus:outline-none focus:ring-1 focus:ring-[#00c8ff]/50'
  const labelClass = 'block text-sm font-medium cr-text-muted mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 cr-success text-sm">
          Profile saved successfully.
        </div>
      )}

      <div>
        <label htmlFor="displayName" className={labelClass}>
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How sponsors see you"
          className={inputClass}
          maxLength={50}
        />
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell sponsors about your content and audience..."
          className={`${inputClass} min-h-[100px] resize-y`}
          maxLength={500}
          rows={4}
        />
      </div>

      <div>
        <label className={labelClass}>Content categories</label>
        <div className="flex flex-wrap gap-2">
          {categoriesOptions.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                categories.includes(cat)
                  ? 'bg-[#00c8ff] text-black'
                  : 'cr-border border cr-text-muted hover:text-[#c8dff0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClass}>Links</label>
          <button
            type="button"
            onClick={addUrl}
            className="text-xs cr-accent hover:underline"
          >
            + Add link
          </button>
        </div>
        <p className="text-xs cr-text-muted mb-2">
          Add Twitch, YouTube, social profiles, or any URL tied to you.
        </p>
        <div className="space-y-4">
          {urls.map((u, i) => (
            <div key={i} className="p-3 rounded-lg cr-border border cr-bg-inner space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={u.label ?? ''}
                  onChange={(e) => updateUrl(i, 'label', e.target.value)}
                  placeholder="Label (e.g. Twitch)"
                  className={`${inputClass} w-full sm:w-36`}
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  disabled={urls.length <= 1}
                  className="p-2.5 rounded-lg cr-text-muted hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors shrink-0"
                  aria-label="Remove link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                inputMode="url"
                value={u.url}
                onChange={(e) => updateUrl(i, 'url', e.target.value)}
                placeholder="https://... or example.com"
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSaving ? 'Saving...' : 'Save profile'}
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="py-2.5 px-5 rounded-lg cr-border border text-sm font-medium cr-text-muted hover:text-red-400 hover:border-red-500/50 transition-colors disabled:opacity-50"
        >
          Clear profile
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="cr-panel max-w-sm w-full">
            <h3 className="cr-panel-title">Clear profile?</h3>
            <p className="text-sm cr-text-muted mb-4">
              This will remove all your profile info. You can add it again anytime.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg cr-border border cr-text hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
              >
                {isDeleting ? 'Clearing...' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
