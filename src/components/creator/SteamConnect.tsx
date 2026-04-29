// /**
//  * SteamConnect — Steam account link/unlink card for the creator profile wizard.
//  *
//  * Unlike Twitch/YouTube, Steam does not use OAuth. The creator enters their
//  * Steam vanity URL, profile URL, or SteamID64 directly. We look up the public
//  * profile via the existing /api/steam/lookup endpoint and store the result.
//  *
//  * Unlink clears the steam_* fields via a server action.
//  */
// 'use client'

// import * as React from 'react'
// import { linkSteamAccount, unlinkSteamAccount } from '@/app/creator/profile/_actions'

// interface SteamData {
//   steam_id: string | null
//   steam_username: string | null
//   steam_profile_url: string | null
//   steam_avatar_url: string | null
//   steam_profile_visibility: number | null
//   steam_synced_at: Date | null
// }

// interface SteamConnectProps {
//   initial: SteamData
// }

// const EMPTY: SteamData = {
//   steam_id: null,
//   steam_username: null,
//   steam_profile_url: null,
//   steam_avatar_url: null,
//   steam_profile_visibility: null,
//   steam_synced_at: null,
// }

// export default function SteamConnect({ initial }: SteamConnectProps) {
//   const [steam, setSteam] = React.useState<SteamData>(initial)
//   const [input, setInput] = React.useState('')
//   const [isLinking, setIsLinking] = React.useState(false)
//   const [isUnlinking, setIsUnlinking] = React.useState(false)
//   const [error, setError] = React.useState('')

//   const isLinked = !!steam.steam_id
//   const isPublic = steam.steam_profile_visibility === 3

//   const handleLink = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!input.trim()) return
//     setIsLinking(true)
//     setError('')

//     try {
//       // 1. Resolve the profile via the existing lookup API
//       const res = await fetch(`/api/steam/lookup?q=${encodeURIComponent(input.trim())}`)
//       const data = await res.json()
//       if (!res.ok) {
//         setError(data?.error || 'Could not find that Steam profile.')
//         return
//       }

//       // 2. Persist to DB via server action
//       const result = await linkSteamAccount({
//         steam_id: data.profile.steamId,
//         steam_username: data.profile.personaName,
//         steam_profile_url: data.profile.profileUrl,
//         steam_avatar_url: data.profile.avatarUrl,
//         steam_profile_visibility: data.profile.communityVisibilityState,
//       })

//       if (result.error) {
//         setError(result.error)
//         return
//       }

//       setSteam({
//         steam_id: data.profile.steamId,
//         steam_username: data.profile.personaName,
//         steam_profile_url: data.profile.profileUrl,
//         steam_avatar_url: data.profile.avatarUrl,
//         steam_profile_visibility: data.profile.communityVisibilityState,
//         steam_synced_at: new Date(),
//       })
//       setInput('')
//     } catch {
//       setError('Could not reach the server. Please try again.')
//     } finally {
//       setIsLinking(false)
//     }
//   }

//   const handleUnlink = async () => {
//     if (!confirm('Unlink your Steam account from NX8UP?')) return
//     setIsUnlinking(true)
//     setError('')
//     const res = await unlinkSteamAccount()
//     if (res.error) {
//       setError(res.error)
//     } else {
//       setSteam(EMPTY)
//     }
//     setIsUnlinking(false)
//   }

