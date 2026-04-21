/**
 * YouTubeConnect — YouTube channel link/unlink card for the creator profile page.
 * Reads OAuth result from URL search params (?youtube_linked=1 / ?youtube_error=...) on mount
 * and clears them with router.replace. Shows subscriber count, avg views, and top categories.
 */
'use client'

import * as React from 'react'
import { unlinkYouTubeAccount } from '@/app/creator/profile/_actions'
import { useRouter, useSearchParams } from 'next/navigation'

interface YouTubeData {
  handle: string | null
  channel_name: string | null
  subscribers: number | null
  avg_views: number | null
  top_categories: string[]
  synced_at: Date | null
}

interface YouTubeConnectProps {
  initial: YouTubeData
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export default function YouTubeConnect({ initial }: YouTubeConnectProps) {
  const [youtube, setYoutube] = React.useState<YouTubeData>(initial)
  const [isUnlinking, setIsUnlinking] = React.useState(false)
  const [error, setError] = React.useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle redirect params from OAuth callback
  React.useEffect(() => {
    if (searchParams.get('youtube_linked') === '1') {
      router.replace('/creator/profile')
      router.refresh()
    }
    const youtubeError = searchParams.get('youtube_error')
    if (youtubeError) {
      setError(decodeURIComponent(youtubeError))
      router.replace('/creator/profile')
    }
  }, [searchParams, router])

  const handleUnlink = async () => {
    if (!confirm('Unlink your YouTube channel from NX8UP?')) return
    setIsUnlinking(true)
    setError('')
    const res = await unlinkYouTubeAccount()
    if (res.error) {
      setError(res.error)
      setIsUnlinking(false)
    } else {
      setYoutube({ handle: null, channel_name: null, subscribers: null, avg_views: null, top_categories: [], synced_at: null })
      setIsUnlinking(false)
    }
  }

  return (
    <>
      <style>{`
        .yt-card { background: rgba(6,13,24,0.6); border: 1px solid rgba(255,68,68,0.1); border-radius: 10px; padding: 1.25rem; transition: border-color 0.2s; }
        .yt-card:hover { border-color: rgba(255,68,68,0.18); }
        .yt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .yt-card-title { display: flex; align-items: center; gap: 8px; font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #3a5570; }
        .yt-icon { color: #ff4444; }
        .yt-profile { display: flex; align-items: center; gap: 12px; }
        .yt-avatar-placeholder { width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(255,68,68,0.3); background: rgba(255,68,68,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ff4444; }
        .yt-info { flex: 1; min-width: 0; }
        .yt-display-name { font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700; color: #c8dff0; letter-spacing: 0.03em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .yt-handle { font-family: 'Exo 2', sans-serif; font-size: 0.75rem; color: #3a5570; }
        .yt-stats { display: flex; gap: 12px; margin-top: 0.75rem; flex-wrap: wrap; }
        .yt-stat { display: flex; flex-direction: column; gap: 2px; }
        .yt-stat-value { font-family: 'Rajdhani', sans-serif; font-size: 0.95rem; font-weight: 700; color: #c8dff0; letter-spacing: 0.03em; }
        .yt-stat-label { font-family: 'Exo 2', sans-serif; font-size: 0.7rem; color: #3a5570; text-transform: uppercase; letter-spacing: 0.06em; }
        .yt-categories { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 0.75rem; }
        .yt-category-tag { padding: 2px 8px; border-radius: 999px; font-family: 'Rajdhani', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(255,68,68,0.08); border: 1px solid rgba(255,68,68,0.2); color: #ff6b6b; }
        .yt-actions { display: flex; gap: 8px; margin-top: 0.875rem; align-items: center; }
        .yt-btn { padding: 0.45rem 0.875rem; border-radius: 6px; font-family: 'Rajdhani', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
        .yt-btn--unlink { background: rgba(255,107,138,0.05); border: 1px solid rgba(255,107,138,0.15); color: #ff6b8a; }
        .yt-btn--unlink:hover { background: rgba(255,107,138,0.1); border-color: rgba(255,107,138,0.3); }
        .yt-btn--unlink:disabled { opacity: 0.5; cursor: not-allowed; }
        .yt-synced { font-family: 'Exo 2', sans-serif; font-size: 0.7rem; color: #2a3f55; margin-left: auto; }
        .yt-approx-note { font-family: 'Exo 2', sans-serif; font-size: 0.7rem; color: #3a5570; margin-top: 0.4rem; font-style: italic; }
        .yt-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0.75rem 0; gap: 0.5rem; }
        .yt-empty-title { font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; font-weight: 600; color: #c8dff0; letter-spacing: 0.03em; }
        .yt-empty-sub { font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #3a5570; line-height: 1.5; max-width: 260px; }
        .yt-btn--connect { background: rgba(255,68,68,0.08); border: 1px solid rgba(255,68,68,0.2); color: #ff4444; margin-top: 0.25rem; text-decoration: none; }
        .yt-btn--connect:hover { background: rgba(255,68,68,0.14); border-color: rgba(255,68,68,0.35); box-shadow: 0 0 16px rgba(255,68,68,0.1); }
        .yt-error { display: flex; align-items: center; gap: 6px; font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #ff6b8a; margin-top: 0.5rem; }
        .nx-spinner-sm { width: 12px; height: 12px; border: 2px solid rgba(255,68,68,0.2); border-top-color: #ff4444; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="yt-card">
        <div className="yt-card-header">
          <div className="yt-card-title">
            <svg className="yt-icon" width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
              <path d="M15.666 1.877A2.013 2.013 0 0 0 14.254.452C13.013.116 8 .116 8 .116s-5.013 0-6.254.336A2.013 2.013 0 0 0 .334 1.877C0 3.13 0 5.75 0 5.75s0 2.62.334 3.873A2.013 2.013 0 0 0 1.746 11.048C2.987 11.384 8 11.384 8 11.384s5.013 0 6.254-.336a2.013 2.013 0 0 0 1.412-1.425C16 8.37 16 5.75 16 5.75s0-2.62-.334-3.873ZM6.386 8.25V3.25L10.545 5.75 6.386 8.25Z"/>
            </svg>
            YouTube
          </div>
        </div>

        {youtube.handle ? (
          <>
            <div className="yt-profile">
              <div className="yt-avatar-placeholder">
                <svg width="20" height="16" viewBox="0 0 16 12" fill="currentColor">
                  <path d="M15.666 1.877A2.013 2.013 0 0 0 14.254.452C13.013.116 8 .116 8 .116s-5.013 0-6.254.336A2.013 2.013 0 0 0 .334 1.877C0 3.13 0 5.75 0 5.75s0 2.62.334 3.873A2.013 2.013 0 0 0 1.746 11.048C2.987 11.384 8 11.384 8 11.384s5.013 0 6.254-.336a2.013 2.013 0 0 0 1.412-1.425C16 8.37 16 5.75 16 5.75s0-2.62-.334-3.873ZM6.386 8.25V3.25L10.545 5.75 6.386 8.25Z"/>
                </svg>
              </div>
              <div className="yt-info">
                <div className="yt-display-name">{youtube.channel_name ?? youtube.handle}</div>
                <div className="yt-handle">@{youtube.handle}</div>
              </div>
            </div>

            <div className="yt-stats">
              {youtube.subscribers !== null && (
                <div className="yt-stat">
                  <span className="yt-stat-value">{formatCount(youtube.subscribers)}</span>
                  <span className="yt-stat-label">Subscribers</span>
                </div>
              )}
              {youtube.avg_views !== null && (
                <div className="yt-stat">
                  <span className="yt-stat-value">{formatCount(youtube.avg_views)}</span>
                  <span className="yt-stat-label">Avg Views</span>
                </div>
              )}
            </div>

            {youtube.top_categories.length > 0 && (
              <div className="yt-categories">
                {youtube.top_categories.map((cat) => (
                  <span key={cat} className="yt-category-tag">{cat}</span>
                ))}
              </div>
            )}

            <p className="yt-approx-note">Subscriber count may be approximate for large channels.</p>

            <div className="yt-actions">
              <button type="button" className="yt-btn yt-btn--unlink" onClick={handleUnlink} disabled={isUnlinking}>
                {isUnlinking ? <span className="nx-spinner-sm" /> : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                Unlink
              </button>
              {youtube.synced_at && (
                <span className="yt-synced">Synced {new Date(youtube.synced_at).toLocaleDateString()}</span>
              )}
            </div>
          </>
        ) : (
          <div className="yt-empty">
            <svg width="32" height="24" viewBox="0 0 16 12" fill="rgba(255,68,68,0.2)">
              <path d="M15.666 1.877A2.013 2.013 0 0 0 14.254.452C13.013.116 8 .116 8 .116s-5.013 0-6.254.336A2.013 2.013 0 0 0 .334 1.877C0 3.13 0 5.75 0 5.75s0 2.62.334 3.873A2.013 2.013 0 0 0 1.746 11.048C2.987 11.384 8 11.384 8 11.384s5.013 0 6.254-.336a2.013 2.013 0 0 0 1.412-1.425C16 8.37 16 5.75 16 5.75s0-2.62-.334-3.873ZM6.386 8.25V3.25L10.545 5.75 6.386 8.25Z"/>
            </svg>
            <div className="yt-empty-title">Connect YouTube</div>
            <p className="yt-empty-sub">
              Authorize NX8UP with Google to verify your channel and unlock watch time analytics.
            </p>
            <a href="/api/auth/youtube" className="yt-btn yt-btn--connect">
              <svg width="14" height="10" viewBox="0 0 16 12" fill="currentColor">
                <path d="M15.666 1.877A2.013 2.013 0 0 0 14.254.452C13.013.116 8 .116 8 .116s-5.013 0-6.254.336A2.013 2.013 0 0 0 .334 1.877C0 3.13 0 5.75 0 5.75s0 2.62.334 3.873A2.013 2.013 0 0 0 1.746 11.048C2.987 11.384 8 11.384 8 11.384s5.013 0 6.254-.336a2.013 2.013 0 0 0 1.412-1.425C16 8.37 16 5.75 16 5.75s0-2.62-.334-3.873ZM6.386 8.25V3.25L10.545 5.75 6.386 8.25Z"/>
              </svg>
              Connect with YouTube
            </a>
          </div>
        )}

        {error && (
          <div className="yt-error">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5.5" stroke="#ff6b8a"/>
              <path d="M6 3.5v3M6 8v.5" stroke="#ff6b8a" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}
      </div>
    </>
  )
}