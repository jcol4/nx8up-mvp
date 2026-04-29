'use client'

import { useUser } from '@clerk/nextjs'
import { useRef, useState } from 'react'

export default function ProfilePictureUpload() {
  const { user } = useUser()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    if (!user) return
    setUploading(true)
    setError('')
    try {
      await user.setProfileImage({ file })
    } catch {
      setError('Failed to update profile picture. Try a different image.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-white/20 transition-colors hover:border-[#99f7ff]/50 disabled:cursor-not-allowed"
        aria-label="Change profile picture"
      >
        {user?.imageUrl && (
          <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#99f7ff] border-t-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/50 hover:opacity-100">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
      </button>

      <div>
        <p className="text-sm font-medium text-[#e8f4ff]">Profile Picture</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-0.5 text-xs text-[#99f7ff] hover:underline disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Change photo'}
        </button>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