//   return (
//     <>
//       <style>{`
//         .steam-card {
//           background:
//             radial-gradient(120% 160% at 10% 0%, rgba(23,107,191,0.18) 0%, rgba(23,107,191,0.05) 35%, rgba(6,13,24,0.78) 72%),
//             rgba(6,13,24,0.72);
//           border: 1px solid rgba(23,107,191,0.28);
//           border-top: 2px solid rgba(99,173,255,0.9);
//           border-radius: 12px;
//           padding: 1.25rem;
//           transition: border-color 0.2s, box-shadow 0.2s;
//           box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 48px rgba(10,50,100,0.18);
//         }
//         .steam-card:hover { border-color: rgba(70,140,255,0.45); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 24px 60px rgba(10,50,100,0.26); }
//         .steam-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
//         .steam-card-title { display: flex; align-items: center; gap: 8px; font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #7ab8ff; }
//         .steam-icon { color: #4e9fde; }
//         .steam-profile { display: flex; align-items: center; gap: 12px; }
//         .steam-avatar { width: 48px; height: 48px; border-radius: 8px; border: 2px solid rgba(23,107,191,0.35); object-fit: cover; flex-shrink: 0; }
//         .steam-avatar-placeholder { width: 48px; height: 48px; border-radius: 8px; border: 2px solid rgba(23,107,191,0.3); background: rgba(23,107,191,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #4e9fde; }
//         .steam-info { flex: 1; min-width: 0; }
//         .steam-display-name { font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700; color: #c8dff0; letter-spacing: 0.03em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//         .steam-id { font-family: 'Exo 2', sans-serif; font-size: 0.75rem; color: #6a8aaa; }
//         .steam-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-family: 'Rajdhani', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid; margin-top: 4px; }
//         .steam-actions { display: flex; gap: 8px; margin-top: 0.875rem; align-items: flex-end; }
//         .steam-btn { padding: 0.45rem 0.875rem; border-radius: 6px; font-family: 'Rajdhani', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 5px; border: 1px solid; text-decoration: none; }
//         .steam-btn--unlink { background: rgba(255,107,138,0.05); border-color: rgba(255,107,138,0.15); color: #ff6b8a; }
//         .steam-btn--unlink:hover { background: rgba(255,107,138,0.1); border-color: rgba(255,107,138,0.3); }
//         .steam-btn--unlink:disabled { opacity: 0.5; cursor: not-allowed; }
//         .steam-btn--view { background: rgba(23,107,191,0.08); border-color: rgba(23,107,191,0.2); color: #7ab8ff; }
//         .steam-btn--view:hover { background: rgba(23,107,191,0.14); border-color: rgba(23,107,191,0.35); }
//         .steam-synced { font-family: 'Exo 2', sans-serif; font-size: 0.7rem; color: #6a8aaa; margin-left: auto; align-self: flex-end; }
//         .steam-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0.5rem 0 0.75rem; gap: 0.5rem; }
//         .steam-empty-title { font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; font-weight: 600; color: #c8dff0; letter-spacing: 0.03em; }
//         .steam-empty-sub { font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #6a8aaa; line-height: 1.5; max-width: 280px; }
//         .steam-input-row { display: flex; gap: 8px; margin-top: 0.75rem; width: 100%; max-width: 420px; }
//         .steam-input { flex: 1; background: rgba(6,20,40,0.7); border: 1px solid rgba(23,107,191,0.2); border-radius: 6px; padding: 0.45rem 0.75rem; font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #c8dff0; outline: none; transition: border-color 0.15s; }
//         .steam-input::placeholder { color: #3a5570; }
//         .steam-input:focus { border-color: rgba(23,107,191,0.5); }
//         .steam-btn--connect { background: rgba(23,107,191,0.1); border-color: rgba(23,107,191,0.28); color: #7ab8ff; flex-shrink: 0; }
//         .steam-btn--connect:hover:not(:disabled) { background: rgba(23,107,191,0.18); border-color: rgba(23,107,191,0.45); box-shadow: 0 0 16px rgba(23,107,191,0.15); }
//         .steam-btn--connect:disabled { opacity: 0.5; cursor: not-allowed; }
//         .steam-error { display: flex; align-items: center; gap: 6px; font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #ff6b8a; margin-top: 0.5rem; }
//         .nx-spinner-sm { width: 12px; height: 12px; border: 2px solid rgba(23,107,191,0.2); border-top-color: #4e9fde; border-radius: 50%; animation: spin 0.7s linear infinite; }
//         @keyframes spin { to { transform: rotate(360deg); } }
//       `}</style>

//       <div className="steam-card">
//         <div className="steam-card-header">
//           <div className="steam-card-title">
//             {/* Steam logo mark */}
//             <svg className="steam-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
//               <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.662 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
//             </svg>
//             Steam
//           </div>
//         </div>

//         {isLinked ? (
//           <>
//             <div className="steam-profile">
//               {steam.steam_avatar_url ? (
//                 // eslint-disable-next-line @next/next/no-img-element
//                 <img src={steam.steam_avatar_url} alt={steam.steam_username ?? 'Steam'} className="steam-avatar" />
//               ) : (
//                 <div className="steam-avatar-placeholder">
//                   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z"/>
//                   </svg>
//                 </div>
//               )}
//               <div className="steam-info">
//                 <div className="steam-display-name">{steam.steam_username}</div>
//                 <div className="steam-id">{steam.steam_id}</div>
//                 <div
//                   className="steam-badge"
//                   style={
//                     isPublic
//                       ? { color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)' }
//                       : { color: '#facc15', borderColor: 'rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.08)' }
//                   }
//                 >
//                   <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"/></svg>
//                   {isPublic ? 'Public' : 'Private'}
//                 </div>
//               </div>
//             </div>

