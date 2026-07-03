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
        className="inline-flex items-center justify-center rounded-lg border border-[#99f7ff]/45 bg-[#99f7ff]/12 px-3 py-1.5 text-xs font-semibold text-[#bffcff] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-[#99f7ff]/65 hover:bg-[#99f7ff]/22 hover:text-white disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Set role'}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-40 overflow-hidden rounded-lg border border-[#99f7ff]/25 bg-[#070d14] shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleSetRole(r)}
              className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-[#99f7ff]/10 ${
                currentRole === r ? 'text-[#99f7ff]' : 'text-white/90'
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
            className="w-full px-3 py-2 text-left text-xs font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
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