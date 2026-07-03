'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { deleteCreatorAccount } from './_actions'

export default function DeleteAccountSection() {
  const t = useTranslations('creator.profile')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await deleteCreatorAccount()
      if (result.error) {
        setError(result.error)
        return
      }
      // Clerk session is gone — redirect to home
      window.location.href = '/'
    })
  }

  return (
    <div className="mt-8 rounded-xl border border-red-500/25 bg-red-950/10 p-5">
      <h2 className="font-headline text-sm font-semibold text-red-400">{t('deleteHeading')}</h2>
      <p className="mt-1 text-sm cr-text-muted">
        {t('deleteDesc')}
      </p>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:border-red-500/70 hover:bg-red-950/50"
      >
        {t('deleteButton')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-[#0d0f14] p-6 shadow-2xl">
            <h3 className="font-headline text-lg font-semibold text-[#e8f4ff]">{t('deleteModalTitle')}</h3>
            <p className="mt-3 text-sm cr-text-muted">
              {t('deleteModalWarning')}
            </p>

            {error && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setOpen(false); setError(null) }}
                disabled={isPending}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium cr-text-muted transition-colors hover:border-white/20 hover:text-[#e8f4ff] disabled:opacity-50"
              >
                {t('deleteCancel')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-lg border border-red-500/50 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? t('deleteDeleting') : t('deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