//             <div className="steam-actions">
//               <button
//                 type="button"
//                 className="steam-btn steam-btn--unlink"
//                 onClick={handleUnlink}
//                 disabled={isUnlinking}
//               >
//                 {isUnlinking ? <span className="nx-spinner-sm" /> : (
//                   <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
//                     <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
//                   </svg>
//                 )}
//                 Unlink
//               </button>
//               {steam.steam_profile_url && (
//                 <a
//                   href={steam.steam_profile_url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="steam-btn steam-btn--view"
//                 >
//                   View on Steam
//                   <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
//                     <path d="M1 8L8 1M8 1H3M8 1V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
//                   </svg>
//                 </a>
//               )}
//               {steam.steam_synced_at && (
//                 <span className="steam-synced">Synced {new Date(steam.steam_synced_at).toLocaleDateString()}</span>
//               )}
//             </div>
//           </>
//         ) : (
//           <div className="steam-empty">
//             <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(23,107,191,0.25)">
//               <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z"/>
//             </svg>
//             <div className="steam-empty-title">Connect Steam</div>
//             <p className="steam-empty-sub">
//               Enter your Steam profile URL, vanity name, or 17-digit SteamID to link your account.
//             </p>
//             <form onSubmit={handleLink} className="steam-input-row">
//               <input
//                 type="text"
//                 className="steam-input"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 placeholder="steamcommunity.com/id/you"
//                 spellCheck={false}
//                 autoCapitalize="none"
//               />
//               <button
//                 type="submit"
//                 className="steam-btn steam-btn--connect"
//                 disabled={isLinking || !input.trim()}
//               >
//                 {isLinking ? <span className="nx-spinner-sm" /> : (
//                   <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z"/>
//                   </svg>
//                 )}
//                 Connect
//               </button>
//             </form>
//           </div>
//         )}

//         {error && (
//           <div className="steam-error">
//             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//               <circle cx="6" cy="6" r="5.5" stroke="#ff6b8a"/>
//               <path d="M6 3.5v3M6 8v.5" stroke="#ff6b8a" strokeWidth="1.2" strokeLinecap="round"/>
//             </svg>
//             {error}
//           </div>
//         )}
//       </div>
//     </>
//   )
// }


/**
 * SteamConnect — Steam account link/unlink card for the creator profile wizard.
 *
 * Uses Steam OpenID 2.0 for authentication — the creator is redirected to
 * Steam's login page and back, proving they own the account.
 *
 * Reads ?steam_linked=1 / ?steam_error=... from URL params on mount (set by
 * the callback route) and clears them to prevent persistence on refresh.
 */
'use client'

import * as React from 'react'
import { unlinkSteamAccount } from '@/app/creator/profile/_actions'
import { useRouter, useSearchParams } from 'next/navigation'

interface SteamData {
  steam_id: string | null
  steam_username: string | null
  steam_profile_url: string | null
  steam_avatar_url: string | null
  steam_profile_visibility: number | null
  steam_synced_at: Date | null
}

interface SteamConnectProps {
  initial: SteamData
}

const EMPTY: SteamData = {
  steam_id: null,
  steam_username: null,
  steam_profile_url: null,
  steam_avatar_url: null,
  steam_profile_visibility: null,
  steam_synced_at: null,
}

