/**
 * SteamConnect — Steam account link/unlink card for the creator profile page.
 *
 * Matches the visual pattern of TwitchConnect / YoutubeConnect. Reads the
 * OpenID result from URL search params (?steam_linked=1 / ?steam_error=...)
 * on mount and clears them with router.replace.
 */
'use client'

import * as React from 'react'
import Image from 'next/image'
import { unlinkSteamAccount } from '@/app/creator/profile/_actions'
import { useRouter, useSearchParams } from 'next/navigation'

interface SteamData {
  steam_id: string | null
  username: string | null
  profile_url: string | null
  avatar_url: string | null
  visibility: number | null
  synced_at: Date | null
}

interface SteamConnectProps {
  initial: SteamData
}

const VISIBILITY_LABELS: Record<number, { label: string; color: string }> = {
  3: { label: 'Public', color: '#22c55e' },
  2: { label: 'Friends only', color: '#ffcb66' },
  1: { label: 'Private', color: '#ff6b8a' },
}

export default function SteamConnect({ initial }: SteamConnectProps) {
  const [steam, setSteam] = React.useState<SteamData>(initial)
  const [isUnlinking, setIsUnlinking] = React.useState(false)
  const [error, setError] = React.useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle redirect params from OpenID callback
  React.useEffect(() => {
    if (searchParams.get('steam_linked') === '1') {
      router.replace('/creator/profile')
      router.refresh()
    }
    const steamError = searchParams.get('steam_error')
    if (steamError) {
      setError(decodeURIComponent(steamError))
      router.replace('/creator/profile')
    }
  }, [searchParams, router])

  const handleUnlink = async () => {
    if (!confirm('Unlink your Steam account from NX8UP?')) return
    setIsUnlinking(true)
    setError('')
    const res = await unlinkSteamAccount()
    if (res.error) {
      setError(res.error)
      setIsUnlinking(false)
    } else {
      setSteam({
        steam_id: null,
        username: null,
        profile_url: null,
        avatar_url: null,
        visibility: null,
        synced_at: null,
      })
      setIsUnlinking(false)
    }
  }

  const visibilityInfo = steam.visibility != null ? VISIBILITY_LABELS[steam.visibility] : null

  return (
    <>
      <style>{`
        .steam-card { background: rgba(6,13,24,0.6); border: 1px solid rgba(0,200,255,0.1); border-radius: 10px; padding: 1.25rem; transition: border-color 0.2s; }
        .steam-card:hover { border-color: rgba(0,200,255,0.18); }
        .steam-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .steam-card-title { display: flex; align-items: center; gap: 8px; font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #3a5570; }
        .steam-icon { color: #66c0f4; }
        .steam-profile { display: flex; align-items: center; gap: 12px; }
        .steam-avatar { width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(102,192,244,0.3); object-fit: cover; flex-shrink: 0; }
        .steam-avatar-placeholder { width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(102,192,244,0.3); background: rgba(102,192,244,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #66c0f4; }
        .steam-info { flex: 1; min-width: 0; }
        .steam-display-name { font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700; color: #c8dff0; letter-spacing: 0.03em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .steam-id { font-family: 'Exo 2', sans-serif; font-size: 0.7rem; color: #3a5570; font-family: monospace; }
        .steam-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-family: 'Rajdhani', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid; margin-top: 4px; }
        .steam-actions { display: flex; gap: 8px; margin-top: 0.875rem; }
        .steam-btn { padding: 0.45rem 0.875rem; border-radius: 6px; font-family: 'Rajdhani', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
        .steam-btn--unlink { background: rgba(255,107,138,0.05); border: 1px solid rgba(255,107,138,0.15); color: #ff6b8a; }
        .steam-btn--unlink:hover { background: rgba(255,107,138,0.1); border-color: rgba(255,107,138,0.3); }
        .steam-btn--unlink:disabled { opacity: 0.5; cursor: not-allowed; }
        .steam-synced { font-family: 'Exo 2', sans-serif; font-size: 0.7rem; color: #2a3f55; margin-left: auto; align-self: flex-end; }
        .steam-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0.75rem 0; gap: 0.5rem; }
        .steam-empty-title { font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; font-weight: 600; color: #c8dff0; letter-spacing: 0.03em; }
        .steam-empty-sub { font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #3a5570; line-height: 1.5; max-width: 280px; }
        .steam-btn--connect { background: rgba(102,192,244,0.1); border: 1px solid rgba(102,192,244,0.25); color: #66c0f4; margin-top: 0.25rem; text-decoration: none; }
        .steam-btn--connect:hover { background: rgba(102,192,244,0.18); border-color: rgba(102,192,244,0.4); box-shadow: 0 0 16px rgba(102,192,244,0.15); }
        .steam-error { display: flex; align-items: center; gap: 6px; font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #ff6b8a; margin-top: 0.5rem; }
        .nx-spinner-sm { width: 12px; height: 12px; border: 2px solid rgba(102,192,244,0.2); border-top-color: #66c0f4; border-radius: 50%; animation: spin 0.7s linear infinite; }
      `}</style>

      <div className="steam-card">
        <div className="steam-card-header">
          <div className="steam-card-title">
            <svg className="steam-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.083 3.166 9.426 7.626 11.166l-.082-.041 3.547-1.452a3.375 3.375 0 1 0 4.064-4.86l3.6-2.594.139.001a4.5 4.5 0 1 0-4.5-4.5v.054l-2.586 3.745a3.376 3.376 0 0 0-2.748.92L0 12c.001 6.627 5.373 12 12 12s12-5.373 12-12S18.627 0 12 0zm-2.18 17.85l-1.13.464a2.531 2.531 0 1 0 1.466-3.34l1.166-.484c1.288.504 1.913 1.967 1.387 3.275-.523 1.288-1.967 1.913-3.275 1.387l.386-.302zm9.105-7.34a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
            </svg>
            Steam
          </div>
        </div>

        {steam.steam_id ? (
          <>
            <div className="steam-profile">
              {steam.avatar_url ? (
                <Image src={steam.avatar_url} alt={steam.username ?? 'Steam'} width={48} height={48} className="steam-avatar" unoptimized />
              ) : (
                <div className="steam-avatar-placeholder">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.083 3.166 9.426 7.626 11.166l-.082-.041 3.547-1.452a3.375 3.375 0 1 0 4.064-4.86l3.6-2.594.139.001a4.5 4.5 0 1 0-4.5-4.5v.054l-2.586 3.745a3.376 3.376 0 0 0-2.748.92L0 12c.001 6.627 5.373 12 12 12s12-5.373 12-12S18.627 0 12 0z"/>
                  </svg>
                </div>
              )}
              <div className="steam-info">
                <div className="steam-display-name">{steam.username ?? 'Steam User'}</div>
                <div className="steam-id">{steam.steam_id}</div>
                {visibilityInfo && (
                  <div
                    className="steam-badge"
                    style={{ color: visibilityInfo.color, borderColor: `${visibilityInfo.color}40`, background: `${visibilityInfo.color}12` }}
                  >
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"/></svg>
                    {visibilityInfo.label}
                  </div>
                )}
              </div>
            </div>

            <div className="steam-actions">
              <button type="button" className="steam-btn steam-btn--unlink" onClick={handleUnlink} disabled={isUnlinking}>
                {isUnlinking ? <span className="nx-spinner-sm" /> : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                Unlink
              </button>
              {steam.profile_url && (
                <a href={steam.profile_url} target="_blank" rel="noopener noreferrer" className="steam-btn steam-btn--connect" style={{ marginTop: 0 }}>
                  View on Steam ↗
                </a>
              )}
              {steam.synced_at && (
                <span className="steam-synced">Synced {new Date(steam.synced_at).toLocaleDateString()}</span>
              )}
            </div>
          </>
        ) : (
          <div className="steam-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(102,192,244,0.25)">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.083 3.166 9.426 7.626 11.166l-.082-.041 3.547-1.452a3.375 3.375 0 1 0 4.064-4.86l3.6-2.594.139.001a4.5 4.5 0 1 0-4.5-4.5v.054l-2.586 3.745a3.376 3.376 0 0 0-2.748.92L0 12c.001 6.627 5.373 12 12 12s12-5.373 12-12S18.627 0 12 0zm-2.18 17.85l-1.13.464a2.531 2.531 0 1 0 1.466-3.34l1.166-.484c1.288.504 1.913 1.967 1.387 3.275-.523 1.288-1.967 1.913-3.275 1.387l.386-.302zm9.105-7.34a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
            </svg>
            <div className="steam-empty-title">Connect Steam</div>
            <p className="steam-empty-sub">
              Authorize NX8UP with Steam to verify your account and showcase your top games.
            </p>
            <a href="/api/auth/steam" className="steam-btn steam-btn--connect">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.083 3.166 9.426 7.626 11.166l-.082-.041 3.547-1.452a3.375 3.375 0 1 0 4.064-4.86l3.6-2.594.139.001a4.5 4.5 0 1 0-4.5-4.5v.054l-2.586 3.745a3.376 3.376 0 0 0-2.748.92L0 12c.001 6.627 5.373 12 12 12s12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
              Connect with Steam
            </a>
          </div>
        )}

        {error && (
          <div className="steam-error">
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