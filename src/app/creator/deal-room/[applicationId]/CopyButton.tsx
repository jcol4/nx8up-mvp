'use client'

import { useState } from 'react'

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
