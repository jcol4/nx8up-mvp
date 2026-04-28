/**
 * @file sponsor/steam-lookup/page.tsx
 *
 * Steam profile lookup tool for sponsors and admins. Allows searching any
 * public Steam profile by SteamID64, vanity URL, full profile URL, or bare
 * vanity name and displays the user's full game library sorted by total
 * playtime, plus their recently-played games.
 *
 * The same page is re-exported under /admin/steam-lookup so admins can use
 * the tool from their own navigation.
 *
 * No data is persisted. Each search is a live API call.
 */
'use client'

import * as React from 'react'

interface SteamPlayerSummary {
  steamId: string
  personaName: string
  profileUrl: string
  avatarUrl: string
  communityVisibilityState: number
  profileState: number
}

interface SteamGame {
  appId: number
  name: string
  playtimeMinutes: number
  playtime2WeeksMinutes: number
  iconUrl: string | null
}

interface LookupResult {
  profile: SteamPlayerSummary
  allGames: SteamGame[]
  recentGames: SteamGame[]
}

function minutesToHoursLabel(minutes: number): string {
  if (minutes <= 0) return '0h'
  const hours = Math.round((minutes / 60) * 10) / 10
  return `${hours}h`
}

export default function SteamLookupPage() {
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [result, setResult] = React.useState<LookupResult | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(
        `/api/steam/lookup?q=${encodeURIComponent(input.trim())}`,
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Lookup failed.')
        return
      }
      setResult(data as LookupResult)
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isPrivate = result && result.profile.communityVisibilityState !== 3
  const hasNoGames = result && !isPrivate && result.allGames.length === 0

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8f4ff', margin: 0 }}>
          Steam Profile Lookup
        </h1>
        <p style={{ color: '#8aa4bf', marginTop: 6, fontSize: 14 }}>
          Search any public Steam profile to see games and playtime. Paste a
          full URL, vanity name, or 17-digit SteamID.
        </p>
      </header>

      <form
        onSubmit={handleSearch}
        style={{ display: 'flex', gap: 8, marginBottom: 16 }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Steam URL, Username, or ID"
          autoFocus
          spellCheck={false}
          autoCapitalize="none"
          style={{
            flex: 1,
            padding: '10px 14px',
            background: '#0d1d30',
            border: '1px solid rgba(0,200,255,0.2)',
            borderRadius: 6,
            color: '#e8f4ff',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 20px',
            background: '#00c8ff',
            color: '#000',
            fontWeight: 600,
            border: 'none',
            borderRadius: 6,
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            fontSize: 14,
          }}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(255,107,138,0.1)',
            border: '1px solid rgba(255,107,138,0.3)',
            borderRadius: 6,
            color: '#ff6b8a',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <>
          {/* Profile header */}
          <section
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              padding: 16,
              background: '#0d1d30',
              border: '1px solid rgba(0,200,255,0.15)',
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            {result.profile.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.profile.avatarUrl}
                alt={result.profile.personaName}
                width={64}
                height={64}
                style={{ borderRadius: 6 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: '#e8f4ff' }}>
                {result.profile.personaName}
              </h2>
              <p style={{ margin: '4px 0 0', color: '#8aa4bf', fontSize: 13 }}>
                SteamID: <code style={{ fontFamily: 'monospace' }}>{result.profile.steamId}</code>
              </p>
              <a
                href={result.profile.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00c8ff', fontSize: 13, textDecoration: 'none' }}
              >
                View on Steam ↗
              </a>
            </div>
          </section>

          {isPrivate && (
            <div
              style={{
                padding: 16,
                background: 'rgba(255,200,0,0.06)',
                border: '1px solid rgba(255,200,0,0.25)',
                borderRadius: 8,
                color: '#ffcb66',
                fontSize: 14,
              }}
            >
              This profile's game details are <strong>private</strong>. Steam does
              not return library data for private profiles. The user would need
              to set their game details to public on Steam to be visible here.
            </div>
          )}

          {hasNoGames && (
            <div
              style={{
                padding: 16,
                background: 'rgba(138,164,191,0.06)',
                border: '1px solid rgba(138,164,191,0.2)',
                borderRadius: 8,
                color: '#8aa4bf',
                fontSize: 14,
              }}
            >
              This profile is public but has no games in their library.
            </div>
          )}

          {!isPrivate && !hasNoGames && (
            <>
              {/* Recent games */}
              {result.recentGames.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <h3 style={{ color: '#e8f4ff', fontSize: 16, margin: '0 0 12px' }}>
                    Recently Played (last 2 weeks)
                  </h3>
                  <GameGrid games={result.recentGames} showRecent />
                </section>
              )}

              {/* All games sorted by total hours */}
              <section>
                <h3 style={{ color: '#e8f4ff', fontSize: 16, margin: '0 0 12px' }}>
                  All Games — sorted by total hours ({result.allGames.length})
                </h3>
                <GameGrid games={result.allGames} />
              </section>
            </>
          )}
        </>
      )}
    </main>
  )
}

function GameGrid({ games, showRecent }: { games: SteamGame[]; showRecent?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 8,
      }}
    >
      {games.map((g) => (
        <div
          key={g.appId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            background: '#0d1d30',
            border: '1px solid rgba(0,200,255,0.1)',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {g.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={g.iconUrl}
              alt=""
              width={32}
              height={32}
              style={{ borderRadius: 4, flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                background: '#1a2c44',
                borderRadius: 4,
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: '#e8f4ff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={g.name}
            >
              {g.name}
            </div>
            <div style={{ color: '#8aa4bf', fontSize: 11, marginTop: 2 }}>
              {showRecent
                ? `${minutesToHoursLabel(g.playtime2WeeksMinutes)} recent · ${minutesToHoursLabel(g.playtimeMinutes)} total`
                : minutesToHoursLabel(g.playtimeMinutes)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}