/**
 * Inline role-assignment dropdown for the admin Users table.
 *
 * Client component that renders a "Set role" button. Clicking it opens a
 * small dropdown listing all assignable roles. Selecting a role calls the
 * `setUserRole` server action and — on success — reloads the page via
 * `window.location.reload()` to reflect the updated role badge.
 *
 * The currently active role is highlighted with a checkmark (✓) in the
 * dropdown. Errors returned by the server action are displayed inline below
 * the button.
 *
 * Gotcha: the page reload (`window.location.reload()`) discards any in-memory
 * state (e.g., scroll position, open filters). A future improvement would be
 * to use Next.js `router.refresh()` instead, which re-fetches server data
 * without a full navigation.
 */
'use client'

import { useState } from 'react'
import { setUserRole } from './_actions'

type Props = {
  userId: string
  currentRole: string | null
}

const ROLES = ['creator', 'sponsor', 'admin']

export default function AdminUserRoleButton({ userId, currentRole }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /** Calls the server action to set the role, then reloads the page on success. */
  const handleSetRole = async (role: string) => {
    setLoading(true)
    setError('')
    const res = await setUserRole(userId, role)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setOpen(false)
      // Refresh page to reflect new role
      window.location.reload()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="text-xs px-2 py-1 rounded dash-panel dash-text-muted hover:dash-text-bright border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Set role'}
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 w-36 rounded-lg border border-white/10 bg-[#0d1f35] shadow-xl overflow-hidden">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleSetRole(r)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5 ${
                currentRole === r
                  ? 'text-[#00c8ff] font-semibold'
                  : 'dash-text-muted'
              }`}
            >
              {r}
              {currentRole === r && ' ✓'}
            </button>
          ))}
          <div className="border-t border-white/10" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full text-left px-3 py-2 text-xs dash-text-muted hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-1 absolute">{error}</p>
      )}
    </div>
  )
}