export default function SteamConnect({ initial }: SteamConnectProps) {
  const [steam, setSteam] = React.useState<SteamData>(initial)
  const [isUnlinking, setIsUnlinking] = React.useState(false)
  const [error, setError] = React.useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

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
    } else {
      setSteam(EMPTY)
    }
    setIsUnlinking(false)
  }

  const isLinked = !!steam.steam_id
  const isPublic = steam.steam_profile_visibility === 3

  return (
    <>
      <style>{`
        .steam-card {
          background:
            radial-gradient(120% 160% at 10% 0%, rgba(23,107,191,0.18) 0%, rgba(23,107,191,0.05) 35%, rgba(6,13,24,0.78) 72%),
            rgba(6,13,24,0.72);
          border: 1px solid rgba(23,107,191,0.28);
          border-top: 2px solid rgba(99,173,255,0.9);
          border-radius: 12px;
          padding: 1.25rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 48px rgba(10,50,100,0.18);
        }
        .steam-card:hover { border-color: rgba(70,140,255,0.45); }
        .steam-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .steam-card-title { display: flex; align-items: center; gap: 8px; font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #7ab8ff; }
        .steam-icon { color: #4e9fde; }
        .steam-profile { display: flex; align-items: center; gap: 12px; }
        .steam-avatar { width: 48px; height: 48px; border-radius: 8px; border: 2px solid rgba(23,107,191,0.35); object-fit: cover; flex-shrink: 0; }
        .steam-avatar-placeholder { width: 48px; height: 48px; border-radius: 8px; border: 2px solid rgba(23,107,191,0.3); background: rgba(23,107,191,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #4e9fde; }
        .steam-info { flex: 1; min-width: 0; }
        .steam-display-name { font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700; color: #c8dff0; letter-spacing: 0.03em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .steam-id { font-family: 'Exo 2', sans-serif; font-size: 0.75rem; color: #6a8aaa; }
        .steam-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-family: 'Rajdhani', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid; margin-top: 4px; }
        .steam-actions { display: flex; gap: 8px; margin-top: 0.875rem; align-items: flex-end; }
        .steam-btn { padding: 0.45rem 0.875rem; border-radius: 6px; font-family: 'Rajdhani', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 5px; border: 1px solid; text-decoration: none; background: none; }
        .steam-btn--unlink { border-color: rgba(255,107,138,0.15); color: #ff6b8a; }
        .steam-btn--unlink:hover { background: rgba(255,107,138,0.1); border-color: rgba(255,107,138,0.3); }
        .steam-btn--unlink:disabled { opacity: 0.5; cursor: not-allowed; }
        .steam-btn--view { border-color: rgba(23,107,191,0.2); color: #7ab8ff; }
        .steam-btn--view:hover { background: rgba(23,107,191,0.14); border-color: rgba(23,107,191,0.35); }
        .steam-synced { font-family: 'Exo 2', sans-serif; font-size: 0.7rem; color: #6a8aaa; margin-left: auto; align-self: flex-end; }
        .steam-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0.5rem 0 0.75rem; gap: 0.5rem; }
        .steam-empty-title { font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; font-weight: 600; color: #c8dff0; letter-spacing: 0.03em; }
        .steam-empty-sub { font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #6a8aaa; line-height: 1.5; max-width: 280px; }
        .steam-btn--connect { border-color: rgba(23,107,191,0.28); color: #7ab8ff; margin-top: 0.25rem; }
        .steam-btn--connect:hover { background: rgba(23,107,191,0.18); border-color: rgba(23,107,191,0.45); box-shadow: 0 0 16px rgba(23,107,191,0.15); }
        .steam-error { display: flex; align-items: center; gap: 6px; font-family: 'Exo 2', sans-serif; font-size: 0.78rem; color: #ff6b8a; margin-top: 0.5rem; }
        .nx-spinner-sm { width: 12px; height: 12px; border: 2px solid rgba(23,107,191,0.2); border-top-color: #4e9fde; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="steam-card">
        <div className="steam-card-header">
          <div className="steam-card-title">
            <svg className="steam-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z"/>
            </svg>
            Steam
          </div>
        </div>

        {isLinked ? (
          <>
            <div className="steam-profile">
              {steam.steam_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={steam.steam_avatar_url} alt={steam.steam_username ?? 'Steam'} className="steam-avatar" />
              ) : (
                <div className="steam-avatar-placeholder">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z"/>
                  </svg>
                </div>
              )}
              <div className="steam-info">
                <div className="steam-display-name">{steam.steam_username}</div>
                <div className="steam-id">{steam.steam_id}</div>
                <div
                  className="steam-badge"
                  style={
                    isPublic
                      ? { color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)' }
                      : { color: '#facc15', borderColor: 'rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.08)' }
                  }
                >
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"/></svg>
                  {isPublic ? 'Public' : 'Private'}
                </div>
              </div>
            </div>

            <div className="steam-actions">
              <button
                type="button"
                className="steam-btn steam-btn--unlink"
                onClick={handleUnlink}
                disabled={isUnlinking}
              >
                {isUnlinking ? <span className="nx-spinner-sm" /> : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                Unlink
              </button>
              {steam.steam_profile_url && (
                <a
                  href={steam.steam_profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="steam-btn steam-btn--view"
                >
                  View on Steam
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1 8L8 1M8 1H3M8 1V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )}
              {steam.steam_synced_at && (
                <span className="steam-synced">Synced {new Date(steam.steam_synced_at).toLocaleDateString()}</span>
              )}
            </div>
          </>
        ) : (
          <div className="steam-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(23,107,191,0.25)">
              <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z"/>
            </svg>
            <div className="steam-empty-title">Connect Steam</div>
            <p className="steam-empty-sub">
              Authorize NX8UP with Steam to verify your account and sync your game library.
            </p>
            <a href="/api/auth/steam" className="steam-btn steam-btn--connect">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z"/>
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