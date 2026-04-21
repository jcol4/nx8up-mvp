/**
 * CopyButton — small client component that copies `text` to the clipboard
 * and briefly shows "Copied!" feedback for 2 seconds.
 *
 * Uses the Clipboard API (`navigator.clipboard.writeText`), which requires
 * a secure context (HTTPS or localhost). No fallback for unsupported browsers.
 */
'use client'

import { useState } from 'react'

/** @param text - The string to copy to the clipboard when clicked. */
export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 text-xs px-2 py-1 rounded border border-[#00c8ff]/30 text-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
