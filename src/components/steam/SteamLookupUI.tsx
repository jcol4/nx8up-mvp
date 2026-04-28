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
  return `${Math.round((minutes / 60) * 10) / 10}h`
}

function GameCard({ game, showRecent }: { game: SteamGame; showRecent?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3 transition-colors hover:border-[#99f7ff]/25 hover:bg-black/30">
      {game.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.iconUrl}
          alt=""
          width={32}
          height={32}
          className="shrink-0 rounded"
        />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded bg-white/5" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[#e8f4ff]" title={game.name}>
          {game.name}
        </p>
        <p className="mt-0.5 text-[11px] text-[#a9abb5]">
          {showRecent
            ? `${minutesToHoursLabel(game.playtime2WeeksMinutes)} recent · ${minutesToHoursLabel(game.playtimeMinutes)} total`
            : minutesToHoursLabel(game.playtimeMinutes)}
        </p>
      </div>
    </div>
  )
}

function GameGrid({ games, showRecent }: { games: SteamGame[]; showRecent?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((g) => (
        <GameCard key={g.appId} game={g} showRecent={showRecent} />
      ))}
    </div>
  )
}

export default function SteamLookupUI() {
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
      const res = await fetch(`/api/steam/lookup?q=${encodeURIComponent(input.trim())}`)
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
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">

        {/* Page header */}
        <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Tools</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Steam Profile Lookup</h1>
          <p className="mt-1 text-sm text-[#a9abb5]">
            Search any public Steam profile by SteamID, vanity name, or full profile URL.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-5 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Steam URL, username, or 17-digit SteamID"
            autoFocus
            spellCheck={false}
            autoCapitalize="none"
            className="flex-1 rounded-lg border border-white/12 bg-black/30 px-4 py-2.5 text-sm text-[#e8f4ff] placeholder-[#4a6080] outline-none transition-colors focus:border-[#99f7ff]/40 focus:ring-1 focus:ring-[#99f7ff]/20"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 rounded-lg bg-[#00c8ff] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">

            {/* Profile card */}
            <div className="flex items-center gap-4 rounded-xl border border-white/12 bg-black/20 p-4">
              {result.profile.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.profile.avatarUrl}
                  alt={result.profile.personaName}
                  width={64}
                  height={64}
                  className="shrink-0 rounded-lg border border-white/10"
                />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-headline text-lg font-semibold text-[#e8f4ff]">
                  {result.profile.personaName}
                </h2>
                <p className="mt-0.5 text-xs text-[#a9abb5]">
                  SteamID:{' '}
                  <code className="font-mono text-[#c8dff0]">{result.profile.steamId}</code>
                </p>
                <a
                  href={result.profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-[#99f7ff] transition-colors hover:text-[#c9fbff]"
                >
                  View on Steam ↗
                </a>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  result.profile.communityVisibilityState === 3
                    ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#4ade80]'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                }`}
              >
                {result.profile.communityVisibilityState === 3 ? 'Public' : 'Private'}
              </span>
            </div>

            {/* Private warning */}
            {isPrivate && (
              <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
                This profile's game details are <strong>private</strong>. Steam does not return
                library data for private profiles. The user must set their game details to public.
              </div>
            )}

            {/* No games */}
            {hasNoGames && (
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#a9abb5]">
                This profile is public but has no games in their library.
              </div>
            )}

            {!isPrivate && !hasNoGames && (
              <>
                {/* Recently played */}
                {result.recentGames.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="font-headline text-sm font-semibold uppercase tracking-[0.12em] text-[#99f7ff]">
                        Recently Played
                      </h3>
                      <span className="rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-[11px] text-[#99f7ff]">
                        last 2 weeks
                      </span>
                    </div>
                    <GameGrid games={result.recentGames} showRecent />
                  </section>
                )}

                {/* Full library */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="font-headline text-sm font-semibold uppercase tracking-[0.12em] text-[#e8f4ff]">
                      All Games
                    </h3>
                    <span className="rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[11px] text-[#a9abb5]">
                      {result.allGames.length} · sorted by total hours
                    </span>
                  </div>
                  <GameGrid games={result.allGames} />
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
