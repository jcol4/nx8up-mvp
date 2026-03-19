'use client'

import * as React from 'react'
import { unlinkTwitchAccount } from '@/app/creator/profile/_actions'
import { useRouter, useSearchParams } from 'next/navigation'

interface TwitchData {
  username: string | null
  display_name?: string
  broadcaster_type: string | null
  profile_image: string | null
  description: string | null
  synced_at: Date | null
}

interface TwitchConnectProps {
  initial: TwitchData
}

const BROADCASTER_LABELS: Record<string, { label: string; color: string }> = {
  partner: { label: 'Partner', color: '#7b4fff' },
  affiliate: { label: 'Affiliate', color: '#00c8ff' },
  none: { label: 'Streamer', color: '#3a5570' },
  '': { label: 'Streamer', color: '#3a5570' },
}

export default function TwitchConnect({ initial }: TwitchConnectProps) {
  const [twitch, setTwitch] = React.useState<TwitchData>(initial)
  const [isUnlinking, setIsUnlinking] = React.useState(false)
  const [error, setError] = React.useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle redirect params from OAuth callback
  React.useEffect(() => {
    if (searchParams.get('twitch_linked') === '1') {
      router.replace('/creator/profile')
      router.refresh()
    }
    const twitchError = searchParams.get('twitch_error')
    if (twitchError) {
      setError(decodeURIComponent(twitchError))
      router.replace('/creator/profile')
    }
  }, [searchParams, router])

  const handleUnlink = async () => {
    if (!confirm('Unlink your Twitch account from NX8UP?')) return
    setIsUnlinking(true)
    setError('')
    const res = await unlinkTwitchAccount()
    if (res.error) {
      setError(res.error)
      setIsUnlinking(false)
    } else {
      setTwitch({ username: null, broadcaster_type: null, profile_image: null, description: null, synced_at: null })
      setIsUnlinking(false)
    }
  }

  const broadcasterInfo = BROADCASTER_LABELS[twitch.broadcaster_type ?? ''] ?? BROADCASTER_LABELS['']

  return (
    <>
      <style>{`
        .twitch-card { background: rgba(6,13,24,0.6); border: 1px solid rgba(0,200,255,0.1); border-radius: 10px; padding: 1.25rem; transition: border-color 0.2s; }
        .twitch-card:hover { border-color: rgba(0,200,255,0.18); }
        .twitch-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .twitch-card-title { display: flex; align-items: center; gap: 8px; font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #3a5570; }
        .twitch-icon { color: #9146ff; }
        .twitch-profile { display: flex; align-items: center; gap: 12px; }
        .twitch-avatar { width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(145,70,255,0.3); object-fit: cover; flex-shrink: 0; }
        .twitch-avatar-placeholder { width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(145,70,255,0.3); background: rgba(145,70,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #9146ff; }
        .twitch-info { flex: 1; min-width: 0; }
        .twitch-display-name { font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700; color: #c8dff0; letter-spacing: 0.03em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .twitch-username { font-family: 'Exo 2', sans-serif; font-size: 0.75rem; color: #3a5570; }
        .twitch-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-family: 'Rajdhani', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid; margin-top: 4px; }
        .twitch-description { margin-top: 0.75rem; font-family: 'Exo 2', sans-serif; font-size: 0.8rem; color: #3a5570; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .twitch-actions { display: flex; gap: 8px; margin-top: 0.875rem; }
        .twitch-btn { padding: 0.45rem 0.875rem; border-radius: 6px; font-family: 'Rajdhani', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
        .twitch-btn--unlink { background: rgba(255,107,138,0.05); border: 1px solid rgba(255,107,138,0.15); color: #ff6b8a; }
        .twitch-btn--unlink:hover { background: rgba(255,107,138,0.1); border-color: rgba(255,107,138,0.3); }
        .twitch-btn--unlink:disabled { opacity: 0.5; cursor: not-allowed; }
        .twitch-synced { font-family: 'Exo 2', sans-serif; font-size: 0.7rem; color: #2a3f55; margin-left: auto; align-self: flex-end; }
        .twitch-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0.75rem 0; gap: 0.5rem; }
        .twitch-empty-title { font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; font-weight: 600; color: #c8dff0; letter-spacing: 0.03em; }
        .twitch-empty-sub { font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #3a5570; line-height: 1.5; max-width: 260px; }
        .twitch-btn--connect { background: rgba(145,70,255,0.1); border: 1px solid rgba(145,70,255,0.25); color: #9146ff; margin-top: 0.25rem; text-decoration: none; }
        .twitch-btn--connect:hover { background: rgba(145,70,255,0.18); border-color: rgba(145,70,255,0.4); box-shadow: 0 0 16px rgba(145,70,255,0.15); }
        .twitch-error { display: flex; align-items: center; gap: 6px; font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #ff6b8a; margin-top: 0.5rem; }
        .nx-spinner-sm { width: 12px; height: 12px; border: 2px solid rgba(145,70,255,0.2); border-top-color: #9146ff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="twitch-card">
        <div className="twitch-card-header">
          <div className="twitch-card-title">
            <svg className="twitch-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            Twitch
          </div>
        </div>

        {twitch.username ? (
          <>
            <div className="twitch-profile">
              {twitch.profile_image ? (
                <img src={twitch.profile_image} alt={twitch.username} className="twitch-avatar" />
              ) : (
                <div className="twitch-avatar-placeholder">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                  </svg>
                </div>
              )}
              <div className="twitch-info">
                <div className="twitch-display-name">{twitch.display_name ?? twitch.username}</div>
                <div className="twitch-username">@{twitch.username}</div>
                <div
                  className="twitch-badge"
                  style={{ color: broadcasterInfo.color, borderColor: `${broadcasterInfo.color}40`, background: `${broadcasterInfo.color}12` }}
                >
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"/></svg>
                  {broadcasterInfo.label}
                </div>
              </div>
            </div>

            {twitch.description && <p className="twitch-description">{twitch.description}</p>}

            <div className="twitch-actions">
              <button type="button" className="twitch-btn twitch-btn--unlink" onClick={handleUnlink} disabled={isUnlinking}>
                {isUnlinking ? <span className="nx-spinner-sm" /> : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                Unlink
              </button>
              {twitch.synced_at && (
                <span className="twitch-synced">Synced {new Date(twitch.synced_at).toLocaleDateString()}</span>
              )}
            </div>
          </>
        ) : (
          <div className="twitch-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(145,70,255,0.25)">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            <div className="twitch-empty-title">Connect Twitch</div>
            <p className="twitch-empty-sub">
              Authorize NX8UP with Twitch to verify your account and unlock subscriber stats.
            </p>
            <a href="/api/auth/twitch" className="twitch-btn twitch-btn--connect">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              Connect with Twitch
            </a>
          </div>
        )}

        {error && (
          <div className="twitch-error">
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